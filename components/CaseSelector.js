import React, { useState, useEffect } from 'react';
import * as THREE from 'three';

// Define the coordinates for each model as provided
const COORDINATES = {
  gmail: new THREE.Vector3(
    2.278805815944017,
    1, // Raised higher above the floor
    -2.0091312277057521
  ),
  metamask: new THREE.Vector3(
    0.21083844329090778,
    5.365217592205796e-16, // Essentially zero
    -2.416279194901965
  ),
  oneinch: new THREE.Vector3(
    0.9843086503678045,
    -6.077401855916396e-16, // Essentially zero
    3.0370184733685843
  ),
  polygon: new THREE.Vector3(
    -0.822410210531122,
    0.55, // Raised higher above the table
    0.6046197241590376
  ),
  celo: new THREE.Vector3(
    -0.5519415662663658,
    0.58590545802205797, // Raised higher above the floor
    1.29011611383365059
  ),
  spreadsheet: new THREE.Vector3(
    1.438805815944017,     // Same x as Gmail
    1,                     // Same height as Gmail
    -1.9091312277057521    // Slightly different z to place it beside Gmail
  ),
};

// Define the movement patterns for each case
const MOVEMENT_PATTERNS = {
  1: ['gmail', 'metamask', 'gmail', 'spreadsheet', 'gmail'], // Case 1
  2: ['oneinch', 'metamask', 'gmail'], // Case 2
  3: ['polygon', 'gmail'], // Case 3
  4: ['celo', 'gmail'], // Case 4
};

// Case descriptions for the UI
const CASE_DESCRIPTIONS = {
  1: "Gmail → MetaMask → Gmail → Spreadsheet → Gmail",
  2: "1inch → MetaMask → Gmail",
  3: "Polygon → Gmail",
  4: "Celo → Gmail"
};

export default function CaseSelector({ onSelectCase }) {
  const [caseInput, setCaseInput] = useState('');
  const [currentCase, setCurrentCase] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [movementQueue, setMovementQueue] = useState([]);
  
  // Process case selection
  const handleSubmit = (e) => {
    e.preventDefault();
    const caseNumber = parseInt(caseInput, 10);
    
    if (caseNumber >= 1 && caseNumber <= 4) {
      // First stop any current movement
      setIsActive(false);
      setMovementQueue([]);
      
      // Then set the new case and activate
      setCurrentCase(caseNumber);
      setIsActive(true);
      
      // Set up the movement queue
      const pattern = MOVEMENT_PATTERNS[caseNumber];
      if (pattern) {
        console.log(`Starting Case ${caseNumber}: ${CASE_DESCRIPTIONS[caseNumber]}`);
        const coordinates = pattern.map(modelName => COORDINATES[modelName]);
        setMovementQueue(coordinates);
        
        // Start movement with the first target after a short delay
        if (coordinates.length > 0 && onSelectCase) {
          setTimeout(() => {
            onSelectCase(coordinates[0]);
          }, 100);
        }
      }
    } else {
      alert('Please enter a valid case number (1-4)');
    }
  };
  
  // Handle movement completion and queue processing
  const moveToNextTarget = () => {
    // Safety check - ensure we have a valid case and are active
    if (!isActive || currentCase < 1 || currentCase > 4) {
      console.log("Not moving to next target: inactive or invalid case");
      return;
    }
    
    if (movementQueue.length > 0) {
      // Remove the first item (it's the one we just completed)
      const updatedQueue = [...movementQueue];
      updatedQueue.shift();
      setMovementQueue(updatedQueue);
      
      // If there are more destinations, start moving to the next one
      if (updatedQueue.length > 0 && onSelectCase) {
        // Get the next target from the current case's pattern
        const nextTarget = updatedQueue[0];
        console.log(`Moving to next target in Case ${currentCase}`);
        
        setTimeout(() => {
          onSelectCase(nextTarget);
        }, 1000); // Wait 1 second before next movement
      } else if (isActive) {
        // Pattern completed, restart the SAME case
        console.log(`Completed Case ${currentCase} pattern, restarting the same case...`);
        
        // Get the fresh pattern for this case
        const pattern = MOVEMENT_PATTERNS[currentCase];
        if (pattern) {
          setTimeout(() => {
            console.log(`Restarting Case ${currentCase}: ${CASE_DESCRIPTIONS[currentCase]}`);
            const coordinates = pattern.map(modelName => COORDINATES[modelName]);
            setMovementQueue(coordinates);
            
            // Start movement with the first target
            if (coordinates.length > 0 && onSelectCase) {
              onSelectCase(coordinates[0]);
            }
          }, 2000); // Wait 2 seconds before restarting pattern
        }
      }
    } else {
      console.log("Movement queue is empty, can't move to next target");
    }
  };
  
  // Listen for agent movement completion
  useEffect(() => {
    // Function to handle agent arrival at destination
    const handleAgentArrival = () => {
      // Only process arrivals if we're active and have a valid case
      if (isActive && currentCase >= 1 && currentCase <= 4) {
        moveToNextTarget();
      }
    };
    
    // Add listener for custom event (will be dispatched by the agent movement code)
    window.addEventListener('agentArrivedAtDestination', handleAgentArrival);
    
    return () => {
      window.removeEventListener('agentArrivedAtDestination', handleAgentArrival);
    };
  }, [movementQueue, isActive, currentCase]); // Add isActive and currentCase as dependencies

  // Function to stop the current automation
  const handleStop = () => {
    console.log("Stopping case movement");
    // Clear internal state
    setIsActive(false);
    setMovementQueue([]);
    setCurrentCase(0);
    setCaseInput('');
    
    // Make sure to stop the agent navigator
    if (typeof window.AgentNavigator !== 'undefined' && window.AgentNavigator.stopNavigation) {
      window.AgentNavigator.stopNavigation();
    } else {
      // Fallback - reset global variables directly
      if (window.isAgentWalking !== undefined) {
        window.isAgentWalking = false;
      }
      if (window.waypointQueue) {
        window.waypointQueue.length = 0;
      }
      window.finalDestination = null;
      
      // Switch to idle animation
      if (window.currentAnimation === 'walk' && window.animations && window.animations.idle) {
        window.animations.walk.stop();
        window.animations.idle.play();
        window.currentAnimation = 'idle';
      }
    }
  };
  
  // Function to display remaining steps in the movement pattern
  const getRemainingSteps = () => {
    if (currentCase && movementQueue.length > 0) {
      const pattern = MOVEMENT_PATTERNS[currentCase];
      const currentIndex = pattern.length - movementQueue.length;
      
      return pattern.slice(currentIndex).join(' → ');
    }
    return '';
  };
  
  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',  // Position below the "Chat with Fox" button
        left: '20px',  // Align with the left edge like the Fox button
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        zIndex: 1000,
        fontFamily: 'Arial, sans-serif',
        width: '250px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold', color: '#ff9800' }}>
        Agent Path Selector
      </h3>
      
      {!isActive ? (
        <div>
          <div style={{ marginBottom: '12px', fontSize: '13px' }}>
            Choose a movement pattern:
          </div>
          
          {Object.entries(CASE_DESCRIPTIONS).map(([caseNumber, description]) => (
            <div 
              key={caseNumber}
              style={{
                padding: '8px 10px',
                marginBottom: '8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => {
                // Parse the case number from the key
                const caseNum = parseInt(caseNumber, 10);
                // Stop any running case first
                if (isActive) {
                  setIsActive(false);
                  setMovementQueue([]);
                  // Small delay to ensure clean state before starting new case
                  setTimeout(() => {
                    // Instead of calling handleSubmit, implement the logic directly with the known case number
                    setCurrentCase(caseNum);
                    setIsActive(true);
                    setCaseInput(caseNum.toString());
                    
                    const pattern = MOVEMENT_PATTERNS[caseNum];
                    if (pattern) {
                      console.log(`Starting Case ${caseNum}: ${CASE_DESCRIPTIONS[caseNum]}`);
                      const coordinates = pattern.map(modelName => COORDINATES[modelName]);
                      setMovementQueue(coordinates);
                      
                      // Start movement with the first target
                      if (coordinates.length > 0 && onSelectCase) {
                        onSelectCase(coordinates[0]);
                      }
                    }
                  }, 200);
                } else {
                  // Direct case selection without going through handleSubmit
                  setCurrentCase(caseNum);
                  setIsActive(true);
                  setCaseInput(caseNum.toString());
                  
                  const pattern = MOVEMENT_PATTERNS[caseNum];
                  if (pattern) {
                    console.log(`Starting Case ${caseNum}: ${CASE_DESCRIPTIONS[caseNum]}`);
                    const coordinates = pattern.map(modelName => COORDINATES[modelName]);
                    setMovementQueue(coordinates);
                    
                    // Start movement with the first target
                    if (coordinates.length > 0 && onSelectCase) {
                      onSelectCase(coordinates[0]);
                    }
                  }
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 152, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Case {caseNumber}</div>
              <div style={{ fontSize: '12px', color: '#ccc' }}>{description}</div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div style={{ 
            marginBottom: '10px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#4CAF50'
          }}>
            Running: Case {currentCase}
          </div>
          <div style={{ 
            marginBottom: '12px',
            fontSize: '12px',
            color: '#ccc',
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: '8px',
            borderRadius: '4px'
          }}>
            Path: {CASE_DESCRIPTIONS[currentCase]}
          </div>
          <div style={{ marginBottom: '12px', fontSize: '13px' }}>
            Remaining: {movementQueue.length} moves
          </div>
          <button
            onClick={handleStop}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: 'bold',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d32f2f';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f44336';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Stop Movement
          </button>
        </div>
      )}
    </div>
  );
} 