"use client";

import * as React from "react";
import { Check, UserPen, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/input";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { siteService } from "@/services/site.service";
import { FIELD_LABELS } from "@/lib/profile-fields";
import { formatDate } from "@/lib/format";
import type { ProfileChangeRequest } from "@/types";

type Filter = "pending" | "approved" | "rejected";

export function ChangeRequestsManager() {
  const [filter, setFilter] = React.useState<Filter>("pending");
  const requests = useAsync(() => siteService.adminChangeRequests(filter), [filter]);
  const [target, setTarget] = React.useState<{ request: ProfileChangeRequest; action: "approve" | "reject" } | null>(null);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    if (!target) return;
    setBusy(true);
    try {
      if (target.action === "approve") {
        await siteService.approveChangeRequest(target.request.id, note);
        toast.success("Approved — the student's profile has been updated.");
      } else {
        await siteService.rejectChangeRequest(target.request.id, note);
        toast.success("Request rejected.");
      }
      setTarget(null);
      setNote("");
      requests.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not complete this action.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile change requests"
        description="Students cannot edit their own details. When they ask for a change, review it here — approving applies it to their profile."
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList variant="underline">
          <TabsTrigger variant="underline" value="pending">Pending</TabsTrigger>
          <TabsTrigger variant="underline" value="approved">Approved</TabsTrigger>
          <TabsTrigger variant="underline" value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {requests.status === "loading" && <LoadingState label="Loading requests" />}
      {requests.status === "error" && <ErrorState onRetry={requests.reload} />}
      {requests.data && requests.data.length === 0 && (
        <EmptyState icon={UserPen} title={`No ${filter} requests`} description="Nothing to review here right now." />
      )}

      <div className="space-y-4">
        {requests.data?.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-base font-semibold text-navy-900">{r.studentName}</p>
                <p className="text-xs text-ink-500">
                  {r.studentEmail} · requested {formatDate(r.createdAt.slice(0, 10))}
                </p>
              </div>
              <Badge tone={r.status === "pending" ? "warning" : r.status === "approved" ? "success" : "neutral"} size="sm">
                {r.status}
              </Badge>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-ink-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50/80 text-left">
                    {["Detail", "Current", "Requested"].map((h) => (
                      <th key={h} scope="col" className="px-4 py-2 text-2xs font-bold uppercase tracking-wider text-ink-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {Object.entries(r.changes).map(([field, value]) => (
                    <tr key={field}>
                      <th scope="row" className="px-4 py-2.5 text-left font-medium text-navy-900">{FIELD_LABELS[field as keyof typeof FIELD_LABELS] ?? field}</th>
                      <td className="px-4 py-2.5 text-ink-500">{r.current?.[field as keyof typeof r.current] || "—"}</td>
                      <td className="px-4 py-2.5 font-semibold text-navy-900">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {r.reason && <p className="mt-3 text-sm text-ink-600"><span className="font-semibold text-navy-900">Reason: </span>{r.reason}</p>}
            {r.adminNote && <p className="mt-1 text-sm text-ink-600"><span className="font-semibold text-navy-900">Your note: </span>{r.adminNote}</p>}

            {r.status === "pending" && (
              <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-ink-100 pt-4">
                <Button variant="secondary" onClick={() => { setNote(""); setTarget({ request: r, action: "reject" }); }}>
                  <X />
                  Reject
                </Button>
                <Button onClick={() => { setNote(""); setTarget({ request: r, action: "approve" }); }}>
                  <Check />
                  Approve &amp; apply
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(target)} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>{target?.action === "approve" ? "Approve this change?" : "Reject this request?"}</DialogTitle>
            <DialogDescription>
              {target?.action === "approve"
                ? `${target.request.studentName}'s profile will be updated straight away.`
                : "The student will see it was rejected, with your note."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Note to the student (optional)" htmlFor="cr-note">
              <Textarea id="cr-note" rows={3} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setTarget(null)}>Cancel</Button>
            <Button loading={busy} onClick={submit}>
              {target?.action === "approve" ? "Approve & apply" : "Reject request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
