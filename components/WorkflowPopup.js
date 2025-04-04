import React, { useState, useEffect } from 'react';
import styles from '../styles/WorkflowPopup.module.css';

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

// Example workflows to choose from
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

export default function WorkflowPopup({ initialInput = '', onClose }) {
  const [workflowInput, setWorkflowInput] = useState(initialInput);
  const [workflowParsed, setWorkflowParsed] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowApproved, setWorkflowApproved] = useState(false);
  
  // Parse the workflow when component mounts if initialInput is provided
  useEffect(() => {
    if (initialInput) {
      handleParseWorkflow();
    }
  }, []);

  // Handle loading an example workflow
  const handleLoadExample = (example) => {
    setWorkflowInput(example.text);
  };

  // Handle workflow parsing
  const handleParseWorkflow = async (e) => {
    if (e) e.preventDefault();
    if (!workflowInput.trim()) return;

    setWorkflowLoading(true);

    try {
      // Local parsing instead of API call
      // Simple parsing logic to create workflow nodes and arrows
      const parts = workflowInput.split(/\s+and\s+|,\s+then\s+|,\s+|then\s+/gi).filter(part => part.trim());
      const workflow = [];
      
      if (parts.length === 0) {
        throw new Error("Could not parse workflow text. Please try a different format.");
      }
      
      parts.forEach((part, index) => {
        // Add a node
        workflow.push({
          type: 'node',
          number: index + 1,
          content: part.trim()
        });
        
        // Add an arrow after each node except the last
        if (index < parts.length - 1) {
          workflow.push({
            type: 'arrow',
            number: index + 1,
            content: 'then'
          });
        }
      });
      
      // Wait a bit to simulate processing time
      setTimeout(() => {
        setWorkflowParsed(workflow);
        setWorkflowLoading(false);
      }, 800);
      
    } catch (error) {
      console.error('Error parsing workflow:', error);
      
      // Show user-friendly error
      alert(error.message || 'Failed to parse workflow. Please try again with a different format.');
      
      // Reset loading state
      setWorkflowLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <img src="/icon/metamask.png" alt="Workflow" className={styles.logo} />
            <div className={styles.logoGlow}></div>
          </div>
          <h2>Workflow Assistant</h2>
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
              <button className={styles.doneButton} onClick={onClose}>
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Example workflows */}
              <div className={styles.examplesSection}>
                <p className={styles.examplesTitle}>Try one of these examples:</p>
                <div className={styles.exampleButtons}>
                  {EXAMPLE_WORKFLOWS.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleLoadExample(example)}
                      className={styles.exampleButton}
                    >
                      {example.title}
                    </button>
                  ))}
                </div>
              </div>
              
              <form onSubmit={handleParseWorkflow} className={styles.workflowForm}>
                <textarea
                  value={workflowInput}
                  onChange={(e) => setWorkflowInput(e.target.value)}
                  placeholder="Enter a workflow description like: For each transaction in MetaMask notify in Gmail and swap all tokens to Solana on 1inch"
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
    
              {workflowParsed.length > 0 && (
                <div className={styles.resultSection}>
                  {/* Visual Flow Chart */}
                  <div className={styles.flowchartSection}>
                    <FlowChart workflow={workflowParsed} />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className={styles.actionButtons}>
                    <button 
                      className={styles.approveButton}
                      onClick={() => {
                        setWorkflowApproved(true);
                      }}
                    >
                      Approve Workflow
                    </button>
                    <button 
                      className={styles.tryAgainButton}
                      onClick={() => {
                        setWorkflowParsed([]);
                      }}
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 