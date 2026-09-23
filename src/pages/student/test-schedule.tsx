import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { TestScheduleTable } from "@/components/shared/test-schedule-table";
import { useAsync } from "@/hooks/use-async";
import { usePageTitle } from "@/hooks/use-page-title";
import { siteService } from "@/services/site.service";

export default function StudentTestSchedulePage() {
  usePageTitle("Test Schedule");
  const schedule = useAsync(() => siteService.myTestSchedule(), []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Test Schedule"
        description="The tests still to come for the plans you have purchased, with the chapters each one covers."
        breadcrumbs={[{ label: "Dashboard", href: "/student/dashboard" }, { label: "Test Schedule" }]}
      />

      {schedule.status === "loading" && <LoadingState label="Loading your schedule" />}
      {schedule.status === "error" && <ErrorState onRetry={schedule.reload} />}

      {schedule.data && schedule.data.length === 0 && (
        <EmptyState
          branded
          icon={CalendarDays}
          title="No test schedule yet"
          description="Your schedule appears here once you purchase a plan that has a published test calendar."
          action={{ label: "Browse packages", href: "/student/packages" }}
        />
      )}

      {schedule.data?.map((plan) => (
        <section key={plan.enrollmentId} className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-lg font-bold text-navy-900">{plan.packageName}</h2>
            <Badge tone="royal" size="md">
              {plan.tests.reduce((n, t) => n + t.testCount, 0)} tests to come
            </Badge>
          </div>
          {plan.tests.length === 0 ? (
            <p className="text-sm text-ink-500">All tests of this plan have been conducted.</p>
          ) : (
            <TestScheduleTable tests={plan.tests} />
          )}
        </section>
      ))}

      <p className="text-xs text-ink-500">
        Dates may be revised; your admit card is the final word on your test day and centre.{" "}
        <Link to="/student/support" className="font-semibold text-royal-700 hover:underline">Need help?</Link>
      </p>
    </div>
  );
}
