import React, { useState, useEffect } from 'react';
import styles from '../styles/MetamaskShortcut.module.css';

export default function MetamaskShortcut({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  
  // Fake conversation script
  const conversationScript = [
    { sender: 'AI', text: 'Hello! I see you want to access your MetaMask wallet. How can I help you today?' },
    { sender: 'User', text: 'I need to check my ETH balance' },
    { sender: 'AI', text: 'I can help with that. Your current ETH balance is 1.45 ETH. Would you like to see your other tokens as well?' },
    { sender: 'User', text: 'Yes, show me all tokens' },
    { sender: 'AI', text: 'Here are your token balances:\n- ETH: 1.45\n- USDT: 250.00\n- UNI: 15.75\n- LINK: 25.30\nIs there anything specific you want to do with these tokens?' }
  ];

  // Simulate the conversation
  useEffect(() => {
    let currentIndex = 0;
    
    // Add the first AI message immediately
    setMessages([conversationScript[0]]);
    currentIndex++;
    
    // Add subsequent messages with delays
    const interval = setInterval(() => {
      if (currentIndex < conversationScript.length) {
        setMessages(prev => [...prev, conversationScript[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 2000); // 2 seconds between messages
    
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (currentMessage.trim() === '') return;
    
    // Add user message
    setMessages(prev => [...prev, { sender: 'User', text: currentMessage }]);
    setCurrentMessage('');
    
    // Simulate AI response after a delay
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        sender: 'AI', 
        text: 'I understand. Is there anything else you would like to know about your wallet or transactions?' 
      }]);
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img src="/metamask-logo.png" alt="MetaMask" className={styles.logo} />
        <h2>MetaMask Assistant</h2>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>
      
      <div className={styles.chatContainer}>
        {messages.map((msg, index) => (
          <div key={index} className={`${styles.message} ${msg.sender === 'AI' ? styles.aiMessage : styles.userMessage}`}>
            <div className={styles.messageBubble}>
              <strong>{msg.sender === 'AI' ? 'MetaMask AI' : 'You'}</strong>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      
      <form className={styles.inputContainer} onSubmit={handleSendMessage}>
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          placeholder="Type your message..."
          className={styles.input}
        />
        <button type="submit" className={styles.sendButton}>Send</button>
      </form>
    </div>
  );
} 