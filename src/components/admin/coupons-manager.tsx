"use client";

import * as React from "react";
import { Copy, Plus, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/input";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { siteService } from "@/services/site.service";
import { formatDate } from "@/lib/format";
import type { Coupon } from "@/types";

const EMPTY = { code: "", percent: "10", description: "", maxUses: "", expiresAt: "" };

export function CouponsManager() {
  const coupons = useAsync(() => siteService.listCoupons(), []);
  const [formOpen, setFormOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Coupon | null>(null);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await siteService.createCoupon({
        code: draft.code.trim(),
        percent: Number(draft.percent),
        description: draft.description.trim() || undefined,
        maxUses: draft.maxUses ? Number(draft.maxUses) : null,
        expiresAt: draft.expiresAt || null,
      });
      coupons.reload();
      setFormOpen(false);
      setDraft(EMPTY);
      toast.success("Coupon created", { description: "Give this code to the student personally." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the coupon.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(coupon: Coupon) {
    try {
      await siteService.updateCoupon(coupon.id, { status: coupon.status === "active" ? "inactive" : "active" });
      coupons.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the coupon.");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await siteService.deleteCoupon(deleteTarget.id);
    coupons.reload();
    toast.success(`Coupon ${deleteTarget.code} deleted`);
  }

  function state(c: Coupon): { label: string; tone: "success" | "neutral" | "warning" } {
    if (c.status !== "active") return { label: "Inactive", tone: "neutral" };
    if (c.expiresAt && new Date(c.expiresAt.replace(" ", "T")) < new Date()) return { label: "Expired", tone: "warning" };
    if (c.maxUses !== null && c.usedCount >= c.maxUses) return { label: "Used up", tone: "warning" };
    return { label: "Active", tone: "success" };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        description="Create a discount code and give it to a student yourself. At checkout the student enters it for that percentage off, on top of the package's own discount."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus />
            New coupon
          </Button>
        }
      />

      <Alert tone="info" title="Codes are private">
        Coupons are never shown on the website. Only a student who has been given the code can use it.
        A coupon can take between 1% and 99% off.
      </Alert>

      {coupons.status === "loading" && <LoadingState label="Loading coupons" />}
      {coupons.status === "error" && <ErrorState onRetry={coupons.reload} />}
      {coupons.data && coupons.data.length === 0 && (
        <EmptyState
          icon={Ticket}
          title="No coupons yet"
          description="Create your first coupon to offer a student an extra discount."
          action={{ label: "New coupon", onClick: () => setFormOpen(true) }}
        />
      )}

      {coupons.data && coupons.data.length > 0 && (
        <Card className="overflow-hidden">
          <div className="nv-scroll overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50/80 text-left">
                  {["Code", "Discount", "Used", "Expires", "Status", "Note", ""].map((h) => (
                    <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 text-2xs font-bold uppercase tracking-wider text-ink-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {coupons.data.map((c) => {
                  const st = state(c);
                  return (
                    <tr key={c.id}>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 font-mono font-semibold text-navy-900 hover:text-ember-600"
                          onClick={() => {
                            void navigator.clipboard?.writeText(c.code);
                            toast.success(`${c.code} copied`);
                          }}
                          aria-label={`Copy ${c.code}`}
                        >
                          {c.code}
                          <Copy className="size-3.5 text-ink-400" aria-hidden />
                        </button>
                      </td>
                      <td className="px-4 py-3.5 tabular font-semibold text-navy-900">{c.percent}%</td>
                      <td className="px-4 py-3.5 tabular text-ink-600">
                        {c.usedCount}
                        {c.maxUses !== null ? ` / ${c.maxUses}` : " (no limit)"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-ink-600">
                        {c.expiresAt ? formatDate(c.expiresAt.slice(0, 10)) : "Never"}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={st.tone} size="sm">{st.label}</Badge>
                      </td>
                      <td className="max-w-[16rem] truncate px-4 py-3.5 text-ink-500">{c.description ?? "—"}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => toggle(c)}>
                            {c.status === "active" ? "Deactivate" : "Activate"}
                          </Button>
                          <Button size="sm" variant="ghost" aria-label={`Delete ${c.code}`} onClick={() => setDeleteTarget(c)}>
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>New coupon</DialogTitle>
            <DialogDescription>The student enters this code at checkout to get the extra discount.</DialogDescription>
          </DialogHeader>
          <form onSubmit={create}>
            <DialogBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Coupon code" htmlFor="c-code" required hint="Letters, numbers, - or _ (not case sensitive).">
                  <Input id="c-code" value={draft.code} maxLength={40} onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))} required />
                </Field>
                <Field label="Discount %" htmlFor="c-percent" required hint="1 to 99.">
                  <Input id="c-percent" type="number" min={1} max={99} value={draft.percent} onChange={(e) => setDraft((d) => ({ ...d, percent: e.target.value }))} required />
                </Field>
                <Field label="Usage limit" htmlFor="c-max" hint="Blank = unlimited.">
                  <Input id="c-max" type="number" min={1} value={draft.maxUses} onChange={(e) => setDraft((d) => ({ ...d, maxUses: e.target.value }))} />
                </Field>
                <Field label="Valid until" htmlFor="c-exp" hint="Blank = no expiry.">
                  <Input id="c-exp" type="date" value={draft.expiresAt} onChange={(e) => setDraft((d) => ({ ...d, expiresAt: e.target.value }))} />
                </Field>
              </div>
              <Field label="Note (only you see this)" htmlFor="c-desc">
                <Input id="c-desc" value={draft.description} maxLength={255} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} placeholder="e.g. Given to Aarav for the Pro plan" />
              </Field>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Create coupon</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete coupon ${deleteTarget?.code}?`}
        description="The code will stop working immediately. Past purchases that used it are not affected."
        confirmLabel="Delete coupon"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
