import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.js';
import { api } from '../api/client.js';
import {
  StudentGameSession,
  StudentQuizTask,
  StudentMatchingTask,
  StudentOrderingTask,
  GameAttemptResult,
} from '@oquplay/shared';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Send,
} from 'lucide-react';

interface PlayScreenProps {
  pinCode: string;
  onNavigate: (screen: string, params?: any) => void;
  onFinishAttempt: (result: GameAttemptResult) => void;
}

export const PlayScreen: React.FC<PlayScreenProps> = ({ pinCode, onNavigate, onFinishAttempt }) => {
  const { user, token } = useApp();
  const [session, setSession] = useState<StudentGameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guestName, setGuestName] = useState(user?.name || '');
  const [nameSubmitted, setNameSubmitted] = useState(Boolean(user));

  // Current playing task index
  const [taskIndex, setTaskIndex] = useState(0);

  // Student Answers State: Map of taskId -> answer
  // For QUIZ: string (option ID)
  // For MATCHING: Record<leftId, rightId>
  // For ORDERING: string[] (ordered item IDs)
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Matching interaction state: selected left item
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);

  // Timer
  const [secondsSpent, setSecondsSpent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let timer: any;
    if (nameSubmitted && session) {
      timer = setInterval(() => {
        setSecondsSpent((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [nameSubmitted, session]);

  // Load game session
  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.joinSession(pinCode);
        setSession(res.session);

        // Pre-initialize ordering items in answers state
        const initialAnswers: Record<string, any> = {};
        for (const t of res.session.tasks) {
          if (res.session.gameType === 'ORDERING') {
            const ordTask = t as StudentOrderingTask;
            initialAnswers[t.id] = ordTask.shuffledItems.map((item) => item.id);
          } else if (res.session.gameType === 'MATCHING') {
            initialAnswers[t.id] = {};
          }
        }
        setAnswers(initialAnswers);
      } catch (err: any) {
        setError(err.message || 'Ойынды жүктеу мүмкін болмады');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [pinCode]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectQuizOption = (taskId: string, optionId: string) => {
    setAnswers({
      ...answers,
      [taskId]: optionId,
    });
  };

  const handlePairMatching = (taskId: string, leftId: string, rightId: string) => {
    const currentPairs = { ...(answers[taskId] || {}) };
    currentPairs[leftId] = rightId;
    setAnswers({
      ...answers,
      [taskId]: currentPairs,
    });
    setSelectedLeftId(null);
  };

  const handleUnpairMatching = (taskId: string, leftId: string) => {
    const currentPairs = { ...(answers[taskId] || {}) };
    delete currentPairs[leftId];
    setAnswers({
      ...answers,
      [taskId]: currentPairs,
    });
  };

  const handleMoveOrderingItem = (taskId: string, fromIdx: number, direction: 'UP' | 'DOWN') => {
    const toIdx = direction === 'UP' ? fromIdx - 1 : fromIdx + 1;
    const currentList: string[] = [...(answers[taskId] || [])];
    if (toIdx < 0 || toIdx >= currentList.length) return;

    const [moved] = currentList.splice(fromIdx, 1);
    currentList.splice(toIdx, 0, moved);

    setAnswers({
      ...answers,
      [taskId]: currentList,
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await api.submitAnswers(
        pinCode,
        answers,
        secondsSpent,
        guestName || user?.name || 'Қонақ',
        token || undefined
      );

      onFinishAttempt(result);
      onNavigate('result', { attemptId: result.attemptId });
    } catch (err: any) {
      setError(err.message || 'Жауаптарды жіберу сәтсіз');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎮</div>
        <div style={{ fontWeight: 800, fontSize: '16px' }}>Ойын жүктелуде...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ padding: '30px 20px', textAlign: 'center' }}>
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '16px',
            borderRadius: '16px',
            marginBottom: '16px',
            fontWeight: 700,
          }}
        >
          <AlertCircle size={24} style={{ margin: '0 auto 8px auto' }} />
          {error || 'Ойын табылмады'}
        </div>
        <button
          onClick={() => onNavigate('home')}
          style={{
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Басты бетке оралу
        </button>
      </div>
    );
  }

  // Guest name entry step
  if (!nameSubmitted) {
    return (
      <div style={{ padding: '30px 20px', maxWidth: '420px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>👋</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>
            {session.gameTitle}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Ойын нәтижеңіз мұғалімге көрінуі үшін есіміңізді енгізіңіз
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              Есіміңіз немесе лақап атыңыз:
            </label>
            <input
              type="text"
              placeholder="Мысалы: Әлихан, 7А"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                fontSize: '15px',
                outline: 'none',
              }}
            />
          </div>

          <button
            onClick={() => {
              if (!guestName.trim()) {
                setGuestName('Оқушы');
              }
              setNameSubmitted(true);
            }}
            style={{
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
            }}
          >
            Ойынды бастау
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  const currentTask = session.tasks[taskIndex];
  const isLastTask = taskIndex === session.tasks.length - 1;

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Header: Game info, progress and timer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '12px 16px',
          border: '1px solid var(--border)',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
            {session.subject} • {session.grade}-сынып
          </div>
          <div style={{ fontWeight: 800, fontSize: '14px' }}>
            Тапсырма {taskIndex + 1} / {session.tasks.length}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f1f5f9',
            padding: '6px 12px',
            borderRadius: '20px',
            fontWeight: 800,
            fontSize: '13px',
            color: '#334155',
          }}
        >
          <Clock size={15} color="#4f46e5" />
          {formatTime(secondsSpent)}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${((taskIndex + 1) / session.tasks.length) * 100}%`,
            backgroundColor: '#4f46e5',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* 1. QUIZ INTERACTION */}
      {session.gameType === 'QUIZ' && currentTask ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.4 }}>
              {(currentTask as StudentQuizTask).question}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(currentTask as StudentQuizTask).options.map((opt, oIdx) => {
              const isSelected = answers[currentTask.id] === opt.id;
              const letter = ['A', 'B', 'C', 'D'][oIdx] || `${oIdx + 1}`;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectQuizOption(currentTask.id, opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: isSelected ? '2px solid #4f46e5' : '1px solid var(--border)',
                    backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.15)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: isSelected ? '#4f46e5' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '13px',
                      flexShrink: 0,
                    }}
                  >
                    {letter}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: isSelected ? 800 : 600, color: '#0f172a' }}>
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* 2. MATCHING INTERACTION */}
      {session.gameType === 'MATCHING' && currentTask ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '14px 18px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '4px' }}>
              {(currentTask as StudentMatchingTask).instructions || 'Сәйкес жұптарды байланыстырыңыз'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Сол жақ бағаннан элементті таңдап, оң жақтағы сәйкесін басыңыз
            </div>
          </div>

          {/* Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>
                СОЛ ЖАҚ
              </div>
              {(currentTask as StudentMatchingTask).leftItems.map((item) => {
                const currentPairs = answers[currentTask.id] || {};
                const isPaired = Boolean(currentPairs[item.id]);
                const isSelected = selectedLeftId === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isPaired) {
                        handleUnpairMatching(currentTask.id, item.id);
                      } else {
                        setSelectedLeftId(isSelected ? null : item.id);
                      }
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: isSelected
                        ? '2px solid #4f46e5'
                        : isPaired
                        ? '2px solid #10b981'
                        : '1px solid var(--border)',
                      backgroundColor: isSelected
                        ? '#eef2ff'
                        : isPaired
                        ? '#ecfdf5'
                        : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 700,
                      position: 'relative',
                    }}
                  >
                    {item.text}
                    {isPaired ? (
                      <span style={{ display: 'block', fontSize: '10px', color: '#065f46', marginTop: '4px' }}>
                        ✓ Байланыстырылды (жою үшін басыңыз)
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>
                ОҢ ЖАҚ
              </div>
              {(currentTask as StudentMatchingTask).rightItems.map((item) => {
                const currentPairs = answers[currentTask.id] || {};
                const isUsed = Object.values(currentPairs).includes(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (selectedLeftId) {
                        handlePairMatching(currentTask.id, selectedLeftId, item.id);
                      }
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: isUsed ? '2px solid #10b981' : '1px solid var(--border)',
                      backgroundColor: isUsed ? '#ecfdf5' : selectedLeftId ? '#fffbeb' : '#ffffff',
                      cursor: selectedLeftId ? 'pointer' : 'default',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 600,
                      opacity: isUsed ? 0.7 : 1,
                    }}
                  >
                    {item.text}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* 3. ORDERING INTERACTION */}
      {session.gameType === 'ORDERING' && currentTask ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '14px 18px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '4px' }}>
              {(currentTask as StudentOrderingTask).instructions || 'Элементтерді дұрыс ретпен орналастырыңыз'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Жоғары және төмен батырмаларын басу арқылы элементтердің ретін өзгертіңіз
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {((answers[currentTask.id] as string[]) || []).map((itemId, idx, arr) => {
              const ordTask = currentTask as StudentOrderingTask;
              const itemObj = ordTask.shuffledItems.find((i) => i.id === itemId);

              return (
                <div
                  key={itemId}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '14px',
                        backgroundColor: '#4f46e5',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '13px',
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{itemObj?.text || itemId}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      onClick={() => handleMoveOrderingItem(currentTask.id, idx, 'UP')}
                      disabled={idx === 0}
                      style={{
                        padding: '4px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'none',
                        cursor: idx === 0 ? 'not-allowed' : 'pointer',
                        opacity: idx === 0 ? 0.3 : 1,
                      }}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => handleMoveOrderingItem(currentTask.id, idx, 'DOWN')}
                      disabled={idx === arr.length - 1}
                      style={{
                        padding: '4px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'none',
                        cursor: idx === arr.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: idx === arr.length - 1 ? 0.3 : 1,
                      }}
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Navigation Buttons: Prev / Next / Submit */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
        <button
          onClick={() => setTaskIndex((i) => Math.max(0, i - 1))}
          disabled={taskIndex === 0}
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            backgroundColor: '#ffffff',
            fontWeight: 700,
            fontSize: '13px',
            cursor: taskIndex === 0 ? 'not-allowed' : 'pointer',
            opacity: taskIndex === 0 ? 0.4 : 1,
          }}
        >
          Артқа
        </button>

        {isLastTask ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Send size={16} />
            {submitting ? 'Тексерілуде...' : 'Ойынды аяқтау'}
          </button>
        ) : (
          <button
            onClick={() => setTaskIndex((i) => Math.min(session.tasks.length - 1, i + 1))}
            style={{
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 22px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Келесі
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
