import type { Tab } from '../App';
import { GameIcon, type GameIconName } from './ui/GameIcon';

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
}

const TABS: { id: Tab; icon: GameIconName; label: string }[] = [
  { id: 'world',      icon: 'world', label: 'МИР' },
  { id: 'explore',    icon: 'explore', label: 'ИССЛЕДОВАТЬ' },
  { id: 'collection', icon: 'collection', label: 'КОЛЛЕКЦИЯ' },
  { id: 'pet',        icon: 'pet', label: 'ПИТОМЕЦ' },
  { id: 'social',     icon: 'social', label: 'СЕТЬ' },
  { id: 'shop',       icon: 'shop', label: 'МАГАЗИН' },
];

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      style={{
        display: 'flex',
        background: 'rgba(4,13,31,0.92)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
        zIndex: 10,
        position: 'relative',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        const isShop = tab.id === 'shop';
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '8px 2px 10px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              opacity: 1,
              transition: 'opacity 0.15s',
            }}
          >
            {/* Active indicator */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 28,
                  height: 2,
                  background: '#00e5d0',
                  borderRadius: '0 0 2px 2px',
                  boxShadow: '0 0 8px rgba(0,229,208,0.8)',
                }}
              />
            )}

            <span
              style={{
                color: isActive ? '#00e5d0' : '#4a5878',
                display: 'flex',
                filter: isActive ? 'drop-shadow(0 0 7px rgba(0,229,208,.45))' : 'none',
                lineHeight: 1,
              }}
            >
              <GameIcon name={tab.icon} size={19} />
            </span>
            <span
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: 8,
                fontWeight: isActive ? 800 : 500,
                color: isActive ? '#00e5d0' : '#4a5878',
                letterSpacing: 0.4,
                lineHeight: 1,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
