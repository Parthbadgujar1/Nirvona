import { cn } from "@/lib/utils";

export function Eyebrow({ children, onDark }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-2xs font-bold uppercase tracking-[0.16em]",
        onDark
          ? "bg-white/10 text-white/80 ring-1 ring-inset ring-white/15"
          : "bg-ember-50 text-ember-700 ring-1 ring-inset ring-ember-100",
      )}
    >
      <span className={cn("size-1.5 rounded-full", onDark ? "bg-saffron-400" : "bg-ember-500")} />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  onDark = false,
  className,
  as: As = "h2",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  onDark?: boolean;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "mx-auto max-w-2xl items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow && <Eyebrow onDark={onDark}>{eyebrow}</Eyebrow>}
      <As
        className={cn(
          "font-display text-3xl font-bold leading-[1.12] sm:text-4xl lg:text-[2.75rem]",
          onDark ? "text-white" : "text-navy-900",
        )}
      >
        {title}
      </As>
      {description && (
        <p
          className={cn(
            "text-base leading-relaxed sm:text-lg",
            onDark ? "text-white/70" : "text-ink-500",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
