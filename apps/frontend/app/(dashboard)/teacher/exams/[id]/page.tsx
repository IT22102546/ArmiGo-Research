import { ExamDetailPage } from "@/components/features/exams/ExamDetailPage";

interface PageProps {
  params: {
    id: string;
  };
}

export default function TeacherExamDetailPage({ params }: PageProps) {
  const { id } = params;
  return <ExamDetailPage id={id} />;
}
