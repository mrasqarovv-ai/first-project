import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, UserProfile, UserRole } from '@oquplay/shared';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  user: UserProfile | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  token: string | null;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  t: (path: string, fallback?: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('oquplay_lang');
      if (saved === 'ru' || saved === 'kk') return saved;
    } catch {}
    return 'kk';
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('oquplay_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('oquplay_token');
    } catch {
      return null;
    }
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    if (user?.role) return user.role;
    try {
      const savedRole = localStorage.getItem('oquplay_role');
      if (savedRole === 'TEACHER' || savedRole === 'STUDENT' || savedRole === 'GUEST') return savedRole;
    } catch {}
    return 'TEACHER';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('oquplay_lang', lang);
    } catch {}
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    try {
      localStorage.setItem('oquplay_role', newRole);
    } catch {}
  };

  const login = (newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    setRoleState(newUser.role);
    try {
      localStorage.setItem('oquplay_token', newToken);
      localStorage.setItem('oquplay_user', JSON.stringify(newUser));
      localStorage.setItem('oquplay_role', newUser.role);
    } catch {}
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRoleState('GUEST');
    try {
      localStorage.removeItem('oquplay_token');
      localStorage.removeItem('oquplay_user');
      localStorage.removeItem('oquplay_role');
    } catch {}
  };

  // Safe nested translation lookup
  const t = (path: string, fallback?: string): string => {
    const dict = translations[language] as any;
    const parts = path.split('.');
    let current = dict;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return fallback || path;
      }
    }
    return typeof current === 'string' ? current : fallback || path;
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        user,
        role,
        setRole,
        token,
        login,
        logout,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
