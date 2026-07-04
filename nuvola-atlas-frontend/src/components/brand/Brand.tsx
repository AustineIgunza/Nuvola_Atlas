import { cn } from "@/lib/cn";

/**
 * Navuuna continent emblem — the hand-drawn Africa "fingerprint" mark,
 * backgroundless (transparent PNG) so it sits on any surface.
 */
export function Emblem({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <img
      src="/navuuna-emblem.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={cn("object-contain select-none pointer-events-none", className)}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

/**
 * Navuuna wordmark — lowercase Poppins with the signature Living-Teal line
 * running under the "uu" (the two basins of the platform). The line is the
 * brand's most loaded element, so it is always teal.
 */
export function Wordmark({
  className,
  underline = true,
}: {
  className?: string;
  underline?: boolean;
}) {
  return (
    <span
      className={cn(
        "font-brand font-semibold lowercase tracking-[-0.01em] text-ink-1 leading-none",
        className,
      )}
    >
      nav
      <span className="relative inline-block">
        uu
        {underline && (
          <span
            aria-hidden="true"
            className="absolute left-0 rounded-full bg-teal"
            style={{ bottom: "-0.16em", height: "0.11em", width: "100%" }}
          />
        )}
      </span>
      na
    </span>
  );
}

/** Emblem + wordmark lockup used in the sidebar and auth screens. */
export function BrandLockup({
  className,
  emblemSize = 26,
  wordmarkClass,
}: {
  className?: string;
  emblemSize?: number;
  wordmarkClass?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Emblem size={emblemSize} />
      <Wordmark className={wordmarkClass ?? "text-[17px]"} />
    </span>
  );
}
