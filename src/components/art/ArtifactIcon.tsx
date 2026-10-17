import type { ReactNode } from 'react';

export type ArtifactKind = 'stone'|'leaf'|'crystal'|'key'|'orb'|'moth'|'vial'|'shell'|'map'|'star'|'wood'|'paw';

const C: Record<ArtifactKind,{a:string;b:string;c:string}> = {
 stone:{a:'#d8e4f4',b:'#748ba9',c:'#263d5b'},leaf:{a:'#d8ffd9',b:'#55e6d2',c:'#1c6d69'},crystal:{a:'#e8d8ff',b:'#9c7dff',c:'#416bb5'},key:{a:'#ffe9b1',b:'#d79a58',c:'#6d4b72'},orb:{a:'#fff1c2',b:'#ff9a89',c:'#8056c8'},moth:{a:'#fff0d6',b:'#b6a4ff',c:'#48cfd4'},vial:{a:'#d9ffff',b:'#54cfff',c:'#8e63e8'},shell:{a:'#ffe3c1',b:'#e9a77e',c:'#7b598b'},map:{a:'#d8ffff',b:'#57dfff',c:'#7d72ff'},star:{a:'#fff6bf',b:'#ffc16d',c:'#b86acb'},wood:{a:'#e6ffcf',b:'#75cfa6',c:'#426d5b'},paw:{a:'#e8dcff',b:'#b99aff',c:'#5b5ad2'}
};
export function ArtifactIcon({kind,size=30}: {kind:ArtifactKind;size?:number}) {
 const p=C[kind], id=`artifact-${kind}-${size}`;
 let art:ReactNode;
 switch(kind){
 case 'stone': art=<path d="M10 34L7 22L17 9L33 12L40 25L30 38L16 39Z" fill={`url(#${id}-g)`} stroke={p.a} strokeWidth="1.5"/>;
 break;
 case 'leaf': art=<g><path d="M8 36Q8 12 37 8Q39 30 14 38Z" fill={`url(#${id}-g)`} stroke={p.a}/><path d="M12 35L32 13M19 28L17 19M25 22L32 24" fill="none" stroke={p.a} strokeWidth="1.5"/></g>;break;
 case 'crystal': art=<g><path d="M24 5L39 21L33 40L22 45L10 30L12 17Z" fill={`url(#${id}-g)`} stroke={p.a} strokeWidth="1.4"/><path d="M24 5L23 29L10 30M24 5L39 21L23 29L33 40" fill="none" stroke={p.a} strokeOpacity=".75"/></g>;break;
 case 'key': art=<g><circle cx="16" cy="18" r="9" fill="none" stroke={p.b} strokeWidth="5"/><path d="M22 24L38 39M30 32L35 27M35 37L40 32" stroke={p.a} strokeWidth="4" strokeLinecap="round"/></g>;break;
 case 'orb': art=<g><circle cx="24" cy="24" r="16" fill={`url(#${id}-g)`} stroke={p.a} strokeWidth="1.5"/><ellipse cx="18" cy="17" rx="6" ry="3" fill="#fff" opacity=".7"/><path d="M13 29Q24 39 35 25" fill="none" stroke={p.a} strokeOpacity=".7"/></g>;break;
 case 'moth': art=<g><path d="M22 22Q6 2 6 18Q8 29 22 28M26 22Q42 2 42 18Q40 29 26 28" fill={`url(#${id}-g)`} stroke={p.a}/><ellipse cx="24" cy="25" rx="3" ry="11" fill={p.b}/><path d="M23 15L18 9M25 15L30 9" stroke={p.a} strokeWidth="1.4"/></g>;break;
 case 'vial': art=<g><path d="M17 7H31V14L35 20V37Q24 44 13 37V20L17 14Z" fill={`url(#${id}-g)`} stroke={p.a} strokeWidth="1.4"/><path d="M15 29Q24 25 33 29V36Q24 41 15 36Z" fill={p.a} opacity=".7"/><path d="M17 5H31V10H17Z" fill={p.c}/></g>;break;
 case 'shell': art=<g><path d="M24 7Q40 14 38 29Q35 40 24 42Q13 40 10 29Q8 14 24 7Z" fill={`url(#${id}-g)`} stroke={p.a} strokeWidth="1.4"/>{[-8,-3,3,8].map(dx=><path key={dx} d={`M24 39Q${24+dx} 27 24 ${dx<0?13:15}`} fill="none" stroke={p.a} strokeOpacity=".7"/>)}</g>;break;
 case 'map': art=<g><path d="M7 13L18 8L30 13L41 8V35L30 40L18 35L7 40Z" fill={`url(#${id}-g)`} stroke={p.a} strokeWidth="1.3"/><path d="M18 8V35M30 13V40" stroke={p.a} strokeOpacity=".7"/><circle cx="24" cy="23" r="4" fill={p.a}/></g>;break;
 case 'star': art=<path d="M24 5L29 18L43 19L32 28L36 42L24 34L12 42L16 28L5 19L19 18Z" fill={`url(#${id}-g)`} stroke={p.a} strokeWidth="1.3"/>;break;
 case 'wood': art=<g><path d="M24 6Q35 15 31 26Q29 31 24 34Q19 31 17 26Q13 15 24 6Z" fill={`url(#${id}-g)`} stroke={p.a}/><path d="M24 33V43M24 37L15 31M24 39L33 32" stroke={p.b} strokeWidth="2" strokeLinecap="round"/></g>;break;
 case 'paw': art=<g fill={`url(#${id}-g)`} stroke={p.a} strokeWidth="1"><ellipse cx="24" cy="31" rx="11" ry="8"/><ellipse cx="12" cy="19" rx="4.5" ry="6"/><ellipse cx="21" cy="14" rx="4.5" ry="6"/><ellipse cx="30" cy="14" rx="4.5" ry="6"/><ellipse cx="38" cy="20" rx="4.5" ry="6"/></g>;break;
 }
 return <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={kind} style={{display:'block',filter:`drop-shadow(0 0 4px ${p.b}55)`}}><defs><linearGradient id={id+'-g'} x1="0" y1="0" x2="1" y2="1"><stop stopColor={p.a}/><stop offset=".48" stopColor={p.b}/><stop offset="1" stopColor={p.c}/></linearGradient></defs>{art}</svg>;
}
