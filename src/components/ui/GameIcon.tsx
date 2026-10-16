export type GameIconName =
  | 'world'
  | 'explore'
  | 'collection'
  | 'pet'
  | 'social'
  | 'shop'
  | 'settings'
  | 'back'
  | 'audio'
  | 'visual'
  | 'privacy'
  | 'bell'
  | 'help'
  | 'account';

interface GameIconProps {
  name: GameIconName;
  size?: number;
  strokeWidth?: number;
}

const PATHS: Record<GameIconName, React.ReactNode> = {
  world: (
    <>
      <path d="M4 15.5 12 11l8 4.5-8 4.5-8-4.5Z" />
      <path d="m6.5 11.9 5.5-3 5.5 3M9 9.8V6.5L12 4l3 2.5v3.3" />
    </>
  ),
  explore: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4M9 13l2-5 2 3-4 2Z" />
    </>
  ),
  collection: (
    <>
      <path d="m4 7 8-4 8 4-8 4-8-4Z" />
      <path d="M4 7v9l8 5 8-5V7M12 11v10" />
    </>
  ),
  pet: (
    <>
      <path d="M8.5 11.5c-2.8 1.2-4 3.2-3.1 5.3 1.1 2.6 4 .8 6.6.8s5.5 1.8 6.6-.8c.9-2.1-.3-4.1-3.1-5.3-2.2-.9-4.8-.9-7 0Z" />
      <circle cx="7" cy="8" r="2" />
      <circle cx="17" cy="8" r="2" />
      <circle cx="11" cy="5" r="2" />
      <circle cx="14.5" cy="5.5" r="1.6" />
    </>
  ),
  social: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M3.5 19c.4-4 2.3-6 5.5-6s5.1 2 5.5 6M14 14c3.7-.8 6 1 6.5 4" />
    </>
  ),
  shop: (
    <>
      <path d="M5 9h14l-1 11H6L5 9Z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3M4 9l1-5h14l1 5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  back: <path d="m15 18-6-6 6-6" />,
  audio: (
    <>
      <path d="M5 10v4h3l4 4V6L8 10H5Z" />
      <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />
    </>
  ),
  visual: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  privacy: (
    <>
      <path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6l-7-3Z" />
      <path d="M9.5 12 11 13.5l3.5-4" />
    </>
  ),
  bell: <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7ZM10 20h4" />,
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.4 2.4 0 1 1 3.3 2.2c-.8.4-1.1.9-1.1 1.8M12 17h.01" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21c.5-5 3-7.5 7.5-7.5s7 2.5 7.5 7.5" />
    </>
  ),
};

export function GameIcon({
  name,
  size = 20,
  strokeWidth = 1.7,
}: GameIconProps) {
  return (
    <svg
      aria-hidden="true"
      className="game-icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      >
        {PATHS[name]}
      </g>
    </svg>
  );
}
