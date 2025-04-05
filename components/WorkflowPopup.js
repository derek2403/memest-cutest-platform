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
    text: 'For each transaction in MetaMask notify in Gmail then record in Spreadsheet'
  },
  {
    title: 'Token Swap Tracker',
    text: 'For each transaction in MetaMask swap all tokens to Polygon on 1inch'
  },
  {
    title: 'Automated Reports',
    text: 'Every Monday at 9 AM, collect data from Spreadsheet and send a report to Gmail'
  },
  {
    title: 'Cross-Chain Bridge',
    text: 'For each Celo transaction, bridge tokens to Polygon using 1inch'
  }
];

export default function WorkflowPopup({ initialInput = '', onClose, showSavedSection = false, readOnly = false }) {
  const [workflowInput, setWorkflowInput] = useState(initialInput);
  const [workflowParsed, setWorkflowParsed] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowApproved, setWorkflowApproved] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const savedSectionRef = React.useRef(null);
  
  // Load saved workflows from localStorage when the component mounts
  useEffect(() => {
    try {
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
    } catch (error) {
      console.error('Error loading saved workflows:', error);
    }
  }, [showSavedSection]);
  
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
        createdAt: new Date().toISOString()
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
      const updatedWorkflows = savedWorkflows.filter(workflow => workflow.id !== id);
      setSavedWorkflows(updatedWorkflows);
      localStorage.setItem('savedWorkflows', JSON.stringify(updatedWorkflows));
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Failed to delete workflow');
    }
  };
  
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <img src="/icon/spreadsheet.png" alt="Workflow" className={styles.logo} />
            <div className={styles.logoGlow}></div>
          </div>
          <h2>{readOnly ? "Saved Workflows" : "Workflow Assistant"}</h2>
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
              <button className={styles.doneButton} onClick={onClose}>
                Done
              </button>
            </div>
          ) : (
            <>
              {!readOnly && (
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
                      placeholder="Enter a workflow description like: For each transaction in MetaMask notify in Gmail and swap all tokens to Polygon on 1inch"
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
                          onClick={saveWorkflow}
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
                            </div>
                            <div className={styles.savedWorkflowActions}>
                              <button 
                                className={styles.deleteButton}
                                onClick={() => deleteWorkflow(saved.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <FlowChart workflow={saved.workflow} />
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