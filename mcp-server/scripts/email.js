// backend/scripts/email.js
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Store verification tokens with expiry times
const verificationTokens = new Map();

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