import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Track if the 1inch unicorn model has been loaded
let inchUnicornLoaded = false;
let inchUnicornModel = null;

// Function to load and place the 1inch unicorn model
export function spawn1inchUnicorn(scene) {
  // If model already exists, just toggle visibility instead of reloading
  if (inchUnicornLoaded && inchUnicornModel) {
    inchUnicornModel.visible = !inchUnicornModel.visible;
    console.log(`1inch unicorn visibility set to: ${inchUnicornModel.visible}`);
    return;
  }
  
  console.log("Loading 1inch unicorn model...");
  const gltfLoader = new GLTFLoader();
  
  // Load the 1inch unicorn model
  gltfLoader.load(
    "/models/1inch_unicorn/1inch_unicorn.glb",
    (gltf) => {
      // Success callback
      console.log("1inch unicorn model loaded successfully");
      
      // Get the model
      const model = gltf.scene;
      
      // Scale the model appropriately
      model.scale.set(0.9, 0.9, 0.9); // Adjust scale as needed
      
      // Set the position to the exact coordinates provided
      model.position.set(
        0.9843086503678045,
        -6.077401855916396e-16, // Essentially zero
        3.0370184733685843 // Moved backwards (smaller z value)
      );
      
      // Rotate the unicorn anti-clockwise (counter-clockwise)
      // Rotation is in radians, Math.PI/2 is 90 degrees
      model.rotation.y = Math.PI; // 180 degrees counter-clockwise
      
      // Add the model to the scene
      scene.add(model);
      
      // Update tracking variables
      inchUnicornLoaded = true;
      inchUnicornModel = model;
      
      console.log("1inch unicorn added to scene at:", model.position);
    },
    (xhr) => {
      // Progress callback
      console.log(`1inch unicorn model ${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (error) => {
      // Error callback
      console.error("Error loading 1inch unicorn model:", error);
    }
  );
} 