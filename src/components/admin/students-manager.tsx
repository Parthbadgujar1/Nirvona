"use client";

import * as React from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock, CreditCard, Download, Eye, GraduationCap, IdCard, KeyRound, MoreHorizontal,
  Pencil, UserCheck, UserX, Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Field, Input } from "@/components/ui/input";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger,
} from "@/components/ui/dropdown";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FilterBar, Pagination } from "@/components/shared/filters";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { adminService, adminData } from "@/services/admin.service";
import { catalogueService } from "@/services/catalogue.service";
import { useCourses } from "@/hooks/use-catalogue";
import { formatDate, formatCurrency } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";
import type { Student } from "@/types";

const PAGE_SIZE = 10;

const EDIT_FIELDS: { key: keyof Student; label: string }[] = [
  { key: "fullName", label: "Full name" },
  { key: "email", label: "Email" },
  { key: "mobile", label: "Mobile" },
  { key: "className", label: "Class" },
  { key: "school", label: "School" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "guardianName", label: "Guardian name" },
  { key: "guardianMobile", label: "Guardian mobile" },
];

export function StudentsManager() {
  const { courses: COURSES } = useCourses();
  const students = useAsync(() => adminService.students(), []);
  const payments = useAsync(() => adminService.payments(), []);
  // `Student.examPreference` is a mock-only field the real `students`
  // table never had - every real row crashed on `[0]` (and the course
  // filter never matched anything even once guarded). Enrollments are
  // real and already carry the actual courseSlug/packageId a student
  // bought, so that's what "Course"/"Package" derive from instead.
  const enrollments = useAsync(() => adminService.enrollments(), []);
  const packages = useAsync(() => catalogueService.listPackages(), []);

  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({
    course: "all",
    class: "all",
    payment: "all",
    status: "all",
  });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [detail, setDetail] = React.useState<Student | null>(null);
  const [editing, setEditing] = React.useState<Student | null>(null);
  const [draft, setDraft] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [statusTarget, setStatusTarget] = React.useState<Student | null>(null);

  if (students.status === "error") return <ErrorState onRetry={students.reload} />;
  if (students.status === "loading" || !students.data) {
    return <LoadingState label="Loading student records" />;
  }

  function openEdit(student: Student) {
    setEditing(student);
    setDraft({
      fullName: student.fullName,
      email: student.email,
      mobile: student.mobile,
      className: student.className,
      school: student.school ?? "",
      city: student.city,
      state: student.state,
      guardianName: student.guardianName ?? "",
      guardianMobile: student.guardianMobile ?? "",
    });
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await adminService.updateStudent(editing.id, draft);
      students.reload();
      setEditing(null);
      toast.success("Student updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this student.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmStatusChange() {
    if (!statusTarget) return;
    try {
      if (statusTarget.status === "active") {
        await adminService.deactivateStudent(statusTarget.id);
        toast.success(`${statusTarget.fullName} deactivated`);
      } else {
        await adminService.reactivateStudent(statusTarget.id);
        toast.success(`${statusTarget.fullName} reactivated`);
      }
      students.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this student's status.");
    }
  }

  const paymentFor = (id: string) => payments.data?.find((p) => p.studentId === id);
  const credentialFor = (id: string) =>
    adminData.EXAM_CREDENTIALS.find((c) => c.studentId === id);
  const admitFor = (id: string) => adminData.ADMIT_CARDS.find((a) => a.studentId === id);
  const enrollmentFor = (id: string) =>
    enrollments.data?.find((e) => e.studentId === id && e.status === "active") ??
    enrollments.data?.find((e) => e.studentId === id);

  const filtered = students.data.filter((student) => {
    const payment = paymentFor(student.id);
    if (filters.course !== "all" && enrollmentFor(student.id)?.courseSlug !== filters.course) return false;
    if (filters.class !== "all" && student.className !== filters.class) return false;
    if (filters.payment !== "all" && payment?.status !== filters.payment) return false;
    if (filters.status !== "all" && student.status !== filters.status) return false;
    if (search) {
      const haystack = `${student.id} ${student.fullName} ${student.email} ${student.mobile} ${student.city}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<Student>[] = [
    {
      key: "id",
      header: "Student",
      primary: true,
      sortValue: (row) => row.fullName,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-navy-900">{row.fullName}</p>
            <p className="font-mono text-2xs text-ink-500">{row.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-xs text-ink-700">{row.email}</p>
          <p className="text-xs text-ink-500">{row.mobile}</p>
        </div>
      ),
    },
    {
      key: "className",
      header: "Class",
      sortValue: (row) => row.className,
      cell: (row) => <span className="text-ink-600">{row.className}</span>,
    },
    {
      key: "course",
      header: "Course",
      cell: (row) => {
        const course = COURSES.find((c) => c.slug === enrollmentFor(row.id)?.courseSlug);
        return <Badge tone="navy" size="sm">{course?.shortName ?? "—"}</Badge>;
      },
    },
    {
      key: "package",
      header: "Package",
      cell: (row) => {
        const pkg = packages.data?.find((p) => p.id === enrollmentFor(row.id)?.packageId);
        return <span className="text-xs text-ink-600">{pkg?.durationLabel ?? "—"}</span>;
      },
    },
    {
      key: "enrolledAt",
      header: "Enrolled",
      sortValue: (row) => row.enrolledAt,
      cell: (row) => <span className="text-xs text-ink-600">{formatDate(row.enrolledAt)}</span>,
    },
    {
      key: "payment",
      header: "Payment",
      cell: (row) => {
        const payment = paymentFor(row.id);
        return payment ? (
          <StatusBadge kind="payment" status={payment.status} size="sm" />
        ) : (
          <span className="text-xs text-ink-400">No order</span>
        );
      },
    },
    {
      key: "credential",
      header: "Credential",
      hideOnCard: true,
      cell: (row) => {
        const credential = credentialFor(row.id);
        return credential ? (
          <StatusBadge kind="credential" status={credential.status} size="sm" showIcon={false} />
        ) : (
          <span className="text-xs text-ink-400">—</span>
        );
      },
    },
    {
      key: "admit",
      header: "Admit card",
      hideOnCard: true,
      cell: (row) => {
        const admit = admitFor(row.id);
        return admit ? (
          <StatusBadge kind="admitCard" status={admit.status} size="sm" showIcon={false} />
        ) : (
          <span className="text-xs text-ink-400">—</span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      hideOnCard: true,
      cell: (row) => (
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.fullName}`}>
              <MoreHorizontal />
            </Button>
          </DropdownTrigger>
          <DropdownContent>
            <DropdownLabel>{row.id}</DropdownLabel>
            <DropdownSeparator />
            <DropdownItem onSelect={() => setDetail(row)}>
              <Eye />
              View student
            </DropdownItem>
            <DropdownItem onSelect={() => openEdit(row)}>
              <Pencil />
              Edit details
            </DropdownItem>
            <DropdownItem asChild>
              <Link to="/admin/purchases">
                <CreditCard />
                View payments
              </Link>
            </DropdownItem>
            <DropdownItem asChild>
              <Link to="/admin/exams">
                <CalendarClock />
                View exams
              </Link>
            </DropdownItem>
            <DropdownItem asChild>
              <Link to="/admin/exam-credentials">
                <KeyRound />
                Exam credentials
              </Link>
            </DropdownItem>
            <DropdownSeparator />
            {row.status === "active" ? (
              <DropdownItem destructive onSelect={() => setStatusTarget(row)}>
                <UserX />
                Deactivate student
              </DropdownItem>
            ) : (
              <DropdownItem onSelect={() => setStatusTarget(row)}>
                <UserCheck />
                Reactivate student
              </DropdownItem>
            )}
          </DropdownContent>
        </Dropdown>
      ),
    },
  ];

  function exportSelection() {
    const rows = (selected.length ? filtered.filter((s) => selected.includes(s.id)) : filtered).map(
      (student) => {
        const payment = paymentFor(student.id);
        const enrollment = enrollmentFor(student.id);
        const pkg = packages.data?.find((p) => p.id === enrollment?.packageId);
        return {
          "Student ID": student.id,
          "Student Name": student.fullName,
          Mobile: student.mobile,
          Email: student.email,
          Class: student.className,
          School: student.school,
          City: student.city,
          State: student.state,
          Course: COURSES.find((c) => c.slug === enrollment?.courseSlug)?.name ?? "",
          Package: pkg?.name ?? "",
          "Enrollment Date": student.enrolledAt,
          "Payment Status": payment?.status ?? "none",
          "Account Status": student.status,
        };
      },
    );
    exportRows(
      timestampedName("Nirvona_Students"),
      rows,
      Object.keys(rows[0] ?? {}).map((key) => ({ key, header: key })),
    );
    toast.success(`${rows.length} student records exported`);
  }

  const activeCount = students.data.filter((s) => s.status === "active").length;
  const paidCount = students.data.filter((s) => paymentFor(s.id)?.status === "successful").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Every registered student with enrolment, payment, credential and admit card status."
        actions={
          <>
            <Button variant="secondary" size="md" onClick={exportSelection}>
              <Download />
              Export {selected.length > 0 ? `(${selected.length})` : "all"}
            </Button>
            <Button asChild size="md">
              <Link to="/admin/purchases">
                <CreditCard />
                View purchases
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total students" numericValue={students.data.length} icon={Users} accent="navy" />
        <StatCard label="Active accounts" numericValue={activeCount} icon={UserCheck} accent="success" />
        <StatCard label="Paid enrolments" numericValue={paidCount} icon={GraduationCap} accent="ember" />
        <StatCard
          label="Admit cards issued"
          numericValue={adminData.ADMIT_CARDS.filter((a) => a.status !== "pending").length}
          icon={IdCard}
          accent="royal"
        />
      </div>

      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search by name, ID, email or city…"
        values={filters}
        resultCount={filtered.length}
        onChange={(id, value) => {
          setFilters((f) => ({ ...f, [id]: value }));
          setPage(1);
        }}
        onReset={() => {
          setFilters({ course: "all", class: "all", payment: "all", status: "all" });
          setSearch("");
        }}
        filters={[
          {
            id: "course",
            label: "Course",
            options: COURSES.map((c) => ({ label: c.shortName, value: c.slug })),
          },
          {
            id: "class",
            label: "Class",
            options: ["Class 11", "Class 12", "Dropper"].map((c) => ({ label: c, value: c })),
          },
          {
            id: "payment",
            label: "Payment",
            options: ["successful", "pending", "failed", "refunded"].map((c) => ({
              label: c,
              value: c,
            })),
          },
          {
            id: "status",
            label: "Status",
            options: ["active", "inactive", "suspended"].map((c) => ({ label: c, value: c })),
          },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students match these filters"
          description="Try broadening your search or clearing the filters."
          action={{
            label: "Clear filters",
            onClick: () => {
              setFilters({ course: "all", class: "all", payment: "all", status: "all" });
              setSearch("");
            },
          }}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={paged}
            rowKey={(row) => row.id}
            selectable
            selected={selected}
            onSelectedChange={setSelected}
            stickyFirst
            caption="Student records"
          />
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Student detail */}
      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent size="lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.fullName}</DialogTitle>
                <DialogDescription>
                  {detail.id} · registered {formatDate(detail.enrolledAt)}
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Email", value: detail.email },
                    { label: "Mobile", value: detail.mobile },
                    { label: "Date of birth", value: formatDate(detail.dateOfBirth) },
                    { label: "Class", value: detail.className },
                    { label: "School", value: detail.school },
                    { label: "City / State", value: `${detail.city}, ${detail.state}` },
                    { label: "Guardian", value: detail.guardianName ?? "—" },
                    { label: "Guardian mobile", value: detail.guardianMobile ?? "—" },
                  ].map((item) => (
                    <div key={item.label} className="min-w-0">
                      <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                        {item.label}
                      </dt>
                      <dd className="mt-0.5 break-words text-sm font-medium text-navy-900">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 rounded-xl border border-ink-200 bg-canvas p-4">
                  <h3 className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                    Latest order
                  </h3>
                  {(() => {
                    const payment = paymentFor(detail.id);
                    if (!payment) return <p className="mt-2 text-sm text-ink-500">No orders yet.</p>;
                    return (
                      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <span className="font-mono text-xs font-semibold text-navy-900">
                          {payment.id}
                        </span>
                        <span className="text-ink-600">{payment.packageName}</span>
                        <span className="tabular font-semibold text-navy-900">
                          {formatCurrency(payment.total)}
                        </span>
                        <StatusBadge kind="payment" status={payment.status} size="sm" />
                      </div>
                    );
                  })()}
                </div>
              </DialogBody>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setDetail(null)}>
                  Close
                </Button>
                <Button asChild variant="navy">
                  <Link to="/admin/purchases">View enrolment</Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent size="lg">
          {editing && (
            <form onSubmit={saveEdit}>
              <DialogHeader>
                <DialogTitle>Edit {editing.fullName}</DialogTitle>
                <DialogDescription>Changes apply immediately.</DialogDescription>
              </DialogHeader>
              <DialogBody className="grid gap-4 sm:grid-cols-2">
                {EDIT_FIELDS.map((field) => (
                  <Field key={field.key} label={field.label} htmlFor={`s-${field.key}`}>
                    <Input
                      id={`s-${field.key}`}
                      value={draft[field.key] ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, [field.key]: e.target.value }))}
                    />
                  </Field>
                ))}
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={
          statusTarget?.status === "active"
            ? `Deactivate ${statusTarget.fullName}?`
            : `Reactivate ${statusTarget?.fullName}?`
        }
        description={
          statusTarget?.status === "active"
            ? "The student loses access to their dashboard and drops off active rosters and leaderboards. Their payment, enrollment and result history is kept."
            : "The student regains access to their dashboard and reappears on active rosters and leaderboards."
        }
        confirmLabel={statusTarget?.status === "active" ? "Deactivate" : "Reactivate"}
        tone={statusTarget?.status === "active" ? "danger" : "default"}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
}
