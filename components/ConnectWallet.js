import React, { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export default function ConnectWallet() {
  const { isConnected } = useAccount();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Listen for sidebar state changes via custom event
  useEffect(() => {
    const handleSidebarStateChange = (e) => {
      setSidebarOpen(e.detail.isOpen);
    };
    
    // Add event listener for custom event
    document.addEventListener('sidebarStateChange', handleSidebarStateChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('sidebarStateChange', handleSidebarStateChange);
    };
  }, []);
  
  return (
    <div 
      className={`fixed top-5 z-50 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'right-[280px]' : 'right-5'
      }`}
    >
      <div className="bg-[#1a1f2e]/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-gray-700">
        <ConnectButton 
          label="Connect Wallet"
          showBalance={false}
          chainStatus="icon"
          accountStatus="address"
        />
      </div>
    </div>
  );
} 