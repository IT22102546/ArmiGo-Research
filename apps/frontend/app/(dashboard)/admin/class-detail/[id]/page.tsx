import { ClassDetailPage } from "@/components/features/classes/ClassDetailPage";

interface Props {
  params: { id: string };
}

export default function ClassDetailRoute({ params }: Props) {
  const classId = params.id;
  return <ClassDetailPage classId={classId} />;
}
