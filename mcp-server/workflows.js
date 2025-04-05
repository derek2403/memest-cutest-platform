// mcp-server/workflows.js
import { 
  handleTransaction, 
  executeTransaction, 
  isValidAddress,
  isValidAmount
} from './scripts/wallet.js';

import {
  handleEmailVerification,
  verifyToken,
  isEmailVerified,
  sendTransactionApprovalEmail,
  verifyTransactionToken
} from './scripts/email.js';

import {
  generateTransactionExcel,
  addTransactionToSheet,
  generateTransactionGraphs,
  sendGraphsByEmail
} from './scripts/excel.js';

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

/**
 * Service Definitions
 * This file defines the responsibilities and workflows for each service
 */

// MetaMask Service Functions (wallet.js)
export const metamaskService = {
  // Approve a transaction request
  approveTransaction: async (transactionData) => {
    return await executeTransaction(transactionData);
  },
  
  // Decline a transaction (no-op function since declining is just not executing)
  declineTransaction: (transactionData) => {
    return {
      success: true,
      message: 'Transaction declined',
      transactionData
    };
  },
  
  // List wallet balance - not fully implemented since we use user's wallet
  listBalance: async (address, chainId) => {
    // This would normally connect to a provider and get the balance
    return {
      success: true,
      message: 'Balance retrieved (placeholder)',
      balance: '0.0',
      address,
      chainId
    };
  },
  
  // Send funds (prepare a transaction)
  sendFunds: async (to, amount, chainId, email) => {
    if (!isValidAddress(to)) {
      return {
        success: false,
        message: 'Invalid recipient address'
      };
    }

    if (!isValidAmount(amount)) {
      return {
        success: false,
        message: 'Invalid amount'
      };
    }

    return await handleTransaction({ to, amount, chainId, email });
  },
  
  // Receive funds (placeholder as this would normally be handled by blockchain events)
  receiveFunds: () => {
    return {
      success: true,
      message: 'Your address is ready to receive funds',
    };
  }
};

// Gmail Service Functions (email.js)
export const gmailService = {
  // Notify user about general events
  notifyUser: async (email, subject, message) => {
    // This would use the email sending functionality but is currently a placeholder
    return {
      success: true,
      message: `Notification would be sent to ${email}`
    };
  },
  
  // Send transaction approval email
  approveTransaction: async (email, transactionData) => {
    return await sendTransactionApprovalEmail(email, transactionData);
  },
  
  // Verify a transaction from email token
  verifyTransactionFromEmail: (token) => {
    return verifyTransactionToken(token);
  },
  
  // Verify user's email address
  verifyEmail: (email) => {
    return handleEmailVerification(email);
  },
  
  // Check if email is verified
  checkEmailVerification: (email) => {
    return isEmailVerified(email);
  }
};

// Spreadsheet Service Functions (excel.js)
export const spreadsheetService = {
  // Record a transaction in the spreadsheet
  recordTransaction: async (transaction) => {
    return await addTransactionToSheet(transaction);
  },
  
  // Generate transaction report and visualizations
  visualizeTransactions: async (address, chainId, month, year) => {
    return await generateTransactionExcel(address, chainId, month, year);
  },
  
  // Generate graphs for transactions
  generateGraphs: async (transactions) => {
    return await generateTransactionGraphs(transactions);
  },
  
  // Send transaction graphs via email
  emailTransactionGraphs: async (email, graphBuffers, transactions) => {
    return await sendGraphsByEmail(email, graphBuffers, transactions);
  },
  
  // Generate comprehensive report with graphs and email it
  generateAndEmailReport: async (address, chainId, month, year, email) => {
    return await generateTransactionExcel(address, chainId, month, year, {
      generateGraphs: true,
      email
    });
  }
};

// Combined Workflows
export const workflows = {
  // Complete transaction approval workflow
  completeTransactionApproval: async (token) => {
    // Verify the token
    const verificationResult = gmailService.verifyTransactionFromEmail(token);
    
    if (!verificationResult.success) {
      return verificationResult;
    }
    
    if (verificationResult.action === 'approve') {
      // Execute the transaction
      const executionResult = await metamaskService.approveTransaction(verificationResult.transaction);
      
      // If successful, record the transaction
      if (executionResult.success) {
        const transaction = {
          ...verificationResult.transaction,
          hash: executionResult.hash,
          timestamp: Date.now()
        };
        await spreadsheetService.recordTransaction(transaction);
      }
      
      return {
        success: executionResult.success,
        message: executionResult.success 
          ? 'Transaction approved and executed successfully' 
          : 'Transaction approved but execution failed',
        details: executionResult
      };
    } else if (verificationResult.action === 'ignore') {
      return metamaskService.declineTransaction(verificationResult.transaction);
    }
    
    return {
      success: false,
      message: 'Invalid action specified in token'
    };
  },
  
  // Transaction request and approval email workflow
  requestTransactionApproval: async (to, amount, chainId, email) => {
    // Prepare the transaction
    const transactionResult = await metamaskService.sendFunds(to, amount, chainId, email);
    
    if (!transactionResult.success || !transactionResult.requiresApproval) {
      return transactionResult;
    }
    
    // Send approval email
    const emailResult = await gmailService.approveTransaction(email, transactionResult.data);
    
    if (emailResult.success) {
      return {
        success: true,
        message: 'Transaction pending approval. Check your email to approve or ignore this transaction.',
        transactionId: emailResult.approveToken.substring(0, 8),
        email
      };
    } else {
      return {
        success: false,
        message: 'Failed to send approval email',
        error: emailResult.error
      };
    }
  },
  
  // Generate and email transaction report workflow
  generateTransactionReport: async (address, chainId, month, year, email) => {
    return await spreadsheetService.generateAndEmailReport(address, chainId, month, year, email);
  },
  
  // Process workflow description from WorkflowPopup.js
  processWorkflowDescription: async (workflowInput) => {
    try {
      console.log('\n===============================');
      console.log('PROCESSING WORKFLOW DESCRIPTION');
      console.log('===============================');
      console.log(`Input: "${workflowInput}"`);
      
      // Call OpenAI API to determine which functions to use
      const functions = await determineWorkflowFunctions(workflowInput);
      
      console.log('\n=== WORKFLOW PROCESSING COMPLETED ===');
      console.log(`Successfully processed workflow: ${functions.workflowName}`);
      
      return {
        success: true,
        workflowInput,
        functions
      };
    } catch (error) {
      console.error('\n=== WORKFLOW PROCESSING ERROR ===');
      console.error('Error processing workflow description:', error);
      return {
        success: false,
        message: `Error processing workflow: ${error.message}`,
        error
      };
    }
  }
};

// Function to call OpenAI API and determine which workflow functions to use
async function determineWorkflowFunctions(workflowDescription) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    
    console.log('\n=== WORKFLOW ANALYSIS STARTED ===');
    console.log(`Description: "${workflowDescription}"`);
    
    const availableServices = {
      metamask: Object.keys(metamaskService),
      gmail: Object.keys(gmailService),
      spreadsheet: Object.keys(spreadsheetService)
    };
    
    // Log available services and functions
    console.log('\nAvailable Services:');
    Object.entries(availableServices).forEach(([service, functions]) => {
      console.log(`- ${service}: ${functions.join(', ')}`);
    });
    
    const systemPrompt = `
      You are a workflow assistant that analyzes workflow descriptions and determines which functions should be used.
      Available services and functions:
      
      MetaMask Service: ${availableServices.metamask.join(', ')}
      Gmail Service: ${availableServices.gmail.join(', ')}
      Spreadsheet Service: ${availableServices.spreadsheet.join(', ')}
      
      Based on the user's workflow description, determine:
      1. Which functions from these services should be called
      2. What parameters each function needs
      3. The execution order of these functions
      
      Respond with a JSON object containing:
      {
        "workflowName": "Name of the workflow",
        "description": "Brief description of what the workflow does",
        "steps": [
          {
            "service": "service name (metamask, gmail, or spreadsheet)",
            "function": "function name",
            "parameters": ["list of required parameter names"],
            "description": "What this step does"
          }
        ]
      }
    `;
    
    console.log('\nSending request to OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: workflowDescription }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const workflowConfig = JSON.parse(data.choices[0].message.content);
    
    console.log('\n=== GENERATED WORKFLOW ===');
    console.log(`Name: ${workflowConfig.workflowName}`);
    console.log(`Description: ${workflowConfig.description}`);
    console.log('\nWorkflow Steps:');
    
    workflowConfig.steps.forEach((step, index) => {
      console.log(`\nStep ${index + 1}:`);
      console.log(`- Service: ${step.service}`);
      console.log(`- Function: ${step.function}`);
      console.log(`- Parameters: ${step.parameters.join(', ')}`);
      console.log(`- Description: ${step.description}`);
    });
    
    // Validate that all specified functions exist
    console.log('\nValidating workflow functions...');
    workflowConfig.steps.forEach(step => {
      const service = {
        'metamask': metamaskService,
        'gmail': gmailService,
        'spreadsheet': spreadsheetService
      }[step.service.toLowerCase()];
      
      if (!service) {
        throw new Error(`Unknown service: ${step.service}`);
      }
      
      if (!service[step.function]) {
        throw new Error(`Function ${step.function} not found in ${step.service} service`);
      }
      
      console.log(`✓ Validated ${step.service}.${step.function}`);
    });
    
    console.log('\n=== WORKFLOW ANALYSIS COMPLETED ===');
    console.log(`Total steps: ${workflowConfig.steps.length}`);
    
    // Log the complete workflow configuration JSON
    console.log('\nComplete Workflow Configuration:');
    console.log(JSON.stringify(workflowConfig, null, 2));
    
    return workflowConfig;
  } catch (error) {
    console.error('\n=== WORKFLOW ANALYSIS ERROR ===');
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

// Route handler to process workflow from frontend
export async function handleWorkflowRequest(req, res) {
  try {
    console.log('\n========================================');
    console.log('WORKFLOW REQUEST RECEIVED FROM FRONTEND');
    console.log('========================================');
    console.log('Request body:', req.body);
    
    const { workflowInput } = req.body;
    
    if (!workflowInput) {
      console.error('Error: No workflow input provided in request body');
      return res.status(400).json({ 
        success: false, 
        message: 'Workflow description is required' 
      });
    }
    
    console.log(`Processing workflow description: "${workflowInput}"`);
    
    // Process the workflow description
    const result = await workflows.processWorkflowDescription(workflowInput);
    
    console.log('\n========================================');
    console.log('WORKFLOW PROCESSING COMPLETED');
    console.log('========================================');
    console.log('Sending response to frontend:', result);
    
    return res.json(result);
  } catch (error) {
    console.error('\n========================================');
    console.error('ERROR HANDLING WORKFLOW REQUEST');
    console.error('========================================');
    console.error('Error details:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to process workflow',
      error: error.message
    });
  }
}

export default workflows; 