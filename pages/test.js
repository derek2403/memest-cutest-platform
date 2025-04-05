import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

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
const FlowChart = ({ workflow }) => {
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
    </div>
  );
};

export default function Test() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [workflowInput, setWorkflowInput] = useState('');
  const [workflowParsed, setWorkflowParsed] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState([]);
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

  // Save the current parsed workflow to localStorage
  const saveWorkflow = () => {
    if (!workflowParsed || workflowParsed.length === 0) return;
    
    try {
      const newSavedWorkflow = {
        id: Date.now(), // Generate a unique ID based on timestamp
        description: workflowInput,
        workflow: workflowParsed,
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
                <FlowChart workflow={workflowParsed} />
                
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
                {savedWorkflows.map((saved) => (
                  <div key={saved.id} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-md">{saved.description}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Saved on {new Date(saved.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => deleteWorkflow(saved.id)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    <FlowChart workflow={saved.workflow} />
                  </div>
                ))}
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
