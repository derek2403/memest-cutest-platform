import { useState, useEffect } from 'react';

/**
 * Custom hook for handling email verification
 * 
 * @returns {Object} Email verification methods and state
 */
const useEmailVerification = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  
  /**
   * Send a verification email
   * 
   * @param {string} email - Email address to verify
   * @returns {Promise<Object>} Verification status
   */
  const sendVerificationEmail = async (email) => {
    if (!email) {
      const error = { success: false, message: 'Email is required' };
      setStatus(error);
      return error;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('https://e3c329acf714051138becd9199470e6d1ae0cabd-3001.dstack-prod5.phala.network/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      setStatus(data);
      
      // If verification is pending, start checking the status
      if (data.verificationPending) {
        startVerificationCheck(email);
      }
      
      return data;
    } catch (error) {
      const errorResult = { 
        success: false, 
        error: 'Failed to send verification email',
        message: error.message 
      };
      setStatus(errorResult);
      return errorResult;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check the verification status of an email
   * 
   * @param {string} email - Email address to check
   * @returns {Promise<Object>} Current verification status
   */
  const checkVerificationStatus = async (email) => {
    if (!email) return null;
    
    try {
      const response = await fetch(`https://e3c329acf714051138becd9199470e6d1ae0cabd-3001.dstack-prod5.phala.network/email/status?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setStatus(data);
      return data;
    } catch (error) {
      console.error('Error checking verification status:', error);
      return null;
    }
  };
  
  /**
   * Start polling for verification status
   * 
   * @param {string} email - Email to check verification for
   */
  const startVerificationCheck = (email) => {
    let checkInterval;
    
    const checkStatus = async () => {
      const result = await checkVerificationStatus(email);
      
      // If verified or max attempts reached, clear the interval
      if (result && result.verified) {
        clearInterval(checkInterval);
      }
    };
    
    // Check immediately then every 5 seconds
    checkStatus();
    checkInterval = setInterval(checkStatus, 5000);
    
    // Cleanup function to clear interval
    return () => clearInterval(checkInterval);
  };
  
  /**
   * Reset the verification status
   */
  const resetStatus = () => {
    setStatus(null);
  };

  return {
    sendVerificationEmail,
    checkVerificationStatus,
    resetStatus,
    status,
    loading,
    isVerified: status?.verified === true,
    isPending: status?.verificationPending === true && !status?.verified,
    isError: status?.error != null
  };
};

export default useEmailVerification; 