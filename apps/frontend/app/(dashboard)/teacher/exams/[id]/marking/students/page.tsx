import ExamStudentsListPage from "@/components/features/marking/ExamStudentsListPage";

interface PageProps {
  params: {
    id: string;
  };
}

export default function ExamStudentsPage({ params }: PageProps) {
  return <ExamStudentsListPage examId={params.id} />;
}
