import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import styles from '../styles/Shortcut.module.css';

export default function Shortcut({ onClose, onDrop }) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const popupRef = useRef(null);

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
    } else if (buttonId === '1inch-button' || buttonId === '1inch-icon') {
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
  }, []);

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

  return (
    <div className={styles.overlay}>
      <div 
        ref={popupRef}
        className={`${styles.popup} ${isDraggingOver ? styles.dragOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Drag a shortcut here</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.iconRow}>
            <div className={styles.logoContainer}>
              <img src="/icon/metamask.png" alt="Metamask" className={styles.shortcutIcon} />
              <div className={styles.logoGlow}></div>
            </div>
            <div className={styles.logoContainer}>
              <img src="/icon/gmail.png" alt="Gmail" className={styles.shortcutIcon} />
              <div className={styles.logoGlow}></div>
            </div>
            <div className={styles.logoContainer}>
              <img src="/icon/1inch.png" alt="1inch" className={styles.shortcutIcon} />
              <div className={styles.logoGlow}></div>
            </div>
          </div>
          
          <div className={styles.iconRow}>
            <div className={styles.logoContainer}>
              <img src="/icon/polygon.png" alt="Polygon" className={styles.shortcutIcon} />
              <div className={styles.logoGlow}></div>
            </div>
            <div className={styles.logoContainer}>
              <img src="/icon/celo.png" alt="Celo" className={styles.shortcutIcon} />
              <div className={styles.logoGlow}></div>
            </div>
            <div className={styles.logoContainer}>
              <img src="/icon/spreadsheet.png" alt="Spreadsheet" className={styles.shortcutIcon} />
              <div className={styles.logoGlow}></div>
            </div>
          </div>
          
          <div className={styles.mainInstructions}>
            {isDraggingOver ? (
              <p>Drop to create shortcut</p>
            ) : (
              <p>Drag a button from the sidebar to create a shortcut</p>
            )}
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
      </div>
    </div>
  );
}
