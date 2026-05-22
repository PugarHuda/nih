import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Mezo MUSD ecosystem addresses on matsnet (verified live on-chain).
 * Source: github.com/mezo-org/musd/solidity/SCALE_TEST_ADDRESSES.md
 * Verified by eth_call returning "Mezo USD" from name() on the MUSD address.
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
  console.log(`Deploying Nih to ${network.name} as ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} BTC`);

  // Real Mezo MUSD on matsnet vs Mock for local hardhat.
  const useRealMezo = network.name === "matsnet" || network.name === "matsnetSpectrum";
  const realAddrs = useRealMezo ? MEZO_MATSNET : null;

  // 1) MUSD token — real on matsnet, mock locally.
  const musdAddress = process.env.MUSD_ADDRESS ?? realAddrs?.MUSD;
  let musd;
  if (!musdAddress) {
    console.log("Deploying MockMUSD…");
    const MockMUSD = await ethers.getContractFactory("MockMUSD");
    musd = await MockMUSD.deploy();
    await musd.waitForDeployment();
    console.log(`  MockMUSD → ${await musd.getAddress()}`);
  } else {
    musd = await ethers.getContractAt("IERC20", musdAddress);
    console.log(`Using real Mezo MUSD at ${musdAddress}`);
  }

  // 2) MEZO mock (real MEZO token not yet on matsnet).
  const mezoAddress = process.env.MEZO_ADDRESS;
  let mezo;
  if (!mezoAddress) {
    console.log("Deploying MockMEZO…");
    const MockMEZO = await ethers.getContractFactory("MockMEZO");
    mezo = await MockMEZO.deploy();
    await mezo.waitForDeployment();
    console.log(`  MockMEZO → ${await mezo.getAddress()}`);
  } else {
    mezo = await ethers.getContractAt("IERC20", mezoAddress);
    console.log(`Using existing MEZO at ${mezoAddress}`);
  }

  // 3) Nih primitives.
  console.log("Deploying NihRegistry…");
  const NihRegistry = await ethers.getContractFactory("NihRegistry");
  const registry = await NihRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  console.log(`  NihRegistry → ${await registry.getAddress()}`);

  console.log("Deploying NihVault…");
  const NihVault = await ethers.getContractFactory("NihVault");
  const vault = await NihVault.deploy(await musd.getAddress(), await registry.getAddress());
  await vault.waitForDeployment();
  console.log(`  NihVault → ${await vault.getAddress()}`);

  console.log("Deploying NihRouter…");
  const NihRouter = await ethers.getContractFactory("NihRouter");
  const router = await NihRouter.deploy(
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
  const NihCredit = await ethers.getContractFactory("NihCredit");
  const credit = await NihCredit.deploy(await musd.getAddress(), await vault.getAddress());
  await credit.waitForDeployment();
  console.log(`  NihCredit → ${await credit.getAddress()}`);

  console.log("Deploying NihStream…");
  const NihStream = await ethers.getContractFactory("NihStream");
  const stream = await NihStream.deploy(await musd.getAddress());
  await stream.waitForDeployment();
  console.log(`  NihStream → ${await stream.getAddress()}`);

  // 4) Real-Mezo wrappers — only deploy if we're on matsnet and Mezo addresses live.
  let earn: any;
  let trove: any;
  if (useRealMezo && realAddrs) {
    console.log("Deploying NihEarn (wraps Mezo StabilityPool)…");
    const NihEarn = await ethers.getContractFactory("NihEarn");
    earn = await NihEarn.deploy(realAddrs.MUSD, realAddrs.StabilityPool);
    await earn.waitForDeployment();
    console.log(`  NihEarn → ${await earn.getAddress()}`);

    console.log("Deploying NihTrove (wraps Mezo BorrowerOperations)…");
    const NihTrove = await ethers.getContractFactory("NihTrove");
    trove = await NihTrove.deploy(
      realAddrs.BorrowerOperations,
      realAddrs.TroveManager,
      realAddrs.PriceFeed,
      realAddrs.MUSD
    );
    await trove.waitForDeployment();
    console.log(`  NihTrove → ${await trove.getAddress()}`);
  } else {
    console.log("Skipping NihEarn / NihTrove (real Mezo addresses unavailable on this network)");
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
