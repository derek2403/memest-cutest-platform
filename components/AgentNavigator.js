import * as THREE from 'three';

// Utility class to handle agent navigation
class AgentNavigator {
  constructor() {
    this.isNavigating = false;
    this.currentTarget = null;
    this.checkInterval = null;
  }

  // Navigate agent to a specific target position
  navigateToPosition(targetPosition) {
    if (!window.aiAgent) {
      console.error("AI Agent not found in scene");
      return false;
    }

    // Cancel any existing navigation
    if (this.isNavigating) {
      this.stopNavigation();
    }

    console.log("Navigating to position:", targetPosition);

    // Force y coordinate to 0 to keep agent on the ground
    const fixedPosition = new THREE.Vector3(
      targetPosition.x,
      0, // Force y to be 0
      targetPosition.z
    );
    
    // This is the most reliable way to navigate the agent - using the existing right click handler
    if (window.onRightClick) {
      console.log("Using simulated right-click to navigate");
      
      // Start monitoring for arrival
      this.isNavigating = true;
      this.currentTarget = fixedPosition.clone();
      this.startArrivalCheck();
      
      // Use the existing navigation system
      return this.simulateRightClickAt(fixedPosition);
    }
    
    // We should never reach this fallback, but keep it just in case
    console.warn("Falling back to direct navigation (not recommended)");
    
    // Fallback direct navigation if onRightClick isn't available
    window.agentTargetPosition = fixedPosition.clone();
    window.isAgentWalking = true;
    window.finalDestination = fixedPosition.clone();
    
    // Clear any existing waypoints
    if (!window.waypointQueue) {
      window.waypointQueue = [];
    } else {
      window.waypointQueue.length = 0;
    }
    
    // Start monitoring for arrival
    this.isNavigating = true;
    this.currentTarget = fixedPosition.clone();
    this.startArrivalCheck();
    
    // Play walk animation manually as a fallback
    if (window.mixer && window.animations && window.animations.walk) {
      // Stop current animation if any
      if (window.currentAnimation && window.animations[window.currentAnimation]) {
        window.animations[window.currentAnimation].stop();
      }
      
      // Play walking animation
      window.animations.walk.reset();
      window.animations.walk.play();
      window.currentAnimation = 'walk';
    }
    
    return true;
  }
  
  // Start checking if the agent has arrived at the destination
  startArrivalCheck() {
    // Clear any existing check interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // Set a timeout for max navigation time (10 seconds)
    const maxNavigationTimeout = setTimeout(() => {
      // If we're still navigating after the timeout, consider it arrived anyway
      if (this.isNavigating) {
        console.log("Navigation timeout reached, forcing arrival");
        this.isNavigating = false;
        clearInterval(this.checkInterval);
        
        // Force the agent to the destination
        if (window.aiAgent && this.currentTarget) {
          window.aiAgent.position.copy(this.currentTarget);
          window.isAgentWalking = false;
          
          // Switch to idle animation
          if (window.animations && window.animations.idle) {
            if (window.animations.walk) window.animations.walk.stop();
            window.animations.idle.play();
            window.currentAnimation = 'idle';
          }
        }
        
        // Dispatch event to notify arrival
        window.dispatchEvent(new CustomEvent('agentArrivedAtDestination'));
      }
    }, 10000); // 10 seconds max for navigation
    
    // Set up interval to check for arrival
    this.checkInterval = setInterval(() => {
      if (!this.isNavigating || !window.aiAgent || !this.currentTarget) {
        clearInterval(this.checkInterval);
        clearTimeout(maxNavigationTimeout);
        return;
      }
      
      // Check if agent has arrived at the destination
      const distance = window.aiAgent.position.distanceTo(this.currentTarget);
      
      // Consider arrival when close enough or when agent stops walking
      if ((distance < 0.3 && !window.isAgentWalking) || 
          (distance < 0.5 && !window.isAgentWalking)) {
        // Agent has arrived
        this.isNavigating = false;
        clearInterval(this.checkInterval);
        clearTimeout(maxNavigationTimeout);
        
        console.log("Agent has arrived at destination");
        
        // Ensure agent is in the exact position and not walking
        window.aiAgent.position.copy(this.currentTarget);
        window.isAgentWalking = false;
        
        // Switch to idle animation
        if (window.animations && window.animations.idle) {
          if (window.animations.walk) window.animations.walk.stop();
          window.animations.idle.play();
          window.currentAnimation = 'idle';
        }
        
        // Dispatch event to notify arrival
        window.dispatchEvent(new CustomEvent('agentArrivedAtDestination'));
      }
    }, 200); // Check every 200ms
  }
  
  // Manually simulate right-click at a position
  simulateRightClickAt(position) {
    // Instead of trying to mock the right click event, create a proper position
    // with y=0 to ensure the agent stays on the ground
    const fixedPosition = new THREE.Vector3(
      position.x,
      0, // Force y to be 0 to keep agent on the ground
      position.z
    );
    
    console.log("Simulating right-click at:", fixedPosition);
    
    if (window.aiAgent && window.onRightClick) {
      // Create a custom event that will properly target the floor
      const customEvent = {
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2,
        preventDefault: () => {}
      };
      
      // Store original raycaster and mouse
      const originalIntersectObjects = window.raycaster?.intersectObjects;
      
      // Override the raycaster intersect method to return our position
      if (window.raycaster) {
        // Find the floor object in the scene
        let floorObject = null;
        if (window.scene) {
          floorObject = window.scene.children.find(obj => obj.name === "floor");
        }
        
        window.raycaster.intersectObjects = (objects) => {
          // Return a properly formatted intersection result
          return [{
            point: fixedPosition,
            object: floorObject || { name: "floor" }
          }];
        };
      }
      
      // Call the original right click function which has all the logic
      // for proper navigation including obstacle avoidance
      window.onRightClick(customEvent);
      
      // Restore original raycaster behavior
      if (window.raycaster && originalIntersectObjects) {
        window.raycaster.intersectObjects = originalIntersectObjects;
      }
      
      return true;
    } else {
      console.error("Cannot simulate right-click: aiAgent or onRightClick not found");
      return false;
    }
  }
  
  // Stop ongoing navigation
  stopNavigation() {
    console.log("Stopping navigation");
    this.isNavigating = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // Stop the agent walking
    if (window.isAgentWalking !== undefined) {
      window.isAgentWalking = false;
      
      // Clear movement queues and targets
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
  }
}

// Create and export a singleton instance
const navigator = new AgentNavigator();

// Make navigator available globally
if (typeof window !== 'undefined') {
  window.AgentNavigator = navigator;
}

export default navigator; 