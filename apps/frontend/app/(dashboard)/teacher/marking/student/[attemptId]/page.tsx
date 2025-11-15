import StudentExamMarkingPage from "@/components/features/marking/StudentExamMarkingPage";

interface PageProps {
  params: {
    attemptId: string;
  };
}

export default function StudentMarkingPage({ params }: PageProps) {
  return <StudentExamMarkingPage attemptId={params.attemptId} />;
}
