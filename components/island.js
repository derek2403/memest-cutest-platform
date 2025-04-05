import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Track if the Island models have been loaded
let islandModelLoaded = false;
let islandModel = null;
let island2ModelLoaded = false;
let island2Model = null;

// Function to load and place the Island models
export function spawnIslandModel(scene) {
  // If models already exist, just toggle visibility instead of reloading
  if (islandModelLoaded && islandModel && island2ModelLoaded && island2Model) {
    islandModel.visible = !islandModel.visible;
    island2Model.visible = !island2Model.visible;
    // Update the global plugins tracking state
    if (window.pluginsInRoom) {
      window.pluginsInRoom.island = islandModel.visible;
    }
    console.log(`Island models visibility set to: ${islandModel.visible}`);
    return;
  }
  
  console.log("Loading Island models...");
  const gltfLoader = new GLTFLoader();
  
  // Load the first Island model
  gltfLoader.load(
    "/models/island/island.glb",
    (gltf) => {
      // Success callback
      console.log("Island model loaded successfully");
      
      // Get the model
      const model = gltf.scene;
      
      // Scale the model up
      model.scale.set(10.0, 10.0, 10.0);
      
      // Set the position
      model.position.set(
        -15, // Moved to the left to make room for second island
        -11.8, // Raised higher above floor
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
  
  // Load the second Island model (island2.glb)
  gltfLoader.load(
    "/models/island/island2.glb",
    (gltf) => {
      // Success callback
      console.log("Island2 model loaded successfully");
      
      // Get the model
      const model = gltf.scene;
      
      // Scale the model up
      model.scale.set(10.0, 10.0, 10.0);
      
      // Set the position to the right of the first island
      model.position.set(
        15, // Positioned to the right
        -11.8, // Same height as first island
        -2.5  // Same Z position
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
      island2ModelLoaded = true;
      island2Model = model;
      
      console.log("Island2 model added to scene at:", model.position);
    },
    (xhr) => {
      // Progress callback
      console.log(`Island2 model ${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (error) => {
      // Error callback
      console.error("Error loading Island2 model:", error);
    }
  );
} 