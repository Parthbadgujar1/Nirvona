"use client";

import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { PackagesBrowser } from "@/components/public/packages-browser";
import { useCourses, usePackages } from "@/hooks/use-catalogue";

/**
 * "Browse packages" inside the student portal.
 *
 * Every "Add a program" / "Renew" / "Browse packages" link in the portal
 * used to point at the public /packages page - a different layout whose
 * navbar didn't know the visitor was signed in - which felt like being
 * logged out and sent back to the landing page. This renders the same
 * live catalogue inside the portal chrome instead; only the final
 * payment step (a self-contained checkout flow) leaves the portal.
 */
export function PackagesView() {
  const courses = useCourses();
  const packages = usePackages();

  if (courses.status === "error" || packages.status === "error") {
    return (
      <ErrorState
        onRetry={() => {
          courses.reload();
          packages.reload();
        }}
      />
    );
  }
  if (courses.status === "loading" || packages.status === "loading") {
    return <LoadingState label="Loading programs and packages" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Browse packages"
        description="Pick a program and a duration. Programs run independently — results, ranks and analytics stay separate for each."
        breadcrumbs={[
          { label: "Dashboard", href: "/student/dashboard" },
          { label: "My Programs", href: "/student/programs" },
          { label: "Browse packages" },
        ]}
        actions={
          <Button asChild variant="secondary" size="md">
            <Link to="/student/programs">
              <GraduationCap />
              My programs
            </Link>
          </Button>
        }
      />
      <PackagesBrowser embedded courses={courses.courses} packages={packages.packages} />
    </div>
  );
}
