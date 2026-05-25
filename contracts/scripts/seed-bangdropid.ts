/**
 * Seed real tips to @BangDropID (twitter) for demo. Since the handle is
 * already registered to the deployer wallet (verified via tweet URL),
 * tips will route directly to the wallet — not the vault.
 */
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

const TIPS = [
  { amount: "3",  note: "love your hot takes",       payFeeInMezo: false },
  { amount: "8",  note: "your thread saved my week", payFeeInMezo: false },
  { amount: "15", note: "v2 release sponsor",        payFeeInMezo: true  },
  { amount: "2",  note: "good post",                 payFeeInMezo: false },
];

async function main() {
  const dep = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "deployments", "matsnet.json"), "utf-8"),
  );
  const [signer] = await ethers.getSigners();
  const router = await ethers.getContractAt("NihRouter", dep.contracts.NihRouter);
  const musd = await ethers.getContractAt(
    [
      "function balanceOf(address) view returns (uint256)",
      "function approve(address, uint256) returns (bool)",
      "function allowance(address, address) view returns (uint256)",
    ],
    dep.contracts.MUSD,
  );
  const mezo = await ethers.getContractAt("MockMEZO", dep.contracts.MEZO);
  const registry = await ethers.getContractAt("NihRegistry", dep.contracts.NihRegistry);

  const total = TIPS.reduce((a, t) => a + ethers.parseUnits(t.amount, 18), 0n);
  console.log(`Sending ${TIPS.length} tips totalling ${ethers.formatUnits(total, 18)} MUSD to twitter:BangDropID`);

  // Make sure the handle is registered (idempotent).
  const handleId = await registry.handleId("twitter", "BangDropID");
  const [recipient] = await registry.resolveById(handleId);
  if (recipient === ethers.ZeroAddress) {
    console.log(`  Registering twitter:BangDropID to deployer ${signer.address}`);
    await (await registry.manualRegister(handleId, signer.address)).wait();
  } else {
    console.log(`  Already registered to ${recipient}`);
  }

  // Approvals.
  const allow = await (musd as any).allowance(signer.address, dep.contracts.NihRouter);
  if (allow < total) {
    console.log(`  Approving router for ${ethers.formatUnits(total, 18)} MUSD`);
    await (await (musd as any).approve(dep.contracts.NihRouter, total)).wait();
  }
  const mezoFloor = (total * 100n) / 10_000n;
  if ((await mezo.allowance(signer.address, dep.contracts.NihRouter)) < mezoFloor) {
    await (await mezo.approve(dep.contracts.NihRouter, mezoFloor)).wait();
  }

  for (const t of TIPS) {
    const ctx = ethers.keccak256(ethers.toUtf8Bytes(t.note));
    const amt = ethers.parseUnits(t.amount, 18);
    const tx = await router.tip("twitter", "BangDropID", amt, t.payFeeInMezo, ctx);
    const r = await tx.wait();
    console.log(`  tip ${t.amount} MUSD (payFeeInMezo=${t.payFeeInMezo}) tx ${r?.hash}`);
  }
  console.log("\nDone. Subgraph + dashboard will catch up in ~15s.");
}

main().catch((e) => { console.error(e); process.exit(1); });
