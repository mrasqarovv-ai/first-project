import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.js';
import { api } from '../api/client.js';
import { TeacherAnalyticsSummary } from '@oquplay/shared';
import {
  ArrowLeft,
  Users,
  Award,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BarChart2,
  Copy,
} from 'lucide-react';

interface TeacherAnalyticsScreenProps {
  gameId: string;
  onNavigate: (screen: string, params?: any) => void;
}

export const TeacherAnalyticsScreen: React.FC<TeacherAnalyticsScreenProps> = ({ gameId, onNavigate }) => {
  const { token } = useApp();
  const [analytics, setAnalytics] = useState<TeacherAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await api.getTeacherAnalytics(gameId, token || undefined);
        setAnalytics(data);
      } catch {
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [gameId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        Талдау нәтижелері жүктелуде...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={{ padding: '30px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Талдау деректері табылмады</p>
        <button
          onClick={() => onNavigate('myGames')}
          style={{
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Ойындар тізіміне оралу
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => onNavigate('myGames')}
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
          Менің ойындарым
        </button>

        {analytics.pinCode ? (
          <span
            style={{
              backgroundColor: '#e0e7ff',
              color: '#3730a3',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            Код: {analytics.pinCode}
          </span>
        ) : null}
      </div>

      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '4px' }}>
          {analytics.gameTitle}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Сынып нәтижелері мен қателерді талдау (Нұсқа: v{analytics.versionNumber})
        </p>
      </div>

      {/* 4 Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '14px',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5' }}>
            <Users size={16} />
            <span style={{ fontSize: '12px', fontWeight: 700 }}>Қатысушылар</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900 }}>
            {analytics.uniqueParticipants}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Барлығы {analytics.totalAttempts} әрекет
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '14px',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
            <Award size={16} />
            <span style={{ fontSize: '12px', fontWeight: 700 }}>Орташа балл</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>
            {analytics.averageScorePercentage}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Сыныптың ортақ көрсеткіші
          </div>
        </div>
      </div>

      {/* Most Difficult Tasks (Frequent Errors) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <AlertTriangle size={18} color="#ef4444" />
          <h2 style={{ fontSize: '15px', fontWeight: 800 }}>Жиі қате кеткен тапсырмалар:</h2>
        </div>

        {analytics.difficultTasks.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Әзірге қате жауаптар тіркелмеген
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {analytics.difficultTasks.map((task) => (
              <div
                key={task.taskId}
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b' }}>
                  {task.prompt}
                </div>
                <span
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {task.errorRatePercentage}% қате
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Participants Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid var(--border)',
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px' }}>
          Қатысушылардың нәтижелері:
        </h2>

        {analytics.recentParticipants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
            Ойынды әлі ешкім орындамаған. Оқушыларға PIN кодты беріңіз.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {analytics.recentParticipants.map((p) => (
              <div
                key={p.attemptId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '13px' }}>{p.studentName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(p.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: '14px', color: p.percentage >= 80 ? '#10b981' : '#f59e0b' }}>
                    {p.percentage}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {p.score}/{p.maxScore} ұпай
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
