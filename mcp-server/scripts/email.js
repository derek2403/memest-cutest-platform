// backend/scripts/email.js
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { ethers } from 'ethers';

// Load environment variables
dotenv.config();

// Store verification tokens with expiry times
const verificationTokens = new Map();
// Store transaction approval tokens
const transactionTokens = new Map();

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Token expiry time in milliseconds (30 minutes)
const TOKEN_EXPIRY = 1000 * 60 * 30;

// Send verification email
export async function sendVerificationEmail(email) {
  if (!email) {
    return {
      success: false,
      message: 'Email is required',
    };
  }
  
  try {
    const token = uuidv4();
    verificationTokens.set(token, {
      email,
      expires: Date.now() + TOKEN_EXPIRY,
      verified: false
    });
    
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:3001'}/email/verify?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification',
      html: `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link will expire in 30 minutes.</p>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      message: 'Verification email sent',
      email,
    };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return {
      success: false,
      message: 'Failed to send verification email',
      error: error.message,
    };
  }
}

// Send transaction approval email
export async function sendTransactionApprovalEmail(email, transactionData) {
  if (!email) {
    return {
      success: false,
      message: 'Email is required',
    };
  }
  
  try {
    const approveToken = uuidv4();
    const ignoreToken = uuidv4();
    
    // Store transaction data with tokens
    transactionTokens.set(approveToken, {
      email,
      transaction: transactionData,
      expires: Date.now() + TOKEN_EXPIRY,
      action: 'approve'
    });
    
    transactionTokens.set(ignoreToken, {
      email,
      transaction: transactionData,
      expires: Date.now() + TOKEN_EXPIRY,
      action: 'ignore'
    });
    
    const approveUrl = `${process.env.APP_URL || 'http://localhost:3001'}/transaction/verify?token=${approveToken}`;
    const ignoreUrl = `${process.env.APP_URL || 'http://localhost:3001'}/transaction/verify?token=${ignoreToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Transaction Approval Request',
      html: `
        <h1>Transaction Approval</h1>
        <p>A transaction is made with the wallet ${transactionData.from || 'Unknown'}</p>
        <p>Transaction details:</p>
        <ul>
          <li>To: ${transactionData.to}</li>
          <li>Amount: ${ethers.formatEther(transactionData.amount)} ETH</li>
          <li>Chain ID: ${transactionData.chainId}</li>
        </ul>
        <p><a href="${approveUrl}">Approve this transaction</a>, or <a href="${ignoreUrl}">click here to ignore</a></p>
        <p>This approval request will expire in 30 minutes.</p>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      message: 'Transaction approval email sent',
      email,
      approveToken,
      ignoreToken,
    };
  } catch (error) {
    console.error('Error sending transaction approval email:', error);
    return {
      success: false,
      message: 'Failed to send transaction approval email',
      error: error.message,
    };
  }
}

// Verify transaction token
export function verifyTransactionToken(token) {
  if (!token) {
    return {
      success: false,
      message: 'Token is required',
    };
  }
  
  if (!transactionTokens.has(token)) {
    return {
      success: false,
      message: 'Invalid token',
    };
  }
  
  const tokenData = transactionTokens.get(token);
  
  if (tokenData.expires < Date.now()) {
    transactionTokens.delete(token);
    return {
      success: false,
      message: 'Token expired',
    };
  }
  
  // Clone the transaction data to avoid modifying the original
  const result = {
    success: true,
    action: tokenData.action,
    transaction: { ...tokenData.transaction },
    email: tokenData.email
  };
  
  // Clean up token after use
  transactionTokens.delete(token);
  
  return result;
}

// Verify token
export function verifyToken(token) {
  if (!token) {
    return {
      success: false,
      message: 'Token is required',
    };
  }
  
  if (!verificationTokens.has(token)) {
    return {
      success: false,
      message: 'Invalid token',
    };
  }
  
  const tokenData = verificationTokens.get(token);
  
  if (tokenData.expires < Date.now()) {
    verificationTokens.delete(token);
    return {
      success: false,
      message: 'Token expired',
    };
  }
  
  // Mark this token as verified
  tokenData.verified = true;
  verificationTokens.set(token, tokenData);
  
  return {
    success: true,
    message: 'Email verified successfully',
    email: tokenData.email,
  };
}

// Check if email is verified
export function isEmailVerified(email) {
  // Find any valid token for this email
  for (const [token, data] of verificationTokens.entries()) {
    if (data.email === email) {
      // Clean up expired tokens
      if (data.expires < Date.now()) {
        verificationTokens.delete(token);
        continue;
      }
      return {
        verified: data.verified,
        details: {
          expires: data.expires,
          verifiedAt: data.verified ? new Date().toISOString() : null
        }
      };
    }
  }
  
  return {
    verified: false,
    details: null
  };
}

// Handle email verification request
export async function handleEmailVerification(email) {
  const verificationStatus = isEmailVerified(email);
  
  if (verificationStatus.verified) {
    return {
      success: true,
      verified: true,
      message: 'Email already verified',
      details: verificationStatus.details
    };
  }
  
  // Start verification process
  const verificationResult = await sendVerificationEmail(email);
  return {
    ...verificationResult,
    verified: false,
    verificationPending: true
  };
} 