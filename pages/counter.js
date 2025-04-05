import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Header from '../components/Header';
import { getCounterValue } from '../mcp-server/scripts/events';
import CounterABI from '../utils/abi.json';

// Counter contract details
const COUNTER_CONTRACT_ADDRESS = '0xFaDC1F029af77faE9405B9f565b92Ec0B59130E1';

export default function CounterPage() {
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [transactionPending, setTransactionPending] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState(null);

  // Function to fetch the current count
  const fetchCount = async () => {
    try {
      setLoading(true);
      const result = await getCounterValue(COUNTER_CONTRACT_ADDRESS);
      if (result.success) {
        setCount(result.value);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch count');
      }
    } catch (err) {
      setError('Error fetching count: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch contract events directly using ethers v6
  const fetchEvents = async () => {
    try {
      if (!provider) {
        // Use a default provider if user is not connected
        const defaultProvider = new ethers.JsonRpcProvider('https://polygon-amoy.g.alchemy.com/v2/FgSucpeM2ptJ9lxAtCUQ5AqtJl4W8kzN');
        const contract = new ethers.Contract(COUNTER_CONTRACT_ADDRESS, CounterABI, defaultProvider);
        
        // Create filter for CountUpdated events
        const filter = contract.filters.CountUpdated;
        
        // Get logs from past events
        const logs = await defaultProvider.getLogs({
          address: COUNTER_CONTRACT_ADDRESS,
          topics: [ethers.id("CountUpdated(uint256)")],
          fromBlock: 0,
          toBlock: "latest"
        });
        
        // Format events
        const formattedEvents = await Promise.all(logs.map(async (log) => {
          try {
            const parsedLog = contract.interface.parseLog({
              topics: log.topics,
              data: log.data
            });
            
            const block = await defaultProvider.getBlock(log.blockNumber);
            
            return {
              name: 'CountUpdated',
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              logIndex: log.index || log.logIndex,
              timestamp: block ? new Date(block.timestamp * 1000).toISOString() : null,
              args: {
                newCount: parsedLog.args[0].toString()
              }
            };
          } catch (err) {
            console.error('Error parsing log:', err);
            return {
              name: 'CountUpdated',
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              error: 'Could not parse event data'
            };
          }
        }));
        
        setEvents(formattedEvents);
      } else {
        // Use the connected provider if available
        const contract = new ethers.Contract(COUNTER_CONTRACT_ADDRESS, CounterABI, provider);
        
        // Get logs from past events
        const logs = await provider.getLogs({
          address: COUNTER_CONTRACT_ADDRESS,
          topics: [ethers.id("CountUpdated(uint256)")],
          fromBlock: 0,
          toBlock: "latest"
        });
        
        // Format events
        const formattedEvents = await Promise.all(logs.map(async (log) => {
          try {
            const parsedLog = contract.interface.parseLog({
              topics: log.topics,
              data: log.data
            });
            
            const block = await provider.getBlock(log.blockNumber);
            
            return {
              name: 'CountUpdated',
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              logIndex: log.index || log.logIndex,
              timestamp: block ? new Date(block.timestamp * 1000).toISOString() : null,
              args: {
                newCount: parsedLog.args[0].toString()
              }
            };
          } catch (err) {
            console.error('Error parsing log:', err);
            return {
              name: 'CountUpdated',
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              error: 'Could not parse event data'
            };
          }
        }));
        
        setEvents(formattedEvents);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  // Initialize
  useEffect(() => {
    fetchCount();
    fetchEvents();

    // Check if wallet is already connected (via MetaMask or similar)
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletConnected(true);
            setWalletAddress(accounts[0]);
            
            // Initialize provider
            const ethersProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(ethersProvider);
            
            // Setup event listening
            setupEventListener(ethersProvider);
          }
          
          // Listen for account changes
          window.ethereum.on('accountsChanged', (newAccounts) => {
            if (newAccounts.length > 0) {
              setWalletConnected(true);
              setWalletAddress(newAccounts[0]);
              
              // Refresh provider on account change
              const ethersProvider = new ethers.BrowserProvider(window.ethereum);
              setProvider(ethersProvider);
              
              // Setup event listening
              setupEventListener(ethersProvider);
            } else {
              setWalletConnected(false);
              setWalletAddress('');
              setProvider(null);
            }
          });
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };

    checkWalletConnection();

    // Cleanup function
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  // Setup event listener for real-time updates
  const setupEventListener = (ethersProvider) => {
    if (!ethersProvider) return;
    
    try {
      const contract = new ethers.Contract(COUNTER_CONTRACT_ADDRESS, CounterABI, ethersProvider);
      
      // Listen for CountUpdated events (ethers v6 way)
      contract.on("CountUpdated", (newCount) => {
        // Update the UI when event is received
        setCount(newCount.toString());
        // Refresh events list
        fetchEvents();
      });
      
      return () => {
        contract.removeAllListeners("CountUpdated");
      };
    } catch (err) {
      console.error("Error setting up event listener:", err);
    }
  };

  // Function to connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('No Ethereum wallet detected. Please install MetaMask or another wallet.');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
        
        // Initialize provider
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethersProvider);
        
        // Setup event listening
        setupEventListener(ethersProvider);
        
        setError(null);
      }
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
      console.error(err);
    }
  };

  // Function to interact with the contract methods
  const interactWithContract = async (method, value = null) => {
    if (!walletConnected || !provider) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setTransactionPending(true);
      setError(null);
      
      // Get signer
      const signer = await provider.getSigner();
      
      const contract = new ethers.Contract(
        COUNTER_CONTRACT_ADDRESS,
        CounterABI,
        signer
      );
      
      let transaction;
      
      if (method === 'increment') {
        transaction = await contract.increment();
      } else if (method === 'decrement') {
        transaction = await contract.decrement();
      } else if (method === 'reset') {
        transaction = await contract.reset();
      } else if (method === 'setCount') {
        if (value === null) {
          throw new Error('Value is required for setCount');
        }
        transaction = await contract.setCount(value);
      }
      
      setTransactionHash(transaction.hash);
      
      // Wait for transaction to be mined
      await transaction.wait();
      await fetchCount();
      await fetchEvents();
      
    } catch (err) {
      setError('Transaction failed: ' + err.message);
      console.error(err);
    } finally {
      setTransactionPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          Counter Smart Contract Interaction
        </h1>
        
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-8">
          {!walletConnected && (
            <div className="text-center mb-6">
              <button
                onClick={connectWallet}
                className="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Connect Wallet
              </button>
              {error && <div className="text-red-500 mt-2">{error}</div>}
            </div>
          )}
          
          {walletConnected && (
            <div className="text-center mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Connected: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </span>
            </div>
          )}
          
          <div className="flex justify-center items-center mb-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">Current Count</h2>
              {loading ? (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-14 w-20 mx-auto"></div>
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : (
                <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400">{count}</div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <button
              onClick={() => interactWithContract('increment')}
              disabled={transactionPending || !walletConnected}
              className="px-5 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Increment
            </button>
            
            <button
              onClick={() => interactWithContract('decrement')}
              disabled={transactionPending || !walletConnected}
              className="px-5 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Decrement
            </button>
            
            <button
              onClick={() => interactWithContract('reset')}
              disabled={transactionPending || !walletConnected}
              className="px-5 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter new count"
              className="border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md px-4 py-2 w-full sm:w-auto"
            />
            <button
              onClick={() => interactWithContract('setCount', inputValue)}
              disabled={transactionPending || !walletConnected || inputValue === ''}
              className="px-5 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              Set Count
            </button>
          </div>
          
          {transactionPending && (
            <div className="text-center mt-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
              <span className="text-indigo-500">Processing transaction...</span>
              {transactionHash && (
                <div className="mt-2">
                  <a 
                    href={`https://amoy.polygonscan.com/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View on PolygonScan
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
            Event History
          </h2>
          
          {events.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No events found for this contract
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Block / Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      New Count
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {events.map((event, index) => {
                    const timestamp = event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Unknown';
                    return (
                      <tr key={`${event.transactionHash}-${event.logIndex}`} className={index % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-800'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{event.blockNumber}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{timestamp}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a 
                            href={`https://amoy.polygonscan.com/tx/${event.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline text-sm"
                          >
                            {event.transactionHash.substring(0, 10)}...
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {event.args?.newCount || 'N/A'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
