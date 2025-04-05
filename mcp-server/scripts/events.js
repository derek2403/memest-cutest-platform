import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define Polygon Amoy RPC URL
const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL || 'https://polygon-amoy.g.alchemy.com/v2/FgSucpeM2ptJ9lxAtCUQ5AqtJl4W8kzN';

// Basic event ABI fragments for common events
const COMMON_EVENT_ABI_FRAGMENTS = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event CountUpdated(uint256 newCount)"
];

// Cache for contract instances
const contractCache = new Map();

/**
 * Helper function to validate Ethereum contract address
 * @param {string} address - Ethereum contract address to validate
 * @returns {boolean} - True if address is valid
 */
export function isValidContractAddress(address) {
  try {
    return ethers.isAddress(address);
  } catch (error) {
    return false;
  }
}

/**
 * Helper function to create a provider for Polygon Amoy
 * @returns {ethers.JsonRpcProvider} - Provider instance
 */
function getPolygonAmoyProvider() {
  return new ethers.JsonRpcProvider(POLYGON_AMOY_RPC_URL);
}

/**
 * Get a contract instance, using cache if available
 * @param {string} address - Contract address
 * @param {Array|string} abi - Contract ABI or ABI fragment
 * @returns {ethers.Contract} - Contract instance
 */
function getContractInstance(address, abi) {
  const cacheKey = `${address}-${JSON.stringify(abi)}`;
  
  if (contractCache.has(cacheKey)) {
    return contractCache.get(cacheKey);
  }
  
  const provider = getPolygonAmoyProvider();
  const contract = new ethers.Contract(address, abi, provider);
  
  // Cache the contract instance
  contractCache.set(cacheKey, contract);
  
  return contract;
}

/**
 * Format raw event logs into a more user-friendly structure
 * @param {Array} logs - Raw event logs from provider
 * @param {ethers.Contract} contract - Contract instance
 * @returns {Promise<Array>} - Formatted event objects
 */
async function formatEventLogs(logs, contract) {
  const provider = getPolygonAmoyProvider();
  
  return Promise.all(logs.map(async (log) => {
    try {
      // Use parseLog for ethers v6
      const parsedLog = contract.interface.parseLog(log);
      const block = await provider.getBlock(log.blockNumber);
      
      return {
        name: parsedLog?.name || 'Unknown Event',
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        blockHash: log.blockHash,
        logIndex: log.index,
        timestamp: block ? new Date(block.timestamp * 1000).toISOString() : null,
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
        blockHash: log.blockHash,
        logIndex: log.index,
        error: 'Could not parse event data'
      };
    }
  }));
}

/**
 * Get events for a smart contract on Polygon Amoy
 * @param {Object} options - Event fetching options
 * @param {string} options.contractAddress - Address of the contract
 * @param {string|Array} [options.abi] - ABI of the contract (optional)
 * @param {number|string} [options.fromBlock] - Start block (default: 0)
 * @param {number|string} [options.toBlock] - End block (default: 'latest')
 * @param {string} [options.eventName] - Specific event name to filter (optional)
 * @returns {Promise<Object>} - Object containing events or error
 */
export async function getContractEvents(options) {
  const { contractAddress, abi, fromBlock = 0, toBlock = 'latest', eventName } = options;
  
  // Validate contract address
  if (!isValidContractAddress(contractAddress)) {
    return {
      success: false,
      message: 'Invalid contract address',
      events: []
    };
  }
  
  try {
    // Create provider for Polygon Amoy
    const provider = getPolygonAmoyProvider();
    
    // Use provided ABI or fallback to common events
    const contractAbi = abi || COMMON_EVENT_ABI_FRAGMENTS;
    
    // Get contract instance
    const contract = getContractInstance(contractAddress, contractAbi);
    
    // Create filter for getting logs
    const filter = {
      address: contractAddress,
      fromBlock: fromBlock,
      toBlock: toBlock
    };
    
    // If event name is specified, create a specific filter for the event
    if (eventName) {
      try {
        // Fix for ethers v6: Get the event fragment first
        const eventFragment = contract.interface.getEvent(eventName);
        
        // Then get the topic using getTopicFilter() instead of getEventTopic()
        // In ethers v6, we can use fragment.topicHash or create a filter
        filter.topics = [ethers.id(eventFragment.format('sighash'))];
      } catch (error) {
        console.warn(`Error setting up event filter for ${eventName}:`, error.message);
        // Continue with just the address filter if we can't create a specific event filter
      }
    }
    
    // Get logs from provider
    const logs = await provider.getLogs(filter);
    
    // Format logs into more readable event objects
    const events = await formatEventLogs(logs, contract);
    
    return {
      success: true,
      message: `Found ${events.length} events`,
      events: events,
      contractAddress: contractAddress,
      chain: 'polygon-amoy'
    };
  } catch (error) {
    console.error('Error fetching contract events:', error);
    
    return {
      success: false,
      message: `Error fetching events: ${error.message}`,
      error: error.message,
      contractAddress: contractAddress,
      chain: 'polygon-amoy',
      events: []
    };
  }
}

/**
 * Monitor a contract for new events in real-time
 * @param {Object} options - Event monitoring options
 * @param {string} options.contractAddress - Address of the contract
 * @param {string|Array} [options.abi] - ABI of the contract (optional)
 * @param {string} [options.eventName] - Specific event name to filter (optional)
 * @param {Function} options.callback - Callback function for new events
 * @returns {Object} - Object containing unsubscribe function
 */
export function monitorContractEvents(options) {
  const { contractAddress, abi, eventName, callback } = options;
  
  // Validate contract address
  if (!isValidContractAddress(contractAddress)) {
    return {
      success: false,
      message: 'Invalid contract address',
      unsubscribe: () => {}
    };
  }
  
  try {
    // Create provider for Polygon Amoy
    const provider = getPolygonAmoyProvider();
    
    // Use provided ABI or fallback to common events
    const contractAbi = abi || COMMON_EVENT_ABI_FRAGMENTS;
    
    // Get contract instance
    const contract = getContractInstance(contractAddress, contractAbi);
    
    // Create filter for the specific event or all events
    let filter;
    if (eventName) {
      try {
        // In ethers v6, we need to use a different approach for event filters
        const eventFragment = contract.interface.getEvent(eventName);
        filter = {
          address: contractAddress,
          topics: [ethers.id(eventFragment.format('sighash'))]
        };
      } catch (error) {
        console.warn(`Warning: Could not create filter for event ${eventName}:`, error.message);
        filter = { address: contractAddress };
      }
    } else {
      filter = { address: contractAddress };
    }
    
    // Set up event listener
    const handleEvent = async (log) => {
      try {
        const formattedEvents = await formatEventLogs([log], contract);
        if (formattedEvents.length > 0 && typeof callback === 'function') {
          callback(formattedEvents[0]);
        }
      } catch (error) {
        console.error('Error handling event:', error);
      }
    };
    
    // Start listening for events
    provider.on(filter, handleEvent);
    
    // Return unsubscribe function
    return {
      success: true,
      message: `Monitoring events for contract ${contractAddress}`,
      unsubscribe: () => {
        provider.off(filter, handleEvent);
        return { success: true, message: 'Stopped monitoring events' };
      }
    };
  } catch (error) {
    console.error('Error setting up event monitoring:', error);
    
    return {
      success: false,
      message: `Error monitoring events: ${error.message}`,
      error: error.message,
      unsubscribe: () => {}
    };
  }
}

/**
 * Get events for specific contract and render as HTML
 * @param {string} contractAddress - Contract address 
 * @returns {Promise<string>} - HTML representation of events
 */
export async function getContractEventsAsHtml(contractAddress) {
  const result = await getContractEvents({ contractAddress });
  
  if (!result.success) {
    return `<div class="error">${result.message}</div>`;
  }
  
  if (result.events.length === 0) {
    return '<div class="no-events">No events found for this contract</div>';
  }
  
  // Build HTML representation
  let html = '<div class="events-container">';
  html += `<h3>Events for contract ${contractAddress}</h3>`;
  html += '<table class="events-table">';
  html += '<thead><tr><th>Event</th><th>Block / Time</th><th>Transaction</th><th>Parameters</th></tr></thead>';
  html += '<tbody>';
  
  for (const event of result.events) {
    const timestamp = event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Unknown';
    
    html += '<tr>';
    html += `<td>${event.name}</td>`;
    html += `<td>${event.blockNumber}<br/><small>${timestamp}</small></td>`;
    html += `<td><a href="https://amoy.polygonscan.com/tx/${event.transactionHash}" target="_blank">${event.transactionHash.substring(0, 10)}...</a></td>`;
    html += '<td>';
    
    if (event.error) {
      html += `<span class="error">${event.error}</span>`;
    } else {
      for (const [key, value] of Object.entries(event.args)) {
        html += `<div><strong>${key}:</strong> ${value}</div>`;
      }
    }
    
    html += '</td>';
    html += '</tr>';
  }
  
  html += '</tbody></table></div>';
  
  return html;
}

// Counter-specific helper for retrieving CountUpdated events
export async function getCounterEvents(contractAddress) {
  const COUNTER_ABI = [
    "function getCount() view returns (uint256)",
    "event CountUpdated(uint256 newCount)"
  ];
  
  return getContractEvents({
    contractAddress,
    abi: COUNTER_ABI,
    eventName: 'CountUpdated'
  });
}

// Get current value from a Counter contract
export async function getCounterValue(contractAddress) {
  if (!isValidContractAddress(contractAddress)) {
    return {
      success: false,
      message: 'Invalid contract address'
    };
  }
  
  try {
    const COUNTER_ABI = ["function getCount() view returns (uint256)"];
    const contract = getContractInstance(contractAddress, COUNTER_ABI);
    
    const count = await contract.getCount();
    
    return {
      success: true,
      value: count.toString(),
      contractAddress
    };
  } catch (error) {
    console.error('Error getting counter value:', error);
    
    return {
      success: false,
      message: `Error getting counter value: ${error.message}`,
      error: error.message,
      contractAddress
    };
  }
} 