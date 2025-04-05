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
      // Set encoding to sRGB to preserve vibrant colors
      bodyTexture.encoding = THREE.sRGBEncoding;
      // Increase color saturation and brightness
      bodyTexture.colorSpace = THREE.SRGBColorSpace;
      // Enhance texture quality
      bodyTexture.anisotropy = 16;
      bodyTexture.generateMipmaps = true;
      bodyTexture.minFilter = THREE.LinearMipmapLinearFilter;
      bodyTexture.magFilter = THREE.LinearFilter;
      
      // Create materials for different parts
      const bodyMaterial = new THREE.MeshPhysicalMaterial({
        map: bodyTexture,
        skinning: true,
        roughness: 0.4, // Lower roughness for more vibrant appearance
        metalness: 0.15, // Slight metalness to enhance color
        emissive: new THREE.Color(0x333333), // Increased emissive to enhance colors
        emissiveMap: bodyTexture, // Use same texture for emissive to boost colors
        emissiveIntensity: 0.15, // Moderate emissive intensity
        clearcoat: 0.2, // Add subtle clearcoat for enhanced appearance
        clearcoatRoughness: 0.8, // Keep the clearcoat mostly matte
        transmission: 0.0, // No transmission
        reflectivity: 0.2 // Slight reflectivity
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
              emissiveIntensity: 1.0, // Increased glow
              roughness: 0.4, // Reduced roughness for more shine
              metalness: 0.2 // Slight metalness for reflective surface
            });
          }
          
          // Ensure no color transformations
          if (child.material.map) {
            // Use sRGB encoding for vibrant colors
            child.material.map.encoding = THREE.sRGBEncoding;
            child.material.map.colorSpace = THREE.SRGBColorSpace;
            // Enable the texture to be more vibrant
            child.material.map.anisotropy = 16;
            child.material.needsUpdate = true;
          }
          
          child.castShadow = true; // Enable shadows for better visual integration
          child.receiveShadow = true;
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