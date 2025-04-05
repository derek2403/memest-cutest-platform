import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Inter, Roboto_Mono } from "next/font/google";
import Navigation from '../components/Navigation';

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

// Contract addresses and network configuration
const NETWORKS = {
  POLYGON_AMOY: {
    name: "Polygon Amoy",
    contractAddress: "0xFaDC1F029af77faE9405B9f565b92Ec0B59130E1",
    chainId: "80002", // Polygon Amoy chainId
    rpcUrl: "https://polygon-amoy.g.alchemy.com/v2/FgSucpeM2ptJ9lxAtCUQ5AqtJl4W8kzN"
  },
  CELO_TESTNET: {
    name: "Celo Alfajores Testnet",
    contractAddress: "0x74544b05aE0F30028bBf35CACE0114Faf0E794cc",
    chainId: "44787", // Celo Testnet chainId
    rpcUrl: "https://alfajores-forno.celo-testnet.org"
  }
};

export default function CounterEvents() {
  // User email state
  const [email, setEmail] = useState('');
  
  // Chain monitoring selection
  const [monitorPolygon, setMonitorPolygon] = useState(true);
  const [monitorCelo, setMonitorCelo] = useState(true);
  
  // Events state
  const [polygonEvents, setPolygonEvents] = useState(null);
  const [celoEvents, setCeloEvents] = useState(null);
  const [fetchingPolygon, setFetchingPolygon] = useState(false);
  const [fetchingCelo, setFetchingCelo] = useState(false);
  
  // Notification state
  const [notificationLog, setNotificationLog] = useState([]);
  const [isListening, setIsListening] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Previous events tracking
  const polygonEventHashesRef = useRef(new Set());
  const celoEventHashesRef = useRef(new Set());
  
  // Monitoring stats
  const [monitoringStats, setMonitoringStats] = useState({
    polygonEventsDetected: 0,
    celoEventsDetected: 0,
    notificationsSent: 0,
    lastEventTime: null
  });

  // Function to create a unique hash for an event to track which ones we've seen
  const createEventHash = (event) => {
    return `${event.blockNumber}-${event.transactionHash}-${event.args?.newCount || '0'}`;
  };
  
  // Function to format event details - allow ALL events now, no filtering
  const formatEventDetail = (event) => {
    // Include count value if available
    if (event.args?.newCount) {
      return `Block ${event.blockNumber}: Count updated to ${event.args.newCount}`;
    }
    // Otherwise just show the block number and any available info
    return `Block ${event.blockNumber}: Event detected`;
  };
  
  // Function to fetch counter events from Polygon Amoy
  const fetchPolygonEvents = async () => {
    if (!monitorPolygon) return null;
    setFetchingPolygon(true);
    
    try {
      const response = await fetch(`https://e3c329acf714051138becd9199470e6d1ae0cabd-3001.dstack-prod5.phala.network/api/events/counter?contractAddress=${NETWORKS.POLYGON_AMOY.contractAddress}`);
      const data = await response.json();
      
      setPolygonEvents(data);
      
      // Check for new events
      if (data.success && data.events && data.events.length > 0) {
        const newEvents = [];
        
        // Process each event
        data.events.forEach(event => {
          const eventHash = createEventHash(event);
          
          // If we haven't seen this event before
          if (!polygonEventHashesRef.current.has(eventHash)) {
            polygonEventHashesRef.current.add(eventHash);
            newEvents.push(event);
          }
        });
        
        // If we found new events, notify - always send email for any event
        if (newEvents.length > 0 && email) {
          sendServerEmail("Polygon Amoy", newEvents);
          setMonitoringStats(prev => ({
            ...prev,
            polygonEventsDetected: prev.polygonEventsDetected + newEvents.length,
            notificationsSent: prev.notificationsSent + 1,
            lastEventTime: new Date()
          }));
        }
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching Polygon events:", error);
      setPolygonEvents({
        success: false,
        message: `Error fetching Polygon Amoy events: ${error.message}`,
        error: error.message
      });
      return null;
    } finally {
      setFetchingPolygon(false);
    }
  };
  
  // Function to fetch counter events from Celo testnet
  const fetchCeloEvents = async () => {
    if (!monitorCelo) return null;
    setFetchingCelo(true);
    
    try {
      // First try with the API (as before)
      const response = await fetch(`https://e3c329acf714051138becd9199470e6d1ae0cabd-3001.dstack-prod5.phala.network/api/events/counter?contractAddress=${NETWORKS.CELO_TESTNET.contractAddress}&chainId=${NETWORKS.CELO_TESTNET.chainId}`);
      const data = await response.json();
      
      // Debug log for Celo events
      console.log("Celo events API response:", data);
      
      // If API doesn't return events, try direct ethers approach
      if (!data.success || !data.events || data.events.length === 0) {
        console.log("API didn't return Celo events, trying direct RPC connection");
        try {
          // Import ethers dynamically if needed
          if (typeof window !== 'undefined') {
            const { ethers } = await import('ethers');
            
            // Basic ABI for Counter contract's CountUpdated event
            const counterABI = [
              "event CountUpdated(uint256 newCount)"
            ];
            
            // Connect to Celo testnet directly
            const celoProvider = new ethers.JsonRpcProvider(NETWORKS.CELO_TESTNET.rpcUrl);
            const contract = new ethers.Contract(NETWORKS.CELO_TESTNET.contractAddress, counterABI, celoProvider);
            
            // Get logs from past events
            const logs = await celoProvider.getLogs({
              address: NETWORKS.CELO_TESTNET.contractAddress,
              topics: [ethers.id("CountUpdated(uint256)")],
              fromBlock: 0,
              toBlock: "latest"
            });
            
            console.log("Direct Celo RPC logs:", logs);
            
            // Format events
            const formattedEvents = await Promise.all(logs.map(async (log) => {
              try {
                const parsedLog = contract.interface.parseLog({
                  topics: log.topics,
                  data: log.data
                });
                
                const block = await celoProvider.getBlock(log.blockNumber);
                
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
                console.error('Error parsing Celo log:', err);
                return {
                  name: 'CountUpdated',
                  blockNumber: log.blockNumber,
                  transactionHash: log.transactionHash,
                  error: 'Could not parse event data'
                };
              }
            }));
            
            console.log("Formatted Celo events:", formattedEvents);
            
            // Create success response similar to the API
            const directData = {
              success: true,
              events: formattedEvents,
              message: "Events fetched directly via RPC"
            };
            
            setCeloEvents(directData);
            
            // Check for new events
            if (formattedEvents.length > 0) {
              const newEvents = [];
              
              // Process each event
              formattedEvents.forEach(event => {
                const eventHash = createEventHash(event);
                
                // If we haven't seen this event before
                if (!celoEventHashesRef.current.has(eventHash)) {
                  celoEventHashesRef.current.add(eventHash);
                  newEvents.push(event);
                }
              });
              
              // If we found new events, notify - always send email for any event
              if (newEvents.length > 0 && email) {
                sendServerEmail("Celo Testnet", newEvents);
                setMonitoringStats(prev => ({
                  ...prev,
                  celoEventsDetected: prev.celoEventsDetected + newEvents.length,
                  notificationsSent: prev.notificationsSent + 1,
                  lastEventTime: new Date()
                }));
              }
            }
            
            return directData;
          }
        } catch (directError) {
          console.error("Error with direct Celo RPC connection:", directError);
        }
      }
      
      // If direct method failed or we didn't attempt it, use the API response
      setCeloEvents(data);
      
      // Check for new events using the API data
      if (data.success && data.events && data.events.length > 0) {
        const newEvents = [];
        
        // Process each event
        data.events.forEach(event => {
          const eventHash = createEventHash(event);
          
          // If we haven't seen this event before
          if (!celoEventHashesRef.current.has(eventHash)) {
            celoEventHashesRef.current.add(eventHash);
            newEvents.push(event);
          }
        });
        
        // If we found new events, notify - always send email for any event
        if (newEvents.length > 0 && email) {
          sendServerEmail("Celo Testnet", newEvents);
          setMonitoringStats(prev => ({
            ...prev,
            celoEventsDetected: prev.celoEventsDetected + newEvents.length,
            notificationsSent: prev.notificationsSent + 1,
            lastEventTime: new Date()
          }));
        }
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching Celo events:", error);
      setCeloEvents({
        success: false,
        message: `Error fetching Celo Testnet events: ${error.message}`,
        error: error.message
      });
      return null;
    } finally {
      setFetchingCelo(false);
    }
  };
  
  // Continuous monitoring using a more immediate approach
  useEffect(() => {
    // Initial fetch to populate event sets
    const initialFetch = async () => {
      const polygonData = await fetchPolygonEvents();
      const celoData = await fetchCeloEvents();
      
      // Initialize our event tracking sets
      if (polygonData?.success && polygonData.events) {
        polygonData.events.forEach(event => {
          polygonEventHashesRef.current.add(createEventHash(event));
        });
      }
      
      if (celoData?.success && celoData.events) {
        celoData.events.forEach(event => {
          celoEventHashesRef.current.add(createEventHash(event));
        });
      }
    };
    
    initialFetch();
    
    // Set up continuous event checking
    let checkingInterval;
    const startEventChecking = () => {
      // We'll use a very short interval to make it feel continuous
      checkingInterval = setInterval(() => {
        if (isListening) {
          if (monitorPolygon) fetchPolygonEvents();
          if (monitorCelo) fetchCeloEvents();
        }
      }, 3000); // Check every 3 seconds, but don't show this to the user
    };
    
    startEventChecking();
    
    return () => {
      clearInterval(checkingInterval);
    };
  }, [isListening, monitorPolygon, monitorCelo, email]);
  
  // Send email using the server's email service (Gmail)
  const sendServerEmail = async (network, events) => {
    if (!email) return;
    
    // Create notification entry first
    const notification = {
      id: Date.now(),
      network,
      time: new Date(),
      events,
      emailSent: false
    };
    
    setNotificationLog(prev => [notification, ...prev]);
    
    // Format ALL event data - no filtering based on count values
    const eventDetails = events.map(formatEventDetail).join('\n');
    
    // Email content
    const subject = `New Counter Events on ${network}`;
    const body = `
New Counter Events Detected on ${network}
--------------------

Contract: ${network === "Polygon Amoy" ? NETWORKS.POLYGON_AMOY.contractAddress : NETWORKS.CELO_TESTNET.contractAddress}

${eventDetails || 'Event detected (no details available)'}

Timestamp: ${new Date().toLocaleString()}
    `;
    
    try {
      // Send email using our server endpoint that uses the .env email credentials
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: email,
          subject: subject,
          body: body
        })
      });
      
      const result = await response.json();
      
      // Update notification status based on result
      setNotificationLog(prev => 
        prev.map(item => 
          item.id === notification.id 
            ? {...item, emailSent: result.success} 
            : item
        )
      );
      
      return result;
    } catch (error) {
      console.error("Error sending notification email:", error);
      
      // Update notification to show failure
      setNotificationLog(prev => 
        prev.map(item => 
          item.id === notification.id 
            ? {...item, emailSent: false, error: error.message} 
            : item
        )
      );
      
      return { success: false, error: error.message };
    }
  };
  
  // Send a complete report of all events
  const sendCompleteReport = async () => {
    if (!email) return;
    
    setSendingEmail(true);
    
    // Format event data
    const polygonEventsList = polygonEvents?.success ? polygonEvents.events || [] : [];
    const celoEventsList = celoEvents?.success ? celoEvents.events || [] : [];
    
    // Format ALL Polygon events - no filtering
    const polygonDetails = polygonEventsList
      .map(formatEventDetail)
      .map(detail => `- ${detail}`)
      .join('\n');
    
    // Format ALL Celo events - no filtering
    const celoDetails = celoEventsList
      .map(formatEventDetail)
      .map(detail => `- ${detail}`)
      .join('\n');
    
    const subject = "Counter Events Complete Report";
    const body = `
Counter Events Complete Report
--------------------

Polygon Amoy (${NETWORKS.POLYGON_AMOY.contractAddress}):
${polygonDetails || 'No events found'}

Celo Testnet (${NETWORKS.CELO_TESTNET.contractAddress}):
${celoDetails || 'No events found'}

Report generated at: ${new Date().toLocaleString()}
    `;
    
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: email,
          subject: subject,
          body: body
        })
      });
      
      const result = await response.json();
      
      // Show notification of success/failure
      setNotificationLog(prev => [{
        id: Date.now(),
        network: 'Complete Report',
        time: new Date(),
        events: [...polygonEventsList, ...celoEventsList],
        emailSent: result.success,
        error: result.error
      }, ...prev]);
      
      return result;
    } catch (error) {
      console.error("Error sending report email:", error);
      
      // Show notification of failure
      setNotificationLog(prev => [{
        id: Date.now(),
        network: 'Complete Report',
        time: new Date(),
        events: [],
        emailSent: false,
        error: error.message
      }, ...prev]);
      
      return { success: false, error: error.message };
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-100 ${inter.variable} ${robotoMono.variable}`}>
      <Head>
        <title>Live Counter Events Monitor</title>
        <meta name="description" content="Real-time monitoring of counter events from blockchains" />
      </Head>
      
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-8">Live Counter Events Monitor</h1>
        
        {/* Email and Chain Selection Section */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Monitoring Setup</h2>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address for Instant Notifications
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter your email to receive notifications instantly when new events are detected
            </p>
          </div>
          
          {/* Chain Selection */}
          <div className="mt-5 border-t border-gray-200 pt-4">
            <h3 className="font-medium mb-3">Choose Chains to Monitor</h3>
            
            <div className="flex flex-col space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="monitor-polygon"
                  checked={monitorPolygon}
                  onChange={() => setMonitorPolygon(!monitorPolygon)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="monitor-polygon" className="ml-2 flex items-center">
                  <span className="block text-sm text-gray-900 mr-2">Polygon Amoy</span>
                  <span className="inline-block w-3 h-3 rounded-full bg-purple-500"></span>
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="monitor-celo"
                  checked={monitorCelo}
                  onChange={() => setMonitorCelo(!monitorCelo)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="monitor-celo" className="ml-2 flex items-center">
                  <span className="block text-sm text-gray-900 mr-2">Celo Testnet</span>
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Monitoring Status */}
          <div className="mt-5 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isListening ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <p className="font-medium">{isListening ? "Live Monitoring Active" : "Monitoring Paused"}</p>
              </div>
              
              <button
                onClick={() => setIsListening(!isListening)}
                className={`text-sm px-3 py-1 rounded-md ${
                  isListening 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {isListening ? "Pause" : "Resume"}
              </button>
            </div>
            
            <div className="mt-2 text-sm grid grid-cols-2 gap-2">
              <div>
                <p><span className="font-medium">Polygon Events:</span> {monitoringStats.polygonEventsDetected}</p>
              </div>
              <div>
                <p><span className="font-medium">Celo Events:</span> {monitoringStats.celoEventsDetected}</p>
              </div>
              <div>
                <p><span className="font-medium">Notifications:</span> {monitoringStats.notificationsSent}</p>
              </div>
              <div>
                <p>
                  <span className="font-medium">Last Event:</span> {monitoringStats.lastEventTime 
                    ? new Date(monitoringStats.lastEventTime).toLocaleTimeString() 
                    : 'None'}
                </p>
              </div>
            </div>
            
            {!monitorPolygon && !monitorCelo && (
              <div className="mt-2 text-sm text-red-600 font-medium">
                ⚠️ Please select at least one chain to monitor
              </div>
            )}
            
            {!email && (
              <div className="mt-2 text-sm text-yellow-600 font-medium">
                ⚠️ Enter your email to receive notifications
              </div>
            )}
          </div>
          
          {/* Manual Email Button */}
          <div className="mt-4">
            <button
              onClick={sendCompleteReport}
              disabled={sendingEmail || !email || (!polygonEvents && !celoEvents)}
              className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                email ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-700'
              } disabled:opacity-50`}
            >
              {sendingEmail 
                ? "Sending..." 
                : "Send Complete Events Report"}
            </button>
          </div>
        </section>
        
        {/* Recent Notifications */}
        {notificationLog.length > 0 && (
          <section className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Recent Notifications</h2>
            
            <div className="space-y-3">
              {notificationLog.slice(0, 5).map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-3 rounded-md border-l-4 ${
                    notification.network === "Polygon Amoy" 
                      ? 'bg-purple-50 border-purple-500' 
                      : notification.network === "Celo Testnet"
                        ? 'bg-green-50 border-green-500'
                        : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {notification.network} - {notification.events.length} event(s)
                      </h3>
                      <p className="text-sm text-gray-500">
                        {notification.time.toLocaleTimeString()} - {notification.emailSent 
                          ? '✓ Email sent' 
                          : notification.error 
                            ? `✗ Failed: ${notification.error}` 
                            : '⟳ Sending...'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm">
                    {notification.events.slice(0, 3).map((event, idx) => (
                      <div key={idx} className="mb-1">
                        {event.args?.newCount 
                          ? `Block ${event.blockNumber}: Count updated to ${event.args.newCount}`
                          : `Block ${event.blockNumber}: Event detected`}
                      </div>
                    ))}
                    {notification.events.length > 3 && (
                      <p className="text-gray-500 mt-1">+ {notification.events.length - 3} more events</p>
                    )}
                  </div>
                </div>
              ))}
              
              {notificationLog.length > 5 && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  + {notificationLog.length - 5} more notifications
                </p>
              )}
            </div>
          </section>
        )}
        
        {/* Current Events Display */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Counter Events</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center mb-2">
                <h3 className="font-medium">Polygon Amoy</h3>
                {monitorPolygon ? (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">Monitoring</span>
                ) : (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded-full">Not Monitoring</span>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mb-2 break-all">
                Contract: {NETWORKS.POLYGON_AMOY.contractAddress}
              </p>
              
              <button
                onClick={fetchPolygonEvents}
                disabled={fetchingPolygon}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {fetchingPolygon ? "Refreshing..." : "Refresh Events"}
              </button>
            </div>
            
            <div>
              <div className="flex items-center mb-2">
                <h3 className="font-medium">Celo Testnet</h3>
                {monitorCelo ? (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">Monitoring</span>
                ) : (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded-full">Not Monitoring</span>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mb-2 break-all">
                Contract: {NETWORKS.CELO_TESTNET.contractAddress}
              </p>
              
              <button
                onClick={fetchCeloEvents}
                disabled={fetchingCelo}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {fetchingCelo ? "Refreshing..." : "Refresh Events"}
              </button>
            </div>
          </div>
          
          {/* Display Polygon Events */}
          {polygonEvents && (
            <div className={`mt-6 p-4 rounded-md ${polygonEvents.success ? 'bg-purple-50' : 'bg-red-50'}`}>
              <h3 className={`font-medium mb-3 ${polygonEvents.success ? 'text-purple-700' : 'text-red-700'}`}>
                Polygon Amoy Events
              </h3>
              
              {!polygonEvents.success ? (
                <p className="text-red-700">{polygonEvents.message || "Failed to fetch events"}</p>
              ) : (
                <>
                  {polygonEvents.events && polygonEvents.events.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block #</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {polygonEvents.events.map((event, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{event.blockNumber}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {event.timestamp 
                                  ? new Date(event.timestamp).toLocaleString()
                                  : 'N/A'}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {event.args?.newCount || 'No count data'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600">No events found for this contract on Polygon Amoy.</p>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* Display Celo Events */}
          {celoEvents && (
            <div className={`mt-6 p-4 rounded-md ${celoEvents.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className={`font-medium mb-3 ${celoEvents.success ? 'text-green-700' : 'text-red-700'}`}>
                Celo Testnet Events
              </h3>
              
              {!celoEvents.success ? (
                <p className="text-red-700">{celoEvents.message || "Failed to fetch events"}</p>
              ) : (
                <>
                  {celoEvents.events && celoEvents.events.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block #</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {celoEvents.events.map((event, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{event.blockNumber}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {event.timestamp 
                                  ? new Date(event.timestamp).toLocaleString() 
                                  : 'N/A'}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {event.args?.newCount || 'No count data'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600">No events found for this contract on Celo Testnet.</p>
                  )}
                </>
              )}
            </div>
          )}
        </section>
        
        <section className="bg-white rounded-lg shadow-md p-6">
          <div className="p-4 bg-yellow-50 rounded-md">
            <h3 className="font-medium text-yellow-800 mb-2">About Counter Contract Monitor</h3>
            <p className="text-sm text-yellow-700">
              This page continuously monitors the Counter smart contract on your selected chains.
              When new events are detected, emails are automatically sent using our server's Gmail
              service. The monitoring happens in real-time as long as this page remains open in your browser.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
} 