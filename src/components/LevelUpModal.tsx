import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

const LEVEL_UNLOCKS: Record<number, { icon: string; text: string }[]> = {
  2: [
    { icon: '🦊', text: 'Питомец Нокс появился на острове!' },
    { icon: '🏗️', text: 'Разблокированы: Мастерская и Ферма' },
    { icon: '🪨', text: 'Доступна добыча камня' },
    { icon: '🏝️', text: 'Остров расширился — новые территории!' },
  ],
  3: [
    { icon: '💎', text: 'Кристаллический узел появился на острове' },
    { icon: '🌀', text: 'Тайна портала раскрывается' },
    { icon: '🦊', text: 'Нокс повысил уровень — новые способности!' },
    { icon: '🗺️', text: 'Новые квесты исследователя разблокированы' },
  ],
};

export function LevelUpModal() {
  const levelUpPending = useGameStore((s) => s?.levelUpPending ?? null);
  const dismissLevelUp = useGameStore((s) => s?.dismissLevelUp ?? (() => {}));
  const [particles, setParticles] = useState<{ x: number; y: number; r: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    if (levelUpPending) {
      setParticles(
        Array.from({ length: 18 }, (_, i) => ({
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 60,
          r: 2 + Math.random() * 4,
          color: ['#00e5d0', '#f5a857', '#a060ff', '#ffdd55'][i % 4],
          delay: Math.random() * 0.6,
        })),
      );
    }
  }, [levelUpPending]);

  if (!levelUpPending) return null;

  const unlocks = LEVEL_UNLOCKS[levelUpPending] ?? [
    { icon: '⭐', text: `Уровень ${levelUpPending} достигнут!` },
  ];

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 300,
        background: 'rgba(2,6,20,0.88)', backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, animation: 'fadeInUp 0.3s ease',
      }}
    >
      {/* Конфетти */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {particles.map((p, i) => (
          <circle
            key={i}
            cx={`${p.x}%`}
            cy={`${p.y}%`}
            r={p.r}
            fill={p.color}
            opacity={0.7}
            style={{
              animation: `floatUp 1.8s ${p.delay}s ease forwards`,
            }}
          />
        ))}
      </svg>

      <div
        style={{
          width: '100%', maxWidth: 340,
          background: 'rgba(8,16,40,0.98)',
          border: '1px solid rgba(0,229,208,0.25)',
          borderRadius: 24,
          padding: '32px 24px',
          textAlign: 'center',
          boxShadow: '0 0 60px rgba(0,229,208,0.12), 0 30px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Уровень */}
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0,229,208,0.2), rgba(124,77,255,0.2))',
            border: '2px solid rgba(0,229,208,0.4)',
            marginBottom: 16,
            boxShadow: '0 0 40px rgba(0,229,208,0.3)',
            animation: 'glowPulse 2s ease-in-out infinite',
          }}
        >
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 28, fontWeight: 700, color: '#00e5d0' }}>
            {levelUpPending}
          </span>
        </div>

        <div
          style={{
            display: 'inline-block',
            background: 'rgba(0,229,208,0.1)',
            border: '1px solid rgba(0,229,208,0.3)',
            borderRadius: 20,
            padding: '3px 14px',
            fontSize: 10,
            fontWeight: 700,
            color: '#00e5d0',
            letterSpacing: 1.5,
            marginBottom: 10,
          }}
        >
          НОВЫЙ УРОВЕНЬ
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#e8eeff', marginBottom: 6 }}>
          Уровень {levelUpPending}!
        </h2>
        <p style={{ fontSize: 13, color: '#6b7a99', marginBottom: 24 }}>
          Твой остров становится больше и сильнее
        </p>

        {/* Разблокировки */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, textAlign: 'left' }}>
          {unlocks.map((u, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(0,229,208,0.06)',
                border: '1px solid rgba(0,229,208,0.12)',
                borderRadius: 12, padding: '10px 14px',
                animation: `fadeInUp 0.3s ${0.1 + i * 0.1}s both ease`,
              }}
            >
              <span style={{ fontSize: 20 }}>{u.icon}</span>
              <span style={{ fontSize: 12, color: '#c8d4f0', fontWeight: 600 }}>{u.text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={dismissLevelUp}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #00b8a8, #00e5d0)',
            color: '#020c1a', fontSize: 14, fontWeight: 900,
            cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
            boxShadow: '0 4px 20px rgba(0,229,208,0.35)',
            letterSpacing: 0.3,
          }}
        >
          🚀 Продолжить
        </button>
      </div>
    </div>
  );
}
