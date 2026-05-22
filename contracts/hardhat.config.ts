import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "0x0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      // OpenZeppelin v5 uses `mcopy` (Cancun opcode). Mezo's EVM supports it
      // despite older docs suggesting `london` — verified on matsnet.
      evmVersion: "cancun",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    matsnet: {
      url: process.env.MEZO_TESTNET_RPC ?? "https://rpc.test.mezo.org",
      chainId: 31611,
      accounts: [PRIVATE_KEY],
    },
    matsnetSpectrum: {
      url: process.env.SPECTRUM_RPC ?? "https://rpc.test.mezo.org",
      chainId: 31611,
      accounts: [PRIVATE_KEY],
    },
    mezoMainnet: {
      url: process.env.MEZO_MAINNET_RPC ?? "https://mainnet.mezo.public.validationcloud.io",
      chainId: 31612,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      matsnet: "no-api-key-needed",
    },
    customChains: [
      {
        network: "matsnet",
        chainId: 31611,
        urls: {
          apiURL: "https://explorer.test.mezo.org/api",
          browserURL: "https://explorer.test.mezo.org",
        },
      },
    ],
  },
};

export default config;
