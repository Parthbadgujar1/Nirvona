import type { Metadata } from "next";
import { Suspense } from "react";
import { AnswerKeyView } from "@/components/student/answer-key-view";
import { LoadingState } from "@/components/shared/states";

export const metadata: Metadata = { title: "Answer Key" };

export default function StudentAnswerKeyPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading answer key" />}>
      <AnswerKeyView />
    </Suspense>
  );
}
