import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

const STEPS = [
  {
    title: null,
    text: null,
    hint: null,
  },
  {
    title: 'AFTERZERO',
    text: 'Здесь ничего нет.\nЧто появится первым — решаешь ты.',
    hint: null,
  },
  {
    title: null,
    text: null,
    hint: {
      icon: '🌲',
      heading: 'Собирай ресурсы',
      body: 'Нажми на дерево — получи дерево. Ресурсы нужны для строительства.',
    },
  },
  {
    title: null,
    text: null,
    hint: {
      icon: '🏗️',
      heading: 'Строй свой мир',
      body: 'Нажми «СТРОИТЬ» → выбери тайл → выбери здание → подтверди.',
    },
  },
  {
    title: null,
    text: null,
    hint: {
      icon: '🔮',
      heading: 'Исследуй тайны',
      body: 'Загадочный портал ждёт тебя. Развивай остров — и он откроется.',
    },
  },
];

export function OnboardingScreen() {
  const finishOnboarding = useGameStore((s) => s.finishOnboarding);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      finishOnboarding();
    }
  };

  const skip = () => finishOnboarding();

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 300,
        background: 'rgba(2,8,24,0.96)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      {/* Dots */}
      <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === step ? '#00e5d0' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Skip */}
      <button
        onClick={skip}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          color: '#6b7a99',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'Nunito, sans-serif',
          padding: '5px 12px',
          cursor: 'pointer',
        }}
      >
        Пропустить
      </button>

      {/* Content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          textAlign: 'center',
          animation: 'fadeInUp 0.35s ease',
        }}
      >
        {/* Step 0: Logo splash */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 24,
                background: 'linear-gradient(135deg, #00e5d0 0%, #7c4dff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                boxShadow: '0 0 60px rgba(0,229,208,0.3)',
                animation: 'floatBob 4s ease-in-out infinite',
              }}
            >
              🏝️
            </div>
            <div
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: 28,
                fontWeight: 700,
                color: '#e8eeff',
                letterSpacing: 6,
              }}
            >
              AFTERZERO
            </div>
            <div style={{ fontSize: 13, color: '#6b7a99' }}>Твой мир начинается здесь</div>
          </div>
        )}

        {/* Step 1: Tagline */}
        {step === 1 && s.text && (
          <div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: '#e8eeff',
                lineHeight: 1.35,
                marginBottom: 16,
                whiteSpace: 'pre-line',
              }}
            >
              {s.text}
            </div>
            <div
              style={{
                width: 48,
                height: 2,
                background: 'linear-gradient(90deg, #00e5d0, #7c4dff)',
                borderRadius: 1,
                margin: '0 auto',
              }}
            />
          </div>
        )}

        {/* Steps 2-4: Tips */}
        {step >= 2 && s.hint && (
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(0,229,208,0.2)',
              borderRadius: 20,
              padding: '28px 24px',
              width: '100%',
              maxWidth: 320,
            }}
          >
            <div style={{ fontSize: 52, marginBottom: 16 }}>{s.hint.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#e8eeff', marginBottom: 8 }}>
              {s.hint.heading}
            </div>
            <div style={{ fontSize: 14, color: '#8090b0', lineHeight: 1.6 }}>{s.hint.body}</div>
          </div>
        )}
      </div>

      {/* CTA button */}
      <button
        onClick={next}
        style={{
          width: '100%',
          maxWidth: 320,
          padding: '15px 0',
          borderRadius: 14,
          border: 'none',
          background: 'linear-gradient(135deg, #00c5b5 0%, #00e5d0 100%)',
          color: '#020c1a',
          fontSize: 15,
          fontWeight: 900,
          fontFamily: 'Nunito, sans-serif',
          cursor: 'pointer',
          letterSpacing: 0.5,
          boxShadow: '0 4px 24px rgba(0,229,208,0.35)',
          transition: 'transform 0.1s',
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {step === 0 ? 'Начать' : isLast ? 'В игру!' : 'Далее'}
      </button>
    </div>
  );
}
