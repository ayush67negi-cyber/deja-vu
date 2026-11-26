const draw = (delay = 0): React.CSSProperties => ({
  strokeDasharray: 1,
  strokeDashoffset: 1,
  animation: `dash 2.6s ${delay}s ease-in-out infinite alternate`,
});

const base = {
  viewBox: "0 0 200 200",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  role: "img" as const,
};

/** Step 1: a questionnaire being filled in */
export function StepQuestionnaire() {
  return (
    <svg {...base} aria-label="A questionnaire being ticked off" className="h-full w-full">
      <rect x="48" y="26" width="104" height="148" rx="3" fill="var(--accent)" fillOpacity=".18" />
      <rect x="40" y="34" width="104" height="148" rx="3" fill="var(--bg)" />
      {[62, 94, 126].map((y, i) => (
        <g key={y}>
          <circle cx="62" cy={y} r="8" />
          <path d={`M58 ${y} l3 3 l6 -7`} pathLength={1} style={draw(i * 0.5)} stroke="var(--accent)" strokeWidth={3} />
          <path d={`M82 ${y - 3} h46`} />
          <path d={`M82 ${y + 6} h30`} opacity={0.5} />
        </g>
      ))}
      <path d="M118 168 l34 -34 l8 8 l-34 34 l-12 4 z" fill="var(--accent)" stroke="currentColor" className="floaty" style={{ ["--r" as string]: "0deg" }} />
    </svg>
  );
}

/** Step 2: people orbiting toward one table */
export function StepMatch() {
  const pts = [0, 1, 2, 3, 4].map((i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return [100 + Math.cos(a) * 62, 100 + Math.sin(a) * 62] as const;
  });
  return (
    <svg {...base} aria-label="Five people being matched into one group" className="h-full w-full">
      <circle cx="100" cy="100" r="62" strokeDasharray="2 7" opacity={0.5} />
      <circle cx="100" cy="100" r="16" fill="var(--accent)" stroke="none" className="pulse-ring" />
      <circle cx="100" cy="100" r="16" fill="var(--accent)" stroke="currentColor" />
      <g className="orbit">
        {pts.map(([x, y], i) => (
          <g key={i}>
            <path d={`M100 100 L${x} ${y}`} pathLength={1} style={draw(i * 0.3)} opacity={0.7} />
            <circle cx={x} cy={y} r="11" fill="var(--bg)" />
            <circle cx={x} cy={y - 2} r="3.6" fill="currentColor" stroke="none" />
            <path d={`M${x - 6} ${y + 7} q6 -8 12 0`} />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Step 3: a table seen from above */
export function StepTable() {
  const seats = [0, 1, 2, 3, 4, 5].map((i) => {
    const a = (i / 6) * Math.PI * 2;
    return [100 + Math.cos(a) * 58, 100 + Math.sin(a) * 58] as const;
  });
  return (
    <svg {...base} aria-label="A table seen from above with six seats" className="h-full w-full">
      <circle cx="100" cy="100" r="40" fill="var(--accent)" fillOpacity=".25" />
      <circle cx="100" cy="100" r="40" />
      {seats.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="14" fill="var(--bg)" />
          <circle cx={x} cy={y} r="6" opacity={0.6} />
        </g>
      ))}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.5;
        return <circle key={i} cx={100 + Math.cos(a) * 22} cy={100 + Math.sin(a) * 22} r="7" style={draw(i * 0.4)} pathLength={1} />;
      })}
      <circle cx="100" cy="100" r="5" fill="var(--accent)" />
      <circle cx="100" cy="100" r="8" className="pulse-ring" stroke="var(--accent)" />
    </svg>
  );
}

/** Rotating circular text badge */
export function Badge({ text, className = "" }: { text: string; className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={text.replace(/•/g, ",")}>
      <defs>
        <path id="badge-circle" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0" />
      </defs>
      <g className="orbit" style={{ animationDuration: "30s" }}>
        <text fill="currentColor" fontSize="15" letterSpacing="4.2" fontWeight="600" style={{ textTransform: "uppercase" }}>
          <textPath href="#badge-circle">{text}</textPath>
        </text>
      </g>
      <circle cx="100" cy="100" r="6" fill="currentColor" />
    </svg>
  );
}
