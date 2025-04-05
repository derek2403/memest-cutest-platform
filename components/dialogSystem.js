import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { loadAIAgent } from './aiagent.js';

// DialogIcon component - shows above the AI agent
export function DialogIcon({ agentRef }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    if (!agentRef || !window.camera) return;
    
    // Function to update the dialog position above the agent
    const updatePosition = () => {
      // Use the globally updated dialog position if available
      const vector = new THREE.Vector3();
      
      // Always use the latest agent position
      if (agentRef) {
        vector.copy(agentRef.position);
        vector.y += 0.3; // Position above the agent's head
      }
      
      // Update the global dialogPosition for other systems to use
      if (window.dialogPosition) {
        window.dialogPosition.copy(vector);
      }
      
      // Project the 3D position to 2D screen coordinates
      vector.project(window.camera);
      
      // Convert the normalized device coordinates to CSS pixels
      const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
      const y = -(vector.y * 0.5 - 0.5) * window.innerHeight;
      
      // Update the position state
      setPosition({ x, y });
    };
    
    // Call updatePosition immediately
    updatePosition();
    
    // Set up continuous animation frame updates while visible
    let animationFrameId = null;
    
    // Continuous update function
    const animateDialog = () => {
      updatePosition();
      animationFrameId = requestAnimationFrame(animateDialog);
    };
    
    // Start continuous updates
    animationFrameId = requestAnimationFrame(animateDialog);
    
    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [agentRef]); // Re-run when agentRef changes
  
  return (
    <div 
      style={{
        position: 'fixed',
        left: `${position.x - 20}px`, // Center horizontally (half of SVG width)
        top: `${position.y - 70}px`,  // Position above the agent with offset
        pointerEvents: 'none',
        zIndex: 1000,
        animation: 'popIn 0.3s ease-out',
      }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <path d="M35 0H5C2.23858 0 0 2.23858 0 5V25C0 27.7614 2.23858 30 5 30H15L20 40L25 30H35C37.7614 30 40 27.7614 40 25V5C40 2.23858 37.7614 0 35 0Z" fill="white" filter="url(#glow)"/>
        <path d="M20 25C22.7614 25 25 22.7614 25 20C25 17.2386 22.7614 15 20 15C17.2386 15 15 17.2386 15 20C15 22.7614 17.2386 25 20 25Z" fill="#FF9800"/>
        <path d="M10 15C12.7614 15 15 12.7614 15 10C15 7.23858 12.7614 5 10 5C7.23858 5 5 7.23858 5 10C5 12.7614 7.23858 15 10 15Z" fill="#F57C00"/>
        <path d="M30 15C32.7614 15 35 12.7614 35 10C35 7.23858 32.7614 5 30 5C27.2386 5 25 7.23858 25 10C25 12.7614 27.2386 15 30 15Z" fill="#F57C00"/>
      </svg>
    </div>
  );
}

// Define global CSS for animations
export function appendDialogStyles() {
  // Create a style element
  const styleEl = document.createElement('style');
  styleEl.id = 'dialog-system-styles';
  
  // Only add styles if they don't already exist
  if (!document.getElementById('dialog-system-styles')) {
    styleEl.innerHTML = `
      @keyframes popIn {
        0% { transform: scale(0); opacity: 0; }
        70% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(styleEl);
  }
}

// Function to navigate the AI agent to a specific position
export function startDialogWithEntity(scene, targetPosition, onComplete) {
  // Get references from scene
  let aiAgent;
  let dialogPosition = new THREE.Vector3();
  
  // Find the AI agent in the scene
  scene.traverse((obj) => {
    if (obj.userData && obj.userData.isAIAgent) {
      aiAgent = obj;
    }
  });
  
  // If agent not found, load it
  if (!aiAgent) {
    // Use the imported loadAIAgent function
    loadAIAgent(scene, {
      onAgentLoaded: (data) => {
        aiAgent = data.agent;
        navigateToPosition(aiAgent, targetPosition, scene, onComplete);
      }
    });
  } else {
    navigateToPosition(aiAgent, targetPosition, scene, onComplete);
  }
}

// Function to navigate the agent to target position
function navigateToPosition(agent, targetPosition, scene, onComplete) {
  // Store agent reference globally
  window.aiAgent = agent;
  
  console.log("Setting agent target position:", targetPosition);
  
  // Make sure all required global movement variables are available
  window.agentTargetPosition = targetPosition.clone();
  window.isAgentWalking = true;
  window.finalDestination = targetPosition.clone();
  
  // Check if we need to initialize these
  if (!window.waypointQueue) {
    window.waypointQueue = [];
  } else {
    window.waypointQueue.length = 0; // Clear existing waypoints
  }
  
  console.log("Global movement variables set:", {
    agentTargetPosition: window.agentTargetPosition, 
    isAgentWalking: window.isAgentWalking,
    agent: {
      position: agent.position,
      visible: agent.visible
    }
  });
  
  // Trigger walk animation if we have animation mixer
  if (window.mixer && window.animations && window.animations.walk) {
    console.log("Playing walk animation");
    // Stop current animation if any
    if (window.currentAnimation && window.animations[window.currentAnimation]) {
      window.animations[window.currentAnimation].stop();
    }
    
    // Play walking animation with increased speed
    window.animations.walk.reset();
    // Set a faster animation playback speed to match movement speed
    window.animations.walk.setEffectiveTimeScale(1.6); // Increase animation speed by 60%
    window.animations.walk.play();
    window.currentAnimation = 'walk';
  } else {
    console.warn("No animation mixer or walk animation available");
  }
  
  // Update dialog position to follow agent
  if (!window.dialogPosition) {
    window.dialogPosition = new THREE.Vector3();
  }
  
  // Direct movement code to handle positioning if updateAgentPosition isn't working
  let isMoving = true;
  const moveDirectly = () => {
    if (!isMoving) return;
    
    // If the agent is still walking, move it directly towards the target
    if (agent && isMoving) {
      // Calculate direction and distance
      const direction = new THREE.Vector3().subVectors(targetPosition, agent.position).normalize();
      const distance = agent.position.distanceTo(targetPosition);
      
      // Move the agent
      if (distance > 0.1) {
        // Move with a fixed speed - keep in sync with animation speed (1.6x)
        const speed = 0.05; // Increased from 0.04 to match animation speed
        agent.position.x += direction.x * speed;
        agent.position.y += direction.y * speed;
        agent.position.z += direction.z * speed;
        
        // Update agent's rotation to face the target
        agent.rotation.y = Math.atan2(direction.x, direction.z);
        
        // Update dialog position
        window.dialogPosition.copy(agent.position);
        window.dialogPosition.y += 0.3;
        
        // Dispatch event for dialog component
        if (window.showingDialog) {
          window.dispatchEvent(new CustomEvent('dialogPositionUpdated'));
        }
        
        // Continue moving
        requestAnimationFrame(moveDirectly);
      } else {
        // Arrived at target - reset animation speed to normal for idle
        isMoving = false;
        window.isAgentWalking = false;
        
        // Switch to idle animation
        if (window.mixer && window.animations && window.animations.idle) {
          // Stop walking animation
          if (window.currentAnimation === 'walk' && window.animations.walk) {
            window.animations.walk.stop();
          }
          
          // Play idle animation at normal speed
          window.animations.idle.reset();
          window.animations.idle.setEffectiveTimeScale(1.0); // Reset to normal speed
          window.animations.idle.play();
          window.currentAnimation = 'idle';
        }
        
        // Call completion callback
        if (onComplete) {
          console.log("Agent reached target position");
          onComplete();
        }
      }
    }
  };
  
  // Start the direct movement
  moveDirectly();
  
  // Also monitor the existing movement system as a fallback
  const checkProgress = () => {
    if (!isMoving) return; // Stop checking if direct movement completed
    
    // Check if the built-in movement system completed the movement
    if (agent && !window.isAgentWalking) {
      isMoving = false; // Stop direct movement
      
      // Call completion callback if direct movement didn't complete
      if (onComplete) {
        console.log("Agent reached target position via built-in system");
        onComplete();
      }
    } else {
      // Keep checking while walking
      setTimeout(checkProgress, 500);
    }
  };
  
  // Start monitoring progress as a fallback
  checkProgress();
}

// Function to display dialog for a set duration
export function showDialog(duration = 3000) {
  // Set global flag that dialog is visible
  window.showingDialog = true;
  
  console.log("Dialog showing for", duration, "ms");
  
  // Hide dialog after specified duration
  const hideTimer = setTimeout(() => {
    window.showingDialog = false;
    console.log("Dialog hidden after timeout");
  }, duration);
  
  // Return a cancel function that can be used to hide the dialog early
  return {
    isShowing: true,
    cancel: () => {
      clearTimeout(hideTimer);
      window.showingDialog = false;
      console.log("Dialog hidden early (canceled)");
    }
  };
} 