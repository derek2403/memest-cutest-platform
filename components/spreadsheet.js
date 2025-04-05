import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Track if the Spreadsheet model has been loaded
let spreadsheetModelLoaded = false;
let spreadsheetModel = null;

// Function to load and place the Spreadsheet model
export function spawnSpreadsheetModel(scene) {
  // If model already exists, just toggle visibility instead of reloading
  if (spreadsheetModelLoaded && spreadsheetModel) {
    spreadsheetModel.visible = !spreadsheetModel.visible;
    console.log(`Spreadsheet model visibility set to: ${spreadsheetModel.visible}`);
    return;
  }
  
  console.log("Loading Spreadsheet model...");
  const gltfLoader = new GLTFLoader();
  
  // Load the Spreadsheet model
  gltfLoader.load(
    "/models/spreadsheet/spreadsheet.glb",
    (gltf) => {
      // Success callback
      console.log("Spreadsheet model loaded successfully");
      
      // Get the model
      const model = gltf.scene;
      
      // Scale the model appropriately (same as Gmail)
      model.scale.set(0.38,0.38,0.38);
      
      // Position it adjacent to the Gmail model 
      model.position.set(
        1.438805815944017,     // Same x as Gmail
        1,                     // Same height as Gmail
        -1.9091312277057521    // Slightly different z to place it beside Gmail
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
      spreadsheetModelLoaded = true;
      spreadsheetModel = model;
      
      console.log("Spreadsheet model added to scene at:", model.position);
    },
    (xhr) => {
      // Progress callback
      console.log(`Spreadsheet model ${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (error) => {
      // Error callback
      console.error("Error loading Spreadsheet model:", error);
    }
  );
} 