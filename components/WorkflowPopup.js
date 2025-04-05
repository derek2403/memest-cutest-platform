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

// Example workflows
const EXAMPLE_WORKFLOWS = [
  {
    title: 'MetaMask Transaction Tracker',
    text: 'For each transaction in MetaMask notify in Gmail then record in Google Sheets'
  },
  {
    title: 'Token Swap Tracker',
    text: 'For each transaction in MetaMask swap all tokens to Solana on 1inch'
  },
  {
    title: 'Automated Reports',
    text: 'Every Monday at 9 AM, collect data from Google Sheets and send a report to Gmail'
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
      // Enhanced parsing logic to create workflow nodes and arrows
      const workflow = [];
      const input = workflowInput.trim();
      
      // Add Start node
      workflow.push({
        type: 'node',
        number: 1,
        content: 'Start'
      });
      
      // First, identify potential triggers/actions by specific keywords
      const parts = [];
      
      if (input.includes('For each transaction in')) {
        // Add MetaMask as second node with connection label
        workflow.push({
          type: 'arrow',
          number: 1,
          content: 'For each transaction in'
        });
        
        workflow.push({
          type: 'node',
          number: 2,
          content: 'MetaMask'
        });
        
        // Check for Gmail notification
        if (input.includes('notify in Gmail')) {
          workflow.push({
            type: 'arrow',
            number: 2,
            content: 'Notify in'
          });
          
          workflow.push({
            type: 'node',
            number: 3,
            content: 'Gmail'
          });
        }
        
        // Check for Google Sheets recording
        if (input.includes('record in Google Sheets')) {
          workflow.push({
            type: 'arrow',
            number: 3,
            content: 'Record in'
          });
          
          workflow.push({
            type: 'node',
            number: 4,
            content: 'Google Sheets'
          });
        }
      } else {
        // Fallback to simple parsing for other cases
        const basicParts = input.split(/\s+and\s+|,\s+then\s+|,\s+|then\s+/gi).filter(part => part.trim());
        
        if (basicParts.length === 0) {
          throw new Error("Could not parse workflow text. Please try a different format.");
        }
        
        basicParts.forEach((part, index) => {
          workflow.push({
            type: 'arrow',
            number: index + 1,
            content: index === 0 ? 'Start with' : 'then'
          });
          
          workflow.push({
            type: 'node',
            number: index + 2,
            content: part.trim()
          });
        });
      }
      
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
                      className={styles.tryAgainButton}
                      onClick={() => {
                        setWorkflowParsed([]);
                      }}
                    >
                      Try Again
                    </button>
                    <button 
                      className={styles.approveButton}
                      onClick={() => {
                        setWorkflowApproved(true);
                      }}
                    >
                      Approve Workflow
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