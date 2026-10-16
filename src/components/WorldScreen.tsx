import { useState, useEffect, useCallback } from 'react';
import { useGameStore, type PlacedBuilding, type ResourceKey } from '../store/gameStore';
import { useAuthoritativeGame } from '../hooks/useAuthoritativeGame';

// ─── Изометрические константы ─────────────────────────────────────────────────

const TW = 80;
const TH = 40;
const TD = 18;
const CX = 280;
const CY = 150;

function tPos(c: number, r: number) {
  return { x: CX + (c - r) * (TW / 2), y: CY + (c + r - 6) * (TH / 2) };
}

function flat(x: number, y: number, w = TW, h = TH) {
  const hw = w / 2, hh = h / 2;
  return `${x},${y - hh} ${x + hw},${y} ${x},${y + hh} ${x - hw},${y}`;
}

// ─── Карты по уровням ─────────────────────────────────────────────────────────

const MAPS: Record<number, number[][]> = {
  1: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  2: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  3: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
};

// ─── Статические объекты по уровням ──────────────────────────────────────────

interface StaticObj {
  id: string;
  type: string;
  c: number;
  r: number;
  scale?: number;
  minLevel?: number;
  resource?: ResourceKey;
}

const STATIC_OBJECTS: StaticObj[] = [
  { id: 'player',     type: 'player', c: 3, r: 3, minLevel: 1 },
  { id: 'tree-1',     type: 'tree',   c: 2, r: 3, scale: 1.0, minLevel: 1, resource: 'wood' },
  { id: 'portal',     type: 'portal', c: 3, r: 2, minLevel: 1 },
  { id: 'ruins',      type: 'ruins',  c: 4, r: 3, minLevel: 1 },
  { id: 'fog-1',      type: 'fog',    c: 3, r: 4, minLevel: 1 },

  { id: 'tree-2',     type: 'tree',   c: 1, r: 2, scale: 0.85, minLevel: 2, resource: 'wood' },
  { id: 'stone-1',    type: 'stone',  c: 4, r: 2, minLevel: 2, resource: 'stone' },
  { id: 'pet-map',    type: 'petmap', c: 2, r: 2, minLevel: 2 },

  { id: 'tree-3',     type: 'tree',   c: 5, r: 3, scale: 0.7, minLevel: 3, resource: 'wood' },
  { id: 'crystal-1',  type: 'crystal',c: 4, r: 4, minLevel: 3, resource: 'metal' },
];

// ─── Определения зданий ───────────────────────────────────────────────────────

export interface BuildDef {
  id: string;
  name: string;
  icon: string;
  cost: { wood?: number; stone?: number; metal?: number; energy?: number };
  durationSec: number;
  effect: string;
  reqLevel?: number;
  topColor: string;
  leftColor: string;
  rightColor: string;
}

export const BUILD_DEFS: BuildDef[] = [
  { id: 'house',       name: 'Дом',         icon: '🏠', cost: { wood: 50, stone: 20 }, durationSec: 15, effect: '+2 населения',            topColor: '#b07848', leftColor: '#7a4f2a', rightColor: '#9a6038' },
  { id: 'garden',      name: 'Сад',          icon: '🌿', cost: { wood: 30 },            durationSec: 10, effect: '+10⚡ каждые 2 мин',       topColor: '#4a9a2a', leftColor: '#2a6010', rightColor: '#3a7520' },
  { id: 'workshop',    name: 'Мастерская',   icon: '🔧', cost: { wood: 80, stone: 20 }, durationSec: 25, reqLevel: 2, effect: 'Ускоряет добычу',  topColor: '#708090', leftColor: '#3a4455', rightColor: '#4a5565' },
  { id: 'farm',        name: 'Ферма',        icon: '🌾', cost: { wood: 60, stone: 30 }, durationSec: 20, reqLevel: 2, effect: '+камень пассивно', topColor: '#c8a040', leftColor: '#8a6820', rightColor: '#aa8030' },
  { id: 'lab',         name: 'Лаборатория',  icon: '🧪', cost: { stone: 60, metal: 40 }, durationSec: 90, reqLevel: 8, effect: 'Открывает тайны',  topColor: '#507090', leftColor: '#204050', rightColor: '#305060' },
  { id: 'observatory', name: 'Обсерватория', icon: '🔭', cost: { stone: 100, metal: 60, energy: 40 }, durationSec: 120, reqLevel: 10, effect: '+50% XP', topColor: '#405080', leftColor: '#202840', rightColor: '#303860' },
];

// ─── Компоненты рисования ─────────────────────────────────────────────────────

function WaterTile({ c, r }: { c: number; r: number }) {
  const { x, y } = tPos(c, r);
  const isEdge = c === 0 || c === 6 || r === 0 || r === 6;
  return (
    <polygon
      points={flat(x, y)}
      fill={isEdge ? '#081830' : '#0d2548'}
      stroke="rgba(0,80,180,0.12)"
      strokeWidth="0.5"
      style={{ animation: `shimmerWater ${2.5 + (c + r) * 0.1}s ease-in-out ${(c * r) * 0.08}s infinite` }}
    />
  );
}

function GrassTile({ c, r, highlight = false, onClick }: { c: number; r: number; highlight?: boolean; onClick?: () => void }) {
  const { x, y } = tPos(c, r);
  const hh = TH / 2, hw = TW / 2;
  const topPts  = `${x},${y - TD - hh} ${x + hw},${y - TD} ${x},${y - TD + hh} ${x - hw},${y - TD}`;
  const leftPts = `${x - hw},${y - TD} ${x},${y - TD + hh} ${x},${y + hh} ${x - hw},${y}`;
  const rightPts= `${x + hw},${y - TD} ${x},${y - TD + hh} ${x},${y + hh} ${x + hw},${y}`;
  return (
    <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <polygon points={leftPts}  fill={highlight ? '#2a7020' : '#194d0d'} />
      <polygon points={rightPts} fill={highlight ? '#358025' : '#20600f'} />
      <polygon points={topPts}   fill={highlight ? '#42b030' : '#2a7a18'}
        stroke={highlight ? 'rgba(0,229,208,0.6)' : 'none'} strokeWidth="1" />
      {highlight && <polygon points={topPts} fill="rgba(0,229,208,0.08)" />}
    </g>
  );
}

function Tree({ c, r, scale = 1, onCollect, onCooldown }: { c: number; r: number; scale?: number; onCollect?: () => void; onCooldown?: boolean }) {
  const { x, y } = tPos(c, r);
  const gY = y - TD;
  const s = scale;
  const trunkH = 22 * s;
  const ty = gY - trunkH / 2;
  return (
    <g onClick={onCollect} style={{ cursor: onCollect ? 'pointer' : 'default', opacity: onCooldown ? 0.5 : 1 }}>
      <polygon points={`${x - 8 * s},${ty} ${x},${ty + 10 * s} ${x},${ty + trunkH + 10 * s} ${x - 8 * s},${ty + trunkH}`} fill="#3d2010" />
      <polygon points={`${x + 8 * s},${ty} ${x},${ty + 10 * s} ${x},${ty + trunkH + 10 * s} ${x + 8 * s},${ty + trunkH}`} fill="#4e2a18" />
      <polygon points={flat(x, ty, 16 * s, 8 * s)} fill="#5e341f" />
      <ellipse cx={x}         cy={gY - trunkH - 8 * s}  rx={22 * s} ry={11 * s} fill="#155008" />
      <ellipse cx={x - 6 * s} cy={gY - trunkH - 16 * s} rx={16 * s} ry={9 * s}  fill="#1b6a0c" />
      <ellipse cx={x + 6 * s} cy={gY - trunkH - 14 * s} rx={14 * s} ry={8 * s}  fill="#1d720d" />
      <ellipse cx={x}         cy={gY - trunkH - 22 * s}  rx={13 * s} ry={7 * s}  fill="#23890f" />
      {onCooldown && <text x={x} y={gY - trunkH - 28 * s} textAnchor="middle" fill="#f5a857" fontSize="12">⏳</text>}
    </g>
  );
}

function StoneNode({ c, r, onCollect, onCooldown }: { c: number; r: number; onCollect?: () => void; onCooldown?: boolean }) {
  const { x, y } = tPos(c, r);
  const gY = y - TD;
  return (
    <g onClick={onCollect} style={{ cursor: onCollect ? 'pointer' : 'default', opacity: onCooldown ? 0.5 : 1 }}>
      <ellipse cx={x} cy={gY + 4} rx={20} ry={8} fill="#2a3040" />
      <polygon points={`${x - 18},${gY} ${x - 5},${gY - 20} ${x + 12},${gY - 15} ${x + 18},${gY + 2}`} fill="#4a5568" />
      <polygon points={`${x - 18},${gY} ${x - 5},${gY - 20} ${x + 2},${gY - 8} ${x - 10},${gY + 4}`} fill="#3a4558" />
      <polygon points={`${x - 5},${gY - 20} ${x + 12},${gY - 15} ${x + 18},${gY + 2} ${x + 2},${gY - 8}`} fill="#5a6878" />
      <circle cx={x - 3} cy={gY - 14} r={2} fill="rgba(180,200,240,0.3)" />
      <circle cx={x + 8} cy={gY - 10} r={1.5} fill="rgba(180,200,240,0.2)" />
      {onCooldown && <text x={x} y={gY - 25} textAnchor="middle" fill="#f5a857" fontSize="12">⏳</text>}
      {!onCooldown && <text x={x + 22} y={gY - 15} textAnchor="middle" fill="#8b9bb4" fontSize="11" fontWeight="800">🪨</text>}
    </g>
  );
}

function CrystalNode({ c, r, onCollect, onCooldown }: { c: number; r: number; onCollect?: () => void; onCooldown?: boolean }) {
  const { x, y } = tPos(c, r);
  const gY = y - TD;
  return (
    <g onClick={onCollect} style={{ cursor: onCollect ? 'pointer' : 'default', opacity: onCooldown ? 0.5 : 1 }}>
      <ellipse cx={x} cy={gY + 4} rx={15} ry={6} fill="rgba(100,60,200,0.3)" />
      {[[-8, 0, 16], [0, -4, 20], [8, -2, 14]].map(([dx, _, h], i) => (
        <polygon key={i} points={`${x + dx},${gY - h} ${x + dx - 5},${gY + 2} ${x + dx + 5},${gY + 2}`}
          fill={['#6030a0', '#8040c0', '#7035b0'][i]}
          stroke="rgba(160,100,255,0.4)" strokeWidth="0.5"
          style={{ animation: `portalPulse ${2 + i * 0.5}s ease-in-out infinite` }} />
      ))}
      <circle cx={x} cy={gY - 6} r={3} fill="rgba(160,100,255,0.6)"
        style={{ animation: 'portalPulse 1.5s ease-in-out infinite' }} />
      {onCooldown && <text x={x} y={gY - 30} textAnchor="middle" fill="#f5a857" fontSize="12">⏳</text>}
    </g>
  );
}

function Ruins({ c, r, onClick }: { c: number; r: number; onClick?: () => void }) {
  const { x, y } = tPos(c, r);
  const gY = y - TD;
  const bh = 28;
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <polygon points={`${x - 30},${gY - bh} ${x},${gY - bh + 15} ${x},${gY + 15} ${x - 30},${gY}`} fill="#2e3a4a" />
      <polygon points={`${x + 30},${gY - bh} ${x},${gY - bh + 15} ${x},${gY + 15} ${x + 30},${gY}`} fill="#3a4a5e" />
      <polygon points={`${x},${gY - bh - 15} ${x + 30},${gY - bh} ${x},${gY - bh + 15} ${x - 10},${gY - bh}`} fill="#4a5c72" />
      <line x1={x - 5} y1={gY - bh} x2={x + 8} y2={gY} stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
      <ellipse cx={x + 10} cy={gY - bh - 10} rx={5} ry={2.5} fill="rgba(40,120,30,0.5)" />
      <text x={x + 32} y={gY - bh} textAnchor="start" fill="rgba(255,200,100,0.6)" fontSize="10">✦</text>
    </g>
  );
}

function Portal({ c, r, onClick }: { c: number; r: number; onClick?: () => void }) {
  const { x, y } = tPos(c, r);
  const gY = y - TD;
  const cy_p = gY - 18;
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <ellipse cx={x} cy={gY + 2} rx={18} ry={6} fill="rgba(124,77,255,0.2)" />
      <ellipse cx={x} cy={cy_p} rx={24} ry={13} fill="none" stroke="rgba(124,77,255,0.3)" strokeWidth="3"
        style={{ animation: 'portalPulse 2.4s ease-in-out infinite' }} />
      <ellipse cx={x} cy={cy_p} rx={19} ry={10} fill="none" stroke="#7c4dff" strokeWidth="2"
        style={{ animation: 'portalPulse 2.4s ease-in-out 0.4s infinite' }} />
      <ellipse cx={x} cy={cy_p} rx={13} ry={7} fill="rgba(20,5,60,0.85)" stroke="#a060ff" strokeWidth="1.5" />
      <text x={x} y={cy_p + 4} textAnchor="middle" fill="#c090ff" fontSize="11" fontWeight="bold"
        fontFamily="Nunito, sans-serif" style={{ animation: 'portalPulse 2.4s ease-in-out infinite' }}>?</text>
      {[[-14, -5], [14, -5], [0, -24], [-8, -18], [9, -17]].map(([dx, dy], i) => (
        <circle key={i} cx={x + dx} cy={cy_p + dy} r={1.5} fill="#a060ff"
          style={{ animation: `portalPulse ${1.5 + i * 0.3}s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </g>
  );
}

function Player({ c, r }: { c: number; r: number }) {
  const { x, y } = tPos(c, r);
  const gY = y - TD;
  return (
    <g style={{ animation: 'floatBob 3s ease-in-out infinite' }}>
      <ellipse cx={x} cy={gY + 3} rx={9} ry={4} fill="rgba(0,0,0,0.3)" />
      <ellipse cx={x} cy={gY - 8} rx={7} ry={10} fill="#00c5b5" />
      <circle cx={x} cy={gY - 22} r={9} fill="#00e5d0" />
      <ellipse cx={x} cy={gY - 22} rx={5} ry={3} fill="rgba(0,20,40,0.7)" />
      <ellipse cx={x - 1} cy={gY - 23} rx={2} ry={1.2} fill="rgba(0,200,255,0.6)" />
      <rect x={x - 10} y={gY - 15} width={4} height={8} rx={1} fill="#7c4dff" opacity={0.8} />
    </g>
  );
}

function PetOnMap({ c, r }: { c: number; r: number }) {
  const { x, y } = tPos(c, r);
  const gY = y - TD;
  return (
    <g style={{ animation: 'floatBob 2.5s ease-in-out 0.3s infinite' }}>
      <ellipse cx={x} cy={gY + 3} rx={7} ry={3} fill="rgba(0,0,0,0.25)" />
      <text x={x} y={gY - 8} textAnchor="middle" fontSize="20" style={{ userSelect: 'none' }}>🦊</text>
    </g>
  );
}

function FogZone({ c, r }: { c: number; r: number }) {
  const { x, y } = tPos(c, r);
  const gY = y - TD;
  return (
    <g opacity={0.85}>
      <polygon points={flat(x, gY, TW - 4, TH - 2)} fill="rgba(160,180,220,0.18)"
        stroke="rgba(180,200,255,0.35)" strokeWidth="1" />
      <ellipse cx={x - 8} cy={gY - 3} rx={12} ry={6} fill="rgba(200,215,255,0.1)" />
      <text x={x} y={gY + 4} textAnchor="middle" fill="rgba(180,200,255,0.7)" fontSize="14"
        fontWeight="800" fontFamily="Nunito, sans-serif"
        style={{ animation: 'portalPulse 3s ease-in-out infinite' }}>?</text>
    </g>
  );
}

function PlacedBuildingDisplay({ b, now }: { b: PlacedBuilding; now: number }) {
  const { x, y } = tPos(b.tileC, b.tileR);
  const gY = y - TD;
  const bh = 28;
  const hw = 30, hh = 15;
  const def = BUILD_DEFS.find((d) => d.id === b.type);
  const top = def?.topColor ?? '#607080';
  const left = def?.leftColor ?? '#304050';
  const right = def?.rightColor ?? '#405060';
  const isComplete = b.endsAt === null;
  const pct = isComplete ? 1 : Math.max(0, Math.min(1, (now - b.startedAt) / (b.durationSec * 1000)));
  const secsLeft = isComplete ? 0 : Math.max(0, Math.ceil(((b.endsAt ?? 0) - now) / 1000));

  return (
    <g opacity={isComplete ? 1 : 0.7}>
      <polygon points={`${x - hw},${gY - bh} ${x},${gY - bh + hh} ${x},${gY + hh} ${x - hw},${gY}`} fill={left} />
      <polygon points={`${x + hw},${gY - bh} ${x},${gY - bh + hh} ${x},${gY + hh} ${x + hw},${gY}`} fill={right} />
      <polygon points={flat(x, gY - bh, 60, 30)} fill={top} />
      {!isComplete && (
        <g>
          <rect x={x - 22} y={gY - bh - 22} width={44} height={6} rx={3} fill="rgba(0,0,0,0.5)" />
          <rect x={x - 22} y={gY - bh - 22} width={44 * pct} height={6} rx={3} fill="#00e5d0" />
          <text x={x} y={gY - bh - 28} textAnchor="middle" fill="#fff" fontSize="9" fontFamily="Nunito, sans-serif" fontWeight="700">
            🏗️ {secsLeft}с
          </text>
        </g>
      )}
      {isComplete && (
        <text x={x} y={gY - bh - 6} textAnchor="middle" fontSize="14">{def?.icon ?? '🏠'}</text>
      )}
    </g>
  );
}

function FloatingNumbers() {
  const floatNums = useGameStore((s) => s.floatNums);
  return (
    <>
      {floatNums.map((f) => (
        <text key={f.id} x={f.svgX} y={f.svgY} textAnchor="middle"
          fill={f.color} fontSize="14" fontWeight="800" fontFamily="Nunito, sans-serif"
          pointerEvents="none" style={{ animation: 'floatUp 1.8s ease forwards' }}>
          {f.text}
        </text>
      ))}
    </>
  );
}

// ─── Панель выбора здания ─────────────────────────────────────────────────────

function BuildPanel({ tileC, tileR, level, onClose, onBuild }: {
  tileC: number; tileR: number; level: number;
  onClose: () => void;
  onBuild: (def: BuildDef) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const canAfford = useGameStore((s) => s.canAfford);
  const def = BUILD_DEFS.find((d) => d.id === selected);

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'rgba(4,10,28,0.97)', backdropFilter: 'blur(28px)',
      borderTop: '1px solid rgba(0,229,208,0.15)',
      borderRadius: '18px 18px 0 0', padding: '16px 14px 22px',
      animation: 'fadeInUp 0.22s ease', zIndex: 50,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 900, color: '#e8eeff' }}>Что строим?</h3>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, color: '#6b7a99', cursor: 'pointer', width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
        }}>✕</button>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {BUILD_DEFS.map((d) => {
          const locked = !!(d.reqLevel && level < d.reqLevel);
          const afford = !locked && canAfford(d.cost);
          const isSel = selected === d.id;
          return (
            <div key={d.id} onClick={() => !locked && setSelected(isSel ? null : d.id)}
              style={{
                flexShrink: 0, width: 76, padding: '10px 6px 8px', borderRadius: 12,
                background: isSel ? 'rgba(0,229,208,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isSel ? 'rgba(0,229,208,0.45)' : afford ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.35 : 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: 24 }}>{locked ? '🔒' : d.icon}</span>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#c8d4f0', textAlign: 'center', lineHeight: 1.2 }}>{d.name}</span>
              <div style={{ fontSize: 8, color: afford ? '#6fc87a' : '#ff6b7a', textAlign: 'center' }}>
                {locked ? `Ур.${d.reqLevel}` : Object.entries(d.cost).map(([k, v]) => {
                  const icons: Record<string, string> = { wood: '🌲', stone: '🪨', metal: '⚙️', energy: '⚡' };
                  return `${icons[k]}${v}`;
                }).join(' ')}
              </div>
            </div>
          );
        })}
      </div>

      {def && (
        <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,229,208,0.15)', borderRadius: 12, padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8090b0' }}>
            <span>⏱️ {def.durationSec}с</span>
            <span style={{ color: '#6fc87a' }}>✦ {def.effect}</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={onClose} style={{
          flex: 1, padding: '12px 0', borderRadius: 12,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#6b7a99', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
        }}>Отмена</button>
        <button
          disabled={!def || !canAfford(def.cost)}
          onClick={() => def && onBuild(def)}
          style={{
            flex: 2, padding: '12px 0', borderRadius: 12,
            background: def && canAfford(def.cost) ? 'linear-gradient(135deg, #00c5b5, #00e5d0)' : 'rgba(255,255,255,0.05)',
            border: 'none',
            color: def && canAfford(def.cost) ? '#020c1a' : '#3a4460',
            fontSize: 13, fontWeight: 900, cursor: def && canAfford(def.cost) ? 'pointer' : 'default',
            fontFamily: 'Nunito, sans-serif', transition: 'all 0.15s',
          }}>
          {!def ? 'Выбери здание' : !canAfford(def.cost) ? 'Не хватает ресурсов' : '🏗️ Построить'}
        </button>
      </div>
    </div>
  );
}

// ─── Таймер завершения построек ───────────────────────────────────────────────

function BuildingTimerWatcher() {
  const buildings = useGameStore((s) => s.buildings);
  const { complete } = useAuthoritativeGame();
  const hasActiveBuildings = buildings.some((building) => building.endsAt !== null);

  useEffect(() => {
    // Keep the completion poller idle until there is actually a building
    // countdown to watch. The visible countdown has its own clock.
    if (!hasActiveBuildings) return;

    const id = setInterval(() => {
      const now = Date.now();
      buildings.forEach((building) => {
        if (building.endsAt !== null && now >= building.endsAt) complete(building);
      });
    }, 1000);
    return () => clearInterval(id);
  }, [buildings, complete, hasActiveBuildings]);

  return null;
}

// ─── Панель руин ──────────────────────────────────────────────────────────────

function RuinsPanel({ onClose, onInspect }: { onClose: () => void; onInspect: () => void }) {
  return (
    <div style={{
      position: 'absolute', bottom: 12, left: 12, right: 12,
      background: 'rgba(8,18,42,0.96)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(124,77,255,0.2)', borderRadius: 14, padding: '14px 16px',
      animation: 'fadeInUp 0.2s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#e8eeff', marginBottom: 4 }}>🏛️ Заброшенные руины</div>
          <div style={{ fontSize: 12, color: '#6b7a99', lineHeight: 1.5, marginBottom: 12 }}>
            Кто-то был здесь до тебя. Осколки карты и древние секреты ждут исследователя.
          </div>
          <button onClick={onInspect} style={{
            padding: '8px 18px', borderRadius: 10, border: 'none',
            background: 'rgba(124,77,255,0.2)', color: '#c090ff',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
          }}>🗺️ Осмотреть (+25 XP)</button>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, color: '#6b7a99', cursor: 'pointer', width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          flexShrink: 0, marginLeft: 12,
        }}>✕</button>
      </div>
    </div>
  );
}

function PortalPanel({ onClose, onInteract, level }: { onClose: () => void; onInteract: () => void; level: number }) {
  return (
    <div style={{
      position: 'absolute', bottom: 12, left: 12, right: 12,
      background: 'rgba(8,18,42,0.96)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(160,96,255,0.2)', borderRadius: 14, padding: '14px 16px',
      animation: 'fadeInUp 0.2s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#e8eeff', marginBottom: 4 }}>🌀 Загадочный портал</div>
          <div style={{ fontSize: 12, color: '#6b7a99', lineHeight: 1.5, marginBottom: 12 }}>
            {level >= 3
              ? 'Сигнал резонирует с кристаллами. Портал пробуждается...'
              : 'Слабый сигнал. Возможно, он станет активнее когда цивилизация разовьётся.'}
          </div>
          <button onClick={onInteract} style={{
            padding: '8px 18px', borderRadius: 10, border: 'none',
            background: 'rgba(160,96,255,0.2)', color: '#c090ff',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
          }}>📡 Записать сигнал (+30 XP)</button>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, color: '#6b7a99', cursor: 'pointer', width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          flexShrink: 0, marginLeft: 12,
        }}>✕</button>
      </div>
    </div>
  );
}

// ─── Главный экран ────────────────────────────────────────────────────────────

export function WorldScreen() {
  const resources     = useGameStore((s) => s?.resources ?? { wood: 0, stone: 0, metal: 0, energy: 0 });
  const level         = useGameStore((s) => s?.level ?? 1);
  const buildings     = useGameStore((s) => s?.buildings ?? []);
  const canCollect    = useGameStore((s) => s?.canCollect ?? (() => false));
  const {
    build,
    claimDaily: claimDailyReward,
    collect: collectTile,
    interact,
  } =
    useAuthoritativeGame();
  const addToast      = useGameStore((s) => s?.addToast ?? (() => {}));

  const [buildMode, setBuildMode]   = useState(false);
  const [selectedTile, setSelectedTile] = useState<{ c: number; r: number } | null>(null);
  const [panel, setPanel] = useState<'ruins' | 'portal' | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const currentMap = MAPS[Math.min(level, 3)] ?? MAPS[3];
  const visibleObjects = STATIC_OBJECTS.filter((o) => (o.minLevel ?? 1) <= level);
  const occupiedKeys = new Set(buildings.map((b) => `${b.tileC},${b.tileR}`));

  const handleTreeClick = useCallback((tileKey: string, resource: ResourceKey, svgX: number, svgY: number) => {
    collectTile(tileKey, resource, Math.floor(Math.random() * 12) + 10, svgX, svgY - 50);
    setPanel(null);
  }, [collectTile]);

  const handleStoneClick = useCallback((tileKey: string, svgX: number, svgY: number) => {
    collectTile(tileKey, 'stone', Math.floor(Math.random() * 8) + 5, svgX, svgY - 40);
    setPanel(null);
  }, [collectTile]);

  const handleCrystalClick = useCallback((tileKey: string, svgX: number, svgY: number) => {
    collectTile(tileKey, 'metal', Math.floor(Math.random() * 5) + 2, svgX, svgY - 40);
    setPanel(null);
  }, [collectTile]);

  const handleRuinsInspect = useCallback(() => {
    interact('ruins');
    setPanel(null);
  }, [interact]);

  const handlePortalRecord = useCallback(() => {
    interact('portal');
    addToast('Сигнал записан в дневник...', '📡', '#7c4dff');
    setPanel(null);
  }, [interact, addToast]);

  const handleTileClick = useCallback((c: number, r: number) => {
    if (!buildMode) return;
    if (occupiedKeys.has(`${c},${r}`)) {
      addToast('Место уже занято', '🚫', '#ff6b7a');
      return;
    }
    setSelectedTile({ c, r });
  }, [buildMode, occupiedKeys, addToast]);

  const handleBuild = useCallback(async (def: BuildDef) => {
    if (!selectedTile) return;
    const ok = await build(
      def.id,
      selectedTile.c,
      selectedTile.r,
      def.cost,
      def.durationSec,
    );
    if (!ok) return;
    addToast(`Строительство: ${def.name}`, '🏗️', '#00e5d0');
    setSelectedTile(null);
    setBuildMode(false);
  }, [selectedTile, build, addToast]);

  // ── Painter's algorithm ──────────────────────────────────────────────────────

  type TItem = { kind: 'tile';     c: number; r: number };
  type OItem = { kind: 'sobj';     obj: StaticObj };
  type BItem = { kind: 'building'; c: number; r: number; b: PlacedBuilding };
  type RItem = TItem | OItem | BItem;

  const renderables: RItem[] = [];

  for (let r = 0; r < 7; r++)
    for (let c = 0; c < 7; c++)
      renderables.push({ kind: 'tile', c, r });

  for (const obj of visibleObjects)
    renderables.push({ kind: 'sobj', obj });

  for (const b of buildings)
    renderables.push({ kind: 'building', c: b.tileC, r: b.tileR, b });

  renderables.sort((a, b) => {
    const ac = a.kind === 'sobj' ? a.obj.c : a.c;
    const ar = a.kind === 'sobj' ? a.obj.r : a.r;
    const bc2= b.kind === 'sobj' ? b.obj.c : b.c;
    const br = b.kind === 'sobj' ? b.obj.r : b.r;
    const da = ac + ar, db = bc2 + br;
    if (da !== db) return da - db;
    if (a.kind === 'tile' && b.kind !== 'tile') return -1;
    if (a.kind !== 'tile' && b.kind === 'tile') return 1;
    return 0;
  });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <BuildingTimerWatcher />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Фон */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 55%, #0a2048 0%, #04112e 50%, #020a1c 100%)',
        }} />

        <svg viewBox="0 0 560 320" width="100%" height="100%" style={{ display: 'block' }}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {renderables.map((item, idx) => {
            if (item.kind === 'tile') {
              const { c, r } = item;
              const tType = currentMap[r]?.[c] ?? 0;
              if (tType === 0) return <WaterTile key={`w-${c}-${r}`} c={c} r={r} />;
              const tKey = `${c},${r}`;
              const isOcc = occupiedKeys.has(tKey);
              const canHL = buildMode && !isOcc;
              return (
                <GrassTile key={`g-${c}-${r}`} c={c} r={r} highlight={canHL}
                  onClick={canHL ? () => handleTileClick(c, r) : undefined} />
              );
            }

            if (item.kind === 'building') {
              return <PlacedBuildingDisplay key={`b-${item.b.id}`} b={item.b} now={now} />;
            }

            // Static object
            const { obj } = item;
            const { x, y } = tPos(obj.c, obj.r);
            const tKey = `${obj.c},${obj.r}`;
            const cd = !canCollect(tKey);

            if (obj.type === 'tree') return (
              <Tree key={`sobj-${obj.id}-${idx}`} c={obj.c} r={obj.r} scale={obj.scale ?? 1}
                onCooldown={cd}
                onCollect={() => handleTreeClick(tKey, obj.resource ?? 'wood', x, y)} />
            );
            if (obj.type === 'stone') return (
              <StoneNode key={`sobj-${obj.id}-${idx}`} c={obj.c} r={obj.r}
                onCooldown={cd}
                onCollect={() => handleStoneClick(tKey, x, y)} />
            );
            if (obj.type === 'crystal') return (
              <CrystalNode key={`sobj-${obj.id}-${idx}`} c={obj.c} r={obj.r}
                onCooldown={cd}
                onCollect={() => handleCrystalClick(tKey, x, y)} />
            );
            if (obj.type === 'ruins') return (
              <Ruins key={`sobj-${obj.id}-${idx}`} c={obj.c} r={obj.r}
                onClick={() => setPanel('ruins')} />
            );
            if (obj.type === 'portal') return (
              <g key={`sobj-${obj.id}-${idx}`} filter="url(#glow)">
                <Portal c={obj.c} r={obj.r} onClick={() => setPanel('portal')} />
              </g>
            );
            if (obj.type === 'player') return <Player key={`sobj-${obj.id}-${idx}`} c={obj.c} r={obj.r} />;
            if (obj.type === 'petmap') return <PetOnMap key={`sobj-${obj.id}-${idx}`} c={obj.c} r={obj.r} />;
            if (obj.type === 'fog') return <FogZone key={`sobj-${obj.id}-${idx}`} c={obj.c} r={obj.r} />;
            return null;
          })}

          <FloatingNumbers />
        </svg>

        {/* Кнопка ежедневной награды */}
        <div onClick={claimDailyReward} style={{
          position: 'absolute', top: 10, right: 12,
          background: 'rgba(8,18,42,0.85)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(245,168,87,0.3)', borderRadius: 10,
          padding: '6px 10px', fontSize: 11, color: '#f5a857', fontWeight: 700,
          cursor: 'pointer', animation: 'glowPulse 3s ease-in-out infinite',
          userSelect: 'none',
        }}>🎁 Награда</div>

        {/* Индикатор уровня острова */}
        <div style={{
          position: 'absolute', top: 10, left: 12,
          background: 'rgba(8,18,42,0.75)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0,229,208,0.15)', borderRadius: 10,
          padding: '5px 10px', fontSize: 10, color: '#6b7a99', fontWeight: 700,
        }}>🏝️ Ур.{level} · {['', 'Зарождение', 'Расцвет', 'Освоение'][Math.min(level, 3)] ?? 'Рост'}</div>

        {/* Режим строительства — подсказка */}
        {buildMode && !selectedTile && (
          <div style={{
            position: 'absolute', top: 44, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,229,208,0.12)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0,229,208,0.35)', borderRadius: 10,
            padding: '6px 14px', fontSize: 11, color: '#00e5d0', fontWeight: 700,
            whiteSpace: 'nowrap',
          }}>Выбери свободный тайл 🏗️</div>
        )}

        {/* Панель руин */}
        {panel === 'ruins' && !selectedTile && (
          <RuinsPanel onClose={() => setPanel(null)} onInspect={handleRuinsInspect} />
        )}
        {panel === 'portal' && !selectedTile && (
          <PortalPanel onClose={() => setPanel(null)} onInteract={handlePortalRecord} level={level} />
        )}

        {/* Панель выбора здания */}
        {selectedTile && (
          <BuildPanel
            tileC={selectedTile.c} tileR={selectedTile.r} level={level}
            onClose={() => setSelectedTile(null)} onBuild={handleBuild} />
        )}
      </div>

      {/* ── Кнопки действий ── */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 14px',
        background: 'rgba(4,13,31,0.85)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <ActionBtn icon="🏗️" label="СТРОИТЬ" active={buildMode} color="#00e5d0"
          onClick={() => { setBuildMode((v) => !v); setSelectedTile(null); setPanel(null); }} />
        <ActionBtn icon="🌀" label="ПОРТАЛ" active={false} color="#7c4dff"
          onClick={() => { setPanel('portal'); setBuildMode(false); }} />
        <ActionBtn icon="🏛️" label="РУИНЫ" active={false} color="#8b9bb4"
          onClick={() => { setPanel('ruins'); setBuildMode(false); }} />
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, active, color, onClick }: { icon: string; label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      padding: '7px 4px',
      background: active ? `${color}1a` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${active ? color + '55' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
      boxShadow: active ? `0 0 12px ${color}30` : 'none',
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 9, fontWeight: 700, color: active ? color : '#6b7a99', letterSpacing: 0.3 }}>
        {label}
      </span>
    </button>
  );
}
