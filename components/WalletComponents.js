import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';

export default function WalletComponents({ onLoad }) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  
  // Provide wallet data to parent component
  useEffect(() => {
    if (onLoad && typeof onLoad === 'function') {
      const walletData = {
        isConnected,
        address,
        chainId,
        getBlockExplorerUrl: () => {
          const explorers = {
            1: 'https://etherscan.io',
            11155111: 'https://sepolia.etherscan.io',
            421614: 'https://sepolia.arbiscan.io',
            84532: 'https://sepolia.basescan.org',
          };
          return explorers[chainId] || 'https://etherscan.io';
        }
      };
      
      onLoad(walletData);
    }
  }, [isConnected, address, chainId, onLoad]);
  
  // This component doesn't render anything visible
  return null;
} 