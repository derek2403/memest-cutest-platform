import React from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';

// Define Polygon Amoy testnet properly
const polygonAmoy = {
  id: 80_002,
  name: 'Polygon Amoy',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc-amoy.polygon.technology/'] },
    public: { http: ['https://rpc-amoy.polygon.technology/'] },
  },
  blockExplorers: {
    default: { name: 'PolygonScan', url: 'https://amoy.polygonscan.com/' },
  },
  testnet: true,
};

// Define Celo testnet
const celoAlfajores = {
  id: 44_787,
  name: 'Celo Alfajores',
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://alfajores-forno.celo-testnet.org'] },
    public: { http: ['https://alfajores-forno.celo-testnet.org'] },
  },
  blockExplorers: {
    default: { name: 'CeloScan', url: 'https://alfajores.celoscan.io/' },
  },
  testnet: true,
};

// Define Celo mainnet
const celoMainnet = {
  id: 42_220,
  name: 'Celo',
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://forno.celo.org'] },
    public: { http: ['https://forno.celo.org'] },
  },
  blockExplorers: {
    default: { name: 'CeloScan', url: 'https://celoscan.io/' },
  },
};

// Initialize wagmi config with RainbowKit
const config = getDefaultConfig({
  appName: 'Memest Cutest Platform',
  projectId: '5bc0351a37ff1fa0a3a9ff4875d3a3ba', // WalletConnect project ID
  chains: [polygonAmoy, baseSepolia, celoAlfajores, celoMainnet],
  ssr: true,
});

export default function WalletProviders({ children }) {
  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider theme={darkTheme()} modalSize="compact">
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
} 