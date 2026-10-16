import { useGameStore } from '../store/gameStore';

export function Toast() {
  const toasts = useGameStore((s) => s.toasts);
  const removeToast = useGameStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        pointerEvents: 'none',
        width: 260,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          style={{
            background: 'rgba(6,12,32,0.96)',
            backdropFilter: 'blur(24px)',
            border: `1px solid ${t.color}40`,
            borderRadius: 12,
            padding: '9px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'fadeInUp 0.2s ease',
            boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${t.color}18`,
            pointerEvents: 'all',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 17, lineHeight: 1 }}>{t.icon}</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#dde8ff',
              fontFamily: 'Nunito, sans-serif',
              flex: 1,
            }}
          >
            {t.text}
          </span>
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: t.color,
              flexShrink: 0,
            }}
          />
        </div>
      ))}
    </div>
  );
}
