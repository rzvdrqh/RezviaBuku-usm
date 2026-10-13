import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface AdminProfile {
  email: string;
  name: string;
  role: string;
  photoUrl?: string;
}

interface AuthContextType {
  isAdmin: boolean;
  adminUser: AdminProfile | null;
  loginWithCredentials: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  quickDemoLogin: () => void;
  signInWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = 'pustakavia_admin_auth_v2';
const ADMIN_AUTHORIZED_EMAILS = ['rezviaadr@gmail.com', 'admin@pustakavia.com'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [adminUser, setAdminUser] = useState<AdminProfile | null>(() => {
    try {
      const saved = localStorage.getItem(`${ADMIN_STORAGE_KEY}_user`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Sync state changes with localStorage
  useEffect(() => {
    try {
      if (isAdmin && adminUser) {
        localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
        localStorage.setItem(`${ADMIN_STORAGE_KEY}_user`, JSON.stringify(adminUser));
      } else {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
        localStorage.removeItem(`${ADMIN_STORAGE_KEY}_user`);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [isAdmin, adminUser]);

  // Firebase auth state change listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user && user.email) {
        const isAuthAdmin =
          ADMIN_AUTHORIZED_EMAILS.includes(user.email.toLowerCase()) ||
          user.email.toLowerCase().includes('admin');
        if (isAuthAdmin) {
          setIsAdmin(true);
          setAdminUser({
            email: user.email,
            name: user.displayName || 'Administrator PustakaVia',
            role: 'Super Admin',
            photoUrl: user.photoURL || undefined,
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const loginWithCredentials = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (
      (cleanEmail === 'rezviaadr@gmail.com' && pass.length >= 4) ||
      (cleanEmail === 'admin@pustakavia.com' && pass === 'admin123') ||
      (cleanEmail.includes('admin') && pass.length >= 4)
    ) {
      const profile: AdminProfile = {
        email: cleanEmail,
        name: cleanEmail === 'rezviaadr@gmail.com' ? 'Rezvia (Super Admin PustakaVia)' : 'Admin PustakaVia',
        role: 'Super Admin',
      };
      setIsAdmin(true);
      setAdminUser(profile);
      setIsLoginModalOpen(false);
      return { success: true };
    }
    return {
      success: false,
      message: 'Email atau password salah. Coba gunakan: rezviaadr@gmail.com atau admin@pustakavia.com',
    };
  };

  const quickDemoLogin = () => {
    const profile: AdminProfile = {
      email: 'rezviaadr@gmail.com',
      name: 'Rezvia (Admin PustakaVia)',
      role: 'Super Admin',
    };
    setIsAdmin(true);
    setAdminUser(profile);
    setIsLoginModalOpen(false);
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user && user.email) {
        const profile: AdminProfile = {
          email: user.email,
          name: user.displayName || 'Admin Toko',
          role: 'Super Admin',
          photoUrl: user.photoURL || undefined,
        };
        setIsAdmin(true);
        setAdminUser(profile);
        setIsLoginModalOpen(false);
        return { success: true };
      }
      return { success: false, message: 'Gagal mendapatkan data akun Google' };
    } catch (err) {
      console.error('Google Sign In error:', err);
      // Fallback for popup blocked or cancellation: provide direct sign-in feedback
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Login Google dibatalkan atau terhalang popup.',
      };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout note:', e);
    }
    setIsAdmin(false);
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        adminUser,
        loginWithCredentials,
        quickDemoLogin,
        signInWithGoogle,
        logout,
        isLoginModalOpen,
        setIsLoginModalOpen,
      }}
    >
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
