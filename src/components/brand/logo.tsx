import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Single source of truth for the Nirvona mark.
 *
 * Replace `public/brand/nirvona-logo.svg` with the official artwork (or point
 * this constant at a .png) and every surface in the product updates at once.
 * The artwork is never recoloured, cropped or filtered — on dark surfaces the
 * mark sits on a white chip so the original colours stay legible.
 */
export const LOGO_SRC = "/brand/nirvona-logo.jpeg";

const MARK_SIZES = {
  xs: 24,
  sm: 30,
  md: 38,
  lg: 48,
  xl: 64,
} as const;

type Size = keyof typeof MARK_SIZES;

export interface LogoProps {
  /** `full` shows the mark plus wordmark, `mark` shows the mark alone. */
  variant?: "full" | "mark";
  size?: Size;
  /** Renders wordmark in white and puts the mark on a white chip. */
  onDark?: boolean;
  /** Wraps the logo in a link to the homepage. */
  href?: string | null;
  className?: string;
  /** Hides the "Education Tech" descender under the wordmark. */
  compact?: boolean;
}

export function LogoMark({
  size = "md",
  onDark,
  className,
}: {
  size?: Size;
  onDark?: boolean;
  className?: string;
}) {
  const px = MARK_SIZES[size];
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        onDark && "rounded-lg bg-white p-1 shadow-sm ring-1 ring-white/40",
        className,
      )}
      style={{ width: onDark ? px + 8 : px, height: onDark ? px + 8 : px }}
    >
      <Image
        src={LOGO_SRC}
        alt="Nirvona"
        width={px}
        height={px}
        priority
        className="size-full object-contain"
      />
    </span>
  );
}

export function Logo({
  variant = "full",
  size = "md",
  onDark = false,
  href = "/",
  className,
  compact = false,
}: LogoProps) {
  const wordSize = {
    xs: "text-sm",
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  }[size];

  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} onDark={onDark} />
      {variant === "full" && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-display font-extrabold tracking-tight",
              wordSize,
              onDark ? "text-white" : "text-navy-900",
            )}
          >
            NIRVONA
          </span>
          {!compact && (
            <span
              className={cn(
                "mt-1 text-[0.5625rem] font-semibold uppercase tracking-[0.22em]",
                onDark ? "text-white/70" : "text-ember-600",
              )}
            >
              Education Tech
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label="Nirvona Education Tech — home" className="inline-flex rounded-md">
      {content}
    </Link>
  );
}
