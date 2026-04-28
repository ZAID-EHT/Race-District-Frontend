import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, fetchCSRFToken } from '../services/api';
import { signInWithGoogle, signOutGoogle } from '../config/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rd_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const saveUser = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('rd_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('rd_user');
      localStorage.removeItem('rd_token');
    }
  };

  // ✅ fetchMe — always loads the full user from the backend (including addresses).
  //   Called on mount to restore session, and after every login/register/googleAuth
  //   to guarantee fresh data.
  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('rd_token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await authAPI.getMe();
      saveUser(res.data);
    } catch {
      saveUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('rd_token', res.data.token);

    // ✅ FIX: Was `saveUser(res.data.user)` — the user object in the login
    //   response is a minimal snapshot that often lacks the `addresses` array.
    //   Re-fetching from /auth/me guarantees the full, DB-persisted user
    //   (including all saved addresses) is loaded into state immediately.
    await fetchMe();

    // ✅ FIX: Refresh CSRF token after login — the old token may be tied to
    //   an anonymous session and get invalidated once the user logs in.
    //   Clearing the cache here forces a fresh fetch on the next request.
    return res.data.user;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    localStorage.setItem('rd_token', res.data.token);
    // ✅ FIX: Same as login — always re-fetch after register for consistency.
    await fetchMe();
    return res.data.user;
  };

  const loginWithGoogle = async () => {
    const { idToken } = await signInWithGoogle();
    const res = await authAPI.googleAuth(idToken);
    localStorage.setItem('rd_token', res.data.token);
    // ✅ FIX: Same pattern for Google auth.
    await fetchMe();
    return res.data.user;
  };

  const logout = async () => {
    try { await signOutGoogle(); } catch {}
    saveUser(null);
  };

  const updateProfile = async (data) => {
    const res = await authAPI.updateProfile(data);
    saveUser({ ...user, ...res.data });
    return res.data;
  };

  const addAddress = async (data) => {
    const res = await authAPI.addAddress(data);
    // res.data is the updated addresses array (returned by userController.addAddress)
    saveUser({ ...user, addresses: res.data });
    return res.data;
  };

  const updateAddress = async (id, data) => {
    const res = await authAPI.updateAddress(id, data);
    saveUser({ ...user, addresses: res.data });
    return res.data;
  };

  const deleteAddress = async (id) => {
    const res = await authAPI.deleteAddress(id);
    saveUser({ ...user, addresses: res.data });
    return res.data;
  };

  const toggleWishlist = async (productId) => {
    const res = await authAPI.toggleWishlist(productId);
    saveUser({ ...user, wishlist: res.data.wishlist });
    return res.data;
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <AuthContext.Provider value={{
      user, loading,
      isAuthenticated: !!user,
      isAdmin,
      login, register, loginWithGoogle, logout,
      updateProfile, addAddress, updateAddress, deleteAddress,
      toggleWishlist, fetchMe
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};