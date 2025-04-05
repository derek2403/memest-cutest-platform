import React, { useState, useEffect } from 'react';
import * as THREE from 'three';

// Define the coordinates for each model as provided
const COORDINATES = {
  gmail: new THREE.Vector3(
    2.4016545017240043,
    0, // Raised higher above the floor
    -0.41
  ),

  metamask: new THREE.Vector3(
    0.2882498959409254,
    0, // Essentially zero
    -1.393742171387627
  ),

  oneinch: new THREE.Vector3(
    0.9316894864631875,
    0, // Essentially zero
    2.367221419907647
  ),

  polygon: new THREE.Vector3(
    -0.8220582468792008,
    0, // Raised higher above the table
    -0.05409581610712064
  ),
  celo: new THREE.Vector3(
    0.3830632560763707,
    0, // Raised higher above the floor
    1.3030098321365784
  ),
  spreadsheet: new THREE.Vector3(
    1.3090969471423244,     // Same x as Gmail
    0,                     // Same height as Gmail
    -0.41   // Slightly different z to place it beside Gmail
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
  
  // Direct teleport function to bypass navigation issues
  const teleportAgentTo = (position) => {
    console.log("Moving agent realistically to:", position);
    
    if (window.aiAgent) {
      // Start walking animation
      if (window.animations && window.animations.walk) {
        if (window.currentAnimation === 'idle' && window.animations.idle) {
          window.animations.idle.stop();
        }
        window.animations.walk.reset();
        
        // Adjust animation speed based on agent's stride length
        // This helps synchronize steps with actual movement distance
        const strideLength = 0.5; // Estimated length of one step in the walk animation
        const walkSpeed = 1.3; // Base animation speed multiplier - increased to make feet move faster
        
        if (window.animations.walk.timeScale !== undefined) {
          window.animations.walk.timeScale = walkSpeed;
        }
        
        window.animations.walk.play();
        window.currentAnimation = 'walk';
      }
      
      // Set walking state
      window.isAgentWalking = true;
      
      // Get current position for interpolation
      const startPosition = window.aiAgent.position.clone();
      const targetPosition = new THREE.Vector3(position.x, 0, position.z);
      
      // Check if there's a direct path or if we need to go around obstacles
      let waypoints = [];
      
      // We need to check if there are obstacles between the current position and the target
      if (window.furnitureObstacles && window.furnitureObstacles.length > 0) {
        let pathBlocked = false;
        
        // Check against each obstacle
        for (const obstacle of window.furnitureObstacles) {
          if (!obstacle || !obstacle.points) continue;
          
          // Create a bounding box for the obstacle
          const boundingBox = getExpandedBoundingBox(obstacle.points, 0.5); // Increased buffer from 0.3 to 0.5 for better detection
          
          // Check if the direct path intersects with this obstacle's bounding box
          if (doesPathIntersectBoundingBox(startPosition, targetPosition, boundingBox)) {
            console.log("Path intersects with obstacle, finding path around");
            pathBlocked = true;
            
            // Find a path around the obstacle
            const pathAroundObstacle = findPathAroundObstacle(startPosition, targetPosition, boundingBox);
            waypoints = pathAroundObstacle;
            break;
          }
        }
        
        // If no obstacles block the path, just use a direct path
        if (!pathBlocked) {
          console.log("Direct path clear to target");
        }
      }
      
      // Add the final target as the last waypoint
      waypoints.push(targetPosition.clone());
      
      // Function to check if a path intersects with a bounding box
      function doesPathIntersectBoundingBox(pointA, pointB, boundingBox) {
        // Add a small detection buffer to make the bounding box slightly larger for intersection testing
        const detectionBuffer = 0.2;
        
        // Expand the bounding box slightly for intersection detection
        const expandedBox = {
          minX: boundingBox.minX - detectionBuffer,
          maxX: boundingBox.maxX + detectionBuffer,
          minZ: boundingBox.minZ - detectionBuffer,
          maxZ: boundingBox.maxZ + detectionBuffer
        };
        
        // Check if either end point is inside the expanded bounding box
        const isAInside = (
          pointA.x >= expandedBox.minX && pointA.x <= expandedBox.maxX &&
          pointA.z >= expandedBox.minZ && pointA.z <= expandedBox.maxZ
        );
        
        const isBInside = (
          pointB.x >= expandedBox.minX && pointB.x <= expandedBox.maxX &&
          pointB.z >= expandedBox.minZ && pointB.z <= expandedBox.maxZ
        );
        
        // If either point is inside, there's an intersection
        if (isAInside || isBInside) return true;
        
        // Get the line segments of the expanded bounding box
        const segments = [
          { a: {x: expandedBox.minX, z: expandedBox.minZ}, b: {x: expandedBox.maxX, z: expandedBox.minZ} }, // Top
          { a: {x: expandedBox.maxX, z: expandedBox.minZ}, b: {x: expandedBox.maxX, z: expandedBox.maxZ} }, // Right
          { a: {x: expandedBox.maxX, z: expandedBox.maxZ}, b: {x: expandedBox.minX, z: expandedBox.maxZ} }, // Bottom
          { a: {x: expandedBox.minX, z: expandedBox.maxZ}, b: {x: expandedBox.minX, z: expandedBox.minZ} }  // Left
        ];
        
        // Check if the path intersects with any of the box's edges
        for (const segment of segments) {
          if (doLinesIntersect(
            pointA.x, pointA.z, pointB.x, pointB.z,
            segment.a.x, segment.a.z, segment.b.x, segment.b.z
          )) {
            return true;
          }
        }
        
        return false;
      }
      
      // Function to check if two line segments intersect
      function doLinesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        // Calculate the direction vectors
        const dx1 = x2 - x1;
        const dy1 = y2 - y1;
        const dx2 = x4 - x3;
        const dy2 = y4 - y3;
        
        // Calculate the determinant
        const det = dx1 * dy2 - dx2 * dy1;
        
        // If det is zero, lines are parallel
        if (det === 0) return false;
        
        // Calculate the parameters of intersection
        const t1 = ((x3 - x1) * dy2 - (y3 - y1) * dx2) / det;
        const t2 = ((x3 - x1) * dy1 - (y3 - y1) * dx1) / det;
        
        // Check if the intersection is within both line segments
        return (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1);
      }
      
      // Helper to get the expanded bounding box of a polygon with buffer
      function getExpandedBoundingBox(polygon, buffer) {
        if (!polygon || !Array.isArray(polygon) || polygon.length === 0) {
          console.error("Invalid polygon in getExpandedBoundingBox:", polygon);
          return { minX: -5, minZ: -5, maxX: 5, maxZ: 5 }; // Default fallback
        }
        
        let minX = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxZ = -Infinity;
        
        // Find min/max coordinates
        for (const point of polygon) {
          if (!point || typeof point.x !== 'number' || typeof point.z !== 'number') {
            continue; // Skip invalid points
          }
          minX = Math.min(minX, point.x);
          minZ = Math.min(minZ, point.z);
          maxX = Math.max(maxX, point.x);
          maxZ = Math.max(maxZ, point.z);
        }
        
        // If we didn't find valid coordinates, return a default
        if (minX === Infinity || minZ === Infinity || maxX === -Infinity || maxZ === -Infinity) {
          console.error("Failed to calculate bounding box, using default");
          return { minX: -5, minZ: -5, maxX: 5, maxZ: 5 };
        }
        
        // Expand by buffer
        return {
          minX: minX - buffer,
          minZ: minZ - buffer,
          maxX: maxX + buffer,
          maxZ: maxZ + buffer
        };
      }
      
      // Function to find a path around an obstacle
      function findPathAroundObstacle(start, end, boundingBox) {
        // Create waypoints to navigate around the obstacle
        const extraBuffer = 1.5; // Increased buffer for better obstacle avoidance
        
        // Calculate the Manhattan distance for each possible path
        const topDistance = 
          Math.abs(start.x - start.x) + 
          Math.abs(start.z - (boundingBox.minZ - extraBuffer)) +
          Math.abs(start.x - end.x) + 
          Math.abs((boundingBox.minZ - extraBuffer) - end.z);
          
        const bottomDistance = 
          Math.abs(start.x - start.x) + 
          Math.abs(start.z - (boundingBox.maxZ + extraBuffer)) +
          Math.abs(start.x - end.x) + 
          Math.abs((boundingBox.maxZ + extraBuffer) - end.z);
          
        const leftDistance = 
          Math.abs(start.x - (boundingBox.minX - extraBuffer)) + 
          Math.abs(start.z - start.z) +
          Math.abs((boundingBox.minX - extraBuffer) - end.x) + 
          Math.abs(start.z - end.z);
          
        const rightDistance = 
          Math.abs(start.x - (boundingBox.maxX + extraBuffer)) + 
          Math.abs(start.z - start.z) +
          Math.abs((boundingBox.maxX + extraBuffer) - end.x) + 
          Math.abs(start.z - end.z);
        
        // Find the shortest path
        const minDistance = Math.min(topDistance, bottomDistance, leftDistance, rightDistance);
        
        // Create two-point paths with larger buffers for safety
        if (minDistance === topDistance) {
          // Go around the top of the obstacle
          const waypoint1 = new THREE.Vector3(start.x, 0, boundingBox.minZ - extraBuffer);
          const waypoint2 = new THREE.Vector3(end.x, 0, boundingBox.minZ - extraBuffer);
          
          // Add an additional corner waypoint if needed for sharper turns
          if (Math.abs(start.x - end.x) > 1.0) {
            return [
              waypoint1,
              waypoint2
            ];
          } else {
            return [waypoint1];
          }
        } else if (minDistance === bottomDistance) {
          // Go around the bottom of the obstacle
          const waypoint1 = new THREE.Vector3(start.x, 0, boundingBox.maxZ + extraBuffer);
          const waypoint2 = new THREE.Vector3(end.x, 0, boundingBox.maxZ + extraBuffer);
          
          // Add an additional corner waypoint if needed for sharper turns
          if (Math.abs(start.x - end.x) > 1.0) {
            return [
              waypoint1,
              waypoint2
            ];
          } else {
            return [waypoint1];
          }
        } else if (minDistance === leftDistance) {
          // Go around the left side of the obstacle
          const waypoint1 = new THREE.Vector3(boundingBox.minX - extraBuffer, 0, start.z);
          const waypoint2 = new THREE.Vector3(boundingBox.minX - extraBuffer, 0, end.z);
          
          // Add an additional corner waypoint if needed for sharper turns
          if (Math.abs(start.z - end.z) > 1.0) {
            return [
              waypoint1,
              waypoint2
            ];
          } else {
            return [waypoint1];
          }
        } else {
          // Go around the right side of the obstacle
          const waypoint1 = new THREE.Vector3(boundingBox.maxX + extraBuffer, 0, start.z);
          const waypoint2 = new THREE.Vector3(boundingBox.maxX + extraBuffer, 0, end.z);
          
          // Add an additional corner waypoint if needed for sharper turns
          if (Math.abs(start.z - end.z) > 1.0) {
            return [
              waypoint1,
              waypoint2
            ];
          } else {
            return [waypoint1];
          }
        }
      }
      
      // Calculate distance for timing
      let totalDistance = 0;
      let currentPoint = startPosition.clone();
      
      // Calculate the total distance along the path
      for (const waypoint of waypoints) {
        totalDistance += currentPoint.distanceTo(waypoint);
        currentPoint = waypoint.clone();
      }
      
      // Calculate a more appropriate walk duration based on stride length and steps
      // Slower movement for more natural walking animation (more steps per distance)
      const averageWalkingSpeed = 1.8; // meters per second - keeping the same movement speed
      const walkDuration = Math.max(totalDistance / averageWalkingSpeed * 1000, 1000);
      
      console.log(`Walking distance: ${totalDistance}, duration: ${walkDuration}ms, waypoints: ${waypoints.length}`);
      
      // Animate the walking with waypoints
      const startTime = Date.now();
      let lastWaypointIndex = -1;
      let lastAnimationSync = 0;
      
      const walkAnimation = () => {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / walkDuration, 1);
        
        if (progress < 1) {
          // Calculate the current position along the path with all waypoints
          const pathProgress = progress * totalDistance;
          let distanceTraveled = 0;
          let fromPoint = startPosition;
          let toPoint = null;
          let segmentProgress = 0;
          let waypointIndex = -1;
          
          // Find the current segment
          for (let i = 0; i < waypoints.length; i++) {
            const segmentLength = fromPoint.distanceTo(waypoints[i]);
            if (distanceTraveled + segmentLength >= pathProgress) {
              // We're in this segment
              toPoint = waypoints[i];
              segmentProgress = (pathProgress - distanceTraveled) / segmentLength;
              waypointIndex = i;
              break;
            }
            distanceTraveled += segmentLength;
            fromPoint = waypoints[i];
          }
          
          // If we've moved to a new waypoint, log it
          if (waypointIndex !== lastWaypointIndex && waypointIndex !== -1) {
            console.log(`Moving to waypoint ${waypointIndex}:`, toPoint);
            lastWaypointIndex = waypointIndex;
          }
          
          // If we found a segment, interpolate position
          if (toPoint) {
            // Interpolate position
            const newX = fromPoint.x + (toPoint.x - fromPoint.x) * segmentProgress;
            const newZ = fromPoint.z + (toPoint.z - fromPoint.z) * segmentProgress;
            
            // Update agent position
            window.aiAgent.position.set(newX, 0, newZ);
            
            // Update agent rotation to face direction of movement
            if (window.aiAgent.rotation) {
              const angle = Math.atan2(toPoint.x - fromPoint.x, toPoint.z - fromPoint.z);
              window.aiAgent.rotation.y = angle;
            }
            
            // Synchronize animation speed with movement every 500ms
            // This helps prevent animation/movement mismatch over long distances
            const now = Date.now();
            if (now - lastAnimationSync > 500 && window.animations && window.animations.walk) {
              // Calculate current movement speed (distance per second)
              const instantSpeed = (pathProgress - lastAnimationSync) / ((now - lastAnimationSync) / 1000);
              
              // Adjust animation speed to match current movement speed
              // Increased animation speed factor to better sync with movement
              if (window.animations.walk.timeScale !== undefined) {
                const newTimeScale = Math.min(Math.max(instantSpeed * 0.8, 1.5), 2.5); // Increased animation speed ranges
                window.animations.walk.timeScale = newTimeScale;
              }
              
              lastAnimationSync = pathProgress;
            }
          }
          
          // Continue animation
          requestAnimationFrame(walkAnimation);
        } else {
          // Arrived at final destination
          window.aiAgent.position.copy(targetPosition);
          window.isAgentWalking = false;
          
          // Switch to idle animation
          if (window.animations && window.animations.idle) {
            window.animations.walk.stop();
            window.animations.idle.play();
            window.currentAnimation = 'idle';
          }
          
          // Dispatch arrival event
          window.dispatchEvent(new CustomEvent('agentArrivedAtDestination'));
        }
      };
      
      // Start walking animation
      requestAnimationFrame(walkAnimation);
      
      return true;
    } else {
      console.error("Agent not found, can't move");
      return false;
    }
  };
  
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
        if (coordinates.length > 0) {
          setTimeout(() => {
            console.log("Sending first target to agent:", coordinates[0]);
            
            // Try direct teleport first for more reliable positioning
            if (!teleportAgentTo(coordinates[0])) {
              // Fall back to navigator if teleport fails
              onSelectCase(coordinates[0]);
              
              // Force dispatch of the arrival event if it's not happening automatically
              setTimeout(() => {
                if (window.aiAgent && coordinates[0]) {
                  // Check if agent is close enough to target
                  const distance = window.aiAgent.position.distanceTo(coordinates[0]);
                  if (distance > 0.5) {
                    console.log("Agent didn't reach first target, manually moving to it");
                    // Force agent to first position
                    if (window.aiAgent) {
                      window.aiAgent.position.set(coordinates[0].x, 0, coordinates[0].z);
                    }
                  }
                  // After ensuring agent is at position, trigger arrival event
                  window.dispatchEvent(new CustomEvent('agentArrivedAtDestination'));
                }
              }, 5000); // Check after 5 seconds and force if needed
            }
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
      if (updatedQueue.length > 0) {
        // Get the next target from the current case's pattern
        const nextTarget = updatedQueue[0];
        console.log(`Moving to next target in Case ${currentCase}:`, nextTarget);
        
        setTimeout(() => {
          // Try direct teleport first for more reliable positioning
          if (!teleportAgentTo(nextTarget)) {
            // Fall back to navigator if teleport fails
            onSelectCase(nextTarget);
            
            // Force dispatch of the arrival event if it's not happening automatically
            setTimeout(() => {
              if (window.aiAgent && nextTarget) {
                // Check if agent is close enough to target
                const distance = window.aiAgent.position.distanceTo(nextTarget);
                if (distance > 0.5) {
                  console.log("Agent didn't reach target, manually moving to it");
                  // Force agent to position
                  if (window.aiAgent) {
                    window.aiAgent.position.set(nextTarget.x, 0, nextTarget.z);
                  }
                }
                // After ensuring agent is at position, trigger arrival event
                window.dispatchEvent(new CustomEvent('agentArrivedAtDestination'));
              }
            }, 5000); // Check after 5 seconds and force if needed
          }
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
            if (coordinates.length > 0) {
              console.log("First target on restart:", coordinates[0]);
              
              // Try direct teleport first for more reliable positioning
              if (!teleportAgentTo(coordinates[0])) {
                // Fall back to navigator if teleport fails
                onSelectCase(coordinates[0]);
                
                // Force dispatch of the arrival event if it's not happening automatically
                setTimeout(() => {
                  if (window.aiAgent && coordinates[0]) {
                    // Check if agent is close enough to target
                    const distance = window.aiAgent.position.distanceTo(coordinates[0]);
                    if (distance > 0.5) {
                      console.log("Agent didn't reach target on restart, manually moving to it");
                      // Force agent to position
                      if (window.aiAgent) {
                        window.aiAgent.position.set(coordinates[0].x, 0, coordinates[0].z);
                      }
                    }
                    // After ensuring agent is at position, trigger arrival event
                    window.dispatchEvent(new CustomEvent('agentArrivedAtDestination'));
                  }
                }, 5000); // Check after 5 seconds and force if needed
              }
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
        console.log("Agent arrived at destination, moving to next target");
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
                      if (coordinates.length > 0) {
                        console.log("First target:", coordinates[0]);
                        
                        // Try direct teleport first for more reliable positioning
                        if (!teleportAgentTo(coordinates[0])) {
                          // Fall back to navigator if teleport fails
                          onSelectCase(coordinates[0]);
                          
                          // Force dispatch of the arrival event if it's not happening automatically
                          setTimeout(() => {
                            if (window.aiAgent && coordinates[0]) {
                              // Check if agent is close enough to target
                              const distance = window.aiAgent.position.distanceTo(coordinates[0]);
                              if (distance > 0.5) {
                                console.log("Agent didn't reach first target, manually moving to it");
                                // Force agent to first position
                                if (window.aiAgent) {
                                  window.aiAgent.position.set(coordinates[0].x, 0, coordinates[0].z);
                                }
                              }
                              // After ensuring agent is at position, trigger arrival event
                              window.dispatchEvent(new CustomEvent('agentArrivedAtDestination'));
                            }
                          }, 5000); // Check after 5 seconds and force if needed
                        }
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
                    if (coordinates.length > 0) {
                      console.log("First target:", coordinates[0]);
                      
                      // Try direct teleport first for more reliable positioning
                      if (!teleportAgentTo(coordinates[0])) {
                        // Fall back to navigator if teleport fails
                        onSelectCase(coordinates[0]);
                        
                        // Force dispatch of the arrival event if it's not happening automatically
                        setTimeout(() => {
                          if (window.aiAgent && coordinates[0]) {
                            // Check if agent is close enough to target
                            const distance = window.aiAgent.position.distanceTo(coordinates[0]);
                            if (distance > 0.5) {
                              console.log("Agent didn't reach first target, manually moving to it");
                              // Force agent to first position
                              if (window.aiAgent) {
                                window.aiAgent.position.set(coordinates[0].x, 0, coordinates[0].z);
                              }
                            }
                            // After ensuring agent is at position, trigger arrival event
                            window.dispatchEvent(new CustomEvent('agentArrivedAtDestination'));
                          }
                        }, 5000); // Check after 5 seconds and force if needed
                      }
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