"use client";

import * as React from "react";
import {
  Building2, MapPin, MonitorCog, MoreHorizontal, Pencil, Phone, Plus, Trash2, Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/progress";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger,
} from "@/components/ui/dropdown";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FilterBar } from "@/components/shared/filters";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingState, StaggerGroup, StaggerItem } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { adminService } from "@/services/admin.service";
import { INDIAN_STATES } from "@/data/site";
import { formatNumber } from "@/lib/format";
import type { ExamCentre } from "@/types";

const EMPTY_DRAFT = {
  name: "", code: "", address: "", city: "", state: "Rajasthan", pincode: "",
  capacity: "400", labs: "5", contact: "",
};

export function CentresManager() {
  const centres = useAsync(() => adminService.centres(), []);
  const exams = useAsync(() => adminService.exams(), []);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({ status: "all" });
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ExamCentre | null>(null);
  const [draft, setDraft] = React.useState(EMPTY_DRAFT);
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<ExamCentre | null>(null);

  if (centres.status === "error") return <ErrorState onRetry={centres.reload} />;
  if (centres.status === "loading" || !centres.data) return <LoadingState label="Loading examination centres" />;

  const all = centres.data;
  const filtered = all.filter((centre) => {
    if (filters.status !== "all" && centre.status !== filters.status) return false;
    if (search && !`${centre.name} ${centre.city} ${centre.state} ${centre.code}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const totalCapacity = all.reduce((sum, c) => sum + c.capacity, 0);
  const totalLabs = all.reduce((sum, c) => sum + c.labs, 0);
  const active = all.filter((c) => c.status === "active").length;

  function openCreate() {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setFormOpen(true);
  }

  function openEdit(centre: ExamCentre) {
    setEditing(centre);
    setDraft({
      name: centre.name,
      code: centre.code,
      address: centre.address ?? "",
      city: centre.city,
      state: centre.state ?? "Rajasthan",
      pincode: centre.pincode ?? "",
      capacity: String(centre.capacity ?? 0),
      labs: String(centre.labs ?? 0),
      contact: centre.contact ?? "",
    });
    setFormOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.name || !draft.code || !draft.city) {
      toast.error("Name, code and city are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: draft.name,
        code: draft.code.toUpperCase(),
        address: draft.address || null,
        city: draft.city,
        state: draft.state || null,
        pincode: draft.pincode || null,
        capacity: Number(draft.capacity) || 0,
        labs: Number(draft.labs) || 0,
        contact: draft.contact || null,
      };
      if (editing) {
        await adminService.updateCentre(editing.id, payload);
      } else {
        await adminService.createCentre(payload);
      }
      centres.reload();
      setFormOpen(false);
      setEditing(null);
      setDraft(EMPTY_DRAFT);
      toast.success(editing ? "Examination centre updated" : "Examination centre added", {
        description: editing
          ? "Changes are now reflected wherever this centre is used."
          : "The centre is now available when scheduling examinations.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this centre.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await adminService.deleteCentre(deleteTarget.id);
      centres.reload();
      toast.success(`${deleteTarget.name} deleted`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this centre.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Centres"
        description="Manage examination centres, capacity and lab infrastructure."
        actions={
          <Button size="md" onClick={openCreate}>
            <Plus />
            Add centre
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Centres" numericValue={all.length} icon={Building2} accent="navy" />
        <StatCard label="Active" numericValue={active} icon={Building2} accent="success" />
        <StatCard label="Total seat capacity" numericValue={totalCapacity} icon={Users} accent="ember" />
        <StatCard label="Computer labs" numericValue={totalLabs} icon={MonitorCog} accent="royal" />
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search centre, city or code…"
        values={filters}
        resultCount={filtered.length}
        onChange={(id, value) => setFilters((f) => ({ ...f, [id]: value }))}
        onReset={() => {
          setFilters({ status: "all" });
          setSearch("");
        }}
        filters={[
          {
            id: "status",
            label: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No centres match this search"
          description="Clear the filters, or add a new examination centre."
          action={{ label: "Add centre", onClick: openCreate }}
        />
      ) : (
        <StaggerGroup className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((centre) => {
            // Was matched against mock CENTRE_PERFORMANCE by city name -
            // a real centre sharing a city with the mock data (as any
            // newly added Jaipur/Delhi/Pune centre would) showed that
            // *other* centre's numbers, once even over 100% capacity.
            // Derived instead from this centre's own real assigned exams.
            const centreExams = (exams.data ?? []).filter((e) => e.centreId === centre.id);
            const assignedCandidates = centreExams.reduce((sum, e) => sum + e.candidates, 0);
            const utilisation = centre.capacity ? (assignedCandidates / centre.capacity) * 100 : 0;
            return (
              <StaggerItem key={centre.id}>
                <Card className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Badge tone="navy" size="sm">
                      {centre.code}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={centre.status} size="sm" />
                      <Dropdown>
                        <DropdownTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${centre.name}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownTrigger>
                        <DropdownContent>
                          <DropdownLabel>{centre.code}</DropdownLabel>
                          <DropdownSeparator />
                          <DropdownItem onSelect={() => openEdit(centre)}>
                            <Pencil />
                            Edit centre
                          </DropdownItem>
                          <DropdownItem destructive onSelect={() => setDeleteTarget(centre)}>
                            <Trash2 />
                            Delete centre
                          </DropdownItem>
                        </DropdownContent>
                      </Dropdown>
                    </div>
                  </div>

                  <h2 className="mt-3 font-display text-base font-semibold leading-snug text-navy-900">
                    {centre.name}
                  </h2>

                  <address className="mt-2 flex flex-1 gap-2 not-italic text-sm leading-relaxed text-ink-500">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden />
                    <span>
                      {centre.address}
                      <br />
                      {centre.city}, {centre.state} — {centre.pincode}
                    </span>
                  </address>

                  <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-ink-100 pt-4 text-xs">
                    <div>
                      <dt className="text-ink-400">Capacity</dt>
                      <dd className="mt-0.5 font-display text-base font-bold tabular text-navy-900">
                        {centre.capacity}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-400">Labs</dt>
                      <dd className="mt-0.5 font-display text-base font-bold tabular text-navy-900">
                        {centre.labs}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-400">Exams hosted</dt>
                      <dd className="mt-0.5 font-display text-base font-bold tabular text-navy-900">
                        {centreExams.length}
                      </dd>
                    </div>
                  </dl>

                  {centreExams.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-ink-500">Utilisation</span>
                        <span className="font-semibold tabular text-navy-900">
                          {formatNumber(assignedCandidates)} / {centre.capacity}
                        </span>
                      </div>
                      <ProgressBar
                        value={utilisation}
                        size="sm"
                        tone={utilisation > 95 ? "danger" : utilisation > 80 ? "warning" : "success"}
                        label={`${centre.city} utilisation`}
                      />
                    </div>
                  )}

                  <p className="mt-4 flex items-center gap-2 border-t border-ink-100 pt-4 text-xs text-ink-500">
                    <Phone className="size-3.5" aria-hidden />
                    {centre.contact}
                  </p>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}

      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null); }}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add examination centre"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Changes apply immediately and are reflected wherever this centre is used."
                : "Centres become selectable when scheduling an examination once they are active."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save}>
            <DialogBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <Field label="Centre name" htmlFor="c-name" required>
                  <Input
                    id="c-name"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Nirvona Examination Centre — Salt Lake"
                  />
                </Field>
                <Field label="Centre code" htmlFor="c-code" required>
                  <Input
                    id="c-code"
                    value={draft.code}
                    onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))}
                    placeholder="KOL-01"
                  />
                </Field>
              </div>

              <Field label="Address" htmlFor="c-address">
                <Input
                  id="c-address"
                  value={draft.address}
                  onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                  placeholder="Sector V, Salt Lake City"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="City" htmlFor="c-city" required>
                  <Input
                    id="c-city"
                    value={draft.city}
                    onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                  />
                </Field>
                <Field label="State" htmlFor="c-state">
                  <Select
                    id="c-state"
                    value={draft.state}
                    onChange={(e) => setDraft((d) => ({ ...d, state: e.target.value }))}
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Pincode" htmlFor="c-pin">
                  <Input
                    id="c-pin"
                    value={draft.pincode}
                    onChange={(e) => setDraft((d) => ({ ...d, pincode: e.target.value }))}
                    placeholder="700091"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Seat capacity" htmlFor="c-cap">
                  <Input
                    id="c-cap"
                    type="number"
                    value={draft.capacity}
                    onChange={(e) => setDraft((d) => ({ ...d, capacity: e.target.value }))}
                  />
                </Field>
                <Field label="Computer labs" htmlFor="c-labs">
                  <Input
                    id="c-labs"
                    type="number"
                    value={draft.labs}
                    onChange={(e) => setDraft((d) => ({ ...d, labs: e.target.value }))}
                  />
                </Field>
                <Field label="Contact number" htmlFor="c-contact">
                  <Input
                    id="c-contact"
                    value={draft.contact}
                    onChange={(e) => setDraft((d) => ({ ...d, contact: e.target.value }))}
                    placeholder="+91 33 4000 1100"
                  />
                </Field>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? "Save changes" : "Add centre"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name}?`}
        description="This removes the centre permanently. Exams already assigned to it are unaffected but will show no centre until reassigned."
        confirmLabel="Delete centre"
        tone="danger"
        details={
          deleteTarget && (
            <div className="rounded-xl border border-ink-200 bg-canvas p-4 text-sm">
              <p className="font-semibold text-navy-900">
                {deleteTarget.code} · {deleteTarget.name}
              </p>
              <p className="mt-1 text-ink-500">
                {deleteTarget.city}, {deleteTarget.state}
              </p>
            </div>
          )
        }
        onConfirm={confirmDelete}
      />
    </div>
  );
}
