import * as THREE from 'three';
import { startDialogWithEntity, showDialog } from './dialogSystem';
import { spawnMetamaskFox } from './metawallet.js';

// Default coordinates for MetaMask fox location (as fallback)
const DEFAULT_FOX_POSITION = new THREE.Vector3(
  0.27549498153016927,
  1.4901161138336505e-9,
  -1.3762363398038835
);

/**
 * Start a dialog interaction with the MetaMask fox
 * @param {THREE.Scene} scene - The current THREE.js scene
 * @param {Function} onDialogStart - Optional callback when dialog starts
 * @param {Function} onDialogEnd - Optional callback when dialog ends
 * @param {number} dialogDuration - Duration in milliseconds for dialog visibility
 */
export function startFoxDialog(scene, onDialogStart, onDialogEnd, dialogDuration = 3000) {
  if (!scene) {
    console.error("No scene provided to startFoxDialog function");
    return;
  }
  
  console.log("Looking for MetaMask fox in the scene");
  
  // Check if fox exists in the scene
  let foxExists = false;
  let actualFoxPosition = DEFAULT_FOX_POSITION.clone();
  
  scene.traverse((obj) => {
    if (obj.userData && obj.userData.type === 'metamask') {
      foxExists = true;
      // Use the actual position of the fox rather than hard-coded values
      actualFoxPosition.copy(obj.position);
      console.log("MetaMask fox found at actual position:", actualFoxPosition);
    }
  });
  
  // If fox doesn't exist, spawn it
  if (!foxExists) {
    console.log("MetaMask fox not found in scene. Spawning it now...");
    spawnMetamaskFox(scene);
    
    // Wait a bit for the fox to load and then find its position
    setTimeout(() => {
      // Search for the fox again to get its actual position
      scene.traverse((obj) => {
        if (obj.userData && obj.userData.type === 'metamask') {
          actualFoxPosition.copy(obj.position);
          console.log("Newly spawned MetaMask fox found at position:", actualFoxPosition);
        }
      });
      
      // Now navigate to the fox
      navigateToFox(actualFoxPosition);
    }, 1000); // Wait longer (1 second) for the fox to fully load
  } else {
    // Fox exists, navigate to it immediately
    navigateToFox(actualFoxPosition);
  }
  
  // Function to handle the navigation to fox
  function navigateToFox(foxPosition) {
    console.log("Navigating to fox at actual position:", foxPosition);
    
    // Make sure we position slightly in front of the fox, not exactly on it
    const approachPosition = new THREE.Vector3();
    approachPosition.copy(foxPosition);
    
    // Create a better approach position - face the fox directly
    // First, determine vector from fox to center of room
    const centerOfRoom = new THREE.Vector3(0, 0, 0);
    const directionFromCenter = new THREE.Vector3().subVectors(foxPosition, centerOfRoom).normalize();
    
    // Position the agent opposite to this direction (facing the fox)
    // Stand further away (1.0 units instead of 0.5) to create more distance
    approachPosition.x -= directionFromCenter.x * 1.0;
    approachPosition.z -= directionFromCenter.z * 1.0;
    
    console.log("Approaching position:", approachPosition);
    
    // Navigate AI agent to fox position with enhanced animation control
    startDialogWithEntity(scene, approachPosition, () => {
      // Once agent reaches fox position, show dialog
      if (onDialogStart) onDialogStart();
      
      // After arriving, make the agent face the fox
      if (window.aiAgent) {
        // Calculate the direction from agent to fox
        const agentToFox = new THREE.Vector3().subVectors(
          foxPosition,
          window.aiAgent.position
        ).normalize();
        
        // Set rotation to face the fox
        window.aiAgent.rotation.y = Math.atan2(agentToFox.x, agentToFox.z);
      }
      
      // Show dialog bubble and get the dialog controller
      const dialogController = showDialog(dialogDuration);
      
      // Set up end callback
      const handleDialogEnd = () => {
        if (onDialogEnd) onDialogEnd();
        console.log("Dialog with MetaMask fox completed");
      };
      
      // Call onDialogEnd after dialog duration
      setTimeout(handleDialogEnd, dialogDuration);
    });
  }
}

/**
 * Button component specifically for Fox Dialog
 * @param {Object} props - Component props
 * @param {THREE.Scene} props.scene - THREE.js scene
 * @param {Function} props.onDialogStart - Optional callback for dialog start
 * @param {Function} props.onDialogEnd - Optional callback for dialog end
 */
export function FoxDialogButton({ scene, onDialogStart, onDialogEnd }) {
  // Create click handler that uses either provided scene or global scene
  const handleClick = () => {
    console.log("Fox dialog button clicked");
    const targetScene = scene || window.scene;
    
    if (!targetScene) {
      console.error("No scene available for fox dialog");
      return;
    }
    
    startFoxDialog(targetScene, onDialogStart, onDialogEnd);
  };
  
  return (
    <button 
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        padding: '10px 15px',
        backgroundColor: '#ff9800',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontFamily: 'Baloo 2, cursive',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f57c00';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#ff9800';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
      }}
    >
      <img 
        src="/icon/metamask.png" 
        alt="MetaMask" 
        style={{ 
          width: '20px', 
          height: '20px',
          objectFit: 'contain'
        }} 
      />
      Chat with Fox
    </button>
  );
} 