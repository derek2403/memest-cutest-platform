import { initMetaWallet } from './metawallet.js';
import * as THREE from 'three';

// Create and initialize the sidebar with hierarchical structure
export function initSidebar(callbacks = {}, scene) {
    // Store the scene reference for use in callbacks
    if (!scene) {
        console.error("Scene object not provided to initSidebar");
    } else {
        console.log("Scene object received in initSidebar", scene);
    }
    
    // Create sidebar container
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    sidebar.classList.add('hidden'); // Add hidden class by default
    
    // Create main heading with aurora effect
    const mainHeading = document.createElement('h2');
    mainHeading.className = 'sidebar-heading main-heading';
    
    // Create the aurora text effect manually since we can't use React components directly
    mainHeading.innerHTML = `
        <span class="relative inline-block">
            <span style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;">PLUGINS</span>
            <span 
                class="animate-aurora"
                style="
                    display: inline-block;
                    position: relative;
                    background-image: linear-gradient(135deg, #FF0080, #FF0000, #FFA500, #FFFF00, #00FF00, #0000FF, #4B0082, #8B00FF, #FF0080, #FF0000);
                    background-size: 200% 100%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    color: transparent;
                "
                aria-hidden="true"
            >
                PLUGINS
            </span>
        </span>
    `;
    
    sidebar.appendChild(mainHeading);
    
    // Create wallet section
    const walletHeading = document.createElement('h3');
    walletHeading.textContent = 'WALLET';
    walletHeading.className = 'sidebar-heading sub-heading';
    sidebar.appendChild(walletHeading);
    
    // Create Metamask button
    const metamaskButton = document.createElement('button');
    metamaskButton.id = 'metamask-button';
    metamaskButton.className = 'sidebar-button wallet-button';
    metamaskButton.style.border = 'none';
    metamaskButton.style.backgroundColor = '#f8a846';
    
    // Create icon for Metamask
    const metamaskIcon = document.createElement('img');
    metamaskIcon.src = '/icon/metamask.png';
    metamaskIcon.alt = 'Metamask';
    metamaskIcon.className = 'button-icon';
    
    // Add icon and text to button
    metamaskButton.appendChild(metamaskIcon);
    const metamaskText = document.createElement('span');
    metamaskText.textContent = 'Metamask';
    metamaskText.className = 'button-text';
    metamaskButton.appendChild(metamaskText);
    
    // Create tick indicator for Metamask
    const metamaskTick = document.createElement('span');
    metamaskTick.className = 'plugin-tick';
    metamaskTick.innerHTML = '✓';
    metamaskTick.style.visibility = 'hidden'; // Hidden by default (using visibility instead of display)
    metamaskTick.style.opacity = '0';
    metamaskTick.dataset.plugin = 'metamask'; // Add plugin name reference
    metamaskButton.appendChild(metamaskTick);
    
    // Make Metamask button draggable
    makeDraggable(metamaskButton, 'metamask-button', callbacks, scene);
    
    sidebar.appendChild(metamaskButton);
    
    // Create other services section
    const servicesHeading = document.createElement('h3');
    servicesHeading.textContent = 'OTHER SERVICES';
    servicesHeading.className = 'sidebar-heading sub-heading';
    sidebar.appendChild(servicesHeading);
    
    // Create other service buttons
    const serviceButtons = [
        { id: 'polygon-button', text: 'Polygon', icon: '/icon/polygon.png', color: '#2e2370', plugin: 'polygon' },
        { id: 'celo-button', text: 'Celo', icon: '/icon/celo.png', color: '#2bae71', plugin: 'celo' },
        { id: 'oneinch-button', text: '1inch', icon: '/icon/1inch.png', color: '#1e4896', plugin: 'oneinch' },
        { id: 'spreadsheet-button', text: 'Spreadsheet', icon: '/icon/spreadsheet.png', color: '#0a6e4c', plugin: 'spreadsheet' },
        { id: 'gmail-button', text: 'Gmail', icon: '/icon/gmail.png', color: '#992525', plugin: 'gmail' }
    ];
    
    serviceButtons.forEach(data => {
        const button = document.createElement('button');
        button.id = data.id;
        button.className = 'sidebar-button service-button';
        button.style.backgroundColor = data.color;
        button.style.border = 'none';
        
        // Create icon
        const icon = document.createElement('img');
        icon.src = data.icon;
        icon.alt = data.text;
        icon.className = 'button-icon';
        
        // Add icon and text to button
        button.appendChild(icon);
        const buttonText = document.createElement('span');
        buttonText.textContent = data.text;
        buttonText.className = 'button-text';
        buttonText.style.color = '#FFFFFF';  // All buttons have white text for consistency
        button.appendChild(buttonText);
        
        // Create tick indicator
        const tick = document.createElement('span');
        tick.className = 'plugin-tick';
        tick.innerHTML = '✓';
        tick.style.visibility = 'hidden'; // Hidden by default (using visibility instead of display)
        tick.style.opacity = '0';
        tick.dataset.plugin = data.plugin; // Store plugin name for reference
        button.appendChild(tick);
        
        // Make the button draggable
        makeDraggable(button, data.id, callbacks, scene);
        
        sidebar.appendChild(button);
    });
    
    // Append sidebar to the document body
    document.body.appendChild(sidebar);
    
    // Add Google Fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';

    fontLink.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap';

    document.head.appendChild(fontLink);
    
    // Add CSS directly to ensure it's applied
    const style = document.createElement('style');
    style.textContent = `
        #sidebar {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 240px;
            background-color: #1a1f2e;
            border-radius: 12px;
            padding: 15px;
            box-shadow: none;
            z-index: 1000;
            font-family: 'Poppins', sans-serif;
            border: none;
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        
        #sidebar.hidden {
            transform: translateX(250px);
            opacity: 0;
            pointer-events: none;
        }
        
        /* Trigger area for showing the sidebar */
        #sidebar-trigger {
            position: fixed;
            top: 0;
            right: 0;
            width: 40px;
            height: 100%;
            z-index: 999;
        }
        
        .sidebar-heading {
            margin: 0;
            text-align: center;
            letter-spacing: 1px;
        }
        
        .main-heading {
            font-size: 20px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px dotted rgba(255, 255, 255, 0.4);
            font-weight: 600;
            color: #ff6d42;
            font-family: 'Poppins', sans-serif;
        }
        
        .sub-heading {
            font-size: 16px;
            margin-top: 15px;
            margin-bottom: 12px;
            color: #8b949e;
            font-weight: 500;
            font-family: 'Poppins', sans-serif;
        }
        
        .sidebar-button {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            width: 100%;
            padding: 10px 15px 10px 12px;
            margin-bottom: 10px;
            border: none !important;
            border-radius: 30px;
            cursor: pointer;
            font-family: 'Poppins', sans-serif;
            font-weight: 500;
            font-size: 14px;
            transition: all 0.2s ease;
            text-align: left;
            box-shadow: none !important;
            outline: none !important;
            position: relative;
            min-height: 44px;
            overflow: hidden;
        }
        
        .wallet-button {
            background-color: #23283e;
            color: #FFFFFF;
            box-shadow: none;
        }
        
        .service-button {
            color: #FFFFFF;
            box-shadow: none;
        }
        
        .button-icon {
            width: 24px;
            height: 24px;
            margin-right: 10px;
            object-fit: contain;
            flex-shrink: 0;
        }
        
        .button-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            padding-right: 25px; /* Reserve space for tick */
            color: #FFFFFF;
        }
        
        .plugin-tick {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #4CFF50;
            font-weight: 900;
            font-size: 22px;
            text-shadow: 0 0 5px rgba(76, 255, 80, 0.7);
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .sidebar-button:hover {
            filter: brightness(1.1);
        }
        
        .sidebar-button:active {
            transform: translateY(1px);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        #sidebar {
            animation: fadeIn 0.4s ease-out;
        }
    `;
    document.head.appendChild(style);
    
    // Create trigger area for showing the sidebar
    const sidebarTrigger = document.createElement('div');
    sidebarTrigger.id = 'sidebar-trigger';
    document.body.appendChild(sidebarTrigger);
    
    // Add event listeners for showing/hiding the sidebar
    sidebarTrigger.addEventListener('mouseenter', () => {
        sidebar.classList.remove('hidden');
    });
    
    document.addEventListener('mousemove', (e) => {
        // Show sidebar when mouse is near the right edge
        const windowWidth = window.innerWidth;
        if (e.clientX > windowWidth - 100) {
            sidebar.classList.remove('hidden');
        } else if (e.clientX < windowWidth - 300) {
            // Hide sidebar when mouse moves away from the right side
            sidebar.classList.add('hidden');
        }
    });
    
    // Hide sidebar when clicking elsewhere on the page
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !sidebarTrigger.contains(e.target)) {
            sidebar.classList.add('hidden');
        }
    });

    // Function to update ticks based on pluginsInRoom state
    const updatePluginTicks = () => {
        if (!window.pluginsInRoom) {
            console.warn("window.pluginsInRoom is not initialized yet");
            return;
        }
        
        // Update all plugins ticks using data-plugin attribute
        document.querySelectorAll('.plugin-tick[data-plugin]').forEach(tick => {
            const plugin = tick.dataset.plugin;
            if (window.pluginsInRoom.hasOwnProperty(plugin)) {
                const isVisible = window.pluginsInRoom[plugin];
                // Use visibility instead of display to maintain layout
                tick.style.visibility = isVisible ? 'visible' : 'hidden';
                tick.style.opacity = isVisible ? '1' : '0';
            }
        });
    };
    
    // Set up an interval to check for plugin changes
    const tickInterval = setInterval(updatePluginTicks, 1000);
    
    // Initial update
    setTimeout(updatePluginTicks, 1000);

    return sidebar;
}

// Function to make an element draggable
function makeDraggable(element, buttonId, callbacks, scene) {
    // Variables for drag functionality
    let isDragging = false;
    let clone = null;
    let startX, startY;
    let originalOpacity;
    let dropHighlight = null;
    let rafId = null;
    let lastKnownMousePosition = { x: 0, y: 0 };
    let isOverValidDropArea = false;
    
    // Use requestAnimationFrame for smooth clone movement
    const updateClonePosition = () => {
        if (!isDragging || !clone) return;
        
        // Update the position of the clone to follow the cursor smoothly using transforms
        // for better performance compared to top/left positioning
        const x = lastKnownMousePosition.x - element.offsetWidth / 2;
        const y = lastKnownMousePosition.y - element.offsetHeight / 2;
        clone.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${isOverValidDropArea ? 1.15 : 1.1})`;
        
        // Check if over valid drop area and provide visual feedback (throttled)
        const isWithinRoom = isWithinRoomBoundary(lastKnownMousePosition.x, lastKnownMousePosition.y);
        
        // Only update visuals if drop state has changed
        if (isWithinRoom !== isOverValidDropArea) {
            isOverValidDropArea = isWithinRoom;
            
            if (isWithinRoom) {
                // Style the clone to show it's over a valid drop area
                clone.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
                clone.style.border = '2px solid rgba(0, 255, 0, 0.7)';
                
                // Add visual highlight to the floor if not already there
                if (!dropHighlight && scene) {
                    createDropHighlight();
                }
            } else {
                // Reset clone style
                clone.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
                clone.style.border = 'none';
                
                // Remove the floor highlight if it exists
                removeDropHighlight();
            }
        }
        
        // Continue animation loop
        rafId = requestAnimationFrame(updateClonePosition);
    };
    
    // Create handlers for events
    const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        // Just update mouse position without DOM operations
        lastKnownMousePosition.x = e.clientX;
        lastKnownMousePosition.y = e.clientY;
    };
    
    // Create a visual highlight on the floor to indicate valid drop area
    const createDropHighlight = () => {
        if (dropHighlight || !scene) return;
        
        // Clear previously cached highlight to ensure we get the new size
        if (window.cachedDropHighlight) {
            scene.remove(window.cachedDropHighlight);
            window.cachedDropHighlight.geometry.dispose();
            window.cachedDropHighlight.material.dispose();
            window.cachedDropHighlight = null;
        }
        
        // Check if THREE is available
        if (typeof THREE === 'undefined') {
            console.error('THREE is not defined, cannot create highlight');
            return;
        }
        
        try {
            // Get canvas dimensions
            const canvasRect = document.querySelector('canvas').getBoundingClientRect();
            
            // Define rectangular boundaries exactly matching the room floor
            // Using the exact same values as in isWithinRoomBoundary
            const roomWidth = 6.8;  // Reduced from 7.2 to 6.8 (about 5% smaller)
            const roomDepth = 6.8;  // Reduced from 7.2 to 6.8 (about 5% smaller)
            
            // Create plane geometry for the rectangular highlight
            const highlightGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
            const highlightMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.25, // Slightly reduced opacity
                side: THREE.DoubleSide
            });
            
            dropHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
            
            // Position slightly above the floor to avoid z-fighting
            dropHighlight.position.set(0, 0.02, 0);
            dropHighlight.rotation.x = -Math.PI / 2; // Rotate to lie flat
            
            // Add to scene
            scene.add(dropHighlight);
            
            // Cache for reuse
            window.cachedDropHighlight = dropHighlight;
            
            console.log("Created rectangular drop highlight with dimensions:", roomWidth, "x", roomDepth);
        } catch (error) {
            console.error('Error creating highlight:', error);
        }
    };
    
    // Remove the floor highlight
    const removeDropHighlight = () => {
        if (dropHighlight && scene) {
            // Instead of removing and disposing, just hide it
            dropHighlight.visible = false;
            dropHighlight = null;
        }
    };
    
    const handleMouseUp = (e) => {
        if (!isDragging) return;
        
        // Cancel animation frame
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        
        // Reset the original button appearance
        element.style.opacity = originalOpacity;
        element.style.cursor = 'pointer';
        
        // Remove the clone element if it exists
        if (clone) {
            document.body.removeChild(clone);
            clone = null;
        }
        
        // Hide floor highlight instead of removing
        if (dropHighlight) {
            dropHighlight.visible = false;
            dropHighlight = null;
        }
        
        // Do a STRICT check if mouse is inside room boundary
        // Only execute callback if mouse is inside room boundary at the moment of release
        const isInsideRoom = isWithinRoomBoundary(e.clientX, e.clientY);
        
        if (isInsideRoom) {
            console.log(`${buttonId} dropped inside room boundary - spawning object`);
            
            // Execute the callback for the dropped button
            if (callbacks[buttonId]) {
                console.log(`Executing callback for ${buttonId}`);
                callbacks[buttonId]();
            } else {
                console.warn(`No callback found for ${buttonId}`);
            }
        } else {
            console.log(`${buttonId} dropped OUTSIDE room boundary - NO object spawned`);
            // No action if dropped outside the room - explicitly preventing spawn
        }
        
        // Reset dragging state
        isDragging = false;
        isOverValidDropArea = false;
        
        // Clean up event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Add HTML5 drag and drop capabilities for compatibility with the Shortcut component
    element.setAttribute('draggable', 'true');
    
    element.addEventListener('dragstart', (e) => {
        console.log(`Drag started for ${buttonId}`);
        // Set the data for the drag operation
        e.dataTransfer.setData('text/plain', buttonId);
        e.dataTransfer.effectAllowed = 'copy';
        
        // Create custom ghost image
        const ghost = document.createElement('div');
        ghost.textContent = element.querySelector('span').textContent;
        ghost.style.padding = '8px 12px';
        ghost.style.background = element.style.backgroundColor || '#333a52';
        ghost.style.borderRadius = '20px';
        ghost.style.color = '#fff';
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px';
        document.body.appendChild(ghost);
        
        e.dataTransfer.setDragImage(ghost, 0, 0);
        
        // Remove ghost after a short delay
        setTimeout(() => {
            document.body.removeChild(ghost);
        }, 0);
    });
    
    // Add drag start event for custom dragging
    element.addEventListener('mousedown', (e) => {
        // Prevent default action to avoid text selection
        e.preventDefault();
        
        // Store the starting position of the mouse
        startX = e.clientX;
        startY = e.clientY;
        lastKnownMousePosition.x = e.clientX;
        lastKnownMousePosition.y = e.clientY;
        
        // Set flag to indicate dragging has started
        isDragging = true;
        
        // Store original opacity
        originalOpacity = element.style.opacity || '1';
        
        // Create visual feedback for dragging
        element.style.opacity = '0.7';
        element.style.cursor = 'grabbing';
        
        // Create a clone of the button for drag visual - optimize by using a lighter clone
        clone = document.createElement('div');
        clone.className = 'drag-clone';
        clone.style.position = 'fixed';
        clone.style.zIndex = '10000';
        // Set initial position at 0,0 and use transform instead
        clone.style.left = '0';
        clone.style.top = '0';
        clone.style.width = `${element.offsetWidth}px`;
        clone.style.height = `${element.offsetHeight}px`;
        clone.style.borderRadius = '30px';
        clone.style.backgroundColor = element.style.backgroundColor || '#333a52';
        clone.style.pointerEvents = 'none'; // So it doesn't interfere with drop events
        clone.style.opacity = '0.8';
        clone.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
        clone.style.border = 'none'; // Initialize border property
        // Use transform for initial positioning
        const x = e.clientX - element.offsetWidth / 2;
        const y = e.clientY - element.offsetHeight / 2;
        clone.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.1)`;
        clone.style.willChange = 'transform'; // Hint for browser optimization
        
        // Add the icon for better visual
        const iconImg = document.createElement('img');
        iconImg.src = element.querySelector('img').src;
        iconImg.style.width = '24px';
        iconImg.style.height = '24px';
        iconImg.style.position = 'absolute';
        iconImg.style.left = '12px';
        iconImg.style.top = '50%';
        iconImg.style.transform = 'translateY(-50%)';
        clone.appendChild(iconImg);
        
        // Add the text
        const text = document.createElement('span');
        text.textContent = element.querySelector('span').textContent;
        text.style.color = '#FFFFFF';
        text.style.position = 'absolute';
        text.style.left = '46px';
        text.style.top = '50%';
        text.style.transform = 'translateY(-50%)';
        text.style.fontFamily = 'Poppins, sans-serif';
        text.style.fontWeight = '500';
        text.style.fontSize = '14px';
        clone.appendChild(text);
        
        document.body.appendChild(clone);
        
        // Add event listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        // Start animation frame for smooth movement
        rafId = requestAnimationFrame(updateClonePosition);
    });
    
    // Add click event separate from drag handling
    element.addEventListener('click', (e) => {
        // Only trigger click if it wasn't a drag
        if (Math.abs(e.clientX - startX) < 5 && Math.abs(e.clientY - startY) < 5) {
            console.log(`${buttonId} clicked directly`);
            if (callbacks[buttonId]) {
                console.log(`Executing callback for ${buttonId}`);
                callbacks[buttonId]();
            } else {
                console.warn(`No callback found for ${buttonId}`);
            }
        }
    });
}

// Function to check if coordinates are within the room boundary
function isWithinRoomBoundary(x, y) {
    try {
        // Get the canvas/renderer element dimensions
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            console.warn('Canvas element not found for room boundary check');
            return false;
        }
        
        // Get the bounding rectangle of the canvas
        const canvasRect = canvas.getBoundingClientRect();
        
        // Calculate the center of the canvas
        const centerX = canvasRect.left + (canvasRect.width / 2);
        const centerY = canvasRect.top + (canvasRect.height / 2);
        
        // Define rectangular boundaries exactly matching the room floor
        // These values are relative to the center of the canvas
        const roomWidth = canvasRect.width * 0.40;  // Reduced from 0.42 to 0.40 (about 5% smaller)
        const roomDepth = canvasRect.height * 0.40; // Reduced from 0.42 to 0.40 (about 5% smaller)
        
        // Calculate boundaries of the rectangle
        const minX = centerX - roomWidth / 2;
        const maxX = centerX + roomWidth / 2;
        const minY = centerY - roomDepth / 2;
        const maxY = centerY + roomDepth / 2;
        
        // Check if point is within the rectangular boundary
        const isWithinRoom = (
            x >= minX && 
            x <= maxX && 
            y >= minY && 
            y <= maxY
        );
        
        // Log the boundary check for debugging
        console.log(`Room boundary check: x=${x}, y=${y}, room=[${minX},${minY},${maxX},${maxY}], center=[${centerX},${centerY}], result=${isWithinRoom}`);
        
        return isWithinRoom;
    } catch (error) {
        console.error('Error checking room boundary:', error);
        // Default to false on error
        return false;
    }
}
