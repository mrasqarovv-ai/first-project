import React from 'react';
import { GameAttemptResult } from '@oquplay/shared';
import { Trophy, Clock, CheckCircle2, XCircle, RotateCcw, Home, Sparkles } from 'lucide-react';

interface ResultScreenProps {
  result: GameAttemptResult;
  onNavigate: (screen: string, params?: any) => void;
  onRetry: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ result, onNavigate, onRetry }) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m > 0 ? `${m} мин ` : ''}${s} сек`;
  };

  const getBadgeDetails = () => {
    if (result.badge === 'EXCELLENT') {
      return {
        icon: '🏆',
        title: 'Керемет нәтиже!',
        color: '#10b981',
        bg: '#ecfdf5',
        desc: 'Материалды өте жақсы меңгергенсіз',
      };
    }
    if (result.badge === 'GOOD') {
      return {
        icon: '🌟',
        title: 'Жақсы көрсеткіш!',
        color: '#f59e0b',
        bg: '#fffbeb',
        desc: 'Көптеген сұрақтарға дұрыс жауап бердіңіз',
      };
    }
    return {
      icon: '💡',
      title: 'Тағы қайталап көр!',
      color: '#6366f1',
      bg: '#eef2ff',
      desc: 'Түсіндірмелерді оқып, біліміңді бекіт',
    };
  };

  const badge = getBadgeDetails();

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Trophy Result Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '24px 20px',
          textAlign: 'center',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div style={{ fontSize: '50px' }}>{badge.icon}</div>
        <h1 style={{ fontSize: '22px', fontWeight: 900 }}>{badge.title}</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{badge.desc}</p>

        {/* Big percentage & score */}
        <div style={{ margin: '10px 0' }}>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 900,
              color: badge.color,
              lineHeight: 1,
            }}
          >
            {result.percentage}%
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>
            {result.score} / {result.maxScore} ұпай жиналды
          </div>
        </div>

        {/* Time spent badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f1f5f9',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#334155',
          }}
        >
          <Clock size={14} color="#6366f1" />
          Жұмсалған уақыт: {formatTime(result.timeSpentSeconds)}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button
          onClick={onRetry}
          style={{
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            backgroundColor: '#ffffff',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <RotateCcw size={16} />
          Қайта орындау
        </button>

        <button
          onClick={() => onNavigate('home')}
          style={{
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Home size={16} />
          Басты бетке
        </button>
      </div>

      {/* Explanations & Source Evidence Accordion */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px' }}>
          Тапсырмалардың түсіндірмелері мен дәлелдері:
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {result.tasks.map((task, idx) => (
            <div
              key={task.taskId}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '16px',
                border: task.isCorrect ? '1px solid #d1fae5' : '1px solid #fee2e2',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {task.isCorrect ? (
                    <CheckCircle2 size={18} color="#10b981" />
                  ) : (
                    <XCircle size={18} color="#ef4444" />
                  )}
                  <span style={{ fontWeight: 800, fontSize: '14px' }}>
                    Тапсырма №{idx + 1}
                  </span>
                </div>

                <span
                  style={{
                    backgroundColor: task.isCorrect ? '#d1fae5' : '#fee2e2',
                    color: task.isCorrect ? '#065f46' : '#991b1b',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  {task.scoreAwarded} / {task.maxScore} ұпай
                </span>
              </div>

              {/* Explanation */}
              {task.explanation ? (
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#4f46e5', marginBottom: '2px' }}>
                    💡 ТҮСІНДІРМЕ:
                  </div>
                  {task.explanation}
                </div>
              ) : null}

              {/* Evidence from source text */}
              {task.sourceExcerpt ? (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '4px' }}>
                  📖 Дәлел үзінді: «{task.sourceExcerpt}»
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
