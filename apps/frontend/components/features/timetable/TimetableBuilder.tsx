"use client";

import React, { useState, useEffect } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  CalendarDays,
  Activity,
} from "lucide-react";

// Dummy data for hospital context
const dummyPatients = [
  { id: "P-001", name: "Lihini Perera", age: 8, diagnosis: "Left Hemiplegia" },
  {
    id: "P-002",
    name: "Kavin Jayasekara",
    age: 10,
    diagnosis: "Right Hemiplegia",
  },
  {
    id: "P-003",
    name: "Anya de Silva",
    age: 7,
    diagnosis: "Bilateral Motor Delay",
  },
  { id: "P-004", name: "Dineth Bandara", age: 9, diagnosis: "Cerebral Palsy" },
  {
    id: "P-005",
    name: "Sithumi Rajapaksa",
    age: 6,
    diagnosis: "Left Hemiplegia - Stroke Recovery",
  },
];

const dummyTherapists = [
  { id: "T-001", name: "Dr. Nimal Silva", specialty: "Neuro Rehabilitation" },
  { id: "T-002", name: "Dr. Priya Fernando", specialty: "Gait & Balance" },
  { id: "T-003", name: "Dr. Sunil Wijesinghe", specialty: "Motor Skills" },
  {
    id: "T-004",
    name: "Dr. Chamari Perera",
    specialty: "Occupational Therapy",
  },
];

const dummyTherapyTypes = [
  {
    id: "TH-001",
    name: "Upper Limb Exercise",
    clinic: "Pediatric Neuro Rehab",
  },
  { id: "TH-002", name: "Gait Training", clinic: "Gait & Balance Lab" },
  { id: "TH-003", name: "Game-Based Therapy", clinic: "Assistive Play Clinic" },
  {
    id: "TH-004",
    name: "Fine Motor Skills",
    clinic: "Motor Skills Development",
  },
  {
    id: "TH-005",
    name: "Balance & Coordination",
    clinic: "Gait & Balance Lab",
  },
];

const dummyClinics = [
  { id: "C-001", name: "Pediatric Neuro Rehab", location: "Ward-A" },
  { id: "C-002", name: "Gait & Balance Lab", location: "Ward-B" },
  { id: "C-003", name: "Assistive Play Clinic", location: "Room-101" },
  { id: "C-004", name: "Motor Skills Development", location: "Room-102" },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const TIME_SLOTS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

interface TherapySession {
  id: string;
  patientId: string;
  patient: { name: string; age: number; diagnosis: string };
  therapistId: string;
  therapist: { name: string; specialty: string };
  therapyTypeId: string;
  therapyType: { name: string; clinic: string };
  clinicId: string;
  clinic: { name: string; location: string };
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  duration: number;
  validFrom: string;
  validUntil: string;
  recurring: boolean;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  color?: string;
}

// Dummy therapy sessions
const dummySessions: TherapySession[] = [
  {
    id: "S-001",
    patientId: "P-001",
    patient: { name: "Lihini Perera", age: 8, diagnosis: "Left Hemiplegia" },
    therapistId: "T-001",
    therapist: { name: "Dr. Nimal Silva", specialty: "Neuro Rehabilitation" },
    therapyTypeId: "TH-001",
    therapyType: {
      name: "Upper Limb Exercise",
      clinic: "Pediatric Neuro Rehab",
    },
    clinicId: "C-001",
    clinic: { name: "Pediatric Neuro Rehab", location: "Ward-A" },
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:00",
    duration: 60,
    validFrom: "2025-01-01",
    validUntil: "2025-12-31",
    recurring: true,
    status: "scheduled",
    notes: "Focus on right arm strengthening",
    color: "#3b82f6",
  },
  {
    id: "S-002",
    patientId: "P-002",
    patient: {
      name: "Kavin Jayasekara",
      age: 10,
      diagnosis: "Right Hemiplegia",
    },
    therapistId: "T-002",
    therapist: { name: "Dr. Priya Fernando", specialty: "Gait & Balance" },
    therapyTypeId: "TH-002",
    therapyType: { name: "Gait Training", clinic: "Gait & Balance Lab" },
    clinicId: "C-002",
    clinic: { name: "Gait & Balance Lab", location: "Ward-B" },
    dayOfWeek: 2,
    startTime: "10:00",
    endTime: "11:00",
    duration: 60,
    validFrom: "2025-01-01",
    validUntil: "2025-12-31",
    recurring: true,
    status: "scheduled",
    notes: "Post-surgery gait rehabilitation",
    color: "#8b5cf6",
  },
  {
    id: "S-003",
    patientId: "P-003",
    patient: {
      name: "Anya de Silva",
      age: 7,
      diagnosis: "Bilateral Motor Delay",
    },
    therapistId: "T-003",
    therapist: { name: "Dr. Sunil Wijesinghe", specialty: "Motor Skills" },
    therapyTypeId: "TH-003",
    therapyType: {
      name: "Game-Based Therapy",
      clinic: "Assistive Play Clinic",
    },
    clinicId: "C-003",
    clinic: { name: "Assistive Play Clinic", location: "Room-101" },
    dayOfWeek: 3,
    startTime: "14:00",
    endTime: "15:00",
    duration: 60,
    validFrom: "2025-01-01",
    validUntil: "2025-12-31",
    recurring: true,
    status: "scheduled",
    notes: "Using game device for movement therapy",
    color: "#ec4899",
  },
  {
    id: "S-004",
    patientId: "P-001",
    patient: { name: "Lihini Perera", age: 8, diagnosis: "Left Hemiplegia" },
    therapistId: "T-004",
    therapist: {
      name: "Dr. Chamari Perera",
      specialty: "Occupational Therapy",
    },
    therapyTypeId: "TH-004",
    therapyType: {
      name: "Fine Motor Skills",
      clinic: "Motor Skills Development",
    },
    clinicId: "C-004",
    clinic: { name: "Motor Skills Development", location: "Room-102" },
    dayOfWeek: 4,
    startTime: "11:00",
    endTime: "12:00",
    duration: 60,
    validFrom: "2025-01-01",
    validUntil: "2025-12-31",
    recurring: true,
    status: "scheduled",
    notes: "Hand dexterity exercises",
    color: "#f59e0b",
  },
  {
    id: "S-005",
    patientId: "P-002",
    patient: {
      name: "Kavin Jayasekara",
      age: 10,
      diagnosis: "Right Hemiplegia",
    },
    therapistId: "T-001",
    therapist: { name: "Dr. Nimal Silva", specialty: "Neuro Rehabilitation" },
    therapyTypeId: "TH-003",
    therapyType: {
      name: "Game-Based Therapy",
      clinic: "Assistive Play Clinic",
    },
    clinicId: "C-003",
    clinic: { name: "Assistive Play Clinic", location: "Room-101" },
    dayOfWeek: 5,
    startTime: "15:00",
    endTime: "16:00",
    duration: 60,
    validFrom: "2025-01-01",
    validUntil: "2025-12-31",
    recurring: true,
    status: "scheduled",
    notes: "Device-assisted lower limb movement training",
    color: "#10b981",
  },
];

export function TimetableBuilder() {
  // Filter states
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [selectedTherapyType, setSelectedTherapyType] = useState<string>("");
  const [selectedClinic, setSelectedClinic] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  // Data states
  const [therapySessions, setTherapySessions] =
    useState<TherapySession[]>(dummySessions);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Entry states
  const [selectedSession, setSelectedSession] = useState<TherapySession | null>(
    null
  );
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    patientId: string;
    therapistId: string;
    therapyTypeId: string;
    clinicId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    validFrom: string;
    validUntil: string;
    recurring: boolean;
    status: "scheduled" | "completed" | "cancelled";
    notes: string;
    color: string;
  }>({
    patientId: "",
    therapistId: "",
    therapyTypeId: "",
    clinicId: "",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:00",
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    recurring: true,
    status: "scheduled",
    notes: "",
    color: "#3b82f6",
  });

  // Filter therapy sessions based on selected filters
  useEffect(() => {
    let filtered = dummySessions;
    if (selectedPatient) {
      filtered = filtered.filter((s) => s.patientId === selectedPatient);
    }
    if (selectedTherapyType) {
      filtered = filtered.filter(
        (s) => s.therapyTypeId === selectedTherapyType
      );
    }
    if (selectedClinic) {
      filtered = filtered.filter((s) => s.clinicId === selectedClinic);
    }
    setTherapySessions(filtered);
  }, [selectedPatient, selectedTherapyType, selectedClinic]);

  const handleCreateSession = () => {
    if (
      !formData.patientId ||
      !formData.therapistId ||
      !formData.therapyTypeId ||
      !formData.clinicId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newSession: TherapySession = {
      id: `S-${Date.now()}`,
      patientId: formData.patientId,
      patient:
        dummyPatients.find((p) => p.id === formData.patientId) ||
        dummyPatients[0],
      therapistId: formData.therapistId,
      therapist:
        dummyTherapists.find((t) => t.id === formData.therapistId) ||
        dummyTherapists[0],
      therapyTypeId: formData.therapyTypeId,
      therapyType:
        dummyTherapyTypes.find((t) => t.id === formData.therapyTypeId) ||
        dummyTherapyTypes[0],
      clinicId: formData.clinicId,
      clinic:
        dummyClinics.find((c) => c.id === formData.clinicId) || dummyClinics[0],
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      duration: 60,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
      recurring: formData.recurring,
      status: formData.status,
      notes: formData.notes,
      color: formData.color,
    };

    setTherapySessions([...therapySessions, newSession]);
    toast.success("Therapy session created successfully");
    setCreateDialogOpen(false);
    resetForm();
  };

  const handleEditSession = () => {
    if (!selectedSession) return;

    const updatedSessions = therapySessions.map((s) =>
      s.id === selectedSession.id
        ? {
            ...s,
            patientId: formData.patientId,
            patient:
              dummyPatients.find((p) => p.id === formData.patientId) ||
              dummyPatients[0],
            therapistId: formData.therapistId,
            therapist:
              dummyTherapists.find((t) => t.id === formData.therapistId) ||
              dummyTherapists[0],
            therapyTypeId: formData.therapyTypeId,
            therapyType:
              dummyTherapyTypes.find((t) => t.id === formData.therapyTypeId) ||
              dummyTherapyTypes[0],
            clinicId: formData.clinicId,
            clinic:
              dummyClinics.find((c) => c.id === formData.clinicId) ||
              dummyClinics[0],
            dayOfWeek: formData.dayOfWeek,
            startTime: formData.startTime,
            endTime: formData.endTime,
            validFrom: formData.validFrom,
            validUntil: formData.validUntil,
            recurring: formData.recurring,
            status: formData.status,
            notes: formData.notes,
            color: formData.color,
          }
        : s
    );
    setTherapySessions(updatedSessions);
    toast.success("Therapy session updated successfully");
    setEditDialogOpen(false);
    setSelectedSession(null);
    resetForm();
  };

  const handleDeleteSession = () => {
    if (!deleteSessionId) return;
    setTherapySessions(therapySessions.filter((s) => s.id !== deleteSessionId));
    toast.success("Therapy session deleted successfully");
    setDeleteDialogOpen(false);
    setDeleteSessionId(null);
  };

  const openCreateDialog = (dayOfWeek?: number, startTime?: string) => {
    resetForm();
    if (dayOfWeek !== undefined)
      setFormData((prev) => ({ ...prev, dayOfWeek }));
    if (startTime) setFormData((prev) => ({ ...prev, startTime }));
    setCreateDialogOpen(true);
  };

  const openEditDialog = (session: TherapySession) => {
    setSelectedSession(session);
    setFormData({
      patientId: session.patientId,
      therapistId: session.therapistId,
      therapyTypeId: session.therapyTypeId,
      clinicId: session.clinicId,
      dayOfWeek: session.dayOfWeek,
      startTime: session.startTime,
      endTime: session.endTime,
      validFrom: session.validFrom,
      validUntil: session.validUntil,
      recurring: session.recurring,
      status: session.status,
      notes: session.notes || "",
      color: session.color || "#3b82f6",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (sessionId: string) => {
    setDeleteSessionId(sessionId);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      therapistId: "",
      therapyTypeId: "",
      clinicId: "",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:00",
      validFrom: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      recurring: true,
      status: "scheduled",
      notes: "",
      color: "#3b82f6",
    });
  };

  const getEntriesForSlot = (dayOfWeek: number, timeSlot: string) => {
    return therapySessions.filter((session) => {
      if (session.dayOfWeek !== dayOfWeek) return false;
      const slotTime = timeSlot.split(":").map(Number);
      const startTime = session.startTime.split(":").map(Number);
      const endTime = session.endTime.split(":").map(Number);

      const slotMinutes = slotTime[0] * 60 + slotTime[1];
      const startMinutes = startTime[0] * 60 + startTime[1];
      const endMinutes = endTime[0] * 60 + endTime[1];

      return slotMinutes >= startMinutes && slotMinutes < endMinutes;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Therapy Session Scheduler
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage weekly therapy sessions for pediatric hemiplegia
            rehabilitation
          </p>
        </div>
        <Button onClick={() => openCreateDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Therapy Session
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select
                value={selectedPatient}
                onValueChange={setSelectedPatient}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Patients" />
                </SelectTrigger>
                <SelectContent>
                  {dummyPatients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} ({patient.age}y)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Therapy Type</Label>
              <Select
                value={selectedTherapyType}
                onValueChange={setSelectedTherapyType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {dummyTherapyTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Clinic</Label>
              <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                <SelectTrigger>
                  <SelectValue placeholder="All Clinics" />
                </SelectTrigger>
                <SelectContent>
                  {dummyClinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Week #</Label>
              <Select
                value={selectedWeek.toString()}
                onValueChange={(v) => setSelectedWeek(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Week 1" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((week) => (
                    <SelectItem key={week} value={week.toString()}>
                      Week {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Timetable View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Weekly Schedule
          </CardTitle>
          <CardDescription>
            Click on a time slot to create a new session. Click on an existing
            session to edit or delete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Time</TableHead>
                  {DAYS_OF_WEEK.map((day) => (
                    <TableHead
                      key={day.value}
                      className="text-center min-w-[160px]"
                    >
                      {day.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {TIME_SLOTS.map((timeSlot) => (
                  <TableRow key={timeSlot}>
                    <TableCell className="font-medium text-sm">
                      {timeSlot}
                    </TableCell>
                    {DAYS_OF_WEEK.map((day) => {
                      const entries = getEntriesForSlot(day.value, timeSlot);
                      return (
                        <TableCell
                          key={`${day.value}-${timeSlot}`}
                          className="p-1 align-top cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() =>
                            entries.length === 0 &&
                            openCreateDialog(day.value, timeSlot)
                          }
                        >
                          {entries.length > 0 ? (
                            <div className="space-y-1">
                              {entries.map((session) => (
                                <div
                                  key={session.id}
                                  className="p-2 rounded-md text-xs border-l-4 hover:shadow-md transition-shadow cursor-pointer"
                                  style={{
                                    borderLeftColor: session.color || "#3b82f6",
                                    backgroundColor: `${session.color || "#3b82f6"}20`,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDialog(session);
                                  }}
                                >
                                  <div className="font-semibold line-clamp-1">
                                    {session.patient.name}
                                  </div>
                                  <div className="text-muted-foreground line-clamp-1">
                                    {session.therapyType.name}
                                  </div>
                                  <div className="text-muted-foreground line-clamp-1">
                                    {session.therapist.name}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {session.startTime} - {session.endTime}
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="mt-1 text-xs"
                                  >
                                    {session.clinic.location}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
                              +
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setSelectedSession(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editDialogOpen
                ? "Edit Therapy Session"
                : "Create Therapy Session"}
            </DialogTitle>
            <DialogDescription>
              Schedule a new therapy session for a patient with assigned
              therapist and clinic.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Patient <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.patientId}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, patientId: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {dummyPatients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} - {patient.diagnosis}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Therapist <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.therapistId}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, therapistId: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select therapist" />
                  </SelectTrigger>
                  <SelectContent>
                    {dummyTherapists.map((therapist) => (
                      <SelectItem key={therapist.id} value={therapist.id}>
                        {therapist.name} - {therapist.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Therapy Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.therapyTypeId}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, therapyTypeId: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select therapy type" />
                  </SelectTrigger>
                  <SelectContent>
                    {dummyTherapyTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Clinic <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.clinicId}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, clinicId: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {dummyClinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name} ({clinic.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Day of Week <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.dayOfWeek.toString()}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, dayOfWeek: Number(val) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.startTime}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, startTime: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  End Time <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.endTime}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, endTime: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Session Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: val as "scheduled" | "completed" | "cancelled",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Session Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    className="h-10 w-20 rounded border"
                  />
                  <Input value={formData.color} readOnly />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valid From</Label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      validFrom: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      validUntil: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.recurring}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    recurring: e.target.checked,
                  }))
                }
              />
              <Label htmlFor="recurring" className="cursor-pointer">
                Recurring Weekly
              </Label>
            </div>

            <div>
              <Label>Session Notes & Therapy Goals</Label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Add therapy goals, progress notes, or special instructions..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editDialogOpen ? handleEditSession : handleCreateSession}
            >
              {editDialogOpen ? "Update Session" : "Create Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Therapy Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this therapy session? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sessions List View (for reference) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Scheduled Sessions ({therapySessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Therapist</TableHead>
                  <TableHead>Therapy Type</TableHead>
                  <TableHead>Clinic</TableHead>
                  <TableHead>Day & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {therapySessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {session.patient.name}
                    </TableCell>
                    <TableCell>{session.therapist.name}</TableCell>
                    <TableCell>{session.therapyType.name}</TableCell>
                    <TableCell>{session.clinic.name}</TableCell>
                    <TableCell>
                      {
                        DAYS_OF_WEEK.find((d) => d.value === session.dayOfWeek)
                          ?.label
                      }{" "}
                      {session.startTime}-{session.endTime}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          session.status === "scheduled"
                            ? "default"
                            : session.status === "completed"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {session.status.charAt(0).toUpperCase() +
                          session.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(session)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteDialog(session.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
