import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
  department?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  accentColor?: string;
  avatarType?: 'icon' | 'initials';
  avatarIcon?: string;
  settings?: {
    compactMode?: boolean;
    emailAlerts?: boolean;
    aiSuggestions?: boolean;
    workflowAlerts?: boolean;
    theme?: 'light' | 'dark' | 'system' | 'contrast';
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  updateUser: (updatedData: Partial<User>) => void;
  logout: () => Promise<void>;
  loginAsDev: (devUser?: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const DEV_STORAGE_KEY = 'skillos_dev_user';

const authChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('skillos_auth_sync')
  : null;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (import.meta.env.DEV) {
      try {
        const stored = localStorage.getItem(DEV_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
      } catch (err) {
        console.error('Error reading dev user from storage:', err);
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(!user);

  const initAuth = async () => {
    // 1. Check if OAuth callback tokens are in URL hash (e.g. from Google sign-in redirect)
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      try {
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        // Immediately strip tokens from the URL and browser history before async processing
        window.history.replaceState(null, '', window.location.pathname);

        if (access_token) {
          const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token, refresh_token }),
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            if (import.meta.env.DEV) {
              localStorage.removeItem(DEV_STORAGE_KEY);
            }
            setUser(data.user);
            authChannel?.postMessage({ type: 'LOGIN', userId: data.user.id });
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error handling OAuth callback:', err);
      }
    }

    // 2. Otherwise check session via /api/auth/me cookie
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: 'include'
      });
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        setUser(data.user);
      } else {
        if (!localStorage.getItem(DEV_STORAGE_KEY)) {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      if (!localStorage.getItem(DEV_STORAGE_KEY)) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If dev user already active in local dev, avoid overriding unless logged out
    if (user && import.meta.env.DEV && localStorage.getItem(DEV_STORAGE_KEY)) {
      setLoading(false);
      return;
    }

    initAuth();
  }, []);

  // Listen for cross-tab auth state synchronizations
  useEffect(() => {
    if (!authChannel) return;
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LOGOUT') {
        if (import.meta.env.DEV) {
          localStorage.removeItem(DEV_STORAGE_KEY);
        }
        setUser(null);
      } else if (event.data?.type === 'LOGIN') {
        initAuth();
      }
    };
    authChannel.addEventListener('message', handleAuthMessage);
    return () => {
      authChannel.removeEventListener('message', handleAuthMessage);
    };
  }, []);

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged: User = {
        ...prev,
        ...updatedData,
        settings: {
          ...prev.settings,
          ...updatedData.settings,
        },
      };
      if (import.meta.env.DEV) {
        try {
          localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(merged));
        } catch (err) {
          console.error('Error saving updated user to localStorage:', err);
        }
      }
      return merged;
    });
  };

  const loginAsDev = (customDev?: Partial<User>) => {
    const devUser: User = {
      id: customDev?.id || 'dev-user-001',
      email: customDev?.email || 'developer@skillos.local',
      fullName: customDev?.fullName || 'Developer',
      role: customDev?.role || 'Lead Engineer',
      department: customDev?.department || 'Engineering Org',
      phone: customDev?.phone || '+1 (555) 019-2834',
      bio: customDev?.bio || 'Full stack engineer building intelligent workflow operating systems.',
      skills: customDev?.skills || ['TypeScript', 'React', 'Tailwind', 'AI Agents', 'Supabase'],
      accentColor: customDev?.accentColor || 'amber',
      avatarType: customDev?.avatarType || 'icon',
      avatarIcon: customDev?.avatarIcon || 'user',
      settings: {
        compactMode: false,
        emailAlerts: true,
        aiSuggestions: true,
        workflowAlerts: true,
        theme: 'light',
        ...customDev?.settings,
      },
      ...customDev,
    };
    if (import.meta.env.DEV) {
      localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(devUser));
    }
    setUser(devUser);
    authChannel?.postMessage({ type: 'LOGIN', userId: devUser.id });
  };

  const logout = async () => {
    try {
      if (import.meta.env.DEV) {
        localStorage.removeItem(DEV_STORAGE_KEY);
      }
      authChannel?.postMessage({ type: 'LOGOUT' });
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, updateUser, logout, loginAsDev }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
