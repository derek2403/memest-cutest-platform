import React, { useState, useEffect } from 'react';
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

// Configuration with enhanced WalletConnect parameters
const config = getDefaultConfig({
  appName: 'Memest Cutest Platform',
  projectId: '5bc0351a37ff1fa0a3a9ff4875d3a3ba', // WalletConnect project ID
  chains: [polygonAmoy, baseSepolia, celoAlfajores, celoMainnet],
  ssr: true,
  // Enhanced WalletConnect configuration with improved error handling
  walletConnectParameters: {
    projectId: '5bc0351a37ff1fa0a3a9ff4875d3a3ba',
    metadata: {
      name: 'Memest Cutest Platform',
      description: 'Web3 Platform',
      url: 'https://memest-cutest-platform.vercel.app',
      icons: ['https://walletconnect.com/walletconnect-logo.png']
    },
    // Using v2 relay URL explicitly with fallbacks
    relayUrl: 'wss://relay.walletconnect.org',
    connectTries: 10, // Increased number of connection attempts
    connectTimeout: 90000, // Increased timeout for regions with slow connections
    maxPingInterval: 45000,
    minPingInterval: 15000,
    fallbackDefaultRelays: true,
    relayServerReconnectInterval: 5000, // Quicker reconnect attempts
    customStoragePrefix: 'wc_memest_cutest_v2_',
    // Alternative relays to try if main relay fails
    relays: [
      'wss://relay.walletconnect.org',
      'wss://relay.walletconnect.com',
      'wss://relay-direct.walletconnect.com'
    ]
  }
});

export default function WalletProviders({ children }) {
  const [connectionError, setConnectionError] = useState(null);

  // Clear any stale WalletConnect sessions on mount
  useEffect(() => {
    // Clear cached WalletConnect sessions that might be causing issues
    try {
      const clearStaleSessions = () => {
        const sessionStorage = window.localStorage;
        const staleKeys = Object.keys(sessionStorage).filter(key => 
          key.startsWith('wc@') || // v1 keys
          key.startsWith('wc_memest_cutest_v1_') || // custom v1 keys 
          (key.startsWith('wc_memest_cutest_v2_') && key.includes('0.0.1')) // outdated v2 keys
        );
        
        staleKeys.forEach(key => {
          sessionStorage.removeItem(key);
        });
      };

      clearStaleSessions();
      
      // Add global error handler for WalletConnect
      window.addEventListener('walletconnect_error', (e) => {
        console.error('WalletConnect error:', e.detail);
        setConnectionError(e.detail?.message || 'Connection interrupted');
        
        // Attempt to reconnect or clear session if needed
        if (e.detail?.message?.includes('interrupted')) {
          clearStaleSessions();
        }
      });
      
      return () => {
        window.removeEventListener('walletconnect_error', () => {});
      };
    } catch (error) {
      console.error('Error managing WalletConnect sessions:', error);
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider 
        theme={darkTheme()} 
        modalSize="compact"
        showRecentTransactions={true}
      >
        {connectionError && (
          <div className="wallet-connection-error">
            <p>Connection Error: {connectionError}</p>
            <button onClick={() => {
              // Clear local storage and reload
              Object.keys(localStorage)
                .filter(key => key.startsWith('wc'))
                .forEach(key => localStorage.removeItem(key));
              window.location.reload();
            }}>
              Reset Connection
            </button>
            <style jsx>{`
              .wallet-connection-error {
                position: fixed;
                top: 60px;
                right: 20px;
                background: #ff3333;
                color: white;
                padding: 12px;
                border-radius: 8px;
                z-index: 1000;
                max-width: 300px;
              }
              .wallet-connection-error button {
                background: white;
                color: #333;
                border: none;
                padding: 5px 10px;
                border-radius: 4px;
                margin-top: 8px;
                cursor: pointer;
              }
            `}</style>
          </div>
        )}
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
} 