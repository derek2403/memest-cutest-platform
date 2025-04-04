import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { Geist, Geist_Mono } from "next/font/google";
import { ethers } from 'ethers';

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
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  
  // Transaction states
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState(null);
  
  // Report states
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportStatus, setReportStatus] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Add state for email input and loading
  const [reportEmail, setReportEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState(null);

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
    setTxStatus(null);
    try {
      // First, check if email exists
      if (!email) {
        setTxStatus({ error: 'Please enter an email for transaction approval' });
        return;
      }
      
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
          email, // Include email for approval
        }),
      });
      
      const data = await response.json();
      if (!data.success) {
        setTxStatus({ error: data.message });
        return;
      }

      // If transaction approval email was sent
      if (data.message && data.message.includes('pending approval')) {
        setTxStatus({ 
          pending: true, 
          message: 'Transaction pending email approval. Please check your email and click "Approve" to execute the transaction.' 
        });
        return;
      }
      
      // If we get here, it means the backend processed the transaction immediately
      setTxStatus({
        success: true,
        message: 'Transaction submitted',
        data
      });
    } catch (error) {
      setTxStatus({ error: error.message });
    }
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setReportLoading(true);
    setReportStatus(null);
    
    try {
      // Validate month input
      if (!month) {
        setReportStatus({ error: 'Please select a month' });
        setReportLoading(false);
        return;
      }
      
      const response = await fetch('http://localhost:3001/transactions/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address, // Current connected wallet address
          chainId,
          month,
          year
        }),
      });
      
      const data = await response.json();
      
      setReportStatus(data);
    } catch (error) {
      setReportStatus({ 
        success: false, 
        error: error.message || 'Failed to generate report' 
      });
    } finally {
      setReportLoading(false);
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
  
  // Generate array of month names for dropdown
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];
  
  // Years for dropdown (current year and 2 previous years)
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  // Add a handler for sending the email report with graphs
  const handleEmailReport = async () => {
    setEmailLoading(true);
    setEmailResult(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/transactions/graphs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          chainId,
          month,
          year,
          email: reportEmail || 'derekliew0@gmail.com' // Default email if not provided
        }),
      });
      
      const result = await response.json();
      setEmailResult(result);
    } catch (error) {
      setEmailResult({
        success: false,
        error: error.message
      });
    } finally {
      setEmailLoading(false);
    }
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
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold mb-8">Send Transaction</h2>
                
                {!isConnected ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">Please connect your wallet first</p>
                  </div>
                ) : (
                  <form onSubmit={handleTransaction} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email for Transaction Approval
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
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
                      disabled={loading || txStatus?.pending}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading || txStatus?.pending ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                )}

                {/* Transaction Status Display */}
                {txStatus?.pending && (
                  <div className="mt-4 p-4 rounded-md bg-yellow-50 text-yellow-700">
                    <p>{txStatus.message}</p>
                  </div>
                )}

                {txStatus?.success && (
                  <div className="mt-4 p-4 rounded-md bg-green-50 text-green-700">
                    <p>{txStatus.message}</p>
                    {txStatus.data?.hash && (
                      <a
                        href={`${getBlockExplorerUrl()}/tx/${txStatus.data.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-500 underline"
                      >
                        View on Explorer
                      </a>
                    )}
                  </div>
                )}

                {txStatus?.error && (
                  <div className="mt-4 p-4 rounded-md bg-red-50 text-red-700">
                    {txStatus.error}
                  </div>
                )}
              </div>
              
              {/* Transaction Report Section */}
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold mb-8">Transaction Report</h2>
                
                {!isConnected ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">Please connect your wallet first</p>
                  </div>
                ) : (
                  <form onSubmit={handleGenerateReport} className="space-y-6">
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Month
                        </label>
                        <select
                          value={month}
                          onChange={(e) => setMonth(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          required
                        >
                          <option value="">Select Month</option>
                          {months.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Year
                        </label>
                        <select
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          required
                        >
                          {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <p className="text-sm text-gray-600">
                        Connected Chain ID: {chainId}
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={reportLoading}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      {reportLoading ? 'Generating...' : 'Generate Report'}
                    </button>
                  </form>
                )}
                
                {/* Report Status Display */}
                {reportStatus?.success && (
                  <div className="mt-4 p-4 rounded-md bg-green-50 text-green-700">
                    <p className="mb-2">{reportStatus.message}</p>
                    
                    {reportStatus.error && (
                      <div className="mb-4 p-4 rounded-md bg-yellow-50 text-yellow-700 mt-3">
                        <p className="font-medium">{reportStatus.error}</p>
                        {reportStatus.setupInstructions && (
                          <div className="mt-3">
                            <p className="font-medium">Setup Instructions:</p>
                            <pre className="mt-2 whitespace-pre-wrap text-sm bg-yellow-100 p-3 rounded">
                              {reportStatus.setupInstructions}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {reportStatus.reportUrl && (
                      <div className="mt-3">
                        <p className="font-bold mb-2">Your report is ready:</p>
                        <a
                          href={reportStatus.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Open Google Sheet Report
                        </a>
                        <div className="mt-2 text-xs text-center text-gray-500 break-all">
                          <span className="font-medium">Link:</span> {reportStatus.reportUrl}
                        </div>
                      </div>
                    )}
                    
                    {reportStatus.fallback && !reportStatus.setupInstructions && (
                      <p className="text-sm mt-2 text-yellow-600">
                        Note: Using sample data - actual Google Sheet update failed. Check server logs for details.
                      </p>
                    )}
                    
                    {reportStatus.transactions && reportStatus.transactions.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-medium mb-2">Sample Transactions:</h3>
                        <div className="bg-white rounded-md shadow overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tx Hash</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {reportStatus.transactions.map((tx, index) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(tx.timestamp).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {typeof tx.amount === 'bigint' 
                                      ? ethers.formatEther(tx.amount) 
                                      : typeof tx.amount === 'string' 
                                        ? ethers.formatEther(tx.amount) 
                                        : tx.amount} ETH
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[200px]">
                                    {tx.hash}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {/* Add Email Report with Graphs section - moved to after transactions display */}
                    <div className="mt-6 p-4 border border-blue-100 rounded-md bg-blue-50">
                      <h3 className="font-bold text-blue-700 mb-3">Email Report with Graphs</h3>
                      <div className="flex space-x-2">
                        <input
                          type="email"
                          value={reportEmail}
                          onChange={(e) => setReportEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleEmailReport}
                          disabled={emailLoading}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {emailLoading ? (
                            <>
                              <span className="inline-block animate-spin mr-2">↻</span>
                              Sending...
                            </>
                          ) : (
                            'Send Graphs'
                          )}
                        </button>
                      </div>
                      
                      {emailResult && (
                        <div className={`mt-3 p-3 rounded-md ${emailResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          <p className="font-medium">
                            {emailResult.success 
                              ? `Graphs were sent to ${reportEmail || 'derekliew0@gmail.com'}` 
                              : `Failed to send graphs: ${emailResult.error}`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {reportStatus?.error && !reportStatus?.success && (
                  <div className="mt-4 p-4 rounded-md bg-red-50 text-red-700">
                    <p>{reportStatus.error || reportStatus.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
