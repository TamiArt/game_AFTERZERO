import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface Friend {
  id: string;
  name: string;
  emoji: string;
  level: number;
  worldName: string;
  lastSeen: string;
  online: boolean;
  degree: number;
  buildings: { icon: string; name: string }[];
}

const FRIENDS: Friend[] = [
  { id: 'f1', name: 'Мира',   emoji: '🧝‍♀️', level: 8,  worldName: 'Остров Аврора',      lastSeen: 'Сейчас', online: true,  degree: 1, buildings: [{icon:'🏠',name:'Дом'},{icon:'🌿',name:'Сад'},{icon:'🔧',name:'Мастерская'}] },
  { id: 'f2', name: 'Лёо',    emoji: '🧙‍♂️', level: 12, worldName: 'Туманный Архипелаг',  lastSeen: '2ч назад', online: false, degree: 1, buildings: [{icon:'🌾',name:'Ферма'},{icon:'🏠',name:'Дом'}] },
  { id: 'f3', name: 'Зара',   emoji: '🧜‍♀️', level: 5,  worldName: 'Синяя лагуна',        lastSeen: 'Вчера', online: false, degree: 1, buildings: [{icon:'🌿',name:'Сад'}] },
  { id: 'f4', name: 'Элиас',  emoji: '🧑‍🔬', level: 19, worldName: 'Нексус',             lastSeen: '5ч назад', online: false, degree: 2, buildings: [{icon:'🧪',name:'Лаборатория'},{icon:'🔭',name:'Обсерватория'},{icon:'🏠',name:'Дом'}] },
  { id: 'f5', name: 'Виктор', emoji: '🧔',   level: 7,  worldName: 'Красный берег',       lastSeen: '3д назад', online: false, degree: 2, buildings: [{icon:'🌾',name:'Ферма'},{icon:'🏠',name:'Дом'}] },
];

// Мини-остров друга (изометрический, упрощённый)
function FriendWorldView({ friend, onLeave }: { friend: Friend; onLeave: () => void }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'linear-gradient(170deg, #040d1f 0%, #060f24 100%)',
      display: 'flex', flexDirection: 'column', animation: 'fadeInUp 0.3s ease',
    }}>
      {/* Шапка */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button onClick={onLeave} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, color: '#6b7a99', cursor: 'pointer', width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>←</button>
        <span style={{ fontSize: 22 }}>{friend.emoji}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#e8eeff' }}>{friend.name} · {friend.worldName}</div>
          <div style={{ fontSize: 10, color: '#6b7a99' }}>Уровень {friend.level} · {friend.lastSeen}</div>
        </div>
        {friend.online && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00e5d0', boxShadow: '0 0 6px rgba(0,229,208,0.8)' }} />
            <span style={{ fontSize: 10, color: '#00e5d0', fontWeight: 700 }}>ОНЛАЙН</span>
          </div>
        )}
      </div>

      {/* Мини остров */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        {/* Простая изометрическая иллюстрация */}
        <svg viewBox="0 0 260 180" width="260" height="180" style={{ marginBottom: 16 }}>
          {/* Вода */}
          <ellipse cx={130} cy={120} rx={110} ry={40} fill="#0d2548" opacity={0.6} style={{ animation: 'shimmerWater 3s ease-in-out infinite' }} />

          {/* Тайлы острова */}
          {[[0,0],[40,12],[80,0],[20,24],[60,12],[100,24],[40,36]].map(([x,y],i) => (
            <polygon key={i}
              points={`${100+x},${60+y} ${140+x},${80+y} ${100+x},${100+y} ${60+x},${80+y}`}
              fill={['#2a7a18','#2a7a18','#1d6010','#2a7a18','#24700d','#1d6010','#2a7a18'][i]}
            />
          ))}

          {/* Постройки друга */}
          {friend.buildings.slice(0,3).map((b, i) => (
            <text key={i} x={80 + i * 38} y={68} fontSize="22" textAnchor="middle">{b.icon}</text>
          ))}

          {/* Деревья */}
          <ellipse cx={165} cy={60} rx={12} ry={7} fill="#155008" />
          <ellipse cx={165} cy={52} rx={8} ry={5} fill="#1d720d" />
          <ellipse cx={68} cy={72} rx={10} ry={6} fill="#1b6a0c" />
        </svg>

        {/* Постройки */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: '12px 16px', width: '100%', maxWidth: 300, marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, color: '#6b7a99', marginBottom: 8, fontWeight: 700 }}>ПОСТРОЙКИ</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {friend.buildings.map((b, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8, padding: '4px 8px', fontSize: 11, color: '#c8d4f0',
              }}>
                <span>{b.icon}</span> {b.name}
              </div>
            ))}
          </div>
        </div>

        {/* Сообщение */}
        <div style={{
          background: 'rgba(0,229,208,0.06)', border: '1px solid rgba(0,229,208,0.15)',
          borderRadius: 12, padding: '10px 14px', fontSize: 12, color: '#8090b0',
          lineHeight: 1.5, textAlign: 'center', maxWidth: 300,
        }}>
          💬 {friend.name} приветствует тебя! Заходи почаще ✨
        </div>
      </div>
    </div>
  );
}

export function SocialScreen() {
  const [view, setView] = useState<'friends' | 'network'>('friends');
  const [visiting, setVisiting] = useState<Friend | null>(null);
  const visitFriend = useGameStore((s) => s?.visitFriend ?? (() => {}));
  const leaveVisit  = useGameStore((s) => s?.leaveVisit ?? (() => {}));
  const addToast    = useGameStore((s) => s?.addToast ?? (() => {}));

  const handleVisit = (f: Friend) => {
    visitFriend(f.id);
    setVisiting(f);
    addToast(`Путешествие в мир «${f.worldName}»`, '🚀', '#00e5d0');
  };

  const handleLeave = () => {
    leaveVisit();
    setVisiting(null);
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '14px 14px 20px', animation: 'fadeInUp 0.25s ease', position: 'relative' }}>
      {visiting && <FriendWorldView friend={visiting} onLeave={handleLeave} />}

      <h2 style={{ fontSize: 18, fontWeight: 900, color: '#e8eeff', marginBottom: 14 }}>Социальное</h2>

      {/* Переключатель */}
      <div style={{
        display: 'flex', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 3, marginBottom: 16, gap: 3,
      }}>
        {(['friends', 'network'] as const).map((v) => {
          const active = view === v;
          return (
            <button key={v} onClick={() => setView(v)} style={{
              flex: 1, padding: '7px 0', borderRadius: 7, border: 'none',
              background: active ? 'rgba(0,229,208,0.12)' : 'transparent',
              color: active ? '#00e5d0' : '#6b7a99',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', transition: 'all 0.15s',
            }}>
              {v === 'friends' ? '👥 Друзья' : '🌐 Сеть миров'}
            </button>
          );
        })}
      </div>

      {view === 'friends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FRIENDS.map((f) => (
            <div key={f.id} style={{
              display: 'flex', gap: 12, alignItems: 'center',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${f.online ? 'rgba(0,229,208,0.15)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 14, padding: '12px 14px',
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, border: '1px solid rgba(255,255,255,0.08)',
                }}>{f.emoji}</div>
                {f.online && (
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#00e5d0', border: '1.5px solid #040d1f',
                    boxShadow: '0 0 6px rgba(0,229,208,0.8)',
                  }} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#e8eeff' }}>{f.name}</span>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#6b7a99' }}>Lv.{f.level}</span>
                  {f.degree === 2 && (
                    <span style={{ fontSize: 7, color: '#a060ff', background: 'rgba(160,96,255,0.12)', border: '1px solid rgba(160,96,255,0.2)', borderRadius: 3, padding: '1px 4px', fontWeight: 700 }}>2-я связь</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#6b7a99' }}>🏝️ {f.worldName}</div>
                <div style={{ fontSize: 10, color: '#4a5878', marginTop: 2 }}>{f.lastSeen}</div>
              </div>

              <button onClick={() => handleVisit(f)} style={{
                padding: '6px 12px', borderRadius: 8,
                border: '1px solid rgba(0,229,208,0.25)',
                background: 'rgba(0,229,208,0.08)', color: '#00e5d0',
                fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                fontFamily: 'Nunito, sans-serif', transition: 'all 0.15s',
              }}>Посетить</button>
            </div>
          ))}
        </div>
      )}

      {view === 'network' && (
        <div>
          <div style={{
            background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.2)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, color: '#8090b0', marginBottom: 6 }}>Теория 7 рукопожатий</div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[{ label: 'Прямые связи', val: '3', icon: '👥' }, { label: 'Через 1', val: '12', icon: '🔗' }, { label: 'Через 2', val: '67', icon: '🌐' }].map((s) => (
                <div key={s.label} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 20, marginBottom: 3 }}>{s.icon}</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 16, fontWeight: 700, color: '#e8eeff' }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: '#6b7a99', marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <h3 style={{ fontSize: 11, fontWeight: 800, color: '#8090b0', letterSpacing: 0.5, marginBottom: 10 }}>АКТИВНОСТЬ СЕТИ</h3>
          {[
            { actor: 'Мира', action: 'построила Мастерскую', time: '12 мин', icon: '🏗️' },
            { actor: 'Элиас', action: 'открыл новую зону', time: '1ч', icon: '🗺️' },
            { actor: 'Лёо', action: 'нашёл артефакт', time: '2ч', icon: '💎' },
            { actor: 'Зара', action: 'посетила мир Льо', time: '3ч', icon: '🚀' },
          ].map((e, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'center', padding: '9px 0',
              borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <span style={{ fontSize: 18 }}>{e.icon}</span>
              <span style={{ flex: 1, fontSize: 12, color: '#c8d4f0' }}>
                <strong style={{ color: '#e8eeff' }}>{e.actor}</strong> {e.action}
              </span>
              <span style={{ fontSize: 10, color: '#4a5878', flexShrink: 0 }}>{e.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
