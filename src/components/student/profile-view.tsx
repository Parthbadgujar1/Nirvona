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
import { studentService } from "@/services/student.service";
import { INDIAN_STATES } from "@/data/site";
import { formatDate } from "@/lib/format";

export function ProfileView() {
  const student = useAsync(() => studentService.me(), []);
  const [saving, setSaving] = React.useState(false);
  // Unsaved edits layered over the loaded profile; null means "untouched".
  const [draft, setDraft] = React.useState<Record<string, string> | null>(null);
  const [prefs, setPrefs] = React.useState({ whatsapp: true, sms: true, email: true, portal: true });

  if (student.status === "error") return <ErrorState onRetry={student.reload} />;
  if (student.status === "loading" || !student.data) return <LoadingState label="Loading your profile" />;

  const data = student.data;
  const form = draft ?? {
    fullName: data.fullName,
    email: data.email,
    mobile: data.mobile,
    school: data.school,
    city: data.city,
    state: data.state,
    guardianName: data.guardianName ?? "",
    guardianMobile: data.guardianMobile ?? "",
    address: data.address ?? "",
  };
  const setForm = (update: (prev: Record<string, string>) => Record<string, string>) =>
    setDraft((prev) => update(prev ?? form));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    toast.success("Profile updated", { description: "Your changes have been saved." });
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
            {data.className} · {data.school}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="navy" size="sm">
              {data.id}
            </Badge>
            <Badge tone="success" size="sm">
              Account active
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
                <Field label="Email address" htmlFor="p-email" required>
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
                  <Input id="p-dob" value={formatDate(data.dateOfBirth)} disabled />
                </Field>
                <Field label="Current class" htmlFor="p-class">
                  <Input id="p-class" value={data.className} disabled />
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
                <Button type="submit" size="lg" loading={saving}>
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
              <form
                className="mt-5 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Password updated");
                }}
              >
                <Field label="Current password" htmlFor="cur-pass" required>
                  <Input id="cur-pass" type="password" autoComplete="current-password" />
                </Field>
                <Field label="New password" htmlFor="new-pass" required hint="At least 8 characters with a capital letter and a number.">
                  <Input id="new-pass" type="password" autoComplete="new-password" />
                </Field>
                <Field label="Confirm new password" htmlFor="conf-pass" required>
                  <Input id="conf-pass" type="password" autoComplete="new-password" />
                </Field>
                <Button type="submit" size="md">
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

              <Card className="p-6">
                <h3 className="font-display text-base font-semibold text-navy-900">
                  Recent account activity
                </h3>
                <ul className="mt-4 space-y-3">
                  {[
                    { label: "Signed in", detail: "Jaipur, IN · Chrome on macOS", time: "Today, 09:12 AM" },
                    { label: "Admit card downloaded", detail: "CBT-04", time: "Yesterday, 06:40 PM" },
                    { label: "Password changed", detail: "From the student portal", time: "12 Aug 2026" },
                  ].map((item) => (
                    <li key={item.label} className="flex items-start justify-between gap-3 border-b border-ink-100 pb-3 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-900">{item.label}</p>
                        <p className="text-xs text-ink-500">{item.detail}</p>
                      </div>
                      <span className="shrink-0 text-xs text-ink-400">{item.time}</span>
                    </li>
                  ))}
                </ul>
              </Card>
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
              {[
                { key: "portal", label: "Portal notifications", detail: "Always on for exams and results", locked: true },
                { key: "email", label: "Email", detail: "Admit cards, results and receipts" },
                { key: "whatsapp", label: "WhatsApp", detail: "Exam reminders and admit card alerts" },
                { key: "sms", label: "SMS", detail: "Critical exam-day updates only" },
              ].map((channel) => (
                <li key={channel.key} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-900">{channel.label}</p>
                    <p className="text-xs text-ink-500">{channel.detail}</p>
                  </div>
                  <Switch
                    label={channel.label}
                    checked={prefs[channel.key as keyof typeof prefs]}
                    disabled={channel.locked}
                    onCheckedChange={(v) => {
                      setPrefs((p) => ({ ...p, [channel.key]: v }));
                      toast.success(`${channel.label} ${v ? "enabled" : "disabled"}`);
                    }}
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
