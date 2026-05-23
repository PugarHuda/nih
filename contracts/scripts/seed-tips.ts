/**
 * Seed real tip activity on the FULL_REAL deployment.
 *
 *   pnpm hardhat run scripts/seed-tips.ts --network matsnet
 *
 * Each tip is a real on-chain tx using REAL Mezo MUSD as the value
 * token: deployer-real-MUSD → NihRouter.tip(platform, username, …)
 * → MUSD back to deployer (handles are registered to deployer) →
 * Tipped event indexed by Goldsky.
 *
 * Idempotent-ish: re-running it adds more tips. Approval is granted
 * once at the start for the batch total.
 */
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

interface Seed {
  platform: string;
  username: string;
  amount: string; // human MUSD
  payFeeInMezo: boolean;
  note: string;
}

const SEEDS: Seed[] = [
  { platform: "twitter", username: "hajislamet", amount: "10",  payFeeInMezo: false, note: "amazing thread thanks" },
  { platform: "twitter", username: "hajislamet", amount: "3",   payFeeInMezo: false, note: "solid take" },
  { platform: "twitter", username: "pugarhuda",  amount: "5",   payFeeInMezo: true,  note: "clean writeup" },
  { platform: "github",  username: "PugarHuda",  amount: "25",  payFeeInMezo: false, note: "v2 release sponsor" },
  { platform: "github",  username: "PugarHuda",  amount: "8",   payFeeInMezo: true,  note: "fix landed you saved my week" },
  { platform: "twitter", username: "MezoNetwork",amount: "2",   payFeeInMezo: false, note: "based" },
  { platform: "twitter", username: "EncodeClub", amount: "15",  payFeeInMezo: false, note: "legit hackathon" },
  { platform: "twitter", username: "hajislamet", amount: "1",   payFeeInMezo: false, note: "good post" },
];

async function main() {
  const dep = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "deployments", "matsnet.json"), "utf-8"),
  );

  const [signer] = await ethers.getSigners();
  const router = await ethers.getContractAt("NihRouter", dep.contracts.NihRouter);
  // MUSD is now real Mezo MUSD — use the IERC20 surface, NOT MockMUSD's mint().
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

  const totalAmount = SEEDS.reduce(
    (acc, s) => acc + ethers.parseUnits(s.amount, 18),
    0n,
  );
  console.log(`Seeding ${SEEDS.length} REAL-MUSD tips, total ${ethers.formatUnits(totalAmount, 18)} MUSD`);
  console.log(`Sender:  ${signer.address}`);
  console.log(`Router:  ${dep.contracts.NihRouter}`);
  console.log(`MUSD:    ${dep.contracts.MUSD} (real Mezo)`);

  const bal: bigint = await (musd as any).balanceOf(signer.address);
  console.log(`MUSD bal: ${ethers.formatUnits(bal, 18)} MUSD`);
  if (bal < totalAmount) {
    throw new Error(
      `Insufficient real MUSD. Need ${ethers.formatUnits(totalAmount, 18)}; have ${ethers.formatUnits(bal, 18)}. Open a trove first.`,
    );
  }

  // One-time approval covering the batch total.
  const allowance: bigint = await (musd as any).allowance(signer.address, dep.contracts.NihRouter);
  if (allowance < totalAmount) {
    console.log(`Approving router for ${ethers.formatUnits(totalAmount, 18)} real MUSD`);
    await (await (musd as any).approve(dep.contracts.NihRouter, totalAmount)).wait();
  }

  // MEZO mock approval (some seeds pay fee in MEZO).
  const mezoFloor = (totalAmount * 100n) / 10_000n; // ~1% as fee buffer
  if ((await mezo.allowance(signer.address, dep.contracts.NihRouter)) < mezoFloor) {
    console.log(`Approving router for ${ethers.formatUnits(mezoFloor, 18)} MEZO fee buffer`);
    await (await mezo.approve(dep.contracts.NihRouter, mezoFloor)).wait();
  }

  for (const seed of SEEDS) {
    const handleId = await registry.handleId(seed.platform, seed.username);
    const [recipient] = await registry.resolveById(handleId);
    if (recipient === ethers.ZeroAddress) {
      console.log(`  ${seed.platform}:${seed.username} not registered → manualRegister to deployer`);
      await (await registry.manualRegister(handleId, signer.address)).wait();
    }

    const context = ethers.keccak256(ethers.toUtf8Bytes(seed.note));
    const amount = ethers.parseUnits(seed.amount, 18);

    const tx = await router.tip(seed.platform, seed.username, amount, seed.payFeeInMezo, context);
    const r = await tx.wait();
    console.log(
      `  tip ${seed.amount} MUSD → ${seed.platform}:${seed.username} (payFeeInMezo=${seed.payFeeInMezo}) tx ${r?.hash}`,
    );
  }

  console.log("\nDone. Wait ~30s for Goldsky (nih/v4) to index.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
