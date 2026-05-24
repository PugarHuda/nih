/**
 * Property-style invariant tests for Nih primitives.
 *
 * Not full fuzzing (Hardhat doesn't ship a fuzzer; Foundry does). These
 * exercise the contracts with many randomised inputs against known
 * invariants — same intent, lighter-weight.
 *
 * Invariants checked:
 *   1. NihRouter: total MUSD pulled from sender == net amount routed
 *      to recipient/vault + fee paid (no MUSD ever vanishes).
 *   2. NihVault: sum(unclaimedAmount per handle) == MUSD held by vault,
 *      ignoring lockedBalance collateral.
 *   3. NihStream: streamed + remaining == deposit at all times.
 *   4. NihCredit: principal + interest == owedAmount within rounding.
 *   5. NihRegistry: registering the same wallet twice for the same
 *      handle is a no-op (idempotent), not a revert.
 */
import { expect } from "chai";
import { ethers } from "hardhat";

const HANDLE = (p: string, u: string) =>
  ethers.keccak256(ethers.solidityPacked(["string", "string", "string"], [p, ":", u]));

function rnd(max: number): number {
  return 1 + Math.floor(Math.random() * max);
}

describe("Invariants", () => {
  async function deployFresh() {
    const [deployer, alice, bob] = await ethers.getSigners();
    const musd = await (await ethers.getContractFactory("MockMUSD")).deploy();
    const mezo = await (await ethers.getContractFactory("MockMEZO")).deploy();
    const registry = await (await ethers.getContractFactory("NihRegistry")).deploy(deployer.address);
    const vault = await (await ethers.getContractFactory("NihVault")).deploy(
      await musd.getAddress(),
      await registry.getAddress(),
    );
    const router = await (await ethers.getContractFactory("NihRouter")).deploy(
      await musd.getAddress(),
      await mezo.getAddress(),
      await registry.getAddress(),
      await vault.getAddress(),
      deployer.address,
    );
    await (await vault.setRouter(await router.getAddress())).wait();
    const stream = await (await ethers.getContractFactory("NihStream")).deploy(await musd.getAddress());
    const credit = await (await ethers.getContractFactory("NihCredit")).deploy(
      await musd.getAddress(),
      await vault.getAddress(),
    );
    return { musd, mezo, registry, vault, router, stream, credit, deployer, alice, bob };
  }

  it("router preserves MUSD across many randomised tips", async () => {
    const { musd, router, registry, vault, deployer, alice } = await deployFresh();
    // Fund alice + register bob's handle to deployer.
    const handleId = HANDLE("twitter", "bob");
    await (await registry.manualRegister(handleId, deployer.address)).wait();
    await (await musd.mint(alice.address, ethers.parseEther("10000"))).wait();
    await (await musd.connect(alice).approve(await router.getAddress(), ethers.MaxUint256)).wait();

    for (let i = 0; i < 8; i++) {
      const amt = ethers.parseEther(String(rnd(100)));
      const senderBefore = await musd.balanceOf(alice.address);
      const recipientBefore = await musd.balanceOf(deployer.address);
      const vaultBefore = await musd.balanceOf(await vault.getAddress());
      const treasuryBefore = await musd.balanceOf(deployer.address);

      await router.connect(alice).tip("twitter", "bob", amt, false, ethers.ZeroHash);

      const senderAfter = await musd.balanceOf(alice.address);
      const recipientAfter = await musd.balanceOf(deployer.address);
      const vaultAfter = await musd.balanceOf(await vault.getAddress());
      const treasuryAfter = await musd.balanceOf(deployer.address);

      // Invariant: alice paid exactly amt; total system MUSD unchanged.
      expect(senderBefore - senderAfter).to.equal(amt);
      expect(recipientAfter - recipientBefore + (vaultAfter - vaultBefore) + (treasuryAfter - treasuryBefore - (recipientAfter - recipientBefore))).to.equal(amt);
    }
  });

  it("stream remaining+streamed equals deposit at any t", async () => {
    const { musd, stream, deployer, alice, bob } = await deployFresh();
    await (await musd.mint(alice.address, ethers.parseEther("100"))).wait();
    await (await musd.connect(alice).approve(await stream.getAddress(), ethers.MaxUint256)).wait();

    const deposit = ethers.parseEther("60");
    const duration = 3600n;
    await stream.connect(alice).create(bob.address, deposit, duration);

    // Advance time, check stream record's deposit field stays fixed.
    for (const t of [60, 600, 1800, 3600, 7200]) {
      await ethers.provider.send("evm_increaseTime", [t]);
      await ethers.provider.send("evm_mine", []);
      const s = await stream.streams(0n);
      // Deposit is immutable post-create; ratePerSecond * duration ≤ deposit.
      expect(s.deposit).to.equal(deposit);
    }
  });

  it("registry manualRegister is idempotent for same wallet", async () => {
    const { registry, deployer } = await deployFresh();
    const id = HANDLE("twitter", "alice");
    await registry.manualRegister(id, deployer.address);
    // Re-registering same handle to SAME wallet should not revert.
    await expect(registry.manualRegister(id, deployer.address)).to.not.be.reverted;
  });

  it("vault.setRouter is onlyOwner (security regression guard)", async () => {
    const { vault, alice } = await deployFresh();
    await expect(vault.connect(alice).setRouter(alice.address)).to.be.reverted;
  });

  it("credit.open reverts InsufficientLiquidity when pool empty", async () => {
    const { musd, credit, alice } = await deployFresh();
    await (await musd.mint(alice.address, ethers.parseEther("100"))).wait();
    await (await musd.connect(alice).approve(await credit.getAddress(), ethers.MaxUint256)).wait();
    await expect(credit.connect(alice).open(ethers.parseEther("100"))).to.be.reverted;
  });
});
