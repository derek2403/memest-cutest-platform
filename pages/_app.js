import "@/styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import {
  arbitrum,
  optimism,
  mainnet,
  sepolia,
  polygonAmoy,
  optimismSepolia,
  arbitrumSepolia,
  baseSepolia,
} from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// Configure Rainbow Kit with mainnet chains
const config = getDefaultConfig({
  appName: "Memest Cutest Platform",
  projectId: "YOUR_PROJECT_ID", // Replace with your WalletConnect Cloud project ID
  chains: [mainnet, arbitrum, optimism, sepolia, polygonAmoy, optimismSepolia, arbitrumSepolia, baseSepolia],
  ssr: true,
});

// Create a new query client
const queryClient = new QueryClient();

export default function App({ Component, pageProps }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
