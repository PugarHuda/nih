/**
 * Seed a real INCOMING stream to the deployer wallet.
 *
 * NihStream rejects self-streams (recipient != sender). To populate the
 * "Incoming" card on the dashboard with real on-chain data, we:
 *   1. Generate an ephemeral wallet
 *   2. Fund it with a sliver of BTC for gas
 *   3. Transfer a small amount of real MUSD to it
 *   4. From the ephemeral wallet: approve NihStream + create a 1-week
 *      stream targeting the deployer
 *
 * Idempotent-ish: the ephemeral wallet is a fresh random per run, so
 * each run adds a new incoming stream row.
 *
 *   pnpm hardhat run scripts/seed-incoming-stream.ts --network matsnet
 *
 * Tunables:
 *   STREAM_MUSD  default 10
 *   DURATION_S   default 604800 (7d)
 */
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const dep = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "deployments", "matsnet.json"), "utf-8"),
  );

  const [deployer] = await ethers.getSigners();
  const streamMUSD = ethers.parseUnits(process.env.STREAM_MUSD ?? "10", 18);
  const duration = BigInt(process.env.DURATION_S ?? "604800");
  const ephemeralBTC = ethers.parseEther("0.002"); // ~$190 of BTC, enough for ~5 tx

  // Generate ephemeral sender.
  const sender = ethers.Wallet.createRandom().connect(ethers.provider);
  console.log(`Ephemeral sender: ${sender.address}`);

  // Step 1: fund sender with gas.
  console.log(`Funding sender with ${ethers.formatEther(ephemeralBTC)} BTC for gas…`);
  await (await deployer.sendTransaction({ to: sender.address, value: ephemeralBTC })).wait();

  // Step 2: transfer real MUSD to sender.
  const musd = await ethers.getContractAt(
    [
      "function balanceOf(address) view returns (uint256)",
      "function transfer(address, uint256) returns (bool)",
      "function approve(address, uint256) returns (bool)",
    ],
    dep.contracts.MUSD,
  );
  console.log(`Transferring ${ethers.formatUnits(streamMUSD, 18)} MUSD to sender…`);
  await (await (musd as any).transfer(sender.address, streamMUSD)).wait();

  // Step 3: sender approves NihStream.
  const musdAsSender = musd.connect(sender) as any;
  console.log(`Sender approving NihStream…`);
  await (await musdAsSender.approve(dep.contracts.NihStream, streamMUSD)).wait();

  // Step 4: sender creates stream to deployer.
  const stream = (await ethers.getContractAt("NihStream", dep.contracts.NihStream)).connect(sender);
  console.log(
    `Creating stream — ${ethers.formatUnits(streamMUSD, 18)} MUSD over ${duration}s to ${deployer.address}…`,
  );
  const tx = await (stream as any).create(deployer.address, streamMUSD, duration);
  const r = await tx.wait();
  console.log(`  tx ${r?.hash}`);

  console.log(`\nDone. Deployer's /stream Incoming should show this row within ~15s.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
