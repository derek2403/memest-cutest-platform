import React, { useState, useEffect } from 'react';

export default function WalletConnectError() {
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen for wallet connection errors
    const handleError = (e) => {
      if (
        e.message?.includes('walletconnect') || 
        e.message?.includes('connection interrupted') ||
        e.message?.includes('subscribe')
      ) {
        const errorInfo = parseWalletConnectError(e.message || 'Connection error');
        setError(errorInfo);
      }
    };

    // Custom event for wallet connection errors
    const handleCustomError = (e) => {
      if (e.detail?.message) {
        const errorInfo = parseWalletConnectError(e.detail.message);
        setError(errorInfo);
      }
    };

    // Parse WalletConnect errors to determine cause and solution
    const parseWalletConnectError = (message) => {
      // Check for version incompatibility
      if (message.includes('bridge.walletconnect') || message.includes('v1.0')) {
        return {
          title: 'Outdated WalletConnect Version',
          message: 'Your connection is using an outdated version of WalletConnect.',
          solution: 'Clear your wallet connection and reconnect to use the latest version.',
          type: 'version'
        };
      }
      
      // Check for network restrictions
      if (message.includes('timeout') || message.includes('interrupted')) {
        return {
          title: 'Connection Interrupted',
          message: 'The connection to WalletConnect was interrupted or timed out.',
          solution: 'This may be due to network restrictions or firewall issues. Try using a different network connection.',
          type: 'network'
        };
      }
      
      // Check for stale sessions
      if (message.includes('session') || message.includes('expired')) {
        return {
          title: 'Session Expired',
          message: 'Your wallet connection session has expired or is invalid.',
          solution: 'Reset your wallet connection and try again.',
          type: 'session'
        };
      }
      
      // Default error
      return {
        title: 'Connection Error',
        message: message,
        solution: 'Try resetting your wallet connection or using a different wallet app.',
        type: 'unknown'
      };
    };

    // Listen for WalletConnect errors
    window.addEventListener('error', handleError);
    document.addEventListener('walletconnect_error', handleCustomError);
    document.addEventListener('walletconnect_unstable', () => {
      setError({
        title: 'Unstable Connection',
        message: 'Your WalletConnect connection appears to be unstable.',
        solution: 'Consider switching to a more stable network or using a different wallet app.',
        type: 'network'
      });
    });

    return () => {
      window.removeEventListener('error', handleError);
      document.removeEventListener('walletconnect_error', handleCustomError);
      document.removeEventListener('walletconnect_unstable', () => {});
    };
  }, []);

  // Clear the error and reset wallet connection
  const handleReset = () => {
    // Clear all WalletConnect related items from localStorage
    if (window.localStorage) {
      Object.keys(window.localStorage)
        .filter(key => 
          key.startsWith('wc') || 
          key.includes('walletconnect') || 
          key.includes('WALLETCONNECT')
        )
        .forEach(key => window.localStorage.removeItem(key));
    }
    
    // Reload the page to reset the connection
    window.location.reload();
  };

  if (!error) return null;

  return (
    <div className="wallet-error-container">
      <div className="wallet-error-card">
        <div className="wallet-error-header">
          <h3>{error.title}</h3>
          <button 
            className="wallet-error-close" 
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
        
        <div className="wallet-error-content">
          <p>{error.message}</p>
          <p className="wallet-error-solution">{error.solution}</p>
          
          {showDetails && (
            <div className="wallet-error-details">
              <p><strong>Error Type:</strong> {error.type}</p>
              {error.type === 'version' && (
                <p>WalletConnect v1.0 is deprecated and no longer supported. Update to v2.0.</p>
              )}
              {error.type === 'network' && (
                <p>Some regions block WalletConnect relays. Try using a VPN or different network.</p>
              )}
              {error.type === 'session' && (
                <p>Disconnect all sessions in your wallet app, clear browser cache, and reconnect.</p>
              )}
            </div>
          )}
          
          <div className="wallet-error-actions">
            <button 
              className="wallet-error-button wallet-error-details-button" 
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
            <button 
              className="wallet-error-button wallet-error-reset-button" 
              onClick={handleReset}
            >
              Reset Connection
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .wallet-error-container {
          position: fixed;
          top: 70px;
          right: 20px;
          z-index: 1000;
          max-width: 350px;
          font-family: 'Poppins', sans-serif;
        }
        
        .wallet-error-card {
          background: rgba(35, 35, 52, 0.95);
          border: 1px solid rgba(255, 100, 100, 0.5);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          backdrop-filter: blur(10px);
        }
        
        .wallet-error-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255, 75, 75, 0.9);
          color: white;
        }
        
        .wallet-error-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .wallet-error-close {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        
        .wallet-error-content {
          padding: 16px;
          color: white;
        }
        
        .wallet-error-content p {
          margin: 0 0 12px;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .wallet-error-solution {
          color: #ffcc66;
          font-weight: 500;
        }
        
        .wallet-error-details {
          margin-top: 12px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          font-size: 13px;
        }
        
        .wallet-error-actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }
        
        .wallet-error-button {
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        
        .wallet-error-details-button {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .wallet-error-reset-button {
          background: rgba(255, 100, 100, 0.8);
          color: white;
        }
        
        .wallet-error-button:hover {
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
} 