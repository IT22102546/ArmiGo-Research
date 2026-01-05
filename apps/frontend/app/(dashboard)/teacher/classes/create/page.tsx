"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/lib/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ApiClient } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

interface Subject {
  id: string;
  name: string;
}

interface Grade {
  id: string;
  name: string;
}

export default function CreateClassPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [maxStudents, setMaxStudents] = useState("30");

  const { data: subjects } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/subjects");
      return Array.isArray(response)
        ? response
        : response?.subjects || response?.data || [];
    },
  });

  const { data: grades } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["grades"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/grades");
      return response?.grades || response?.data || response || [];
    },
  });

  const createClassMutation = useMutation({
    mutationFn: (data: any) => ApiClient.post("/classes", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class created successfully",
        status: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      router.push("/teacher/classes");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create class",
        status: "error",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClassMutation.mutate({
      name,
      description,
      subjectId,
      gradeId,
      maxStudents: parseInt(maxStudents),
    });
  };

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        onClick={() => router.push("/teacher/classes")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Classes
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New Class</CardTitle>
          <CardDescription>
            Set up a new class for your students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Grade 10 Mathematics A"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the class"
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={subjectId} onValueChange={setSubjectId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects
                      ?.filter((subject) => subject.id)
                      .map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select value={gradeId} onValueChange={setGradeId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades
                      ?.filter((grade) => grade.id)
                      .map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxStudents">Maximum Students</Label>
              <Input
                id="maxStudents"
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                min="1"
                max="100"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createClassMutation.isPending}>
                {createClassMutation.isPending ? "Creating..." : "Create Class"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/teacher/classes")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
