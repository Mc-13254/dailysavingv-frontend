import { createContext, useContext, useState, useCallback } from 'react';
import { AuthAPI } from '../api/endpoints';
import { setTokens, clearTokens } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('dsv_user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (username, password) => {
    const { data } = await AuthAPI.login(username, password);
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    const userInfo = {
      codeUser: data.codeUser,
      username: data.username,
      roleCode: data.roleCode,
      agenceID: data.agenceID,
      agenceNom: data.agenceNom,
    };
    localStorage.setItem('dsv_user', JSON.stringify(userInfo));
    setUser(userInfo);
    return userInfo;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('dsv_refresh_token');
    try { if (refreshToken) await AuthAPI.logout(refreshToken); } catch { /* ignore */ }
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
