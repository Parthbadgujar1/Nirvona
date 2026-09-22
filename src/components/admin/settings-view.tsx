"use client";

import * as React from "react";
import { KeyRound, Save, Shield, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/checkbox";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { useSession } from "@/hooks/use-session";

export function SettingsView() {
  // There is exactly one admin account - no super-admin/exam-manager/
  // support sub-roles and no second admin to invite (see
  // AdminMiddleware, which only ever gates on "admin" vs "student").
  // The profile card shows the real signed-in admin instead of a
  // fabricated one.
  const { session } = useSession("admin");
  const [saving, setSaving] = React.useState(false);
  const [prefs, setPrefs] = React.useState({
    twoFactor: true,
    exportAudit: true,
    autoPublishKeys: false,
    credentialMasking: true,
  });

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    toast.success("Settings saved");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Organisation profile, examination defaults, administrator account and security controls."
      />

      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <Avatar name={session?.name ?? "Admin"} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold text-navy-900">{session?.name ?? "—"}</h2>
          <p className="mt-0.5 text-sm text-ink-500">{session?.email ?? "—"}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {session?.id && (
              <Badge tone="navy" size="sm">
                {session.id}
              </Badge>
            )}
            <Badge tone="ember" size="sm">
              <Shield aria-hidden />
              Administrator
            </Badge>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="organisation">
        <TabsList variant="underline">
          <TabsTrigger variant="underline" value="organisation">Organisation</TabsTrigger>
          <TabsTrigger variant="underline" value="exams">Examination defaults</TabsTrigger>
          <TabsTrigger variant="underline" value="team">Administrator</TabsTrigger>
          <TabsTrigger variant="underline" value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="organisation">
          <form onSubmit={save}>
            <Card className="p-6">
              <h3 className="font-display text-base font-semibold text-navy-900">
                Organisation profile
              </h3>
              <p className="mt-1 text-sm text-ink-500">
                Appears on receipts, admit cards and outbound notifications.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Legal name" htmlFor="org-name">
                  <Input id="org-name" defaultValue="Nirvona Education Tech Pvt. Ltd." />
                </Field>
                <Field label="GSTIN" htmlFor="org-gst">
                  <Input id="org-gst" defaultValue="08AABCN1234F1Z5" />
                </Field>
                <Field label="Support email" htmlFor="org-email">
                  <Input id="org-email" type="email" defaultValue="support@nirvona.edu.in" />
                </Field>
                <Field label="Support phone" htmlFor="org-phone">
                  <Input id="org-phone" defaultValue="+91 77097 66717" />
                </Field>
                <Field label="Registered address" htmlFor="org-address" className="sm:col-span-2">
                  <Textarea
                    id="org-address"
                    rows={3}
                    defaultValue={"Chhatrapati Sambhajinagar, Maharashtra"}
                  />
                </Field>
              </div>
              <div className="mt-6 flex justify-end border-t border-ink-100 pt-5">
                <Button type="submit" loading={saving}>
                  <Save />
                  Save changes
                </Button>
              </div>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="exams">
          <form onSubmit={save}>
            <Card className="p-6">
              <h3 className="font-display text-base font-semibold text-navy-900">
                Examination defaults
              </h3>
              <p className="mt-1 text-sm text-ink-500">
                Applied to every new examination; can be overridden per exam.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Default duration (minutes)" htmlFor="d-duration">
                  <Input id="d-duration" type="number" defaultValue={180} />
                </Field>
                <Field label="Default question count" htmlFor="d-questions">
                  <Input id="d-questions" type="number" defaultValue={90} />
                </Field>
                <Field label="Marks per correct answer" htmlFor="d-marks">
                  <Input id="d-marks" type="number" defaultValue={4} />
                </Field>
                <Field label="Negative marks per incorrect answer" htmlFor="d-neg">
                  <Input id="d-neg" type="number" defaultValue={1} />
                </Field>
                <Field
                  label="Admit card release"
                  htmlFor="d-admit"
                  hint="Days before the examination that admit cards are published."
                >
                  <Select id="d-admit" defaultValue="7">
                    {[5, 7, 10, 14].map((d) => (
                      <option key={d} value={d}>
                        {d} days before
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Credential issue window"
                  htmlFor="d-cred"
                  hint="Hours before the examination that exam-hall logins become visible."
                >
                  <Select id="d-cred" defaultValue="48">
                    {[24, 48, 72].map((h) => (
                      <option key={h} value={h}>
                        {h} hours before
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <ul className="mt-6 divide-y divide-ink-100 border-t border-ink-100">
                <li className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-navy-900">
                      Auto-publish answer keys after evaluation
                    </p>
                    <p className="text-xs text-ink-500">
                      When off, an administrator must publish each key manually.
                    </p>
                  </div>
                  <Switch
                    label="Auto-publish answer keys"
                    checked={prefs.autoPublishKeys}
                    onCheckedChange={(v) => setPrefs((p) => ({ ...p, autoPublishKeys: v }))}
                  />
                </li>
              </ul>

              <div className="mt-6 flex justify-end border-t border-ink-100 pt-5">
                <Button type="submit" loading={saving}>
                  <Save />
                  Save defaults
                </Button>
              </div>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="team">
          <div className="space-y-5">
            <Alert tone="info" title="Single administrator account">
              Nirvona has one unified admin account with complete authority over the entire
              administration system — there are no separate super-admin, exam-manager or support
              roles, and no additional admins to invite.
            </Alert>

            <Card className="overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-ink-100 p-5">
                <Users className="size-4 text-ember-600" aria-hidden />
                <h3 className="font-display text-base font-semibold text-navy-900">
                  Administrator
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-4 p-4">
                <Avatar name={session?.name ?? "Admin"} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-900">
                    {session?.name ?? "—"}
                  </p>
                  <p className="truncate text-xs text-ink-500">{session?.email ?? "—"}</p>
                </div>
                <Badge tone="ember" size="sm">
                  Full access
                </Badge>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-5">
            <Alert tone="warning" title="Credential handling">
              Examination credentials are stored separately from portal accounts and are never
              exposed through the student-facing API. Bulk credential exports are audit-logged
              against the administrator who requested them.
            </Alert>

            <Card className="p-6">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-5 text-ember-600" aria-hidden />
                <h3 className="font-display text-base font-semibold text-navy-900">
                  Security controls
                </h3>
              </div>
              <ul className="mt-5 divide-y divide-ink-100">
                {[
                  {
                    key: "twoFactor",
                    label: "Require two-factor authentication",
                    detail: "All administrator accounts must complete a second factor at sign-in.",
                  },
                  {
                    key: "exportAudit",
                    label: "Audit-log every data export",
                    detail: "Records who exported which dataset, with which filters, and when.",
                  },
                  {
                    key: "credentialMasking",
                    label: "Mask exam passwords by default",
                    detail: "Passwords stay hidden in tables until explicitly revealed.",
                  },
                ].map((item) => (
                  <li key={item.key} className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy-900">{item.label}</p>
                      <p className="text-xs leading-relaxed text-ink-500">{item.detail}</p>
                    </div>
                    <Switch
                      label={item.label}
                      checked={prefs[item.key as keyof typeof prefs]}
                      onCheckedChange={(v) => {
                        setPrefs((p) => ({ ...p, [item.key]: v }));
                        toast.success(`${item.label} ${v ? "enabled" : "disabled"}`);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2.5">
                <KeyRound className="size-5 text-navy-700" aria-hidden />
                <h3 className="font-display text-base font-semibold text-navy-900">
                  Change your password
                </h3>
              </div>
              <form
                className="mt-5 grid gap-4 sm:grid-cols-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Password updated");
                }}
              >
                <Field label="Current password" htmlFor="a-cur">
                  <Input id="a-cur" type="password" autoComplete="current-password" />
                </Field>
                <Field label="New password" htmlFor="a-new">
                  <Input id="a-new" type="password" autoComplete="new-password" />
                </Field>
                <Field label="Confirm password" htmlFor="a-conf">
                  <Input id="a-conf" type="password" autoComplete="new-password" />
                </Field>
                <div className="sm:col-span-3">
                  <Button type="submit" size="md">
                    Update password
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
