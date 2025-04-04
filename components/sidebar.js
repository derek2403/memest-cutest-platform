import { initMetaWallet } from './metawallet.js';

// Create and initialize the sidebar with three buttons
export function initSidebar(callbacks = {}) {
    // Create sidebar container
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    
    // Create three buttons: Metamask, Gmail, 1inch
    const buttonData = [
        { id: 'metamask-button', text: 'Metamask', color: '#F6851B' },
        { id: 'gmail-button', text: 'Gmail', color: '#EA4335' },
        { id: 'oneinch-button', text: '1inch', color: '#1B314F' }
    ];
    
    buttonData.forEach(data => {
        const button = document.createElement('button');
        button.id = data.id;
        button.textContent = data.text;
        button.style.backgroundColor = data.color;
        button.style.color = (data.id === 'oneinch-button') ? '#FFFFFF' : '#333333'; // White text for dark background
        
        button.addEventListener('click', () => {
            console.log(`${data.text} button clicked`);
            // Call the appropriate callback if it exists
            if (callbacks[data.id]) {
                callbacks[data.id]();
            }
        });
        sidebar.appendChild(button);
    });
    
    // Append sidebar to the document body
    document.body.appendChild(sidebar);
    
    // Add Google Font
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700&display=swap';
    document.head.appendChild(fontLink);
    
    // Add CSS directly to ensure it's applied
    const style = document.createElement('style');
    style.textContent = `
        #sidebar {
            position: fixed;
            top: 20px;
            right: 20px;
            width: auto;
            height: auto;
            min-width: 120px;
            background-color: rgba(255, 255, 255, 0.9);
            border-radius: 15px;
            padding: 15px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            font-family: 'Baloo 2', cursive;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        #sidebar button {
            display: block;
            width: 100%;
            padding: 12px 15px;
            margin-bottom: 10px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-family: 'Baloo 2', cursive;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s;
            text-align: center;
            white-space: nowrap;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        #sidebar button:last-child {
            margin-bottom: 0;
        }
        
        #sidebar button:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 12px rgba(0, 0, 0, 0.15);
        }
        
        #sidebar button:active {
            transform: translateY(1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

    // Make buttons draggable
    const buttons = document.querySelectorAll('.sidebar-button');
    buttons.forEach(button => {
        button.setAttribute('draggable', 'true');
        
        button.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', button.id);
            console.log('Dragging button:', button.id);
        });
    });

    // Add click handler for metamask button
    const metamaskButton = document.getElementById('metamask-button');
    if (metamaskButton) {
        metamaskButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Metamask button clicked, creating draggable icon");
            
            // Remove any existing draggable icon
            const existingIcon = document.getElementById('draggable-metamask-icon');
            if (existingIcon) {
                existingIcon.parentNode.removeChild(existingIcon);
            }
            
            // Create a draggable icon
            const icon = document.createElement('img');
            icon.src = '/icon/metamask.png';
            icon.id = 'draggable-metamask-icon';
            icon.style.position = 'fixed'; // Use fixed instead of absolute
            icon.style.left = `${e.clientX - 25}px`; // Center icon on cursor
            icon.style.top = `${e.clientY - 25}px`;
            icon.style.width = '50px';
            icon.style.height = '50px';
            icon.style.cursor = 'grab';
            icon.style.zIndex = '2000';
            icon.style.pointerEvents = 'none'; // Allow mouse events to pass through initially
            icon.style.borderRadius = '10px';
            icon.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
            
            // Create glow effect
            const glow = document.createElement('div');
            glow.style.position = 'fixed';
            glow.style.left = `${e.clientX - 25}px`; // Match icon position
            glow.style.top = `${e.clientY - 25}px`;
            glow.style.width = '50px';
            glow.style.height = '50px';
            glow.style.zIndex = '1999';
            glow.style.background = 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)';
            glow.style.borderRadius = '10px';
            glow.style.pointerEvents = 'none';
            glow.id = 'draggable-metamask-glow';
            
            // Create glow animation
            const glowKeyframes = document.createElement('style');
            glowKeyframes.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.7; }
                    50% { transform: scale(1.2); opacity: 0.3; }
                    100% { transform: scale(1); opacity: 0.7; }
                }
                #draggable-metamask-glow {
                    animation: pulse 2s infinite;
                }
            `;
            document.head.appendChild(glowKeyframes);
            
            // Add the elements to the body
            document.body.appendChild(glow);
            document.body.appendChild(icon);
            
            // Update glow position with icon
            const moveGlow = (moveEvent) => {
                if (glow.parentNode) {
                    glow.style.left = `${moveEvent.clientX - 25}px`;
                    glow.style.top = `${moveEvent.clientY - 25}px`;
                }
            };
            document.addEventListener('mousemove', moveGlow);
            
            console.log("Icon created and added to body", icon);
            
            // After a short delay, make the icon interactive
            setTimeout(() => {
                if (icon.parentNode) {
                    icon.style.pointerEvents = 'auto';
                    icon.setAttribute('draggable', 'true');
                }
            }, 100);
            
            // Move the icon with the mouse until dropped
            const moveIcon = (moveEvent) => {
                if (icon.parentNode) {
                    icon.style.left = `${moveEvent.clientX - 25}px`;
                    icon.style.top = `${moveEvent.clientY - 25}px`;
                }
            };
            
            document.addEventListener('mousemove', moveIcon);
            
            // Handle drop or click elsewhere
            const handleDrop = () => {
                document.removeEventListener('mousemove', moveIcon);
                document.removeEventListener('mousemove', moveGlow);
                document.removeEventListener('mouseup', handleDrop);
                
                // If the icon is not dropped on a valid target after a delay, remove it
                setTimeout(() => {
                    const iconElement = document.getElementById('draggable-metamask-icon');
                    const glowElement = document.getElementById('draggable-metamask-glow');
                    if (iconElement && iconElement.parentNode) {
                        iconElement.parentNode.removeChild(iconElement);
                    }
                    if (glowElement && glowElement.parentNode) {
                        glowElement.parentNode.removeChild(glowElement);
                    }
                }, 100);
            };
            
            document.addEventListener('mouseup', handleDrop);
            
            // Call the original callback
            if (callbacks && callbacks['metamask-button']) {
                callbacks['metamask-button']();
            }
        });
    } else {
        console.error("Metamask button not found in the DOM");
    }

    return sidebar;
}
