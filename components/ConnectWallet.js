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
      <div className="custom-connect-button">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const ready = mounted;
            const connected = ready && account && chain;
            
            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  style: {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button 
                        onClick={openConnectModal}
                        className="connect-button"
                      >
                        <span className="connect-text">Connect Wallet</span>
                      </button>
                    );
                  }
                  
                  return (
                    <div className="connected-container">
                      <button 
                        onClick={openChainModal}
                        className="chain-button" 
                      >
                        {chain.hasIcon && (
                          <div className="chain-icon">
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                style={{ width: 20, height: 20 }}
                              />
                            )}
                          </div>
                        )}
                        <span className="chain-name">{chain.name}</span>
                      </button>
                      
                      <button 
                        onClick={openAccountModal}
                        className="account-button"
                      >
                        <span className="account-address">
                          {account.displayName}
                        </span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
      
      <style jsx>{`
        .custom-connect-button {
          font-family: 'Poppins', sans-serif;
        }
        
        .connect-button {
          background-color: #1a1f2e;
          border: none;
          box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);
          border-radius: 30px;
          color: #ffffff;
          padding: 10px 20px;
          font-weight: 500;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          min-width: 180px;
        }
        
        .connect-button:hover {
          filter: brightness(1.1);
        }
        
        .connect-button:active {
          transform: translateY(1px);
        }
        
        .connect-text {
          color: #FFFFFF;
          white-space: nowrap;
          font-weight: 600;
        }
        
        .connected-container {
          display: flex;
          gap: 8px;
        }
        
        .chain-button {
          background-color: #2e2370;
          border: none;
          box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.25);
          border-radius: 30px;
          color: #ffffff;
          padding: 8px 14px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        
        .chain-button:hover {
          filter: brightness(1.1);
        }
        
        .chain-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .chain-name {
          font-weight: 500;
          color: #FFFFFF;
        }
        
        .account-button {
          background-color: #1a1f2e;
          border: none;
          box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.25);
          border-radius: 30px;
          color: #ffffff;
          padding: 8px 14px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s ease;
        }
        
        .account-button:hover {
          filter: brightness(1.1);
        }
        
        .account-address {
          font-weight: 500;
          color: #FFFFFF;
        }
      `}</style>
    </div>
  );
} 