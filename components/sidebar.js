import { initMetaWallet } from './metawallet.js';

// Create and initialize the sidebar
function initSidebar(callbacks = {}) {
    // Create sidebar container
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    
    // Create sidebar title
    const title = document.createElement('h2');
    title.textContent = 'Controls';
    sidebar.appendChild(title);
    
    // Create spawn metamask button with icon
    const spawnButton = document.createElement('button');
    spawnButton.id = 'metamask-button';
    
    // Create and add the Metamask icon
    const metamaskIcon = document.createElement('img');
    metamaskIcon.src = '/icon/metamask.png'; // Path to the original metamask icon
    metamaskIcon.alt = 'Metamask';
    metamaskIcon.style.width = '24px';
    metamaskIcon.style.height = '24px';
    metamaskIcon.style.marginRight = '8px';
    
    // Add icon and text to button
    spawnButton.appendChild(metamaskIcon);
    spawnButton.appendChild(document.createTextNode('Summon Wolf'));
    
    // Style the button
    spawnButton.style.backgroundColor = '#FF9966'; // Orange color
    spawnButton.style.display = 'flex';
    spawnButton.style.alignItems = 'center';
    spawnButton.style.justifyContent = 'center';
    
    spawnButton.addEventListener('click', () => {
        console.log('Summon Wolf button clicked');
        // Call the spawnWolf callback if it exists
        if (callbacks.spawnWolf) {
            callbacks.spawnWolf();
        }
    });
    sidebar.appendChild(spawnButton);
    
    // Create buttons
    const buttonLabels = ['Light', 'Color', 'Camera', 'Reset', 'Help'];
    const buttonColors = ['#ff7eb9', '#7afcff', '#feff9c', '#fff7ad', '#b0c2f2'];
    
    buttonLabels.forEach((label, index) => {
        const button = document.createElement('button');
        button.textContent = label;
        button.style.backgroundColor = buttonColors[index];
        button.addEventListener('click', () => {
            console.log(`${label} button clicked`);
            // Add functionality for each button here
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
            width: 180px;
            background-color: rgba(255, 255, 255, 0.8);
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            font-family: 'Nunito', sans-serif;
        }
        
        #sidebar h2 {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 1.2rem;
            color: #333;
            text-align: center;
            font-family: 'Quicksand', sans-serif;
            font-weight: 700;
        }
        
        #sidebar button {
            display: block;
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Nunito', sans-serif;
            font-weight: 700;
            color: #333;
            transition: transform 0.2s, box-shadow 0.2s;
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
