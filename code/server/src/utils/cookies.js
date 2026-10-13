/**
 * Utility functions for setting and clearing secure HttpOnly auth cookies.
 */

export const setAuthCookies = (res, access_token, refresh_token) => {
  const isProd = process.env.NODE_ENV === 'production';
  
  if (access_token) {
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 3600000 // 1 hour
    });
  }

  if (refresh_token) {
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600000 // 7 days
    });
  }
};

export const clearAuthCookies = (res) => {
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
