import { useState, useEffect } from 'react';
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
    chainId: "80002" // Polygon Amoy chainId
  },
  CELO_TESTNET: {
    name: "Celo Alfajores Testnet",
    contractAddress: "0x74544b05aE0F30028bBf35CACE0114Faf0E794cc",
    chainId: "44787", // Celo Testnet chainId
    rpcUrl: "https://alfajores-forno.celo-testnet.org/"
  }
};

export default function CounterEvents() {
  // User email state
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState(null);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  
  // Events state
  const [polygonEvents, setPolygonEvents] = useState(null);
  const [celoEvents, setCeloEvents] = useState(null);
  const [fetchingPolygon, setFetchingPolygon] = useState(false);
  const [fetchingCelo, setFetchingCelo] = useState(false);
  
  // Email events state
  const [emailEvents, setEmailEvents] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Check email verification status on mount and when email changes
  useEffect(() => {
    if (email) {
      checkEmailStatus();
    }
  }, [email]);
  
  // Function to verify email address
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setVerifyingEmail(true);
    setEmailStatus(null);
    
    try {
      const response = await fetch('https://e3c329acf714051138becd9199470e6d1ae0cabd-3001.dstack-prod5.phala.network/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      setEmailStatus(data);
      
      // If verification is pending, check status periodically
      if (data.verificationPending) {
        checkVerificationStatus();
      }
    } catch (error) {
      setEmailStatus({ error: 'Failed to send verification email: ' + error.message });
    } finally {
      setVerifyingEmail(false);
    }
  };
  
  // Check email verification status
  const checkEmailStatus = async () => {
    try {
      const response = await fetch(`https://e3c329acf714051138becd9199470e6d1ae0cabd-3001.dstack-prod5.phala.network/email/status?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setEmailStatus(data);
      
      return data;
    } catch (error) {
      console.error('Error checking email status:', error);
      return null;
    }
  };
  
  // Periodically check verification status
  const checkVerificationStatus = async () => {
    try {
      const status = await checkEmailStatus();
      
      if (!status || !status.verified) {
        // Check again in 5 seconds
        setTimeout(checkVerificationStatus, 5000);
      }
    } catch (error) {
      console.error('Error in verification check:', error);
    }
  };
  
  // Function to fetch counter events from Polygon Amoy
  const fetchPolygonEvents = async () => {
    setFetchingPolygon(true);
    setPolygonEvents(null);
    
    try {
      const response = await fetch(`https://e3c329acf714051138becd9199470e6d1ae0cabd-3001.dstack-prod5.phala.network/api/events/counter?contractAddress=${NETWORKS.POLYGON_AMOY.contractAddress}`);
      const data = await response.json();
      
      setPolygonEvents(data);
    } catch (error) {
      setPolygonEvents({
        success: false,
        message: `Error fetching Polygon Amoy events: ${error.message}`,
        error: error.message
      });
    } finally {
      setFetchingPolygon(false);
    }
  };
  
  // Function to fetch counter events from Celo testnet
  const fetchCeloEvents = async () => {
    setFetchingCelo(true);
    setCeloEvents(null);
    
    try {
      const response = await fetch(`https://e3c329acf714051138becd9199470e6d1ae0cabd-3001.dstack-prod5.phala.network/api/events/counter?contractAddress=${NETWORKS.CELO_TESTNET.contractAddress}&chainId=${NETWORKS.CELO_TESTNET.chainId}`);
      const data = await response.json();
      
      setCeloEvents(data);
    } catch (error) {
      setCeloEvents({
        success: false,
        message: `Error fetching Celo Testnet events: ${error.message}`,
        error: error.message
      });
    } finally {
      setFetchingCelo(false);
    }
  };
  
  // Fetch all events
  const fetchAllEvents = () => {
    fetchPolygonEvents();
    fetchCeloEvents();
  };
  
  // Function to send events to email
  const sendEventsToEmail = async () => {
    if (!email || !emailStatus?.verified) {
      setEmailEvents({
        success: false,
        message: 'Please verify your email first'
      });
      return;
    }
    
    // Make sure we have events from at least one of the networks
    if ((!polygonEvents || !polygonEvents.success) && (!celoEvents || !celoEvents.success)) {
      setEmailEvents({
        success: false,
        message: 'No events available to send. Please fetch events first.'
      });
      return;
    }
    
    setSendingEmail(true);
    setEmailEvents(null);
    
    try {
      // Prepare combined events data
      const polygonEventsList = polygonEvents?.success ? polygonEvents.events || [] : [];
      const celoEventsList = celoEvents?.success ? celoEvents.events || [] : [];
      
      // Only proceed if we have events
      if (polygonEventsList.length === 0 && celoEventsList.length === 0) {
        setEmailEvents({
          success: false,
          message: 'No events found to send'
        });
        setSendingEmail(false);
        return;
      }
      
      // Format events for email body
      const emailBody = `
Counter Events Report
--------------------

Polygon Amoy (${NETWORKS.POLYGON_AMOY.contractAddress}):
${polygonEventsList.length > 0 
  ? polygonEventsList.map(evt => `- Block ${evt.blockNumber}: Count updated to ${evt.args?.newCount || 'N/A'}`).join('\n')
  : 'No events found'}

Celo Testnet (${NETWORKS.CELO_TESTNET.contractAddress}):
${celoEventsList.length > 0
  ? celoEventsList.map(evt => `- Block ${evt.blockNumber}: Count updated to ${evt.args?.newCount || 'N/A'}`).join('\n')
  : 'No events found'}
      `;
      
      // Send email using the email-transaction endpoint
      const response = await fetch('https://e3c329acf714051138becd9199470e6d1ae0cabd-3001.dstack-prod5.phala.network/email-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senderEmail: email,
          emailBody: emailBody
        })
      });
      
      const data = await response.json();
      setEmailEvents(data);
      
    } catch (error) {
      setEmailEvents({
        success: false,
        message: `Error sending events via email: ${error.message}`,
        error: error.message
      });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-100 ${inter.variable} ${robotoMono.variable}`}>
      <Head>
        <title>Counter Events Monitor</title>
        <meta name="description" content="Monitor counter events from Polygon Amoy and Celo Testnet" />
      </Head>
      
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-8">Counter Events Monitor</h1>
        
        {/* Email Verification Section */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Email Setup</h2>
          
          <form onSubmit={handleVerifyEmail} className="mb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-grow">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={verifyingEmail || !email}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 whitespace-nowrap"
                >
                  {verifyingEmail ? "Sending..." : "Verify Email"}
                </button>
              </div>
            </div>
          </form>
          
          {/* Email Status */}
          {emailStatus && (
            <div className={`p-4 rounded-md ${emailStatus.verified ? 'bg-green-50' : emailStatus.verificationPending ? 'bg-yellow-50' : 'bg-red-50'}`}>
              <h3 className={`font-medium ${emailStatus.verified ? 'text-green-700' : emailStatus.verificationPending ? 'text-yellow-700' : 'text-red-700'}`}>
                {emailStatus.verified ? "✓ Email Verified" : emailStatus.verificationPending ? "⚠ Verification Pending" : "✗ Verification Failed"}
              </h3>
              <p className="text-sm mt-2">
                {emailStatus.verified 
                  ? "Your email is verified. You can now fetch and send counter events."
                  : emailStatus.verificationPending
                    ? "Please check your inbox and click the verification link to complete the process."
                    : emailStatus.error || "Email verification failed."}
              </p>
            </div>
          )}
        </section>
        
        {/* Fetch Events Section */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Fetch Counter Events</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="font-medium mb-2">Polygon Amoy</h3>
              <p className="text-xs text-gray-500 mb-2 break-all">
                Contract: {NETWORKS.POLYGON_AMOY.contractAddress}
              </p>
              <button
                onClick={fetchPolygonEvents}
                disabled={fetchingPolygon}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {fetchingPolygon ? "Fetching..." : "Fetch Polygon Events"}
              </button>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Celo Testnet</h3>
              <p className="text-xs text-gray-500 mb-2 break-all">
                Contract: {NETWORKS.CELO_TESTNET.contractAddress}
              </p>
              <button
                onClick={fetchCeloEvents}
                disabled={fetchingCelo}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {fetchingCelo ? "Fetching..." : "Fetch Celo Events"}
              </button>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={fetchAllEvents}
              disabled={fetchingPolygon || fetchingCelo}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {(fetchingPolygon || fetchingCelo) ? "Fetching..." : "Fetch All Events"}
            </button>
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
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{event.args?.newCount || 'N/A'}</td>
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
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{event.args?.newCount || 'N/A'}</td>
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
        
        {/* Email Events Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Email Events</h2>
          
          <div className="mb-4">
            <button
              onClick={sendEventsToEmail}
              disabled={sendingEmail || !emailStatus?.verified || (!polygonEvents && !celoEvents)}
              className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${
                emailStatus?.verified ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-700'
              }`}
            >
              {sendingEmail 
                ? "Sending..." 
                : !emailStatus?.verified 
                  ? "Verify Email First" 
                  : (!polygonEvents && !celoEvents) 
                    ? "Fetch Events First" 
                    : "Email Events"}
            </button>
          </div>
          
          {/* Email Status */}
          {emailEvents && (
            <div className={`p-4 rounded-md ${emailEvents.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <h3 className="font-medium mb-2">
                {emailEvents.success ? "✓ Email Sent Successfully" : "✗ Failed to Send Email"}
              </h3>
              <p>{emailEvents.message || (emailEvents.success ? "Events have been emailed successfully." : "Failed to send events via email.")}</p>
              
              {emailEvents.error && (
                <p className="mt-2 text-sm font-mono bg-red-100 p-2 rounded">{emailEvents.error}</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
} 