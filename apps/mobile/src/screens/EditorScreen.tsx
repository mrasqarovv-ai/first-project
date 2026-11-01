import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import { api } from '../api/client.js';
import {
  GameSnapshot,
  QuizTask,
  MatchingTask,
  OrderingTask,
  TaskItem,
} from '@oquplay/shared';
import {
  ArrowLeft,
  Save,
  Send,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
} from 'lucide-react';

interface EditorScreenProps {
  snapshot: GameSnapshot;
  onUpdateSnapshot: (updated: GameSnapshot) => void;
  onNavigate: (screen: string, params?: any) => void;
}

export const EditorScreen: React.FC<EditorScreenProps> = ({
  snapshot: initialSnapshot,
  onUpdateSnapshot,
  onNavigate,
}) => {
  const { token, role } = useApp();
  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentTask = snapshot.items[activeTaskIndex] as any;

  // Validate before publishing
  const validateSnapshot = (): string | null => {
    if (!snapshot.title.trim()) return 'Ойын атауы бос болмауы керек';
    if (snapshot.items.length === 0) return 'Кемінде 1 тапсырма болуы тиіс';

    for (let i = 0; i < snapshot.items.length; i++) {
      const item = snapshot.items[i] as any;
      if (snapshot.gameType === 'QUIZ') {
        if (!item.question?.trim()) return `${i + 1}-сұрақ мәтіні бос`;
        if (!item.options || item.options.length < 2) return `${i + 1}-сұрақта кемінде 2 жауап нұсқасы қажет`;
        if (!item.correctOptionId) return `${i + 1}-сұрақта дұрыс жауап белгіленбеген`;
      } else if (snapshot.gameType === 'MATCHING') {
        if (!item.pairs || item.pairs.length < 2) return `${i + 1}-тапсырмада кемінде 2 жұп болуы тиіс`;
      } else if (snapshot.gameType === 'ORDERING') {
        if (!item.items || item.items.length < 2) return `${i + 1}-тапсырмада кемінде 2 элемент болуы тиіс`;
      }
    }
    return null;
  };

  const handleSave = async (publish: boolean) => {
    setError('');
    const validationError = validateSnapshot();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const saved = await api.saveGame(snapshot, publish ? 'PUBLISHED' : 'DRAFT', token || undefined);
      setSuccessMsg(publish ? `Ойын сәтті жарияланды! Код: ${saved.pinCode}` : 'Ойын сақталды');
      setTimeout(() => {
        onNavigate('myGames');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Сақтау қатесі');
    } finally {
      setSaving(false);
    }
  };

  // Reorder task items
  const moveTask = (fromIndex: number, direction: 'UP' | 'DOWN') => {
    const toIndex = direction === 'UP' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= snapshot.items.length) return;

    const newItems = [...snapshot.items];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);

    setSnapshot({ ...snapshot, items: newItems });
    setActiveTaskIndex(toIndex);
  };

  // Delete task
  const deleteTask = (index: number) => {
    if (snapshot.items.length <= 1) {
      setError('Соңғы тапсырманы өшіруге болмайды');
      return;
    }
    const newItems = snapshot.items.filter((_, i) => i !== index);
    setSnapshot({ ...snapshot, items: newItems });
    setActiveTaskIndex(Math.max(0, index - 1));
  };

  // Add new blank task
  const addTask = () => {
    const nextIndex = snapshot.items.length;
    let newItem: any;

    if (snapshot.gameType === 'QUIZ') {
      newItem = {
        id: `task-${Date.now()}`,
        orderIndex: nextIndex,
        question: 'Жаңа сұрақ мәтіні',
        options: [
          { id: `opt-${Date.now()}-1`, text: 'Нұсқа A' },
          { id: `opt-${Date.now()}-2`, text: 'Нұсқа B' },
          { id: `opt-${Date.now()}-3`, text: 'Нұсқа C' },
          { id: `opt-${Date.now()}-4`, text: 'Нұсқа D' },
        ],
        correctOptionId: `opt-${Date.now()}-1`,
        explanation: 'Сұрақтың түсіндірмесі',
        sourceExcerpt: 'Оқу мәтініндегі дәлел үзіндісі',
      };
    } else if (snapshot.gameType === 'MATCHING') {
      newItem = {
        id: `task-${Date.now()}`,
        orderIndex: nextIndex,
        instructions: 'Жұптарды сәйкестендіріңіз',
        pairs: [
          { id: `pair-${Date.now()}-1`, left: 'Ұғым 1', right: 'Анықтама 1' },
          { id: `pair-${Date.now()}-2`, left: 'Ұғым 2', right: 'Анықтама 2' },
          { id: `pair-${Date.now()}-3`, left: 'Ұғым 3', right: 'Анықтама 3' },
        ],
        explanation: 'Сәйкестіктердің түсіндірмесі',
        sourceExcerpt: 'Мәтіндегі дәлел',
      };
    } else {
      newItem = {
        id: `task-${Date.now()}`,
        orderIndex: nextIndex,
        instructions: 'Ретімен орналастырыңыз',
        items: [
          { id: `ord-${Date.now()}-1`, text: '1-қадам' },
          { id: `ord-${Date.now()}-2`, text: '2-қадам' },
          { id: `ord-${Date.now()}-3`, text: '3-қадам' },
        ],
        correctOrderIds: [`ord-${Date.now()}-1`, `ord-${Date.now()}-2`, `ord-${Date.now()}-3`],
        explanation: 'Дұрыс реттің түсіндірмесі',
        sourceExcerpt: 'Мәтіндегі дәлел',
      };
    }

    setSnapshot({ ...snapshot, items: [...snapshot.items, newItem] });
    setActiveTaskIndex(nextIndex);
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => onNavigate('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={18} />
          Басты бет
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              backgroundColor: '#ffffff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Save size={15} />
            Черновик
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
            }}
          >
            <Send size={15} />
            Жариялау
          </button>
        </div>
      </div>

      {/* Demo Badge Banner if Demo */}
      {snapshot.isDemo ? (
        <div
          style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            color: '#b45309',
            padding: '8px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>🏷️</span>
          <span>Демо деректер: ЖИ API кілті қосылмағандықтан, сапалы сынақ үлгісі қолданылды</span>
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      ) : null}

      {successMsg ? (
        <div
          style={{
            backgroundColor: '#d1fae5',
            color: '#065f46',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} />
          {successMsg}
        </div>
      ) : null}

      {/* Game Title & Metadata Input */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '14px',
          border: '1px solid var(--border)',
        }}
      >
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>
          Ойын тақырыбы:
        </label>
        <input
          type="text"
          value={snapshot.title}
          onChange={(e) => setSnapshot({ ...snapshot, title: e.target.value })}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            fontSize: '15px',
            fontWeight: 800,
          }}
        />
      </div>

      {/* Task List Selector (Thumbnails / Badges) */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {snapshot.items.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveTaskIndex(idx)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: activeTaskIndex === idx ? '2px solid #4f46e5' : '1px solid var(--border)',
              backgroundColor: activeTaskIndex === idx ? '#4f46e5' : '#ffffff',
              color: activeTaskIndex === idx ? '#ffffff' : 'var(--text)',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {idx + 1}-тапсырма
          </button>
        ))}

        <button
          type="button"
          onClick={addTask}
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1px dashed #4f46e5',
            backgroundColor: '#eef2ff',
            color: '#4f46e5',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
          }}
        >
          <Plus size={16} />
          Қосу
        </button>
      </div>

      {/* Active Task Editor Form */}
      {currentTask ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '18px',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Task header with Reorder and Delete */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <span style={{ fontWeight: 800, fontSize: '15px' }}>
              Тапсырма №{activeTaskIndex + 1} ({snapshot.gameType})
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={() => moveTask(activeTaskIndex, 'UP')}
                disabled={activeTaskIndex === 0}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'none',
                  cursor: activeTaskIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: activeTaskIndex === 0 ? 0.3 : 1,
                }}
                title="Жоғары жылжыту"
              >
                <ChevronUp size={16} />
              </button>

              <button
                type="button"
                onClick={() => moveTask(activeTaskIndex, 'DOWN')}
                disabled={activeTaskIndex === snapshot.items.length - 1}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'none',
                  cursor: activeTaskIndex === snapshot.items.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: activeTaskIndex === snapshot.items.length - 1 ? 0.3 : 1,
                }}
                title="Төмен жылжыту"
              >
                <ChevronDown size={16} />
              </button>

              <button
                type="button"
                onClick={() => deleteTask(activeTaskIndex)}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: '1px solid #fee2e2',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  cursor: 'pointer',
                  marginLeft: '4px',
                }}
                title="Тапсырманы өшіру"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* QUIZ TYPE: Question & 4 Options */}
          {snapshot.gameType === 'QUIZ' ? (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Сұрақ мәтіні:
                </label>
                <textarea
                  rows={3}
                  value={currentTask.question || ''}
                  onChange={(e) => {
                    const newItems = [...snapshot.items];
                    (newItems[activeTaskIndex] as QuizTask).question = e.target.value;
                    setSnapshot({ ...snapshot, items: newItems });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Жауап нұсқалары (дұрыс жауапты шеңберді басып белгілеңіз):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentTask.options?.map((opt: any, optIdx: number) => {
                    const isCorrect = currentTask.correctOptionId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: isCorrect ? '2px solid #10b981' : '1px solid var(--border)',
                          backgroundColor: isCorrect ? '#ecfdf5' : '#ffffff',
                        }}
                      >
                        <input
                          type="radio"
                          name={`correct-${activeTaskIndex}`}
                          checked={isCorrect}
                          onChange={() => {
                            const newItems = [...snapshot.items];
                            (newItems[activeTaskIndex] as QuizTask).correctOptionId = opt.id;
                            setSnapshot({ ...snapshot, items: newItems });
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                        />
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const newItems = [...snapshot.items];
                            (newItems[activeTaskIndex] as QuizTask).options[optIdx].text = e.target.value;
                            setSnapshot({ ...snapshot, items: newItems });
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '13px',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}

          {/* MATCHING TYPE: Pairs */}
          {snapshot.gameType === 'MATCHING' ? (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Сәйкес келетін жұптар:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentTask.pairs?.map((pair: any, pIdx: number) => (
                  <div
                    key={pair.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 30px',
                      gap: '8px',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Сол жақ баған"
                      value={pair.left}
                      onChange={(e) => {
                        const newItems = [...snapshot.items];
                        (newItems[activeTaskIndex] as MatchingTask).pairs[pIdx].left = e.target.value;
                        setSnapshot({ ...snapshot, items: newItems });
                      }}
                      style={{
                        padding: '8px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Оң жақ баған"
                      value={pair.right}
                      onChange={(e) => {
                        const newItems = [...snapshot.items];
                        (newItems[activeTaskIndex] as MatchingTask).pairs[pIdx].right = e.target.value;
                        setSnapshot({ ...snapshot, items: newItems });
                      }}
                      style={{
                        padding: '8px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [...snapshot.items];
                        (newItems[activeTaskIndex] as MatchingTask).pairs.splice(pIdx, 1);
                        setSnapshot({ ...snapshot, items: newItems });
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* ORDERING TYPE: Items */}
          {snapshot.gameType === 'ORDERING' ? (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Дұрыс ретпен орналасқан элементтер тізімі:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentTask.items?.map((item: any, iIdx: number) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '12px',
                        backgroundColor: '#4f46e5',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 800,
                      }}
                    >
                      {iIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => {
                        const newItems = [...snapshot.items];
                        (newItems[activeTaskIndex] as OrderingTask).items[iIdx].text = e.target.value;
                        setSnapshot({ ...snapshot, items: newItems });
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Explanation & Evidence Excerpt */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px', paddingTop: '10px', borderTop: '1px dashed var(--border)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                💡 Түсіндірме (Ойын соңында оқушыға көрсетіледі):
              </label>
              <textarea
                rows={2}
                value={currentTask.explanation || ''}
                onChange={(e) => {
                  const newItems = [...snapshot.items];
                  newItems[activeTaskIndex].explanation = e.target.value;
                  setSnapshot({ ...snapshot, items: newItems });
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                📖 Мәтіндегі дәлел үзінді:
              </label>
              <textarea
                rows={2}
                value={currentTask.sourceExcerpt || ''}
                onChange={(e) => {
                  const newItems = [...snapshot.items];
                  newItems[activeTaskIndex].sourceExcerpt = e.target.value;
                  setSnapshot({ ...snapshot, items: newItems });
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
