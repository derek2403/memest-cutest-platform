import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

// Track if the Island model has been loaded
let islandModelLoaded = false;
let islandModel = null;

// Track if the Dog model has been loaded
let dogModelLoaded = false;
let dogModel = null;

// Function to create a UI panel for the dog model
function createDogUI() {
  // Check if UI already exists
  if (document.getElementById('dog-ui-panel')) {
    return;
  }
  
  // Create UI container
  const uiPanel = document.createElement('div');
  uiPanel.id = 'dog-ui-panel';
  uiPanel.style.position = 'fixed';
  uiPanel.style.bottom = '20px';
  uiPanel.style.right = '20px';
  uiPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  uiPanel.style.color = 'white';
  uiPanel.style.padding = '15px';
  uiPanel.style.borderRadius = '10px';
  uiPanel.style.zIndex = '1000';
  uiPanel.style.fontFamily = 'Arial, sans-serif';
  uiPanel.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
  uiPanel.style.width = '250px';
  
  // Add title
  const title = document.createElement('h3');
  title.textContent = 'AI Assistant';
  title.style.margin = '0 0 10px 0';
  title.style.textAlign = 'center';
  title.style.color = '#4fc3f7';
  uiPanel.appendChild(title);
  
  // Add description
  const description = document.createElement('p');
  description.textContent = 'Your AI assistant is ready to help with tasks and answer questions.';
  description.style.fontSize = '14px';
  description.style.marginBottom = '15px';
  uiPanel.appendChild(description);
  
  // Add interaction buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'space-between';
  
  // Chat button
  const chatButton = document.createElement('button');
  chatButton.textContent = 'Chat';
  chatButton.style.backgroundColor = '#4fc3f7';
  chatButton.style.border = 'none';
  chatButton.style.padding = '8px 15px';
  chatButton.style.borderRadius = '5px';
  chatButton.style.cursor = 'pointer';
  chatButton.style.flex = '1';
  chatButton.style.marginRight = '5px';
  chatButton.onclick = () => {
    alert('Chat functionality will be implemented here');
    // Here you would open a chat interface
  };
  buttonContainer.appendChild(chatButton);
  
  // Help button
  const helpButton = document.createElement('button');
  helpButton.textContent = 'Help';
  helpButton.style.backgroundColor = '#81c784';
  helpButton.style.border = 'none';
  helpButton.style.padding = '8px 15px';
  helpButton.style.borderRadius = '5px';
  helpButton.style.cursor = 'pointer';
  helpButton.style.flex = '1';
  helpButton.style.marginLeft = '5px';
  helpButton.onclick = () => {
    alert('Help functionality will be implemented here');
    // Here you would show help information
  };
  buttonContainer.appendChild(helpButton);
  
  uiPanel.appendChild(buttonContainer);
  
  // Close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '5px';
  closeButton.style.backgroundColor = 'transparent';
  closeButton.style.border = 'none';
  closeButton.style.color = 'white';
  closeButton.style.fontSize = '20px';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => {
    document.body.removeChild(uiPanel);
  };
  uiPanel.appendChild(closeButton);
  
  // Add to document
  document.body.appendChild(uiPanel);
}

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

// Function to load and place the Dog model on top of the island
export function spawnDogModel(scene) {
  // If model already exists, just toggle visibility instead of reloading
  if (dogModelLoaded && dogModel) {
    dogModel.visible = !dogModel.visible;
    // Update the global plugins tracking state
    if (window.pluginsInRoom) {
      window.pluginsInRoom.dog = dogModel.visible;
    }
    console.log(`Dog model visibility set to: ${dogModel.visible}`);
    return;
  }
  
  console.log("Loading Dog model...");
  const gltfLoader = new GLTFLoader();
  
  // Load the base.glb model instead of dog.fbx
  gltfLoader.load(
    "/models/ahboi/base.glb",
    (gltf) => {
      // Success callback
      console.log("Dog model loaded successfully");
      
      // Get the model
      const model = gltf.scene;
      
      // Scale the model appropriately
      model.scale.set(1.0, 1.0, 1.0);
      
      // Position the dog at the corner of the room floor
      model.position.set(
        4, // Corner X position
        -9.5, // Floor level
        4  // Corner Z position
      );
      
      // Ensure the model stays static (no animations or movement)
      model.userData.isStatic = true;
      
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
      
      // Make the model interactive
      model.userData.clickable = true;
      model.userData.onClick = () => {
        console.log("Dog model clicked!");
        createDogUI();
      };
      
      // Add the model to the scene
      scene.add(model);
      
      // Update tracking variables
      dogModelLoaded = true;
      dogModel = model;
      
      // Update the global plugins tracking state
      if (window.pluginsInRoom) {
        window.pluginsInRoom.dog = true;
      }
      
      console.log("Dog model added to scene at:", model.position);
    },
    (xhr) => {
      // Progress callback
      console.log(`Dog model ${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (error) => {
      // Error callback
      console.error("Error loading Dog model:", error);
    }
  );
}