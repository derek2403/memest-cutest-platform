// MetaWallet component - Draggable MetaMask wallet interface
export function initMetaWallet() {
    // Create a draggable icon that expands into a wallet interface
    const createDraggableMetaMaskIcon = () => {
        // Create the draggable icon element
        const icon = document.createElement('div');
        icon.id = 'metamask-draggable-icon';
        
        // Add the MetaMask image
        const iconImg = document.createElement('img');
        iconImg.src = '/icon/metamask.png';
        iconImg.alt = 'MetaMask';
        iconImg.style.width = '40px';
        iconImg.style.height = '40px';
        icon.appendChild(iconImg);
        
        // Style the icon
        icon.style.position = 'absolute';
        icon.style.top = '100px';
        icon.style.left = '20px';
        icon.style.width = '40px';
        icon.style.height = '40px';
        icon.style.borderRadius = '50%';
        icon.style.backgroundColor = '#ffffff';
        icon.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        icon.style.cursor = 'grab';
        icon.style.zIndex = '1000';
        icon.style.display = 'flex';
        icon.style.justifyContent = 'center';
        icon.style.alignItems = 'center';
        icon.style.transition = 'transform 0.2s';
        
        // Add hover effect
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'scale(1.1)';
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = 'scale(1)';
        });
        
        // Variables for drag functionality
        let isDragging = false;
        let offsetX, offsetY;
        
        // Add drag start event
        icon.addEventListener('mousedown', (e) => {
            isDragging = true;
            icon.style.cursor = 'grabbing';
            
            // Calculate the offset of the mouse pointer relative to the icon
            const rect = icon.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            // Prevent default behavior to avoid text selection during drag
            e.preventDefault();
        });
        
        // Add drag event
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            // Update the icon position based on mouse position and offset
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            icon.style.left = `${x}px`;
            icon.style.top = `${y}px`;
        });
        
        // Add drag end event
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                icon.style.cursor = 'grab';
                
                // Create and show the wallet box when dragging ends
                createWalletBox(icon.style.left, icon.style.top);
                
                // Remove the icon after creating the wallet box
                document.body.removeChild(icon);
            }
        });
        
        // Add the icon to the document
        document.body.appendChild(icon);
    };
    
    // Create the wallet box at the specified position
    const createWalletBox = (left, top) => {
        // Create the wallet box container
        const walletBox = document.createElement('div');
        walletBox.id = 'metamask-wallet-box';
        
        // Style the wallet box
        walletBox.style.position = 'absolute';
        walletBox.style.left = left;
        walletBox.style.top = top;
        walletBox.style.width = '300px';
        walletBox.style.height = '400px';
        walletBox.style.backgroundColor = '#ffffff';
        walletBox.style.borderRadius = '15px';
        walletBox.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
        walletBox.style.zIndex = '1000';
        walletBox.style.overflow = 'hidden';
        walletBox.style.display = 'flex';
        walletBox.style.flexDirection = 'column';
        walletBox.style.fontFamily = 'Quicksand, sans-serif';
        
        // Create the header with close button
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.padding = '15px';
        header.style.backgroundColor = '#ffb6c1';
        header.style.color = '#ffffff';
        
        // Add MetaMask logo and title to header
        const headerLeft = document.createElement('div');
        headerLeft.style.display = 'flex';
        headerLeft.style.alignItems = 'center';
        
        const headerIcon = document.createElement('img');
        headerIcon.src = '/icon/metamask.png';
        headerIcon.alt = 'MetaMask';
        headerIcon.style.width = '24px';
        headerIcon.style.height = '24px';
        headerIcon.style.marginRight = '10px';
        
        const headerTitle = document.createElement('h3');
        headerTitle.textContent = 'MetaMask Wallet';
        headerTitle.style.margin = '0';
        headerTitle.style.color = '#5a5a5a';
        
        headerLeft.appendChild(headerIcon);
        headerLeft.appendChild(headerTitle);
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.color = '#5a5a5a';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.padding = '0';
        closeButton.style.lineHeight = '1';
        closeButton.style.display = 'flex';
        closeButton.style.justifyContent = 'center';
        closeButton.style.alignItems = 'center';
        closeButton.style.width = '30px';
        closeButton.style.height = '30px';
        closeButton.style.borderRadius = '50%';
        closeButton.style.transition = 'background-color 0.2s';
        
        // Add hover effect to close button
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        });
        
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.backgroundColor = 'transparent';
        });
        
        // Add click event to close button
        closeButton.addEventListener('click', () => {
            document.body.removeChild(walletBox);
            // Recreate the draggable icon when wallet is closed
            createDraggableMetaMaskIcon();
        });
        
        // Assemble header
        header.appendChild(headerLeft);
        header.appendChild(closeButton);
        walletBox.appendChild(header);
        
        // Create wallet content
        const content = document.createElement('div');
        content.style.padding = '20px';
        content.style.flex = '1';
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.gap = '15px';
        
        // Add wallet balance section
        const balanceSection = document.createElement('div');
        balanceSection.style.textAlign = 'center';
        balanceSection.style.padding = '15px';
        balanceSection.style.backgroundColor = '#f9f9f9';
        balanceSection.style.borderRadius = '10px';
        
        const balanceLabel = document.createElement('div');
        balanceLabel.textContent = 'Total Balance';
        balanceLabel.style.fontSize = '14px';
        balanceLabel.style.color = '#888';
        
        const balanceAmount = document.createElement('div');
        balanceAmount.textContent = '0.0000 ETH';
        balanceAmount.style.fontSize = '24px';
        balanceAmount.style.fontWeight = 'bold';
        balanceAmount.style.margin = '10px 0';
        balanceAmount.style.color = '#5a5a5a';
        
        const balanceFiat = document.createElement('div');
        balanceFiat.textContent = '$0.00 USD';
        balanceFiat.style.fontSize = '14px';
        balanceFiat.style.color = '#888';
        
        balanceSection.appendChild(balanceLabel);
        balanceSection.appendChild(balanceAmount);
        balanceSection.appendChild(balanceFiat);
        
        // Add action buttons
        const actionButtons = document.createElement('div');
        actionButtons.style.display = 'flex';
        actionButtons.style.justifyContent = 'space-between';
        actionButtons.style.gap = '10px';
        
        const createActionButton = (text, icon) => {
            const button = document.createElement('button');
            button.style.flex = '1';
            button.style.padding = '12px';
            button.style.backgroundColor = '#f0f0f0';
            button.style.border = 'none';
            button.style.borderRadius = '10px';
            button.style.cursor = 'pointer';
            button.style.display = 'flex';
            button.style.flexDirection = 'column';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            button.style.gap = '5px';
            button.style.transition = 'transform 0.2s, background-color 0.2s';
            
            const iconElement = document.createElement('div');
            iconElement.innerHTML = icon;
            iconElement.style.fontSize = '20px';
            
            const textElement = document.createElement('div');
            textElement.textContent = text;
            textElement.style.fontSize = '12px';
            textElement.style.color = '#5a5a5a';
            
            button.appendChild(iconElement);
            button.appendChild(textElement);
            
            // Add hover effect
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = '#e8e8e8';
                button.style.transform = 'translateY(-2px)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = '#f0f0f0';
                button.style.transform = 'translateY(0)';
            });
            
            return button;
        };
        
        const sendButton = createActionButton('Send', '↑');
        const receiveButton = createActionButton('Receive', '↓');
        const swapButton = createActionButton('Swap', '⇄');
        
        actionButtons.appendChild(sendButton);
        actionButtons.appendChild(receiveButton);
        actionButtons.appendChild(swapButton);
        
        // Add recent activity section
        const activitySection = document.createElement('div');
        activitySection.style.flex = '1';
        
        const activityTitle = document.createElement('h4');
        activityTitle.textContent = 'Recent Activity';
        activityTitle.style.margin = '10px 0';
        activityTitle.style.color = '#5a5a5a';
        
        const activityList = document.createElement('div');
        activityList.style.fontSize = '14px';
        activityList.style.color = '#888';
        activityList.style.textAlign = 'center';
        activityList.style.padding = '20px 0';
        activityList.textContent = 'No recent transactions';
        
        activitySection.appendChild(activityTitle);
        activitySection.appendChild(activityList);
        
        // Assemble content
        content.appendChild(balanceSection);
        content.appendChild(actionButtons);
        content.appendChild(activitySection);
        walletBox.appendChild(content);
        
        // Make the wallet box draggable by the header
        let isDragging = false;
        let offsetX, offsetY;
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            
            // Calculate the offset of the mouse pointer relative to the wallet box
            const rect = walletBox.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            // Prevent default behavior to avoid text selection during drag
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            // Update the wallet box position based on mouse position and offset
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            walletBox.style.left = `${x}px`;
            walletBox.style.top = `${y}px`;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Add the wallet box to the document
        document.body.appendChild(walletBox);
    };
    
    // Initialize by creating the draggable icon
    createDraggableMetaMaskIcon();
}

// Function to connect to MetaMask (placeholder)
function connectToMetaMask() {
    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!');
        
        // Request account access
        window.ethereum.request({ method: 'eth_requestAccounts' })
            .then(accounts => {
                console.log('Connected accounts:', accounts);
                // You can update the UI with the connected account info here
                return accounts[0];
            })
            .catch(error => {
                console.error('Error connecting to MetaMask:', error);
            });
    } else {
        console.log('MetaMask is not installed!');
        // You might want to prompt the user to install MetaMask
        alert('Please install MetaMask to use this feature!');
    }
}

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Track if the model has been loaded
let metamaskWolfLoaded = false;
let metamaskWolfModel = null;

// Function to load and place the Metamask wolf model
export function spawnMetamaskWolf(scene) {
  // If model already exists, just toggle visibility instead of reloading
  if (metamaskWolfLoaded && metamaskWolfModel) {
    metamaskWolfModel.visible = !metamaskWolfModel.visible;
    console.log(`Metamask wolf visibility set to: ${metamaskWolfModel.visible}`);
    return;
  }
  
  console.log("Loading Metamask wolf model...");
  const gltfLoader = new GLTFLoader();
  
  // Load the Metamask wolf model with the correct path
  gltfLoader.load(
    "/models/metamask_wolf/metamask_wolf.glb", // Updated path to locate in models folder
    (gltf) => {
      // Success callback
      console.log("Metamask wolf model loaded successfully");
      
      // Get the model
      const model = gltf.scene;
      
      // Scale the model appropriately
      model.scale.set(1, 1, 1); // Adjust scale as needed
      
      // Set the position to the exact coordinates provided
      model.position.set(
        3.4178752221039543,
        8.495322759906675e-16, // Essentially zero
        -3.8259532415907795
      );
      
      // Make sure model casts and receives shadows
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          
          // Instead of replacing materials, just modify existing ones
          if (node.material) {
            // Preserve original material properties but make it less shiny
            node.material.roughness = 0.9;
            node.material.metalness = 0.0;
            
            // If the model has no color (is black), add a default color
            if (!node.material.color || node.material.color.getHex() === 0x000000) {
              node.material.color = new THREE.Color(0x555555); // Gray fallback color
            }
            
            // Ensure materials update properly
            node.material.needsUpdate = true;
          }
        }
      });
      
      // Add the model to the scene
      scene.add(model);
      
      // Set tracking variables
      metamaskWolfLoaded = true;
      metamaskWolfModel = model;
      
      console.log("Metamask wolf added to scene");
    },
    (xhr) => {
      // Progress callback
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    (error) => {
      // Error callback
      console.error("Error loading Metamask wolf model:", error);
    }
  );
}

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
      model.scale.set(1, 1, 1); // Adjust scale as needed
      
      // Set the position to the exact coordinates provided
      model.position.set(
        -3.075565661559263,
        -9.049334183721148e-16, // Essentially zero
        4.075457805775765
      );
      
      // Rotate the unicorn anti-clockwise (counter-clockwise)
      // Rotation is in radians, Math.PI/2 is 90 degrees
      model.rotation.y = Math.PI / 2; // 90 degrees counter-clockwise
      
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