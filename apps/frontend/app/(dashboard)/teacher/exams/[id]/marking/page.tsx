import MarkingQueuePage from "@/components/features/marking/MarkingQueuePageNew";

interface PageProps {
  params: {
    id: string;
  };
}

export default function ExamMarkingPage({ params }: PageProps) {
  // Redirect to the main marking queue page
  // The MarkingQueuePageNew component handles exam selection internally
  return <MarkingQueuePage />;
}
