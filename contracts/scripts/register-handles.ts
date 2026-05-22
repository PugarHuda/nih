/**
 * Pre-register a few demo handles on NihRegistry.
 *
 * For hackathon demo: handles map to the deployer wallet so tipping any
 * Twitter / GitHub username we pre-registered routes MUSD directly to a
 * wallet we control (and can show during the demo).
 *
 *   pnpm hardhat run scripts/register-handles.ts --network matsnet
 */
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

const HANDLES: Array<{ platform: string; username: string }> = [
  { platform: "twitter", username: "hajislamet" },
  { platform: "twitter", username: "pugarhuda" },
  { platform: "github", username: "PugarHuda" },
  { platform: "twitter", username: "MezoNetwork" },
  { platform: "twitter", username: "EncodeClub" },
];

async function main() {
  const deploymentsPath = path.join(__dirname, "..", "deployments", "matsnet.json");
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
  const registryAddress = deployments.contracts.NihRegistry;

  const [signer] = await ethers.getSigners();
  console.log(`Registering ${HANDLES.length} handles to ${signer.address}`);
  console.log(`Registry: ${registryAddress}`);

  const registry = await ethers.getContractAt("NihRegistry", registryAddress);

  for (const { platform, username } of HANDLES) {
    const handleId = await registry.handleId(platform, username);
    const [existing] = await registry.resolveById(handleId);
    if (existing !== ethers.ZeroAddress) {
      console.log(`  ${platform}:${username} already registered to ${existing}`);
      continue;
    }
    const tx = await registry.manualRegister(handleId, signer.address);
    await tx.wait();
    console.log(`  ${platform}:${username} → ${signer.address} (tx ${tx.hash})`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
