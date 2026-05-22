import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { MockMUSD, MockMEZO, NihRegistry, NihVault, NihRouter, NihCredit } from "../typechain-types";

describe("Nih", () => {
  let owner: HardhatEthersSigner;
  let alice: HardhatEthersSigner; // tipper
  let bob: HardhatEthersSigner;   // creator (registered)
  let carol: HardhatEthersSigner; // creator (unregistered, claims later)
  let musd: MockMUSD;
  let mezo: MockMEZO;
  let registry: NihRegistry;
  let vault: NihVault;
  let router: NihRouter;
  let credit: NihCredit;

  beforeEach(async () => {
    [owner, alice, bob, carol] = await ethers.getSigners();

    musd = await (await ethers.getContractFactory("MockMUSD")).deploy();
    mezo = await (await ethers.getContractFactory("MockMEZO")).deploy();
    registry = await (await ethers.getContractFactory("NihRegistry")).deploy(owner.address);
    vault = await (await ethers.getContractFactory("NihVault")).deploy(await musd.getAddress(), await registry.getAddress());
    router = await (await ethers.getContractFactory("NihRouter")).deploy(
      await musd.getAddress(),
      await mezo.getAddress(),
      await registry.getAddress(),
      await vault.getAddress(),
      owner.address
    );
    await vault.setRouter(await router.getAddress());
    credit = await (await ethers.getContractFactory("NihCredit")).deploy(await musd.getAddress(), await vault.getAddress());

    // Fund tester wallets
    await musd.mint(alice.address, ethers.parseEther("1000"));
    await musd.mint(bob.address, ethers.parseEther("100"));
    await mezo.mint(alice.address, ethers.parseEther("1000"));

    // Approve router
    await musd.connect(alice).approve(await router.getAddress(), ethers.MaxUint256);
    await mezo.connect(alice).approve(await router.getAddress(), ethers.MaxUint256);
  });

  describe("Registry", () => {
    it("manually registers a high-profile handle", async () => {
      const handleId = await registry.handleId("twitter", "elonmusk");
      await registry.manualRegister(handleId, bob.address);
      const [wallet, tier] = await registry.resolveById(handleId);
      expect(wallet).to.equal(bob.address);
      expect(tier).to.equal(3); // Manual
    });

    it("registers with signature (Tier 1)", async () => {
      const handleId = await registry.handleId("twitter", "bob");
      const tier = 1;
      const deadline = (await ethers.provider.getBlock("latest"))!.timestamp + 3600;
      const chainId = (await ethers.provider.getNetwork()).chainId;

      const digest = ethers.solidityPackedKeccak256(
        ["bytes32", "address", "uint8", "uint256", "uint256"],
        [handleId, bob.address, tier, deadline, chainId]
      );
      const sig = await owner.signMessage(ethers.getBytes(digest));

      await registry.connect(bob).registerWithSignature(handleId, tier, deadline, sig);

      const [wallet, t] = await registry.resolveById(handleId);
      expect(wallet).to.equal(bob.address);
      expect(t).to.equal(1);
    });
  });

  describe("Tipping", () => {
    it("tips a registered handle: instant transfer", async () => {
      const handleId = await registry.handleId("twitter", "bob");
      await registry.manualRegister(handleId, bob.address);

      const before = await musd.balanceOf(bob.address);
      await router.connect(alice).tip("twitter", "bob", ethers.parseEther("10"), false, ethers.ZeroHash);
      const after = await musd.balanceOf(bob.address);

      const expected = ethers.parseEther("10") - (ethers.parseEther("10") * 50n) / 10000n;
      expect(after - before).to.equal(expected);
    });

    it("parks tip in vault for unregistered handle, recipient claims later", async () => {
      await router.connect(alice).tip("twitter", "carol", ethers.parseEther("20"), false, ethers.ZeroHash);

      const handleId = await registry.handleId("twitter", "carol");
      const expectedNet = ethers.parseEther("20") - (ethers.parseEther("20") * 50n) / 10000n;
      expect(await vault.pendingFor(handleId)).to.equal(expectedNet);

      // Carol registers
      await registry.manualRegister(handleId, carol.address);
      await vault.connect(carol).claim(handleId);

      expect(await musd.balanceOf(carol.address)).to.equal(expectedNet);
    });

    it("MEZO fee gives 50% discount", async () => {
      const handleId = await registry.handleId("twitter", "bob");
      await registry.manualRegister(handleId, bob.address);

      const before = await musd.balanceOf(bob.address);
      await router.connect(alice).tip("twitter", "bob", ethers.parseEther("100"), true, ethers.ZeroHash);
      const after = await musd.balanceOf(bob.address);

      // No MUSD fee deducted; bob gets full 100
      expect(after - before).to.equal(ethers.parseEther("100"));
    });

    it("rejects below MIN_TIP", async () => {
      await expect(
        router.connect(alice).tip("twitter", "bob", ethers.parseEther("0.1"), false, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(router, "TipTooSmall");
    });
  });

  describe("Credit line", () => {
    beforeEach(async () => {
      // Bob has 100 MUSD from prior balance + 9.95 from a 10-MUSD tip
      const handleId = await registry.handleId("twitter", "bob");
      await registry.manualRegister(handleId, bob.address);
      await router.connect(alice).tip("twitter", "bob", ethers.parseEther("100"), false, ethers.ZeroHash);

      // Seed credit pool from owner (also has 1M MUSD from mock constructor mint)
      await musd.approve(await credit.getAddress(), ethers.parseEther("10000"));
      await credit.deposit(ethers.parseEther("10000"));

      // Bob approves credit
      await musd.connect(bob).approve(await credit.getAddress(), ethers.MaxUint256);
    });

    it("opens loan at 60% LTV", async () => {
      const collateral = ethers.parseEther("50");
      const beforeBalance = await musd.balanceOf(bob.address);
      await credit.connect(bob).open(collateral);
      const afterBalance = await musd.balanceOf(bob.address);

      // Bob delivered 50 collateral, received 30 (60%)
      const expectedBorrow = (collateral * 6000n) / 10000n;
      expect(afterBalance - beforeBalance).to.equal(expectedBorrow - collateral);
    });

    it("repays and releases collateral", async () => {
      const collateral = ethers.parseEther("50");
      await credit.connect(bob).open(collateral);
      const before = await musd.balanceOf(bob.address);

      // Repay (tiny interest accrues between blocks; allow ≤ 0.01% tolerance)
      await credit.connect(bob).repay();
      const after = await musd.balanceOf(bob.address);

      // Bob paid principal + interest, got collateral back. Net delta should be
      // close to (collateral - principal) minus accrued interest.
      const expectedBorrow = (collateral * 6000n) / 10000n;
      const expected = collateral - expectedBorrow;
      const delta = after - before;
      const drift = expected - delta;
      expect(drift).to.be.gte(0n);
      expect(drift).to.be.lt(expected / 1000n); // < 0.1% drift
    });
  });
});
