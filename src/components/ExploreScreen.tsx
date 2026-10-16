import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Resources } from '../store/gameStore';
import { useAuthoritativeGame } from '../hooks/useAuthoritativeGame';

interface QuestDef {
  id: string;
  icon: string;
  title: string;
  desc: string;
  total: number;
  reward: string;
  rewardXP: number;
  rewardResources?: Partial<Resources>;
  rewardItems?: string[];
  category: 'active' | 'mystery' | 'daily';
  minLevel: number;
  repeatable?: boolean;
}

const QUEST_DEFS: QuestDef[] = [
  // Уровень 1
  {
    id: 'q_collect', icon: '🌲', title: 'Первый сбор',
    desc: 'Собери ресурсы 3 раза. Кликни на деревья на острове.',
    total: 3, reward: '🌲×20', rewardXP: 40, rewardResources: { wood: 20 },
    category: 'active', minLevel: 1,
  },
  {
    id: 'q_build', icon: '🏗️', title: 'Начало строительства',
    desc: 'Построй 1 структуру. Нажми кнопку СТРОИТЬ и выбери тайл.',
    total: 1, reward: '⭐×50 XP', rewardXP: 50,
    category: 'active', minLevel: 1,
  },
  {
    id: 'q_ruins', icon: '🗺️', title: 'Осмотр руин',
    desc: 'Исследуй руины 2 раза — в каждом осмотре скрыт фрагмент истории.',
    total: 2, reward: '🗝️ Ржавый ключ + 30 XP', rewardXP: 30, rewardItems: ['i4'],
    category: 'mystery', minLevel: 1,
  },
  {
    id: 'q_daily', icon: '☀️', title: 'Утренний сбор',
    desc: 'Собери ресурсы 5 раз за сегодня.',
    total: 5, reward: '⚡×15', rewardXP: 25, rewardResources: { energy: 15 },
    category: 'daily', minLevel: 1, repeatable: true,
  },

  // Уровень 2
  {
    id: 'q_stone', icon: '🪨', title: 'Каменный путь',
    desc: 'Собери камень 3 раза. Каменный узел появляется на уровне 2.',
    total: 3, reward: '🪨×15', rewardXP: 45, rewardResources: { stone: 15 },
    category: 'active', minLevel: 2,
  },
  {
    id: 'q_pet', icon: '🦊', title: 'Питомец голоден',
    desc: 'Покорми Нокса 1 раз. Зайди на вкладку Питомец.',
    total: 1, reward: '🐾 Отпечаток + 30 XP', rewardXP: 30, rewardItems: ['i12'],
    category: 'active', minLevel: 2,
  },
  {
    id: 'q_visit', icon: '🚀', title: 'Путешественник',
    desc: 'Посети мир одного из друзей. Зайди в Социальное → нажми Посетить.',
    total: 1, reward: '🌀 Фрагмент карты + 60 XP', rewardXP: 60, rewardItems: ['i9'],
    category: 'active', minLevel: 2,
  },

  // Уровень 3
  {
    id: 'q_portal', icon: '🌀', title: 'Тайна портала',
    desc: 'Запиши сигнал портала 3 раза. Кликни на портал и «Записать сигнал».',
    total: 3, reward: '⚗️ Флакон портала + 80 XP', rewardXP: 80, rewardItems: ['i7'],
    category: 'mystery', minLevel: 3,
  },
  {
    id: 'q_builder', icon: '🏛️', title: 'Мастер строитель',
    desc: 'Построй 3 здания в общей сложности.',
    total: 3, reward: '💎 Кристалл Зеро + 70 XP', rewardXP: 70, rewardItems: ['i3'],
    category: 'active', minLevel: 3,
  },
];

const CAT_LABELS = { active: 'АКТИВНЫЕ', mystery: 'ТАЙНЫ', daily: 'ЕЖЕДНЕВНЫЕ' } as const;
const CAT_COLORS = { active: '#00e5d0', mystery: '#a060ff', daily: '#f5a857' } as const;

export function ExploreScreen() {
  const [filter, setFilter] = useState<'all' | 'active' | 'mystery' | 'daily'>('all');

  const level         = useGameStore((s) => s?.level ?? 1);
  const questProgress = useGameStore((s) => s?.questProgress ?? {});
  const claimedQuests = useGameStore((s) => s?.claimedQuests ?? []);
  const { claimQuest } = useAuthoritativeGame();
  const woodCollects  = useGameStore((s) => s?.woodCollects ?? 0);
  const stoneCollects = useGameStore((s) => s?.stoneCollects ?? 0);
  const ruinsVisits   = useGameStore((s) => s?.ruinsVisits ?? 0);
  const totalBuilt    = useGameStore((s) => s?.totalBuilt ?? 0);
  const portalInteracts = useGameStore((s) => s?.portalInteracts ?? 0);
  const friendVisited = useGameStore((s) => s?.friendVisited ?? false);

  // Считаем прогресс квестов с реальными данными
  const realProgress: Record<string, number> = {
    ...questProgress,
    q_collect: Math.max(questProgress['q_collect'] ?? 0, Math.min(3, woodCollects + stoneCollects)),
    q_stone:   stoneCollects,
    q_ruins:   ruinsVisits,
    q_build:   Math.min(1, totalBuilt),
    q_builder: totalBuilt,
    q_portal:  portalInteracts,
    q_visit:   friendVisited ? 1 : 0,
    q_daily:   Math.max(questProgress['q_daily'] ?? 0, Math.min(5, woodCollects + stoneCollects)),
    q_pet:     Math.max(questProgress['q_pet'] ?? 0),
  };

  const visible = QUEST_DEFS.filter(
    (q) => q.minLevel <= level && (filter === 'all' || q.category === filter),
  );

  const handleClaim = (q: QuestDef) => {
    claimQuest(q.id, q.rewardXP, q.rewardResources, q.rewardItems);
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '14px 14px 20px', animation: 'fadeInUp 0.25s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#e8eeff' }}>Исследование</h2>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#6b7a99' }}>
          Ур.{level} · {visible.filter((q) => claimedQuests.includes(q.id)).length}/{visible.length} выполнено
        </span>
      </div>

      {/* Фильтры */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', 'active', 'mystery', 'daily'] as const).map((f) => {
          const active = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', borderRadius: 20,
              border: `1px solid ${active ? '#00e5d0' : 'rgba(255,255,255,0.1)'}`,
              background: active ? 'rgba(0,229,208,0.12)' : 'rgba(255,255,255,0.04)',
              color: active ? '#00e5d0' : '#6b7a99',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
            }}>
              {f === 'all' ? 'ВСЕ' : CAT_LABELS[f]}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.map((q) => {
          const progress  = Math.min(q.total, realProgress[q.id] ?? 0);
          const pct       = q.total > 0 ? (progress / q.total) * 100 : 0;
          const done      = progress >= q.total;
          const claimed   = claimedQuests.includes(q.id);
          const catColor  = CAT_COLORS[q.category];

          return (
            <div key={q.id} style={{
              background: claimed ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${done && !claimed ? 'rgba(0,229,208,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 14, padding: 14, opacity: claimed ? 0.5 : 1,
              transition: 'opacity 0.3s',
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: done && !claimed ? 'rgba(0,229,208,0.1)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${done && !claimed ? 'rgba(0,229,208,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  {claimed ? '✅' : q.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#e8eeff' }}>{q.title}</span>
                    <span style={{
                      fontSize: 8, fontWeight: 700, color: catColor,
                      background: `${catColor}18`, border: `1px solid ${catColor}33`,
                      borderRadius: 4, padding: '1px 5px', letterSpacing: 0.4, flexShrink: 0,
                    }}>{CAT_LABELS[q.category]}</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: '#6b7a99', marginBottom: 8, lineHeight: 1.4 }}>{q.desc}</p>

                  <div style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#6b7a99' }}>
                        {progress}/{q.total}
                      </span>
                      {done && !claimed && (
                        <button onClick={() => handleClaim(q)} style={{
                          fontSize: 9, color: '#020c1a', fontWeight: 800, background: '#00e5d0',
                          border: 'none', borderRadius: 4, padding: '2px 7px', cursor: 'pointer',
                          fontFamily: 'Nunito, sans-serif',
                        }}>ЗАБРАТЬ</button>
                      )}
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%', borderRadius: 2,
                        background: claimed ? 'rgba(0,229,208,0.3)' : done
                          ? 'linear-gradient(90deg, #00b8a8, #00e5d0)'
                          : `linear-gradient(90deg, ${catColor}aa, ${catColor})`,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>

                  <div style={{ fontSize: 10, color: '#f5a857', fontWeight: 700 }}>
                    Награда: {q.reward} + {q.rewardXP} XP
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Заблокированные квесты следующего уровня */}
        {level < 3 && QUEST_DEFS.filter((q) => q.minLevel === level + 1).length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: 14, opacity: 0.45, textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>🔒</div>
            <div style={{ fontSize: 12, color: '#6b7a99' }}>
              Больше квестов откроется на <span style={{ color: '#00e5d0', fontWeight: 700 }}>Уровне {level + 1}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
