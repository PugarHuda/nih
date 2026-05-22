import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { MockMUSD, MockStabilityPool, NihEarn } from "../typechain-types";

describe("NihEarn", () => {
  let owner: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let musd: MockMUSD;
  let pool: MockStabilityPool;
  let earn: NihEarn;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    musd = await (await ethers.getContractFactory("MockMUSD")).deploy();
    pool = await (await ethers.getContractFactory("MockStabilityPool")).deploy(await musd.getAddress());
    earn = await (await ethers.getContractFactory("NihEarn")).deploy(
      await musd.getAddress(),
      await pool.getAddress()
    );

    await musd.mint(alice.address, ethers.parseEther("1000"));
    await musd.mint(bob.address, ethers.parseEther("1000"));
    await musd.connect(alice).approve(await earn.getAddress(), ethers.MaxUint256);
    await musd.connect(bob).approve(await earn.getAddress(), ethers.MaxUint256);
  });

  it("deposits and tracks shares", async () => {
    await earn.connect(alice).deposit(ethers.parseEther("100"));
    expect(await earn.userShares(alice.address)).to.equal(ethers.parseEther("100"));
    expect(await earn.balanceOf(alice.address)).to.equal(ethers.parseEther("100"));
    expect(await earn.totalShares()).to.equal(ethers.parseEther("100"));
  });

  it("withdraws and returns MUSD", async () => {
    await earn.connect(alice).deposit(ethers.parseEther("100"));
    const before = await musd.balanceOf(alice.address);
    await earn.connect(alice).withdraw(ethers.parseEther("100"));
    const after = await musd.balanceOf(alice.address);
    expect(after - before).to.equal(ethers.parseEther("100"));
    expect(await earn.userShares(alice.address)).to.equal(0n);
  });

  it("splits BTC reward proportionally between depositors", async () => {
    // Alice deposits 100 first.
    await earn.connect(alice).deposit(ethers.parseEther("100"));
    // Bob deposits 300 — total pool 400 shares.
    await earn.connect(bob).deposit(ethers.parseEther("300"));

    // 1 BTC liquidation happens, sending BTC directly to NihEarn.
    await owner.sendTransaction({
      to: await earn.getAddress(),
      value: ethers.parseEther("1"),
    });

    // Alice withdraws — should get 1/4 of the BTC (25%).
    const aliceBtcBefore = await ethers.provider.getBalance(alice.address);
    const aliceTx = await earn.connect(alice).withdraw(ethers.parseEther("100"));
    const aliceReceipt = await aliceTx.wait();
    const aliceBtcAfter = await ethers.provider.getBalance(alice.address);
    const aliceGasUsed = aliceReceipt!.gasUsed * aliceReceipt!.gasPrice;
    const aliceBtcGain = aliceBtcAfter - aliceBtcBefore + aliceGasUsed;
    expect(aliceBtcGain).to.be.closeTo(ethers.parseEther("0.25"), ethers.parseEther("0.001"));

    // Bob withdraws — should get 3/4 (75%).
    const bobBtcBefore = await ethers.provider.getBalance(bob.address);
    const bobTx = await earn.connect(bob).withdraw(ethers.parseEther("300"));
    const bobReceipt = await bobTx.wait();
    const bobBtcAfter = await ethers.provider.getBalance(bob.address);
    const bobGasUsed = bobReceipt!.gasUsed * bobReceipt!.gasPrice;
    const bobBtcGain = bobBtcAfter - bobBtcBefore + bobGasUsed;
    expect(bobBtcGain).to.be.closeTo(ethers.parseEther("0.75"), ethers.parseEther("0.001"));
  });

  it("late depositor does NOT collect rewards earned before they joined", async () => {
    // Alice deposits, then receives the entire 1 BTC liquidation.
    await earn.connect(alice).deposit(ethers.parseEther("100"));
    await owner.sendTransaction({
      to: await earn.getAddress(),
      value: ethers.parseEther("1"),
    });

    // Bob deposits AFTER the liquidation has been indexed via harvest.
    await earn.connect(alice).claimReward();
    await earn.connect(bob).deposit(ethers.parseEther("100"));

    // No new BTC arrives. Bob withdraws — should get 0 BTC.
    const before = await ethers.provider.getBalance(bob.address);
    const tx = await earn.connect(bob).withdraw(ethers.parseEther("100"));
    const r = await tx.wait();
    const after = await ethers.provider.getBalance(bob.address);
    const gasCost = r!.gasUsed * r!.gasPrice;
    const net = after - before + gasCost;
    // Bob should get ~0 BTC (only the gas refund, tolerance for rounding).
    expect(net).to.be.lt(ethers.parseEther("0.001"));
  });

  it("claimReward pays BTC without burning shares", async () => {
    await earn.connect(alice).deposit(ethers.parseEther("100"));
    await owner.sendTransaction({ to: await earn.getAddress(), value: ethers.parseEther("0.5") });

    await earn.connect(alice).claimReward();
    expect(await earn.userShares(alice.address)).to.equal(ethers.parseEther("100"));
    expect(await earn.pendingReward(alice.address)).to.equal(0n);
  });

  it("rejects withdraw with insufficient shares", async () => {
    await earn.connect(alice).deposit(ethers.parseEther("100"));
    await expect(
      earn.connect(alice).withdraw(ethers.parseEther("101"))
    ).to.be.revertedWithCustomError(earn, "InsufficientShares");
  });
});
