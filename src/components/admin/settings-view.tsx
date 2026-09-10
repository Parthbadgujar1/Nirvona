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
import { CURRENT_ADMIN } from "@/data/students";

const TEAM = [
  { name: "Nikhil Raghavan", email: "nikhil.raghavan@nirvona.edu.in", role: "Super admin", scope: "Full access" },
  { name: "Priya Menon", email: "priya.menon@nirvona.edu.in", role: "Exam manager", scope: "Exams, credentials, results" },
  { name: "Vikas Bhatt", email: "vikas.bhatt@nirvona.edu.in", role: "Exam manager", scope: "Exams, admit cards, centres" },
  { name: "Sneha Kulkarni", email: "sneha.kulkarni@nirvona.edu.in", role: "Support", scope: "Students, payments (read-only)" },
];

const PERMISSIONS = [
  { area: "Students", superAdmin: "Full", examManager: "Read", support: "Read" },
  { area: "Purchases & payments", superAdmin: "Full", examManager: "Read", support: "Read" },
  { area: "Exams & centres", superAdmin: "Full", examManager: "Full", support: "None" },
  { area: "Exam credentials", superAdmin: "Full", examManager: "Full", support: "None" },
  { area: "Admit cards", superAdmin: "Full", examManager: "Full", support: "Read" },
  { area: "Answer keys & results", superAdmin: "Full", examManager: "Full", support: "None" },
  { area: "Reports & exports", superAdmin: "Full", examManager: "Read", support: "Read" },
  { area: "Settings & roles", superAdmin: "Full", examManager: "None", support: "None" },
];

export function SettingsView() {
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
        description="Organisation profile, examination defaults, team roles and security controls."
      />

      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <Avatar name={CURRENT_ADMIN.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold text-navy-900">{CURRENT_ADMIN.name}</h2>
          <p className="mt-0.5 text-sm text-ink-500">{CURRENT_ADMIN.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="navy" size="sm">
              {CURRENT_ADMIN.id}
            </Badge>
            <Badge tone="ember" size="sm">
              <Shield aria-hidden />
              Super admin
            </Badge>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="organisation">
        <TabsList variant="underline">
          <TabsTrigger variant="underline" value="organisation">Organisation</TabsTrigger>
          <TabsTrigger variant="underline" value="exams">Examination defaults</TabsTrigger>
          <TabsTrigger variant="underline" value="team">Team & roles</TabsTrigger>
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
                  <Input id="org-phone" defaultValue="+91 141 400 2200" />
                </Field>
                <Field label="Registered address" htmlFor="org-address" className="sm:col-span-2">
                  <Textarea
                    id="org-address"
                    rows={3}
                    defaultValue={"Plot 44, Sector 6, Malviya Nagar Industrial Area\nJaipur, Rajasthan 302017"}
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
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-ink-100 p-5">
                <div className="flex items-center gap-2.5">
                  <Users className="size-4 text-ember-600" aria-hidden />
                  <h3 className="font-display text-base font-semibold text-navy-900">
                    Administrators
                  </h3>
                </div>
                <Button variant="secondary" size="sm" onClick={() => toast.info("Invite flow would open here")}>
                  Invite admin
                </Button>
              </div>
              <ul className="divide-y divide-ink-100">
                {TEAM.map((member) => (
                  <li key={member.email} className="flex flex-wrap items-center gap-4 p-4">
                    <Avatar name={member.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-900">{member.name}</p>
                      <p className="truncate text-xs text-ink-500">{member.email}</p>
                    </div>
                    <Badge tone={member.role === "Super admin" ? "ember" : "neutral"} size="sm">
                      {member.role}
                    </Badge>
                    <span className="w-full text-xs text-ink-500 sm:w-56">{member.scope}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b border-ink-100 p-5">
                <h3 className="font-display text-base font-semibold text-navy-900">
                  Role permissions
                </h3>
                <p className="mt-1 text-xs text-ink-500">
                  Role-based access is enforced on the server; this table documents the intended
                  matrix.
                </p>
              </div>
              <div className="nv-scroll overflow-x-auto">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 bg-ink-50/70 text-left">
                      {["Area", "Super admin", "Exam manager", "Support"].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="whitespace-nowrap px-5 py-3 text-2xs font-bold uppercase tracking-wider text-ink-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {PERMISSIONS.map((row) => (
                      <tr key={row.area}>
                        <th scope="row" className="px-5 py-3.5 text-left font-medium text-navy-900">
                          {row.area}
                        </th>
                        {[row.superAdmin, row.examManager, row.support].map((value, index) => (
                          <td key={index} className="px-5 py-3.5">
                            <Badge
                              tone={value === "Full" ? "success" : value === "Read" ? "royal" : "neutral"}
                              size="sm"
                            >
                              {value}
                            </Badge>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
