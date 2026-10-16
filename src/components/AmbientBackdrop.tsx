export function AmbientBackdrop() {
  return (
    <div aria-hidden="true" className="ambient-backdrop">
      <div className="ambient-orb ambient-orb--teal" />
      <div className="ambient-orb ambient-orb--violet" />
      <div className="ambient-dust" />
    </div>
  );
}
