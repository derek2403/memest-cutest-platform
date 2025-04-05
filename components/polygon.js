import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Track if the Polygon model has been loaded
let polygonModelLoaded = false;
let polygonModel = null;

// Function to load and place the Polygon model
export function spawnPolygonModel(scene) {
  // If model already exists, just toggle visibility instead of reloading
  if (polygonModelLoaded && polygonModel) {
    polygonModel.visible = !polygonModel.visible;
    console.log(`Polygon model visibility set to: ${polygonModel.visible}`);
    return;
  }
  
  console.log("Loading Polygon model...");
  const gltfLoader = new GLTFLoader();
  
  // Load the Polygon model
  gltfLoader.load(
    "/models/polygon/polygon.glb",
    (gltf) => {
      // Success callback
      console.log("Polygon model loaded successfully");
      
      // Get the model
      const model = gltf.scene;
      
      // Scale the model to 60% of original size
      model.scale.set(0.5, 0.5, 0.5); // Reduced to 60% of original size
      
      // Set the position to the provided coordinates, but raise the y value
      model.position.set(
        -0.822410210531122,
        0.55, // Raised higher above the table
        0.6046197241590376
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
      polygonModelLoaded = true;
      polygonModel = model;
      
      console.log("Polygon model added to scene at:", model.position);
    },
    (xhr) => {
      // Progress callback
      console.log(`Polygon model ${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (error) => {
      // Error callback
      console.error("Error loading Polygon model:", error);
    }
  );
} 