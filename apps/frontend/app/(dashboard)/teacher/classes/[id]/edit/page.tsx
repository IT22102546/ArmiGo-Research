"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditClassPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = params;

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        onClick={() => router.push(`/teacher/classes/${id}`)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Class
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Class</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Class editing functionality coming soon.
          </p>
          <p className="text-sm text-muted-foreground mt-2">Class ID: {id}</p>
        </CardContent>
      </Card>
    </div>
  );
}
