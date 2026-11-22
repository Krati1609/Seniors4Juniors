import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    async function initAuth() {
      try {
        // Fetch CSRF token first
        await api.get('/auth/csrf');
        // Fetch current user if session cookie is present
        const res = await api.get('/auth/me');
        if (res.data?.user) {
          setUser(res.data.user);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email, password) => {
    // Ensure CSRF token is available
    await api.get('/auth/csrf');
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.user) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const registerJunior = async (juniorData) => {
    await api.get('/auth/csrf');
    const res = await api.post('/auth/register/junior', juniorData);
    if (res.data?.user) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const registerSenior = async (seniorData) => {
    await api.get('/auth/csrf');
    const res = await api.post('/auth/register/senior', seniorData);
    if (res.data?.user) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Continue wiping local state even if server returns error
    } finally {
      setUser(null);
    }
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerJunior,
        registerSenior,
        logout,
        updateUser,
        refreshUser,
        isAuthenticated: !!user,
        isJunior: user?.role === 'junior',
        isSenior: user?.role === 'senior',
        isAdmin: user?.role === 'admin',
        isVerifiedSenior: user?.role === 'senior' && user?.is_verified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
