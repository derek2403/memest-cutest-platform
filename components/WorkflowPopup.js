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

// Helper function to get workflows based on available plugins
const getAvailableWorkflows = () => {
  // Default workflows for when no plugins are in the room or window.pluginsInRoom is not available
  const DEFAULT_WORKFLOWS = [
    {
      title: 'Add plugins to get started',
      text: 'Drag plugins from the sidebar into your room to create workflows'
    }
  ];

  // If window.pluginsInRoom is not available, return default workflows
  if (!window.pluginsInRoom) {
    return DEFAULT_WORKFLOWS;
  }

  // Get active plugins
  const activePlugins = window.pluginsInRoom.getActivePlugins();
  
  // If no active plugins, return default workflows
  if (activePlugins.length === 0) {
    return DEFAULT_WORKFLOWS;
  }

  // Build workflows based on available plugins
  const workflows = [];

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

  // If we still have no workflows, add a generic one
  if (workflows.length === 0) {
    workflows.push({
      title: 'Custom Workflow',
      text: `Create a workflow using ${activePlugins.join(' and ')}`
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
                      {availableWorkflows.map((example, index) => (
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
                  
                  {window.pluginsInRoom && window.pluginsInRoom.getActivePlugins().length === 0 ? (
                    <div className={styles.noPluginsWarning}>
                      <div className={styles.warningIcon}>⚠️</div>
                      <h3>No Plugins Available</h3>
                      <p>You need to add plugins to your room first before creating workflows.</p>
                      <p>Drag plugins from the sidebar into your room, then return here.</p>
                    </div>
                  ) : (
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
                  )}
        
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
                                aria-label="Delete workflow"
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M2.5 1C2.5 0.447715 2.94772 0 3.5 0H12.5C13.0523 0 13.5 0.447715 13.5 1V2H15C15.5523 2 16 2.44772 16 3C16 3.55228 15.5523 4 15 4H14V14C14 15.1046 13.1046 16 12 16H4C2.89543 16 2 15.1046 2 14V4H1C0.447715 4 0 3.55228 0 3C0 2.44772 0.447715 2 1 2H2.5V1ZM4.5 2H11.5V1H4.5V2ZM4 4V14H12V4H4ZM6 6C6.55228 6 7 6.44772 7 7V11C7 11.5523 6.55228 12 6 12C5.44772 12 5 11.5523 5 11V7C5 6.44772 5.44772 6 6 6ZM10 6C10.5523 6 11 6.44772 11 7V11C11 11.5523 10.5523 12 10 12C9.44772 12 9 11.5523 9 11V7C9 6.44772 9.44772 6 10 6Z" />
                                </svg>
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