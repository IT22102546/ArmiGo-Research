import { TeacherDetailPage } from "@/components/features/users/TeacherDetailPage";

interface Props {
  params: { id: string; tab: string };
}

export default function TeacherDetailTabRoute({ params }: Props) {
  const teacherId = params.id;
  const tab = params.tab;
  return <TeacherDetailPage teacherId={teacherId} initialTab={tab} />;
}
