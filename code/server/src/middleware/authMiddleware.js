import { supabase } from '../supabaseClient.js';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies.js';

/**
 * Authentication middleware with automatic Silent Token Refresh.
 * 1. Checks access_token. If valid -> attaches req.user and proceeds.
 * 2. If access_token is expired or missing, attempts silent refresh using refresh_token.
 * 3. If refresh succeeds -> updates cookies, attaches req.user and proceeds seamlessly.
 * 4. If refresh fails or neither token exists -> clears cookies and returns 401.
 */
export const requireAuth = async (req, res, next) => {
  const accessToken = req.cookies?.access_token || req.headers?.authorization?.replace('Bearer ', '');
  const refreshToken = req.cookies?.refresh_token;

  // Development bypass check for local development
  if (process.env.NODE_ENV !== 'production') {
    if (req.headers['x-dev-user'] === 'dev-user-001' || req.cookies?.dev_user === 'dev-user-001') {
      req.user = { id: 'dev-user-001', email: 'developer@skillos.local', role: 'Developer' };
      return next();
    }
  }

  // 1. Check existing access token
  if (accessToken) {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!error && user) {
      req.user = user;
      return next();
    }
  }

  // 2. Access token missing or expired: Attempt silent refresh
  if (refreshToken) {
    try {
      const { data, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (!refreshError && data?.session && data?.user) {
        // Update browser cookies with fresh tokens
        setAuthCookies(res, data.session.access_token, data.session.refresh_token);
        req.user = data.user;
        return next();
      }
    } catch (err) {
      console.error('[AuthMiddleware] Error during silent token refresh:', err);
    }
  }

  // 3. Both tokens missing or expired: wipe cookies and reject
  clearAuthCookies(res);
  return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
};
