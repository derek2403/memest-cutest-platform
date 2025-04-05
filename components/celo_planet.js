import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Track if the Celo Planet model has been loaded
let celoPlanetLoaded = false;
let celoPlanetModel = null;

// Function to load and place the Celo Planet model in space
export function spawnCeloPlanet(scene) {
  // If model already exists, just toggle visibility
  if (celoPlanetLoaded && celoPlanetModel) {
    celoPlanetModel.visible = !celoPlanetModel.visible;
    // Update the global plugins tracking state
    if (window.pluginsInRoom) {
      window.pluginsInRoom.celoPlanet = celoPlanetModel.visible;
    }
    console.log(`Celo Planet visibility set to: ${celoPlanetModel.visible}`);
    return;
  }
  
  console.log("Loading Celo Planet model...");
  const gltfLoader = new GLTFLoader();
  
  // Load the Celo Planet model from the planets directory
  gltfLoader.load(
    "/models/planets/celo_planet.glb",
    (gltf) => {
      // Success callback
      console.log("Celo Planet model loaded successfully");
      
      // Get the model
      const model = gltf.scene;
      
      // Scale the model appropriately for a planet in space
      model.scale.set(28, 28, 28);
      
      // Position the planet in space at a different location than other planets
      model.position.set(
        100, // X position to the right side of the room (within camera view frustum)
        20,  // Y position in space
        -100  // Z position in the distance (but not too far)
      );
      
      // Add rotation animation effect
      model.userData.isRotating = true;
      model.userData.rotationSpeed = 0.003; // Slow rotation
      
      // Add pulsing glow effect
      model.userData.isPulsing = true;
      model.userData.pulseTime = 1.5; // Start at a different phase than other planets
      model.userData.pulseSpeed = 0.45; // Speed of pulsing
      model.userData.updatePulse = (delta) => {
        // Update pulse time
        model.userData.pulseTime += delta * model.userData.pulseSpeed;
        
        // Calculate pulse factor
        const pulseFactor = 0.85 + Math.sin(model.userData.pulseTime) * 0.15;
        
        // Apply pulsing to all mesh materials
        model.traverse((node) => {
          if (node.isMesh && node.material) {
            // Pulse the emissive intensity
            node.material.emissiveIntensity = 0.45 * pulseFactor;
            
            // Also pulse the point light intensity if it exists
            if (model.children.length > 0) {
              const pointLight = model.children.find(child => child instanceof THREE.PointLight);
              if (pointLight) {
                pointLight.intensity = 2.2 + Math.sin(model.userData.pulseTime) * 0.7;
              }
            }
          }
        });
      };
      
      // Make sure model casts and receives shadows
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          
          // Adjust material properties to make it yellow to match the image
          if (node.material) {
            // Set the base color to a yellow color
            node.material.color = new THREE.Color(0xFFD700); // Golden yellow color
            node.material.roughness = 0.4; // Less rough for more shine
            node.material.metalness = 0.3; // Less metalness for more matte look
            
            // Add emissive glow
            node.material.emissive = new THREE.Color(0xFFB400); // Warm yellow glow
            node.material.emissiveIntensity = 0.35; // Moderate intensity
            
            // Add some reflection for better appearance
            node.material.envMapIntensity = 1.1;
            
            node.material.needsUpdate = true;
          }
        }
      });
      
      // Add the model to the scene
      scene.add(model);
      
      // Add a dedicated light to illuminate the planet
      const planetLight = new THREE.PointLight(0xFFD700, 1.8, 120);
      planetLight.position.set(0, 0, 0); // Position at center of model
      model.add(planetLight);
      
      // Update tracking variables
      celoPlanetLoaded = true;
      celoPlanetModel = model;
      
      // Update the global plugins tracking state
      if (window.pluginsInRoom) {
        window.pluginsInRoom.celoPlanet = true;
      }
      
      console.log("Celo Planet added to scene at:", model.position);
      
      // Add the model to the animation loop for rotation
      if (typeof window.customModelsToAnimate === 'undefined') {
        window.customModelsToAnimate = [];
      }
      window.customModelsToAnimate.push(model);
    },
    (xhr) => {
      // Progress callback
      console.log(`Celo Planet model ${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (error) => {
      // Error callback
      console.error("Error loading Celo Planet model:", error);
    }
  );
} 