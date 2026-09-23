"use client";

import * as React from "react";
import { Clock, KeyRound, Lock, ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/checkbox";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { useSession } from "@/hooks/use-session";
import { studentService } from "@/services/student.service";
import { siteService } from "@/services/site.service";
import { FIELD_LABELS, FIELD_ORDER } from "@/lib/profile-fields";
import { INDIAN_STATES } from "@/data/site";
import { formatDate } from "@/lib/format";
import type { ProfileChangeField, Student } from "@/types";

type Prefs = NonNullable<Student["notificationPrefs"]>;
const DEFAULT_PREFS: Prefs = { whatsapp: true, sms: true, email: true, portal: true };

const CLASS_OPTIONS = ["Class 11", "Class 12", "Dropper", "Other"];

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;

export function ProfileView() {
  const student = useAsync(() => studentService.me(), []);
  const requests = useAsync(() => siteService.myChangeRequests(), []);
  // The "request a change" form: unsaved edits layered over the current details.
  const [requestOpen, setRequestOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Record<string, string> | null>(null);
  const [reason, setReason] = React.useState("");
  const [sending, setSending] = React.useState(false);
  // Optimistic notification toggles; null means "use what the server has".
  const [prefsDraft, setPrefsDraft] = React.useState<Prefs | null>(null);
  const [passwords, setPasswords] = React.useState({ current: "", next: "", confirm: "" });
  const [changingPassword, setChangingPassword] = React.useState(false);

  if (student.status === "error") return <ErrorState onRetry={student.reload} />;
  if (student.status === "loading" || !student.data) return <LoadingState label="Loading your profile" />;

  const data = student.data;
  const current: Record<ProfileChangeField, string> = {
    fullName: data.fullName ?? "",
    email: data.email ?? "",
    mobile: data.mobile ?? "",
    dateOfBirth: (data.dateOfBirth ?? "").slice(0, 10),
    className: data.className ?? "",
    gender: data.gender ?? "",
    school: data.school ?? "",
    city: data.city ?? "",
    state: data.state ?? "",
    guardianName: data.guardianName ?? "",
    guardianMobile: data.guardianMobile ?? "",
    address: data.address ?? "",
  };
  const form: Record<string, string> = draft ?? current;
  const hasPending = requests.data?.some((r) => r.status === "pending") ?? false;
  const show = (field: ProfileChangeField): string => {
    const v = current[field];
    if (!v) return "—";
    if (field === "dateOfBirth") return formatDate(v);
    if (field === "gender") return v.charAt(0).toUpperCase() + v.slice(1);
    return v;
  };
  const prefs = prefsDraft ?? data.notificationPrefs ?? DEFAULT_PREFS;
  const setForm = (update: (prev: Record<string, string>) => Record<string, string>) =>
    setDraft((prev) => update(prev ?? form));

  async function sendRequest(event: React.FormEvent) {
    event.preventDefault();
    const changes: Partial<Record<ProfileChangeField, string>> = {};
    for (const field of FIELD_ORDER) {
      if ((form[field] ?? "").trim() !== current[field].trim()) changes[field] = (form[field] ?? "").trim();
    }
    if (Object.keys(changes).length === 0) {
      toast.error("Change at least one detail before sending your request.");
      return;
    }
    setSending(true);
    try {
      await siteService.requestChange(changes, reason);
      setRequestOpen(false);
      setDraft(null);
      setReason("");
      requests.reload();
      toast.success("Request sent", { description: "The admin will review it and update your profile." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send your request.");
    } finally {
      setSending(false);
    }
  }

  async function togglePref(key: keyof Prefs, value: boolean, label: string) {
    const previous = prefs;
    setPrefsDraft({ ...prefs, [key]: value });
    try {
      const updated = await studentService.updateProfile({ notificationPrefs: { [key]: value } });
      setPrefsDraft(updated.notificationPrefs ?? null);
      toast.success(`${label} ${value ? "enabled" : "disabled"}`);
    } catch (error) {
      setPrefsDraft(previous);
      toast.error(error instanceof Error ? error.message : "Could not update your preference.");
    }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    if (!passwords.current) {
      toast.error("Enter your current password.");
      return;
    }
    if (!PASSWORD_RULE.test(passwords.next)) {
      toast.error("New password must be at least 8 characters with a capital letter and a number.");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    setChangingPassword(true);
    try {
      await studentService.changePassword(passwords.current, passwords.next);
      setPasswords({ current: "", next: "", confirm: "" });
      toast.success("Password updated", { description: "Use your new password next time you sign in." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your password.");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Your registered details. To change any of them, send a request to the admin."
        breadcrumbs={[{ label: "Dashboard", href: "/student/dashboard" }, { label: "My Profile" }]}
      />

      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <Avatar name={data.fullName} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold text-navy-900">{data.fullName}</h2>
          <p className="mt-0.5 text-sm text-ink-500">
            {[data.className, data.school].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="navy" size="sm">
              {data.id}
            </Badge>
            <Badge tone={data.status === "active" ? "success" : "neutral"} size="sm">
              {data.status === "active" ? "Account active" : `Account ${data.status}`}
            </Badge>
            <Badge tone="neutral" size="sm">
              Member since {formatDate(data.enrolledAt)}
            </Badge>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="details">
        <TabsList variant="underline">
          <TabsTrigger variant="underline" value="details">
            <UserCog />
            Personal details
          </TabsTrigger>
          <TabsTrigger variant="underline" value="security">
            <ShieldCheck />
            Security
          </TabsTrigger>
          <TabsTrigger variant="underline" value="notifications">
            Notification preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-navy-900">Personal information</h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
                  <Lock className="size-3.5" aria-hidden />
                  These details are locked. Only the admin can change them.
                </p>
              </div>
              <Button
                onClick={() => {
                  setDraft(null);
                  setRequestOpen(true);
                }}
                disabled={hasPending}
              >
                <UserCog />
                Request a change
              </Button>
            </div>
            {hasPending && (
              <Alert tone="info" className="mt-4" title="Request pending">
                Your change request is waiting for the admin. You can send another once it has been reviewed.
              </Alert>
            )}
            <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">Student ID</dt>
                <dd className="mt-1 break-all text-sm font-medium text-navy-900">{data.id}</dd>
              </div>
              {FIELD_ORDER.map((field) => (
                <div key={field}>
                  <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">{FIELD_LABELS[field]}</dt>
                  <dd className="mt-1 text-sm font-medium text-navy-900">{show(field)}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {requests.data && requests.data.length > 0 && (
            <Card className="mt-5 p-6">
              <h3 className="font-display text-base font-semibold text-navy-900">My change requests</h3>
              <ul className="mt-4 divide-y divide-ink-100">
                {requests.data.map((r) => (
                  <li key={r.id} className="py-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-navy-900">
                        {Object.keys(r.changes).map((k) => FIELD_LABELS[k as ProfileChangeField] ?? k).join(", ")}
                      </p>
                      <Badge tone={r.status === "pending" ? "warning" : r.status === "approved" ? "success" : "neutral"} size="sm">
                        {r.status === "pending" && <Clock aria-hidden />}
                        {r.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">Sent {formatDate(r.createdAt.slice(0, 10))}</p>
                    {r.adminNote && <p className="mt-1 text-xs text-ink-600">Admin note: {r.adminNote}</p>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
            <DialogContent size="lg">
              <DialogHeader>
                <DialogTitle>Request a change</DialogTitle>
                <DialogDescription>
                  Correct the details below that need changing, then tell the admin why. Details you do not touch stay as they are.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={sendRequest}>
                <DialogBody className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" htmlFor="r-name">
                      <Input id="r-name" value={form.fullName ?? ""} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
                    </Field>
                    <Field label="Email address" htmlFor="r-email" hint="This is also your sign-in email.">
                      <Input id="r-email" type="email" value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                    </Field>
                    <Field label="Mobile number" htmlFor="r-mobile">
                      <Input id="r-mobile" type="tel" value={form.mobile ?? ""} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} />
                    </Field>
                    <Field label="Date of birth" htmlFor="r-dob">
                      <Input id="r-dob" type="date" value={form.dateOfBirth ?? ""} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
                    </Field>
                    <Field label="Class" htmlFor="r-class">
                      <Select id="r-class" value={form.className ?? ""} onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}>
                        {CLASS_OPTIONS.concat(data.className && !CLASS_OPTIONS.includes(data.className) ? [data.className] : []).map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Gender" htmlFor="r-gender">
                      <Select id="r-gender" value={form.gender ?? ""} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </Select>
                    </Field>
                    <Field label="School / college" htmlFor="r-school" className="sm:col-span-2">
                      <Input id="r-school" value={form.school ?? ""} onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))} />
                    </Field>
                    <Field label="City" htmlFor="r-city">
                      <Input id="r-city" value={form.city ?? ""} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                    </Field>
                    <Field label="State" htmlFor="r-state">
                      <Select id="r-state" value={form.state ?? ""} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}>
                        <option value="">Select your state</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Address" htmlFor="r-address" className="sm:col-span-2">
                      <Input id="r-address" value={form.address ?? ""} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                    </Field>
                    <Field label="Guardian name" htmlFor="r-gname">
                      <Input id="r-gname" value={form.guardianName ?? ""} onChange={(e) => setForm((f) => ({ ...f, guardianName: e.target.value }))} />
                    </Field>
                    <Field label="Guardian mobile" htmlFor="r-gmobile">
                      <Input id="r-gmobile" type="tel" value={form.guardianMobile ?? ""} onChange={(e) => setForm((f) => ({ ...f, guardianMobile: e.target.value }))} />
                    </Field>
                  </div>
                  <Field label="Why do you need this change?" htmlFor="r-reason">
                    <Textarea id="r-reason" rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. My name is spelled wrongly on my admit card." />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setRequestOpen(false)}>Cancel</Button>
                  <Button type="submit" loading={sending}>Send request</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-display text-base font-semibold text-navy-900">
                Change portal password
              </h3>
              <p className="mt-1 text-sm text-ink-500">
                This password signs you in to the Nirvona website.
              </p>
              <form className="mt-5 space-y-4" onSubmit={changePassword}>
                <Field label="Current password" htmlFor="cur-pass" required>
                  <Input
                    id="cur-pass"
                    type="password"
                    autoComplete="current-password"
                    value={passwords.current}
                    onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                  />
                </Field>
                <Field label="New password" htmlFor="new-pass" required hint="At least 8 characters with a capital letter and a number.">
                  <Input
                    id="new-pass"
                    type="password"
                    autoComplete="new-password"
                    value={passwords.next}
                    onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                  />
                </Field>
                <Field label="Confirm new password" htmlFor="conf-pass" required>
                  <Input
                    id="conf-pass"
                    type="password"
                    autoComplete="new-password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  />
                </Field>
                <Button type="submit" size="md" loading={changingPassword}>
                  <KeyRound />
                  Update password
                </Button>
              </form>
            </Card>

            <div className="space-y-5">
              <Alert tone="info" title="Portal login vs exam login">
                Your portal password is <strong>only</strong> for this website. Examination-hall
                credentials are issued separately for each examination and printed on your admit
                card. Nirvona will never ask you for either by phone or message.
              </Alert>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="p-6">
            <h3 className="font-display text-base font-semibold text-navy-900">
              How we contact you
            </h3>
            <p className="mt-1 text-sm text-ink-500">
              Examination and result notifications are always sent to your portal. You can choose the
              other channels.
            </p>
            <ul className="mt-5 divide-y divide-ink-100">
              {(
                [
                  { key: "portal", label: "Portal notifications", detail: "Always on for exams and results", locked: true },
                  { key: "email", label: "Email", detail: "Admit cards, results and receipts" },
                  { key: "whatsapp", label: "WhatsApp", detail: "Exam reminders and admit card alerts" },
                  { key: "sms", label: "SMS", detail: "Critical exam-day updates only" },
                ] as { key: keyof Prefs; label: string; detail: string; locked?: boolean }[]
              ).map((channel) => (
                <li key={channel.key} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-900">{channel.label}</p>
                    <p className="text-xs text-ink-500">{channel.detail}</p>
                  </div>
                  <Switch
                    label={channel.label}
                    checked={prefs[channel.key]}
                    disabled={channel.locked}
                    onCheckedChange={(v) => togglePref(channel.key, v, channel.label)}
                  />
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
