"use client";

import SubjectManagement from "@/components/features/academic/SubjectManagement";

export default function SubjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subject Management</h1>
        <p className="text-muted-foreground">
          Manage subjects, categories, and course offerings
        </p>
      </div>
      <SubjectManagement />
    </div>
  );
}
