import '../styles/globals.css';
import '../styles/sidebar.css';
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

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      {mounted ? (
        <WalletProviders>
          <Component {...pageProps} />
        </WalletProviders>
      ) : null}
    </QueryClientProvider>
  );
}

export default MyApp; 