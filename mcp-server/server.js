// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { handleEmailVerification, verifyToken, isEmailVerified, sendTransactionApprovalEmail, verifyTransactionToken } from './scripts/email.js';
import { handleTransaction, executeTransaction } from './scripts/wallet.js';
import { generateTransactionExcel, addTransactionToSheet, generateTransactionGraphs, sendGraphsByEmail } from './scripts/excel.js';

// Load environment variables
dotenv.config();

// Custom JSON serializer to handle BigInt values
const jsonSerializer = (req, res, next) => {
  // Replace the default JSON serializer with one that can handle BigInt
  const originalJson = res.json;
  
  res.json = function(obj) {
    return originalJson.call(this, JSON.parse(
      JSON.stringify(obj, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
      )
    ));
  };
  
  next();
};

const app = express();
app.use(express.json());
app.use(cors());
app.use(jsonSerializer); // Add the custom serializer middleware

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
    
    // If successful, add to the spreadsheet
    if (executionResult.success) {
      // Add transaction details to the spreadsheet
      const transaction = {
        ...verificationResult.transaction,
        hash: executionResult.hash,
        timestamp: Date.now()
      };
      await addTransactionToSheet(transaction);
    }
    
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

// Generate transaction report
app.post('/transactions/report', async (req, res) => {
  const { address, chainId, month, year } = req.body;
  
  if (!chainId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Chain ID is required' 
    });
  }
  
  try {
    console.log(`Generating transaction report for address: ${address || 'using private key wallet'}, chain: ${chainId}, month: ${month}, year: ${year}`);
    const result = await generateTransactionExcel(address, chainId, month, year);
    
    // Log the result for debugging
    console.log(`Report generation result: success=${result.success}, transactions=${result.count || 0}`);
    if (result.reportUrl) {
      console.log(`Report URL: ${result.reportUrl}`);
    }
    
    return res.json(result);
  } catch (error) {
    console.error('Error generating report:', error);
    
    // Even if there's an error, try to return a URL
    const reportUrl = process.env.GOOGLE_SHEET_ID ? 
      `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}` : 
      null;
    
    return res.json({
      success: true, // Return success to show the report anyway
      message: 'Error generating report but you can still view the spreadsheet',
      error: error.message,
      reportUrl: reportUrl,
      fallback: true
    });
  }
});

// Add route for generating transaction graphs
app.post('/api/transactions/graphs', async (req, res) => {
  try {
    const { address, chainId, month, year, email } = req.body;
    
    console.log(`Generating transaction graphs for address ${address} on chain ${chainId}, month ${month}, year ${year}`);
    
    // Generate Excel report with graphs and email
    const result = await generateTransactionExcel(address, chainId, month, year, {
      generateGraphs: true,
      email: email || 'derekliew0@gmail.com' // Default email if not provided
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error generating transaction graphs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
