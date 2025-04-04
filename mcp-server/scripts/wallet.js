import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Function to validate Ethereum address
export function isValidAddress(address) {
  try {
    return ethers.isAddress(address);
  } catch (error) {
    return false;
  }
}

// Function to validate amount
export function isValidAmount(amount) {
  try {
    return !isNaN(amount) && parseFloat(amount) > 0;
  } catch (error) {
    return false;
  }
}

// Function to handle transaction request
export async function handleTransaction(req) {
  const { to, amount, chainId, email } = req;

  // Validate inputs
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

  if (!email) {
    return {
      success: false,
      message: 'Email is required for transaction approval'
    };
  }

  try {
    // Convert the amount to Wei as a string to avoid BigInt serialization issues
    const amountInWei = ethers.parseEther(amount.toString()).toString();

    // Get the sender's address from the private key
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '');
    const from = wallet.address;

    // Prepare transaction data
    const transactionData = {
      from,
      to,
      amount: amountInWei,
      chainId: chainId.toString(), // Convert chainId to string
      timestamp: Date.now()
    };

    // Return data for email approval
    return {
      success: true,
      message: 'Transaction ready for approval',
      data: transactionData,
      requiresApproval: true
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error preparing transaction',
      error: error.message
    };
  }
}

// Function to execute an approved transaction
export async function executeTransaction(transaction) {
  try {
    if (!process.env.PRIVATE_KEY) {
      throw new Error('Private key not configured in environment variables');
    }

    // Create wallet from private key
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    
    // Get provider based on chainId
    const providerUrl = getProviderUrl(transaction.chainId);
    const provider = new ethers.JsonRpcProvider(providerUrl);
    
    // Connect wallet to provider
    const connectedWallet = wallet.connect(provider);
    
    // Prepare transaction object
    const tx = {
      to: transaction.to,
      value: BigInt(transaction.amount),
      gasLimit: 21000, // Basic ETH transfer gas limit
    };
    
    // Send the transaction
    const response = await connectedWallet.sendTransaction(tx);
    
    // Wait for transaction to be mined
    const receipt = await response.wait();
    
    return {
      success: true,
      message: 'Transaction executed successfully',
      hash: response.hash,
      receipt,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to execute transaction',
      error: error.message
    };
  }
}

// Helper function to get provider URL based on chainId
function getProviderUrl(chainId) {
  const providers = {
    '1': process.env.MAINNET_RPC_URL || 'https://ethereum.publicnode.com',
    '11155111': process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com',
    '421614': process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
    '84532': process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
  };
  
  return providers[chainId] || providers['1']; // Default to mainnet
}

// Function to handle mouse click events
export function handleMouseClick(event, callback) {
  // Get coordinates of the click
  const x = event.clientX;
  const y = event.clientY;
  
  console.log(`Mouse clicked at X: ${x}, Y: ${y}`);
  
  // If a callback is provided, execute it with the coordinates
  if (typeof callback === 'function') {
    callback({ x, y });
  }
  
  return { x, y };
}

// Specific coordinates for testing or default positions
export const PREDEFINED_COORDINATES = {
  mainButtonPosition: { x: 1812, y: 488 }
};

// Function to simulate a click at predefined coordinates
export function simulateClickAtPredefinedPosition(positionName = 'mainButtonPosition') {
  const position = PREDEFINED_COORDINATES[positionName];
  if (!position) {
    console.error(`Position "${positionName}" not found in predefined coordinates`);
    return null;
  }
  
  console.log(`Simulating click at X: ${position.x}, Y: ${position.y}`);
  return position;
} 