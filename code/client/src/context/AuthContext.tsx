import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  // add other fields from Supabase if needed
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  loginAsDev: (devUser?: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const DEV_STORAGE_KEY = 'skillos_dev_user';

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

  useEffect(() => {
    // If dev user already active in local dev, avoid overriding unless logged out
    if (user && import.meta.env.DEV && localStorage.getItem(DEV_STORAGE_KEY)) {
      setLoading(false);
      return;
    }

    // Check if user is logged in on mount
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: 'include'
        });
        if (response.ok) {
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

    fetchUser();
  }, []);

  const loginAsDev = (customDev?: Partial<User>) => {
    const devUser: User = {
      id: customDev?.id || 'dev-user-001',
      email: customDev?.email || 'dev@skillos.local',
      ...customDev,
    };
    if (import.meta.env.DEV) {
      localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(devUser));
    }
    setUser(devUser);
  };

  const logout = async () => {
    try {
      if (import.meta.env.DEV) {
        localStorage.removeItem(DEV_STORAGE_KEY);
      }
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
    <AuthContext.Provider value={{ user, loading, setUser, logout, loginAsDev }}>
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
