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

interface TherapyType {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

export default function ScheduleTherapySessionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [therapyTypeId, setTherapyTypeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [maxPatients, setMaxPatients] = useState("10");

  const { data: therapyTypes } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/subjects");
      return Array.isArray(response)
        ? response
        : response?.subjects || response?.data || [];
    },
  });

  const { data: departments } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["grades"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/grades");
      return response?.grades || response?.data || response || [];
    },
  });

  const scheduleSessionMutation = useMutation({
    mutationFn: (data: any) => ApiClient.post("/classes", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Therapy session scheduled successfully",
        status: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      router.push("/teacher/classes");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to schedule session",
        status: "error",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scheduleSessionMutation.mutate({
      name,
      description,
      subjectId: therapyTypeId,
      gradeId: departmentId,
      maxStudents: parseInt(maxPatients),
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
        Back to Sessions
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Schedule New Therapy Session</CardTitle>
          <CardDescription>
            Create a new therapy session for your patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Session Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Physical Therapy - Monday Morning"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the therapy session"
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="therapyType">Therapy Type</Label>
                <Select
                  value={therapyTypeId}
                  onValueChange={setTherapyTypeId}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select therapy type" />
                  </SelectTrigger>
                  <SelectContent>
                    {therapyTypes
                      ?.filter((type) => type.id)
                      .map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={departmentId}
                  onValueChange={setDepartmentId}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments
                      ?.filter((dept) => dept.id)
                      .map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPatients">Maximum Patients</Label>
              <Input
                id="maxPatients"
                type="number"
                value={maxPatients}
                onChange={(e) => setMaxPatients(e.target.value)}
                min="1"
                max="50"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={scheduleSessionMutation.isPending}
              >
                {scheduleSessionMutation.isPending
                  ? "Scheduling..."
                  : "Schedule Session"}
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
