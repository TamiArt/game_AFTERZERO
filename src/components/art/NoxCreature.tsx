interface NoxCreatureProps {
  compact?: boolean;
  dormant?: boolean;
}

export function NoxCreature({
  compact = false,
  dormant = false,
}: NoxCreatureProps) {
  const id = compact ? 'nox-compact' : dormant ? 'nox-dormant' : 'nox-main';

  return (
    <svg
      aria-label={dormant ? 'Неизвестное существо' : 'Нокс, лисица-призрак'}
      className={`nox-creature ${dormant ? 'nox-creature--dormant' : ''}`}
      role="img"
      viewBox="0 0 160 150"
    >
      <defs>
        <radialGradient id={`${id}-body`} cx="42%" cy="32%" r="72%">
          <stop offset="0" stopColor={dormant ? '#d9e3d0' : '#d9fff4'} />
          <stop offset=".42" stopColor={dormant ? '#90a89f' : '#79ded1'} />
          <stop offset="1" stopColor={dormant ? '#354b51' : '#284d68'} />
        </radialGradient>
        <linearGradient id={`${id}-ear`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor={dormant ? '#8da29a' : '#73dacb'} />
          <stop offset="1" stopColor={dormant ? '#30424d' : '#4a3d82'} />
        </linearGradient>
        <linearGradient id={`${id}-tail`} x1=".1" x2=".9" y1=".2" y2=".8">
          <stop stopColor={dormant ? '#71877f' : '#66d4c8'} stopOpacity=".9" />
          <stop offset="1" stopColor={dormant ? '#263943' : '#8464cb'} stopOpacity=".18" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={compact ? 2 : 3.5} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      <ellipse
        cx="80"
        cy="127"
        fill={dormant ? '#87a49b' : '#4ee1cc'}
        opacity=".12"
        rx="48"
        ry="10"
      />
      <ellipse
        cx="80"
        cy="110"
        fill={dormant ? '#5b716a' : '#38cdbf'}
        filter={`url(#${id}-soft)`}
        opacity=".16"
        rx="38"
        ry="27"
      />

      <path
        className="nox-creature__tail"
        d="M112 92c28-12 39 7 26 19-8 8-23 5-29-2 13 2 20-5 15-10-4-4-11 0-14 3Z"
        fill={`url(#${id}-tail)`}
      />
      <path
        d="M53 55 55 22c1-5 5-6 8-2l18 25M107 55l-2-33c0-5-5-6-8-2L79 45"
        fill={`url(#${id}-ear)`}
        stroke={dormant ? '#a6b6ad' : '#9cf5e6'}
        strokeOpacity=".35"
        strokeWidth="1.2"
      />
      <path
        d="M62 31 63 48l10-4ZM98 31 97 48l-10-4Z"
        fill={dormant ? '#445a5d' : '#594d8b'}
        opacity=".72"
      />

      <path
        className="nox-creature__body"
        d="M47 79c0-26 13-40 33-40s33 14 33 40c0 10-4 18-10 24 5 5 8 12 8 20H49c0-8 3-15 8-20-6-6-10-14-10-24Z"
        fill={`url(#${id}-body)`}
        stroke={dormant ? '#b6c8bc' : '#aaffef'}
        strokeOpacity=".28"
        strokeWidth="1.4"
      />
      <path
        d="M58 103c6 7 13 10 22 10s16-3 22-10c-1 12-8 22-22 22s-21-10-22-22Z"
        fill={dormant ? '#60756f' : '#4c91a0'}
        opacity=".35"
      />

      {dormant ? (
        <>
          <path d="M61 73c5 4 10 4 15 0M84 73c5 4 10 4 15 0" fill="none" stroke="#253b42" strokeLinecap="round" strokeWidth="2.4" />
          <path d="M76 86c3 2 5 2 8 0" fill="none" stroke="#334b51" strokeLinecap="round" strokeWidth="1.6" />
        </>
      ) : (
        <>
          <ellipse cx="68" cy="74" fill="#092a38" rx="7.5" ry="9" />
          <ellipse cx="92" cy="74" fill="#092a38" rx="7.5" ry="9" />
          <ellipse cx="69.5" cy="72" fill="#d8fff5" filter={`url(#${id}-glow)`} rx="2.8" ry="4" />
          <ellipse cx="93.5" cy="72" fill="#d8fff5" filter={`url(#${id}-glow)`} rx="2.8" ry="4" />
          <path d="M76 86c3 3 5 3 8 0" fill="none" stroke="#245465" strokeLinecap="round" strokeWidth="1.8" />
        </>
      )}

      <path
        d="M63 56c10-7 24-8 34 0-9-3-25-3-34 0Z"
        fill="#effff9"
        opacity=".22"
      />

      {!dormant && (
        <g className="nox-creature__spores" fill="#aaffee" filter={`url(#${id}-glow)`}>
          <circle cx="41" cy="57" r="1.7" />
          <circle cx="123" cy="69" r="1.2" />
          <circle cx="116" cy="38" r="1" />
          <circle cx="34" cy="91" r=".9" />
        </g>
      )}
    </svg>
  );
}
