import { StudentDetailPage } from "@/components/features/users/StudentDetailPage";

interface PageProps {
  params: {
    id: string;
  };
}

export default function TeacherStudentDetailPage({ params }: PageProps) {
  const { id } = params;
  return <StudentDetailPage studentId={id} />;
}
