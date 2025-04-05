// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { gmailService } from './workflows.js';
import { metamaskService } from './workflows.js';
import { spreadsheetService, workflows, handleWorkflowRequest } from './workflows.js';
import { getCounterEvents, getCounterValue } from './scripts/events.js';

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

// Get events specifically for Counter contracts
app.get('/api/events/counter', async (req, res) => {
  try {
    const { contractAddress } = req.query;
    
    if (!contractAddress) {
      return res.status(400).json({
        success: false,
        message: 'Contract address is required'
      });
    }
    
    const result = await getCounterEvents(contractAddress);
    return res.json(result);
  } catch (error) {
    console.error('Error getting counter events:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting counter events',
      error: error.message
    });
  }
});

// Get current value from a Counter contract
app.get('/api/counter/value', async (req, res) => {
  try {
    const { contractAddress } = req.query;
    
    if (!contractAddress) {
      return res.status(400).json({
        success: false,
        message: 'Contract address is required'
      });
    }
    
    const result = await getCounterValue(contractAddress);
    return res.json(result);
  } catch (error) {
    console.error('Error getting counter value:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting counter value',
      error: error.message
    });
  }
});

// Add a new endpoint to get the attestation report
app.get('/attestation', async (req, res) => {
  try {
    // Get custom data from query parameter or use a default
    const userData = req.query.data || `mcp-server:${new Date().toISOString()}`;
    
    // Use dynamic import for child_process to work with ES modules
    const { spawn } = await import('child_process');
    const python = spawn('python3', ['attestation.py', userData]);
    
    let result = '';
    let stderr = '';
    
    // Collect data from the Python script
    python.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    // Handle errors
    python.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`attestation.py error: ${data}`);
    });
    
    // Send the response when the Python script exits
    python.on('close', (code) => {
      if (code !== 0) {
        res.status(500).json({ 
          success: false, 
          error: 'Failed to generate attestation report',
          code,
          stderr
        });
        return;
      }
      
      try {
        const attestationData = JSON.parse(result);
        res.json(attestationData);
      } catch (parseError) {
        res.status(500).json({ 
          success: false, 
          error: 'Failed to parse attestation result',
          details: parseError.message,
          result
        });
      }
    });
  } catch (error) {
    console.error('Attestation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Add this new endpoint for running the 1inch script with real-time log streaming
app.get('/run-1inch', async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS for this endpoint
  
  console.log("1inch bridge endpoint called");
  
  try {
    // Import child_process dynamically since we're using ES modules
    const { spawn } = await import('child_process');
    const { dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    // Get current directory
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    // Use bash to execute the shell script with full path
    const scriptPath = `${__dirname}/run1inch.sh`;
    console.log(`Executing script at: ${scriptPath}`);
    
    // Send initial message
    res.write(`data: Starting 1inch bridge process...\n\n`);
    
    const process = spawn('bash', [scriptPath]);
    
    // Capture output chunks
    process.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        console.log("1inch stdout:", line);
        res.write(`data: ${line}\n\n`);
      });
    });
    
    // Capture error output
    process.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        console.error("1inch stderr:", line);
        res.write(`data: [ERROR] ${line}\n\n`);
      });
    });
    
    // When the process exits
    process.on('close', (code) => {
      console.log(`1inch process exited with code ${code}`);
      res.write(`data: Process exited with code ${code}\n\n`);
      res.write(`event: close\ndata: closed\n\n`);
      res.end();
    });
    
    // Handle client disconnect
    req.on('close', () => {
      // Don't kill the process when client disconnects - it should run to completion
      console.log('Client disconnected, but 1inch process will continue running');
    });
    
  } catch (error) {
    console.error('Error running 1inch script:', error);
    res.write(`data: Error starting 1inch process: ${error.message}\n\n`);
    res.write(`event: close\ndata: error\n\n`);
    res.end();
  }
});

// Add a new endpoint to run shell scripts
app.post('/api/run-script', async (req, res) => {
  try {
    const { script } = req.body;
    
    // Security check - only allow specific scripts to be executed
    const allowedScripts = ['generate_reports.sh'];
    
    if (!allowedScripts.includes(script)) {
      return res.status(403).json({
        success: false,
        message: 'Script execution not allowed'
      });
    }
    
    // Execute the script using child_process with proper path
    const { exec } = await import('child_process');
    const { dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    // Get current directory
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    const scriptPath = `${__dirname}/${script}`;
    console.log(`Executing script at: ${scriptPath}`);
    
    exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: `Error executing script: ${error.message}`,
          error: error.message
        });
      }
      
      if (stderr) {
        console.warn(`Script stderr: ${stderr}`);
      }
      
      console.log(`Script stdout: ${stdout}`);
      
      return res.json({
        success: true,
        message: 'Script executed successfully',
        output: stdout
      });
    });
  } catch (error) {
    console.error('Error in /api/run-script endpoint:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;

// Check if port is in use, and if so, increment until we find an available port
const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit the server at: ${process.env.APP_URL || `http://localhost:${PORT}`}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} is already in use, trying ${PORT + 1}`);
      process.env.PORT = (parseInt(PORT) + 1).toString();
      startServer(); // Try the next port
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer();
