import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedDonor = localStorage.getItem('donor');
    const savedHospital = localStorage.getItem('hospital');
    if (savedDonor) {
      try { return { ...JSON.parse(savedDonor), role: 'donor' }; } catch (e) {}
    }
    if (savedHospital) {
      try { return { ...JSON.parse(savedHospital), role: 'hospital' }; } catch (e) {}
    }
    return null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('lifelink_token') || null);

  const login = (userData, authToken, role) => {
    const enrichedUser = { ...userData, role };
    setUser(enrichedUser);
    setToken(authToken);
    localStorage.setItem('lifelink_token', authToken);
    if (role === 'donor') {
      localStorage.setItem('donor', JSON.stringify(userData));
      localStorage.removeItem('hospital');
    } else {
      localStorage.setItem('hospital', JSON.stringify(userData));
      localStorage.removeItem('donor');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('lifelink_token');
    localStorage.removeItem('donor');
    localStorage.removeItem('hospital');
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      const next = { ...prev, ...updatedFields };
      if (next.role === 'donor') {
        localStorage.setItem('donor', JSON.stringify(next));
      } else if (next.role === 'hospital') {
        localStorage.setItem('hospital', JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, role: user?.role, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
