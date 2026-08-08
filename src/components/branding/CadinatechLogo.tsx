import { cn } from "@/lib/utils";

type MarkProps = {
  size?: number;
  className?: string;
  idPrefix?: string;
};

/**
 * Cadinatech emblem: gold winged archer medallion on a navy badge.
 * Self-contained (own navy background) so it reads on light or dark surfaces.
 */
export function CadinatechMark({ size = 36, className, idPrefix = "cdt" }: MarkProps) {
  const gold = `${idPrefix}-gold`;
  const goldDeep = `${idPrefix}-gold-deep`;
  const clip = `${idPrefix}-clip`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Cadinatech emblem"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F5D061" />
          <stop offset="50%" stopColor="#E3BE4E" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
        <linearGradient id={goldDeep} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#A8801F" />
          <stop offset="100%" stopColor="#E9C75C" />
        </linearGradient>
        <clipPath id={clip}>
          <circle cx="60" cy="60" r="60" />
        </clipPath>
      </defs>

      {/* navy badge */}
      <g clipPath={`url(#${clip})`}>
        <rect width="120" height="120" fill="#0A0E1A" />
      </g>

      {/* medallion rim */}
      <circle cx="60" cy="60" r="55.5" fill="none" stroke={`url(#${gold})`} strokeWidth="2.5" />
      <circle cx="60" cy="60" r="47" fill="none" stroke={`url(#${goldDeep})`} strokeWidth="1" opacity="0.7" />

      {/* tick marks around circumference */}
      <g stroke={`url(#${gold})`} strokeWidth="1.6" strokeLinecap="round" opacity="0.9">
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 60;
          const long = i % 5 === 0;
          const r1 = long ? 49 : 51.2;
          const r2 = 53.5;
          return (
            <line
              key={i}
              x1={60 + Math.cos(a) * r1}
              y1={60 + Math.sin(a) * r1}
              x2={60 + Math.cos(a) * r2}
              y2={60 + Math.sin(a) * r2}
              strokeWidth={long ? 2 : 1.1}
            />
          );
        })}
      </g>

      {/* wings */}
      <g fill={`url(#${goldDeep})`}>
        <path d="M56 62c-7-4-14-12-18-22-3-8-3-15-1-20 3 4 6 7 10 10-2-6-2-11-1-15 3 5 7 9 11 12-1-5-1-9 0-12 4 7 9 13 14 18 4 4 6 8 6 12 0 6-4 11-10 14-4 2-8 3-11 3z" />
      </g>
      <g fill={`url(#${gold})`}>
        <path d="M58 60c-6-4-11-11-14-19-2-6-2-12-1-16 3 4 6 8 9 11-1-5-1-9 0-12 3 5 6 9 10 12 3 3 6 7 7 11 2 6 0 11-4 14-2 1-5 1-7-1z" opacity="0.95" />
      </g>

      {/* sparkles top-left of wings */}
      <g fill={`url(#${gold})`}>
        <path d="M28 26l1.6 4.4L34 32l-4.4 1.6L28 38l-1.6-4.4L22 32l4.4-1.6z" />
        <path d="M38 17l1.1 3 3 1.1-3 1.1-1.1 3-1.1-3-3-1.1 3-1.1z" opacity="0.85" />
      </g>

      {/* archer figure */}
      <g fill={`url(#${gold})`}>
        {/* head */}
        <circle cx="71" cy="45" r="6" />
        {/* torso */}
        <path d="M66 52c4-2 9-2 12 1 3 3 3 8 1 12l-4 8-9-3 2-9-4-4z" />
        {/* front arm holding bow */}
        <path d="M76 55l14-9 2 3.4-14 9z" />
        {/* draw arm */}
        <path d="M69 57l-11 5 1.6 3.4 11-5z" />
        {/* legs */}
        <path d="M67 71l-4 14 4 1 6-12z" />
        <path d="M74 72l3 13 4-1-2-13z" />
      </g>

      {/* bow */}
      <path
        d="M96 28c8 8 10 20 5 30"
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* bowstring */}
      <path d="M96 28L58 62l43-4z" fill="none" stroke={`url(#${goldDeep})`} strokeWidth="1.2" />
      {/* arrow */}
      <g stroke={`url(#${gold})`} strokeWidth="2" strokeLinecap="round" fill="none">
        <line x1="58" y1="62" x2="104" y2="30" />
        <path d="M104 30l-8 1.5M104 30l-1.5 8" strokeWidth="2" />
      </g>
    </svg>
  );
}

type LogoProps = {
  /** emblem size in px */
  size?: number;
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
  tagline?: string;
  idPrefix?: string;
};

export function CadinatechLogo({
  size = 36,
  showWordmark = true,
  className,
  wordmarkClassName,
  tagline,
  idPrefix,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <CadinatechMark size={size} idPrefix={idPrefix} className="rounded-full" />
      {showWordmark && (
        <div className="leading-tight">
          <span
            className={cn(
              "block font-serif uppercase tracking-[0.22em] text-[#C79A29] dark:text-[#E9C75C]",
              wordmarkClassName
            )}
          >
            Cadinatech
          </span>
          {tagline && (
            <span className="block text-xs text-muted-foreground tracking-wide">{tagline}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default CadinatechLogo;
