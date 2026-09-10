"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarClock, CreditCard, Download, Eye, GraduationCap, IdCard, KeyRound, MoreHorizontal,
  Pencil, Users, UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
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
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { adminService, adminData } from "@/services/admin.service";
import { COURSES } from "@/data/courses";
import { getPackage } from "@/data/packages";
import { formatDate, formatCurrency } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";
import type { Student } from "@/types";

const PAGE_SIZE = 10;

export function StudentsManager() {
  const students = useAsync(() => adminService.students(), []);
  const payments = useAsync(() => adminService.payments(), []);

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

  if (students.status === "error") return <ErrorState onRetry={students.reload} />;
  if (students.status === "loading" || !students.data) {
    return <LoadingState label="Loading student records" />;
  }

  const paymentFor = (id: string) => payments.data?.find((p) => p.studentId === id);
  const credentialFor = (id: string) =>
    adminData.EXAM_CREDENTIALS.find((c) => c.studentId === id);
  const admitFor = (id: string) => adminData.ADMIT_CARDS.find((a) => a.studentId === id);

  const filtered = students.data.filter((student) => {
    const payment = paymentFor(student.id);
    if (filters.course !== "all" && !student.examPreference.includes(filters.course as never)) return false;
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
        const course = COURSES.find((c) => c.slug === row.examPreference[0]);
        return <Badge tone="navy" size="sm">{course?.shortName ?? "—"}</Badge>;
      },
    },
    {
      key: "package",
      header: "Package",
      cell: (row) => {
        const pkg = getPackage(paymentFor(row.id)?.packageId ?? "");
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
            <DropdownItem onSelect={() => toast.info("Edit form would open here")}>
              <Pencil />
              Edit details
            </DropdownItem>
            <DropdownItem asChild>
              <Link href="/admin/purchases">
                <CreditCard />
                View payments
              </Link>
            </DropdownItem>
            <DropdownItem asChild>
              <Link href="/admin/exams">
                <CalendarClock />
                View exams
              </Link>
            </DropdownItem>
            <DropdownItem asChild>
              <Link href="/admin/exam-credentials">
                <KeyRound />
                Exam credentials
              </Link>
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      ),
    },
  ];

  function exportSelection() {
    const rows = (selected.length ? filtered.filter((s) => selected.includes(s.id)) : filtered).map(
      (student) => {
        const payment = paymentFor(student.id);
        const pkg = getPackage(payment?.packageId ?? "");
        return {
          "Student ID": student.id,
          "Student Name": student.fullName,
          Mobile: student.mobile,
          Email: student.email,
          Class: student.className,
          School: student.school,
          City: student.city,
          State: student.state,
          Course: COURSES.find((c) => c.slug === student.examPreference[0])?.name ?? "",
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
              <Link href="/admin/purchases">
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
                  <Link href="/admin/purchases">View enrolment</Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
