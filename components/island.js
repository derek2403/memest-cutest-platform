import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Track if the Island model has been loaded
let islandModelLoaded = false;
let islandModel = null;

// Function to load and place the Island model
export function spawnIslandModel(scene) {
  // If model already exists, just toggle visibility instead of reloading
  if (islandModelLoaded && islandModel) {
    islandModel.visible = !islandModel.visible;
    // Update the global plugins tracking state
    if (window.pluginsInRoom) {
      window.pluginsInRoom.island = islandModel.visible;
    }
    console.log(`Island model visibility set to: ${islandModel.visible}`);
    return;
  }
  
  console.log("Loading Island model...");
  const gltfLoader = new GLTFLoader();
  
  // Load the Island model
  gltfLoader.load(
    "/models/island/island.glb",
    (gltf) => {
      // Success callback
      console.log("Island model loaded successfully");
      
      // Get the model
      const model = gltf.scene;
      
      // Scale the model up to be 20x larger
      model.scale.set(10.0, 10.0, 10.0); // Increased from 0.3 to 6.0 (20x larger)
      
      // Set the position to the center of the room but elevated to account for larger size
      model.position.set(
        0, // Center X
        -11.8, // Raised higher above floor to account for larger size
        -2.5  // Center Z
      );
      
      // Make sure model casts and receives shadows
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          
          // If needed, adjust material properties
          if (node.material) {
            node.material.roughness = 0.7;
            node.material.metalness = 0.3;
            node.material.needsUpdate = true;
          }
        }
      });
      
      // Add the model to the scene
      scene.add(model);
      
      // Update tracking variables
      islandModelLoaded = true;
      islandModel = model;
      
      // Update the global plugins tracking state
      if (window.pluginsInRoom) {
        window.pluginsInRoom.island = true;
      }
      
      console.log("Island model added to scene at:", model.position);
    },
    (xhr) => {
      // Progress callback
      console.log(`Island model ${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (error) => {
      // Error callback
      console.error("Error loading Island model:", error);
    }
  );
} 