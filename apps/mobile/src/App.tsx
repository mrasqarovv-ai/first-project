import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.js';
import { Navbar } from './components/Navbar.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { AuthScreen } from './screens/AuthScreen.js';
import { CreateWizardScreen } from './screens/CreateWizardScreen.js';
import { EditorScreen } from './screens/EditorScreen.js';
import { MyGamesScreen } from './screens/MyGamesScreen.js';
import { PlayScreen } from './screens/PlayScreen.js';
import { ResultScreen } from './screens/ResultScreen.js';
import { TeacherAnalyticsScreen } from './screens/TeacherAnalyticsScreen.js';
import { GameSnapshot, GameAttemptResult } from '@oquplay/shared';
import { Home, Sparkles, BookOpen, BarChart2 } from 'lucide-react';
import { DEMO_QUIZ_KK } from '../api/src/ai/demo-templates.js';

const MainApp: React.FC = () => {
  const { role, t } = useApp();

  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [screenParams, setScreenParams] = useState<any>({});

  // Active snapshot being edited or created
  const [activeSnapshot, setActiveSnapshot] = useState<GameSnapshot>(DEMO_QUIZ_KK);

  // Completed student attempt result
  const [lastAttemptResult, setLastAttemptResult] = useState<GameAttemptResult | null>(null);

  const navigate = (screen: string, params: any = {}) => {
    setCurrentScreen(screen);
    setScreenParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditSnapshot = (snapshot: GameSnapshot) => {
    setActiveSnapshot(snapshot);
  };

  const handleFinishAttempt = (result: GameAttemptResult) => {
    setLastAttemptResult(result);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '70px' }}>
      {/* Top Navbar */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={navigate}
        showBack={currentScreen !== 'home'}
      />

      {/* Screen Router */}
      <main style={{ flex: 1 }}>
        {currentScreen === 'home' && <HomeScreen onNavigate={navigate} />}

        {currentScreen === 'auth' && <AuthScreen onNavigate={navigate} />}

        {currentScreen === 'wizard' && (
          <CreateWizardScreen
            onNavigate={navigate}
            onEditSnapshot={handleEditSnapshot}
          />
        )}

        {currentScreen === 'editor' && (
          <EditorScreen
            snapshot={activeSnapshot}
            onUpdateSnapshot={setActiveSnapshot}
            onNavigate={navigate}
          />
        )}

        {currentScreen === 'myGames' && (
          <MyGamesScreen
            onNavigate={navigate}
            onEditGame={(gameId) => navigate('editor', { gameId })}
          />
        )}

        {currentScreen === 'play' && (
          <PlayScreen
            pinCode={screenParams.pinCode || '718293'}
            onNavigate={navigate}
            onFinishAttempt={handleFinishAttempt}
          />
        )}

        {currentScreen === 'result' && lastAttemptResult && (
          <ResultScreen
            result={lastAttemptResult}
            onNavigate={navigate}
            onRetry={() => navigate('play', { pinCode: screenParams.pinCode || '718293' })}
          />
        )}

        {currentScreen === 'analytics' && (
          <TeacherAnalyticsScreen
            gameId={screenParams.gameId || 'mock-g1'}
            onNavigate={navigate}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '600px',
          backgroundColor: '#ffffff',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '8px 0',
          zIndex: 50,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.04)',
        }}
      >
        <button
          onClick={() => navigate('home')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: currentScreen === 'home' ? '#4f46e5' : '#64748b',
            cursor: 'pointer',
            padding: '4px 12px',
          }}
        >
          <Home size={20} />
          <span style={{ fontSize: '11px', fontWeight: currentScreen === 'home' ? 800 : 600 }}>
            {t('nav.home', 'Басты бет')}
          </span>
        </button>

        <button
          onClick={() => navigate('wizard')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: currentScreen === 'wizard' ? '#4f46e5' : '#64748b',
            cursor: 'pointer',
            padding: '4px 12px',
          }}
        >
          <Sparkles size={20} />
          <span style={{ fontSize: '11px', fontWeight: currentScreen === 'wizard' ? 800 : 600 }}>
            {t('nav.create', 'Ойын жасау')}
          </span>
        </button>

        {role === 'TEACHER' ? (
          <button
            onClick={() => navigate('myGames')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              color: currentScreen === 'myGames' ? '#4f46e5' : '#64748b',
              cursor: 'pointer',
              padding: '4px 12px',
            }}
          >
            <BookOpen size={20} />
            <span style={{ fontSize: '11px', fontWeight: currentScreen === 'myGames' ? 800 : 600 }}>
              {t('nav.myGames', 'Ойындарым')}
            </span>
          </button>
        ) : null}

        <button
          onClick={() => {
            if (role === 'TEACHER') navigate('analytics', { gameId: 'mock-g1' });
            else navigate('play', { pinCode: '718293' });
          }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: currentScreen === 'analytics' ? '#4f46e5' : '#64748b',
            cursor: 'pointer',
            padding: '4px 12px',
          }}
        >
          <BarChart2 size={20} />
          <span style={{ fontSize: '11px', fontWeight: currentScreen === 'analytics' ? 800 : 600 }}>
            {role === 'TEACHER' ? t('nav.results', 'Нәтижелер') : 'Сынақ ойыны'}
          </span>
        </button>
      </nav>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
};
