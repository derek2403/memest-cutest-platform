import '../styles/globals.css';
import '../styles/sidebar.css';
import '../styles/aurora.css';
import React, { useEffect, useState } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

// Create react-query client
const queryClient = new QueryClient();

// Dynamically import wallet providers with SSR disabled
const WalletProviders = dynamic(
  () => import('../components/WalletProviders').then(mod => mod.default),
  { ssr: false }
);

// Dynamically import WalletConnect fixes with SSR disabled
const WalletConnect = dynamic(
  () => import('../components/WalletConnect').then(mod => mod.default),
  { ssr: false }
);

// Dynamically import WalletConnectError component with SSR disabled
const WalletConnectError = dynamic(
  () => import('../components/WalletConnectError').then(mod => mod.default),
  { ssr: false }
);

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Global error handler for WalletConnect issues
    const handleWalletConnectError = (error) => {
      console.error('WalletConnect global error:', error);
      
      // If we detect v1 bridge URLs, show a warning
      if (
        (error?.message && error.message.includes('bridge.walletconnect.org')) ||
        (window.localStorage && Object.keys(window.localStorage).some(key => 
          key.includes('walletconnect') && 
          JSON.stringify(window.localStorage[key]).includes('bridge.walletconnect.org')
        ))
      ) {
        console.warn('Detected WalletConnect v1 usage. This version is deprecated.');
        // Clean up v1 sessions by clearing localStorage items
        if (window.localStorage) {
          Object.keys(window.localStorage)
            .filter(key => key.startsWith('walletconnect') || key.startsWith('wc@'))
            .forEach(key => window.localStorage.removeItem(key));
        }
      }
    };
    
    window.addEventListener('error', handleWalletConnectError);
    
    return () => {
      window.removeEventListener('error', handleWalletConnectError);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      {mounted ? (
        <WalletProviders>
          {/* WalletConnect components for connection fixes */}
          <WalletConnect />
          <WalletConnectError />
          <Component {...pageProps} />
        </WalletProviders>
      ) : null}
    </QueryClientProvider>
  );
}

export default MyApp; 