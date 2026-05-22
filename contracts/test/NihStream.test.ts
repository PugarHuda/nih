import { expect } from "chai";
import { ethers, network } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { MockMUSD, NihStream } from "../typechain-types";

describe("NihStream", () => {
  let owner: HardhatEthersSigner;
  let alice: HardhatEthersSigner; // sender
  let bob: HardhatEthersSigner;   // recipient
  let musd: MockMUSD;
  let stream: NihStream;

  const ONE_DAY = 24 * 60 * 60;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    musd = await (await ethers.getContractFactory("MockMUSD")).deploy();
    stream = await (await ethers.getContractFactory("NihStream")).deploy(await musd.getAddress());
    await musd.mint(alice.address, ethers.parseEther("10000"));
    await musd.connect(alice).approve(await stream.getAddress(), ethers.MaxUint256);
  });

  it("creates a stream and locks the deposit", async () => {
    const deposit = ethers.parseEther("864"); // 864 MUSD over 1 day = 0.01 MUSD/sec
    await stream.connect(alice).create(bob.address, deposit, ONE_DAY);

    expect(await musd.balanceOf(await stream.getAddress())).to.equal(deposit);
    expect(await musd.balanceOf(alice.address)).to.equal(ethers.parseEther("10000") - deposit);

    const s = await stream.streams(0);
    expect(s.sender).to.equal(alice.address);
    expect(s.recipient).to.equal(bob.address);
    expect(s.deposit).to.equal(deposit);
  });

  it("releases MUSD linearly over time", async () => {
    const deposit = ethers.parseEther("864");
    await stream.connect(alice).create(bob.address, deposit, ONE_DAY);

    // After half the duration, ~half should be withdrawable.
    await network.provider.send("evm_increaseTime", [ONE_DAY / 2]);
    await network.provider.send("evm_mine");

    const w = await stream.withdrawable(0);
    const half = deposit / 2n;
    const tolerance = ethers.parseEther("0.5");
    expect(w).to.be.gte(half - tolerance);
    expect(w).to.be.lte(half + tolerance);
  });

  it("recipient withdraws the streamed amount", async () => {
    const deposit = ethers.parseEther("864");
    await stream.connect(alice).create(bob.address, deposit, ONE_DAY);
    await network.provider.send("evm_increaseTime", [ONE_DAY / 4]);
    await network.provider.send("evm_mine");

    await stream.connect(bob).withdraw(0);
    const balance = await musd.balanceOf(bob.address);
    const quarter = deposit / 4n;
    const tolerance = ethers.parseEther("0.5");
    expect(balance).to.be.gte(quarter - tolerance);
    expect(balance).to.be.lte(quarter + tolerance);
  });

  it("non-recipient cannot withdraw", async () => {
    const deposit = ethers.parseEther("864");
    await stream.connect(alice).create(bob.address, deposit, ONE_DAY);
    await network.provider.send("evm_increaseTime", [ONE_DAY / 2]);
    await network.provider.send("evm_mine");

    await expect(stream.connect(alice).withdraw(0)).to.be.revertedWithCustomError(stream, "NotRecipient");
  });

  it("withdraw after cancel reverts (all funds already distributed)", async () => {
    const deposit = ethers.parseEther("1000");
    await stream.connect(alice).create(bob.address, deposit, ONE_DAY);
    await network.provider.send("evm_increaseTime", [ONE_DAY / 4]);
    await network.provider.send("evm_mine");
    await stream.connect(alice).cancel(0);

    expect(await stream.withdrawable(0)).to.equal(0n);
    await expect(stream.connect(bob).withdraw(0)).to.be.revertedWithCustomError(stream, "NothingToWithdraw");
  });

  it("rejects double-cancel", async () => {
    const deposit = ethers.parseEther("100");
    await stream.connect(alice).create(bob.address, deposit, ONE_DAY);
    await stream.connect(alice).cancel(0);
    await expect(stream.connect(alice).cancel(0)).to.be.revertedWithCustomError(stream, "AlreadyCancelled");
  });

  it("rejects creating stream to self", async () => {
    await expect(
      stream.connect(alice).create(alice.address, ethers.parseEther("100"), ONE_DAY)
    ).to.be.revertedWithCustomError(stream, "InvalidRecipient");
  });

  it("rejects zero duration", async () => {
    await expect(
      stream.connect(alice).create(bob.address, ethers.parseEther("100"), 0)
    ).to.be.revertedWithCustomError(stream, "InvalidDuration");
  });

  it("cancel splits remaining pro-rata", async () => {
    const deposit = ethers.parseEther("1000");
    await stream.connect(alice).create(bob.address, deposit, ONE_DAY);
    await network.provider.send("evm_increaseTime", [ONE_DAY / 4]);
    await network.provider.send("evm_mine");

    const aliceBefore = await musd.balanceOf(alice.address);
    const bobBefore = await musd.balanceOf(bob.address);

    await stream.connect(alice).cancel(0);

    const aliceAfter = await musd.balanceOf(alice.address);
    const bobAfter = await musd.balanceOf(bob.address);

    // Bob got roughly 25%, Alice got roughly 75% back.
    const bobGain = bobAfter - bobBefore;
    const aliceGain = aliceAfter - aliceBefore;
    const quarter = deposit / 4n;
    const threeQuarters = (deposit * 3n) / 4n;
    const tol = ethers.parseEther("2");
    expect(bobGain).to.be.gte(quarter - tol);
    expect(bobGain).to.be.lte(quarter + tol);
    expect(aliceGain).to.be.gte(threeQuarters - tol);
    expect(aliceGain).to.be.lte(threeQuarters + tol);
  });
});
