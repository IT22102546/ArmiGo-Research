"use client";

import React, { useState, useEffect } from "react";
import { asApiError } from "@/lib/error-handling";
import { getDisplayName } from "@/lib/utils/display";
import { ApiClient } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar as CalendarIcon,
  Users,
  UserCheck,
  UserX,
  Clock,
  Download,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  patientId: string;
  diagnosis?: string;
}

interface ParticipationRecord {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  notes?: string;
  markedAt: string;
  patient: Patient;
}

interface TherapySession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  therapyType: string | { id: string; name: string; code?: string };
  sessionName: string;
  totalPatients: number;
  presentPatients: number;
  absentPatients: number;
  latePatients: number;
  participationRate: number;
  isActive: boolean;
}

interface ParticipationStats {
  totalSessions: number;
  averageParticipation: number;
  presentPatients: number;
  absentPatients: number;
  latePatients: number;
  excusedPatients: number;
  sessionsWithLowParticipation: number;
}

const statusConfig = {
  PRESENT: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-100",
    label: "Present",
  },
  ABSENT: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-100",
    label: "Absent",
  },
  LATE: {
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    label: "Late",
  },
  EXCUSED: {
    icon: AlertCircle,
    color: "text-blue-600",
    bg: "bg-blue-100",
    label: "Excused",
  },
};

// Dummy data for patients
const dummyPatients: Patient[] = [
  {
    id: "1",
    firstName: "Michael",
    lastName: "Johnson",
    email: "michael.j@hospital.com",
    patientId: "PT-2024-001",
    diagnosis: "Post-stroke rehabilitation",
  },
  {
    id: "2",
    firstName: "Sarah",
    lastName: "Williams",
    email: "sarah.w@hospital.com",
    patientId: "PT-2024-002",
    diagnosis: "Sports injury recovery",
  },
  {
    id: "3",
    firstName: "David",
    lastName: "Brown",
    email: "david.b@hospital.com",
    patientId: "PT-2024-003",
    diagnosis: "Spinal cord injury",
  },
  {
    id: "4",
    firstName: "Emily",
    lastName: "Davis",
    email: "emily.d@hospital.com",
    patientId: "PT-2024-004",
    diagnosis: "Pediatric cerebral palsy",
  },
  {
    id: "5",
    firstName: "James",
    lastName: "Martinez",
    email: "james.m@hospital.com",
    patientId: "PT-2024-005",
    diagnosis: "Orthopedic surgery recovery",
  },
  {
    id: "6",
    firstName: "Lisa",
    lastName: "Garcia",
    email: "lisa.g@hospital.com",
    patientId: "PT-2024-006",
    diagnosis: "Traumatic brain injury",
  },
  {
    id: "7",
    firstName: "Robert",
    lastName: "Rodriguez",
    email: "robert.r@hospital.com",
    patientId: "PT-2024-007",
    diagnosis: "Multiple sclerosis",
  },
  {
    id: "8",
    firstName: "Maria",
    lastName: "Lopez",
    email: "maria.l@hospital.com",
    patientId: "PT-2024-008",
    diagnosis: "Arthritis management",
  },
];

const dummyParticipationRecords: ParticipationRecord[] = [
  {
    id: "r1",
    date: new Date().toISOString(),
    status: "PRESENT",
    notes: "Excellent progress today",
    markedAt: new Date().toISOString(),
    patient: dummyPatients[0],
  },
  {
    id: "r2",
    date: new Date().toISOString(),
    status: "PRESENT",
    notes: "Completed all exercises",
    markedAt: new Date().toISOString(),
    patient: dummyPatients[1],
  },
  {
    id: "r3",
    date: new Date().toISOString(),
    status: "LATE",
    notes: "Arrived 15 minutes late",
    markedAt: new Date().toISOString(),
    patient: dummyPatients[2],
  },
  {
    id: "r4",
    date: new Date().toISOString(),
    status: "PRESENT",
    notes: "Good engagement",
    markedAt: new Date().toISOString(),
    patient: dummyPatients[3],
  },
  {
    id: "r5",
    date: new Date().toISOString(),
    status: "EXCUSED",
    notes: "Medical appointment conflict",
    markedAt: new Date().toISOString(),
    patient: dummyPatients[4],
  },
  {
    id: "r6",
    date: new Date().toISOString(),
    status: "PRESENT",
    notes: "Showing improvement",
    markedAt: new Date().toISOString(),
    patient: dummyPatients[5],
  },
  {
    id: "r7",
    date: new Date().toISOString(),
    status: "ABSENT",
    notes: "No show",
    markedAt: new Date().toISOString(),
    patient: dummyPatients[6],
  },
  {
    id: "r8",
    date: new Date().toISOString(),
    status: "PRESENT",
    notes: "Participated actively",
    markedAt: new Date().toISOString(),
    patient: dummyPatients[7],
  },
];

const dummyTherapySessions: TherapySession[] = [
  {
    id: "s1",
    date: new Date().toISOString(),
    startTime: "09:00 AM",
    endTime: "10:00 AM",
    therapyType: { id: "t1", name: "Physical Therapy" },
    sessionName: "Morning PT Group",
    totalPatients: 8,
    presentPatients: 6,
    absentPatients: 1,
    latePatients: 1,
    participationRate: 87.5,
    isActive: true,
  },
  {
    id: "s2",
    date: new Date().toISOString(),
    startTime: "10:30 AM",
    endTime: "11:30 AM",
    therapyType: { id: "t2", name: "Occupational Therapy" },
    sessionName: "OT Skills Development",
    totalPatients: 6,
    presentPatients: 5,
    absentPatients: 1,
    latePatients: 0,
    participationRate: 83.3,
    isActive: false,
  },
  {
    id: "s3",
    date: new Date().toISOString(),
    startTime: "02:00 PM",
    endTime: "03:00 PM",
    therapyType: { id: "t3", name: "Speech Therapy" },
    sessionName: "Speech & Language",
    totalPatients: 5,
    presentPatients: 5,
    absentPatients: 0,
    latePatients: 0,
    participationRate: 100,
    isActive: false,
  },
];

const dummyStats: ParticipationStats = {
  totalSessions: 3,
  averageParticipation: 90.3,
  presentPatients: 6,
  absentPatients: 1,
  latePatients: 1,
  excusedPatients: 1,
  sessionsWithLowParticipation: 0,
};

export default function PatientParticipationTracking() {
  const [patients, setPatients] = useState<Patient[]>(dummyPatients);
  const [participationRecords, setParticipationRecords] = useState<
    ParticipationRecord[]
  >(dummyParticipationRecords);
  const [therapySessions, setTherapySessions] =
    useState<TherapySession[]>(dummyTherapySessions);
  const [stats, setStats] = useState<ParticipationStats | null>(dummyStats);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [bulkParticipationDialog, setBulkParticipationDialog] = useState(false);
  const [newSessionDialog, setNewSessionDialog] = useState(false);
  const [markingParticipation, setMarkingParticipation] = useState(false);

  const [participationForm, setParticipationForm] = useState<
    Record<
      string,
      {
        status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
        notes: string;
      }
    >
  >({});

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    dateRange: "today",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedSession, filters]);

  const fetchData = async () => {
    // Using dummy data - no API calls needed
    try {
      setLoading(true);

      // Initialize participation form with dummy data
      const initialForm: Record<
        string,
        { status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"; notes: string }
      > = {};
      dummyPatients.forEach((patient) => {
        const existingRecord = dummyParticipationRecords.find(
          (record) => record.patient.id === patient.id
        );
        initialForm[patient.id] = {
          status: existingRecord?.status || "PRESENT",
          notes: existingRecord?.notes || "",
        };
      });
      setParticipationForm(initialForm);

      setLoading(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load participation data",
        status: "error",
      });
      setLoading(false);
    }
  };

  const handleMarkParticipation = async (
    patientId: string,
    status: string,
    notes?: string
  ) => {
    try {
      // Simulate API call with dummy data
      toast({
        title: "Success",
        description: "Patient participation marked successfully",
        status: "success",
      });

      // Update local state
      const updatedRecords = participationRecords.map((record) =>
        record.patient.id === patientId
          ? {
              ...record,
              status: status as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
              notes: notes || "",
            }
          : record
      );
      setParticipationRecords(updatedRecords);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark participation",
        status: "error",
      });
    }
  };

  const handleBulkParticipation = async () => {
    try {
      setMarkingParticipation(true);

      // Simulate API call with dummy data
      toast({
        title: "Success",
        description: "Bulk participation marked successfully",
        status: "success",
      });
      setBulkParticipationDialog(false);
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark bulk participation",
        status: "error",
      });
    } finally {
      setMarkingParticipation(false);
    }
  };

  const handleExportParticipation = async () => {
    try {
      toast({
        title: "Success",
        description: "Participation report exported successfully",
        status: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export participation report",
        status: "error",
      });
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
  }) => (
    <Card>
      <CardContent className="flex items-center p-6">
        <div className={`p-2 rounded-lg ${color} mr-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            Loading patient participation data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient Participation Tracking</h1>
          <p className="text-gray-600 mt-2">
            Monitor and record patient participation in therapy sessions
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportParticipation}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Dialog
            open={bulkParticipationDialog}
            onOpenChange={setBulkParticipationDialog}
          >
            <DialogTrigger asChild>
              <Button>
                <Users className="mr-2 h-4 w-4" />
                Record Participation
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Therapy Session</Label>
              <Select
                value={selectedSession}
                onValueChange={setSelectedSession}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  <SelectItem value="s1">Morning PT Group</SelectItem>
                  <SelectItem value="s2">OT Skills Development</SelectItem>
                  <SelectItem value="s3">Speech & Language</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status Filter</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="EXCUSED">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Search Patients</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or patient ID..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Average Participation"
            value={`${stats.averageParticipation.toFixed(1)}%`}
            icon={BarChart3}
            color="bg-blue-600"
          />
          <StatCard
            title="Present Today"
            value={stats.presentPatients}
            icon={UserCheck}
            color="bg-green-600"
          />
          <StatCard
            title="Absent Today"
            value={stats.absentPatients}
            icon={UserX}
            color="bg-red-600"
          />
          <StatCard
            title="Total Sessions"
            value={stats.totalSessions}
            icon={CalendarIcon}
            color="bg-purple-600"
          />
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="patients" className="w-full">
        <TabsList>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="sessions">Therapy Sessions</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        {/* Patients Tab */}
        <TabsContent value="patients">
          <Card>
            <CardHeader>
              <CardTitle>Patient Participation</CardTitle>
              <CardDescription>
                {format(selectedDate, "MMMM d, yyyy")} participation records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Recorded At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => {
                    const record = participationRecords.find(
                      (r) => r.patient.id === patient.id
                    );
                    const statusInfo = statusConfig[record?.status || "ABSENT"];
                    const StatusIcon = statusInfo.icon;

                    return (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">
                          {patient.firstName} {patient.lastName}
                        </TableCell>
                        <TableCell>{patient.patientId}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {patient.diagnosis || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${statusInfo.color} ${statusInfo.bg}`}
                          >
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{record?.notes || "-"}</TableCell>
                        <TableCell>
                          {record?.markedAt
                            ? format(new Date(record.markedAt), "HH:mm")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={record?.status || ""}
                            onValueChange={(value) =>
                              handleMarkParticipation(patient.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Record" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PRESENT">Present</SelectItem>
                              <SelectItem value="ABSENT">Absent</SelectItem>
                              <SelectItem value="LATE">Late</SelectItem>
                              <SelectItem value="EXCUSED">Excused</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Therapy Sessions</CardTitle>
              <CardDescription>
                Overview of therapy sessions and participation rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Therapy Type</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Participation</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {therapySessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        {format(new Date(session.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {session.sessionName}
                      </TableCell>
                      <TableCell>
                        {getDisplayName(session.therapyType)}
                      </TableCell>
                      <TableCell>
                        {session.startTime} - {session.endTime}
                      </TableCell>
                      <TableCell>
                        {session.presentPatients}/{session.totalPatients}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            session.participationRate >= 90
                              ? "text-green-600 font-medium"
                              : session.participationRate >= 75
                                ? "text-yellow-600 font-medium"
                                : "text-red-600 font-medium"
                          }
                        >
                          {session.participationRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={session.isActive ? "default" : "secondary"}
                        >
                          {session.isActive ? "Active" : "Completed"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>
                Select dates to view attendance records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Participation for {format(selectedDate, "MMMM d, yyyy")}
                  </h3>
                  {stats && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-green-800">Present Patients</span>
                        <span className="font-semibold text-green-900">
                          {stats.presentPatients}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <span className="text-red-800">Absent Patients</span>
                        <span className="font-semibold text-red-900">
                          {stats.absentPatients}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <span className="text-yellow-800">Late Patients</span>
                        <span className="font-semibold text-yellow-900">
                          {stats.latePatients}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-800">Excused Patients</span>
                        <span className="font-semibold text-blue-900">
                          {stats.excusedPatients}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Participation Dialog */}
      <Dialog
        open={bulkParticipationDialog}
        onOpenChange={setBulkParticipationDialog}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Record Bulk Participation</DialogTitle>
            <DialogDescription>
              Record participation for all patients for{" "}
              {format(selectedDate, "MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      {patient.firstName} {patient.lastName}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {patient.patientId}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={
                          participationForm[patient.id]?.status || "PRESENT"
                        }
                        onValueChange={(
                          value: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
                        ) =>
                          setParticipationForm({
                            ...participationForm,
                            [patient.id]: {
                              ...participationForm[patient.id],
                              status: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRESENT">Present</SelectItem>
                          <SelectItem value="ABSENT">Absent</SelectItem>
                          <SelectItem value="LATE">Late</SelectItem>
                          <SelectItem value="EXCUSED">Excused</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Optional notes..."
                        value={participationForm[patient.id]?.notes || ""}
                        onChange={(e) =>
                          setParticipationForm({
                            ...participationForm,
                            [patient.id]: {
                              ...participationForm[patient.id],
                              notes: e.target.value,
                            },
                          })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkParticipationDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkParticipation}
              disabled={markingParticipation}
            >
              {markingParticipation ? "Recording..." : "Record Participation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
