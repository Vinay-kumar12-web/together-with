import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,  setUser]  = useState(() => JSON.parse(localStorage.getItem('tw_user'))  || null);
  const [token, setToken] = useState(() => localStorage.getItem('tw_token') || null);

  const login = (userData, tok) => {
    localStorage.setItem('tw_user',  JSON.stringify(userData));
    localStorage.setItem('tw_token', tok);
    setUser(userData);
    setToken(tok);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
  };

  const authFetch = (url, options = {}) => {
    return fetch(`${process.env.REACT_APP_API_URL}${url}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
