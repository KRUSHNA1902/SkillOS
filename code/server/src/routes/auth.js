import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Normalizes Supabase user object into SkillOS User model
 */
export const formatUser = (supabaseUser) => {
  if (!supabaseUser) return null;
  const metadata = supabaseUser.user_metadata || {};
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    fullName: metadata.full_name || metadata.name || (supabaseUser.email ? supabaseUser.email.split('@')[0] : 'Learner'),
    role: metadata.role || 'Member',
    department: metadata.department || '',
    phone: metadata.phone || '',
    bio: metadata.bio || '',
    avatarUrl: metadata.avatar_url || metadata.picture || '',
    skills: metadata.skills || [],
    emailConfirmed: !!(supabaseUser.email_confirmed_at || supabaseUser.confirmed_at),
    user_metadata: metadata,
  };
};

const setCookies = (res, access_token, refresh_token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('access_token', access_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 3600000 // 1 hour
  });
  if (refresh_token) {
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600000 // 7 days
    });
  }
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
router.post('/register', authLimiter, async (req, res) => {
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

  const hasSession = !!data.session;
  if (hasSession) {
    setCookies(res, data.session.access_token, data.session.refresh_token);
  }

  const formattedUser = formatUser(data.user);
  return res.json({ 
    user: formattedUser, 
    session: hasSession,
    requiresConfirmation: !hasSession,
    message: hasSession 
      ? 'Registration successful' 
      : 'Account created! Please check your email inbox to confirm your account before logging in.'
  });
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    if (error.message?.toLowerCase().includes('email not confirmed')) {
      return res.status(401).json({ 
        error: 'Email not confirmed. Please check your inbox or disable "Confirm email" in your Supabase dashboard.' 
      });
    }
    return res.status(401).json({ error: error.message });
  }
  
  if (data.session) {
    setCookies(res, data.session.access_token, data.session.refresh_token);
  }

  return res.json({ 
    user: formatUser(data.user), 
    session: true 
  });
});

// Initiate Google OAuth flow
router.get('/oauth/google', async (req, res) => {
  try {
    const clientUrl = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${clientUrl}/auth/callback`,
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ url: data.url });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to initialize Google OAuth' });
  }
});

// Set session from OAuth callback tokens
router.post('/session', async (req, res) => {
  try {
    const { access_token, refresh_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ error: 'access_token is required' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(access_token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    setCookies(res, access_token, refresh_token || '');
    return res.json({ user: formatUser(user), session: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to process session' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  clearCookies(res);
  return res.json({ message: 'Logged out successfully' });
});

// Get current user (protected route)
router.get('/me', requireAuth, (req, res) => {
  // requireAuth middleware attaches req.user
  return res.json({ user: formatUser(req.user) });
});

export default router;
