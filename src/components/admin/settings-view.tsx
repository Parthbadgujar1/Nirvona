"use client";

import * as React from "react";
import { KeyRound, Save, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { useSession } from "@/hooks/use-session";
import { useAsync } from "@/hooks/use-async";
import { siteService } from "@/services/site.service";
import type { SiteSettings } from "@/types";

export function SettingsView() {
  // There is exactly one admin account - no super-admin/exam-manager/
  // support sub-roles and no second admin to invite (see
  // AdminMiddleware, which only ever gates on "admin" vs "student").
  const { session } = useSession("admin");
  const settings = useAsync(() => siteService.getAdminSettings(), []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Organisation details shown on the website, your administrator account and password."
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
          <TabsTrigger variant="underline" value="team">Administrator</TabsTrigger>
          <TabsTrigger variant="underline" value="security">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="organisation">
          {settings.status === "loading" && <LoadingState label="Loading settings" />}
          {settings.status === "error" && <ErrorState onRetry={settings.reload} />}
          {settings.data && <OrganisationForm initial={settings.data} onSaved={settings.reload} />}
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
              exposed through the student-facing API.
            </Alert>
            <PasswordForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrganisationForm({ initial, onSaved }: { initial: SiteSettings; onSaved: () => void }) {
  const [form, setForm] = React.useState<SiteSettings>(initial);
  const [saving, setSaving] = React.useState(false);
  const set = (key: keyof SiteSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await siteService.updateSettings(form);
      setForm(saved);
      onSaved();
      toast.success("Settings saved", { description: "The website now shows these details." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save}>
      <Card className="p-6">
        <h3 className="font-display text-base font-semibold text-navy-900">Organisation profile</h3>
        <p className="mt-1 text-sm text-ink-500">
          Shown in the website footer and contact page, on the student support page and on payment
          receipts. Changes appear on the site straight away.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Organisation name" htmlFor="org-name">
            <Input id="org-name" value={form.orgName} onChange={set("orgName")} maxLength={120} required />
          </Field>
          <Field label="GSTIN" htmlFor="org-gst" hint="Optional. Printed on receipts only when filled in.">
            <Input id="org-gst" value={form.gstin} onChange={set("gstin")} maxLength={15} />
          </Field>
          <Field label="Address" htmlFor="org-address" className="sm:col-span-2" hint="Shown first in the footer. Use a new line for each line of the address.">
            <Textarea id="org-address" rows={3} value={form.address} onChange={set("address")} maxLength={500} required />
          </Field>
          <Field
            label="Contact person name"
            htmlFor="org-person"
            className="sm:col-span-2"
            hint="Shown in the footer between the address and the phone number. Leave blank to hide it."
          >
            <Input id="org-person" value={form.contactPersonName} onChange={set("contactPersonName")} maxLength={100} />
          </Field>
          <Field label="Phone number" htmlFor="org-phone">
            <Input id="org-phone" value={form.phone} onChange={set("phone")} maxLength={20} required />
          </Field>
          <Field label="WhatsApp number" htmlFor="org-wa" hint="Leave blank to use the phone number.">
            <Input id="org-wa" value={form.whatsapp} onChange={set("whatsapp")} maxLength={20} />
          </Field>
          <Field label="Support email" htmlFor="org-email" className="sm:col-span-2">
            <Input id="org-email" type="email" value={form.email} onChange={set("email")} maxLength={120} required />
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
  );
}

function PasswordForm() {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (next !== confirm) {
      toast.error("The new passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await siteService.changeAdminPassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Password updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2.5">
        <KeyRound className="size-5 text-navy-700" aria-hidden />
        <h3 className="font-display text-base font-semibold text-navy-900">Change your password</h3>
      </div>
      <form className="mt-5 grid gap-4 sm:grid-cols-3" onSubmit={submit}>
        <Field label="Current password" htmlFor="a-cur">
          <Input id="a-cur" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </Field>
        <Field label="New password" htmlFor="a-new" hint="At least 10 characters, with upper-case, lower-case and a number.">
          <Input id="a-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
        </Field>
        <Field label="Confirm password" htmlFor="a-conf">
          <Input id="a-conf" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </Field>
        <div className="sm:col-span-3">
          <Button type="submit" size="md" loading={saving}>
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}
