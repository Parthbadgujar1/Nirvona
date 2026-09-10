import { cn, initials } from "@/lib/utils";

const PALETTE = [
  "bg-navy-100 text-navy-800",
  "bg-royal-100 text-royal-700",
  "bg-ember-100 text-ember-700",
  "bg-success-100 text-success-700",
  "bg-saffron-200 text-saffron-600",
];

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const dimension = {
    xs: "size-7 text-2xs",
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-14 text-lg",
  }[size];
  const tone = PALETTE[name.charCodeAt(0) % PALETTE.length];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        dimension,
        tone,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
