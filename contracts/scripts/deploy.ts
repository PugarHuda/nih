import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying Nih to ${network.name} as ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} BTC`);

  // 1) Deploy mocks (skip on mainnet — use real addresses)
  const musdAddress = process.env.MUSD_ADDRESS;
  const mezoAddress = process.env.MEZO_ADDRESS;

  let musd, mezo;
  if (!musdAddress) {
    console.log("Deploying MockMUSD…");
    const MockMUSD = await ethers.getContractFactory("MockMUSD");
    musd = await MockMUSD.deploy();
    await musd.waitForDeployment();
    console.log(`  MockMUSD → ${await musd.getAddress()}`);
  } else {
    musd = await ethers.getContractAt("IERC20", musdAddress);
    console.log(`Using existing MUSD at ${musdAddress}`);
  }

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

  // 2) NihRegistry — verifier defaults to deployer for hackathon
  console.log("Deploying NihRegistry…");
  const NihRegistry = await ethers.getContractFactory("NihRegistry");
  const registry = await NihRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  console.log(`  NihRegistry → ${await registry.getAddress()}`);

  // 3) NihVault
  console.log("Deploying NihVault…");
  const NihVault = await ethers.getContractFactory("NihVault");
  const vault = await NihVault.deploy(await musd.getAddress(), await registry.getAddress());
  await vault.waitForDeployment();
  console.log(`  NihVault → ${await vault.getAddress()}`);

  // 4) NihRouter — fee treasury defaults to deployer, set DAO multisig later
  console.log("Deploying NihRouter…");
  const NihRouter = await ethers.getContractFactory("NihRouter");
  const router = await NihRouter.deploy(
    await musd.getAddress(),
    await mezo.getAddress(),
    await registry.getAddress(),
    await vault.getAddress(),
    deployer.address // treasury
  );
  await router.waitForDeployment();
  console.log(`  NihRouter → ${await router.getAddress()}`);

  // 5) Wire vault → router
  console.log("Wiring vault.setRouter(router)…");
  const tx = await vault.setRouter(await router.getAddress());
  await tx.wait();

  // 6) NihCredit
  console.log("Deploying NihCredit…");
  const NihCredit = await ethers.getContractFactory("NihCredit");
  const credit = await NihCredit.deploy(await musd.getAddress(), await vault.getAddress());
  await credit.waitForDeployment();
  console.log(`  NihCredit → ${await credit.getAddress()}`);

  // Write deployments file
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
    },
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
