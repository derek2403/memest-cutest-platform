import { ethers } from 'ethers';

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
  const { to, amount, chainId } = req;

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

  try {
    // Convert the amount to Wei as a string to avoid BigInt serialization issues
    const amountInWei = ethers.parseEther(amount.toString()).toString();

    return {
      success: true,
      message: 'Transaction data validated',
      data: {
        to,
        amount: amountInWei,
        chainId: chainId.toString() // Convert chainId to string as well
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error preparing transaction',
      error: error.message
    };
  }
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