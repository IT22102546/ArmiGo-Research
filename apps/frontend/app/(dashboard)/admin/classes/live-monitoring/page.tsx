"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Video,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Eye,
  RefreshCw,
  Search,
  Signal,
  UserX,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  WifiOff,
  ExternalLink,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { format, formatDistanceToNow } from "date-fns";

interface LiveStudent {
  id: string;
  name: string;
  email: string;
  grade: string;
  cameraOn: boolean;
  micOn: boolean;
  tabSwitches: number;
  networkQuality: "excellent" | "good" | "poor" | "offline";
  joinedAt: string;
  lastSeen: string;
  flagged: boolean;
  flags: string[];
}

interface LiveClass {
  id: string;
  title: string;
  subject: string;
  grade: string;
  medium: string;
  teacher: {
    id: string;
    name: string;
  };
  startedAt: string;
  scheduledEndAt: string;
  duration: number; // minutes
  joinLink: string;
  status: "live" | "starting" | "ending";
  attendees: {
    total: number;
    present: number;
    cameraOff: number;
    micMuted: number;
    flagged: number;
  };
  students: LiveStudent[];
}

export default function LiveClassMonitoringPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<LiveClass | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch live classes
  const { data: liveClasses, isLoading } = useQuery({
    queryKey: ["live-classes", filterGrade],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterGrade !== "all") {
        params.append("grade", filterGrade);
      }

      const response = await ApiClient.get<LiveClass[]>(
        `/classes/live?${params}`
      );
      return response;
    },
    refetchInterval: autoRefresh ? 5000 : false, // Refresh every 5 seconds
  });

  const filteredClasses = liveClasses?.filter((cls) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      cls.title.toLowerCase().includes(query) ||
      cls.subject.toLowerCase().includes(query) ||
      cls.teacher.name.toLowerCase().includes(query)
    );
  });

  const totalAttendees =
    liveClasses?.reduce((acc, cls) => acc + cls.attendees.present, 0) || 0;
  const totalFlagged =
    liveClasses?.reduce((acc, cls) => acc + cls.attendees.flagged, 0) || 0;

  const getNetworkQualityBadge = (quality: string) => {
    const badges = {
      excellent: { color: "bg-green-500", label: "Excellent", icon: Signal },
      good: { color: "bg-blue-500", label: "Good", icon: Signal },
      poor: { color: "bg-orange-500", label: "Poor", icon: Signal },
      offline: { color: "bg-red-500", label: "Offline", icon: WifiOff },
    };
    const badge = badges[quality as keyof typeof badges] || badges.offline;
    const Icon = badge.icon;

    return (
      <Badge className={badge.color}>
        <Icon className="mr-1 h-3 w-3" />
        {badge.label}
      </Badge>
    );
  };

  const getDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">Live Class Monitoring</h1>
            <p className="text-muted-foreground">
              Monitor active classes and student engagement in real-time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`}
              />
              {autoRefresh ? "Auto-Refresh On" : "Auto-Refresh Off"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["live-classes"] })
              }
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Now
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Classes</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveClasses?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Attendees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalAttendees}
            </div>
            <p className="text-xs text-muted-foreground">Students online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Flagged Students
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalFlagged}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveClasses && liveClasses.length > 0
                ? Math.round(
                    liveClasses.reduce((acc, cls) => {
                      const start = new Date(cls.startedAt);
                      const now = new Date();
                      return acc + (now.getTime() - start.getTime()) / 60000;
                    }, 0) / liveClasses.length
                  ) + "m"
                : "0m"}
            </div>
            <p className="text-xs text-muted-foreground">Average class time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by class title, subject, or teacher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="10">Grade 10</SelectItem>
                <SelectItem value="11">Grade 11</SelectItem>
                <SelectItem value="12">Grade 12</SelectItem>
                <SelectItem value="13">Grade 13</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Live Classes Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredClasses && filteredClasses.length > 0 ? (
        <div className="grid gap-4">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="default"
                        className="bg-green-600 animate-pulse"
                      >
                        <Video className="mr-1 h-3 w-3" />
                        LIVE
                      </Badge>
                      <Badge variant="outline">{cls.grade} Grade</Badge>
                      <Badge variant="outline">{cls.medium}</Badge>
                    </div>
                    <h3 className="text-xl font-semibold mb-1">{cls.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {cls.subject} • {cls.teacher.name}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          Started{" "}
                          {formatDistanceToNow(new Date(cls.startedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Duration: {getDuration(cls.startedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={cls.joinLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Join Class
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Attendance Stats */}
                <div className="grid grid-cols-5 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-2xl font-bold text-blue-600">
                        {cls.attendees.present}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <VideoOff className="h-4 w-4 text-orange-600" />
                      <span className="text-2xl font-bold text-orange-600">
                        {cls.attendees.cameraOff}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Camera Off</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <MicOff className="h-4 w-4 text-gray-600" />
                      <span className="text-2xl font-bold text-gray-600">
                        {cls.attendees.micMuted}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Mic Muted</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Monitor className="h-4 w-4 text-purple-600" />
                      <span className="text-2xl font-bold text-purple-600">
                        {cls.students.reduce(
                          (acc, s) => acc + s.tabSwitches,
                          0
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tab Switches
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-2xl font-bold text-red-600">
                        {cls.attendees.flagged}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Flagged</p>
                  </div>
                </div>

                {/* Attendance Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      Attendance Rate
                    </span>
                    <span className="font-medium">
                      {cls.attendees.total > 0
                        ? Math.round(
                            (cls.attendees.present / cls.attendees.total) * 100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      cls.attendees.total > 0
                        ? (cls.attendees.present / cls.attendees.total) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-20 text-center">
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No Live Classes</p>
            <p className="text-sm text-muted-foreground">
              There are no active classes at the moment
            </p>
          </CardContent>
        </Card>
      )}

      {/* Class Details Dialog */}
      <Dialog
        open={!!selectedClass}
        onOpenChange={() => setSelectedClass(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedClass?.title}</DialogTitle>
            <DialogDescription>
              Detailed student engagement metrics for this live class
            </DialogDescription>
          </DialogHeader>

          {selectedClass && (
            <div className="space-y-6">
              {/* Class Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Teacher</p>
                  <p className="font-medium">{selectedClass.teacher.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="font-medium">{selectedClass.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Started</p>
                  <p className="font-medium">
                    {format(new Date(selectedClass.startedAt), "hh:mm a")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {getDuration(selectedClass.startedAt)}
                  </p>
                </div>
              </div>

              {/* Students Table */}
              <div>
                <h4 className="font-semibold mb-3">Student Engagement</h4>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">
                          Student
                        </th>
                        <th className="text-left p-3 text-sm font-medium">
                          Grade
                        </th>
                        <th className="text-center p-3 text-sm font-medium">
                          Camera
                        </th>
                        <th className="text-center p-3 text-sm font-medium">
                          Mic
                        </th>
                        <th className="text-center p-3 text-sm font-medium">
                          Tab Switches
                        </th>
                        <th className="text-left p-3 text-sm font-medium">
                          Network
                        </th>
                        <th className="text-left p-3 text-sm font-medium">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClass.students.map((student) => (
                        <tr
                          key={student.id}
                          className={`border-t ${student.flagged ? "bg-red-50 dark:bg-red-950/20" : ""}`}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {student.flagged && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {student.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{student.grade}</Badge>
                          </td>
                          <td className="p-3 text-center">
                            {student.cameraOn ? (
                              <Video className="h-4 w-4 text-green-500 inline" />
                            ) : (
                              <VideoOff className="h-4 w-4 text-orange-500 inline" />
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {student.micOn ? (
                              <Mic className="h-4 w-4 text-green-500 inline" />
                            ) : (
                              <MicOff className="h-4 w-4 text-gray-500 inline" />
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              variant={
                                student.tabSwitches > 5
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {student.tabSwitches}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {getNetworkQualityBadge(student.networkQuality)}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(student.joinedAt), {
                              addSuffix: true,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
