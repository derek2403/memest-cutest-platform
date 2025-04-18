import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/MetamaskShortcut.module.css';

export default function ShortcutDetails({ onClose, assistantType = 'metamask' }) {
  const [messages, setMessages] = useState([]);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [conversationStage, setConversationStage] = useState('initial');
  const [actionCount, setActionCount] = useState(0);
  const chatContainerRef = useRef(null);

  // Define conversation flow
  const conversationFlow = {
    initial: {
      message: '',  // Removed the initial greeting
      options: [
        { id: 'check-balance', text: 'Check my transaction' },
        { id: 'send-transaction', text: 'Send a transaction' },
        { id: 'swap-tokens', text: 'Swap tokens' }
      ]
    },
    'done': {
      message: `Thank you for using ${getAssistantTitle()}. Is there anything else I can help you with?`,
      options: [
        { id: 'continue', text: 'Yes, I have more questions' },
        { id: 'exit', text: 'No, I\'m done' }
      ]
    }
  };

  // Determine the assistant title based on the type
  function getAssistantTitle() {
    switch(assistantType) {
      case 'gmail':
        return 'Gmail Assistant';
      case '1inch':
        return '1inch Assistant';
      case 'polygon':
        return 'Polygon Assistant';
      case 'celo':
        return 'Celo Assistant';
      case 'spreadsheet':
        return 'Spreadsheet Assistant';
      case 'metamask':
      default:
        return 'MetaMask Assistant';
    }
  }

  // Get the correct icon path based on assistant type
  function getAssistantIcon() {
    switch(assistantType) {
      case 'gmail':
        return '/icon/gmail.png';
      case '1inch':
        return '/icon/1inch.png';
      case 'polygon':
        return '/icon/polygon.png';
      case 'celo':
        return '/icon/celo.png';
      case 'spreadsheet':
        return '/icon/spreadsheet.png';
      case 'metamask':
      default:
        return '/icon/metamask.png';
    }
  }

  // Initialize conversation
  useEffect(() => {
    // Start with initial options only, no message
    const initialStage = conversationFlow.initial;
    setCurrentOptions(initialStage.options);
    setConversationStage('initial');
  }, []);

  // Auto-scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle option selection
  const handleOptionSelect = (optionId) => {
    // Add user selection to messages
    const selectedOption = currentOptions.find(option => option.id === optionId);
    setMessages(prev => [...prev, { sender: 'User', text: selectedOption.text }]);

    // If the option is "exit", close the shortcut
    if (optionId === 'exit') {
      onClose();
      return;
    }

    // If we're in the initial stage or any other stage except 'done' or 'exit',
    // go straight to 'done' after selecting an option
    if (conversationStage === 'initial' || 
        (conversationStage !== 'done' && conversationStage !== 'exit' && conversationStage !== 'action-limit')) {
      
      // Get the 'done' stage
      const doneStage = conversationFlow['done'];
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'AI', text: doneStage.message }]);
        setCurrentOptions(doneStage.options);
        setConversationStage('done');
      }, 600);
      return;
    }

    // Special case for 'continue' option after 3 actions
    if (optionId === 'continue') {
      setTimeout(() => {
        setCurrentOptions(conversationFlow.initial.options);
        setConversationStage('initial');
      }, 600);
      return;
    }

    // For any other option, proceed to the next stage as before
    const nextStage = conversationFlow[optionId];
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'AI', text: nextStage.message }]);
      setCurrentOptions(nextStage.options);
      setConversationStage(optionId);
    }, 600);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <img src={getAssistantIcon()} alt={assistantType} className={styles.logo} />
            <div className={styles.logoGlow}></div>
          </div>
          <h2>{getAssistantTitle()}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={styles.chatContainer} ref={chatContainerRef}>
          <div className={styles.lowPolyBackground}></div>
          {messages && messages.length > 0 && (
            messages.map((msg, index) => (
              <div key={index} className={`${styles.message} ${msg.sender === 'AI' ? styles.aiMessage : styles.userMessage}`}>
                <div className={styles.messageBubble}>
                  <div className={styles.senderName}>
                    {msg.sender === 'AI' ? getAssistantTitle().split(' ')[0] : 'You'}
                  </div>
                  <p>{msg.text}</p>
                  <div className={styles.messageCorner}></div>
                </div>
              </div>
            ))
          )}

          {currentOptions && currentOptions.length > 0 && (
            <div className={styles.optionsContainer}>
              {currentOptions.map((option) => (
                <button
                  key={option.id}
                  className={`${styles.optionButton} ${option.id === 'exit' ? styles.exitButton : ''}`}
                  onClick={() => handleOptionSelect(option.id)}
                >
                  {option.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}