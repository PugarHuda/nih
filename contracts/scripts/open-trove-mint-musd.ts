/**
 * Open a Mezo trove for the deployer and mint real MUSD.
 *
 *   pnpm hardhat run scripts/open-trove-mint-musd.ts --network matsnet
 *
 * Why: switching Nih's tip economy from Mock MUSD to Real MUSD requires
 * the seed wallet (deployer) to actually hold real MUSD. The only way
 * to get real MUSD on matsnet is to open a Mezo trove against BTC
 * collateral. This script does that via NihTrove (per-user proxy that
 * forwards to Mezo BorrowerOperations).
 *
 * Tunables via env:
 *   - COLLATERAL_BTC (default 0.04)  — BTC sent as collateral
 *   - DEBT_MUSD      (default 2000)  — MUSD to mint (must be ≥ Mezo MIN_NET_DEBT)
 */
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const dep = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "deployments", "matsnet.json"), "utf-8"),
  );

  const [signer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(signer.address);
  console.log(`Signer:    ${signer.address}`);
  console.log(`BTC bal:   ${ethers.formatEther(balance)} BTC`);

  const collateral = ethers.parseEther(process.env.COLLATERAL_BTC ?? "0.04");
  const debt = ethers.parseUnits(process.env.DEBT_MUSD ?? "2000", 18);

  if (balance < collateral + ethers.parseEther("0.005")) {
    throw new Error(
      `Insufficient BTC. Need ${ethers.formatEther(collateral)} collateral + ~0.005 gas; have ${ethers.formatEther(balance)}`,
    );
  }

  const trove = await ethers.getContractAt("NihTrove", dep.contracts.NihTrove);
  const realMusdAddr = dep.realMezoMUSD as string;
  const musd = await ethers.getContractAt("IERC20Like", realMusdAddr).catch(() =>
    ethers.getContractAt(
      ["function balanceOf(address) view returns (uint256)"],
      realMusdAddr,
    ),
  );

  // If a trove already exists for this signer, just report state.
  const [existingDebt, existingColl, status] = await trove.snapshotOf(signer.address);
  if (status > 0n) {
    console.log(
      `Existing trove: debt=${ethers.formatUnits(existingDebt, 18)} MUSD, collateral=${ethers.formatEther(existingColl)} BTC, status=${status}`,
    );
    const m = await (musd as any).balanceOf(signer.address);
    console.log(`Real MUSD bal: ${ethers.formatUnits(m, 18)} MUSD`);
    return;
  }

  console.log(
    `Opening trove → collateral ${ethers.formatEther(collateral)} BTC, debt ${ethers.formatUnits(debt, 18)} MUSD`,
  );
  const tx = await trove.openTroveFor(debt, { value: collateral });
  const r = await tx.wait();
  console.log(`  tx ${r?.hash}`);

  const [d2, c2, st] = await trove.snapshotOf(signer.address);
  console.log(`Trove now: debt=${ethers.formatUnits(d2, 18)} MUSD, coll=${ethers.formatEther(c2)} BTC, status=${st}`);

  const proxy = await trove.proxyOf(signer.address);
  console.log(`Trove proxy address (holds collateral): ${proxy}`);

  const m2 = await (musd as any).balanceOf(signer.address);
  console.log(`Real MUSD balance now: ${ethers.formatUnits(m2, 18)} MUSD`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
