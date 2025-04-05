import { useState } from 'react';

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

// Helper function to validate Ethereum address format
const isValidEthAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const WorkflowGenerator = ({ onSaveWorkflow, onRunWorkflow, runningWorkflow, workflowStatus }) => {
  const [workflowInput, setWorkflowInput] = useState('');
  const [workflowParsed, setWorkflowParsed] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowEmail, setWorkflowEmail] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');

  // Handle loading an example workflow
  const handleLoadExample = (example) => {
    setWorkflowInput(example.text);
    setWorkflowParsed([]);
  };

  // Handle workflow parsing
  const handleParseWorkflow = async (e) => {
    e.preventDefault();
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
      alert('Failed to parse workflow. Please try again.');
    } finally {
      setWorkflowLoading(false);
    }
  };

  // Save the current parsed workflow
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
      
      onSaveWorkflow(newSavedWorkflow);
      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow');
    }
  };

  // Handle running the workflow
  const handleRunWorkflow = () => {
    // Validate required fields
    if (!workflowEmail) {
      alert('Please enter an email address to receive notifications');
      return;
    }
    
    if (!recipientAddress) {
      alert('Please enter a recipient address');
      return;
    }
    
    // Validate Ethereum address format
    if (!isValidEthAddress(recipientAddress)) {
      alert('Please enter a valid Ethereum address (0x followed by 40 hexadecimal characters)');
      return;
    }
    
    if (!transactionAmount) {
      alert('Please enter a transaction amount');
      return;
    }
    
    if (parseFloat(transactionAmount) <= 0) {
      alert('Please enter a transaction amount greater than 0');
      return;
    }
    
    // Call the parent component's run workflow function
    onRunWorkflow({
      description: workflowInput,
      workflow: workflowParsed,
      email: workflowEmail,
      recipientAddress: recipientAddress,
      amount: transactionAmount
    });
  };

  return (
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
                
                {/* Add workflow status details here as needed */}
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
    </div>
  );
};

export default WorkflowGenerator; 