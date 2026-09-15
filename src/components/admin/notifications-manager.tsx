"use client";

import * as React from "react";
import {
  Bell, CheckCircle2, Mail, MessageSquare, MoreHorizontal, Plus, RefreshCcw, Send, Trash2, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger,
} from "@/components/ui/dropdown";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FilterBar } from "@/components/shared/filters";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { adminService } from "@/services/admin.service";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { AppNotification, NotificationChannel } from "@/types";

const CHANNELS: { id: NotificationChannel; label: string; icon: typeof Bell; note: string }[] = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, note: "Highest open rate; used for admit cards and results" },
  { id: "sms", label: "SMS", icon: MessageSquare, note: "Reserved for exam-day critical updates" },
  { id: "email", label: "Email", icon: Mail, note: "Receipts, results and long-form notices" },
  { id: "portal", label: "Portal", icon: Bell, note: "Always delivered; visible in the student portal" },
];

const TEMPLATES = [
  { id: "admit-card", title: "Admit card available", message: "Your admit card for {EXAM} is now available. Download it from your Nirvona portal. Reporting time {TIME} on {DATE}." },
  { id: "exam", title: "Exam reminder", message: "Reminder: {EXAM} is on {DATE}. Report at {TIME} at {CENTRE}. Carry a printed admit card and original photo ID." },
  { id: "result", title: "Result published", message: "Your {EXAM} result is published. View your score, rank, percentile and performance analysis in your Nirvona portal." },
  { id: "payment", title: "Payment confirmation", message: "We have received your payment of {AMOUNT} for {PACKAGE}. Your enrolment is now active. Receipt: {ORDER_ID}." },
];

export function NotificationsManager() {
  const notifications = useAsync(() => adminService.notifications(), []);
  const exams = useAsync(() => adminService.exams(), []);

  // Local edits layered over the service data; null means "unchanged".
  const [edited, setEdited] = React.useState<AppNotification[] | null>(null);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({ channel: "all", status: "all" });
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [template, setTemplate] = React.useState(TEMPLATES[0].id);
  const [message, setMessage] = React.useState(TEMPLATES[0].message);
  const [title, setTitle] = React.useState(TEMPLATES[0].title);
  // Was a hard-coded "CBT-04" that never matched any real exam id, so
  // the Select's displayed option (built from live exam data) and the
  // actual audience value used to send/preview recipient counts
  // silently disagreed. Empty until real exams load, then defaults to
  // the first one.
  const [audience, setAudience] = React.useState("");
  const [selectedChannels, setSelectedChannels] = React.useState<NotificationChannel[]>(["whatsapp", "email", "portal"]);
  const [sending, setSending] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AppNotification | null>(null);

  React.useEffect(() => {
    if (!audience && exams.data && exams.data.length > 0) {
      setAudience(exams.data[0].id);
    }
  }, [audience, exams.data]);

  if (notifications.status === "error") return <ErrorState onRetry={notifications.reload} />;
  if (notifications.status === "loading" || !notifications.data) {
    return <LoadingState label="Loading notification log" />;
  }

  const rows = edited ?? notifications.data;
  const setRows = (update: (prev: AppNotification[]) => AppNotification[]) =>
    setEdited((prev) => update(prev ?? notifications.data ?? []));

  const filtered = rows.filter((row) => {
    if (filters.channel !== "all" && row.channel !== filters.channel) return false;
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (search && !`${row.title} ${row.message} ${row.audience}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const delivered = rows.filter((r) => r.status === "delivered").length;
  const failed = rows.filter((r) => r.status === "failed").length;
  const totalRecipients = rows.reduce((sum, r) => sum + r.recipients, 0);

  const columns: Column<AppNotification>[] = [
    {
      key: "title",
      header: "Notification",
      primary: true,
      sortValue: (row) => row.title,
      cell: (row) => (
        <div className="max-w-sm">
          <p className="truncate font-semibold text-navy-900">{row.title}</p>
          <p className="truncate text-xs text-ink-500">{row.message}</p>
        </div>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      sortValue: (row) => row.channel,
      cell: (row) => (
        <Badge tone="neutral" size="sm">
          {row.channel === "portal" ? "Portal" : row.channel.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "audience",
      header: "Audience",
      cell: (row) => <span className="text-xs text-ink-600">{row.audience}</span>,
    },
    {
      key: "recipients",
      header: "Recipients",
      align: "right",
      sortValue: (row) => row.recipients,
      cell: (row) => <span className="tabular text-ink-700">{formatNumber(row.recipients)}</span>,
    },
    {
      key: "status",
      header: "Delivery",
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge kind="delivery" status={row.status} size="sm" />,
    },
    {
      key: "createdAt",
      header: "Sent at",
      hideOnCard: true,
      sortValue: (row) => row.createdAt,
      cell: (row) => <span className="text-xs text-ink-500">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      hideOnCard: true,
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === "failed" && (
            <Button
              variant="secondary"
              size="xs"
              onClick={async () => {
                try {
                  await adminService.retryNotification(row.id);
                  setRows((prev) =>
                    prev.map((r) => (r.id === row.id ? { ...r, status: "sent" as const } : r)),
                  );
                  toast.success("Notification requeued", {
                    description: `Retrying delivery to ${formatNumber(row.recipients)} recipients.`,
                  });
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to retry notification.");
                }
              }}
            >
              <RefreshCcw />
              Retry
            </Button>
          )}
          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.title}`}>
                <MoreHorizontal />
              </Button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownLabel>{row.title}</DropdownLabel>
              <DropdownSeparator />
              <DropdownItem destructive onSelect={() => setDeleteTarget(row)}>
                <Trash2 />
                Delete notification
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      ),
    },
  ];

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await adminService.deleteNotification(deleteTarget.id);
      setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this notification.");
    }
  }

  async function send() {
    if (selectedChannels.length === 0) {
      toast.error("Select at least one channel");
      return;
    }
    setSending(true);
    try {
      const created = await adminService.sendNotification({
        title,
        message,
        type: template,
        channels: selectedChannels,
        examId: audience,
      });
      setRows((prev) => [...created, ...prev]);
      setComposeOpen(false);
      const recipients = created[0]?.recipients ?? 0;
      toast.success("Notification queued", {
        description: `${formatNumber(recipients)} recipients across ${selectedChannels.length} channel${selectedChannels.length === 1 ? "" : "s"}.`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send notification.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Send and track WhatsApp, SMS, email and portal notifications to candidates."
        actions={
          <Button size="md" onClick={() => setComposeOpen(true)}>
            <Plus />
            New notification
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Notifications sent" numericValue={rows.length} icon={Send} accent="navy" />
        <StatCard label="Delivered" numericValue={delivered} icon={CheckCircle2} accent="success" />
        <StatCard label="Failed" numericValue={failed} icon={XCircle} accent="danger" />
        <StatCard label="Total recipients" numericValue={totalRecipients} icon={Bell} accent="ember" />
      </div>

      {failed > 0 && (
        <Alert tone="danger" title={`${failed} notification batch failed to deliver`}>
          Failed batches are usually caused by an unreachable channel provider. Retry from the table
          below — recipients who already received the message are not messaged twice.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CHANNELS.map(({ id, label, icon: Icon, note }) => {
          const count = rows.filter((r) => r.channel === id).length;
          return (
            <Card key={id} className="p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-navy-100">
                <Icon className="size-[18px]" aria-hidden />
              </span>
              <p className="mt-4 font-display text-sm font-semibold text-navy-900">{label}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">{note}</p>
              <p className="mt-3 text-2xs font-semibold uppercase tracking-wider text-ink-400">
                {count} batch{count === 1 ? "" : "es"} sent
              </p>
            </Card>
          );
        })}
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search notifications…"
        values={filters}
        resultCount={filtered.length}
        onChange={(id, value) => setFilters((f) => ({ ...f, [id]: value }))}
        onReset={() => {
          setFilters({ channel: "all", status: "all" });
          setSearch("");
        }}
        filters={[
          {
            id: "channel",
            label: "Channel",
            options: CHANNELS.map((c) => ({ label: c.label, value: c.id })),
          },
          {
            id: "status",
            label: "Delivery",
            options: ["sent", "delivered", "failed", "pending"].map((s) => ({ label: s, value: s })),
          },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications match this view"
          description="Clear the filters, or send a new notification to a candidate group."
          action={{ label: "New notification", onClick: () => setComposeOpen(true) }}
        />
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(row) => row.id} caption="Notification log" />
      )}

      {/* Compose */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Send a notification</DialogTitle>
            <DialogDescription>
              Choose a template, pick the audience and select the delivery channels.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <Field label="Template" htmlFor="ntf-template">
              <Select
                id="ntf-template"
                value={template}
                onChange={(e) => {
                  const next = TEMPLATES.find((t) => t.id === e.target.value)!;
                  setTemplate(next.id);
                  setTitle(next.title);
                  setMessage(next.message);
                }}
              >
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Audience" htmlFor="ntf-audience" hint="Candidates assigned to this examination.">
              <Select id="ntf-audience" value={audience} onChange={(e) => setAudience(e.target.value)}>
                {(exams.data ?? []).map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.id} — {formatNumber(exam.candidates)} candidates
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Title" htmlFor="ntf-title" required>
              <Input id="ntf-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>

            <Field
              label="Message"
              htmlFor="ntf-message"
              required
              hint="Placeholders like {EXAM}, {DATE}, {TIME} and {CENTRE} are replaced per recipient."
            >
              <Textarea
                id="ntf-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Field>

            <fieldset>
              <legend className="mb-1.5 block text-sm font-medium text-ink-700">
                Delivery channels<span className="ml-0.5 text-ember-600">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {CHANNELS.map(({ id, label }) => (
                  <label
                    key={id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-ink-200 px-3 py-2.5 text-sm transition-colors hover:border-navy-200"
                  >
                    <Checkbox
                      checked={selectedChannels.includes(id)}
                      onCheckedChange={(checked) =>
                        setSelectedChannels((prev) =>
                          checked ? [...prev, id] : prev.filter((c) => c !== id),
                        )
                      }
                      aria-label={label}
                      disabled={id === "portal"}
                    />
                    <span className="text-navy-900">{label}</span>
                    {id === "portal" && (
                      <Badge tone="neutral" size="sm" className="ml-auto">
                        Always on
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setComposeOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={send} loading={sending}>
              <Send />
              Send to {formatNumber(exams.data?.find((e) => e.id === audience)?.candidates ?? 0)}{" "}
              candidates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This removes the notification from the admin log and from every recipient's portal feed. This can't be undone."
        confirmLabel="Delete notification"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
