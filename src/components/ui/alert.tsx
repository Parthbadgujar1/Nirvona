import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  info: {
    wrap: "border-royal-200 bg-royal-50 text-royal-900",
    icon: "text-royal-600",
    Icon: Info,
  },
  success: {
    wrap: "border-success-500/30 bg-success-50 text-success-700",
    icon: "text-success-600",
    Icon: CheckCircle2,
  },
  warning: {
    wrap: "border-warning-500/30 bg-warning-50 text-warning-700",
    icon: "text-warning-600",
    Icon: AlertTriangle,
  },
  danger: {
    wrap: "border-danger-500/30 bg-danger-50 text-danger-700",
    icon: "text-danger-600",
    Icon: XCircle,
  },
  neutral: {
    wrap: "border-ink-200 bg-ink-50 text-ink-700",
    icon: "text-ink-500",
    Icon: Info,
  },
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  className,
  action,
}: {
  tone?: keyof typeof TONES;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  const { wrap, icon, Icon } = TONES[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-xl border p-4", wrap, className)}
    >
      <Icon className={cn("mt-0.5 size-[18px] shrink-0", icon)} aria-hidden />
      <div className="flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn("leading-relaxed", title && "mt-1 opacity-90")}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
