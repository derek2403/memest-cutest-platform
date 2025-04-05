import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import styles from '../styles/Shortcut.module.css';

export default function Shortcut({ onClose, onDrop }) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const popupRef = useRef(null);
  const dropZoneRef = useRef(null);

  const handleDragOver = (e) => {
    // Only allow drag over the drop zone box
    if (e.currentTarget === dropZoneRef.current) {
      e.preventDefault();
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e) => {
    // Only handle drag leave for the drop zone box
    if (e.currentTarget === dropZoneRef.current) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e) => {
    // Only process drops in the drop zone box
    if (e.currentTarget === dropZoneRef.current) {
      e.preventDefault();
      setIsDraggingOver(false);
      setIsDragging(false);
      
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
        // Indicate that dragging has started
        setIsDragging(true);
      });
      
      icon.addEventListener('dragend', () => {
        // Reset dragging state when drag ends
        setIsDragging(false);
      });
    });
    
    // Add global dragend event to handle cases when drag is canceled
    const handleDragEnd = () => {
      setIsDragging(false);
      setIsDraggingOver(false);
    };
    
    document.addEventListener('dragend', handleDragEnd);
    return () => {
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  // Handle direct drop of the icon (without using drag events)
  useEffect(() => {
    const handleMouseUp = (e) => {
      if (!dropZoneRef.current) return;
      
      // Check if the mouseup happened inside the drop zone box
      const rect = dropZoneRef.current.getBoundingClientRect();
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
      
      // Reset dragging state
      setIsDragging(false);
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

  return (
    <div className={styles.overlay}>
      <div 
        className={`${styles.popup}`}
        ref={popupRef}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Create a workflow here</h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.iconRow}>
            <div className={styles.logoContainer}>
              <img 
                src="/icon/metamask.png" 
                alt="MetaMask" 
                className={styles.shortcutIcon}
                draggable="true"
              />
              <div className={styles.logoGlow}></div>
            </div>
            <div className={styles.logoContainer}>
              <img 
                src="/icon/gmail.png" 
                alt="Gmail" 
                className={styles.shortcutIcon}
                draggable="true"
              />
              <div className={styles.logoGlow}></div>
            </div>
            <div className={styles.logoContainer}>
              <img 
                src="/icon/1inch.png" 
                alt="1inch" 
                className={styles.shortcutIcon}
                draggable="true"
              />
              <div className={styles.logoGlow}></div>
            </div>
          </div>
          
          <div className={styles.iconRow}>
            <div className={styles.logoContainer}>
              <img 
                src="/icon/polygon.png" 
                alt="Polygon" 
                className={styles.shortcutIcon}
                draggable="true"
              />
              <div className={styles.logoGlow}></div>
            </div>
            <div className={styles.logoContainer}>
              <img 
                src="/icon/celo.png" 
                alt="Celo" 
                className={styles.shortcutIcon}
                draggable="true"
              />
              <div className={styles.logoGlow}></div>
            </div>
            <div className={styles.logoContainer}>
              <img 
                src="/icon/spreadsheet.png" 
                alt="Spreadsheet" 
                className={styles.shortcutIcon}
                draggable="true"
              />
              <div className={styles.logoGlow}></div>
            </div>
          </div>
          
          {/* Specific drop zone box */}
          <div 
            className={`${styles.dropZoneBox} ${isDraggingOver ? styles.dropZoneActive : ''} ${isDragging ? styles.dropZoneHighlighted : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            ref={dropZoneRef}
          >
            <div className={styles.mainInstructions}>
              {isDragging || isDraggingOver ? (
                <>
                  <div className={styles.dropArrow}>↓</div>
                  <p>Drop here to create shortcut</p>
                </>
              ) : (
                <p>Drag a button to create a shortcut</p>
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
            background-color: #1a1e2e !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25) !important;
          }
          
          .${styles.header} {
            margin-bottom: 15px !important;
            background-color: #151b30 !important;
            border-radius: 12px !important;
            padding: 15px 20px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            border: 1px solid #2c3050 !important;
          }
          
          .${styles.title} {
            font-size: 1.4rem !important;
            margin: 0 !important;
            color: #e0e0ff !important;
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
            font-size: 28px !important;
            color: #8f96b3 !important;
            cursor: pointer !important;
            padding: 0 !important;
            margin: 0 !important;
            line-height: 1 !important;
            transition: all 0.2s ease !important;
          }
          
          .${styles.closeButton}:hover {
            color: #e0e0ff !important;
            background-color: rgba(108, 99, 255, 0.1) !important;
            transform: scale(1.1) !important;
          }
          
          .${styles.content} {
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
          }
          
          .${styles.iconRow} {
            margin: 15px 0 !important;
            justify-content: space-around !important;
            display: flex !important;
            background-color: #2c3050 !important;
            border-radius: 10px !important;
            padding: 15px 10px !important;
          }
          
          .${styles.logoContainer} {
            margin: 0 5px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            position: relative !important;
          }
          
          .${styles.shortcutIcon} {
            width: 50px !important;
            height: 50px !important;
            transition: transform 0.2s ease !important;
            object-fit: contain !important;
            z-index: 2 !important;
          }
          
          .${styles.shortcutIcon}:hover {
            transform: scale(1.1) !important;
          }
          
          .${styles.logoGlow} {
            position: absolute !important;
            width: 40px !important;
            height: 40px !important;
            background: rgba(108, 99, 255, 0.15) !important;
            border-radius: 50% !important;
            filter: blur(15px) !important;
            z-index: 1 !important;
            transition: all 0.3s ease !important;
          }
          
          .${styles.logoContainer}:hover .${styles.logoGlow} {
            width: 55px !important;
            height: 55px !important;
            background: rgba(108, 99, 255, 0.3) !important;
          }
          
          .${styles.dropZoneBox} {
            border: 2px dashed #3d4568 !important;
            border-radius: 16px !important;
            padding: 50px 15px !important;
            margin: 15px auto !important;
            width: 90% !important;
            height: 450px !important;
            text-align: center !important;
            transition: all 0.3s ease !important;
            background-color: #232845 !important;
            cursor: pointer !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
          }
          
          .${styles.dropZoneActive} {
            border-color: #6c63ff !important;
            background-color: rgba(108, 99, 255, 0.1) !important;
            transform: scale(1.02) !important;
            box-shadow: 0 0 15px rgba(108, 99, 255, 0.3) !important;
          }
          
          .${styles.dropZoneHighlighted} {
            border-color: #6c63ff !important;
            border-width: 3px !important;
            background-color: rgba(108, 99, 255, 0.2) !important;
            box-shadow: 0 0 30px rgba(108, 99, 255, 0.6) !important;
            animation: pulseHighlight 1.5s infinite alternate !important;
            position: relative !important;
            overflow: hidden !important;
          }
          
          .${styles.dropZoneHighlighted}::before {
            content: '' !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: repeating-linear-gradient(
              -45deg,
              rgba(108, 99, 255, 0.15),
              rgba(108, 99, 255, 0.15) 15px,
              rgba(108, 99, 255, 0.05) 15px,
              rgba(108, 99, 255, 0.05) 30px
            ) !important;
            animation: moveBackground 3s linear infinite !important;
            z-index: 0 !important;
          }
          
          .${styles.mainInstructions} {
            position: relative !important;
            z-index: 1 !important;
            text-align: center !important;
            padding: 0 !important;
          }
          
          .${styles.mainInstructions} p {
            font-size: 18px !important;
            line-height: 1.5 !important;
            margin: 0 !important;
            color: #a0a8cc !important;
            font-family: 'Poppins', sans-serif !important;
            font-weight: 500 !important;
          }
          
          .${styles.dropZoneActive} .${styles.mainInstructions} p {
            color: #6c63ff !important;
            transform: scale(1.05) !important;
          }
          
          .${styles.dropZoneHighlighted} .${styles.mainInstructions} p {
            color: white !important;
            text-shadow: 0 0 10px rgba(108, 99, 255, 0.8) !important;
            font-weight: 600 !important;
            transform: scale(1.05) !important;
          }
          
          @keyframes moveBackground {
            0% {
              background-position: 0 0;
            }
            100% {
              background-position: 40px 40px;
            }
          }
          
          @keyframes pulseHighlight {
            0% {
              box-shadow: 0 0 20px rgba(108, 99, 255, 0.4) !important;
              border-color: rgba(108, 99, 255, 0.7) !important;
              transform: scale(1) !important;
            }
            100% {
              box-shadow: 0 0 35px rgba(108, 99, 255, 0.8) !important;
              border-color: #6c63ff !important;
              transform: scale(1.03) !important;
            }
          }
          
          .${styles.dropArrow} {
            font-size: 48px !important;
            color: #6c63ff !important;
            margin-bottom: 15px !important;
            animation: bounceArrow 1s ease infinite !important;
            text-shadow: 0 0 15px rgba(108, 99, 255, 0.8) !important;
          }
          
          @keyframes bounceArrow {
            0%, 100% {
              transform: translateY(0) !important;
            }
            50% {
              transform: translateY(-10px) !important;
            }
          }
          
          .${styles.alternativeMethod} {
            margin-top: 20px !important;
            text-align: center !important;
            padding: 10px 0 !important;
            border-top: 1px solid rgba(60, 70, 90, 0.3) !important;
          }
          
          .${styles.alternativeMethod} p {
            font-size: 16px !important;
            margin: 10px 0 !important;
            color: #a0a8cc !important;
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
