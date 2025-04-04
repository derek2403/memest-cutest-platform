import { initMetaWallet } from './metawallet.js';

// Create and initialize the sidebar with only the Summon AI Agent button
function initSidebar(callbacks = {}) {
    // Create sidebar container
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    
    // Create spawn AI Agent button
    const spawnButton = document.createElement('button');
    spawnButton.id = 'ai-agent-button';
    spawnButton.textContent = 'Summon AI Agent';
    
    // Style the button
    spawnButton.style.backgroundColor = '#FF9966'; // Orange color
    
    spawnButton.addEventListener('click', () => {
        console.log('Summon AI Agent button clicked');
        // Call the spawnAIAgent callback if it exists
        if (callbacks.spawnAIAgent) {
            callbacks.spawnAIAgent();
        }
    });
    sidebar.appendChild(spawnButton);
    
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
            height: auto; /* Only as tall as needed */
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
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Nunito', sans-serif;
            font-weight: 700;
            color: #333;
            transition: transform 0.2s, box-shadow 0.2s;
            text-align: center;
            white-space: nowrap;
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
