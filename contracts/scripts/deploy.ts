import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Hybrid MUSD deployment.
 *
 * Why two MUSD instances:
 *  - Mezo's real MUSD (0xf9BB...0af on matsnet) has `mint()` gated by a
 *    minter allowlist. We're not on it, so /faucet would fail and the
 *    tip/claim/credit demo would block on test-MUSD acquisition.
 *  - Our MockMUSD has open `mint(to, amount)` so judges can grab funds
 *    and run the full loop in under 30 seconds.
 *  - But NihEarn and NihTrove deeply integrate with Mezo's REAL contracts
 *    (StabilityPool / BorrowerOperations), so they must point at real MUSD.
 *
 * Result: Router/Vault/Credit/Stream → MockMUSD (demo-friendly).
 *         Earn/Trove → real Mezo MUSD (production-shape integration).
 */
const MEZO_MATSNET = {
  MUSD: "0xf9BBcCC0F1b68EA07c86de6F88C76b3d8E2dD0af",
  BorrowerOperations: "0xa14cbA6DD12D537A8decc7dd3c4aC413B8711eba",
  TroveManager: "0x7FE0A5a7EeBD88530c58824475edEae33424671F",
  StabilityPool: "0xCfdb903cD2Dc14E24e78130A63b20Ba65107262A",
  PriceFeed: "0xf28B0d5165b4ad9D5C04CdE1E37B400f8ca5A8cb",
} as const;

async function main() {
  const [deployer] = await ethers.getSigners();
  const useRealMezo = network.name === "matsnet" || network.name === "matsnetSpectrum";
  const realAddrs = useRealMezo ? MEZO_MATSNET : null;

  console.log(`Deploying Nih to ${network.name} as ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} BTC\n`);

  // 1) Demo MUSD (open-mint) for tip/credit/stream flows.
  console.log("Deploying MockMUSD for demo-tip flow…");
  const MockMUSD = await ethers.getContractFactory("MockMUSD");
  const musd = await MockMUSD.deploy();
  await musd.waitForDeployment();
  console.log(`  MockMUSD → ${await musd.getAddress()}`);

  // 2) MEZO mock (real MEZO not on matsnet yet).
  console.log("Deploying MockMEZO…");
  const mezo = await (await ethers.getContractFactory("MockMEZO")).deploy();
  await mezo.waitForDeployment();
  console.log(`  MockMEZO → ${await mezo.getAddress()}`);

  // 3) Nih primitives over MockMUSD.
  console.log("Deploying NihRegistry…");
  const registry = await (await ethers.getContractFactory("NihRegistry")).deploy(deployer.address);
  await registry.waitForDeployment();
  console.log(`  NihRegistry → ${await registry.getAddress()}`);

  console.log("Deploying NihVault…");
  const vault = await (await ethers.getContractFactory("NihVault")).deploy(
    await musd.getAddress(),
    await registry.getAddress()
  );
  await vault.waitForDeployment();
  console.log(`  NihVault → ${await vault.getAddress()}`);

  console.log("Deploying NihRouter…");
  const router = await (await ethers.getContractFactory("NihRouter")).deploy(
    await musd.getAddress(),
    await mezo.getAddress(),
    await registry.getAddress(),
    await vault.getAddress(),
    deployer.address
  );
  await router.waitForDeployment();
  console.log(`  NihRouter → ${await router.getAddress()}`);

  console.log("Wiring vault.setRouter(router)…");
  await (await vault.setRouter(await router.getAddress())).wait();

  console.log("Deploying NihCredit (peer pool)…");
  const credit = await (await ethers.getContractFactory("NihCredit")).deploy(
    await musd.getAddress(),
    await vault.getAddress()
  );
  await credit.waitForDeployment();
  console.log(`  NihCredit → ${await credit.getAddress()}`);

  console.log("Deploying NihStream…");
  const stream = await (await ethers.getContractFactory("NihStream")).deploy(await musd.getAddress());
  await stream.waitForDeployment();
  console.log(`  NihStream → ${await stream.getAddress()}`);

  // 4) Real-Mezo wrappers (only on matsnet).
  let earn: any;
  let trove: any;
  if (useRealMezo && realAddrs) {
    console.log("Deploying NihEarn (wraps real Mezo StabilityPool)…");
    earn = await (await ethers.getContractFactory("NihEarn")).deploy(
      realAddrs.MUSD,
      realAddrs.StabilityPool
    );
    await earn.waitForDeployment();
    console.log(`  NihEarn → ${await earn.getAddress()}`);

    console.log("Deploying NihTrove (wraps real Mezo BorrowerOperations)…");
    trove = await (await ethers.getContractFactory("NihTrove")).deploy(
      realAddrs.BorrowerOperations,
      realAddrs.TroveManager,
      realAddrs.PriceFeed,
      realAddrs.MUSD
    );
    await trove.waitForDeployment();
    console.log(`  NihTrove → ${await trove.getAddress()}`);
  } else {
    console.log("Skipping NihEarn / NihTrove (not matsnet)");
  }

  const out = {
    chainId: network.config.chainId,
    network: network.name,
    deployedAt: new Date().toISOString(),
    contracts: {
      MUSD: await musd.getAddress(),
      MEZO: await mezo.getAddress(),
      NihRegistry: await registry.getAddress(),
      NihVault: await vault.getAddress(),
      NihRouter: await router.getAddress(),
      NihCredit: await credit.getAddress(),
      NihStream: await stream.getAddress(),
      ...(earn ? { NihEarn: await earn.getAddress() } : {}),
      ...(trove ? { NihTrove: await trove.getAddress() } : {}),
    },
    realMezoMUSD: realAddrs?.MUSD ?? null,
    mezoPrimitives: realAddrs ?? null,
  };
  const dir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${network.name}.json`), JSON.stringify(out, null, 2));
  console.log("\nDeployment complete!");
  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
