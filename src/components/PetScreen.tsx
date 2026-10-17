import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthoritativeGame } from '../hooks/useAuthoritativeGame';
import { isGameBackendConfigured } from '../api/game';
import { NoxCreature } from './art/NoxCreature';

export function PetScreen() {
  const level      = useGameStore((s) => s?.level ?? 1);
  const pet        = useGameStore((s) => s?.pet);
  const { petAction } = useAuthoritativeGame();
  const updatePetStats = useGameStore((s) => s?.updatePetStats ?? (() => {}));

  useEffect(() => {
    if (!isGameBackendConfigured()) updatePetStats();
  }, [updatePetStats]);

  const discovered = pet?.discovered ?? false;
  const petLevel   = pet?.level ?? 1;

  const hunger  = Math.round(pet?.hunger  ?? 80);
  const mood    = Math.round(pet?.mood    ?? 75);
  const health  = Math.round(pet?.health  ?? 90);
  const petXp   = pet?.xp ?? 0;
  const petXpNext = pet?.xpNext ?? 200;

  const moodLabel = mood > 80 ? 'Счастливый' : mood > 50 ? 'Игривый' : mood > 25 ? 'Скучающий' : 'Грустный';
  const hungerLabel = hunger > 70 ? 'Сытый' : hunger > 40 ? 'Немного голодный' : 'Голодный!';

  if (!discovered) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 32, animation: 'fadeInUp 0.25s ease',
      }}>
        <div style={{
          width: 100, height: 100, borderRadius: 24, marginBottom: 20,
          background: 'linear-gradient(135deg, rgba(160,96,255,0.1), rgba(0,229,208,0.1))',
          border: '1px solid rgba(160,96,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 48, animation: 'floatBob 4s ease-in-out infinite',
        }}>
          <NoxCreature dormant />
        </div>

        <div style={{
          display: 'inline-block',
          background: 'rgba(245,168,87,0.1)', border: '1px solid rgba(245,168,87,0.3)',
          borderRadius: 20, padding: '3px 12px', marginBottom: 12,
          fontSize: 10, fontWeight: 700, color: '#f5a857', letterSpacing: 1,
        }}>СКОРО</div>

        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#e8eeff', textAlign: 'center', marginBottom: 10 }}>
          Питомец ждёт тебя
        </h2>
        <p style={{ fontSize: 13, color: '#6b7a99', textAlign: 'center', lineHeight: 1.6, maxWidth: 260 }}>
          Нокс появится на острове когда твоя цивилизация достигнет <span style={{ color: '#00e5d0', fontWeight: 700 }}>Уровня 5</span>.
          Продолжай строить и исследовать!
        </p>

        {/* XP progress */}
        <div style={{
          marginTop: 24, width: '100%', maxWidth: 260,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '12px 16px',
        }}>
          <div style={{ fontSize: 11, color: '#6b7a99', marginBottom: 6 }}>Прогресс до Уровня 5</div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (level / 5) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #a060ff, #00e5d0)', borderRadius: 3 }} />
          </div>
        </div>
      </div>
    );
  }

  const ABILITIES = [
    { id: 'find', icon: '🔍', label: 'Ищет предметы', active: true,  desc: 'Находит редкие артефакты при исследовании.' },
    { id: 'mine', icon: '⛏️', label: 'Добыча',        active: petLevel >= 5, desc: petLevel >= 5 ? 'Помогает добывать ресурсы.' : 'Открывается на уровне 5.' },
    { id: 'fly',  icon: '🪽',  label: 'Полёт',        active: petLevel >= 10, desc: petLevel >= 10 ? 'Может перелетать на другие острова.' : 'Открывается на уровне 10.' },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '14px 14px 20px', animation: 'fadeInUp 0.25s ease' }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: '#e8eeff', marginBottom: 16 }}>Питомец</h2>

      {/* Карточка питомца */}
      <div style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(160,96,255,0.2)',
        borderRadius: 18, padding: 20, marginBottom: 14,
        display: 'flex', gap: 16, alignItems: 'center',
      }}>
        <div style={{
          width: 90, height: 90, borderRadius: 20, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(124,77,255,0.2) 0%, rgba(0,229,208,0.15) 100%)',
          border: '1px solid rgba(160,96,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 48, animation: 'floatBob 3.5s ease-in-out infinite',
        }}>
          <NoxCreature />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#e8eeff' }}>{pet?.name ?? 'Нокс'}</span>
            <span style={{
              fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#a060ff',
              background: 'rgba(160,96,255,0.12)', border: '1px solid rgba(160,96,255,0.25)',
              borderRadius: 4, padding: '1px 5px',
            }}>Lv.{petLevel}</span>
          </div>

          <div style={{ fontSize: 11, color: '#6b7a99', marginBottom: 8 }}>
            {moodLabel} · {pet?.species ?? 'Лисица-призрак'}
          </div>

          {/* Статы */}
          {[
            { label: 'Здоровье',   val: health,  max: 100, color: '#ff6b7a', icon: '❤️' },
            { label: 'Сытость',    val: hunger,  max: 100, color: '#f5a857', icon: '🍖' },
            { label: 'Настроение', val: mood,    max: 100, color: '#00e5d0', icon: '✨' },
          ].map((st) => (
            <div key={st.label} style={{ marginBottom: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 9, color: '#6b7a99' }}>{st.icon} {st.label}</span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: st.val < 30 ? '#ff6b7a' : '#8090b0' }}>
                  {st.val}/{st.max}
                </span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  width: `${(st.val / st.max) * 100}%`, height: '100%',
                  background: st.color, borderRadius: 2, transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          ))}

          {/* XP питомца */}
          <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 9, color: '#6b7a99' }}>⭐ Опыт</span>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#8090b0' }}>{petXp}/{petXpNext}</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, (petXp / petXpNext) * 100)}%`, height: '100%',
                background: 'linear-gradient(90deg, #7c4dff, #a060ff)', borderRadius: 2, transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Предупреждение о голоде */}
      {hunger < 30 && (
        <div style={{
          background: 'rgba(255,107,122,0.1)', border: '1px solid rgba(255,107,122,0.3)',
          borderRadius: 10, padding: '8px 12px', marginBottom: 12,
          fontSize: 11, color: '#ff6b7a', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠️</span> Нокс голоден! Покорми питомца.
        </div>
      )}

      {/* Действия */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { icon: '🍖', label: 'Покормить', action: () => petAction('feed'), color: '#f5a857', disabled: hunger >= 95 },
          { icon: '🎮', label: 'Играть',    action: () => petAction('play'), color: '#00e5d0', disabled: false },
          { icon: '💤', label: 'Отдыхать',  action: () => petAction('rest'), color: '#a060ff', disabled: health >= 95 },
        ].map((a) => (
          <button
            key={a.label}
            disabled={a.disabled}
            onClick={a.action}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '10px 4px',
              background: a.disabled ? 'rgba(255,255,255,0.02)' : `${a.color}12`,
              border: `1px solid ${a.disabled ? 'rgba(255,255,255,0.04)' : a.color + '35'}`,
              borderRadius: 12, cursor: a.disabled ? 'default' : 'pointer',
              opacity: a.disabled ? 0.35 : 1, transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 22 }}>{a.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: a.disabled ? '#3a4460' : '#8090b0' }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Информация */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, padding: '10px 12px', marginBottom: 14,
        fontSize: 11, color: '#6b7a99', lineHeight: 1.6,
      }}>
        💡 {hungerLabel}. Статы убывают со временем.
      </div>

      {/* Способности */}
      <h3 style={{ fontSize: 12, fontWeight: 800, color: '#8090b0', letterSpacing: 0.5, marginBottom: 10 }}>СПОСОБНОСТИ</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ABILITIES.map((ab) => (
          <div key={ab.id} style={{
            display: 'flex', gap: 12, alignItems: 'center',
            background: ab.active ? 'rgba(160,96,255,0.08)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${ab.active ? 'rgba(160,96,255,0.2)' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: 12, padding: '10px 12px', opacity: ab.active ? 1 : 0.45,
          }}>
            <span style={{ fontSize: 22 }}>{ab.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#dde8ff', marginBottom: 1 }}>{ab.label}</div>
              <div style={{ fontSize: 11, color: '#6b7a99' }}>{ab.desc}</div>
            </div>
            {ab.active && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5d0', boxShadow: '0 0 6px rgba(0,229,208,0.8)' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
