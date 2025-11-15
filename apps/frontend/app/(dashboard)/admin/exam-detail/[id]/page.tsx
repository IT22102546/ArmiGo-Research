"use client";

import { ExamDetailPage } from "@/components/features/exams/ExamDetailPage";

interface Props {
  params: { id: string };
}

export default function ExamDetailRoute({ params }: Props) {
  const examId = params.id;
  return <ExamDetailPage id={examId} />;
}
