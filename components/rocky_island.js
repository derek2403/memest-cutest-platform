import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Track if the Rocky Island model has been loaded
let rockyIslandLoaded = false;
let rockyIslandModel = null;

// Function to load and place the Rocky Island model in space
export function spawnRockyIsland(scene) {
  // If model already exists, just toggle visibility
  if (rockyIslandLoaded && rockyIslandModel) {
    rockyIslandModel.visible = !rockyIslandModel.visible;
    // Update the global plugins tracking state
    if (window.pluginsInRoom) {
      window.pluginsInRoom.rockyIsland = rockyIslandModel.visible;
    }
    console.log(`Rocky Island visibility set to: ${rockyIslandModel.visible}`);
    return;
  }
  
  console.log("Loading Rocky Island model...");
  const gltfLoader = new GLTFLoader();
  
  // Load the Rocky Island model from the planets directory
  gltfLoader.load(
    "/models/planets/rocky_island.glb",
    (gltf) => {
      // Success callback
      console.log("Rocky Island model loaded successfully");
      
      // Get the model
      const model = gltf.scene;
      
      // Scale the model larger for better visibility
      model.scale.set(15, 15, 15);
      
      // Position the island in space at a different location than other planets
      model.position.set(
        -8, // X position closer to the center
        0,  // Y position at eye level
        -10  // Z position closer to the camera
      );
      
      // Add rotation animation effect - slower for an island
      model.userData.isRotating = true;
      model.userData.rotationSpeed = 0.002; // Very slow rotation
      
      // Add subtle pulsing glow effect
      model.userData.isPulsing = true;
      model.userData.pulseTime = 0.8; // Start at a different phase
      model.userData.pulseSpeed = 0.3; // Slower pulsing speed
      model.userData.updatePulse = (delta) => {
        // Update pulse time
        model.userData.pulseTime += delta * model.userData.pulseSpeed;
        
        // Calculate pulse factor (more subtle for an island)
        const pulseFactor = 0.9 + Math.sin(model.userData.pulseTime) * 0.1;
        
        // Apply pulsing to all mesh materials
        model.traverse((node) => {
          if (node.isMesh && node.material) {
            // Pulse the emissive intensity with a subtle effect
            node.material.emissiveIntensity = 0.25 * pulseFactor;
            
            // Also pulse the point light intensity if it exists
            if (model.children.length > 0) {
              const pointLight = model.children.find(child => child instanceof THREE.PointLight);
              if (pointLight) {
                pointLight.intensity = 1.5 + Math.sin(model.userData.pulseTime) * 0.5;
              }
            }
          }
        });
      };
      
      // Create custom materials for the island
      const grayMaterial = new THREE.MeshPhongMaterial({
        color: 0x808080, // Lighter gray
        shininess: 10,
        reflectivity: 0.3,
        emissive: 0x444444,
        emissiveIntensity: 0.3,
        specular: 0x111111
      });
      
      const greenMaterial = new THREE.MeshPhongMaterial({
        color: 0x55DD55, // Brighter green
        shininess: 5,
        reflectivity: 0.2,
        emissive: 0x228822,
        emissiveIntensity: 0.4,
        specular: 0x333333
      });
      
      // Make sure model casts and receives shadows
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          
          // Create a bounding box for this mesh
          if (!node.geometry.boundingBox) {
            node.geometry.computeBoundingBox();
          }
          
          const box = node.geometry.boundingBox;
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          // Get the Y position in world coordinates
          const worldPos = new THREE.Vector3();
          node.getWorldPosition(worldPos);
          
          // Use green material for lower parts of the island
          if (worldPos.y < -1 || center.y < 0) {
            node.material = greenMaterial.clone();
          } else {
            node.material = grayMaterial.clone();
          }
        }
      });
      
      // Add the model to the scene
      scene.add(model);
      
      // Add ambient light to the island as a whole
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
      model.add(ambientLight);
      
      // Add multiple lights to better illuminate the island
      // Main light from above (much brighter)
      const topLight = new THREE.PointLight(0xffffff, 6.0, 150);
      topLight.position.set(0, 20, 0);
      model.add(topLight);
      
      // Side light to highlight details
      const sideLight = new THREE.PointLight(0xffffff, 4.0, 100);
      sideLight.position.set(20, 5, 15);
      model.add(sideLight);
      
      // Green-tinted light from below for vegetation
      const greenLight = new THREE.PointLight(0xaaffaa, 3.0, 80);
      greenLight.position.set(0, -15, 0);
      model.add(greenLight);
      
      // Additional small white light for overall brightness
      const fillLight = new THREE.PointLight(0xffffff, 2.5, 150);
      fillLight.position.set(-20, 0, -15);
      model.add(fillLight);
      
      // Update tracking variables
      rockyIslandLoaded = true;
      rockyIslandModel = model;
      
      // Update the global plugins tracking state
      if (window.pluginsInRoom) {
        window.pluginsInRoom.rockyIsland = true;
      }
      
      console.log("Rocky Island added to scene at:", model.position);
      
      // Add the model to the animation loop for rotation
      if (typeof window.customModelsToAnimate === 'undefined') {
        window.customModelsToAnimate = [];
      }
      window.customModelsToAnimate.push(model);
    },
    (xhr) => {
      // Progress callback
      console.log(`Rocky Island model ${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (error) => {
      // Error callback
      console.error("Error loading Rocky Island model:", error);
    }
  );
} 