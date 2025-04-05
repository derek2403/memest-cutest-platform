import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Track if the Polygon Planet model has been loaded
let polygonPlanetLoaded = false;
let polygonPlanetModel = null;

// Function to load and place the Polygon Planet model in space
export function spawnPolygonPlanet(scene) {
  // If model already exists, just toggle visibility
  if (polygonPlanetLoaded && polygonPlanetModel) {
    polygonPlanetModel.visible = !polygonPlanetModel.visible;
    console.log(`Polygon Planet visibility set to: ${polygonPlanetModel.visible}`);
    return;
  }
  
  console.log("Loading Polygon Planet model...");
  const gltfLoader = new GLTFLoader();
  
  // Load the Polygon Planet model from the planets directory
  gltfLoader.load(
    "/models/planets/polygon_planet.glb",
    (gltf) => {
      // Success callback
      console.log("Polygon Planet model loaded successfully");
      
      // Get the model
      const model = gltf.scene;
      
      // Scale the model appropriately for a planet in space
      model.scale.set(25, 25, 25);
      
      // Position the planet in space (higher up and away from the room)
      model.position.set(
        -150, // X position to the right side of the room
        6,   // Y position high up in space above the room
        -130   // Z position in the distance
      );
      
      // Add rotation animation effect
      model.userData.isRotating = true;
      model.userData.rotationSpeed = 0.005; // Slow rotation
      
      // Add pulsing glow effect
      model.userData.isPulsing = true;
      model.userData.pulseTime = 0;
      model.userData.pulseSpeed = 0.5; // Speed of pulsing
      model.userData.updatePulse = (delta) => {
        // Update pulse time
        model.userData.pulseTime += delta * model.userData.pulseSpeed;
        
        // Calculate pulse factor (0.7 to 1.0 range)
        const pulseFactor = 0.85 + Math.sin(model.userData.pulseTime) * 0.15;
        
        // Apply pulsing to all mesh materials
        model.traverse((node) => {
          if (node.isMesh && node.material) {
            // Pulse the emissive intensity
            node.material.emissiveIntensity = 0.5 * pulseFactor;
          }
        });
      };
      
      // Make sure model casts and receives shadows
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          
          // Adjust material properties to make it a brighter purple
          if (node.material) {
            // Set the base color to a brighter purple
            node.material.color = new THREE.Color(0x8a2be2); // Brighter purple color
            node.material.roughness = 0.6; // Slightly less rough for more shine
            node.material.metalness = 0.4; // More metalness for reflection
            
            // Add stronger emissive glow to make it really stand out in space
            node.material.emissive = new THREE.Color(0x8c00ff); // Bright purple glow
            node.material.emissiveIntensity = 0.5; // Increased intensity
            
            // Add some reflection for better appearance
            node.material.envMapIntensity = 1.2;
            
            node.material.needsUpdate = true;
          }
        }
      });
      
      // Add the model to the scene
      scene.add(model);
      
      // Update tracking variables
      polygonPlanetLoaded = true;
      polygonPlanetModel = model;
      
      console.log("Polygon Planet added to scene at:", model.position);
      
      // Add the model to the animation loop for rotation
      // This needs to be handled in the main animation loop in index.js
      if (typeof window.customModelsToAnimate === 'undefined') {
        window.customModelsToAnimate = [];
      }
      window.customModelsToAnimate.push(model);
    },
    (xhr) => {
      // Progress callback
      console.log(`Polygon Planet model ${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (error) => {
      // Error callback
      console.error("Error loading Polygon Planet model:", error);
    }
  );
} 