import { useGameStore } from '../store/gameStore';
import { useAuthoritativeGame } from '../hooks/useAuthoritativeGame';

export function ShopScreen() {
  const { claimDaily: claimDailyReward } = useAuthoritativeGame();
  const lastDailyDate    = useGameStore((s) => s?.lastDailyDate ?? '');
  const level            = useGameStore((s) => s?.level ?? 1);

  const today = new Date().toISOString().split('T')[0];
  const dailyClaimed = lastDailyDate === today;

  const dailyWood   = 30 + level * 10;
  const dailyStone  = level >= 2 ? 15 + level * 5 : 0;
  const dailyEnergy = 10 + level * 3;

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '14px 14px 20px', animation: 'fadeInUp 0.25s ease' }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: '#e8eeff', marginBottom: 16 }}>Магазин</h2>

      {/* Ежедневная награда */}
      <div style={{
        background: dailyClaimed ? 'rgba(255,255,255,0.03)' : 'rgba(245,168,87,0.07)',
        border: `1px solid ${dailyClaimed ? 'rgba(255,255,255,0.07)' : 'rgba(245,168,87,0.3)'}`,
        borderRadius: 16, padding: '16px', marginBottom: 16,
        animation: dailyClaimed ? 'none' : 'glowPulse 3s ease-in-out infinite',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: dailyClaimed ? 'rgba(255,255,255,0.05)' : 'rgba(245,168,87,0.15)',
            border: `1px solid ${dailyClaimed ? 'rgba(255,255,255,0.08)' : 'rgba(245,168,87,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>🎁</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#e8eeff', marginBottom: 2 }}>Ежедневная награда</div>
            <div style={{ fontSize: 11, color: '#6b7a99' }}>{dailyClaimed ? '✅ Получена сегодня' : '⚡ Доступна прямо сейчас!'}</div>
          </div>
        </div>

        {/* Превью наград */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[
            { icon: '🌲', label: `+${dailyWood}`, color: '#6fc87a' },
            ...(dailyStone > 0 ? [{ icon: '🪨', label: `+${dailyStone}`, color: '#8b9bb4' }] : []),
            { icon: '⚡', label: `+${dailyEnergy}`, color: '#00ccff' },
            { icon: '⭐', label: '+80 XP', color: '#f5a857' },
          ].map((r, i) => (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '8px 4px',
            }}>
              <span style={{ fontSize: 18 }}>{r.icon}</span>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: r.color, fontWeight: 700 }}>{r.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={claimDailyReward}
          disabled={dailyClaimed}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
            background: dailyClaimed ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #e08030, #f5a857)',
            color: dailyClaimed ? '#3a4460' : '#020c1a',
            fontSize: 13, fontWeight: 900, cursor: dailyClaimed ? 'default' : 'pointer',
            fontFamily: 'Nunito, sans-serif',
          }}>
          {dailyClaimed ? 'Возвращайся завтра' : '🎁 Получить награду'}
        </button>
      </div>

      {/* Разделитель */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        <span style={{ fontSize: 10, color: '#6b7a99', fontWeight: 700, letterSpacing: 1 }}>СКОРО</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Иконка Coming Soon */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 10, animation: 'floatBob 4s ease-in-out infinite' }}>🛍️</div>
        <h3 style={{ fontSize: 16, fontWeight: 900, color: '#e8eeff', marginBottom: 8 }}>Магазин открывается</h3>
        <p style={{ fontSize: 12, color: '#6b7a99', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
          Эксклюзивные предметы, редкие артефакты и уникальные ускорения для твоего мира.
        </p>
      </div>

      {/* Превью категорий */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { icon: '🎨', label: 'Скины мира', desc: 'Смени облик острова', color: '#7c4dff' },
          { icon: '🐉', label: 'Редкие питомцы', desc: 'Легендарные компаньоны', color: '#00e5d0' },
          { icon: '⚡', label: 'Ускорения', desc: 'Мгновенное строительство', color: '#f5a857' },
          { icon: '💫', label: 'Telegram Stars', desc: 'Оплата звёздами', color: '#a060ff' },
        ].map((c) => (
          <div key={c.label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '14px 12px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `${c.color}15`, border: `1px solid ${c.color}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#c8d4f0', marginBottom: 2 }}>{c.label}</div>
              <div style={{ fontSize: 10, color: '#6b7a99' }}>{c.desc}</div>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: `${c.color}12`, border: `1px solid ${c.color}25`,
              borderRadius: 6, padding: '3px 8px', fontSize: 9, color: c.color, fontWeight: 700,
              alignSelf: 'flex-start',
            }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: c.color }} />
              СКОРО
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
