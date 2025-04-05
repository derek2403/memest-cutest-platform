import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Track if the Gmail model has been loaded
let gmailModelLoaded = false;
let gmailModel = null;

// Function to load and place the Gmail model
export function spawnGmailModel(scene) {
  // If model already exists, just toggle visibility instead of reloading
  if (gmailModelLoaded && gmailModel) {
    gmailModel.visible = !gmailModel.visible;
    console.log(`Gmail model visibility set to: ${gmailModel.visible}`);
    return;
  }
  
  console.log("Loading Gmail model...");
  const gltfLoader = new GLTFLoader();
  
  // Load the Gmail model
  gltfLoader.load(
    "/models/gmail/gmail.glb",
    (gltf) => {
      // Success callback
      console.log("Gmail model loaded successfully");
      
      // Get the model
      const model = gltf.scene;
      
      // Scale the model appropriately (60% of original size)
      model.scale.set(0.45, 0.45, 0.45);
      
      // Set the position to the provided coordinates, but raise the y value
      model.position.set(
        2.278805815944017,
        1, // Raised higher above the floor
        -2.0091312277057521
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
      gmailModelLoaded = true;
      gmailModel = model;
      
      console.log("Gmail model added to scene at:", model.position);
    },
    (xhr) => {
      // Progress callback
      console.log(`Gmail model ${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (error) => {
      // Error callback
      console.error("Error loading Gmail model:", error);
    }
  );
} 