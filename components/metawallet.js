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
        icon.style.backgroundColor = '#1a1e2e';
        icon.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
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
        
        // Create glow effect
        const glow = document.createElement('div');
        glow.style.position = 'absolute';
        glow.style.width = '100%';
        glow.style.height = '100%';
        glow.style.borderRadius = '50%';
        glow.style.backgroundColor = 'rgba(108, 99, 255, 0.2)';
        glow.style.filter = 'blur(8px)';
        glow.style.zIndex = '-1';
        icon.appendChild(glow);
        
        // Mouse down event - start dragging
        icon.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - icon.getBoundingClientRect().left;
            offsetY = e.clientY - icon.getBoundingClientRect().top;
            icon.style.cursor = 'grabbing';
            
            // Prevent default behavior
            e.preventDefault();
        });
        
        // Mouse move event - drag the icon
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            // Update icon position
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            icon.style.left = `${x}px`;
            icon.style.top = `${y}px`;
        });
        
        // Mouse up event - stop dragging and create wallet
        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            icon.style.cursor = 'grab';
            
            // Create wallet box at current position
            createWalletBox(`${icon.style.left}`, `${icon.style.top}`);
            
            // Remove the draggable icon
            document.body.removeChild(icon);
        });
        
        // Append the icon to the body
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
        walletBox.style.backgroundColor = '#1a1e2e';
        walletBox.style.borderRadius = '12px';
        walletBox.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.25)';
        walletBox.style.zIndex = '1000';
        walletBox.style.overflow = 'hidden';
        walletBox.style.display = 'flex';
        walletBox.style.flexDirection = 'column';
        walletBox.style.fontFamily = 'Quicksand, sans-serif';
        walletBox.style.border = '1px solid #2c3050';
        
        // Create the header with close button
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.padding = '15px';
        header.style.backgroundColor = '#151b30';
        header.style.color = '#e0e0ff';
        header.style.borderBottom = '1px solid #2c3050';
        
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
        headerTitle.style.fontSize = '16px';
        headerTitle.style.fontWeight = '600';
        headerTitle.style.color = '#e0e0ff';
        
        headerLeft.appendChild(headerIcon);
        headerLeft.appendChild(headerTitle);
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.color = '#8f96b3';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.width = '32px';
        closeButton.style.height = '32px';
        closeButton.style.display = 'flex';
        closeButton.style.alignItems = 'center';
        closeButton.style.justifyContent = 'center';
        closeButton.style.transition = 'all 0.2s';
        closeButton.style.borderRadius = '50%';
        
        // Add hover effect to close button
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.color = '#e0e0ff';
            closeButton.style.backgroundColor = 'rgba(108, 99, 255, 0.1)';
            closeButton.style.transform = 'scale(1.1)';
        });
        
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.color = '#8f96b3';
            closeButton.style.backgroundColor = 'transparent';
            closeButton.style.transform = 'scale(1)';
        });
        
        // Handle close button click
        closeButton.addEventListener('click', () => {
            document.body.removeChild(walletBox);
        });
        
        // Assemble header
        header.appendChild(headerLeft);
        header.appendChild(closeButton);
        
        // Create main content area
        const content = document.createElement('div');
        content.style.flex = '1';
        content.style.padding = '15px';
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.overflowY = 'auto';
        content.style.backgroundColor = '#1a1e2e';
        content.style.color = '#d0d6ff';
        
        // Add account info section
        const accountSection = document.createElement('div');
        accountSection.style.marginBottom = '20px';
        accountSection.style.padding = '15px';
        accountSection.style.backgroundColor = '#232845';
        accountSection.style.borderRadius = '10px';
        accountSection.style.border = '1px solid #2c3050';
        
        const accountTitle = document.createElement('h4');
        accountTitle.textContent = 'Account';
        accountTitle.style.margin = '0 0 10px 0';
        accountTitle.style.color = '#a0a8cc';
        accountTitle.style.fontSize = '14px';
        accountTitle.style.fontWeight = '600';
        
        const accountIdContainer = document.createElement('div');
        accountIdContainer.style.display = 'flex';
        accountIdContainer.style.alignItems = 'center';
        accountIdContainer.style.justifyContent = 'space-between';
        
        const accountId = document.createElement('div');
        accountId.textContent = '0x1234...5678';
        accountId.style.fontSize = '14px';
        accountId.style.fontWeight = '500';
        accountId.style.color = '#d0d6ff';
        
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy';
        copyButton.style.background = 'none';
        copyButton.style.border = '1px solid #3d4568';
        copyButton.style.borderRadius = '6px';
        copyButton.style.padding = '4px 8px';
        copyButton.style.fontSize = '12px';
        copyButton.style.color = '#a0a8cc';
        copyButton.style.cursor = 'pointer';
        copyButton.style.transition = 'all 0.2s';
        
        // Add hover effect to copy button
        copyButton.addEventListener('mouseenter', () => {
            copyButton.style.backgroundColor = 'rgba(108, 99, 255, 0.1)';
            copyButton.style.borderColor = '#6c63ff';
            copyButton.style.color = '#e0e0ff';
        });
        
        copyButton.addEventListener('mouseleave', () => {
            copyButton.style.backgroundColor = 'transparent';
            copyButton.style.borderColor = '#3d4568';
            copyButton.style.color = '#a0a8cc';
        });
        
        accountIdContainer.appendChild(accountId);
        accountIdContainer.appendChild(copyButton);
        
        accountSection.appendChild(accountTitle);
        accountSection.appendChild(accountIdContainer);
        
        // Add balance section
        const balanceSection = document.createElement('div');
        balanceSection.style.marginBottom = '20px';
        balanceSection.style.padding = '15px';
        balanceSection.style.backgroundColor = '#232845';
        balanceSection.style.borderRadius = '10px';
        balanceSection.style.border = '1px solid #2c3050';
        balanceSection.style.textAlign = 'center';
        
        const balanceAmount = document.createElement('div');
        balanceAmount.textContent = '1.45 ETH';
        balanceAmount.style.fontSize = '24px';
        balanceAmount.style.fontWeight = '700';
        balanceAmount.style.color = '#e0e0ff';
        balanceAmount.style.margin = '5px 0';
        
        const balanceFiat = document.createElement('div');
        balanceFiat.textContent = '$2,456.78 USD';
        balanceFiat.style.fontSize = '14px';
        balanceFiat.style.color = '#a0a8cc';
        
        balanceSection.appendChild(balanceAmount);
        balanceSection.appendChild(balanceFiat);
        
        // Add action buttons
        const actionButtons = document.createElement('div');
        actionButtons.style.display = 'flex';
        actionButtons.style.justifyContent = 'space-between';
        actionButtons.style.gap = '10px';
        actionButtons.style.marginBottom = '20px';
        
        // Create button function
        const createActionButton = (text, icon) => {
            const button = document.createElement('button');
            button.style.flex = '1';
            button.style.display = 'flex';
            button.style.flexDirection = 'column';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            button.style.gap = '5px';
            button.style.padding = '12px';
            button.style.backgroundColor = '#2c3050';
            button.style.border = '1px solid #3d4568';
            button.style.borderRadius = '10px';
            button.style.cursor = 'pointer';
            button.style.transition = 'all 0.2s';
            
            const buttonIcon = document.createElement('div');
            buttonIcon.textContent = icon;
            buttonIcon.style.fontSize = '20px';
            buttonIcon.style.color = '#6c63ff';
            
            const buttonText = document.createElement('div');
            buttonText.textContent = text;
            buttonText.style.fontSize = '12px';
            buttonText.style.color = '#d0d6ff';
            
            button.appendChild(buttonIcon);
            button.appendChild(buttonText);
            
            // Add hover effect
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = '#3a3f68';
                button.style.borderColor = '#6c63ff';
                button.style.transform = 'translateY(-2px)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = '#2c3050';
                button.style.borderColor = '#3d4568';
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
        
        // Assemble content
        content.appendChild(accountSection);
        content.appendChild(balanceSection);
        content.appendChild(actionButtons);
        
        // Add token list heading
        const tokensHeading = document.createElement('div');
        tokensHeading.style.display = 'flex';
        tokensHeading.style.justifyContent = 'space-between';
        tokensHeading.style.alignItems = 'center';
        tokensHeading.style.marginBottom = '10px';
        
        const tokensTitle = document.createElement('h4');
        tokensTitle.textContent = 'Tokens';
        tokensTitle.style.margin = '0';
        tokensTitle.style.fontSize = '14px';
        tokensTitle.style.fontWeight = '600';
        tokensTitle.style.color = '#a0a8cc';
        
        const addTokenButton = document.createElement('button');
        addTokenButton.textContent = '+';
        addTokenButton.style.width = '24px';
        addTokenButton.style.height = '24px';
        addTokenButton.style.borderRadius = '50%';
        addTokenButton.style.border = '1px solid #3d4568';
        addTokenButton.style.backgroundColor = 'transparent';
        addTokenButton.style.color = '#a0a8cc';
        addTokenButton.style.fontSize = '14px';
        addTokenButton.style.display = 'flex';
        addTokenButton.style.alignItems = 'center';
        addTokenButton.style.justifyContent = 'center';
        addTokenButton.style.cursor = 'pointer';
        addTokenButton.style.transition = 'all 0.2s';
        
        // Add hover effect to add token button
        addTokenButton.addEventListener('mouseenter', () => {
            addTokenButton.style.backgroundColor = 'rgba(108, 99, 255, 0.1)';
            addTokenButton.style.borderColor = '#6c63ff';
            addTokenButton.style.color = '#e0e0ff';
        });
        
        addTokenButton.addEventListener('mouseleave', () => {
            addTokenButton.style.backgroundColor = 'transparent';
            addTokenButton.style.borderColor = '#3d4568';
            addTokenButton.style.color = '#a0a8cc';
        });
        
        tokensHeading.appendChild(tokensTitle);
        tokensHeading.appendChild(addTokenButton);
        
        content.appendChild(tokensHeading);
        
        // Add connect button at the bottom
        const connectButton = document.createElement('button');
        connectButton.textContent = 'Connect Wallet';
        connectButton.style.marginTop = '15px';
        connectButton.style.padding = '12px';
        connectButton.style.backgroundColor = '#6c63ff';
        connectButton.style.border = 'none';
        connectButton.style.borderRadius = '10px';
        connectButton.style.color = 'white';
        connectButton.style.fontSize = '14px';
        connectButton.style.fontWeight = '600';
        connectButton.style.cursor = 'pointer';
        connectButton.style.transition = 'all 0.2s';
        connectButton.style.boxShadow = '0 4px 10px rgba(108, 99, 255, 0.3)';
        
        // Add hover effect to connect button
        connectButton.addEventListener('mouseenter', () => {
            connectButton.style.backgroundColor = '#5b52eb';
            connectButton.style.transform = 'translateY(-2px)';
            connectButton.style.boxShadow = '0 6px 15px rgba(108, 99, 255, 0.4)';
        });
        
        connectButton.addEventListener('mouseleave', () => {
            connectButton.style.backgroundColor = '#6c63ff';
            connectButton.style.transform = 'translateY(0)';
            connectButton.style.boxShadow = '0 4px 10px rgba(108, 99, 255, 0.3)';
        });
        
        // Handle connect button click
        connectButton.addEventListener('click', () => {
            connectToMetaMask();
        });
        
        content.appendChild(connectButton);
        
        // Assemble the wallet box
        walletBox.appendChild(header);
        walletBox.appendChild(content);
        
        // Append to body
        document.body.appendChild(walletBox);
        
        // Make the wallet box draggable
        makeElementDraggable(walletBox, header);
    };
    
    // Make an element draggable by dragging its handle
    const makeElementDraggable = (element, handle) => {
        let isDragging = false;
        let offsetX, offsetY;
        
        handle.style.cursor = 'grab';
        
        // Mouse down event on the handle
        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            handle.style.cursor = 'grabbing';
            
            // Prevent default behavior
            e.preventDefault();
        });
        
        // Mouse move event to move the element
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            // Update element position
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
        });
        
        // Mouse up event to stop dragging
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            
            isDragging = false;
            handle.style.cursor = 'grab';
        });
    };
    
    // Create the draggable icon
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
let metamaskFoxLoaded = false;
let metamaskFoxModel = null;

// Function to load and place the Metamask fox model
export function spawnMetamaskFox(scene) {
  // Check if scene is valid
  if (!scene) {
    console.error("No scene provided to spawnMetamaskFox function");
    return;
  }
  
  console.log("spawnMetamaskFox called with scene:", scene);
  
  // If model already exists, just toggle visibility instead of reloading
  if (metamaskFoxLoaded && metamaskFoxModel) {
    metamaskFoxModel.visible = !metamaskFoxModel.visible;
    console.log(`Metamask fox visibility set to: ${metamaskFoxModel.visible}`);
    return;
  }
  
  console.log("Loading Metamask fox model...");
  const gltfLoader = new GLTFLoader();
  
  // Log the full path being used
  const modelPath = "/models/metamask_fox/metamask_fox.glb";
  console.log("Loading model from path:", modelPath);
  
  // Load the Metamask fox model with the correct path
  gltfLoader.load(
    modelPath,
    (gltf) => {
      // Success callback
      console.log("Metamask fox model loaded successfully", gltf);
      
      // Get the model
      const model = gltf.scene;
      
      // Scale the model appropriately
      model.scale.set(0.9, 0.9, 0.9); // Adjust scale as needed
      
      // Set the position to the exact coordinates provided
      model.position.set(
        0.21083844329090778,
        5.365217592205796e-16, // Essentially zero
        -2.416279194901965
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
      metamaskFoxLoaded = true;
      metamaskFoxModel = model;
      
      // Set userData to make the model NON-clickable
      model.userData = { 
        clickable: false,
        type: 'metamask'
      };
      
      console.log("Metamask fox added to scene (not clickable)");
    },
    (xhr) => {
      // Progress callback
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    (error) => {
      // Error callback
      console.error("Error loading Metamask fox model:", error);
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
        0.9843086503678045,
        -6.077401855916396e-16, // Essentially zero
        2.7370184733685843
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