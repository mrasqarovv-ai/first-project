import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.js';
import { api } from '../api/client.js';
import { GameSummary } from '@oquplay/shared';
import {
  Search,
  Plus,
  Play,
  Share2,
  Copy,
  Archive,
  BarChart2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface MyGamesScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  onEditGame: (gameId: string) => void;
}

export const MyGamesScreen: React.FC<MyGamesScreenProps> = ({ onNavigate, onEditGame }) => {
  const { token, role } = useApp();
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const list = await api.getMyGames(token || undefined, {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: search.trim() || undefined,
      });
      setGames(list);
    } catch {
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [statusFilter, search]);

  const handleCopyPin = (pin: string) => {
    navigator.clipboard?.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  const handleArchive = async (id: string) => {
    if (confirm('Ойынның жариялануын тоқтатып, архивтеуді қалайсыз ба?')) {
      await api.archiveGame(id, token || undefined);
      fetchGames();
    }
  };

  const handleDuplicate = async (id: string) => {
    await api.duplicateGame(id, token || undefined);
    fetchGames();
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PUBLISHED') {
      return (
        <span
          style={{
            backgroundColor: '#d1fae5',
            color: '#065f46',
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          ● Жарияланған
        </span>
      );
    }
    if (status === 'ARCHIVED') {
      return (
        <span
          style={{
            backgroundColor: '#f1f5f9',
            color: '#64748b',
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          Архивтелген
        </span>
      );
    }
    return (
      <span
        style={{
          backgroundColor: '#fef3c7',
          color: '#b45309',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 700,
        }}
      >
        Черновик
      </span>
    );
  };

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header with Create action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Менің ойындарым</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Жасалған тапсырмалар мен ойын кодтары
          </p>
        </div>

        <button
          onClick={() => onNavigate('wizard')}
          style={{
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
          }}
        >
          <Plus size={16} />
          Жаңа ойын
        </button>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <Search
          size={18}
          color="#94a3b8"
          style={{ position: 'absolute', left: '12px', top: '12px' }}
        />
        <input
          type="text"
          placeholder="Ойын атауы немесе пән бойынша іздеу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 14px 11px 38px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: '#ffffff',
          }}
        />
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'ALL', label: 'Барлығы' },
          { id: 'PUBLISHED', label: 'Жарияланған' },
          { id: 'DRAFT', label: 'Черновиктер' },
          { id: 'ARCHIVED', label: 'Архив' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: statusFilter === f.id ? '2px solid #4f46e5' : '1px solid var(--border)',
              backgroundColor: statusFilter === f.id ? '#eef2ff' : '#ffffff',
              color: statusFilter === f.id ? '#4f46e5' : 'var(--text)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Game Cards List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Жүктелуде...
        </div>
      ) : games.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '40px 20px',
            textAlign: 'center',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📂</div>
          <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '4px' }}>
            Ойындар табылмады
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            ЖИ арқылы алғашқы білім беру ойыныңызды жасап көріңіз
          </p>
          <button
            onClick={() => onNavigate('wizard')}
            style={{
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Ойын жасауды бастау
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {games.map((game) => (
            <div
              key={game.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Card top */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    {getStatusBadge(game.status)}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      v{game.versionNumber}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, lineHeight: 1.3 }}>{game.title}</h3>
                </div>

                <span style={{ fontSize: '22px' }}>
                  {game.gameType === 'QUIZ' ? '🎯' : game.gameType === 'MATCHING' ? '🧩' : '🔢'}
                </span>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '12px' }}>
                <span style={{ backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                  {game.subject}
                </span>
                <span style={{ backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                  {game.grade}-сынып
                </span>
                <span style={{ backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                  {game.itemCount} тапсырма
                </span>
              </div>

              {/* PIN Code Box (if published) */}
              {game.pinCode ? (
                <div
                  style={{
                    backgroundColor: '#eef2ff',
                    border: '1px dashed #6366f1',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#4338ca' }}>
                      ОҚУШЫЛАРҒА АРНАЛҒАН КОД:
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '2px', color: '#1e1b4b' }}>
                      {game.pinCode}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyPin(game.pinCode!)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: copiedPin === game.pinCode ? '#10b981' : '#4f46e5',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {copiedPin === game.pinCode ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                    {copiedPin === game.pinCode ? 'Көшірілді' : 'Көшіру'}
                  </button>
                </div>
              ) : null}

              {/* Card Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '10px',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', gap: '6px' }}>
                  {game.pinCode ? (
                    <button
                      onClick={() => onNavigate('play', { pinCode: game.pinCode })}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Play size={13} />
                      Ойнап көру
                    </button>
                  ) : null}

                  <button
                    onClick={() => onNavigate('analytics', { gameId: game.id })}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: '#ffffff',
                      color: 'var(--text)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <BarChart2 size={14} color="#f59e0b" />
                    Нәтижелер
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleDuplicate(game.id)}
                    title="Көшірмесін жасау"
                    style={{
                      padding: '6px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Copy size={14} />
                  </button>

                  {game.status === 'PUBLISHED' ? (
                    <button
                      onClick={() => handleArchive(game.id)}
                      title="Жарияланудан алу"
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Archive size={14} />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
