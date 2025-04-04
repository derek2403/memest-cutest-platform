import { initMetaWallet } from './metawallet.js';

// Create and initialize the sidebar
function initSidebar() {
    // Create sidebar container
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    
    // Create sidebar title
    const title = document.createElement('h2');
    title.textContent = 'Controls';
    sidebar.appendChild(title);
    
    // Create Metamask button with icon
    const metamaskButton = document.createElement('button');
    metamaskButton.id = 'metamask-button';
    
    // Create and add the Metamask icon
    const metamaskIcon = document.createElement('img');
    metamaskIcon.src = '/icon/metamask.png'; // Path to the metamask icon
    metamaskIcon.alt = 'Metamask';
    metamaskIcon.style.width = '24px';
    metamaskIcon.style.height = '24px';
    metamaskIcon.style.marginRight = '8px';
    
    // Add icon and text to button
    metamaskButton.appendChild(metamaskIcon);
    metamaskButton.appendChild(document.createTextNode('Metamask'));
    
    // Style the button
    metamaskButton.style.backgroundColor = '#ffb6c1';
    metamaskButton.style.display = 'flex';
    metamaskButton.style.alignItems = 'center';
    metamaskButton.style.justifyContent = 'center';
    
    // Add event listener to initialize the draggable MetaMask wallet
    metamaskButton.addEventListener('click', () => {
        console.log('Metamask button clicked');
        initMetaWallet();
    });
    
    sidebar.appendChild(metamaskButton);
    
    // Create 1inch button with icon
    const oneInchButton = document.createElement('button');
    oneInchButton.id = 'oneinch-button';
    
    // Create and add the 1inch icon
    const oneInchIcon = document.createElement('img');
    oneInchIcon.src = '/icon/1inch.png'; // Path to the 1inch icon
    oneInchIcon.alt = '1inch';
    oneInchIcon.style.width = '24px';
    oneInchIcon.style.height = '24px';
    oneInchIcon.style.marginRight = '8px';
    
    // Add icon and text to button
    oneInchButton.appendChild(oneInchIcon);
    oneInchButton.appendChild(document.createTextNode('1inch'));
    
    // Style the button
    oneInchButton.style.backgroundColor = '#e8f4f8'; // Light blue background
    oneInchButton.style.display = 'flex';
    oneInchButton.style.alignItems = 'center';
    oneInchButton.style.justifyContent = 'center';
    
    // Add event listener
    oneInchButton.addEventListener('click', () => {
        console.log('1inch button clicked');
        // Add 1inch functionality here
    });
    
    sidebar.appendChild(oneInchButton);
    
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
            right: 20px;
            top: 20px;
            width: 180px;
            height: auto;
            background-color: rgba(255, 255, 255, 0.9);
            color: #5a5a5a;
            padding: 20px;
            box-shadow: none;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 15px;
            border-radius: 20px;
            font-family: 'Quicksand', sans-serif;
            backdrop-filter: blur(5px);
            border: 2px solid #f0f0f0;
        }
        
        #sidebar h2 {
            margin-top: 0;
            text-align: center;
            border-bottom: 2px dotted #ffb6c1;
            padding-bottom: 10px;
            font-family: 'Nunito', sans-serif;
            font-weight: 700;
            color: #ff6b9d;
        }
        
        #sidebar button {
            padding: 12px;
            border: none;
            border-radius: 15px;
            color: #5a5a5a;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            font-family: 'Quicksand', sans-serif;
            font-size: 14px;
            box-shadow: none;
            border: 2px solid white;
        }
        
        #sidebar button:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: none;
        }
        
        #sidebar button:active {
            transform: translateY(0) scale(0.98);
            box-shadow: none;
        }
        
        #metamask-button img {
            vertical-align: middle;
        }
    `;
    document.head.appendChild(style);
}

// Export the initialization function
export { initSidebar }; 