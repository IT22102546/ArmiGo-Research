import { TeacherDetailPage } from "@/components/features/users/TeacherDetailPage";

interface Props {
  params: { id: string };
}

export default function TeacherDetails({ params }: Props) {
  const teacherId = params.id;

  return <TeacherDetailPage teacherId={teacherId} initialTab="profile" />;
}
