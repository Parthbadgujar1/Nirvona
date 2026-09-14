"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, Copy, Download, FileSpreadsheet, Info, KeyRound, RotateCcw,
  ShieldCheck, Upload, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import { ProgressBar, Steps } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FileUpload, type UploadedFile } from "@/components/shared/file-upload";
import { FilterBar } from "@/components/shared/filters";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { adminService, adminData } from "@/services/admin.service";
import { exportRows, timestampedName } from "@/lib/export";
import { maskSecret, formatNumber, formatDateTime } from "@/lib/format";
import type { ExamCredential, UploadValidationResult } from "@/types";
import { cn } from "@/lib/utils";

const UPLOAD_STEPS = [
  { label: "Select exam", description: "Choose the examination" },
  { label: "Download list", description: "Eligible candidates" },
  { label: "Upload workbook", description: "With credentials filled" },
  { label: "Validate & map", description: "Review and confirm" },
];

export function CredentialsManager() {
  const exams = useAsync(() => adminService.exams(), []);
  const credentials = useAsync(() => adminService.credentials("CBT-04"), []);

  const [examId, setExamId] = React.useState("CBT-04");
  const [file, setFile] = React.useState<UploadedFile | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [validation, setValidation] = React.useState<UploadValidationResult | null>(null);
  const [committing, setCommitting] = React.useState(false);
  const [committed, setCommitted] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({ status: "all" });
  const [revealAll, setRevealAll] = React.useState(false);

  if (exams.status === "error") return <ErrorState onRetry={exams.reload} />;
  if (exams.status === "loading" || !exams.data) return <LoadingState label="Loading examinations" />;

  const exam = exams.data.find((e) => e.id === examId) ?? exams.data[0];
  const rows = credentials.data ?? [];

  const filtered = rows.filter((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (search && !`${row.studentId} ${row.studentName} ${row.loginId}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const counts = {
    assigned: rows.filter((r) => r.status === "assigned").length,
    pending: rows.filter((r) => r.status === "pending").length,
    invalid: rows.filter((r) => r.status === "invalid").length,
    duplicate: rows.filter((r) => r.status === "duplicate").length,
  };

  const step = committed ? 4 : validation ? 3 : file ? 2 : 1;

  function downloadCandidateTemplate() {
    const template = rows.map((row) => ({
      "Student ID": row.studentId,
      "Student Name": row.studentName,
      Exam: exam.id,
      "Exam Login ID": "",
      "Exam Password": "",
    }));
    exportRows(
      timestampedName(`Nirvona_CandidateList_${exam.id}`),
      template,
      adminData.CREDENTIAL_TEMPLATE_COLUMNS.map((c) => ({ key: c.column, header: c.column })),
    );
    toast.success("Candidate workbook downloaded", {
      description: "Fill the Exam Login ID and Exam Password columns, then upload it back.",
    });
  }

  async function handleUpload(picked: UploadedFile) {
    setFile(picked);
    setValidation(null);
    setCommitted(false);
    setUploading(true);
    setProgress(0);

    for (let i = 1; i <= 10; i += 1) {
      await new Promise((r) => setTimeout(r, 80));
      setProgress(i * 10);
    }
    setUploading(false);

    const result = await adminService.validateCredentialUpload();
    setValidation(result);
    toast.info("Validation complete", {
      description: `${formatNumber(result.processed)} records processed. Review the results before mapping.`,
    });
  }

  async function commit() {
    setCommitting(true);
    await new Promise((r) => setTimeout(r, 1300));
    setCommitting(false);
    setCommitted(true);
    credentials.reload();
    toast.success("Credentials uploaded successfully", {
      description: `${formatNumber(validation?.successful ?? 0)} candidates updated.`,
    });
  }

  function resetUpload() {
    setFile(null);
    setValidation(null);
    setCommitted(false);
    setProgress(0);
  }

  const columns: Column<ExamCredential>[] = [
    {
      key: "studentName",
      header: "Candidate",
      primary: true,
      sortValue: (row) => row.studentName,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-900">{row.studentName}</p>
          <p className="font-mono text-2xs text-ink-500">{row.studentId}</p>
        </div>
      ),
    },
    {
      key: "examId",
      header: "Exam",
      cell: (row) => <span className="font-mono text-xs text-ink-600">{row.examId}</span>,
    },
    {
      key: "loginId",
      header: "Exam Login ID",
      sortValue: (row) => row.loginId,
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-navy-900">{row.loginId}</span>
      ),
    },
    {
      key: "password",
      header: "Exam Password",
      cell: (row) => (
        <span className="font-mono text-xs text-ink-600">
          {revealAll ? row.password : maskSecret(row.password, 4)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge kind="credential" status={row.status} size="sm" />,
    },
    {
      key: "assignedAt",
      header: "Assigned",
      hideOnCard: true,
      cell: (row) => (
        <span className="text-xs text-ink-500">
          {row.assignedAt ? formatDateTime(row.assignedAt) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Credentials"
        description="Issue and map examination-hall login credentials. These are separate from student portal logins."
        actions={
          <>
            <Button variant="secondary" size="md" onClick={downloadCandidateTemplate}>
              <Download />
              Download Candidate Excel
            </Button>
            <Button asChild size="md">
              <a href="#upload">
                <Upload />
                Upload Credentials Excel
              </a>
            </Button>
          </>
        }
      />

      <Alert tone="warning" title="Credential handling policy">
        Examination credentials never share a namespace with portal accounts and are valid only on
        the centre machine for a single examination. Passwords are masked by default in this table —
        reveal only when you must verify a specific record, and never export them to a shared drive.
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Assigned"
          numericValue={counts.assigned}
          icon={CheckCircle2}
          accent="success"
          hint={`of ${rows.length} in this sample`}
        />
        <StatCard label="Pending" numericValue={counts.pending} icon={KeyRound} accent="ember" />
        <StatCard label="Invalid" numericValue={counts.invalid} icon={XCircle} accent="danger" />
        <StatCard label="Duplicate" numericValue={counts.duplicate} icon={Copy} accent="saffron" />
      </div>

      <Tabs defaultValue="upload">
        <TabsList variant="underline">
          <TabsTrigger variant="underline" value="upload">
            Upload workflow
          </TabsTrigger>
          <TabsTrigger variant="underline" value="assigned">
            Assigned credentials ({rows.length})
          </TabsTrigger>
          <TabsTrigger variant="underline" value="format">
            Expected file format
          </TabsTrigger>
        </TabsList>

        {/* ------------------------- Upload workflow ------------------------ */}
        <TabsContent value="upload">
          <div id="upload" className="space-y-6 scroll-mt-24">
            <Card className="p-5 sm:p-6">
              <Steps steps={UPLOAD_STEPS} current={step - 1} />
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
              {/* Step 1 & 2 */}
              <Card className="p-5 sm:p-6">
                <h2 className="font-display text-base font-semibold text-navy-900">
                  1 · Select the examination
                </h2>
                <p className="mt-1 text-sm text-ink-500">
                  Credentials are issued per examination. Selecting an exam scopes the candidate
                  list and the validation.
                </p>
                <div className="mt-4">
                  <label htmlFor="cred-exam" className="sr-only">
                    Examination
                  </label>
                  <Select id="cred-exam" value={exam.id} onChange={(e) => setExamId(e.target.value)}>
                    {exams.data.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.id} — {item.name.split("· ")[1] ?? item.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-canvas p-4 text-sm">
                  <div>
                    <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                      Eligible candidates
                    </dt>
                    <dd className="mt-0.5 font-display text-lg font-bold tabular text-navy-900">
                      {formatNumber(exam.candidates)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                      Already assigned
                    </dt>
                    <dd className="mt-0.5 font-display text-lg font-bold tabular text-navy-900">
                      {formatNumber(exam.credentialsAssigned)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 border-t border-ink-100 pt-5">
                  <h2 className="font-display text-base font-semibold text-navy-900">
                    2 · Download the candidate list
                  </h2>
                  <p className="mt-1 text-sm text-ink-500">
                    The workbook is pre-filled with student IDs and names. Add the login ID and
                    password columns, then upload it back.
                  </p>
                  <Button variant="navy" size="md" className="mt-4" onClick={downloadCandidateTemplate}>
                    <FileSpreadsheet />
                    Download Candidate Excel
                  </Button>
                </div>
              </Card>

              {/* Step 3 */}
              <Card className="p-5 sm:p-6">
                <h2 className="font-display text-base font-semibold text-navy-900">
                  3 · Upload the completed workbook
                </h2>
                <p className="mt-1 text-sm text-ink-500">
                  Drag the file in, or browse. Nothing is written until you confirm the mapping in
                  step 4.
                </p>

                <div className="mt-4">
                  <FileUpload
                    file={file}
                    uploading={uploading}
                    progress={progress}
                    onFileSelected={handleUpload}
                    onClear={resetUpload}
                    label="Drag and drop your credentials workbook"
                    hint="XLSX, XLS or CSV · maximum 10 MB · one row per candidate"
                  />
                </div>

                <AnimatePresence>
                  {validation && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-5"
                    >
                      <h3 className="font-display text-sm font-semibold text-navy-900">
                        Validation results
                      </h3>
                      <p className="mt-1 text-sm text-ink-500">
                        {formatNumber(validation.processed)} records processed
                      </p>

                      <div className="mt-3">
                        <ProgressBar
                          value={(validation.successful / validation.processed) * 100}
                          tone="success"
                          label="Valid records"
                        />
                      </div>

                      <ul className="mt-4 grid grid-cols-2 gap-3">
                        {[
                          { label: "Successful", value: validation.successful, tone: "text-success-600", Icon: CheckCircle2 },
                          { label: "Duplicate", value: validation.duplicate, tone: "text-ember-600", Icon: Copy },
                          { label: "Invalid", value: validation.invalid, tone: "text-danger-600", Icon: XCircle },
                          { label: "Missing student ID", value: validation.missingStudentId, tone: "text-warning-600", Icon: AlertTriangle },
                        ].map(({ label, value, tone, Icon }) => (
                          <li key={label} className="rounded-xl border border-ink-200 p-3">
                            <div className="flex items-center gap-1.5">
                              <Icon className={cn("size-3.5", tone)} aria-hidden />
                              <span className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                                {label}
                              </span>
                            </div>
                            <p className={cn("mt-1 font-display text-xl font-bold tabular", tone)}>
                              {formatNumber(value)}
                            </p>
                          </li>
                        ))}
                      </ul>

                      {validation.rows.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                            Rows needing attention
                          </h4>
                          <ul className="mt-2 space-y-2">
                            {validation.rows.map((row) => (
                              <li
                                key={row.row}
                                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-ink-200 bg-canvas p-3 text-xs"
                              >
                                <Badge tone="neutral" size="sm">
                                  Row {row.row}
                                </Badge>
                                <span className="font-mono text-ink-600">
                                  {row.studentId || "—"}
                                </span>
                                <span className="text-ink-600">{row.studentName}</span>
                                <StatusBadge kind="credential" status={row.status} size="sm" />
                                <span className="w-full text-ink-500 sm:w-auto sm:flex-1">
                                  {row.message}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {committed ? (
                        <Alert tone="success" className="mt-5" title="Credentials uploaded successfully">
                          {formatNumber(validation.successful)} candidates updated. Credentials are
                          now available on their admit cards.
                        </Alert>
                      ) : (
                        <div className="mt-5 flex flex-wrap gap-2">
                          <Button onClick={() => setConfirmOpen(true)} loading={committing}>
                            <ShieldCheck />
                            Map {formatNumber(validation.successful)} credentials
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              exportRows(
                                timestampedName(`Nirvona_CredentialErrors_${exam.id}`),
                                validation.rows as unknown as Record<string, unknown>[],
                                [
                                  { key: "row", header: "Row" },
                                  { key: "studentId", header: "Student ID" },
                                  { key: "studentName", header: "Student Name" },
                                  { key: "loginId", header: "Exam Login ID" },
                                  { key: "status", header: "Status" },
                                  { key: "message", header: "Message" },
                                ],
                              );
                              toast.success("Error report downloaded");
                            }}
                          >
                            <Download />
                            Download error report
                          </Button>
                          <Button variant="ghost" onClick={resetUpload}>
                            <RotateCcw />
                            Start over
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ------------------------ Assigned credentials -------------------- */}
        <TabsContent value="assigned">
          <div className="space-y-6">
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search candidate, student ID or login ID…"
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
                  options: ["assigned", "pending", "invalid", "duplicate"].map((s) => ({
                    label: s,
                    value: s,
                  })),
                },
              ]}
            >
              <Button
                variant={revealAll ? "danger" : "secondary"}
                size="sm"
                onClick={() => {
                  setRevealAll((r) => !r);
                  if (!revealAll) toast.warning("Passwords revealed — do not share this screen");
                }}
              >
                {revealAll ? "Hide passwords" : "Reveal passwords"}
              </Button>
            </FilterBar>

            {credentials.status === "loading" ? (
              <LoadingState label="Loading credentials" />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={KeyRound}
                title="Credentials not assigned yet"
                description="Upload a credentials workbook to map examination logins to candidates."
                action={{ label: "Download candidate list", onClick: downloadCandidateTemplate }}
              />
            ) : (
              <DataTable
                columns={columns}
                rows={filtered}
                rowKey={(row) => `${row.examId}-${row.studentId}`}
                caption="Assigned exam credentials"
              />
            )}

            <p className="flex items-start gap-2 text-xs text-ink-400">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              All credentials shown are non-functional demo values generated for this prototype.
            </p>
          </div>
        </TabsContent>

        {/* --------------------------- File format -------------------------- */}
        <TabsContent value="format">
          <Card className="overflow-hidden">
            <div className="border-b border-ink-100 p-5">
              <h2 className="font-display text-base font-semibold text-navy-900">
                Expected workbook structure
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                The first sheet must contain exactly these columns, in any order, with a header row.
              </p>
            </div>
            <div className="nv-scroll overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50/80 text-left">
                    {["Column", "Required", "Example", "Notes"].map((h) => (
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
                  {adminData.CREDENTIAL_TEMPLATE_COLUMNS.map((column) => (
                    <tr key={column.column}>
                      <th scope="row" className="px-5 py-3.5 text-left font-mono text-xs font-semibold text-navy-900">
                        {column.column}
                      </th>
                      <td className="px-5 py-3.5">
                        <Badge tone={column.required ? "danger" : "neutral"} size="sm">
                          {column.required ? "Required" : "Optional"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-ink-600">{column.example}</td>
                      <td className="px-5 py-3.5 text-ink-600">{column.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-ink-100 bg-canvas p-5">
              <h3 className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                Validation rules applied on upload
              </h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  "Student ID must exist in the selected exam's candidate list",
                  "Exam login ID must be unique across the examination",
                  "Login IDs may contain letters, digits and hyphens only",
                  "Passwords must be 8–16 characters and must not match a portal password",
                  "Rows with a blank student ID or password are rejected",
                  "Duplicate rows within the file are flagged, not silently merged",
                ].map((rule) => (
                  <li key={rule} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success-600" aria-hidden />
                    <span className="text-sm leading-relaxed text-ink-600">{rule}</span>
                  </li>
                ))}
              </ul>
              <Button variant="secondary" size="sm" className="mt-5" onClick={downloadCandidateTemplate}>
                <Download />
                Download blank template
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Map credentials to candidates?"
        description="This writes examination login credentials to every valid candidate record and makes them visible on admit cards. Invalid and duplicate rows are skipped."
        confirmLabel="Confirm mapping"
        onConfirm={commit}
        details={
          validation && (
            <div className="rounded-xl border border-ink-200 bg-canvas p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500">Will be mapped</span>
                <span className="font-semibold tabular text-success-600">
                  {formatNumber(validation.successful)}
                </span>
              </div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-ink-500">Will be skipped</span>
                <span className="font-semibold tabular text-danger-600">
                  {formatNumber(
                    validation.duplicate + validation.invalid + validation.missingStudentId,
                  )}
                </span>
              </div>
              <div className="mt-1.5 flex justify-between border-t border-ink-200 pt-1.5">
                <span className="text-ink-500">Examination</span>
                <span className="font-semibold text-navy-900">{exam.id}</span>
              </div>
            </div>
          )
        }
      />
    </div>
  );
}
