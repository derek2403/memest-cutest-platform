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
        roughness: 1.0, // Maximum roughness for matte finish
        metalness: 0.0 // No metalness for non-reflective surface
      });
      
      // Apply material to all mesh parts to preserve texture colors
      fbx.traverse((child) => {
        if (child.isMesh) {
          // Apply the same material to all parts to preserve texture
          child.material = bodyMaterial.clone(); // Clone to avoid shared material issues
          
          // Only change material for eyes which need to glow
          if (child.name.toLowerCase().includes('eye') || 
              child.name.toLowerCase().includes('screen') || 
              child.name.toLowerCase().includes('face')) {
            child.material = new THREE.MeshStandardMaterial({
              skinning: true,
              color: new THREE.Color('#00FFFF'), // Bright cyan for eyes
              emissive: new THREE.Color('#00FFFF'),
              emissiveIntensity: 0.8, // Slightly reduced glow
              roughness: 0.8, // High roughness for less shine
              metalness: 0.0 // No metalness for non-reflective surface
            });
          }
          
          // Ensure no color transformations
          if (child.material.map) {
            child.material.map.encoding = THREE.LinearEncoding;
            child.material.needsUpdate = true;
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