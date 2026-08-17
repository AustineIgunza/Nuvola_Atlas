import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/use-t";

interface Props {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a value the API did not supply. The dotted underline is the visual
 * distinction from a measured number; `title` carries the reason for anyone
 * who hovers, and `aria-label` for anyone who cannot.
 */
export default function EstimatedMark({ children, className }: Props) {
  const t = useT();
  return (
    <span
      title={t("estimated.tooltip")}
      aria-label={t("estimated.tooltip")}
      className={cn(
        "decoration-dotted decoration-from-font underline underline-offset-[3px] opacity-70",
        className,
      )}
    >
      {children}
    </span>
  );
}
