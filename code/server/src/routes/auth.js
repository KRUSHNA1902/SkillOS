import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

const setCookies = (res, access_token, refresh_token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('access_token', access_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 3600000 // 1 hour
  });
  res.cookie('refresh_token', refresh_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 3600000 // 7 days
  });
};

const clearCookies = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
  });
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
  });
};

// Register
router.post('/register', async (req, res) => {
  const { email, password, fullName, phone } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password, and Full Name are required' });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone || null,
      }
    }
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // If Supabase is configured to require email confirmation, session might be null.
  if (data.session) {
    setCookies(res, data.session.access_token, data.session.refresh_token);
  }

  return res.json({ user: data.user, message: 'Registration successful' });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    return res.status(401).json({ error: error.message });
  }
  
  setCookies(res, data.session.access_token, data.session.refresh_token);
  return res.json({ user: data.user });
});

// Logout
router.post('/logout', (req, res) => {
  clearCookies(res);
  return res.json({ message: 'Logged out successfully' });
});

// Get current user (protected route)
router.get('/me', requireAuth, (req, res) => {
  // requireAuth middleware attaches req.user
  return res.json({ user: req.user });
});

export default router;
