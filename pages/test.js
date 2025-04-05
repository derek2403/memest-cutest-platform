import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navigation from '../components/Navigation';

// Example workflow scenarios
const EXAMPLE_WORKFLOWS = [
  {
    title: "MetaMask Notifications",
    text: "For each transaction in MetaMask notify in Gmail and record in Google Sheets"
  },
  {
    title: "Token Swap with 1inch",
    text: "For each transaction in MetaMask notify in Gmail and record in Google Sheets and swap all tokens to Solana on 1inch"
  },
  {
    title: "Approval Workflow",
    text: "If transaction > 30USD then get approval from Gmail then execute transaction in MetaMask"
  },
  {
    title: "Bridge to Polygon",
    text: "When token price drops below $50 on 1inch then swap ETH to Polygon and notify in Gmail"
  },
  {
    title: "Token Receiving Flow",
    text: "For each receiving token on MetaMask swap all to Solana on 1inch"
  }
];

// Flow Chart Component to visualize the workflow
const FlowChart = ({ workflow, onRunFlow }) => {
  if (!workflow || workflow.length === 0) return null;
  
  // Filter to get only nodes and arrows
  const nodes = workflow.filter(item => item.type === 'node');
  const arrows = workflow.filter(item => item.type === 'arrow');
  
  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">Visual Workflow:</h3>
      <div className="relative p-4 overflow-x-auto">
        <div className="flex items-center min-w-max">
          {/* First node */}
          {nodes.length > 0 && (
            <div className="flex-shrink-0 w-36 h-20 bg-purple-100 border-2 border-purple-300 rounded-lg flex items-center justify-center p-2 text-center font-medium">
              {nodes[0].content}
            </div>
          )}
          
          {/* All arrows and subsequent nodes */}
          {arrows.map((arrow, index) => {
            const targetNode = nodes[index + 1];
            if (!targetNode) return null;
            
            return (
              <div key={index} className="flex items-center">
                {/* Arrow with Text */}
                <div className="flex flex-col items-center mx-3">
                  <div className="text-xs text-gray-600 mb-1">{arrow.content}</div>
                  <div className="flex items-center">
                    <div className="h-0.5 w-20 bg-gray-700"></div>
                    <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-t-transparent border-b-transparent border-l-gray-700"></div>
                  </div>
                </div>
                
                {/* Target Node */}
                <div className="flex-shrink-0 w-36 h-20 bg-purple-100 border-2 border-purple-300 rounded-lg flex items-center justify-center p-2 text-center font-medium">
                  {targetNode.content}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Run Flow button */}
      {onRunFlow && (
        <div className="mt-4">
          <button
            onClick={onRunFlow}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Run Workflow
          </button>
        </div>
      )}
    </div>
  );
};

// Helper function to format ETH amount
const formatEther = (amount) => {
  try {
    // Try to use ethers if available
    if (typeof ethers !== 'undefined' && ethers.utils) {
      return ethers.utils.formatEther(amount);
    } 
    // Fallback to manual calculation
    return (BigInt(amount) / BigInt(10**18)).toString();
  } catch (error) {
    // If all else fails, just return the original amount
    console.error('Error formatting ETH amount:', error);
    return amount;
  }
};

// Helper function to validate Ethereum address format
const isValidEthAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export default function Test() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [workflowInput, setWorkflowInput] = useState('');
  const [workflowParsed, setWorkflowParsed] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [workflowEmail, setWorkflowEmail] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [runningWorkflow, setRunningWorkflow] = useState(false);
  const messagesEndRef = useRef(null);

  // Load saved workflows from localStorage when the component mounts
  useEffect(() => {
    try {
      const saved = localStorage.getItem('savedWorkflows');
      if (saved) {
        setSavedWorkflows(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved workflows:', error);
    }
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle executing the workflow
  const handleRunWorkflow = async (savedWorkflow = null) => {
    // Use the provided saved workflow if available, otherwise use the current workflow
    const workflowToRun = savedWorkflow || {
      description: workflowInput || 'For each transaction in MetaMask notify in Gmail and record in Google Sheets',
      workflow: workflowParsed,
      email: workflowEmail
    };
    
    // Determine which email to use
    const emailToUse = savedWorkflow && savedWorkflow.email ? savedWorkflow.email : workflowEmail;
    
    // Get recipient address and amount - for saved workflows, we still need to get from DOM
    let recipientAddressToUse = recipientAddress;
    let amountToUse = transactionAmount;
    
    if (savedWorkflow) {
      // Get inputs from the saved workflow form
      recipientAddressToUse = document.getElementById(`recipient-address-${savedWorkflow.id}`)?.value;
      amountToUse = document.getElementById(`amount-${savedWorkflow.id}`)?.value;
    }
    
    // Validate required fields
    if (!emailToUse) {
      setWorkflowStatus({
        success: false,
        message: 'Please enter an email address to receive notifications'
      });
      return;
    }
    
    if (!recipientAddressToUse) {
      setWorkflowStatus({
        success: false,
        message: 'Please enter a recipient address'
      });
      return;
    }
    
    // Validate Ethereum address format
    if (!isValidEthAddress(recipientAddressToUse)) {
      setWorkflowStatus({
        success: false,
        message: 'Please enter a valid Ethereum address (0x followed by 40 hexadecimal characters)'
      });
      return;
    }
    
    if (!amountToUse) {
      setWorkflowStatus({
        success: false,
        message: 'Please enter a transaction amount'
      });
      return;
    }
    
    if (parseFloat(amountToUse) <= 0) {
      setWorkflowStatus({
        success: false,
        message: 'Please enter a transaction amount greater than 0'
      });
      return;
    }
    
    setRunningWorkflow(true);
    setWorkflowStatus(null);

    try {
      // Call the external transaction endpoint instead of the local server
      const response = await fetch('https://e3c329acf714051138becd9199470e6d1ae0cabd-3001.dstack-prod5.phala.network/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipientAddressToUse,
          amount: amountToUse,
          chainId: "84532", // Use Base Sepolia testnet
          email: emailToUse
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute transaction');
      }

      const data = await response.json();
      
      // Handle transaction status similar to mcptest.js
      if (!data.success) {
        setWorkflowStatus({
          success: false,
          message: data.message || 'Transaction failed'
        });
        return;
      }

      // If transaction approval email was sent
      if (data.message && data.message.includes('pending approval')) {
        setWorkflowStatus({
          success: true,
          pending: true,
          message: 'Transaction pending email approval. Please check your email and click "Approve" to execute the transaction. The approval link will direct to: https://e3c329acf714051138becd9199470e6d1ae0cabd-3001.dstack-prod5.phala.network/transaction/verify'
        });
        return;
      }
      
      // If transaction was processed immediately
      setWorkflowStatus({
        success: true,
        message: 'Transaction submitted',
        txData: data
      });
    } catch (error) {
      console.error('Error executing workflow:', error);
      setWorkflowStatus({
        success: false,
        message: error.message || 'Failed to execute workflow'
      });
    } finally {
      setRunningWorkflow(false);
    }
  };

  // Handle chat message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: [{ type: 'text', text: input }] };
    
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/claude-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.content]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: [{ type: 'text', text: 'Sorry, there was an error processing your request.' }],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle loading an example workflow
  const handleLoadExample = (example) => {
    setWorkflowInput(example.text);
    setWorkflowParsed([]);
    setWorkflowStatus(null);
  };

  // Handle workflow parsing
  const handleParseWorkflow = async (e) => {
    e.preventDefault();
    if (!workflowInput.trim()) return;

    setWorkflowLoading(true);
    setWorkflowStatus(null);

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
      alert('Failed to parse workflow. Please try again.');
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
        email: workflowEmail || '', // Store the email if provided
        createdAt: new Date().toISOString()
      };
      
      const updatedWorkflows = [...savedWorkflows, newSavedWorkflow];
      setSavedWorkflows(updatedWorkflows);
      localStorage.setItem('savedWorkflows', JSON.stringify(updatedWorkflows));
      
      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow');
    }
  };

  // Delete a saved workflow
  const deleteWorkflow = (id) => {
    try {
      const updatedWorkflows = savedWorkflows.filter(workflow => workflow.id !== id);
      setSavedWorkflows(updatedWorkflows);
      localStorage.setItem('savedWorkflows', JSON.stringify(updatedWorkflows));
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Failed to delete workflow');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Head>
        <title>Workflow Parser with Claude Chat</title>
        <meta name="description" content="Parse workflow diagrams and chat with Claude AI" />
      </Head>

      <Navigation />

      <main className="flex flex-col flex-grow p-4 md:p-8 gap-6 max-w-6xl mx-auto w-full">
        {/* Workflow Parser Section */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4">Workflow Diagram Parser</h2>
          
          {/* Example workflows */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Try one of these examples:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_WORKFLOWS.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleLoadExample(example)}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition"
                >
                  {example.title}
                </button>
              ))}
            </div>
          </div>
          
          <form onSubmit={handleParseWorkflow} className="flex flex-col gap-3">
            <textarea
              value={workflowInput}
              onChange={(e) => setWorkflowInput(e.target.value)}
              placeholder="Enter a workflow description like: For each transaction in MetaMask notify in Gmail and swap all tokens to Solana on 1inch"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              disabled={workflowLoading}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              disabled={workflowLoading || !workflowInput.trim()}
            >
              {workflowLoading ? 'Parsing...' : 'Parse Workflow'}
            </button>
          </form>

          {workflowParsed.length > 0 && (
            <>
              <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                <h3 className="text-lg font-medium mb-3">Parsed Workflow:</h3>
                <div className="space-y-2">
                  {workflowParsed.map((item, index) => (
                    <div key={index} className="flex">
                      <div className="w-24 font-medium">
                        {item.type === 'node' ? `Node ${item.number}:` : `Arrow ${item.number}:`}
                      </div>
                      <div className="flex-1">{item.content}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Visual Flow Chart */}
              <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                <FlowChart workflow={workflowParsed} onRunFlow={handleRunWorkflow} />
                
                {/* Email Input for Workflow */}
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="mb-3">
                    <label htmlFor="workflow-email" className="block text-sm font-medium text-gray-700">
                      Email for Transaction Approval <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="workflow-email"
                      type="email"
                      value={workflowEmail}
                      onChange={(e) => setWorkflowEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      disabled={runningWorkflow}
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      This email will receive notifications for MetaMask transactions
                    </p>
                  </div>
                  
                  {/* Transaction Inputs */}
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="recipient-address" className="block text-sm font-medium text-gray-700">
                        Recipient Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="recipient-address"
                        type="text"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        placeholder="0x..."
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                        Amount (ETH) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="amount"
                        type="number"
                        step="0.000000000000000001"
                        value={transactionAmount}
                        onChange={(e) => setTransactionAmount(e.target.value)}
                        placeholder="0.0"
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Run Workflow Button */}
                  <div className="mt-4">
                    <button
                      onClick={handleRunWorkflow}
                      disabled={runningWorkflow || !workflowEmail || !recipientAddress || !transactionAmount}
                      className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {runningWorkflow ? 'Processing...' : 'Send Transaction'}
                    </button>
                    
                    {/* Transaction Error Message */}
                    {workflowStatus && !workflowStatus.success && (
                      <div className="mt-2 p-2 bg-red-50 text-red-700 rounded-md text-sm">
                        {workflowStatus.message}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Workflow Status */}
                {workflowStatus && (
                  <div className={`mt-4 p-4 rounded-md ${workflowStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <p className="font-medium">
                      {workflowStatus.message || (workflowStatus.success ? 'Workflow executed successfully' : 'Failed to execute workflow')}
                    </p>
                    
                    {/* Execution Result */}
                    {workflowStatus.executionResult && (
                      <div className="mt-3 border-t border-gray-200 pt-3">
                        <h4 className="font-medium mb-2">Workflow Execution Results:</h4>
                        <p>{workflowStatus.executionResult.message}</p>
                        
                        {workflowStatus.executionResult.emailSetup && (
                          <div className="mt-2 bg-white bg-opacity-50 p-3 rounded">
                            <h5 className="font-medium text-sm mb-1">Email Notification Setup:</h5>
                            <p className="text-sm">
                              {workflowStatus.executionResult.emailSetup.success 
                                ? 'Email verification has been initiated. Please check your inbox.' 
                                : 'Failed to set up email notifications.'}
                            </p>
                          </div>
                        )}
                        
                        {workflowStatus.executionResult.exampleTransaction && (
                          <div className="mt-2 bg-white bg-opacity-50 p-3 rounded">
                            <h5 className="font-medium text-sm mb-1">Example Transaction Handling:</h5>
                            <p className="text-sm">When a transaction occurs, the following workflow will be triggered:</p>
                            <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                              <p>From: {workflowStatus.executionResult.exampleTransaction.from}</p>
                              <p>To: {workflowStatus.executionResult.exampleTransaction.to}</p>
                              <p>Amount: {formatEther(workflowStatus.executionResult.exampleTransaction.amount)} ETH</p>
                              <p>Chain ID: {workflowStatus.executionResult.exampleTransaction.chainId}</p>
                            </div>
                            <p className="mt-2 text-sm">An email notification will be sent to <span className="font-medium">{workflowStatus.email}</span> and the transaction will be recorded in Google Sheets.</p>
                          </div>
                        )}
                        
                        {workflowStatus.executionResult.spreadsheetSetup && (
                          <div className="mt-2 bg-white bg-opacity-50 p-3 rounded">
                            <h5 className="font-medium text-sm mb-1">Google Sheets Setup:</h5>
                            <p className="text-sm">
                              {workflowStatus.executionResult.spreadsheetSetup.success 
                                ? 'Google Sheets has been prepared for transaction recording.' 
                                : 'Failed to set up Google Sheets.'}
                            </p>
                            {workflowStatus.executionResult.spreadsheetSetup.reportUrl && (
                              <p className="text-sm mt-1">
                                <a 
                                  href={workflowStatus.executionResult.spreadsheetSetup.reportUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  View Google Sheet
                                </a>
                              </p>
                            )}
                          </div>
                        )}
                        
                        {workflowStatus.executionResult.error && (
                          <div className="mt-2 bg-red-50 p-3 rounded">
                            <h5 className="font-medium text-sm mb-1">Error:</h5>
                            <p className="text-sm text-red-700">{workflowStatus.executionResult.error}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {workflowStatus.details && !workflowStatus.executionResult && (
                      <div className="mt-2 text-sm">
                        <pre className="whitespace-pre-wrap bg-white bg-opacity-50 p-3 rounded">
                          {JSON.stringify(workflowStatus.details, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {workflowStatus.functions && (
                      <div className="mt-3 border-t border-gray-200 pt-3">
                        <h4 className="font-medium mb-2">Workflow Analysis:</h4>
                        <div className="bg-white bg-opacity-50 p-3 rounded text-sm">
                          <p><strong>Name:</strong> {workflowStatus.functions.workflowName}</p>
                          <p><strong>Description:</strong> {workflowStatus.functions.description}</p>
                          
                          {workflowStatus.functions.steps && workflowStatus.functions.steps.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium">Steps:</p>
                              <ol className="list-decimal list-inside mt-1">
                                {workflowStatus.functions.steps.map((step, index) => (
                                  <li key={index} className="mt-1">
                                    <span className="font-medium">{step.service}.{step.function}</span>
                                    <p className="text-xs ml-4 text-gray-600">{step.description}</p>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Save Workflow Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={saveWorkflow}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Save Workflow
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Saved Workflows Section */}
          {savedWorkflows.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold mb-4">Saved Workflows</h3>
              <div className="space-y-4">
                {savedWorkflows.map((saved) => {
                  // Determine if this workflow has a saved email
                  const hasSavedEmail = saved.email && saved.email.trim() !== '';
                  
                  return (
                    <div key={saved.id} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-md">{saved.description}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Saved on {new Date(saved.createdAt).toLocaleString()}
                          </p>
                          {hasSavedEmail && (
                            <p className="text-xs text-blue-500 mt-1">
                              Email: {saved.email}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              // Use the saved email if available
                              if (hasSavedEmail) {
                                setWorkflowEmail(saved.email);
                              }
                              setWorkflowStatus(null);
                              handleRunWorkflow(saved);
                            }}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
                            disabled={runningWorkflow}
                          >
                            {runningWorkflow ? 'Running...' : 'Run'}
                          </button>
                          <button 
                            onClick={() => deleteWorkflow(saved.id)}
                            className="px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <FlowChart workflow={saved.workflow} />
                      
                      {/* Email Input for Saved Workflow */}
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <div className="mb-3">
                          <label htmlFor={`workflow-email-${saved.id}`} className="block text-sm font-medium text-gray-700">
                            Email for Transaction Approval <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-1 flex space-x-2">
                            <input
                              id={`workflow-email-${saved.id}`}
                              type="email"
                              value={hasSavedEmail ? saved.email : workflowEmail}
                              onChange={(e) => {
                                // If this workflow has a saved email, update it
                                if (hasSavedEmail) {
                                  const updatedWorkflows = savedWorkflows.map(workflow => {
                                    if (workflow.id === saved.id) {
                                      return {
                                        ...workflow,
                                        email: e.target.value
                                      };
                                    }
                                    return workflow;
                                  });
                                  setSavedWorkflows(updatedWorkflows);
                                  localStorage.setItem('savedWorkflows', JSON.stringify(updatedWorkflows));
                                } else {
                                  setWorkflowEmail(e.target.value);
                                }
                              }}
                              placeholder="Enter your email address"
                              className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                              disabled={runningWorkflow}
                              required
                            />
                            <button
                              onClick={() => {
                                setWorkflowStatus(null);
                                // Use the saved email if available
                                if (hasSavedEmail) {
                                  setWorkflowEmail(saved.email);
                                }
                                handleRunWorkflow(saved);
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                              disabled={
                                runningWorkflow || 
                                (!workflowEmail && !hasSavedEmail) || 
                                !document.getElementById(`recipient-address-${saved.id}`)?.value || 
                                !document.getElementById(`amount-${saved.id}`)?.value
                              }
                            >
                              {runningWorkflow ? 'Running...' : 'Run Workflow'}
                            </button>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            This email will receive notifications for MetaMask transactions
                          </p>
                          
                          {/* Transaction Inputs for Saved Workflow */}
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor={`recipient-address-${saved.id}`} className="block text-sm font-medium text-gray-700">
                                Recipient Address <span className="text-red-500">*</span>
                              </label>
                              <input
                                id={`recipient-address-${saved.id}`}
                                type="text"
                                placeholder="0x..."
                                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor={`amount-${saved.id}`} className="block text-sm font-medium text-gray-700">
                                Amount (ETH) <span className="text-red-500">*</span>
                              </label>
                              <input
                                id={`amount-${saved.id}`}
                                type="number"
                                step="0.000000000000000001"
                                placeholder="0.0"
                                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Display workflow status when it's this specific workflow running */}
                      {workflowStatus && (
                        <div className={`mt-4 p-4 rounded-md ${workflowStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          <p className="font-medium">
                            {workflowStatus.message || (workflowStatus.success ? 'Workflow executed successfully' : 'Failed to execute workflow')}
                          </p>
                          
                          {/* Execution Result */}
                          {workflowStatus.executionResult && (
                            <div className="mt-3 border-t border-gray-200 pt-3">
                              <h4 className="font-medium mb-2">Workflow Execution Results:</h4>
                              <p>{workflowStatus.executionResult.message}</p>
                              
                              {workflowStatus.executionResult.emailSetup && (
                                <div className="mt-2 bg-white bg-opacity-50 p-3 rounded">
                                  <h5 className="font-medium text-sm mb-1">Email Notification Setup:</h5>
                                  <p className="text-sm">
                                    {workflowStatus.executionResult.emailSetup.success 
                                      ? 'Email verification has been initiated. Please check your inbox.' 
                                      : 'Failed to set up email notifications.'}
                                  </p>
                                </div>
                              )}
                              
                              {workflowStatus.executionResult.exampleTransaction && (
                                <div className="mt-2 bg-white bg-opacity-50 p-3 rounded">
                                  <h5 className="font-medium text-sm mb-1">Example Transaction Handling:</h5>
                                  <p className="text-sm">When a transaction occurs, the following workflow will be triggered:</p>
                                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                                    <p>From: {workflowStatus.executionResult.exampleTransaction.from}</p>
                                    <p>To: {workflowStatus.executionResult.exampleTransaction.to}</p>
                                    <p>Amount: {formatEther(workflowStatus.executionResult.exampleTransaction.amount)} ETH</p>
                                    <p>Chain ID: {workflowStatus.executionResult.exampleTransaction.chainId}</p>
                                  </div>
                                  <p className="mt-2 text-sm">An email notification will be sent to <span className="font-medium">{workflowStatus.email}</span> and the transaction will be recorded in Google Sheets.</p>
                                </div>
                              )}
                              
                              {workflowStatus.executionResult.spreadsheetSetup && (
                                <div className="mt-2 bg-white bg-opacity-50 p-3 rounded">
                                  <h5 className="font-medium text-sm mb-1">Google Sheets Setup:</h5>
                                  <p className="text-sm">
                                    {workflowStatus.executionResult.spreadsheetSetup.success 
                                      ? 'Google Sheets has been prepared for transaction recording.' 
                                      : 'Failed to set up Google Sheets.'}
                                  </p>
                                  {workflowStatus.executionResult.spreadsheetSetup.reportUrl && (
                                    <p className="text-sm mt-1">
                                      <a 
                                        href={workflowStatus.executionResult.spreadsheetSetup.reportUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        View Google Sheet
                                      </a>
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {workflowStatus.executionResult.error && (
                                <div className="mt-2 bg-red-50 p-3 rounded">
                                  <h5 className="font-medium text-sm mb-1">Error:</h5>
                                  <p className="text-sm text-red-700">{workflowStatus.executionResult.error}</p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {workflowStatus.details && !workflowStatus.executionResult && (
                            <div className="mt-2 text-sm">
                              <pre className="whitespace-pre-wrap bg-white bg-opacity-50 p-3 rounded">
                                {JSON.stringify(workflowStatus.details, null, 2)}
                              </pre>
                            </div>
                          )}
                          
                          {workflowStatus.functions && (
                            <div className="mt-3 border-t border-gray-200 pt-3">
                              <h4 className="font-medium mb-2">Workflow Analysis:</h4>
                              <div className="bg-white bg-opacity-50 p-3 rounded text-sm">
                                <p><strong>Name:</strong> {workflowStatus.functions.workflowName}</p>
                                <p><strong>Description:</strong> {workflowStatus.functions.description}</p>
                                
                                {workflowStatus.functions.steps && workflowStatus.functions.steps.length > 0 && (
                                  <div className="mt-2">
                                    <p className="font-medium">Steps:</p>
                                    <ol className="list-decimal list-inside mt-1">
                                      {workflowStatus.functions.steps.map((step, index) => (
                                        <li key={index} className="mt-1">
                                          <span className="font-medium">{step.service}.{step.function}</span>
                                          <p className="text-xs ml-4 text-gray-600">{step.description}</p>
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className="flex flex-col flex-grow bg-white rounded-lg shadow-md">
          <div className="flex-grow overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  Start a conversation with Claude AI
                </div>
              )}
              
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {message.content && Array.isArray(message.content) 
                      ? message.content.map((item, i) => {
                          if (item.type === 'text') {
                            return <p key={i}>{item.text}</p>;
                          } else if (item.type === 'image') {
                            return (
                              <img
                                key={i}
                                src={item.source.url}
                                alt="Image from Claude"
                                className="max-w-full h-auto rounded-md mt-2"
                              />
                            );
                          }
                          return null;
                        })
                      : message.content
                    }
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-200 p-4 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}