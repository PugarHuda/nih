import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { matsnet } from "./chain";

export const wagmiConfig = createConfig({
  chains: [matsnet],
  connectors: [injected()],
  transports: {
    [matsnet.id]: http(process.env.NEXT_PUBLIC_RPC_URL ?? "https://rpc.test.mezo.org"),
  },
  ssr: true,
});
