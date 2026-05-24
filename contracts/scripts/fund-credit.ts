/**
 * Pre-fund NihCredit's lending treasury with real MUSD so the first
 * borrowers don't hit `InsufficientLiquidity` (the contract needs
 * `balance >= borrowable + collateral` at open).
 *
 *   pnpm hardhat run scripts/fund-credit.ts --network matsnet
 *
 * Tunable: AMOUNT (default 500 MUSD).
 */
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const dep = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "deployments", "matsnet.json"), "utf-8"),
  );
  const [signer] = await ethers.getSigners();
  const amount = ethers.parseUnits(process.env.AMOUNT ?? "500", 18);
  const musd = await ethers.getContractAt(
    [
      "function balanceOf(address) view returns (uint256)",
      "function transfer(address, uint256) returns (bool)",
    ],
    dep.contracts.MUSD,
  );
  const bal: bigint = await (musd as any).balanceOf(signer.address);
  console.log(`Funding NihCredit ${dep.contracts.NihCredit}`);
  console.log(`Signer balance: ${ethers.formatUnits(bal, 18)} MUSD`);
  console.log(`Sending:        ${ethers.formatUnits(amount, 18)} MUSD`);
  if (bal < amount) {
    throw new Error(`Insufficient MUSD. Open another trove or lower AMOUNT.`);
  }
  const tx = await (musd as any).transfer(dep.contracts.NihCredit, amount);
  const r = await tx.wait();
  console.log(`tx ${r?.hash}`);
  const after: bigint = await (musd as any).balanceOf(dep.contracts.NihCredit);
  console.log(`NihCredit pool now: ${ethers.formatUnits(after, 18)} MUSD`);
}

main().catch((e) => { console.error(e); process.exit(1); });
