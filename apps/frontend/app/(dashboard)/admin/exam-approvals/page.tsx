"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Eye, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ExamApprovalsPage() {
  const queryClient = useQueryClient();

  const { data: pendingExamsData, isLoading } = useQuery({
    queryKey: ["pending-exams"],
    queryFn: async () => {
      const response = await ApiClient.request<any>("/exams", {
        params: { approvalStatus: "PENDING" },
      });
      return response;
    },
  });

  // Handle both array and object with data property responses
  const pendingExams = Array.isArray(pendingExamsData)
    ? pendingExamsData
    : pendingExamsData?.data || pendingExamsData?.exams || [];

  const approveMutation = useMutation({
    mutationFn: async (examId: string) => {
      return await ApiClient.request(`/exams/${examId}/approve`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-exams"] });
      toast.success("Exam approved");
    },
    onError: () => {
      toast.error("Failed to approve exam");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (examId: string) => {
      return await ApiClient.request(`/exams/${examId}/reject`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-exams"] });
      toast.success("Exam rejected");
    },
    onError: () => {
      toast.error("Failed to reject exam");
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Exam Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve pending exams
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Approvals
          </CardTitle>
          <CardDescription>Exams awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading pending exams...</div>
          ) : pendingExams && pendingExams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending exams to review
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingExams?.map((exam: any) => (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{exam.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {exam.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{exam.subject?.name}</TableCell>
                    <TableCell>{exam.grade?.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {exam.createdBy?.firstName} {exam.createdBy?.lastName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {exam.startTime &&
                        format(new Date(exam.startTime), "PPp")}
                    </TableCell>
                    <TableCell>{exam.duration} mins</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => approveMutation.mutate(exam.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => rejectMutation.mutate(exam.id)}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
