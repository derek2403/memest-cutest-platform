import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Track if the Celo model has been loaded
let celoModelLoaded = false;
let celoModel = null;

// Function to load and place the Celo model
export function spawnCeloModel(scene) {
  // If model already exists, just toggle visibility instead of reloading
  if (celoModelLoaded && celoModel) {
    celoModel.visible = !celoModel.visible;
    // Update the global plugins tracking state
    if (window.pluginsInRoom) {
      window.pluginsInRoom.celo = celoModel.visible;
    }
    console.log(`Celo model visibility set to: ${celoModel.visible}`);
    return;
  }
  
  console.log("Loading Celo model...");
  const gltfLoader = new GLTFLoader();
  
  // Load the Celo model
  gltfLoader.load(
    "/models/celo/celo.glb",
    (gltf) => {
      // Success callback
      console.log("Celo model loaded successfully");
      
      // Get the model
      const model = gltf.scene;
      
      // Scale the model to 60% of original size
      model.scale.set(0.5, 0.5, 0.5); // Reduced size for better fit
      
      // Set the position to the provided coordinates, but raise the y value
      model.position.set(
        -0.5519415662663658,
        0.58590545802205797, // Raised higher above the floor
        1.29011611383365059,
      );
      
      // Make sure model casts and receives shadows
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          
          // If needed, adjust material properties
          if (node.material) {
            node.material.roughness = 0.7;
            node.material.metalness = 0.2;
            node.material.needsUpdate = true;
          }
        }
      });
      
      // Add the model to the scene
      scene.add(model);
      
      // Update tracking variables
      celoModelLoaded = true;
      celoModel = model;
      
      // Update the global plugins tracking state
      if (window.pluginsInRoom) {
        window.pluginsInRoom.celo = true;
      }
      
      console.log("Celo model added to scene at:", model.position);
    },
    (xhr) => {
      // Progress callback
      console.log(`Celo model ${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (error) => {
      // Error callback
      console.error("Error loading Celo model:", error);
    }
  );
} 