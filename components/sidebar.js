import { initMetaWallet } from './metawallet.js';

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
    
    // Create main heading
    const mainHeading = document.createElement('h2');
    mainHeading.textContent = 'PLUGINS';
    mainHeading.className = 'sidebar-heading main-heading';
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
    metamaskButton.style.backgroundColor = '#333a52';
    
    // Create icon for Metamask
    const metamaskIcon = document.createElement('img');
    metamaskIcon.src = '/icon/metamask.png';
    metamaskIcon.alt = 'Metamask';
    metamaskIcon.className = 'button-icon';
    
    // Add icon and text to button
    metamaskButton.appendChild(metamaskIcon);
    const metamaskText = document.createElement('span');
    metamaskText.textContent = 'Metamask';
    metamaskButton.appendChild(metamaskText);
    
    // Add click handler directly here for consistency
    metamaskButton.addEventListener('click', () => {
        console.log("Metamask button clicked directly");
        if (callbacks['metamask-button']) {
            console.log("Executing Metamask callback");
            callbacks['metamask-button']();
        } else {
            console.warn("No Metamask callback found");
        }
    });
    
    sidebar.appendChild(metamaskButton);
    
    // Create other services section
    const servicesHeading = document.createElement('h3');
    servicesHeading.textContent = 'OTHER SERVICES';
    servicesHeading.className = 'sidebar-heading sub-heading';
    sidebar.appendChild(servicesHeading);
    
    // Create other service buttons
    const serviceButtons = [
        { id: 'polygon-button', text: 'Polygon', icon: '/icon/polygon.png', color: '#35287a' },
        { id: 'celo-button', text: 'Celo', icon: '/icon/celo.png', color: '#0a6e4c' },
        { id: 'oneinch-button', text: '1inch', icon: '/icon/1inch.png', color: '#1e4896' },
        { id: 'spreadsheet-button', text: 'Spreadsheet', icon: '/icon/spreadsheet.png', color: '#0a6e4c' },
        { id: 'gmail-button', text: 'Gmail', icon: '/icon/gmail.png', color: '#992525' }
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
        buttonText.style.color = '#FFFFFF';
        button.appendChild(buttonText);
        
        // Add click event listener with more detailed logging
        button.addEventListener('click', () => {
            console.log(`${data.text} button clicked`);
            // Call the appropriate callback if it exists
            if (callbacks[data.id]) {
                console.log(`Executing callback for ${data.id}`);
                callbacks[data.id]();
            } else {
                console.warn(`No callback found for ${data.id}`);
            }
        });
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
            width: 220px;
            background-color: #1a1f2e;
            border-radius: 12px;
            padding: 15px;
            box-shadow: none;
            z-index: 1000;
            font-family: 'Poppins', sans-serif;
            border: none;
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
            width: 100%;
            padding: 10px 12px;
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

    return sidebar;
}
