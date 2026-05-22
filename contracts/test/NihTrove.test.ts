import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { MockMUSD, MockBorrowerOps, NihTrove } from "../typechain-types";

describe("NihTrove", () => {
  let owner: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let musd: MockMUSD;
  let mezo: MockBorrowerOps;
  let trove: NihTrove;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    musd = await (await ethers.getContractFactory("MockMUSD")).deploy();
    mezo = await (await ethers.getContractFactory("MockBorrowerOps")).deploy(await musd.getAddress());
    trove = await (await ethers.getContractFactory("NihTrove")).deploy(
      await mezo.getAddress(),
      await mezo.getAddress(),
      ethers.ZeroAddress,
      await musd.getAddress()
    );
  });

  it("deploys an implementation contract on construction", async () => {
    expect(await trove.implementation()).to.not.equal(ethers.ZeroAddress);
  });

  it("creates one proxy per user on first openTroveFor", async () => {
    const debt = ethers.parseEther("2000");
    await trove.connect(alice).openTroveFor(debt, { value: ethers.parseEther("1") });
    const aliceProxy = await trove.proxyOf(alice.address);
    expect(aliceProxy).to.not.equal(ethers.ZeroAddress);
    expect(await musd.balanceOf(alice.address)).to.equal(debt);

    await trove.connect(bob).openTroveFor(debt, { value: ethers.parseEther("1") });
    const bobProxy = await trove.proxyOf(bob.address);
    expect(bobProxy).to.not.equal(aliceProxy);
    expect(bobProxy).to.not.equal(ethers.ZeroAddress);
  });

  it("predictProxy matches the deployed clone address", async () => {
    const predicted = await trove.predictProxy(alice.address);
    await trove.connect(alice).openTroveFor(ethers.parseEther("2000"), { value: ethers.parseEther("1") });
    const actual = await trove.proxyOf(alice.address);
    expect(actual.toLowerCase()).to.equal(predicted.toLowerCase());
  });

  it("snapshotOf returns trove state per user", async () => {
    await trove.connect(alice).openTroveFor(ethers.parseEther("2000"), { value: ethers.parseEther("1") });
    const [debt, coll, status] = await trove.snapshotOf(alice.address);
    expect(debt).to.equal(ethers.parseEther("2000"));
    expect(coll).to.equal(ethers.parseEther("1"));
    expect(status).to.equal(1n);
  });

  it("close trove returns BTC, ends trove", async () => {
    const debt = ethers.parseEther("2000");
    await trove.connect(alice).openTroveFor(debt, { value: ethers.parseEther("1") });

    const aliceProxyAddr = await trove.proxyOf(alice.address);
    await musd.connect(alice).approve(aliceProxyAddr, debt);

    const beforeBalance = await ethers.provider.getBalance(alice.address);
    const tx = await trove.connect(alice).closeTroveFor();
    const r = await tx.wait();
    const afterBalance = await ethers.provider.getBalance(alice.address);
    const gas = r!.gasUsed * r!.gasPrice;
    const net = afterBalance - beforeBalance + gas;
    expect(net).to.be.closeTo(ethers.parseEther("1"), ethers.parseEther("0.001"));

    const [debtAfter, , statusAfter] = await trove.snapshotOf(alice.address);
    expect(debtAfter).to.equal(0n);
    expect(statusAfter).to.equal(0n);
  });

  it("cannot close trove if no proxy exists", async () => {
    await expect(trove.connect(alice).closeTroveFor()).to.be.revertedWithCustomError(trove, "NoProxy");
  });
});
