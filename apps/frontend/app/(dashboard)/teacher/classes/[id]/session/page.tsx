import { ClassSessionsPage } from "@/components/features/classes/ClassSessionsPage";

interface PageProps {
  params: {
    id: string;
  };
}

export default function ClassSessionPage({ params }: PageProps) {
  const { id } = params;
  return <ClassSessionsPage classId={id} />;
}
