// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { handleEmailVerification, verifyToken, isEmailVerified, sendTransactionApprovalEmail, verifyTransactionToken } from './scripts/email.js';
import { handleTransaction, executeTransaction } from './scripts/wallet.js';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Email verification endpoint - initiates verification process
app.post('/email', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const result = await handleEmailVerification(email);
  return res.json(result);
});

// Verify email token endpoint
app.get('/email/verify', (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }
  const result = verifyToken(token);
  return res.json(result);
});

// Check email verification status endpoint
app.get('/email/status', (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required' });
  }
  const status = isEmailVerified(email);
  return res.json({ email, ...status });
});

// Transaction endpoint - prepare transaction and send approval email
app.post('/transaction', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required for transaction approval' });
  }
  
  // Process transaction request without requiring email verification first
  const result = await handleTransaction(req.body);
  
  // If transaction preparation was successful, send approval email
  if (result.success && result.requiresApproval) {
    const emailResult = await sendTransactionApprovalEmail(email, result.data);
    
    if (emailResult.success) {
      return res.json({
        success: true,
        message: 'Transaction pending approval. Check your email to approve or ignore this transaction.',
        transactionId: emailResult.approveToken.substring(0, 8), // Just use first 8 chars as ID
        email
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send approval email',
        error: emailResult.error
      });
    }
  }
  
  return res.json(result);
});

// Transaction verification endpoint (approve or ignore)
app.get('/transaction/verify', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }
  
  // Verify the token and get transaction data
  const verificationResult = verifyTransactionToken(token);
  
  if (!verificationResult.success) {
    return res.json(verificationResult);
  }
  
  // Handle approval or ignoring based on the token action
  if (verificationResult.action === 'approve') {
    // Execute the transaction using the private key
    const executionResult = await executeTransaction(verificationResult.transaction);
    
    // Return execution result
    return res.json({
      success: executionResult.success,
      message: executionResult.success 
        ? 'Transaction approved and executed successfully' 
        : 'Transaction approved but execution failed',
      details: executionResult
    });
  } else if (verificationResult.action === 'ignore') {
    // Transaction was ignored
    return res.json({
      success: true,
      message: 'Transaction has been ignored',
      transaction: verificationResult.transaction
    });
  }
  
  return res.status(400).json({
    success: false,
    message: 'Invalid action specified in token'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
