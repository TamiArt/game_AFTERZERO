import { useGameStore, calcXpNext } from '../store/gameStore';
import { GameIcon } from './ui/GameIcon';

const RESOURCE_ICONS = { wood: '🌲', stone: '🪨', metal: '⚙️', energy: '⚡' } as const;
const RESOURCE_COLORS = {
  wood: '#6fc87a', stone: '#8b9bb4', metal: '#c0cfd9', energy: '#00ccff',
} as const;

const DEFAULT_RESOURCES = { wood: 0, stone: 0, metal: 0, energy: 0 };

export function TopBar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const playerName = useGameStore((s) => s?.playerName ?? 'Игрок');
  const level      = useGameStore((s) => s?.level ?? 1);
  const xp         = useGameStore((s) => s?.xp ?? 0);
  const resources  = useGameStore((s) => s?.resources ?? DEFAULT_RESOURCES);

  const xpNext = calcXpNext(level);
  const pct = xpNext > 0 ? Math.min(100, Math.round((xp / xpNext) * 100)) : 0;

  return (
    <header
      style={{
        padding: '10px 14px 8px',
        background: 'rgba(4,13,31,0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0, zIndex: 10, position: 'relative',
      }}
    >
      {/* Строка игрока */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00e5d0 0%, #7c4dff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0, boxShadow: '0 0 0 2px rgba(0,229,208,0.25)',
          }}
        >
          <span
            style={{
              color: '#e8ffff',
              fontFamily: 'Space Mono, monospace',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {playerName.slice(0, 1).toUpperCase()}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#e8eeff', letterSpacing: 0.2 }}>
              {playerName}
            </span>
            <span
              style={{
                fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700,
                color: '#00e5d0', background: 'rgba(0,229,208,0.1)',
                border: '1px solid rgba(0,229,208,0.2)', borderRadius: 4, padding: '1px 5px',
              }}
            >
              Lv.{level}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <div
              style={{
                flex: 1, height: 4, borderRadius: 2,
                background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pct}%`, height: '100%',
                  background: 'linear-gradient(90deg, #00b8a8, #00e5d0)',
                  borderRadius: 2, transition: 'width 0.4s ease',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: 'Space Mono, monospace', fontSize: 9,
                color: '#6b7a99', flexShrink: 0,
              }}
            >
              {xp}/{xpNext}
            </span>
          </div>
        </div>

        <button
          aria-label="Открыть настройки"
          onClick={onOpenSettings}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 15, flexShrink: 0,
          }}
        >
          <GameIcon name="settings" size={16} />
        </button>
      </div>

      {/* Ресурсы */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(Object.keys(RESOURCE_ICONS) as Array<keyof typeof RESOURCE_ICONS>).map((key) => (
          <div
            key={key}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 7, padding: '4px 6px',
            }}
          >
            <span style={{ fontSize: 12, lineHeight: 1 }}>{RESOURCE_ICONS[key]}</span>
            <span
              style={{
                fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700,
                color: RESOURCE_COLORS[key], letterSpacing: -0.3,
              }}
            >
              {resources[key] ?? 0}
            </span>
          </div>
        ))}
      </div>
    </header>
  );
}
