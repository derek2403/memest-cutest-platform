import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  
  // Transaction states
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState(null);
//
  // Wagmi hooks for sending transaction
  const { sendTransaction, isPending, isSuccess, data: hash } = useSendTransaction();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setStatus(data);
      
      if (data.verificationPending) {
        checkVerificationStatus();
      }
    } catch (error) {
      setStatus({ error: 'Failed to send verification email' });
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    try {
      // Validate transaction with backend
      const response = await fetch('http://localhost:3001/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipient,
          amount,
          chainId,
        }),
      });
      
      const data = await response.json();
      if (!data.success) {
        setTxStatus({ error: data.message });
        return;
      }

      // Send transaction using wagmi
      sendTransaction({
        to: recipient,
        value: parseEther(amount),
        chainId,
      });
      
    } catch (error) {
      setTxStatus({ error: error.message });
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const response = await fetch(`http://localhost:3001/email/status?email=${email}`);
      const data = await response.json();
      setStatus(data);
      
      if (!data.verified) {
        setTimeout(checkVerificationStatus, 5000);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const getBlockExplorerUrl = () => {
    const explorers = {
      1: 'https://etherscan.io',
      11155111: 'https://sepolia.etherscan.io',
      421614: 'https://sepolia.arbiscan.io',
      84532: 'https://sepolia.basescan.org',
      // Add more chains as needed
    };
    return explorers[chainId] || 'https://etherscan.io';
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="absolute top-0 right-0 p-4">
        <ConnectButton />
      </div>
      
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              {/* Email Verification Section */}
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold mb-8">Email Verification</h2>
                
                {!isConnected ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">Please connect your wallet first</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Verify Email'}
                    </button>
                  </form>
                )}
                
                {status && (
                  <div className="mt-4 p-4 rounded-md bg-gray-50">
                    <pre className="text-sm">
                      {JSON.stringify(status, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Transaction Section */}
              {isConnected && (
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h2 className="text-2xl font-bold mb-8">Send Transaction</h2>
                  <form onSubmit={handleTransaction} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Recipient Address
                      </label>
                      <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="0x..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Amount (ETH)
                      </label>
                      <input
                        type="number"
                        step="0.000000000000000001"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="0.0"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {isPending ? 'Sending...' : 'Send'}
                    </button>
                  </form>

                  {isSuccess && (
                    <div className="mt-4 p-4 rounded-md bg-green-50 text-green-700">
                      <p>Transaction successful!</p>
                      <a
                        href={`${getBlockExplorerUrl()}/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-500 underline"
                      >
                        View on Explorer
                      </a>
                    </div>
                  )}

                  {txStatus?.error && (
                    <div className="mt-4 p-4 rounded-md bg-red-50 text-red-700">
                      {txStatus.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
