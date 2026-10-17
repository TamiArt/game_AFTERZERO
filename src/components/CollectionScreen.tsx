import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthoritativeGame } from '../hooks/useAuthoritativeGame';
import { ArtifactIcon, type ArtifactKind } from './art/ArtifactIcon';

interface CollectItem {
  id: string;
  icon: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  desc: string;
  hint: string;
}

const ALL_ITEMS: CollectItem[] = [
  { id: 'i1',  icon: '🪨', art: 'stone', name: 'Древний камень',   rarity: 'common',    desc: 'Обломок прошлой цивилизации.',               hint: 'Собери камень на острове' },
  { id: 'i2',  icon: '🌿', art: 'leaf', name: 'Светящийся лист',  rarity: 'rare',      desc: 'Излучает слабое голубое свечение ночью.',    hint: 'Собери дерево 5 раз' },
  { id: 'i3',  icon: '💎', art: 'crystal', name: 'Кристалл Зеро',    rarity: 'epic',      desc: 'Осколок источника острова.',                 hint: 'Достигни уровня 3' },
  { id: 'i4',  icon: '🗝️', art: 'key', name: 'Ржавый ключ',      rarity: 'common',    desc: 'Подходит к руинам на севере.',               hint: 'Исследуй руины 2 раза' },
  { id: 'i5',  icon: '🔮', art: 'orb', name: 'Эфирная сфера',    rarity: 'legendary', desc: 'Формируется из энергии самого острова.',     hint: 'Пока недоступно' },
  { id: 'i6',  icon: '🦋', art: 'moth', name: 'Лунная бабочка',   rarity: 'rare',      desc: 'Появляется только при полной луне.',         hint: 'Найди питомца' },
  { id: 'i7',  icon: '⚗️', art: 'vial', name: 'Флакон портала',   rarity: 'epic',      desc: 'Содержит кусочек другого мира.',             hint: 'Запиши сигнал портала 3 раза' },
  { id: 'i8',  icon: '🐚', art: 'shell', name: 'Морская раковина',  rarity: 'common',    desc: 'Из глубин вокруг острова.',                  hint: 'Стартовый предмет' },
  { id: 'i9',  icon: '🌀', art: 'map', name: 'Фрагмент карты',   rarity: 'rare',      desc: '1 из 3. Нужны все части.',                  hint: 'Посети друга или построй 2+ зданий' },
  { id: 'i10', icon: '🌟', art: 'star', name: 'Звёздный песок',    rarity: 'legendary', desc: 'Падает со звёзд в новолуние.',               hint: 'Легендарная редкость' },
  { id: 'i11', icon: '🪵', art: 'wood', name: 'Живое дерево',      rarity: 'common',    desc: 'Дерево продолжает расти в ладони.',          hint: 'Собери дерево первый раз' },
  { id: 'i12', icon: '🐾', art: 'paw', name: 'Отпечаток',         rarity: 'rare',      desc: 'След таинственного существа.',               hint: 'Покорми питомца' },
];

const RARITY_COLORS: Record<string, string> = {
  common: '#8b9bb4', rare: '#00b8ff', epic: '#9b50f0', legendary: '#f5a857',
};
const RARITY_LABELS: Record<string, string> = {
  common: 'ОБЫЧНЫЙ', rare: 'РЕДКИЙ', epic: 'ЭПИЧЕСКИЙ', legendary: 'ЛЕГЕНДАРНЫЙ',
};

export function CollectionScreen() {
  const [selected, setSelected] = useState<CollectItem | null>(null);
  const foundItems    = useGameStore((s) => s?.foundItems ?? ['i8']);
  const resources     = useGameStore((s) => s?.resources ?? { wood: 0, stone: 0, metal: 0, energy: 0 });
  const { exploreCollection } = useAuthoritativeGame();

  const foundCount = ALL_ITEMS.filter((i) => foundItems.includes(i.id)).length;

  const handleExplore = () => {
    if (resources.energy < 10) {
      useGameStore
        .getState()
        .addToast('Нужно 10 энергии для исследования', '!', '#ff6b7a');
      return;
    }
    exploreCollection();
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '14px 14px 20px', animation: 'fadeInUp 0.25s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#e8eeff' }}>Коллекция</h2>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#6b7a99' }}>
          {foundCount}/{ALL_ITEMS.length} найдено
        </span>
      </div>

      {/* Прогресс */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: `${(foundCount / ALL_ITEMS.length) * 100}%`, height: '100%',
            background: 'linear-gradient(90deg, #7c4dff, #a060ff)', borderRadius: 3, transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Кнопка исследования */}
      <button onClick={handleExplore} style={{
        width: '100%', padding: '11px 0', borderRadius: 12, border: 'none',
        background: 'rgba(160,96,255,0.12)', color: '#a060ff',
        fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
        marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        outline: '1px solid rgba(160,96,255,0.2)',
      }}>
        <span>🔍 Исследовать случайный предмет</span>
        <span style={{ fontSize: 10, color: '#6b7a99' }}>(−10 ⚡)</span>
      </button>

      {/* Сетка предметов */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {ALL_ITEMS.map((item) => {
          const isFound = foundItems.includes(item.id);
          const color = RARITY_COLORS[item.rarity];
          const isSel = selected?.id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelected(isSel ? null : item)}
              style={{
                background: isFound ? `rgba(255,255,255,0.05)` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isSel ? color : isFound ? `${color}30` : 'rgba(255,255,255,0.05)'}`,
                borderRadius: 12, padding: '10px 6px 8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                cursor: 'pointer', transition: 'border-color 0.15s',
                boxShadow: isSel ? `0 0 12px ${color}40` : 'none',
              }}
            >
              <span style={{ fontSize: 26, filter: isFound ? 'none' : 'grayscale(1) brightness(0.3)' }}>
                {item.icon}
              </span>
              <div style={{ width: 24, height: 2.5, borderRadius: 1.5, background: isFound ? color : 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: 8.5, fontWeight: 700, color: isFound ? '#c8d4f0' : '#3a4460', textAlign: 'center', lineHeight: 1.2 }}>
                {isFound ? item.name : '???'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Панель деталей */}
      {selected && (
        <div style={{
          marginTop: 14,
          background: 'rgba(8,18,42,0.85)', backdropFilter: 'blur(16px)',
          border: `1px solid ${RARITY_COLORS[selected.rarity]}35`,
          borderRadius: 14, padding: 14, animation: 'fadeInUp 0.2s ease',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 32 }}>{selected.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#e8eeff', marginBottom: 2 }}>
                {foundItems.includes(selected.id) ? selected.name : '???'}
              </div>
              <div style={{
                display: 'inline-block', fontSize: 8, fontWeight: 700,
                color: RARITY_COLORS[selected.rarity],
                background: `${RARITY_COLORS[selected.rarity]}18`,
                border: `1px solid ${RARITY_COLORS[selected.rarity]}33`,
                borderRadius: 4, padding: '1px 6px', letterSpacing: 0.5, marginBottom: 4,
              }}>
                {RARITY_LABELS[selected.rarity]}
              </div>
              <p style={{ fontSize: 12, color: '#8090b0', lineHeight: 1.4 }}>
                {foundItems.includes(selected.id) ? selected.desc : `Подсказка: ${selected.hint}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
