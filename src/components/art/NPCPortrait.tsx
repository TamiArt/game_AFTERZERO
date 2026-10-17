import type { CSSProperties } from 'react';

export type NPCPortraitKind = 'botanist' | 'engineer' | 'researcher' | 'robot' | 'traveler';

const PALETTES: Record<NPCPortraitKind, { coat: string; accent: string; glow: string }> = {
  botanist: { coat: '#376d68', accent: '#a7f3c2', glow: '#65f1c8' },
  engineer: { coat: '#354b78', accent: '#72e7ff', glow: '#57dfff' },
  researcher: { coat: '#554b77', accent: '#d7b6ff', glow: '#a98cff' },
  robot: { coat: '#2d5875', accent: '#9af5ff', glow: '#54ddff' },
  traveler: { coat: '#72513f', accent: '#ffc38b', glow: '#ffb77e' },
};

/** Reusable small portrait medallion; the character identity stays readable at mobile size. */
export function NPCPortrait({ kind, size = 38 }: { kind: NPCPortraitKind; size?: number }) {
  const p = PALETTES[kind];
  const id = `npc-${kind}-${size}`;
  const style: CSSProperties = { flexShrink: 0, display: 'block' };
  return <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={({botanist:'Ботаник',engineer:'IT-специалист',researcher:'Исследователь',robot:'Робот-помощник',traveler:'Путешественник'} as const)[kind]} style={style}>
    <defs><linearGradient id={id+'-bg'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#183451"/><stop offset="1" stopColor="#17183b"/></linearGradient><linearGradient id={id+'-coat'} x1="0" y1="0" x2="1" y2="1"><stop stopColor={p.accent}/><stop offset=".45" stopColor={p.coat}/><stop offset="1" stopColor="#10182d"/></linearGradient><filter id={id+'-glow'} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <circle cx="32" cy="32" r="30" fill={`url(#${id}-bg)`} stroke={p.glow} strokeOpacity=".42"/>
    <circle cx="32" cy="30" r="23" fill={p.glow} opacity=".08"/>
    {kind==='robot' ? <g><path d="M17 23Q17 14 26 14H38Q47 14 47 23V39Q47 47 38 47H26Q17 47 17 39Z" fill={`url(#${id}-coat)`} stroke={p.accent} strokeWidth="1.5"/><rect x="22" y="24" width="20" height="10" rx="4" fill="#081b35"/><circle cx="27" cy="29" r="2" fill={p.accent} filter={`url(#${id}-glow)`}/><circle cx="37" cy="29" r="2" fill={p.accent} filter={`url(#${id}-glow)`}/><path d="M25 39Q32 43 39 39" fill="none" stroke={p.accent} strokeWidth="1.5"/><path d="M32 14V9M28 9H36" stroke={p.accent} strokeWidth="1.5"/></g> :
    <g><path d="M13 59Q15 43 26 41H38Q49 43 51 59Z" fill={`url(#${id}-coat)`} stroke={p.accent} strokeOpacity=".5"/><path d="M23 21Q25 12 33 13Q42 14 43 24L40 34Q36 41 31 40Q23 37 22 28Z" fill="#d9b39a" stroke="#ffe2c7" strokeOpacity=".5"/><path d="M21 25Q19 12 31 10Q44 9 45 22L41 21L36 17L28 22Z" fill={kind==='botanist'?'#3c302e':kind==='traveler'?'#49362f':'#292b45'}/><circle cx="28" cy="27" r="1.5" fill="#16243a"/><circle cx="37" cy="27" r="1.5" fill="#16243a"/><path d="M29 33Q33 36 37 32" fill="none" stroke="#8d5b56" strokeWidth="1.2" strokeLinecap="round"/>{kind==='botanist'&&<g filter={`url(#${id}-glow)`}><path d="M39 15Q43 5 49 10Q48 18 39 19Z" fill="#8df2b4" stroke="#d7ffe2" strokeWidth=".8"/><path d="M39 18L46 11" stroke="#eaffd9" strokeWidth=".7"/></g>}{kind==='engineer'&&<g><path d="M20 23Q19 14 27 13" fill="none" stroke={p.accent} strokeWidth="2"/><rect x="39" y="22" width="6" height="10" rx="2" fill="#143d5b" stroke={p.accent}/><path d="M42 24V30" stroke={p.accent}/></g>}{kind==='researcher'&&<path d="M20 22L26 12L40 12L45 22" fill="none" stroke={p.accent} strokeWidth="2"/>}</g>}
  </svg>;
}
