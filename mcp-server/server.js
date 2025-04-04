// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { handleEmailVerification, verifyToken, isEmailVerified } from './scripts/email.js';
import { handleTransaction } from './scripts/wallet.js';

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

// Transaction endpoint
app.post('/transaction', async (req, res) => {
  const result = await handleTransaction(req.body);
  return res.json(result);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
