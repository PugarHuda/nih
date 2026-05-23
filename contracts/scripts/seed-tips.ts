/**
 * Seed real tip activity on matsnet for the Goldsky subgraph + dashboard
 * to have non-empty stats during demo.
 *
 * Reuses the deployer wallet (which already owns all the pre-registered
 * handles via register-handles.ts). Each tip is a real on-chain tx:
 * deployer-MUSD → NihRouter.tip(platform, username, amount, payFeeInMezo, context)
 * → MUSD ends up back in deployer wallet (since deployer owns the handle)
 * → Tipped event indexed by subgraph → dashboard sees real data.
 *
 *   pnpm hardhat run scripts/seed-tips.ts --network matsnet
 *
 * Idempotent-ish: re-running it adds MORE tips (good for demo realism).
 * Approval is granted for the total batch amount once at the start.
 */
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

interface Seed {
  platform: string;
  username: string;
  amount: string; // human-readable MUSD
  payFeeInMezo: boolean;
  note: string;
}

const SEEDS: Seed[] = [
  // First two already sent in the previous partial run — skip on rerun by
  // setting AFTER_TIP_INDEX env to resume from a specific seed index.
  { platform: "twitter", username: "pugarhuda",  amount: "25",  payFeeInMezo: true,  note: "clean writeup" },
  { platform: "github",  username: "PugarHuda",  amount: "100", payFeeInMezo: false, note: "v2 release sponsor" },
  { platform: "github",  username: "PugarHuda",  amount: "35",  payFeeInMezo: true,  note: "fix landed you saved my week" },
  { platform: "twitter", username: "MezoNetwork",amount: "8",   payFeeInMezo: false, note: "based" },
  { platform: "twitter", username: "EncodeClub", amount: "75",  payFeeInMezo: false, note: "legit hackathon" },
  { platform: "twitter", username: "hajislamet", amount: "5",   payFeeInMezo: false, note: "good post" },
];

async function main() {
  const deploymentsPath = path.join(__dirname, "..", "deployments", "matsnet.json");
  const dep = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));

  const [signer] = await ethers.getSigners();
  const router = await ethers.getContractAt("NihRouter", dep.contracts.NihRouter);
  const musd = await ethers.getContractAt("MockMUSD", dep.contracts.MUSD);
  const mezo = await ethers.getContractAt("MockMEZO", dep.contracts.MEZO);
  const registry = await ethers.getContractAt("NihRegistry", dep.contracts.NihRegistry);

  // Total approval needed (sum of all amounts).
  const totalAmount = SEEDS.reduce(
    (acc, s) => acc + ethers.parseUnits(s.amount, 18),
    0n,
  );
  console.log(`Seeding ${SEEDS.length} tips, total ${ethers.formatUnits(totalAmount, 18)} MUSD`);
  console.log(`Sender:  ${signer.address}`);
  console.log(`Router:  ${dep.contracts.NihRouter}`);

  // Make sure sender has enough MUSD.
  const bal = await musd.balanceOf(signer.address);
  if (bal < totalAmount) {
    const need = totalAmount - bal;
    console.log(`Minting ${ethers.formatUnits(need, 18)} additional MockMUSD to deployer`);
    await (await musd.mint(signer.address, need)).wait();
  }

  // One-time MUSD approval covering the whole batch.
  const allowance = await musd.allowance(signer.address, dep.contracts.NihRouter);
  if (allowance < totalAmount) {
    console.log(`Approving router for ${ethers.formatUnits(totalAmount, 18)} MUSD`);
    await (await musd.approve(dep.contracts.NihRouter, totalAmount)).wait();
  }

  // MEZO approval — some seeds pay fee in MEZO. We don't know the live
  // MUSD↔MEZO conversion rate the router uses, so approve generously
  // (10x the fee bps cap × total). Re-approve only if current allowance
  // is below that floor.
  const mezoAllowanceFloor = (totalAmount * 100n) / 10_000n; // 1% of total
  const mezoAllowance = await mezo.allowance(signer.address, dep.contracts.NihRouter);
  if (mezoAllowance < mezoAllowanceFloor) {
    console.log(`Approving router for ${ethers.formatUnits(mezoAllowanceFloor, 18)} MEZO (fee buffer)`);
    await (await mezo.approve(dep.contracts.NihRouter, mezoAllowanceFloor)).wait();
  }

  // Walk the list — for each seed, ensure handle is registered, then tip.
  for (const seed of SEEDS) {
    const handleId = await registry.handleId(seed.platform, seed.username);
    const [recipient] = await registry.resolveById(handleId);
    if (recipient === ethers.ZeroAddress) {
      console.log(`  ${seed.platform}:${seed.username} not registered → manualRegister to deployer`);
      await (await registry.manualRegister(handleId, signer.address)).wait();
    }

    // context = keccak256(note) — gives the subgraph a unique fingerprint
    // per tip and lets the dashboard correlate to off-chain note text later.
    const context = ethers.keccak256(ethers.toUtf8Bytes(seed.note));
    const amount = ethers.parseUnits(seed.amount, 18);

    const tx = await router.tip(seed.platform, seed.username, amount, seed.payFeeInMezo, context);
    const r = await tx.wait();
    console.log(
      `  tip ${seed.amount} MUSD → ${seed.platform}:${seed.username} ` +
        `(payFeeInMezo=${seed.payFeeInMezo}) tx ${r?.hash}`,
    );
  }

  console.log("\nDone. Wait ~30s for Goldsky to index.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
