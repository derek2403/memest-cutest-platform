import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/WorkflowPopup.module.css';

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

// Flow Chart Component to visualize the workflow
const FlowChart = ({ workflow }) => {
  if (!workflow || workflow.length === 0) return null;
  
  // Filter to get only nodes and arrows
  const nodes = workflow.filter(item => item.type === 'node');
  const arrows = workflow.filter(item => item.type === 'arrow');
  
  return (
    <div className={styles.flowchartContainer}>
      <h3 className={styles.flowchartTitle}>Visual Workflow:</h3>
      <div className={styles.flowchartScroller}>
        <div className={styles.flowchartContent}>
          {/* First node */}
          {nodes.length > 0 && (
            <div className={styles.node}>
              {nodes[0].content}
            </div>
          )}
          
          {/* All arrows and subsequent nodes */}
          {arrows.map((arrow, index) => {
            const targetNode = nodes[index + 1];
            if (!targetNode) return null;
            
            return (
              <div key={index} className={styles.flowStep}>
                {/* Arrow with Text */}
                <div className={styles.arrowContainer}>
                  <div className={styles.arrowLabel}>{arrow.content}</div>
                  <div className={styles.arrowLine}>
                    <div className={styles.arrowStem}></div>
                    <div className={styles.arrowHead}></div>
                  </div>
                </div>
                
                {/* Target Node */}
                <div className={styles.node}>
                  {targetNode.content}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper function to get workflows based on available plugins
const getAvailableWorkflows = () => {
  // Default workflows - always available regardless of plugins
  const DEFAULT_WORKFLOWS = [
    {
      title: 'Metamask Transaction Alerts',
      text: 'Monitor my MetaMask wallet transactions and send alerts to my Gmail when values exceed $500'
    },
    {
      title: 'Polygon Portfolio Tracker',
      text: 'Track all my Polygon transactions and record them in a Spreadsheet with daily summaries'
    },
    {
      title: 'Celo & 1inch Monitor',
      text: 'Monitor Celo transactions and suggest optimal swap opportunities on 1inch exchange'
    }
  ];

  // If window.pluginsInRoom is not available or no active plugins, just return defaults
  if (!window.pluginsInRoom || window.pluginsInRoom.getActivePlugins().length === 0) {
    return DEFAULT_WORKFLOWS;
  }

  // Get active plugins
  const activePlugins = window.pluginsInRoom.getActivePlugins();
  
  // Start with the default workflows, will add more based on plugins
  const workflows = [...DEFAULT_WORKFLOWS];

  // Add MetaMask workflows if available
  if (activePlugins.includes('metamask')) {
    if (activePlugins.includes('gmail')) {
      workflows.push({
        title: 'Transaction Notifications',
        text: 'For each transaction in MetaMask notify in Gmail'
      });
    }
    
    if (activePlugins.includes('spreadsheet')) {
      workflows.push({
        title: 'Transaction Tracker',
        text: 'For each transaction in MetaMask record in Spreadsheet'
      });
    }
    
    if (activePlugins.includes('polygon')) {
      workflows.push({
        title: 'Polygon Bridge',
        text: 'For each transaction in MetaMask bridge to Polygon'
      });
    }
  }

  // Add cross-chain workflows if multiple chains available
  if (activePlugins.includes('celo') && activePlugins.includes('polygon')) {
    workflows.push({
      title: 'Cross-Chain Bridge',
      text: 'For each Celo transaction, bridge tokens to Polygon'
    });
  }

  // Add spreadsheet workflows
  if (activePlugins.includes('spreadsheet') && activePlugins.includes('gmail')) {
    workflows.push({
      title: 'Automated Reports',
      text: 'Every Monday at 9 AM, collect data from Spreadsheet and send a report to Gmail'
    });
  }

  return workflows;
};

export default function WorkflowPopup({ initialInput = '', onClose, showSavedSection = false, readOnly = false }) {
  const [workflowInput, setWorkflowInput] = useState(initialInput);
  const [workflowParsed, setWorkflowParsed] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowApproved, setWorkflowApproved] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [availableWorkflows, setAvailableWorkflows] = useState([]);
  const savedSectionRef = React.useRef(null);
  const [executingWorkflow, setExecutingWorkflow] = useState(false);
  const [executionStatus, setExecutionStatus] = useState(null);
  
  // New state for workflow details inputs
  const [userEmail, setUserEmail] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [inputsComplete, setInputsComplete] = useState(false);
  
  // Event monitoring state
  const [monitorPolygon, setMonitorPolygon] = useState(false);
  const [monitorCelo, setMonitorCelo] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeMonitoringId, setActiveMonitoringId] = useState(null);
  const [polygonEvents, setPolygonEvents] = useState(null);
  const [celoEvents, setCeloEvents] = useState(null);
  const [fetchingPolygon, setFetchingPolygon] = useState(false);
  const [fetchingCelo, setFetchingCelo] = useState(false);
  const [notificationLog, setNotificationLog] = useState([]);
  const [monitoringStats, setMonitoringStats] = useState({
    polygonEventsDetected: 0,
    celoEventsDetected: 0,
    notificationsSent: 0,
    lastEventTime: null
  });
  
  // Previous events tracking
  const polygonEventHashesRef = useRef(new Set());
  const celoEventHashesRef = useRef(new Set());
  
  // Add this state for 1inch logs at the top where other states are defined
  const [inchLogs, setInchLogs] = useState([]);
  const [bridgeRunning, setBridgeRunning] = useState(false);
  const logsEndRef = useRef(null);
  
  // Helper to check if inputs are complete based on the workflow type
  const checkInputsComplete = (workflowText, email, recipient, amount) => {
    const lowerText = workflowText.toLowerCase();
    
    // For USDC Bridge, no inputs required
    if (lowerText.includes("usdc") && lowerText.includes("bridge")) {
      return true;
    }
    
    // Basic validation - always require email
    if (!email) return false;
    
    // For event monitoring workflows, only require email
    if (lowerText.includes("listen") || lowerText.includes("event")) {
      return email.length > 0;
    }
    
    // For MetaMask transactions, require all fields
    if (lowerText.includes("metamask") || 
        lowerText.includes("transfer")) {
      return email && recipient && amount;
    }
    
    // Default case
    return email.length > 0;
  };
  
  // Update inputs complete state when any input changes
  useEffect(() => {
    setInputsComplete(checkInputsComplete(
      workflowInput, 
      userEmail, 
      recipientAddress, 
      transactionAmount
    ));
  }, [workflowInput, userEmail, recipientAddress, transactionAmount]);
  
  // Load saved workflows from localStorage and determine available workflows when the component mounts
  useEffect(() => {
    try {
      // Load saved workflows
      const saved = localStorage.getItem('savedWorkflows');
      if (saved) {
        setSavedWorkflows(JSON.parse(saved));
        
        // If showSavedSection is true and we have saved workflows, scroll to them
        if (showSavedSection && JSON.parse(saved).length > 0) {
          setTimeout(() => {
            if (savedSectionRef.current) {
              savedSectionRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 300); // Short delay to ensure component is fully rendered
        }
      }

      // Initial load of available workflows
      updateAvailableWorkflows();
      
      // Set interval to periodically check for plugin changes
      const intervalId = setInterval(updateAvailableWorkflows, 1000);
      
      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    } catch (error) {
      console.error('Error loading saved workflows:', error);
    }
  }, [showSavedSection]);
  
  // Function to update available workflows based on plugins in room
  const updateAvailableWorkflows = () => {
    setAvailableWorkflows(getAvailableWorkflows());
  };

  // Parse the workflow when component mounts if initialInput is provided
  useEffect(() => {
    if (initialInput) {
      handleParseWorkflow();
    }
  }, []);

  // Handle loading an example workflow
  const handleLoadExample = (example) => {
    setWorkflowInput(example.text);
    
    // Reset input fields when loading a new example
    setUserEmail('');
    setRecipientAddress('');
    setTransactionAmount('');
  };

  // Handle workflow parsing
  const handleParseWorkflow = async (e) => {
    if (e) e.preventDefault();
    if (!workflowInput.trim()) return;

    setWorkflowLoading(true);

    try {
      // Use Claude AI to parse the workflow
      const response = await fetch('/api/parse-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowText: workflowInput,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse workflow');
      }

      const data = await response.json();
      setWorkflowParsed(data.workflow);
    } catch (error) {
      console.error('Error parsing workflow:', error);
      
      // Show user-friendly error
      alert('Failed to parse workflow. Please try again with a different format.');
      
      // Reset loading state
      setWorkflowLoading(false);
    } finally {
      setWorkflowLoading(false);
    }
  };

  // Save the current parsed workflow to localStorage
  const saveWorkflow = () => {
    if (!workflowParsed || workflowParsed.length === 0) return;
    
    try {
      const newSavedWorkflow = {
        id: Date.now(), // Generate a unique ID based on timestamp
        description: workflowInput,
        workflow: workflowParsed,
        createdAt: new Date().toISOString(),
        // Save user inputs
        email: userEmail,
        recipient: recipientAddress,
        amount: transactionAmount
      };
      
      const updatedWorkflows = [...savedWorkflows, newSavedWorkflow];
      setSavedWorkflows(updatedWorkflows);
      localStorage.setItem('savedWorkflows', JSON.stringify(updatedWorkflows));
      
      // Show approval screen after saving
      setWorkflowApproved(true);
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow');
    }
  };

  // Delete a saved workflow
  const deleteWorkflow = (id) => {
    try {
      // Find the workflow to be deleted
      const workflowToDelete = savedWorkflows.find(workflow => workflow.id === id);
      
      // Check if it's an event monitoring workflow
      if (workflowToDelete && 
         (workflowToDelete.description.toLowerCase().includes('event') || 
          workflowToDelete.description.toLowerCase().includes('listen'))) {
        
        // Show confirmation with info about stopping monitoring
        const confirmDelete = window.confirm(
          "This will stop the event monitoring for this workflow. Are you sure you want to delete it?"
        );
        
        if (!confirmDelete) return;
        
        // If this is the active monitoring workflow, stop monitoring
        if (id === activeMonitoringId) {
          setIsListening(false);
          setActiveMonitoringId(null);
          // Reset monitoring stats
          setMonitoringStats({
            polygonEventsDetected: 0,
            celoEventsDetected: 0,
            notificationsSent: 0,
            lastEventTime: null
          });
          // Clear notification log
          setNotificationLog([]);
        }
      }
      
      const updatedWorkflows = savedWorkflows.filter(workflow => workflow.id !== id);
      setSavedWorkflows(updatedWorkflows);
      localStorage.setItem('savedWorkflows', JSON.stringify(updatedWorkflows));
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Failed to delete workflow');
    }
  };
  
  // Modify renderInputFields function to skip form fields for USDC Bridge workflow
  const renderInputFields = () => {
    const lowerText = workflowInput.toLowerCase();
    const isEventMonitoring = lowerText.includes('listen') || lowerText.includes('event');
    const isUSDCBridge = lowerText.includes('usdc') && lowerText.includes('bridge');
    
    // For USDC Bridge, don't show any input fields
    if (isUSDCBridge) {
      return (
        <div className={styles.inputFields}>
          <h4 className={styles.inputTitle}>Workflow Details</h4>
          <div className={styles.monitorInfo}>
            <p>USDC Bridge will be executed automatically. No additional information needed.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className={styles.inputFields}>
        <h4 className={styles.inputTitle}>Workflow Details</h4>
        
        {/* Email field - always show */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Email Address <span className={styles.required}>*</span></label>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="Enter your email"
            className={styles.inputField}
            required
          />
          <p className={styles.inputHelp}>
            {isEventMonitoring 
              ? "Where to receive event notifications" 
              : "For signing transactions"}
          </p>
        </div>
        
        {/* Only show recipient and amount for non-event monitoring workflows */}
        {!isEventMonitoring && (lowerText.includes("metamask") || lowerText.includes("transfer") || lowerText.includes("usdc")) && (
          <>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Recipient Address <span className={styles.required}>*</span></label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
                className={styles.inputField}
                required
              />
              <p className={styles.inputHelp}>The blockchain address receiving funds</p>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Amount <span className={styles.required}>*</span></label>
              <input
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder="0.0"
                step="0.000000000000000001"
                className={styles.inputField}
                required
              />
              <p className={styles.inputHelp}>Transaction amount in ETH or tokens</p>
            </div>
          </>
        )}
        
        {/* For event monitoring workflows, show which chain is being monitored */}
        {isEventMonitoring && (
          <div className={styles.monitorInfo}>
            <p>
              {lowerText.includes('polygon') 
                ? '🟣 Monitoring Polygon chain events' 
                : lowerText.includes('celo') 
                  ? '🟢 Monitoring Celo chain events' 
                  : '🟣 🟢 Monitoring blockchain events'}
            </p>
          </div>
        )}
      </div>
    );
  };
  
  // Continuous monitoring effect - runs when isListening, activeMonitoringId, or monitoring settings change
  useEffect(() => {
    // Only run if we're actively listening and have a workflow to monitor
    if (!isListening || !activeMonitoringId) return;
    
    console.log("Starting event monitoring for workflow:", activeMonitoringId);
    
    // Initial fetch to populate event sets - we just want to mark existing events as seen
    // without sending notifications for them, only monitor new events from now onwards
    const initialFetch = async () => {
      // Reset event tracking sets for fresh start
      polygonEventHashesRef.current = new Set();
      celoEventHashesRef.current = new Set();
      
      if (monitorPolygon) {
        console.log("Setting up Polygon event monitoring...");
        try {
          const response = await fetch(`https://e3c329acf714051138becd9199470e6d1ae0cabd-3001.dstack-prod5.phala.network/api/events/counter?contractAddress=${NETWORKS.POLYGON_AMOY.contractAddress}`);
          const data = await response.json();
          
          // Mark existing events as seen so we don't send notifications for them
          if (data.success && data.events) {
            data.events.forEach(event => {
              polygonEventHashesRef.current.add(createEventHash(event));
            });
            console.log(`Recorded ${data.events.length} existing Polygon events (will not trigger notifications)`);
          }
        } catch (error) {
          console.error("Error initializing Polygon monitoring:", error);
        }
      }
      
      if (monitorCelo) {
        console.log("Setting up Celo event monitoring...");
        try {
          const response = await fetch(`https://e3c329acf714051138becd9199470e6d1ae0cabd-3001.dstack-prod5.phala.network/api/events/counter?contractAddress=${NETWORKS.CELO_TESTNET.contractAddress}&chainId=${NETWORKS.CELO_TESTNET.chainId}`);
          const data = await response.json();
          
          // Mark existing events as seen so we don't send notifications for them
          if (data.success && data.events) {
            data.events.forEach(event => {
              celoEventHashesRef.current.add(createEventHash(event));
            });
            console.log(`Recorded ${data.events.length} existing Celo events (will not trigger notifications)`);
          }
          
          // We may need to try direct RPC connection for Celo
          if (!data.success || !data.events || data.events.length === 0) {
            console.log("API didn't return Celo events, initializing direct RPC tracking");
            
            // We don't need to do anything else here for initialization, 
            // as the actual fetch logic will handle RPC connection
          }
        } catch (error) {
          console.error("Error initializing Celo monitoring:", error);
        }
      }
    };
    
    initialFetch();
    
    // Set up continuous event checking
    let checkingInterval;
    const startEventChecking = () => {
      // We'll use a very short interval to make it feel continuous
      checkingInterval = setInterval(() => {
        if (isListening) {
          // Only fetch from chains that are being monitored
          if (monitorPolygon) {
            fetchPolygonEvents();
          }
          
          if (monitorCelo) {
            fetchCeloEvents();
          }
        }
      }, 3000); // Check every 3 seconds, same as counterEvents.js
    };
    
    startEventChecking();
    
    // Update status message to show which chains are being monitored
    setExecutionStatus({
      success: true,
      message: `Monitoring active for ${monitorPolygon && monitorCelo 
        ? 'Polygon and Celo' 
        : monitorPolygon 
          ? 'Polygon' 
          : 'Celo'} chains. Event tracking has started.`,
      monitoring: true
    });
    
    // Cleanup function
    return () => {
      console.log("Stopping event monitoring for workflow:", activeMonitoringId);
      clearInterval(checkingInterval);
    };
  }, [isListening, activeMonitoringId, monitorPolygon, monitorCelo]);
  
  // Update the execute workflow function to handle event monitoring
  const handleExecuteWorkflow = async () => {
    // Find the most recently saved workflow
    const mostRecentWorkflow = savedWorkflows[savedWorkflows.length - 1];
    
    if (!mostRecentWorkflow) {
      console.error('No workflow to execute');
      return;
    }
    
    // Get the workflow details
    const workflowDescription = mostRecentWorkflow.description.toLowerCase();
    
    // Determine if this is an event monitoring workflow
    const isEventMonitoring = workflowDescription.includes('listen') || workflowDescription.includes('event');
    const isUSDCBridge = workflowDescription.includes('usdc') && workflowDescription.includes('bridge');
    const isPolygonMonitoring = workflowDescription.includes('polygon');
    const isCeloMonitoring = workflowDescription.includes('celo');
    
    setExecutingWorkflow(true);
    
    try {
      // Handle USDC Bridge workflow
      if (isUSDCBridge) {
        console.log("Starting USDC Bridge with 1inch");
        setInchLogs([]);
        setBridgeRunning(true);
        
        setExecutionStatus({
          success: true,
          message: "Starting USDC Bridge via 1inch. This process may take several minutes.",
          logs: true
        });
        
        // Use full URL with https if available
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
        const evtSource = new EventSource(`http://localhost:3001/run-1inch`);
        
        evtSource.onmessage = (event) => {
          const logData = event.data;
          console.log("Received log:", logData);
          setInchLogs(prev => [...prev, logData]);
        };
        
        evtSource.onerror = (err) => {
          console.error("SSE Error:", err);
          evtSource.close();
          setBridgeRunning(false);
          
          setExecutionStatus({
            success: false,
            message: "Error connecting to log stream. The bridge may still be running in the background.",
            logs: true
          });
        };
        
        // When the stream closes, assume the process is complete
        evtSource.addEventListener('close', () => {
          console.log("1inch process completed");
          setBridgeRunning(false);
          
          setExecutionStatus({
            success: true,
            message: "USDC Bridge operation completed. Check logs for details.",
            logs: true
          });
          
          evtSource.close();
        });
        
        setExecutingWorkflow(false);
        return;
      }
      
      if (isEventMonitoring) {
        // Get the email for event monitoring
        const emailToUse = mostRecentWorkflow.email;
        
        if (!emailToUse) {
          console.error('Missing email for event monitoring');
          setExecutionStatus({
            success: false,
            message: 'Missing email address for notifications.'
          });
          setExecutingWorkflow(false);
          return;
        }
        
        // For event monitoring workflows, we'll directly start monitoring here
        // Set which chains to monitor based on the workflow description
        
        // If neither chain is explicitly mentioned, we don't default to both - 
        // instead, we prioritize based on what's in the description
        if (isPolygonMonitoring) {
          setMonitorPolygon(true);
          setMonitorCelo(false);
          console.log("Starting Polygon-specific monitoring");
        } else if (isCeloMonitoring) {
          setMonitorPolygon(false);
          setMonitorCelo(true);
          console.log("Starting Celo-specific monitoring");
        } else {
          // Only if nothing specified, monitor both
          setMonitorPolygon(true);
          setMonitorCelo(true);
          console.log("Starting monitoring for both chains");
        }
        
        // Start listening and set the active workflow ID
        setIsListening(true);
        setActiveMonitoringId(mostRecentWorkflow.id);
        
        // Set initial success status (will be updated by the monitoring effect)
        setExecutionStatus({
          success: true,
          message: `Initializing event monitoring for ${isPolygonMonitoring ? 'Polygon' : isCeloMonitoring ? 'Celo' : 'blockchain'} events...`,
          monitoring: true
        });
        
        setExecutingWorkflow(false);
        return;
      }
      
      // For transaction workflows (non-event monitoring)
      const emailToUse = mostRecentWorkflow.email;
      const recipientToUse = mostRecentWorkflow.recipient;
      const amountToUse = mostRecentWorkflow.amount;
      
      if (!emailToUse || !recipientToUse || !amountToUse) {
        console.error('Missing required workflow details');
        setExecutionStatus({
          success: false,
          message: 'Missing required details for this workflow.'
        });
        setExecutingWorkflow(false);
        return;
      }
      
      // Call the external transaction endpoint
      const response = await fetch('https://e3c329acf714051138becd9199470e6d1ae0cabd-3001.dstack-prod5.phala.network/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipientToUse,
          amount: amountToUse,
          chainId: "84532", // Use Base Sepolia testnet
          email: emailToUse,
          // We're not setting recordToSheet here - it will be handled after approval
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute transaction');
      }

      const data = await response.json();
      
      if (!data.success) {
        setExecutionStatus({
          success: false,
          message: data.message || 'Transaction failed'
        });
        return;
      }

      // If transaction approval email was sent
      if (data.message && data.message.includes('pending approval')) {
        setExecutionStatus({
          success: true,
          pending: true,
          message: 'Transaction pending email approval. Google Sheet will be updated after approval. Please check your email.',
        });
        
        // Instead of waiting for user to click buttons, set up automatic handling after approval
        // We'll poll the transaction status and then generate reports when complete
        startTransactionPolling(data.transactionId);
      } else {
        // If transaction was processed immediately (unlikely but possible)
        setExecutionStatus({
          success: true,
          message: 'Transaction submitted successfully. Google Sheet will be updated shortly.',
          txHash: data.hash,
        });
        
        // Auto-generate reports immediately
        // Replace direct API calls with script execution
        fetch('/api/run-script', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            script: 'generate_reports.sh'
          })
        })
        .then(response => response.json())
        .then(data => {
          console.log("Report generation script executed:", data);
          setExecutionStatus({
            success: true,
            message: 'Transaction reports and graphs generated automatically',
          });
        })
        .catch(error => {
          console.error("Error running report generation script:", error);
          // Fall back to direct API calls if script execution fails
          handleGenerateReport();
          setTimeout(() => {
            handleGenerateGraphs();
          }, 2000);
        });
      }
      
      // Close the popup after a short delay to allow the user to see the status
      setTimeout(() => {
        onClose();
      }, 5000); // Increased to 5 seconds so user can read the message
      
    } catch (error) {
      console.error('Error executing workflow:', error);
      setExecutionStatus({
        success: false,
        message: error.message || 'Failed to execute workflow'
      });
    } finally {
      if (!isUSDCBridge) {
        setExecutingWorkflow(false);
      }
    }
  };
  
  // Function to create a unique hash for an event to track which ones we've seen
  const createEventHash = (event) => {
    return `${event.blockNumber}-${event.transactionHash}-${event.args?.newCount || '0'}`;
  };
  
  // Function to format event details
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
      
      // Debug log for Polygon events
      console.log("Polygon events API response:", data);
      
      // Set the Polygon events state
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
        if (newEvents.length > 0 && activeMonitoringId) {
          const monitorWorkflow = savedWorkflows.find(w => w.id === activeMonitoringId);
          if (monitorWorkflow && monitorWorkflow.email) {
            console.log(`Sending notification for ${newEvents.length} new Polygon events`);
            sendServerEmail("Polygon Amoy", newEvents, monitorWorkflow.email);
            setMonitoringStats(prev => ({
              ...prev,
              polygonEventsDetected: prev.polygonEventsDetected + newEvents.length,
              notificationsSent: prev.notificationsSent + 1,
              lastEventTime: new Date()
            }));
          }
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
      
      let eventData = data;
      
      // If API doesn't return events, try direct ethers approach like in counterEvents.js
      if (!data.success || !data.events || data.events.length === 0) {
        console.log("API didn't return Celo events, trying direct RPC connection");
        try {
          // Import ethers dynamically if needed
          if (typeof window !== 'undefined') {
            // Using dynamic import for ethers
            const ethersModule = await import('ethers');
            const { ethers } = ethersModule;
            
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
            
            console.log("Formatted Celo events from RPC:", formattedEvents);
            
            // Create success response similar to the API
            eventData = {
              success: true,
              events: formattedEvents,
              message: "Events fetched directly via RPC"
            };
          }
        } catch (directError) {
          console.error("Error with direct Celo RPC connection:", directError);
          // In case of failure, we'll continue with API response
        }
      }
      
      // Set the Celo events state with whatever data we have
      setCeloEvents(eventData);
      
      // Check for new events using our data
      if (eventData.success && eventData.events && eventData.events.length > 0) {
        const newEvents = [];
        
        // Process each event
        eventData.events.forEach(event => {
          const eventHash = createEventHash(event);
          
          // If we haven't seen this event before
          if (!celoEventHashesRef.current.has(eventHash)) {
            celoEventHashesRef.current.add(eventHash);
            newEvents.push(event);
          }
        });
        
        // If we found new events, notify - always send email for any event
        if (newEvents.length > 0 && activeMonitoringId) {
          const monitorWorkflow = savedWorkflows.find(w => w.id === activeMonitoringId);
          if (monitorWorkflow && monitorWorkflow.email) {
            console.log(`Sending notification for ${newEvents.length} new Celo events`);
            sendServerEmail("Celo Testnet", newEvents, monitorWorkflow.email);
            setMonitoringStats(prev => ({
              ...prev,
              celoEventsDetected: prev.celoEventsDetected + newEvents.length,
              notificationsSent: prev.notificationsSent + 1,
              lastEventTime: new Date()
            }));
          }
        }
      }
      
      return eventData;
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
  
  // Send email using the server's email service (Gmail)
  const sendServerEmail = async (network, events, emailAddress) => {
    if (!emailAddress) return;
    
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
          to: emailAddress,
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
  
  // Add this useEffect for auto-scrolling logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [inchLogs]);
  
  // Function to generate transaction report
  const handleGenerateReport = async () => {
    try {
      setExecutingWorkflow(true);
      setExecutionStatus({
        success: true,
        message: "Generating transaction report...",
        logs: false
      });

      const response = await fetch('http://localhost:3001/transactions/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: "0x147151a144fEb00E1e173469B5f90C3B78ae210c",
          chainId: "84532",
          month: "4",
          year: "2025"
        })
      });

      const data = await response.json();
      
      setExecutionStatus({
        success: data.success,
        message: data.message || 'Transaction report generated',
        reportUrl: data.reportUrl,
        count: data.count || 0
      });

      console.log("Transaction report response:", data);
    } catch (error) {
      console.error("Error generating transaction report:", error);
      setExecutionStatus({
        success: false,
        message: error.message || 'Failed to generate transaction report'
      });
    } finally {
      setExecutingWorkflow(false);
    }
  };

  // Function to generate transaction graphs
  const handleGenerateGraphs = async () => {
    try {
      setExecutingWorkflow(true);
      setExecutionStatus({
        success: true,
        message: "Generating transaction graphs and sending email...",
        logs: false
      });

      const response = await fetch('http://localhost:3001/api/transactions/graphs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: "0x147151a144fEb00E1e173469B5f90C3B78ae210c",
          chainId: "84532",
          month: "4",
          year: "2025",
          email: "derekliew0@gmail.com"
        })
      });

      const data = await response.json();
      
      setExecutionStatus({
        success: data.success,
        message: data.message || 'Transaction graphs generated and email sent',
        graphs: true,
        email: data.email
      });

      console.log("Transaction graphs response:", data);
    } catch (error) {
      console.error("Error generating transaction graphs:", error);
      setExecutionStatus({
        success: false,
        message: error.message || 'Failed to generate transaction graphs'
      });
    } finally {
      setExecutingWorkflow(false);
    }
  };

  // Function to poll transaction status and trigger reports when complete
  const startTransactionPolling = (transactionId) => {
    // This will attempt to poll the transaction status
    console.log("Setting up transaction polling for ID:", transactionId);
    
    const checkInterval = setInterval(async () => {
      try {
        // Poll transaction status endpoint (you may need to create this endpoint)
        const response = await fetch(`https://e3c329acf714051138becd9199470e6d1ae0cabd-3001.dstack-prod5.phala.network/transaction/status/${transactionId}`, {
          method: 'GET'
        });
        
        if (!response.ok) {
          console.log("Transaction not completed yet, continuing to poll...");
          return;
        }
        
        const data = await response.json();
        
        // If transaction is complete
        if (data.status === 'completed' || data.status === 'confirmed') {
          clearInterval(checkInterval);
          console.log("Transaction completed, generating reports...");
          
          // Update status
          setExecutionStatus({
            success: true,
            message: 'Transaction completed. Generating reports...',
            txHash: data.hash,
          });
          
          // Auto-generate reports
          handleGenerateReport();
          setTimeout(() => {
            handleGenerateGraphs();
          }, 2000); // Small delay between the two operations
        }
      } catch (error) {
        console.error("Error polling transaction status:", error);
      }
    }, 5000); // Check every 5 seconds
    
    // Clear interval after 2 minutes (24 checks) to prevent infinite polling
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 2 * 60 * 1000);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <img src="/icon/polygon.png" alt="Workflow" className={styles.logo} />
            <div className={styles.logoGlow}></div>
          </div>
          <h2 className={styles.headerTitle}>{readOnly ? "Saved Workflows" : "Workflow Assistant"}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          {workflowApproved ? (
            <div className={styles.completionScreen}>
              <div className={styles.checkmarkContainer}>
                <div className={styles.checkmark}>✓</div>
              </div>
              <h3>Workflow Approved!</h3>
              <p>Your AI workflow has been successfully created and is now active.</p>
              <p className={styles.bookTip}>You can access all your saved workflows by clicking on the books on the coffee table.</p>
              
              {executionStatus && (
                <div className={`${styles.executionStatus} ${executionStatus.success ? styles.successStatus : styles.errorStatus}`}>
                  <p className={styles.statusMessage}>{executionStatus.message}</p>
                </div>
              )}
              
              {/* Only show Execute button if saved workflow exists and no execution is in progress */}
              {savedWorkflows.length > 0 && !executingWorkflow && !executionStatus && (
                <button 
                  className={styles.executeButton} 
                  onClick={handleExecuteWorkflow}
                  disabled={executingWorkflow}
                >
                  {/* Check if this is an event monitoring workflow */}
                  {savedWorkflows[savedWorkflows.length - 1]?.description?.toLowerCase().includes('event') || 
                   savedWorkflows[savedWorkflows.length - 1]?.description?.toLowerCase().includes('listen')
                    ? 'Start Monitoring' 
                    : 'Execute Workflow'}
                </button>
              )}
              
              {/* Show executing status */}
              {executingWorkflow && (
                <div className={styles.executingStatus}>
                  <div className={styles.spinner}></div>
                  <p>Processing workflow...</p>
                </div>
              )}
              
              {/* Show monitoring stats when active */}
              {isListening && activeMonitoringId && (
                <div className={styles.monitoringStats}>
                  <div className={styles.monitoringHeader}>
                    <h4>
                      <span className={styles.monitoringDot}></span>
                      Live Event Monitoring
                    </h4>
                    <button 
                      onClick={() => {
                        setIsListening(false);
                        setExecutionStatus(null);
                      }}
                      className={styles.stopMonitoringButton}
                    >
                      Stop Monitoring
                    </button>
                  </div>
                  
                  <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Polygon Events:</span>
                      <span className={styles.statValue}>{monitoringStats.polygonEventsDetected}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Celo Events:</span>
                      <span className={styles.statValue}>{monitoringStats.celoEventsDetected}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Notifications:</span>
                      <span className={styles.statValue}>{monitoringStats.notificationsSent}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Last Event:</span>
                      <span className={styles.statValue}>{monitoringStats.lastEventTime 
                        ? new Date(monitoringStats.lastEventTime).toLocaleTimeString() 
                        : 'None'}</span>
                    </div>
                  </div>
                  
                  {/* Display recent notifications */}
                  {notificationLog.length > 0 && (
                    <div className={styles.notificationsSection}>
                      <h4>Recent Notifications</h4>
                      <div className={styles.notificationsList}>
                        {notificationLog.slice(0, 3).map(notification => (
                          <div 
                            key={notification.id} 
                            className={styles.notificationItem}
                          >
                            <div className={styles.notificationHeader}>
                              <span className={`${styles.networkBadge} ${
                                notification.network === "Polygon Amoy" 
                                  ? styles.polygonBadge 
                                  : styles.celoBadge
                              }`}>
                                {notification.network}
                              </span>
                              <span className={styles.notificationTime}>
                                {notification.time.toLocaleTimeString()}
                              </span>
                              <span className={styles.emailStatus}>
                                {notification.emailSent 
                                  ? '✓ Email sent' 
                                  : notification.error 
                                    ? '✗ Failed' 
                                    : '⟳ Sending...'}
                              </span>
                            </div>
                            
                            <div className={styles.eventsList}>
                              {notification.events.slice(0, 2).map((event, idx) => (
                                <div key={idx} className={styles.eventItem}>
                                  {formatEventDetail(event)}
                                </div>
                              ))}
                              {notification.events.length > 2 && (
                                <div className={styles.moreEvents}>
                                  + {notification.events.length - 2} more events
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {notificationLog.length > 3 && (
                          <div className={styles.moreNotifications}>
                            + {notificationLog.length - 3} more notifications
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Render the log display component in the monitoring stats section */}
              {executionStatus && executionStatus.logs && (
                <div className={styles.logDisplay}>
                  <div className={styles.logHeader}>
                    <h4>1inch Bridge Logs</h4>
                    {bridgeRunning && <div className={styles.liveIndicator}><span></span> LIVE</div>}
                  </div>
                  <div className={styles.logContent}>
                    {inchLogs.length === 0 && <div className={styles.logEmpty}>Waiting for logs...</div>}
                    {inchLogs.map((log, idx) => (
                      <div key={idx} className={styles.logLine}>
                        {log}
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {!readOnly && (
                <>
                  {/* Example workflows */}
                  <div className={styles.examplesSection}>
                    <p className={styles.examplesTitle}>Try one of these examples:</p>
                    <div className={styles.exampleButtons}>
                      <button
                        onClick={() => handleLoadExample({
                          title: "MetaMask to Gmail",
                          text: "Redirect all signing of MetaMask to Gmail and record in Google Sheets"
                        })}
                        className={styles.exampleButton}
                      >
                        MetaMask to Gmail
                      </button>
                      <button
                        onClick={() => handleLoadExample({
                          title: "USDC Bridge",
                          text: "For all the USDC on Arbitritum bridge to USDC on Base with 1inch"
                        })}
                        className={styles.exampleButton}
                      >
                        USDC Bridge
                      </button>
                      <button
                        onClick={() => handleLoadExample({
                          title: "Polygon Events",
                          text: "Listen to this smart contract on polygon chain then for each event emitted notify me on email"
                        })}
                        className={styles.exampleButton}
                      >
                        Polygon Events
                      </button>
                      <button
                        onClick={() => handleLoadExample({
                          title: "Celo Events",
                          text: "Listen to this smart contract on celo chain then for each event emitted notify me on email"
                        })}
                        className={styles.exampleButton}
                      >
                        Celo Events
                      </button>
                    </div>
                  </div>
                  
                  {/* Always show the form regardless of plugin status */}
                  <form onSubmit={handleParseWorkflow} className={styles.workflowForm}>
                    <textarea
                      value={workflowInput}
                      onChange={(e) => setWorkflowInput(e.target.value)}
                      placeholder="Describe your workflow (e.g., Monitor MetaMask transactions and send summaries to Gmail)"
                      className={styles.workflowInput}
                      disabled={workflowLoading}
                    />
                    <button
                      type="submit"
                      className={styles.parseButton}
                      disabled={workflowLoading || !workflowInput.trim()}
                    >
                      {workflowLoading ? 'Parsing...' : 'Parse Workflow'}
                    </button>
                  </form>
        
                  {/* Result Section - Always show if workflow has been parsed, regardless of plugin status */}
                  {workflowParsed && workflowParsed.length > 0 && (
                    <div className={styles.resultSection}>
                      {/* Visual Flow Chart */}
                      <div className={styles.flowchartSection}>
                        <FlowChart workflow={workflowParsed} />
                      </div>
                      
                      {/* Input Fields for Email, Recipient, Amount */}
                      {renderInputFields()}
                      
                      {/* Action Buttons */}
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.tryAgainButton}
                          onClick={() => {
                            setWorkflowParsed([]);
                            setUserEmail('');
                            setRecipientAddress('');
                            setTransactionAmount('');
                          }}
                        >
                          Try Again
                        </button>
                        <button 
                          className={styles.approveButton}
                          onClick={saveWorkflow}
                          disabled={!inputsComplete}
                        >
                          Approve Workflow
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Saved Workflows Section - Only show in readOnly mode */}
              {readOnly && (
                savedWorkflows.length > 0 ? (
                  <div ref={savedSectionRef} className={styles.savedWorkflowsSection}>
                    <div className={styles.savedWorkflowsHeader}>
                      <h3 className={styles.savedWorkflowsTitle}>Saved Workflows</h3>
                      <span className={styles.workflowsCount}>{savedWorkflows.length} workflows</span>
                    </div>
                    <div className={styles.savedWorkflowsList}>
                      {savedWorkflows.map((saved) => (
                        <div key={saved.id} className={styles.savedWorkflow}>
                          <div className={styles.savedWorkflowHeader}>
                            <div className={styles.savedWorkflowInfo}>
                              <h4 className={styles.savedWorkflowDescription}>
                                {saved.description}
                              </h4>
                              <p className={styles.savedWorkflowDate}>
                                Saved on {new Date(saved.createdAt).toLocaleString()}
                              </p>
                              {saved.email && (
                                <p className={styles.savedWorkflowEmail}>
                                  Email: {saved.email}
                                </p>
                              )}
                            </div>
                            <div className={styles.savedWorkflowActions}>
                              <button 
                                className={styles.deleteButton}
                                onClick={() => deleteWorkflow(saved.id)}
                                aria-label="Delete workflow"
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M2.5 1C2.5 0.447715 2.94772 0 3.5 0H12.5C13.0523 0 13.5 0.447715 13.5 1V2H15C15.5523 2 16 2.44772 16 3C16 3.55228 15.5523 4 15 4H14V14C14 15.1046 13.1046 16 12 16H4C2.89543 16 2 15.1046 2 14V4H1C0.447715 4 0 3.55228 0 3C0 2.44772 0.447715 2 1 2H2.5V1ZM4.5 2H11.5V1H4.5V2ZM4 4V14H12V4H4ZM6 6C6.55228 6 7 6.44772 7 7V11C7 11.5523 6.55228 12 6 12C5.44772 12 5 11.5523 5 11V7C5 6.44772 5.44772 6 6 6ZM10 6C10.5523 6 11 6.44772 11 7V11C11 11.5523 10.5523 12 10 12C9.44772 12 9 11.5523 9 11V7C9 6.44772 9.44772 6 10 6Z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <FlowChart workflow={saved.workflow} />
                          {(saved.recipient || saved.amount) && (
                            <div className={styles.savedWorkflowDetails}>
                              {saved.recipient && <p>Recipient: {saved.recipient}</p>}
                              {saved.amount && <p>Amount: {saved.amount}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.noWorkflowsMessage}>
                    <p>No saved workflows yet.</p>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 