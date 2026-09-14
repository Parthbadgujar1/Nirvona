"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList, IdCard, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState, LoadingState, StaggerGroup, StaggerItem } from "@/components/shared/states";
import { StatCard } from "@/components/shared/stat-card";
import { ExamCard } from "./exam-card";
import { useAsync } from "@/hooks/use-async";
import { studentService } from "@/services/student.service";
import type { Exam } from "@/types";

const TODAY = new Date("2026-09-05");

export function StudentExams() {
  const exams = useAsync(() => studentService.exams(), []);
  const results = useAsync(() => studentService.results(), []);

  if (exams.status === "error") {
    return <ErrorState onRetry={exams.reload} />;
  }
  if (exams.status === "loading" || !exams.data) {
    return <LoadingState label="Loading your examinations" />;
  }

  const all = exams.data;
  const upcoming = all.filter((e) => new Date(e.date) >= TODAY);
  const completed = all.filter((e) => new Date(e.date) < TODAY);
  const published = completed.filter((e) => e.status === "result-published");
  const pending = completed.filter((e) => e.status !== "result-published");

  const resultFor = (exam: Exam) => results.data?.find((r) => r.examId === exam.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Exams"
        description="Every examination in your active programs, with admit card and result status."
        breadcrumbs={[{ label: "Dashboard", href: "/student/dashboard" }, { label: "My Exams" }]}
        actions={
          upcoming.length > 0 && (
            <Button asChild size="md">
              <Link href="/student/admit-card">
                <IdCard />
                View Admit Card
              </Link>
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total examinations" numericValue={all.length} icon={ClipboardList} accent="navy" />
        <StatCard label="Upcoming" numericValue={upcoming.length} icon={CalendarDays} accent="royal" />
        <StatCard label="Completed" numericValue={completed.length} icon={ClipboardList} accent="ember" />
        <StatCard label="Results published" numericValue={published.length} icon={Trophy} accent="success" />
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList variant="underline">
          <TabsTrigger variant="underline" value="upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger variant="underline" value="completed">
            Completed ({completed.length})
          </TabsTrigger>
          <TabsTrigger variant="underline" value="all">
            All ({all.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcoming.length === 0 ? (
            <EmptyState
              branded
              icon={CalendarDays}
              title="No upcoming exams"
              description="You have no scheduled examinations. New dates appear here as soon as the examination calendar is confirmed for your program."
              action={{ label: "View programs", href: "/student/programs" }}
            />
          ) : (
            <StaggerGroup className="grid gap-5 lg:grid-cols-2">
              {upcoming.map((exam) => (
                <StaggerItem key={exam.id}>
                  <ExamCard exam={exam} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completed.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No completed exams yet"
              description="Once you appear for your first Nirvona CBT it will be listed here with your result."
            />
          ) : (
            <>
              <StaggerGroup className="grid gap-5 lg:grid-cols-2">
                {completed.map((exam) => (
                  <StaggerItem key={exam.id}>
                    <ExamCard
                      exam={exam}
                      resultHref={resultFor(exam) ? `/student/results/${exam.id}` : undefined}
                    />
                  </StaggerItem>
                ))}
              </StaggerGroup>
              {pending.length > 0 && (
                <Card className="mt-5 p-5">
                  <p className="text-sm text-ink-600">
                    <span className="font-semibold text-navy-900">
                      {pending.length} result{pending.length === 1 ? "" : "s"} still processing.
                    </span>{" "}
                    Results are published within 72 hours of an examination. You will be notified by
                    email, WhatsApp and in your portal.
                  </p>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="all">
          <StaggerGroup className="grid gap-5 lg:grid-cols-2">
            {all.map((exam) => (
              <StaggerItem key={exam.id}>
                <ExamCard
                  exam={exam}
                  resultHref={resultFor(exam) ? `/student/results/${exam.id}` : undefined}
                />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </TabsContent>
      </Tabs>
    </div>
  );
}
