import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import styles from '../styles/Shortcut.module.css';

export default function Shortcut({ onClose, onDrop }) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
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
          <h3>Drag a shortcut here</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.iconRow}>
          <img src="/icon/metamask.png" alt="Metamask" className={styles.shortcutIcon} />
          <img src="/icon/gmail.png" alt="Gmail" className={styles.shortcutIcon} />
          <img src="/icon/1inch.png" alt="1inch" className={styles.shortcutIcon} />
        </div>
        
        <div className={styles.content}>
          {isDraggingOver ? (
            <p>Drop to create shortcut</p>
          ) : (
            <p>Drag a button from the sidebar to create a shortcut</p>
          )}
        </div>
      </div>
    </div>
  );
}
