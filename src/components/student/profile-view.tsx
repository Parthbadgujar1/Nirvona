"use client";

import * as React from "react";
import { KeyRound, Save, ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { useSession } from "@/hooks/use-session";
import { studentService } from "@/services/student.service";
import { INDIAN_STATES } from "@/data/site";
import { formatDate } from "@/lib/format";
import type { Student } from "@/types";

type Prefs = NonNullable<Student["notificationPrefs"]>;
const DEFAULT_PREFS: Prefs = { whatsapp: true, sms: true, email: true, portal: true };

const CLASS_OPTIONS = ["Class 11", "Class 12", "Dropper", "Other"];

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;

export function ProfileView() {
  const student = useAsync(() => studentService.me(), []);
  const { setSession } = useSession();
  const [saving, setSaving] = React.useState(false);
  // Unsaved edits layered over the loaded profile; null means "untouched".
  const [draft, setDraft] = React.useState<Record<string, string> | null>(null);
  // Optimistic notification toggles; null means "use what the server has".
  const [prefsDraft, setPrefsDraft] = React.useState<Prefs | null>(null);
  const [passwords, setPasswords] = React.useState({ current: "", next: "", confirm: "" });
  const [changingPassword, setChangingPassword] = React.useState(false);

  if (student.status === "error") return <ErrorState onRetry={student.reload} />;
  if (student.status === "loading" || !student.data) return <LoadingState label="Loading your profile" />;

  const data = student.data;
  const form = draft ?? {
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
  const prefs = prefsDraft ?? data.notificationPrefs ?? DEFAULT_PREFS;
  const setForm = (update: (prev: Record<string, string>) => Record<string, string>) =>
    setDraft((prev) => update(prev ?? form));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (form.fullName.trim().length < 3) {
      toast.error("Enter your full name.");
      return;
    }
    if (!form.dateOfBirth) {
      toast.error("Enter your date of birth.");
      return;
    }
    setSaving(true);
    try {
      const updated = await studentService.updateProfile(form);
      // Keep the header / checkout details that read the stored session in sync.
      setSession((prev) => (prev ? { ...prev, name: updated.fullName, email: updated.email } : prev));
      setDraft(null);
      student.reload();
      toast.success("Profile updated", { description: "Your changes have been saved." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your profile.");
    } finally {
      setSaving(false);
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
        description="Keep your contact details current — admit cards, results and receipts are sent to these."
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
          <form onSubmit={save}>
            <Card className="p-6">
              <h3 className="font-display text-base font-semibold text-navy-900">
                Personal information
              </h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="p-name" required>
                  <Input
                    id="p-name"
                    value={form.fullName ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  />
                </Field>
                <Field label="Student ID" htmlFor="p-id" hint="Assigned by Nirvona — cannot be changed.">
                  <Input id="p-id" value={data.id} disabled />
                </Field>
                <Field
                  label="Email address"
                  htmlFor="p-email"
                  required
                  hint="This is also your sign-in email."
                >
                  <Input
                    id="p-email"
                    type="email"
                    value={form.email ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </Field>
                <Field label="Mobile number" htmlFor="p-mobile" required>
                  <Input
                    id="p-mobile"
                    type="tel"
                    value={form.mobile ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                  />
                </Field>
                <Field label="Date of birth" htmlFor="p-dob" hint="Printed on your admit card.">
                  <Input
                    id="p-dob"
                    type="date"
                    value={form.dateOfBirth ?? ""}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                  />
                </Field>
                <Field label="Current class" htmlFor="p-class">
                  <Select
                    id="p-class"
                    value={form.className ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}
                  >
                    {CLASS_OPTIONS.concat(
                      data.className && !CLASS_OPTIONS.includes(data.className) ? [data.className] : [],
                    ).map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Gender" htmlFor="p-gender">
                  <Select
                    id="p-gender"
                    value={form.gender ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
              </div>
            </Card>

            <Card className="mt-5 p-6">
              <h3 className="font-display text-base font-semibold text-navy-900">
                Academic & address
              </h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="School / institution" htmlFor="p-school" className="sm:col-span-2">
                  <Input
                    id="p-school"
                    value={form.school ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                  />
                </Field>
                <Field label="City" htmlFor="p-city">
                  <Input
                    id="p-city"
                    value={form.city ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </Field>
                <Field
                  label="State"
                  htmlFor="p-state"
                  hint="Determines which examination centres are offered to you."
                >
                  <Select
                    id="p-state"
                    value={form.state ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  >
                    <option value="">Select your state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Address" htmlFor="p-address" className="sm:col-span-2">
                  <Input
                    id="p-address"
                    value={form.address ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </Field>
                <Field label="Parent / guardian name" htmlFor="p-gname">
                  <Input
                    id="p-gname"
                    value={form.guardianName ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, guardianName: e.target.value }))}
                  />
                </Field>
                <Field label="Parent / guardian mobile" htmlFor="p-gmobile">
                  <Input
                    id="p-gmobile"
                    type="tel"
                    value={form.guardianMobile ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, guardianMobile: e.target.value }))}
                  />
                </Field>
              </div>

              <div className="mt-6 flex justify-end border-t border-ink-100 pt-5">
                <Button type="submit" size="lg" loading={saving} disabled={!draft}>
                  <Save />
                  Save changes
                </Button>
              </div>
            </Card>
          </form>
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
