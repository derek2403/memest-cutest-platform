// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { gmailService } from './workflows.js';
import { metamaskService } from './workflows.js';
import { spreadsheetService, workflows, handleWorkflowRequest } from './workflows.js';

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
  const result = await gmailService.verifyEmail(email);
  return res.json(result);
});

// Verify email token endpoint
app.get('/email/verify', (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }
  const result = gmailService.verifyTransactionFromEmail(token);
  return res.json(result);
});

// Check email verification status endpoint
app.get('/email/status', (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required' });
  }
  const status = gmailService.checkEmailVerification(email);
  return res.json({ email, ...status });
});

// Transaction endpoint - prepare transaction and send approval email
app.post('/transaction', async (req, res) => {
  const { to, amount, chainId, email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required for transaction approval' });
  }
  
  // Use the workflow to handle transaction request and approval
  const result = await workflows.requestTransactionApproval(to, amount, chainId, email);
  return res.json(result);
});

// Transaction verification endpoint (approve or ignore)
app.get('/transaction/verify', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }
  
  // Use the workflow to handle complete transaction approval process
  const result = await workflows.completeTransactionApproval(token);
  return res.json(result);
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
    const result = await spreadsheetService.visualizeTransactions(address, chainId, month, year);
    
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
    
    // Use workflow to generate and email the report
    const result = await workflows.generateTransactionReport(address, chainId, month, year, email || 'derekliew0@gmail.com');
    
    res.json(result);
  } catch (error) {
    console.error('Error generating transaction graphs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// New endpoint for processing workflow requests from WorkflowPopup
app.post('/api/workflow', handleWorkflowRequest);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
