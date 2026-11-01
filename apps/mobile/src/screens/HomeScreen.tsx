import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import { Sparkles, Play, BookOpen, KeyRound, BarChart2, CheckCircle2 } from 'lucide-react';
import { APP_CONFIG } from '../config.js';

interface HomeScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { role, setRole, user, t } = useApp();
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const handleJoinPin = () => {
    const clean = pinInput.trim();
    if (clean.length < 5) {
      setPinError('Кемінде 5-6 таңбалы кодты енгізіңіз');
      return;
    }
    setPinError('');
    onNavigate('play', { pinCode: clean });
  };

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Hero card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: '18px',
          padding: '24px 20px',
          color: '#ffffff',
          boxShadow: 'var(--shadow)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Sparkles size={12} />
            {APP_CONFIG.name} AI Constructor
          </span>
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.3, marginBottom: '8px' }}>
          {role === 'TEACHER'
            ? t('home.teacherHeroTitle', 'Оқу мәтінінен 1 минутта интерактивті ойын жасаңыз')
            : t('home.studentHeroTitle', 'Ойын арқылы біліміңді шыңда!')}
        </h1>

        <p style={{ fontSize: '13px', opacity: 0.85, lineHeight: 1.5, marginBottom: '18px' }}>
          {role === 'TEACHER'
            ? t(
                'home.teacherHeroDesc',
                'Кез келген сабақ конспектісін енгізіп, сыныбыңызға арналған викторина, сәйкестендіру немесе реттеу ойынын ЖИ арқылы құрастырыңыз.'
              )
            : t(
                'home.studentHeroDesc',
                'Мұғалім берген 6 таңбалы кодпен ойынға қосыл немесе өз конспектіңнен жеке жаттығу жаса.'
              )}
        </p>

        {/* Quick action button in Hero */}
        {role === 'TEACHER' ? (
          <button
            onClick={() => onNavigate('wizard')}
            style={{
              backgroundColor: '#ffffff',
              color: '#312e81',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 18px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <Sparkles size={18} color="#4f46e5" />
            {t('home.startCreateBtn', '✨ Жаңа ойын жасау')}
          </button>
        ) : (
          <button
            onClick={() => onNavigate('wizard')}
            style={{
              backgroundColor: '#ffffff',
              color: '#312e81',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 18px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <Sparkles size={18} color="#4f46e5" />
            {t('home.selfPracticeBtn', '💡 Өзіме жаттығу жасау')}
          </button>
        )}
      </div>

      {/* Quick PIN Code Entry Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '18px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <KeyRound size={20} color="#4f46e5" />
          <h2 style={{ fontSize: '16px', fontWeight: 800 }}>
            {t('nav.joinPin', 'Кодпен ойынға қосылу')}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6 таңбалы код (мыс: 718293)"
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value);
              setPinError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJoinPin();
            }}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: '12px',
              border: pinError ? '2px solid var(--danger)' : '1px solid var(--border)',
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '2px',
              textAlign: 'center',
              outline: 'none',
              backgroundColor: '#f8fafc',
            }}
          />
          <button
            onClick={handleJoinPin}
            style={{
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Play size={16} />
            Кіру
          </button>
        </div>

        {pinError ? (
          <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>
            {pinError}
          </div>
        ) : null}

        {/* Demo PIN hints */}
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed var(--border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
            Дайын сынақ ойындарының кодтары:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setPinInput('718293');
                onNavigate('play', { pinCode: '718293' });
              }}
              style={{
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              🎯 Викторина (718293)
            </button>
            <button
              onClick={() => {
                setPinInput('452819');
                onNavigate('play', { pinCode: '452819' });
              }}
              style={{
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              🧩 Сәйкестендіру (452819)
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {role === 'TEACHER' ? (
          <>
            <div
              onClick={() => onNavigate('myGames')}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={20} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>{t('home.myLibraryBtn', 'Менің ойындарым')}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ойындар, кодтар мен басқару</div>
            </div>

            <div
              onClick={() => onNavigate('analytics', { gameId: 'mock-g1' })}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart2 size={20} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>{t('nav.results', 'Нәтижелер')}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Сынып көрсеткіштері мен қателер</div>
            </div>
          </>
        ) : (
          <>
            <div
              onClick={() => onNavigate('wizard')}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={20} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>Жеке жаттығу</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Өз конспектіңнен ойын жаса</div>
            </div>

            <div
              onClick={() => onNavigate('play', { pinCode: '718293' })}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#d1fae5',
                  color: '#065f46',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={20} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>Сынақ ойыны</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Қазақ хандығы викторинасы</div>
            </div>
          </>
        )}
      </div>

      {/* Product Feature Highlights */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '18px',
          border: '1px solid var(--border)',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-muted)' }}>
          ҚОЛЖЕТІМДІ ОЙЫН ТҮРЛЕРІ
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🎯</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>1. Викторина (Quiz)</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Бір дұрыс жауап, нұсқалар араластырылады, тұрақты бағалау
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🧩</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>2. Сәйкестендіру (Matching)</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Екі бағанды түрту арқылы жұптастыру, жұпты өзгерту мүмкіндігі
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🔢</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>3. Ретке орналастыру (Ordering)</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Хронология немесе алгоритм ретін жоғары-төмен батырмаларымен реттеу
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
