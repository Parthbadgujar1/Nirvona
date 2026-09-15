import { Suspense } from "react";
import { AnswerKeyView } from "@/components/student/answer-key-view";
import { LoadingState } from "@/components/shared/states";
import { usePageTitle } from "@/hooks/use-page-title";

export default function StudentAnswerKeyPage() {
  usePageTitle("Answer Key");
  return (
    <Suspense fallback={<LoadingState label="Loading answer key" />}>
      <AnswerKeyView />
    </Suspense>
  );
}
