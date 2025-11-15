"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

interface JobInfo {
  id: string | number;
  name: string;
  data: any;
  progress: number;
  attempts: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  stacktrace?: string[];
  returnvalue?: any;
  queueName: string;
}

interface JobsStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface QueueStatus {
  name: string;
  paused: boolean;
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
}

export default function JobsMonitorPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("active");
  const [selectedJob, setSelectedJob] = useState<JobInfo | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh every 5 seconds when tab is active
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!document.hidden) {
        queryClient.invalidateQueries({ queryKey: ["jobs-stats"] });
        queryClient.invalidateQueries({ queryKey: ["jobs", activeTab] });
        queryClient.invalidateQueries({ queryKey: ["queues-status"] });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, activeTab, queryClient]);

  // Fetch jobs stats
  const { data: stats } = useQuery<JobsStats>({
    queryKey: ["jobs-stats"],
    queryFn: () => ApiClient.get("/system/jobs/stats"),
  });

  // Fetch queues status
  const { data: queuesStatus } = useQuery<QueueStatus[]>({
    queryKey: ["queues-status"],
    queryFn: () => ApiClient.get("/system/jobs/queues"),
  });

  // Fetch jobs by status
  const { data: jobs, isLoading } = useQuery<JobInfo[]>({
    queryKey: ["jobs", activeTab],
    queryFn: () =>
      ApiClient.get("/system/jobs", { params: { status: activeTab } }),
  });

  // Retry job mutation
  const retryJobMutation = useMutation({
    mutationFn: ({ queueName, jobId }: { queueName: string; jobId: string }) =>
      ApiClient.post(`/system/jobs/${queueName}/${jobId}/retry`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs-stats"] });
    },
  });

  // Retry all failed mutation
  const retryAllMutation = useMutation({
    mutationFn: () => ApiClient.post("/system/jobs/retry-all-failed"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs-stats"] });
    },
  });

  // Clean failed jobs mutation
  const cleanFailedMutation = useMutation({
    mutationFn: () => ApiClient.delete("/system/jobs/failed/clean"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs-stats"] });
    },
  });

  // Pause/Resume queue mutation
  const toggleQueueMutation = useMutation({
    mutationFn: ({
      queueName,
      pause,
    }: {
      queueName: string;
      pause: boolean;
    }) =>
      pause
        ? ApiClient.patch(`/system/jobs/queues/${queueName}/pause`)
        : ApiClient.patch(`/system/jobs/queues/${queueName}/resume`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queues-status"] });
    },
  });

  const viewJobDetails = async (job: JobInfo) => {
    const details = await ApiClient.get<JobInfo>(
      `/system/jobs/${job.queueName}/${job.id}`
    );
    setSelectedJob(details);
    setDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="gap-1 bg-blue-600">
            <Activity className="h-3 w-3" />
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge className="gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      case "delayed":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Delayed
          </Badge>
        );
      case "waiting":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Waiting
          </Badge>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Background Jobs Monitor
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage background job queues in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`}
            />
            {autoRefresh ? "Auto-Refresh On" : "Auto-Refresh Off"}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Waiting
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.waiting || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.active || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.completed || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Failed
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.failed || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Delayed
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.delayed || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Status Cards */}
      {queuesStatus && queuesStatus.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {queuesStatus.map((queue) => (
            <Card key={queue.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {queue.name} Queue
                </CardTitle>
                {queue.paused ? (
                  <PauseCircle className="h-4 w-4 text-gray-500" />
                ) : (
                  <PlayCircle className="h-4 w-4 text-green-500" />
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active:</span>
                  <span className="font-medium">{queue.counts.active}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Failed:</span>
                  <span className="font-medium text-red-600">
                    {queue.counts.failed}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() =>
                    toggleQueueMutation.mutate({
                      queueName: queue.name,
                      pause: !queue.paused,
                    })
                  }
                  disabled={toggleQueueMutation.isPending}
                >
                  {queue.paused ? "Resume" : "Pause"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Jobs Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="waiting">Waiting</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
              <TabsTrigger value="delayed">Delayed</TabsTrigger>
            </TabsList>

            {["active", "waiting", "completed", "failed", "delayed"].map(
              (status) => (
                <TabsContent key={status} value={status}>
                  <div className="space-y-4">
                    {status === "failed" && jobs && jobs.length > 0 && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => retryAllMutation.mutate()}
                          disabled={retryAllMutation.isPending}
                          className="gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Retry All Failed
                        </Button>
                        <Button
                          onClick={() => cleanFailedMutation.mutate()}
                          disabled={cleanFailedMutation.isPending}
                          variant="outline"
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Clean Failed Jobs
                        </Button>
                      </div>
                    )}

                    {isLoading ? (
                      <div className="text-center py-8 text-gray-500">
                        Loading...
                      </div>
                    ) : jobs && jobs.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Job ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Queue</TableHead>
                              <TableHead>Progress</TableHead>
                              <TableHead>Attempts</TableHead>
                              <TableHead>Timestamp</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {jobs.map((job) => (
                              <TableRow key={`${job.queueName}-${job.id}`}>
                                <TableCell className="font-mono text-xs">
                                  {job.id}
                                </TableCell>
                                <TableCell>{job.name}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {job.queueName}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-gray-200 rounded-full h-2 relative overflow-hidden">
                                      <div
                                        className="bg-blue-600 h-full rounded-full absolute top-0 left-0"
                                        data-progress={job.progress}
                                        style={{
                                          width: `${Math.min(100, Math.max(0, job.progress))}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-600">
                                      {job.progress}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {job.attempts}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {format(
                                    new Date(job.timestamp),
                                    "MMM dd, HH:mm:ss"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => viewJobDetails(job)}
                                    >
                                      View
                                    </Button>
                                    {status === "failed" && (
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          retryJobMutation.mutate({
                                            queueName: job.queueName,
                                            jobId: String(job.id),
                                          })
                                        }
                                        disabled={retryJobMutation.isPending}
                                      >
                                        Retry
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No {status} jobs found
                      </div>
                    )}
                  </div>
                </TabsContent>
              )
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Job Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
            <DialogDescription>
              Complete information about this background job
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Job ID</p>
                  <p className="mt-1 text-sm font-mono">{selectedJob.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Name</p>
                  <p className="mt-1 text-sm">{selectedJob.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Queue</p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {selectedJob.queueName}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Progress</p>
                  <p className="mt-1 text-sm">{selectedJob.progress}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Attempts</p>
                  <p className="mt-1 text-sm">{selectedJob.attempts}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Created</p>
                  <p className="mt-1 text-sm">
                    {format(new Date(selectedJob.timestamp), "PPpp")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Job Data
                </p>
                <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto max-h-40">
                  {JSON.stringify(selectedJob.data, null, 2)}
                </pre>
              </div>

              {selectedJob.failedReason && (
                <div>
                  <p className="text-sm font-medium text-red-600 mb-2">
                    Failure Reason
                  </p>
                  <p className="text-sm bg-red-50 p-3 rounded">
                    {selectedJob.failedReason}
                  </p>
                </div>
              )}

              {selectedJob.stacktrace && selectedJob.stacktrace.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Stack Trace
                  </p>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto max-h-60">
                    {selectedJob.stacktrace.join("\n")}
                  </pre>
                </div>
              )}

              {selectedJob.returnvalue && (
                <div>
                  <p className="text-sm font-medium text-green-600 mb-2">
                    Return Value
                  </p>
                  <pre className="text-xs bg-green-50 p-4 rounded overflow-x-auto max-h-40">
                    {JSON.stringify(selectedJob.returnvalue, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
