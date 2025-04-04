import { initMetaWallet } from './metawallet.js';
import { spawnMetamaskWolf } from './metawallet';
import { spawn1inchUnicorn } from './oneinch';

// Create and initialize the sidebar with three buttons
function initSidebar(callbacks = {}, scene) {
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
            
            // Only spawn the Metamask wolf for the Metamask button
            if (data.id === 'metamask-button' && scene) {
                spawnMetamaskWolf(scene);
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

    return sidebar;
}

// Export the initialization function
export { initSidebar };
