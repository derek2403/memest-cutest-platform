import { useEffect } from 'react';
import { useConnect } from 'wagmi';

// Custom hook to handle WalletConnect initialization and error recovery
export function useWalletConnectFixes() {
  const { connectors } = useConnect();
  
  useEffect(() => {
    // Check for localStorage to ensure we're in browser environment
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    // Clear stale WalletConnect sessions that might be causing issues
    const clearStaleSessions = () => {
      try {
        const sessionStorage = window.localStorage;
        // Look for any v1 and stale v2 sessions
        const staleKeys = Object.keys(sessionStorage).filter(key => 
          key.startsWith('wc@') || // v1 keys
          key.startsWith('walletconnect') || // default v1 bridge keys
          key.includes('wc_session') || // common session keys
          (key.startsWith('wc_memest_cutest') && key.includes('0.0.1')) // outdated version keys
        );
        
        if (staleKeys.length > 0) {
          console.log(`Cleaning up ${staleKeys.length} stale WalletConnect sessions`);
          staleKeys.forEach(key => {
            sessionStorage.removeItem(key);
          });
        }
      } catch (error) {
        console.error('Error clearing stale sessions:', error);
      }
    };
    
    // Initialize clean-up
    clearStaleSessions();
    
    // Connection recovery function
    const attemptConnectionRecovery = async () => {
      try {
        // Find the WalletConnect connector from the available connectors
        const walletConnectConnector = connectors.find(c => 
          c.name.toLowerCase().includes('walletconnect')
        );
        
        if (walletConnectConnector) {
          if (walletConnectConnector.reconnect) {
            await walletConnectConnector.reconnect();
          }
        }
      } catch (error) {
        console.error('Error recovering connection:', error);
      }
    };
    
    // Handle manual connection reset
    window.resetWalletConnection = () => {
      clearStaleSessions();
      window.location.reload();
    };
    
    // Event listeners for common WalletConnect error scenarios
    const handleVisibilityChange = () => {
      // When tab becomes visible again, check if we need to reconnect
      if (document.visibilityState === 'visible') {
        attemptConnectionRecovery();
      }
    };
    
    // Network change handler
    const handleNetworkChange = () => {
      if (navigator.onLine) {
        attemptConnectionRecovery();
      }
    };
    
    // Subscribe to connection status changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleNetworkChange);
    
    // Trigger a custom event for detecting connection issues
    const detectConnectionIssues = setInterval(() => {
      // Check for broken connections by looking for specific error patterns in console
      const consoleErrors = window.performance
        .getEntries()
        .filter(entry => 
          entry.entryType === 'resource' && 
          entry.name.includes('walletconnect') && 
          entry.name.includes('relay') &&
          entry.duration > 5000 // Long duration suggests timeout
        );
      
      if (consoleErrors.length > 0) {
        document.dispatchEvent(new CustomEvent('walletconnect_unstable'));
      }
    }, 15000);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleNetworkChange);
      clearInterval(detectConnectionIssues);
    };
  }, [connectors]);
  
  return null;
}

// Component wrapper for WalletConnect fixes
export default function WalletConnect() {
  useWalletConnectFixes();
  return null;
} 