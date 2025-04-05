import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Track if the 1inch Planet model has been loaded
let oneinchPlanetLoaded = false;
let oneinchPlanetModel = null;

// Function to load and place the 1inch Planet model in space
export function spawnOneinchPlanet(scene) {
  // If model already exists, just toggle visibility
  if (oneinchPlanetLoaded && oneinchPlanetModel) {
    oneinchPlanetModel.visible = !oneinchPlanetModel.visible;
    console.log(`1inch Planet visibility set to: ${oneinchPlanetModel.visible}`);
    return;
  }
  
  console.log("Loading 1inch Planet model...");
  const gltfLoader = new GLTFLoader();
  
  // Load the 1inch Planet model from the planets directory
  gltfLoader.load(
    "/models/planets/1inch_planet.glb",
    (gltf) => {
      // Success callback
      console.log("1inch Planet model loaded successfully");
      
      // Get the model
      const model = gltf.scene;
      
      // Scale the model appropriately for a planet in space
      model.scale.set(30, 30, 30);
      
      // Position the planet in space at a different location than polygon_planet
      model.position.set(
        -20, // X position to the left side of the room (moved closer than 150)
        -30,  // Y position higher up in space (increased from 30 to 40)
        -200  // Z position closer to camera (from -80 to -60)
      );
      
      // Add rotation animation effect
      model.userData.isRotating = true;
      model.userData.rotationSpeed = 0.004; // Slightly different rotation speed
      
      // Add pulsing glow effect
      model.userData.isPulsing = true;
      model.userData.pulseTime = 2.5; // Start at a different phase than polygon planet
      model.userData.pulseSpeed = 0.4; // Slightly faster pulsing speed
      model.userData.updatePulse = (delta) => {
        // Update pulse time
        model.userData.pulseTime += delta * model.userData.pulseSpeed;
        
        // Calculate pulse factor (slightly increased range)
        const pulseFactor = 0.85 + Math.sin(model.userData.pulseTime) * 0.15;
        
        // Apply pulsing to all mesh materials
        model.traverse((node) => {
          if (node.isMesh && node.material) {
            // Pulse the emissive intensity with a more noticeable effect
            node.material.emissiveIntensity = 0.4 * pulseFactor;
            
            // Also pulse the point light intensity
            if (model.children.length > 0) {
              const pointLight = model.children.find(child => child instanceof THREE.PointLight);
              if (pointLight) {
                pointLight.intensity = 2.0 + Math.sin(model.userData.pulseTime) * 0.8;
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
          
          // Preserve original textures and colors of the unicorn model
          if (node.material) {
            // Don't override the color - use the original textures
            // node.material.color = new THREE.Color(0x0077ff); // Removed to keep original colors
            
            // Make it brighter by adjusting material properties
            node.material.roughness = 0.5; // Reduced roughness for more shine
            node.material.metalness = 0.4; // Increased metalness for more reflection
            
            // Add stronger emissive glow while preserving original colors
            node.material.emissive = new THREE.Color(0xffffff);
            node.material.emissiveIntensity = 0.4; // Increased from 0.15 to 0.4
            
            // Brighten the material if it has a color
            if (node.material.color) {
              // Brighten existing color by 30% without changing the hue
              const color = node.material.color.getHSL({});
              node.material.color.setHSL(color.h, color.s, Math.min(color.l * 1.3, 1.0));
            }
            
            // Ensure textures are displayed correctly
            if (node.material.map) {
              node.material.map.colorSpace = THREE.SRGBColorSpace;
              node.material.map.anisotropy = 16; // Higher quality texture filtering
            }
            
            node.material.needsUpdate = true;
          }
        }
      });
      
      // Add the model to the scene
      scene.add(model);
      
      // Add a dedicated light to illuminate the planet
      const planetLight = new THREE.PointLight(0xffffff, 2.5, 100);
      planetLight.position.set(0, 0, 0); // Position at center of model
      model.add(planetLight); // Add light as child of model so it moves with it
      
      // Update tracking variables
      oneinchPlanetLoaded = true;
      oneinchPlanetModel = model;
      
      // Update the global plugins tracking state
      if (window.pluginsInRoom) {
        window.pluginsInRoom.oneinchPlanet = true;
      }
      
      console.log("1inch Planet added to scene at:", model.position);
      
      // Add the model to the animation loop for rotation
      if (typeof window.customModelsToAnimate === 'undefined') {
        window.customModelsToAnimate = [];
      }
      window.customModelsToAnimate.push(model);
    },
    (xhr) => {
      // Progress callback
      console.log(`1inch Planet model ${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (error) => {
      // Error callback
      console.error("Error loading 1inch Planet model:", error);
    }
  );
} 