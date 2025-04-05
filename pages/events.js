import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// Define blockchain networks
const NETWORKS = [
  { id: 'polygonAmoy', name: 'Polygon Amoy Testnet', rpcUrl: 'https://polygon-amoy.g.alchemy.com/v2/FgSucpeM2ptJ9lxAtCUQ5AqtJl4W8kzN' },
  { id: 'sepolia', name: 'Sepolia Testnet', rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/FgSucpeM2ptJ9lxAtCUQ5AqtJl4W8kzN' },
  { id: 'mainnet', name: 'Ethereum Mainnet', rpcUrl: 'https://cloudflare-eth.com' },
  { id: 'polygon', name: 'Polygon', rpcUrl: 'https://polygon-rpc.com' },
  { id: 'arbitrum', name: 'Arbitrum', rpcUrl: 'https://arb1.arbitrum.io/rpc' },
  { id: 'optimism', name: 'Optimism', rpcUrl: 'https://mainnet.optimism.io' },
];

// Counter Contract ABI
const COUNTER_ABI = [
  "function getCount() view returns (uint256)",
  "function increment()",
  "function decrement()",
  "function reset()",
  "function setCount(uint256 newCount)",
  "event CountUpdated(uint256 newCount)"
];

// ABI fragment for common events
const EVENTS_ABI_FRAGMENT = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

export default function Events() {
  const { isConnected } = useAccount();
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]); // Default to Polygon Amoy
  const [contractAddress, setContractAddress] = useState('0xFaDC1F029af77faE9405B9f565b92Ec0B59130E1');
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [customAbi, setCustomAbi] = useState('');
  const [useCustomAbi, setUseCustomAbi] = useState(false);
  const [contractType, setContractType] = useState('counter'); // 'counter' or 'other'
  const [count, setCount] = useState(null);

  // Load current count if Counter contract is selected
  useEffect(() => {
    if (contractAddress && contractType === 'counter' && selectedNetwork) {
      fetchCurrentCount();
    }
  }, [contractAddress, contractType, selectedNetwork]);

  const fetchCurrentCount = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(selectedNetwork.rpcUrl);
      const contract = new ethers.Contract(contractAddress, COUNTER_ABI, provider);
      const currentCount = await contract.getCount();
      setCount(currentCount.toString());
    } catch (error) {
      console.error('Error fetching count:', error);
      setCount(null);
    }
  };

  const fetchEvents = async () => {
    if (!contractAddress) {
      setError('Please enter a contract address');
      return;
    }

    setError('');
    setIsLoading(true);
    setEvents([]);

    try {
      // Create provider for selected network
      const provider = new ethers.JsonRpcProvider(selectedNetwork.rpcUrl);
      
      // Create contract instance
      let contract;
      if (useCustomAbi && customAbi) {
        try {
          const parsedAbi = JSON.parse(customAbi);
          contract = new ethers.Contract(contractAddress, parsedAbi, provider);
        } catch (e) {
          setError('Invalid ABI format. Please provide valid JSON ABI.');
          setIsLoading(false);
          return;
        }
      } else if (contractType === 'counter') {
        contract = new ethers.Contract(contractAddress, COUNTER_ABI, provider);
      } else {
        contract = new ethers.Contract(contractAddress, EVENTS_ABI_FRAGMENT, provider);
      }

      // Get all events
      const filter = {
        address: contractAddress,
        fromBlock: 0,
        toBlock: 'latest'
      };

      const logs = await provider.getLogs(filter);
      
      // Format events
      const formattedEvents = await Promise.all(logs.map(async (log) => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          const block = await provider.getBlock(log.blockNumber);
          
          return {
            name: parsedLog?.name || 'Unknown Event',
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            timestamp: block ? new Date(block.timestamp * 1000).toLocaleString() : 'Unknown',
            args: parsedLog?.args ? Object.entries(parsedLog.args)
              .filter(([key]) => !key.match(/^\d+$/)) // Filter out numeric indices
              .reduce((obj, [key, value]) => {
                obj[key] = value?.toString() || value;
                return obj;
              }, {}) : {}
          };
        } catch (error) {
          console.error('Error parsing log:', error);
          return {
            name: 'Unknown Event',
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            error: 'Could not parse event data'
          };
        }
      }));

      setEvents(formattedEvents);
      // Refresh the count after fetching events if it's a counter contract
      if (contractType === 'counter') {
        fetchCurrentCount();
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      
      // Better error message for CORS issues
      if (error.message && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') ||
        error.message.includes('CORS')
      )) {
        setError(`Network error: The RPC endpoint for ${selectedNetwork.name} might be blocking requests from browsers. Try using a different network or a provider like Alchemy or Infura.`);
      } else {
        setError(`Error fetching events: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to interact with Counter contract
  const interactWithCounter = async (action, value = null) => {
    if (!contractAddress) {
      setError('Please enter a contract address');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Need to use a signer for transactions
      if (!window.ethereum) {
        throw new Error("MetaMask or compatible wallet not detected");
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, COUNTER_ABI, signer);
      
      let tx;
      switch (action) {
        case 'increment':
          tx = await contract.increment();
          break;
        case 'decrement':
          tx = await contract.decrement();
          break;
        case 'reset':
          tx = await contract.reset();
          break;
        case 'setCount':
          if (value === null) throw new Error("No value provided for setCount");
          tx = await contract.setCount(value);
          break;
        default:
          throw new Error("Invalid action");
      }
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Refresh data
      fetchCurrentCount();
      fetchEvents();
      
    } catch (error) {
      console.error(`Error in ${action}:`, error);
      setError(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Smart Contract Events Explorer</h1>
        
        <div className="mb-6">
          <ConnectButton />
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="contractType"
                  value="counter"
                  checked={contractType === 'counter'}
                  onChange={() => setContractType('counter')}
                />
                <span className="ml-2">Counter Contract</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="contractType"
                  value="other"
                  checked={contractType === 'other'}
                  onChange={() => setContractType('other')}
                />
                <span className="ml-2">Other Contract</span>
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Blockchain</label>
              <select
                value={selectedNetwork.id}
                onChange={(e) => setSelectedNetwork(NETWORKS.find(n => n.id === e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {NETWORKS.map((network) => (
                  <option key={network.id} value={network.id}>
                    {network.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                For production use, replace with your own API keys from providers like Alchemy or Infura.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contract Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={fetchEvents}
                disabled={isLoading || !contractAddress}
                className={`w-full p-2 rounded-md ${
                  isLoading || !contractAddress
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isLoading ? 'Loading...' : 'Fetch Events'}
              </button>
            </div>
          </div>
          
          {contractType === 'counter' && count !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Counter Value: {count}</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => interactWithCounter('increment')}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  disabled={isLoading}
                >
                  Increment
                </button>
                <button 
                  onClick={() => interactWithCounter('decrement')}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  disabled={isLoading}
                >
                  Decrement
                </button>
                <button 
                  onClick={() => interactWithCounter('reset')}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  disabled={isLoading}
                >
                  Reset
                </button>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    placeholder="New value"
                    className="w-24 p-1 border border-gray-300 rounded-md mr-2"
                    id="newCountValue"
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('newCountValue');
                      if (input && input.value) {
                        interactWithCounter('setCount', parseInt(input.value));
                      }
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    disabled={isLoading}
                  >
                    Set Value
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {contractType === 'other' && (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="useCustomAbi"
                  checked={useCustomAbi}
                  onChange={(e) => setUseCustomAbi(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="useCustomAbi" className="text-sm font-medium text-gray-700">
                  Use Custom ABI (for non-standard events)
                </label>
              </div>
              
              {useCustomAbi && (
                <textarea
                  placeholder="Paste contract ABI as JSON array"
                  value={customAbi}
                  onChange={(e) => setCustomAbi(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md h-32 font-mono text-sm"
                />
              )}
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}
        </div>

        {events.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <h2 className="text-xl font-semibold p-4 border-b">
              Events ({events.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Block / Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parameters
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {event.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{event.blockNumber}</div>
                        <div className="text-xs">{event.timestamp}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <a
                          href={`https://${selectedNetwork.id === 'mainnet' ? '' : selectedNetwork.id + '.'}etherscan.io/tx/${event.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {event.transactionHash.substring(0, 10)}...
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {event.error ? (
                          <span className="text-red-500">{event.error}</span>
                        ) : (
                          <div className="max-w-lg">
                            {Object.entries(event.args).map(([key, value]) => (
                              <div key={key} className="mb-1">
                                <span className="font-medium">{key}:</span>{' '}
                                <span className="font-mono text-xs break-all">
                                  {typeof value === 'object' ? JSON.stringify(value) : value}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !isLoading && (
            <div className="bg-white rounded-lg shadow p-16 text-center text-gray-500">
              No events found. Select a blockchain and enter a contract address to fetch events.
            </div>
          )
        )}
      </div>
    </div>
  );
}
