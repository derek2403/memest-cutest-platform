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

export default function WorkflowPopup({ initialInput = '', onClose, showSavedSection = false, readOnly = false }) {
  const [workflowInput, setWorkflowInput] = useState(initialInput);
  const [workflowParsed, setWorkflowParsed] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowApproved, setWorkflowApproved] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [showWorkflowsOnly, setShowWorkflowsOnly] = useState(readOnly); // Show creation form only when not in readOnly mode
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
  
  // Toggle between workflows-only view and creation view (only if not in readOnly mode)
  const toggleWorkflowsView = () => {
    if (!readOnly) {
      setShowWorkflowsOnly(!showWorkflowsOnly);
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
          <h2>{readOnly ? "Saved Workflows" : (showWorkflowsOnly ? "Saved Workflows" : "Workflow Assistant")}</h2>
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
              {!showWorkflowsOnly && (
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
                          onClick={saveWorkflow}
                        >
                          Approve Workflow
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Saved Workflows Section */}
              {savedWorkflows.length > 0 ? (
                <div ref={savedSectionRef} className={styles.savedWorkflowsSection}>
                  <div className={styles.savedWorkflowsHeader}>
                    <h3 className={styles.savedWorkflowsTitle}>Saved Workflows</h3>
                    {!showWorkflowsOnly && <span className={styles.workflowsCount}>{savedWorkflows.length} workflows</span>}
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
                  <p>{readOnly ? "No saved workflows yet." : "No saved workflows yet. Create a new workflow to get started!"}</p>
                  {!readOnly && showWorkflowsOnly && (
                    <button 
                      className={styles.createWorkflowButton}
                      onClick={toggleWorkflowsView}
                    >
                      Create New Workflow
                    </button>
                  )}
                </div>
              )}
              
              {!readOnly && savedWorkflows.length > 0 && (
                <div className={styles.viewToggleContainer}>
                  <button 
                    className={styles.viewToggleButton}
                    onClick={toggleWorkflowsView}
                  >
                    {showWorkflowsOnly ? "Create New Workflow" : "Show Saved Workflows Only"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 