import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import styles from '../styles/Shortcut.module.css';

export default function Shortcut({ onClose, onDrop }) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [activeButtons, setActiveButtons] = useState({});
  const popupRef = useRef(null);

  // Listen for active state changes from the sidebar
  useEffect(() => {
    const handleActiveStateChanged = (event) => {
      console.log("Active state changed event received:", event.detail);
      // Make sure we're getting the activeStates object correctly
      if (event.detail && event.detail.activeStates) {
        setActiveButtons(event.detail.activeStates);
      }
    };

    // Listen for both event types that might be dispatched from sidebar.js
    document.addEventListener('activeStateChanged', handleActiveStateChanged);
    document.addEventListener('sidebarActiveStatesChanged', handleActiveStateChanged);
    
    // Initial fetch of active states from sidebar if available
    if (window.sidebarAPI && typeof window.sidebarAPI.getAllActiveStates === 'function') {
      setActiveButtons(window.sidebarAPI.getAllActiveStates());
    }
    
    return () => {
      document.removeEventListener('activeStateChanged', handleActiveStateChanged);
      document.removeEventListener('sidebarActiveStatesChanged', handleActiveStateChanged);
    };
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    // Get the dragged button ID
    const buttonId = e.dataTransfer.getData('text/plain');
    
    // Call the onDrop callback with the button ID
    if (onDrop) {
      onDrop(buttonId);
    }
    
    // Remove the draggable icon if it exists
    const icon = document.getElementById('draggable-metamask-icon');
    if (icon && icon.parentNode) {
      icon.parentNode.removeChild(icon);
    }
    
    // Handle different assistants based on the dragged icon
    if (buttonId === 'metamask-button' || buttonId === 'metamask-icon') {
      renderAssistant('metamask');
      onClose();
    } else if (buttonId === 'gmail-button' || buttonId === 'gmail-icon') {
      renderAssistant('gmail');
      onClose();
    } else if (buttonId === '1inch-button' || buttonId === '1inch-icon' || buttonId === 'oneinch-button' || buttonId === 'oneinch-icon') {
      renderAssistant('1inch');
      onClose();
    } else if (buttonId === 'polygon-button' || buttonId === 'polygon-icon') {
      renderAssistant('polygon');
      onClose();
    } else if (buttonId === 'celo-button' || buttonId === 'celo-icon') {
      renderAssistant('celo');
      onClose();
    } else if (buttonId === 'spreadsheet-button' || buttonId === 'spreadsheet-icon') {
      renderAssistant('spreadsheet');
      onClose();
    } else {
      // Check if the dragged element was one of the icons in the shortcut component
      const dataTransfer = e.dataTransfer;
      if (dataTransfer.items && dataTransfer.items.length > 0) {
        // Check if an image was dragged
        for (let i = 0; i < dataTransfer.items.length; i++) {
          if (dataTransfer.items[i].kind === 'file' && 
              dataTransfer.items[i].type.indexOf('image') !== -1) {
            const file = dataTransfer.items[i].getAsFile();
            if (file.name.includes('metamask')) {
              renderAssistant('metamask');
              onClose();
              break;
            } else if (file.name.includes('gmail')) {
              renderAssistant('gmail');
              onClose();
              break;
            } else if (file.name.includes('1inch')) {
              renderAssistant('1inch');
              onClose();
              break;
            } else if (file.name.includes('polygon')) {
              renderAssistant('polygon');
              onClose();
              break;
            } else if (file.name.includes('celo')) {
              renderAssistant('celo');
              onClose();
              break;
            } else if (file.name.includes('spreadsheet')) {
              renderAssistant('spreadsheet');
              onClose();
              break;
            }
          }
        }
      }
    }
  };

  // Helper function to render the appropriate assistant
  const renderAssistant = (assistantType) => {
    import('./shortcutdetails').then(module => {
      const AssistantShortcut = module.default;
      // Create a container for the assistant shortcut if it doesn't exist
      let container = document.getElementById(`${assistantType}-shortcut-container`);
      if (!container) {
        container = document.createElement('div');
        container.id = `${assistantType}-shortcut-container`;
        document.body.appendChild(container);
      }
      
      // Render the assistant shortcut component with the appropriate type
      const root = ReactDOM.createRoot(container);
      root.render(
        <AssistantShortcut 
          assistantType={assistantType}
          onClose={() => {
            // Clean up when closed
            if (container && container.parentNode) {
              container.parentNode.removeChild(container);
            }
          }} 
        />
      );
    });
  };

  // Make the icons in the shortcut component draggable
  useEffect(() => {
    const icons = document.querySelectorAll(`.${styles.shortcutIcon}`);
    icons.forEach(icon => {
      icon.setAttribute('draggable', 'true');
      
      icon.addEventListener('dragstart', (e) => {
        // Set the data based on the icon's alt text
        const iconType = icon.alt.toLowerCase();
        e.dataTransfer.setData('text/plain', `${iconType}-icon`);
      });
    });
  }, [activeButtons]); // Re-run when active buttons change

  // Handle direct drop of the icon (without using drag events)
  useEffect(() => {
    const handleMouseUp = (e) => {
      if (!popupRef.current) return;
      
      // Check if the mouseup happened inside the popup
      const rect = popupRef.current.getBoundingClientRect();
      if (
        e.clientX >= rect.left && 
        e.clientX <= rect.right && 
        e.clientY >= rect.top && 
        e.clientY <= rect.bottom
      ) {
        // Check if we have a draggable icon
        const icon = document.getElementById('draggable-metamask-icon');
        if (icon) {
          // Trigger the onDrop with the metamask button ID
          if (onDrop) {
            onDrop('metamask-button');
          }
          
          // Remove the icon
          if (icon.parentNode) {
            icon.parentNode.removeChild(icon);
          }
          
          // Render the MetaMask assistant
          renderAssistant('metamask');
          onClose();
        }
      }
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onDrop]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        // Don't close if we're clicking on the draggable icon
        if (event.target.id === 'draggable-metamask-icon') return;
        
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle send button click
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    console.log("Message sent:", inputMessage);
    
    // Create a container for the workflow popup if it doesn't exist
    let container = document.getElementById('workflow-popup-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'workflow-popup-container';
      document.body.appendChild(container);
    }
    
    // Import and render the workflow popup component
    import('./WorkflowPopup').then(module => {
      const WorkflowPopup = module.default;
      
      // Render the workflow popup component
      const root = ReactDOM.createRoot(container);
      root.render(
        <WorkflowPopup 
          initialInput={inputMessage}
          onClose={() => {
            // Clean up when closed
            if (container && container.parentNode) {
              container.parentNode.removeChild(container);
            }
          }}
          readOnly={false}
        />
      );
    }).catch(err => {
      console.error("Error loading WorkflowPopup:", err);
    });
    
    // Clear the input field
    setInputMessage('');
    
    // Close the shortcut popup
    onClose();
  };

  // Update the anyActiveButtons check to ensure it's correctly identifying active buttons
  const anyActiveButtons = Object.values(activeButtons).some(isActive => isActive === true);

  // Add some debugging to help identify issues
  useEffect(() => {
    console.log("Active buttons updated:", activeButtons);
    console.log("Metamask active:", activeButtons['metamask-button']);
    console.log("Any active buttons:", anyActiveButtons);
  }, [activeButtons]);

  // Add debugging to help identify issues with active buttons
  useEffect(() => {
    console.log("Active buttons state updated in shortcut component:", activeButtons);
  }, [activeButtons]);

  // Helper function to get icon path based on button ID
  const getIconPath = (buttonId) => {
    let iconPath = '';
    if (buttonId === 'metamask-button') iconPath = '/icon/metamask.png';
    else if (buttonId === 'gmail-button') iconPath = '/icon/gmail.png';
    else if (buttonId === 'oneinch-button') iconPath = '/icon/1inch.png';
    else if (buttonId === 'polygon-button') iconPath = '/icon/polygon.png';
    else if (buttonId === 'celo-button') iconPath = '/icon/celo.png';
    else if (buttonId === 'spreadsheet-button') iconPath = '/icon/spreadsheet.png';
    
    console.log(`Getting icon path for ${buttonId}:`, iconPath);
    return iconPath;
  };

  // Helper function to get icon name based on button ID
  const getIconName = (buttonId) => {
    if (buttonId === 'metamask-button') return 'Metamask';
    if (buttonId === 'gmail-button') return 'Gmail';
    if (buttonId === 'oneinch-button') return '1inch';
    if (buttonId === 'polygon-button') return 'Polygon';
    if (buttonId === 'celo-button') return 'Celo';
    if (buttonId === 'spreadsheet-button') return 'Spreadsheet';
    return '';
  };

  console.log("Rendering shortcut with active buttons:", activeButtons);
  console.log("Any active buttons?", anyActiveButtons);

  useEffect(() => {
    console.log("Rendering shortcut with active buttons:", activeButtons);
    console.log("Any active buttons?", anyActiveButtons);
  }, [activeButtons, anyActiveButtons]);

  return (
    <div className={styles.overlay}>
      <div 
        ref={popupRef}
        className={`${styles.popup} ${isDraggingOver ? styles.dragOver : ''}`}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Create a workflow here</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          {/* Display active icons if any buttons are active */}
          {anyActiveButtons && (
            <div className={styles.iconContainer}>
              {/* Group icons into rows of 3 */}
              {(() => {
                const activeIcons = Object.entries(activeButtons)
                  .filter(([_, isActive]) => isActive)
                  .map(([buttonId, _]) => {
                    const iconPath = getIconPath(buttonId);
                    const iconName = getIconName(buttonId);
                    
                    if (iconPath && iconName) {
                      return { buttonId, iconPath, iconName };
                    }
                    return null;
                  })
                  .filter(icon => icon !== null);
                
                // Split icons into rows of 3
                const rows = [];
                for (let i = 0; i < activeIcons.length; i += 3) {
                  rows.push(activeIcons.slice(i, i + 3));
                }
                
                return rows.map((row, rowIndex) => (
                  <div key={`row-${rowIndex}`} className={styles.iconRow}>
                    {row.map(icon => (
                      <div key={icon.buttonId} className={styles.logoContainer}>
                        <img 
                          src={icon.iconPath} 
                          alt={icon.iconName} 
                          className={styles.shortcutIcon} 
                          draggable="true"
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', icon.buttonId);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          )}
          
          {/* Drop zone for dragging - only show instruction when no active buttons */}
          <div 
            className={`${styles.dropZoneBox} ${isDraggingOver ? styles.dropZoneActive : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={styles.mainInstructions}>
              {isDraggingOver ? (
                <p>Drop to create shortcut</p>
              ) : (
                !anyActiveButtons ? (
                  <p>Activate your items in sidebar!</p>
                ) : (
                  <p>Drag icons to create workflows</p>
                )
              )}
            </div>
          </div>
          
          <div className={styles.alternativeMethod}>
            <p>Or use AI agents method</p>
            <button 
              className={styles.aiMethodButton}
              onClick={() => {
                // Create a container for the workflow popup
                let container = document.getElementById('workflow-popup-container');
                if (!container) {
                  container = document.createElement('div');
                  container.id = 'workflow-popup-container';
                  document.body.appendChild(container);
                }
                
                // Import and render the workflow popup
                import('./WorkflowPopup').then(module => {
                  const WorkflowPopup = module.default;
                  
                  // Render the workflow popup component
                  const root = ReactDOM.createRoot(container);
                  root.render(
                    <WorkflowPopup 
                      initialInput=""
                      onClose={() => {
                        // Clean up when closed
                        if (container && container.parentNode) {
                          container.parentNode.removeChild(container);
                        }
                      }}
                      readOnly={false}
                    />
                  );
                }).catch(err => {
                  console.error("Error loading WorkflowPopup:", err);
                });
                
                // Close the shortcut popup
                onClose();
              }}
            >
              Create AI Workflow
            </button>
          </div>
        </div>

        {/* Add inline styles to override the module CSS */}
        <style jsx global>{`
          .${styles.overlay} {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          
          .${styles.popup} {
            width: 500px !important;
            max-width: 95vw !important;
            min-height: 50px !important;
            padding: 20px 30px 30px 30px !important;
            display: flex !important;
            flex-direction: column !important;
            background-color: white !important;
            border-radius: 20px !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
          }
          
          .${styles.header} {
            margin-bottom: 15px !important;
            background-color: #f0f3f9 !important;
            border-radius: 12px !important;
            padding: 15px 20px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
          }
          
          .${styles.title} {
            font-size: 22px !important;
            margin: 0 !important;
            color: #333a52 !important;
            font-weight: 600 !important;
            font-family: 'Poppins', sans-serif !important;
            position: relative !important;
            display: inline-block !important;
          }
          
          .${styles.title}::after {
            content: '' !important;
            position: absolute !important;
            bottom: -4px !important;
            left: 0 !important;
            width: 40px !important;
            height: 3px !important;
            background: #6c63ff !important;
            border-radius: 3px !important;
          }
          
          .${styles.closeButton} {
            background: none !important;
            border: none !important;
            font-size: 24px !important;
            color: #6e7891 !important;
            cursor: pointer !important;
            padding: 0 !important;
            margin: 0 !important;
            line-height: 1 !important;
          }
          
          .${styles.content} {
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
          }
          
          .${styles.iconContainer} {
            display: flex !important;
            flex-direction: column !important;
            gap: 15px !important;
            margin: 15px 0 !important;
          }
          
          .${styles.iconRow} {
            display: flex !important;
            justify-content: space-around !important;
            width: 100% !important;
          }
          
          .${styles.logoContainer} {
            margin: 0 5px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)) !important;
          }
          
          .${styles.shortcutIcon} {
            width: 50px !important;
            height: 50px !important;
            transition: transform 0.2s ease !important;
            object-fit: contain !important;
          }
          
          .${styles.shortcutIcon}:hover {
            transform: scale(1.1) !important;
          }
          
          .${styles.dropZoneBox} {
            border: 2px dashed #6e7891 !important;
            border-radius: 16px !important;
            padding: 30px 15px !important;
            margin: 15px auto !important;
            width: 90% !important;
            height: 150px !important;
            text-align: center !important;
            transition: all 0.3s ease !important;
            background-color: #f0f7ff !important;
            cursor: pointer !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
          }
          
          .${styles.dropZoneActive} {
            border-color: #4a9eff !important;
            background-color: rgba(74, 158, 255, 0.1) !important;
            transform: scale(1.02) !important;
            box-shadow: 0 0 15px rgba(74, 158, 255, 0.3) !important;
          }
          
          .${styles.mainInstructions} {
            text-align: center !important;
            padding: 0 !important;
          }
          
          .${styles.mainInstructions} p {
            font-size: 18px !important;
            line-height: 1.5 !important;
            margin: 0 !important;
            color: #4a7bff !important;
            font-family: 'Poppins', sans-serif !important;
            font-weight: 500 !important;
          }
          
          .${styles.dropZoneActive} .${styles.mainInstructions} p {
            color: #4a9eff !important;
            transform: scale(1.05) !important;
          }
          
          .${styles.alternativeMethod} {
            margin-top: 20px !important;
            text-align: center !important;
            padding: 10px 0 !important;
            border-top: 1px solid rgba(110, 120, 145, 0.15) !important;
          }
          
          .${styles.alternativeMethod} p {
            font-size: 16px !important;
            margin: 10px 0 !important;
            color: #6e7891 !important;
            font-family: 'Poppins', sans-serif !important;
          }
          
          .${styles.aiMethodButton} {
            padding: 10px 24px !important;
            font-size: 16px !important;
            margin-top: 10px !important;
            border-radius: 30px !important;
            transition: all 0.2s ease !important;
            background-color: #6c63ff !important;
            color: white !important;
            border: none !important;
            font-family: 'Poppins', sans-serif !important;
            font-weight: 500 !important;
            box-shadow: 0 4px 10px rgba(108, 99, 255, 0.3) !important;
          }
          
          .${styles.aiMethodButton}:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 15px rgba(108, 99, 255, 0.4) !important;
          }
        `}</style>
      </div>
    </div>
  );
}
