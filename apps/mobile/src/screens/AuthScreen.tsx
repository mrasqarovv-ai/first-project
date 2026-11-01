import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import { api } from '../api/client.js';
import { User, Lock, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface AuthScreenProps {
  onNavigate: (screen: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onNavigate }) => {
  const { login, role, setRole, t } = useApp();
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'TEACHER' | 'STUDENT'>('TEACHER');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Барлық өрістерді толтырыңыз');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'LOGIN') {
        const res = await api.login(email, password);
        login(res.token, res.user);
        onNavigate('home');
      } else {
        if (!name) {
          setError('Аты-жөніңізді енгізіңіз');
          setLoading(false);
          return;
        }
        const res = await api.register({
          email,
          password,
          name,
          role: selectedRole,
        });
        login(res.token, res.user);
        onNavigate('home');
      }
    } catch (err: any) {
      setError(err.message || 'Қате орын алды');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole: 'TEACHER' | 'STUDENT') => {
    setLoading(true);
    try {
      const demoEmail = demoRole === 'TEACHER' ? 'teacher@oquplay.kz' : 'student@oquplay.kz';
      const res = await api.login(demoEmail, 'oquplay123');
      login(res.token, res.user);
      onNavigate('home');
    } catch {
      setError('Демо кіру сәтсіз');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 18px', maxWidth: '440px', margin: '0 auto', width: '100%' }}>
      {/* Back button */}
      <button
        onClick={() => onNavigate('home')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          fontWeight: 700,
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        <ArrowLeft size={18} />
        {t('home.startCreateBtn', 'Артқа')}
      </button>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>
          {tab === 'LOGIN' ? t('nav.login', 'Жүйеге кіру') : t('nav.register', 'Тіркелу')}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          OquPlay AI интерактивті тапсырмалар конструкторына қош келдіңіз
        </p>
      </div>

      {/* Role Picker */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          backgroundColor: '#f1f5f9',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '18px',
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedRole('TEACHER')}
          style={{
            padding: '10px',
            border: 'none',
            borderRadius: '10px',
            backgroundColor: selectedRole === 'TEACHER' ? '#ffffff' : 'transparent',
            color: selectedRole === 'TEACHER' ? '#4f46e5' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: selectedRole === 'TEACHER' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          👨‍🏫 Мұғалім
        </button>
        <button
          type="button"
          onClick={() => setSelectedRole('STUDENT')}
          style={{
            padding: '10px',
            border: 'none',
            borderRadius: '10px',
            backgroundColor: selectedRole === 'STUDENT' ? '#ffffff' : 'transparent',
            color: selectedRole === 'STUDENT' ? '#10b981' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: selectedRole === 'STUDENT' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          👨‍🎓 Оқушы
        </button>
      </div>

      {/* Tab toggle: Login / Register */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setTab('LOGIN')}
          style={{
            flex: 1,
            padding: '10px',
            background: 'none',
            border: 'none',
            borderBottom: tab === 'LOGIN' ? '3px solid #4f46e5' : '3px solid transparent',
            color: tab === 'LOGIN' ? '#4f46e5' : 'var(--text-muted)',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '-2px',
          }}
        >
          {t('nav.login', 'Кіру')}
        </button>
        <button
          type="button"
          onClick={() => setTab('REGISTER')}
          style={{
            flex: 1,
            padding: '10px',
            background: 'none',
            border: 'none',
            borderBottom: tab === 'REGISTER' ? '3px solid #4f46e5' : '3px solid transparent',
            color: tab === 'REGISTER' ? '#4f46e5' : 'var(--text-muted)',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '-2px',
          }}
        >
          {t('nav.register', 'Тіркелу')}
        </button>
      </div>

      {error ? (
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {tab === 'REGISTER' ? (
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              Толық аты-жөніңіз
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                color="#94a3b8"
                style={{ position: 'absolute', left: '12px', top: '13px' }}
              />
              <input
                type="text"
                placeholder="Мысалы: Айгүл Серікқызы"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 38px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        ) : null}

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
            Email мекенжайы
          </label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={18}
              color="#94a3b8"
              style={{ position: 'absolute', left: '12px', top: '13px' }}
            />
            <input
              type="email"
              placeholder="example@mail.kz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 38px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
            Құпиясөз
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={18}
              color="#94a3b8"
              style={{ position: 'absolute', left: '12px', top: '13px' }}
            />
            <input
              type="password"
              placeholder="Кемінде 6 таңба"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 38px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '14px',
            fontSize: '15px',
            fontWeight: 800,
            cursor: 'pointer',
            marginTop: '8px',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
          }}
        >
          {loading ? 'Жүктелуде...' : tab === 'LOGIN' ? 'Кіру' : 'Тіркелу'}
        </button>
      </form>

      {/* Quick Demo Login Helpers */}
      <div style={{ marginTop: '28px', borderTop: '1px dashed var(--border)', paddingTop: '18px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', textAlign: 'center' }}>
          НЕМЕСЕ БІР БАСУМЕН ТЕСТТІК АККАУНТҚА КІРІҢІЗ:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleQuickDemo('TEACHER')}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #c7d2fe',
              backgroundColor: '#eef2ff',
              color: '#3730a3',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            👨‍🏫 Мұғалім аккаунтымен кіру (teacher@oquplay.kz)
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('STUDENT')}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #a7f3d0',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            👨‍🎓 Оқушы аккаунтымен кіру (student@oquplay.kz)
          </button>
        </div>
      </div>
    </div>
  );
};
