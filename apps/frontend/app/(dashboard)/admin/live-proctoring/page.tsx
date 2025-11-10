"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Video, Eye, AlertTriangle } from "lucide-react";
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
import { format } from "date-fns";

export default function LiveProctoringPage() {
  const { data: liveExams, isLoading } = useQuery({
    queryKey: ["live-exams"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/exams/live");
      return Array.isArray(response) ? response : [];
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Live Exam Proctoring</h1>
          <p className="text-muted-foreground">
            Monitor ongoing exams in real-time
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading live exams...</div>
          ) : liveExams && liveExams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No exams currently in progress
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Alerts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveExams?.map((exam: any) => (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{exam.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {exam.subject?.name} - {exam.grade?.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{exam._count?.attempts || 0}</TableCell>
                    <TableCell>
                      {exam.startTime && format(new Date(exam.startTime), "p")}
                    </TableCell>
                    <TableCell>{exam.duration} mins</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {exam.alertCount > 0 && (
                          <>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="text-red-600 font-medium">
                              {exam.alertCount}
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge>In Progress</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Monitor
                      </Button>
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
