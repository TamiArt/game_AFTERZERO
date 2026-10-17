import type { CSSProperties } from 'react';

export type WorldSpriteKind = 'mushroom' | 'moonflower' | 'ai-core' | 'crystal';

interface WorldSpriteProps {
  kind: WorldSpriteKind;
  x: number;
  y: number;
  scale?: number;
  label?: string;
}

/** Small, self-contained SVG sprites for the isometric island. No external assets or runtime APIs. */
export function WorldSprite({ kind, x, y, scale = 1, label }: WorldSpriteProps) {
  const id = `world-sprite-${kind}-${Math.round(x)}-${Math.round(y)}`;
  const style: CSSProperties = { transformBox: 'fill-box', transformOrigin: 'center', ...(kind === 'mushroom' ? { animation: 'floatBob 4.5s ease-in-out infinite' } : {}) };
  const glow = kind === 'mushroom' ? '#ff9b8d' : kind === 'moonflower' ? '#9dffd8' : kind === 'crystal' ? '#b59bff' : '#56dfff';
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} role="img" aria-label={label ?? ({ mushroom: 'Светящийся гриб', moonflower: 'Лунный цветок', 'ai-core': 'Ядро искусственного интеллекта', crystal: 'Кристалл' }[kind])} style={style}>
      <defs>
        <radialGradient id={`${id}-aura`}><stop offset="0" stopColor={glow} stopOpacity=".42"/><stop offset="1" stopColor={glow} stopOpacity="0"/></radialGradient>
        <linearGradient id={`${id}-stem`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e3fff5"/><stop offset=".42" stopColor={glow}/><stop offset="1" stopColor="#354b83"/></linearGradient>
        <linearGradient id={`${id}-cap`} x1="0" y1="0" x2=".85" y2="1"><stop stopColor="#fff0d7"/><stop offset=".36" stopColor={glow}/><stop offset="1" stopColor={kind === 'mushroom' ? '#a43e80' : '#4d55a0'}/></linearGradient>
        <filter id={`${id}-blur`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="0" cy="-1" rx="30" ry="31" fill={`url(#${id}-aura)`}/>
      <ellipse cx="0" cy="1" rx="15" ry="4" fill={glow} opacity=".18"/>
      {kind === 'mushroom' && <>
        <path d="M-3 0 C-4-8-1-17 1-23 L7-23 C5-13 7-7 6 0Z" fill={`url(#${id}-stem)`} stroke="#ffd8c8" strokeOpacity=".65" strokeWidth=".7"/>
        <path d="M-22-20 C-19-35-7-40 1-39 C14-39 23-31 25-20 C15-13-11-12-22-20Z" fill={`url(#${id}-cap)`} stroke="#ffe7dc" strokeOpacity=".85" strokeWidth="1" filter={`url(#${id}-blur)`}/>
        <path d="M-18-20Q1-12 21-20M-11-19L-5-11M-2-17L0-10M8-18L5-11M15-19L10-12" fill="none" stroke="#ffe9e1" strokeOpacity=".7" strokeWidth=".8"/>
        {[-12,-3,8,16].map((dx,i)=><circle key={dx} cx={dx} cy={-28-(i%2)*4} r={1.2} fill="#fff1c8" filter={`url(#${id}-blur)`}/>)}
      </>}
      {kind === 'moonflower' && <>
        <path d="M0 2Q-2-9 1-20M0-8Q-13-20-17-12Q-12-5 0-8M1-13Q12-27 18-18Q14-10 1-13" fill="none" stroke="#72d7ad" strokeWidth="2" strokeLinecap="round"/>
        {Array.from({length:7},(_,i)=>{const a=(Math.PI*2*i)/7-Math.PI/2;return <ellipse key={i} cx={Math.cos(a)*8} cy={-27+Math.sin(a)*8} rx="4.8" ry="8.5" transform={`rotate(${i*360/7} ${Math.cos(a)*8} ${-27+Math.sin(a)*8})`} fill={`url(#${id}-stem)`} stroke="#dffff1" strokeOpacity=".8" strokeWidth=".7"/>;})}
        <circle cx="0" cy="-27" r="4" fill="#fff6bd" filter={`url(#${id}-blur)`}/>
      </>}
      {kind === 'ai-core' && <>
        <ellipse cx="0" cy="-15" rx="19" ry="7" fill="none" stroke="#58dfff" strokeWidth="1.3" transform="rotate(-20 0 -15)"/>
        <ellipse cx="0" cy="-15" rx="16" ry="6" fill="none" stroke="#b49aff" strokeWidth="1" transform="rotate(55 0 -15)"/>
        <path d="M0-37L15-27L12-9L0-2L-12-9L-15-27Z" fill={`url(#${id}-stem)`} stroke="#c7fbff" strokeWidth="1.1" filter={`url(#${id}-blur)`}/>
        <path d="M0-31L7-25L5-13L0-10L-5-13L-7-25Z" fill="#132b56" stroke="#7cecff" strokeWidth=".8"/>
        <circle cx="0" cy="-21" r="4" fill="#b8ffff" filter={`url(#${id}-blur)`}/><circle cx="0" cy="-21" r="1.5" fill="#fff"/>
        {[-1,1].map(d=><g key={d} stroke="#9cf5ff" strokeWidth="1" fill="none"><path d={`M${d*13}-23L${d*20}-28L${d*24}-28`}/><circle cx={d*24} cy="-28" r="1.4" fill="#d5ffff"/></g>)}
      </>}
      {kind === 'crystal' && <>
        <path d="M0-40L14-22L9-4L0 1L-10-7L-13-24Z" fill={`url(#${id}-stem)`} stroke="#e5ddff" strokeWidth="1" filter={`url(#${id}-blur)`}/>
        <path d="M0-40L1-9L-10-7L-13-24Z" fill="#e7faff" fillOpacity=".45"/><path d="M0-40L14-22L1-9Z" fill="#fff" fillOpacity=".55"/>
        <path d="M-19-5L-9-19L-7-3Z" fill="#7be7ed" stroke="#c2ffff" strokeWidth=".6"/><path d="M11-4L18-17L21-1Z" fill="#8c7bff" stroke="#ddd0ff" strokeWidth=".6"/>
      </>}
    </g>
  );
}
