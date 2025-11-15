"use client";

import { StudentDetailPage } from "@/components/features/users";

export default function StudentPage({ params }: { params: { id: string } }) {
  return <StudentDetailPage studentId={params.id} />;
}
