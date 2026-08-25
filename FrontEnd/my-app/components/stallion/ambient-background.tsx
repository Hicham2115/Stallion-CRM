export function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(#bafc0c_1px,transparent_1px),linear-gradient(90deg,#bafc0c_1px,transparent_1px)] bg-[size:50px_50px] opacity-5" />
      <div className="absolute -top-24 -left-24 size-[500px] animate-[pulseGlow_10s_ease-in-out_infinite] rounded-full bg-[#65891c] opacity-15 blur-[100px]" />
      <div className="absolute top-[600px] -right-36 size-[600px] animate-[pulseGlow_12s_ease-in-out_infinite] rounded-full bg-[#bafc0c] opacity-10 blur-[120px]" />
    </div>
  );
}
