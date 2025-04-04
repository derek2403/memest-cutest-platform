// Create and initialize the sidebar
function initSidebar(callbacks = {}) {
  // Create sidebar container
  const sidebar = document.createElement("div");
  sidebar.id = "sidebar";

  // Create sidebar title
  const title = document.createElement("h2");
  title.textContent = "Controls";
  sidebar.appendChild(title);

  // Create spawn metamask button
  const spawnButton = document.createElement("button");
  spawnButton.textContent = "Summon Metamask";
  spawnButton.style.backgroundColor = "#FF9966"; // Orange color
  spawnButton.addEventListener("click", () => {
    console.log("Summon Metamask button clicked");
    // Call the spawnWolf callback if it exists
    if (callbacks.spawnWolf) {
      callbacks.spawnWolf();
    }
  });
  sidebar.appendChild(spawnButton);

  // Create buttons
  const buttonLabels = ["Light", "Color", "Camera", "Reset", "Help"];
  const buttonColors = ["#ff7eb9", "#7afcff", "#feff9c", "#fff7ad", "#b0c2f2"];

  buttonLabels.forEach((label, index) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.style.backgroundColor = buttonColors[index];
    button.addEventListener("click", () => {
      console.log(`${label} button clicked`);
      // Add functionality for each button here
    });
    sidebar.appendChild(button);
  });

  // Append sidebar to the document body
  document.body.appendChild(sidebar);

  // Add Google Font
  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&family=Quicksand:wght@400;700&display=swap";
  document.head.appendChild(fontLink);

  // Add CSS directly to ensure it's applied
  const style = document.createElement("style");
  style.textContent = `
        #sidebar {
            position: fixed;
            right: 20px;
            top: 20px;
            width: 180px;
            height: calc(100vh - 40px);
            background-color: rgba(255, 255, 255, 0.9);
            color: #5a5a5a;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
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
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            border: 2px solid white;
        }
        
        #sidebar button:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
        }
        
        #sidebar button:active {
            transform: translateY(0) scale(0.98);
            box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
        }
    `;
  document.head.appendChild(style);
}

// Export the initialization function
export { initSidebar };
