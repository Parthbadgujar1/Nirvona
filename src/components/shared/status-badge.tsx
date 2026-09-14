import {
  AlertTriangle, CheckCircle2, Clock, Copy, FileCheck2, IdCard, Loader2,
  RotateCcw, Send, Trophy, XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  AdmitCardStatus, CredentialStatus, DeliveryStatus, ExamStatus, PaymentStatus,
} from "@/types";

type Tone = React.ComponentProps<typeof Badge>["tone"];
type Config = { label: string; tone: Tone; Icon?: typeof Clock };

const EXAM: Record<ExamStatus, Config> = {
  draft: { label: "Draft", tone: "neutral" },
  scheduled: { label: "Upcoming", tone: "royal", Icon: Clock },
  "admit-card-available": { label: "Admit Card Available", tone: "ember", Icon: IdCard },
  ongoing: { label: "Ongoing", tone: "warning", Icon: Loader2 },
  completed: { label: "Completed", tone: "neutral", Icon: CheckCircle2 },
  "result-pending": { label: "Result Pending", tone: "warning", Icon: Clock },
  "result-published": { label: "Result Published", tone: "success", Icon: Trophy },
};

const PAYMENT: Record<PaymentStatus, Config> = {
  successful: { label: "Successful", tone: "success", Icon: CheckCircle2 },
  pending: { label: "Pending", tone: "warning", Icon: Clock },
  failed: { label: "Failed", tone: "danger", Icon: XCircle },
  refunded: { label: "Refunded", tone: "neutral", Icon: RotateCcw },
};

const ADMIT: Record<AdmitCardStatus, Config> = {
  pending: { label: "Pending", tone: "warning", Icon: Clock },
  generated: { label: "Generated", tone: "royal", Icon: FileCheck2 },
  published: { label: "Published", tone: "success", Icon: CheckCircle2 },
  sent: { label: "Sent", tone: "navy", Icon: Send },
};

const CREDENTIAL: Record<CredentialStatus, Config> = {
  pending: { label: "Pending", tone: "warning", Icon: Clock },
  assigned: { label: "Assigned", tone: "success", Icon: CheckCircle2 },
  invalid: { label: "Invalid", tone: "danger", Icon: AlertTriangle },
  duplicate: { label: "Duplicate", tone: "ember", Icon: Copy },
};

const DELIVERY: Record<DeliveryStatus, Config> = {
  sent: { label: "Sent", tone: "royal", Icon: Send },
  delivered: { label: "Delivered", tone: "success", Icon: CheckCircle2 },
  failed: { label: "Failed", tone: "danger", Icon: XCircle },
  pending: { label: "Pending", tone: "warning", Icon: Clock },
};

const RESULT: Record<string, Config> = {
  processing: { label: "Processing", tone: "warning", Icon: Loader2 },
  published: { label: "Published", tone: "success", Icon: CheckCircle2 },
  valid: { label: "Valid", tone: "success", Icon: CheckCircle2 },
  invalid: { label: "Invalid", tone: "danger", Icon: XCircle },
  evaluated: { label: "Evaluated", tone: "success", Icon: CheckCircle2 },
  queued: { label: "Queued", tone: "neutral", Icon: Clock },
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
  expired: { label: "Expired", tone: "neutral" },
  suspended: { label: "Suspended", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "danger" },
  correct: { label: "Correct", tone: "success" },
  incorrect: { label: "Incorrect", tone: "danger" },
  unattempted: { label: "Unattempted", tone: "neutral" },
};

const REGISTRY = {
  exam: EXAM,
  payment: PAYMENT,
  admitCard: ADMIT,
  credential: CREDENTIAL,
  delivery: DELIVERY,
  generic: RESULT,
} as const;

export function StatusBadge({
  kind = "generic",
  status,
  size = "sm",
  showIcon = true,
}: {
  kind?: keyof typeof REGISTRY;
  status: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}) {
  const table = REGISTRY[kind] as Record<string, Config>;
  const config = table[status] ?? { label: status, tone: "neutral" as Tone };
  const Icon = config.Icon;
  return (
    <Badge tone={config.tone} size={size}>
      {showIcon && Icon && <Icon aria-hidden className={status === "ongoing" ? "animate-spin" : ""} />}
      {config.label}
    </Badge>
  );
}
