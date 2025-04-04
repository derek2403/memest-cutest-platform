import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

// Track if an agent has already been loaded
let agentLoaded = false;

// Function to load the AI agent
export function loadAIAgent(scene, callbacks = {}) {
  // If an agent is already loaded, remove it first
  if (agentLoaded) {
    removeExistingAgents(scene);
  }
  
  console.log("Loading AI Agent model...");
  const fbxLoader = new FBXLoader();
  const textureLoader = new THREE.TextureLoader();
  
  // Load the idle animation model
  fbxLoader.load(
    "/models/ai-agent/idling.fbx",
    (fbx) => {
      // Scale down the model
      fbx.scale.set(0.01, 0.01, 0.01);
      
      // Apply textures with proper colors
      const bodyTexture = textureLoader.load('/models/ai-agent/shaded.png');
      
      // Create materials for different parts
      const bodyMaterial = new THREE.MeshStandardMaterial({
        map: bodyTexture,
        skinning: true,
        color: new THREE.Color('#FF9D00'), // Bright orange for body
        roughness: 0.9, // Much higher roughness to reduce shine
        metalness: 0.0 // No metalness for a matte look
      });
      
      const greenPartsMaterial = new THREE.MeshStandardMaterial({
        map: bodyTexture,
        skinning: true,
        color: new THREE.Color('#1D8A77'), // Teal/green for limbs
        roughness: 0.9, // Much higher roughness to reduce shine
        metalness: 0.0 // No metalness for a matte look
      });
      
      const eyesMaterial = new THREE.MeshStandardMaterial({
        skinning: true,
        color: new THREE.Color('#00FFEE'), // Cyan for eyes
        emissive: new THREE.Color('#00FFEE'),
        emissiveIntensity: 0.6, // Reduced intensity for less glow
        roughness: 0.5, // More roughness but still some glow
        metalness: 0.0 // No metalness
      });
      
      // Apply materials based on mesh names or positions
      fbx.traverse((child) => {
        if (child.isMesh) {
          // Try to identify parts by name
          const name = child.name.toLowerCase();
          
          if (name.includes('eye') || name.includes('screen') || name.includes('face')) {
            child.material = eyesMaterial;
          } else if (name.includes('arm') || name.includes('leg') || name.includes('limb')) {
            child.material = greenPartsMaterial;
          } else {
            child.material = bodyMaterial;
          }
          
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });
      
      // Position the agent
      fbx.position.set(0, 0, 0);
      
      // Mark this object as an AI agent for identification
      fbx.userData.isAIAgent = true;
      
      // Add to scene
      scene.add(fbx);
      
      // Set up animation mixer
      const mixer = new THREE.AnimationMixer(fbx);
      const idleAction = mixer.clipAction(fbx.animations[0]);
      idleAction.play();
      
      // Load walking animation
      fbxLoader.load(
        "/models/ai-agent/walking.fbx",
        (walkFbx) => {
          const walkAction = mixer.clipAction(walkFbx.animations[0]);
          
          // Store references to the agent and animations
          if (callbacks.onAgentLoaded) {
            callbacks.onAgentLoaded({
              agent: fbx,
              mixer: mixer,
              animations: {
                idle: idleAction,
                walk: walkAction
              }
            });
          }
          
          console.log("AI Agent loaded successfully with animations");
          agentLoaded = true;
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + "% loaded (walking animation)");
        },
        (error) => {
          console.error("Error loading walking animation:", error);
        }
      );
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded (idle model)");
    },
    (error) => {
      console.error("Error loading AI Agent model:", error);
    }
  );
}

// Function to remove any existing AI agents from the scene
function removeExistingAgents(scene) {
  const agentsToRemove = [];
  
  scene.traverse((object) => {
    if (object.userData && object.userData.isAIAgent) {
      agentsToRemove.push(object);
    }
  });
  
  agentsToRemove.forEach(agent => {
    console.log("Removing existing AI agent from scene");
    scene.remove(agent);
  });
  
  agentLoaded = false;
} 