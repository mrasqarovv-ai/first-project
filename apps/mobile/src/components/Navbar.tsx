import React from 'react';
import { useApp } from '../context/AppContext.js';
import { APP_CONFIG } from '../config.js';
import { Sparkles, Globe, User, LogOut, ArrowLeft } from 'lucide-react';

interface NavbarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  title?: string;
  showBack?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentScreen, onNavigate, title, showBack }) => {
  const { language, setLanguage, user, role, setRole, logout, t } = useApp();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {showBack ? (
          <button
            onClick={() => onNavigate('home')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              borderRadius: '8px',
              color: 'var(--text)',
            }}
          >
            <ArrowLeft size={22} />
          </button>
        ) : null}

        <div
          onClick={() => onNavigate('home')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px', color: '#0f172a' }}>
              {APP_CONFIG.name}
            </div>
            {title ? (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{title}</div>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Language switcher */}
        <button
          onClick={() => setLanguage(language === 'kk' ? 'ru' : 'kk')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            backgroundColor: '#f8fafc',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            color: 'var(--text)',
          }}
          title="Тілді ауыстыру / Сменить язык"
        >
          <Globe size={14} color="#4f46e5" />
          {language === 'kk' ? '🇰🇿 ҚАЗ' : '🇷🇺 РУС'}
        </button>

        {/* Role toggle button */}
        <button
          onClick={() => {
            const nextRole = role === 'TEACHER' ? 'STUDENT' : 'TEACHER';
            setRole(nextRole);
          }}
          style={{
            padding: '6px 12px',
            borderRadius: '20px',
            border: 'none',
            backgroundColor: role === 'TEACHER' ? '#e0e7ff' : '#d1fae5',
            color: role === 'TEACHER' ? '#4338ca' : '#065f46',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title={t('roles.switchRole', 'Рөлді ауыстыру')}
        >
          <User size={13} />
          {role === 'TEACHER' ? '👨‍🏫 Мұғалім' : '👨‍🎓 Оқушы'}
        </button>

        {/* User profile / Logout */}
        {user ? (
          <button
            onClick={logout}
            style={{
              padding: '6px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title={t('nav.logout', 'Шығу')}
          >
            <LogOut size={16} />
          </button>
        ) : (
          <button
            onClick={() => onNavigate('auth')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t('nav.login', 'Кіру')}
          </button>
        )}
      </div>
    </header>
  );
};
