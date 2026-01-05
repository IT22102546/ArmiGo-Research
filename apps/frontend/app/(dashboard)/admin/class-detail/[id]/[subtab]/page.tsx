import { ClassDetailPage } from "@/components/features/classes/ClassDetailPage";

interface Props {
  params: { id: string; subtab: string };
}

export default function ClassDetailSubtabRoute({ params }: Props) {
  const { id } = params;
  return <ClassDetailPage classId={id} />;
}
