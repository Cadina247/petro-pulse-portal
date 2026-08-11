import { cn } from "@/lib/utils";
import emblem from "@/assets/cadinatech-emblem.png.asset.json";

type MarkProps = {
  size?: number;
  className?: string;
  /** kept for API compatibility with previous SVG mark */
  idPrefix?: string;
};

/**
 * Cadinatech emblem: gold winged archer medallion on a deep navy field.
 * Uses the official brand artwork.
 */
export function CadinatechMark({ size = 36, className }: MarkProps) {
  return (
    <img
      src={emblem.url}
      width={size}
      height={size}
      alt="Cadinatech emblem"
      className={cn("shrink-0 object-cover", className)}
      style={{ width: size, height: size }}
      loading="lazy"
    />
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
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <CadinatechMark size={size} className="rounded-full" />
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
