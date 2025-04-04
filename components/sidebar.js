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
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&family=Quicksand:wght@400;700&display=swap';
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
            background-color: rgba(255, 255, 255, 0.8);
            border-radius: 10px;
            padding: 12px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            font-family: 'Nunito', sans-serif;
        }
        
        #sidebar button {
            display: block;
            width: 100%;
            padding: 10px 15px;
            margin-bottom: 8px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Nunito', sans-serif;
            font-weight: 700;
            transition: transform 0.2s, box-shadow 0.2s;
            text-align: center;
            white-space: nowrap;
        }
        
        #sidebar button:last-child {
            margin-bottom: 0;
        }
        
        #sidebar button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        #sidebar button:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
            
            // Add the icon to the body
            document.body.appendChild(icon);
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
                document.removeEventListener('mouseup', handleDrop);
                
                // If the icon is not dropped on a valid target after a delay, remove it
                setTimeout(() => {
                    const iconElement = document.getElementById('draggable-metamask-icon');
                    if (iconElement && iconElement.parentNode) {
                        iconElement.parentNode.removeChild(iconElement);
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
