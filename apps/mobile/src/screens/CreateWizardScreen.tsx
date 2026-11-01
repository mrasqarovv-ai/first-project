import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import { api } from '../api/client.js';
import {
  GameType,
  Language,
  DifficultyLevel,
  GameSnapshot,
} from '@oquplay/shared';
import { Sparkles, ArrowLeft, ArrowRight, Check, AlertCircle, FileText, Settings, Sliders } from 'lucide-react';

interface CreateWizardScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  onEditSnapshot: (snapshot: GameSnapshot) => void;
}

export const CreateWizardScreen: React.FC<CreateWizardScreenProps> = ({ onNavigate, onEditSnapshot }) => {
  const { language, token, t } = useApp();

  // Wizard current step: 1 = Text, 2 = Parameters, 3 = Generating AI
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [sourceText, setSourceText] = useState(
    'Қазақ хандығының негізін 1465 жылы Керей мен Жәнібек қалады. Олар Әбілқайыр хандығынан бөлініп, Жетісудағы Шу мен Қозыбасы өңіріне көшіп келді. Моғолстан билеушісі Есенбұға хан оларды жылы қабылдап, жер бөлді. Кейінірек Қасым хан билігі тұсында мемлекеттің халқы 1 миллионға жетіп, «Қасым ханның қасқа жолы» заңдар жинағы қабылданды. XVII ғасырдың соңында Тәуке хан атақты билер Төле, Қазыбек, Әйтеке билердің көмегімен «Жеті жарғы» заң кодексін бекітті.'
  );

  const [subject, setSubject] = useState('Қазақстан тарихы');
  const [topic, setTopic] = useState('Қазақ хандығының құрылуы');
  const [grade, setGrade] = useState(7);
  const [gameLanguage, setGameLanguage] = useState<Language>(language);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('A');
  const [gameType, setGameType] = useState<GameType>('QUIZ');
  const [itemCount, setItemCount] = useState<number>(5);
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Sample texts for quick selection
  const handleSelectSample = (sampleType: 'HISTORY' | 'BIOLOGY' | 'PHYSICS') => {
    if (sampleType === 'HISTORY') {
      setSubject('Қазақстан тарихы');
      setTopic('Қазақ хандығы');
      setGrade(7);
      setSourceText(
        'Қазақ хандығының негізін 1465 жылы Керей мен Жәнібек қалады. Олар Әбілқайыр хандығынан бөлініп, Жетісудағы Шу мен Қозыбасы өңіріне көшіп келді. Моғолстан ханы Есенбұға қазақ хандарына жер бөлді. Қасым ханның тұсында хандықтың шекарасы кеңейіп, халқы 1 миллионға жетті.'
      );
    } else if (sampleType === 'BIOLOGY') {
      setSubject('Биология');
      setTopic('Жасуша құрылысы');
      setGrade(8);
      setGameType('MATCHING');
      setSourceText(
        'Жасуша — барлық тірі ағзалардың негізгі құрылымдық және функционалдық бірлігі. Жасуша органоидтары: Ядро — генетикалық ақпаратты сақтайды. Митохондрия — жасушаның тыныс алу және энергия көзі (АТФ түзеді). Рибосома — нәруыз синтезін жүзеге асырады. Хлоропласт — өсімдік жасушасында фотосинтез процесін атқарады. Лизосома — заттарды ыдырату қызметін атқарады.'
      );
    } else {
      setSubject('Физика');
      setTopic('Ньютон заңдары');
      setGrade(9);
      setGameType('ORDERING');
      setSourceText(
        'Классикалық механиканың негізі Исаак Ньютонның үш заңынан тұрады. 1-заң: Егер денеге басқа денелер әсер етпесе, ол тыныштық күйін немесе түзусызықты бірқалыпты қозғалысын сақтайды (инерция). 2-заң: Денеге әсер етуші күш оның массасы мен үдеуінің көбейтіндісіне тең (F = m*a). 3-заң: Екі дененің бір-біріне әсері шамасы жағынан тең, ал бағыты жағынан қарама-қарсы (әсерге әрқашан қарсы әсер бар).'
      );
    }
  };

  const handleStartGeneration = async () => {
    if (sourceText.trim().length < 20) {
      setError('Оқу мәтіні кемінде 20 таңбадан тұруы қажет');
      return;
    }
    setError('');
    setStep(3);
    setGenerating(true);

    try {
      const res = await api.generateGame(
        {
          sourceText,
          subject,
          topic,
          grade,
          language: gameLanguage,
          difficulty,
          gameType,
          itemCount: [5, 10, 15].includes(itemCount) ? (itemCount as any) : 5,
          timeLimitEnabled,
        },
        token || undefined
      );

      // Pass generated snapshot directly to Editor
      onEditSnapshot(res.snapshot);
      onNavigate('editor');
    } catch (err: any) {
      setError(err.message || 'Генерация сәтсіз аяқталды. Мәтін сақталды, қайталап көріңіз.');
      setStep(2);
    } finally {
      setGenerating(false);
    }
  };

  // Label based on game type
  const getCountLabel = () => {
    if (gameType === 'QUIZ') return 'Сұрақтар саны';
    if (gameType === 'MATCHING') return 'Жұптар саны';
    return 'Реттелетін элементтер саны';
  };

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Steps Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <button
          onClick={() => {
            if (step === 2) setStep(1);
            else onNavigate('home');
          }}
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
          {step === 2 ? 'Артқа' : 'Бас тарту'}
        </button>

        <div style={{ display: 'flex', gap: '6px' }}>
          <div
            style={{
              width: '28px',
              height: '6px',
              borderRadius: '3px',
              backgroundColor: step >= 1 ? '#4f46e5' : '#cbd5e1',
            }}
          />
          <div
            style={{
              width: '28px',
              height: '6px',
              borderRadius: '3px',
              backgroundColor: step >= 2 ? '#4f46e5' : '#cbd5e1',
            }}
          />
          <div
            style={{
              width: '28px',
              height: '6px',
              borderRadius: '3px',
              backgroundColor: step === 3 ? '#4f46e5' : '#cbd5e1',
            }}
          />
        </div>
      </div>

      {error ? (
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '12px 14px',
            borderRadius: '12px',
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

      {/* STEP 1: Text Input */}
      {step === 1 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>
              1. Оқу мәтінін енгізіңіз
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              ЖИ тек осы мәтіндегі нақты фактілерге сүйеніп ойын құрастырады
            </p>
          </div>

          {/* Quick sample pickers */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>
              Дайын оқу мәтіні үлгісін таңдау:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleSelectSample('HISTORY')}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                📜 Қазақ хандығы
              </button>
              <button
                type="button"
                onClick={() => handleSelectSample('BIOLOGY')}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🧬 Жасуша органоидтары
              </button>
              <button
                type="button"
                onClick={() => handleSelectSample('PHYSICS')}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ⚡ Ньютон заңдары
              </button>
            </div>
          </div>

          <div>
            <textarea
              rows={9}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Оқулықтан үзінді, конспект немесе ережелерді осында қойыңыз..."
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                fontSize: '14px',
                lineHeight: 1.6,
                outline: 'none',
                backgroundColor: '#ffffff',
                boxShadow: 'var(--shadow-sm)',
                resize: 'vertical',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginTop: '4px',
                padding: '0 4px',
              }}
            >
              <span>Кемінде 20 таңба қажет</span>
              <span>{sourceText.length} таңба енгізілді</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (sourceText.trim().length < 20) {
                setError('Мәтін тым қысқа (кемінде 20 таңба)');
                return;
              }
              setError('');
              setStep(2);
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
            Параметрлерді таңдау
            <ArrowRight size={18} />
          </button>
        </div>
      ) : null}

      {/* STEP 2: Parameters */}
      {step === 2 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>
              2. Тапсырма параметрлері
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Ойынның пәні, деңгейі және форматын баптаңыз
            </p>
          </div>

          {/* Game Type Picker */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '8px' }}>
              Ойын түрі:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <div
                onClick={() => setGameType('QUIZ')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: gameType === 'QUIZ' ? '2px solid #4f46e5' : '1px solid var(--border)',
                  backgroundColor: gameType === 'QUIZ' ? '#eef2ff' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '22px' }}>🎯</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px' }}>Викторина (Quiz)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>1 дұрыс жауап, 4 нұсқа</div>
                </div>
              </div>

              <div
                onClick={() => setGameType('MATCHING')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: gameType === 'MATCHING' ? '2px solid #4f46e5' : '1px solid var(--border)',
                  backgroundColor: gameType === 'MATCHING' ? '#eef2ff' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '22px' }}>🧩</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px' }}>Сәйкестендіру (Matching)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Екі баған арасындағы байланыс</div>
                </div>
              </div>

              <div
                onClick={() => setGameType('ORDERING')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: gameType === 'ORDERING' ? '2px solid #4f46e5' : '1px solid var(--border)',
                  backgroundColor: gameType === 'ORDERING' ? '#eef2ff' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '22px' }}>🔢</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px' }}>Ретке орналастыру (Ordering)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Хронология немесе реттілік</div>
                </div>
              </div>
            </div>
          </div>

          {/* Subject & Topic */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                Пән
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  fontSize: '13px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                Тақырып
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          {/* Grade & Language */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                Сынып (1-11)
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                }}
              >
                {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                  <option key={g} value={g}>
                    {g}-сынып
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                Ойын тілі
              </label>
              <select
                value={gameLanguage}
                onChange={(e) => setGameLanguage(e.target.value as Language)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="kk">Қазақша</option>
                <option value="ru">Русский</option>
              </select>
            </div>
          </div>

          {/* Difficulty Level: A, B, C */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              Қиындық деңгейі:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDifficulty('A')}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: difficulty === 'A' ? '2px solid #4f46e5' : '1px solid var(--border)',
                  backgroundColor: difficulty === 'A' ? '#e0e7ff' : '#ffffff',
                  color: difficulty === 'A' ? '#3730a3' : 'var(--text)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                A — Базалық
              </button>
              <button
                type="button"
                onClick={() => setDifficulty('B')}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: difficulty === 'B' ? '2px solid #4f46e5' : '1px solid var(--border)',
                  backgroundColor: difficulty === 'B' ? '#e0e7ff' : '#ffffff',
                  color: difficulty === 'B' ? '#3730a3' : 'var(--text)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                B — Қолдану
              </button>
              <button
                type="button"
                onClick={() => setDifficulty('C')}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: difficulty === 'C' ? '2px solid #4f46e5' : '1px solid var(--border)',
                  backgroundColor: difficulty === 'C' ? '#e0e7ff' : '#ffffff',
                  color: difficulty === 'C' ? '#3730a3' : 'var(--text)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                C — Талдау
              </button>
            </div>
          </div>

          {/* Item count */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              {getCountLabel()}:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[5, 10, 15].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setItemCount(cnt)}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: itemCount === cnt ? '2px solid #4f46e5' : '1px solid var(--border)',
                    backgroundColor: itemCount === cnt ? '#eef2ff' : '#ffffff',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {cnt} {gameType === 'MATCHING' ? 'жұп' : 'тапсырма'}
                </button>
              ))}
            </div>
          </div>

          {/* Time limit toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: '#ffffff',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>Уақыт шектеуі (Таймер)</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Әр тапсырмаға кері санақ қосу</div>
            </div>
            <button
              type="button"
              onClick={() => setTimeLimitEnabled(!timeLimitEnabled)}
              style={{
                width: '46px',
                height: '26px',
                borderRadius: '13px',
                backgroundColor: timeLimitEnabled ? '#4f46e5' : '#cbd5e1',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  position: 'absolute',
                  top: '3px',
                  left: timeLimitEnabled ? '23px' : '3px',
                  transition: 'left 0.2s',
                }}
              />
            </button>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleStartGeneration}
            style={{
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '15px',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '6px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
            }}
          >
            <Sparkles size={18} />
            ЖИ арқылы ойын құрастыру
          </button>
        </div>
      ) : null}

      {/* STEP 3: Generating Screen */}
      {step === 3 && generating ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            textAlign: 'center',
            gap: '18px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '4px solid #e0e7ff',
              borderTopColor: '#4f46e5',
              animation: 'spin 1s linear infinite',
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
              ЖИ тапсырмаларды құрастыруда...
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '320px', lineHeight: 1.5 }}>
              Оқу мәтініндегі фактілер талданып, сұрақтар мен түсіндірмелер схема бойынша жасалуда
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>💡</span>
            <span>Педагогикалық талаптар мен дәлел үзінділері тексерілуде</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
