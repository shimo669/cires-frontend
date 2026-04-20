import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LoginRequest, RegisterRequest, User } from '../types/auth';
import * as authApi from '../api/authApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
}

interface StoredUser {
  username: string;
  role: User['role'];
  email: string;
  nationalId: string;
  locationId?: number | null;
  locationName?: string | null;
  fullRwandanAddress?: string | null;
  levelType?: string;
}

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredUser = (): User | null => {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredUser;
    return {
      username: parsed.username,
      role: parsed.role,
      email: parsed.email,
      nationalId: parsed.nationalId,
      locationId: parsed.locationId,
      locationName: parsed.locationName,
      fullRwandanAddress: parsed.fullRwandanAddress,
      levelType: parsed.levelType,
    };
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  const login = async (credentials: LoginRequest): Promise<User> => {
    setIsLoading(true);

    try {
      const response = await authApi.login(credentials);

      if (!response.token) {
        throw new Error('Login response does not include a token.');
      }

      const nextUser: User = {
        username: response.username,
        role: response.role,
        email: response.email,
        nationalId: response.nationalId,
        locationId: response.locationId,
        locationName: response.locationName,
        fullRwandanAddress: response.fullRwandanAddress,
        levelType: response.levelType ?? user?.levelType,
      };

      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));

      setToken(response.token);
      setUser(nextUser);

      return nextUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    setIsLoading(true);

    try {
      await authApi.register(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      register,
      logout,
    }),
    [user, token, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};