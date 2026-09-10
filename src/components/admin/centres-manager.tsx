"use client";

import * as React from "react";
import { Building2, MapPin, MonitorCog, Phone, Plus, Users } from "lucide-react";
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
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FilterBar } from "@/components/shared/filters";
import { EmptyState, ErrorState, LoadingState, StaggerGroup, StaggerItem } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { adminService, adminData } from "@/services/admin.service";
import { INDIAN_STATES } from "@/data/site";
import { formatNumber } from "@/lib/format";
import type { ExamCentre } from "@/types";

export function CentresManager() {
  const centres = useAsync(() => adminService.centres(), []);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({ status: "all" });
  const [formOpen, setFormOpen] = React.useState(false);
  const [added, setAdded] = React.useState<ExamCentre[]>([]);
  const [draft, setDraft] = React.useState({
    name: "", code: "", address: "", city: "", state: "Rajasthan", pincode: "",
    capacity: "400", labs: "5", contact: "",
  });
  const [saving, setSaving] = React.useState(false);

  if (centres.status === "error") return <ErrorState onRetry={centres.reload} />;
  if (centres.status === "loading" || !centres.data) return <LoadingState label="Loading examination centres" />;

  const all = [...added, ...centres.data];
  const filtered = all.filter((centre) => {
    if (filters.status !== "all" && centre.status !== filters.status) return false;
    if (search && !`${centre.name} ${centre.city} ${centre.state} ${centre.code}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const totalCapacity = all.reduce((sum, c) => sum + c.capacity, 0);
  const totalLabs = all.reduce((sum, c) => sum + c.labs, 0);
  const active = all.filter((c) => c.status === "active").length;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.name || !draft.code || !draft.city) {
      toast.error("Name, code and city are required");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setAdded((prev) => [
      {
        id: `CTR-${draft.code}`,
        name: draft.name,
        code: draft.code.toUpperCase(),
        address: draft.address,
        city: draft.city,
        state: draft.state,
        pincode: draft.pincode,
        capacity: Number(draft.capacity),
        labs: Number(draft.labs),
        contact: draft.contact,
        status: "active",
      },
      ...prev,
    ]);
    setSaving(false);
    setFormOpen(false);
    setDraft({ name: "", code: "", address: "", city: "", state: "Rajasthan", pincode: "", capacity: "400", labs: "5", contact: "" });
    toast.success("Examination centre added", {
      description: "The centre is now available when scheduling examinations.",
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Centres"
        description="Manage examination centres, capacity and lab infrastructure."
        actions={
          <Button size="md" onClick={() => setFormOpen(true)}>
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
          action={{ label: "Add centre", onClick: () => setFormOpen(true) }}
        />
      ) : (
        <StaggerGroup className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((centre) => {
            const perf = adminData.CENTRE_PERFORMANCE.find((p) => p.centre === centre.city);
            const utilisation = perf ? (perf.candidates / centre.capacity) * 100 : 0;
            return (
              <StaggerItem key={centre.id}>
                <Card className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Badge tone="navy" size="sm">
                      {centre.code}
                    </Badge>
                    <StatusBadge status={centre.status} size="sm" />
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
                      <dt className="text-ink-400">Avg score</dt>
                      <dd className="mt-0.5 font-display text-base font-bold tabular text-navy-900">
                        {perf?.average ?? "—"}
                      </dd>
                    </div>
                  </dl>

                  {perf && (
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-ink-500">Utilisation</span>
                        <span className="font-semibold tabular text-navy-900">
                          {formatNumber(perf.candidates)} / {centre.capacity}
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Add examination centre</DialogTitle>
            <DialogDescription>
              Centres become selectable when scheduling an examination once they are active.
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
                Add centre
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
