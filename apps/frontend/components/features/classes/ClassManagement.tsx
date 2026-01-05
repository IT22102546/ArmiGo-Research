"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  UserRound,
  CalendarClock,
  Filter,
  Search,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader, EmptyState } from "@/components/shared";

type SessionStatus = "Scheduled" | "In Progress" | "Completed" | "Cancelled";

interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
}

interface Admission {
  id: string;
  patientId: string;
  ward: string;
  admissionDate: string;
  guardian?: string;
}

interface Therapist {
  id: string;
  name: string;
  specialization: string;
}

interface Clinic {
  id: string;
  name: string;
}

interface TherapyType {
  id: string;
  name: string;
  focus: string;
}

interface Session {
  id: string;
  patientId: string;
  admissionId: string;
  therapistId: string;
  therapyTypeId: string;
  clinicId: string;
  date: string;
  durationMinutes: number;
  status: SessionStatus;
  notes?: string;
}

const patients: Patient[] = [
  { id: "p-1", name: "Lahiru Perera", age: 7, condition: "Right hemiplegia" },
  { id: "p-2", name: "Anaya Fernando", age: 6, condition: "Left hemiplegia" },
  { id: "p-3", name: "Kavindu Silva", age: 8, condition: "Spastic diplegia" },
];

const admissions: Admission[] = [
  {
    id: "a-1",
    patientId: "p-1",
    ward: "Neuro Rehab",
    admissionDate: "2024-06-10",
    guardian: "Mother",
  },
  {
    id: "a-2",
    patientId: "p-2",
    ward: "Pediatric Rehab",
    admissionDate: "2024-07-02",
    guardian: "Father",
  },
  {
    id: "a-3",
    patientId: "p-3",
    ward: "Neuro Rehab",
    admissionDate: "2024-06-20",
    guardian: "Mother",
  },
];

const therapists: Therapist[] = [
  {
    id: "t-1",
    name: "Dr. Malithi Jayasinghe",
    specialization: "Physiotherapy",
  },
  {
    id: "t-2",
    name: "Dr. Nuwan Samara",
    specialization: "Occupational Therapy",
  },
  { id: "t-3", name: "Dr. Ishara Peris", specialization: "Speech Therapy" },
];

const clinics: Clinic[] = [
  { id: "c-1", name: "Colombo Rehab Center" },
  { id: "c-2", name: "Kandy Children Hospital" },
];

const therapyTypes: TherapyType[] = [
  { id: "tt-1", name: "Physiotherapy", focus: "Motor control & gait" },
  { id: "tt-2", name: "Occupational Therapy", focus: "ADL independence" },
  { id: "tt-3", name: "Speech Therapy", focus: "Communication" },
];

const initialSessions: Session[] = [
  {
    id: "s-1",
    patientId: "p-1",
    admissionId: "a-1",
    therapistId: "t-1",
    therapyTypeId: "tt-1",
    clinicId: "c-1",
    date: new Date().toISOString(),
    durationMinutes: 45,
    status: "Scheduled",
    notes: "Focus on right upper limb weight bearing",
  },
  {
    id: "s-2",
    patientId: "p-2",
    admissionId: "a-2",
    therapistId: "t-2",
    therapyTypeId: "tt-2",
    clinicId: "c-2",
    date: new Date(Date.now() + 86400000).toISOString(),
    durationMinutes: 60,
    status: "Scheduled",
    notes: "Fine motor skills, dressing practice",
  },
  {
    id: "s-3",
    patientId: "p-3",
    admissionId: "a-3",
    therapistId: "t-3",
    therapyTypeId: "tt-3",
    clinicId: "c-1",
    date: new Date(Date.now() - 86400000).toISOString(),
    durationMinutes: 40,
    status: "Completed",
    notes: "Articulation drills and breathing exercises",
  },
];

const formatDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return format(parsed, "PP p");
};

export function ClassesManagement() {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "ALL">(
    "ALL"
  );
  const [therapyFilter, setTherapyFilter] = useState<string>("ALL");
  const [clinicFilter, setClinicFilter] = useState<string>("ALL");
  const [patientFilter, setPatientFilter] = useState<string>("ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const [formData, setFormData] = useState({
    patientId: "",
    admissionId: "",
    therapistId: "",
    therapyTypeId: "",
    clinicId: "",
    date: "",
    durationMinutes: 45,
    status: "Scheduled" as SessionStatus,
    notes: "",
  });

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const patient = patients.find((p) => p.id === session.patientId);
      const admission = admissions.find((a) => a.id === session.admissionId);
      const matchesSearch = search
        ? (patient?.name || "").toLowerCase().includes(search.toLowerCase()) ||
          (admission?.ward || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (session.notes || "").toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesStatus =
        statusFilter === "ALL" || session.status === statusFilter;
      const matchesTherapy =
        therapyFilter === "ALL" || session.therapyTypeId === therapyFilter;
      const matchesClinic =
        clinicFilter === "ALL" || session.clinicId === clinicFilter;
      const matchesPatient =
        patientFilter === "ALL" || session.patientId === patientFilter;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesTherapy &&
        matchesClinic &&
        matchesPatient
      );
    });
  }, [
    sessions,
    search,
    statusFilter,
    therapyFilter,
    clinicFilter,
    patientFilter,
  ]);

  useEffect(() => {
    if (formData.patientId) {
      const firstAdmission = admissions.find(
        (a) => a.patientId === formData.patientId
      );
      if (firstAdmission) {
        setFormData((prev) => ({ ...prev, admissionId: firstAdmission.id }));
      }
    }
  }, [formData.patientId]);

  const resetForm = () => {
    setFormData({
      patientId: "",
      admissionId: "",
      therapistId: "",
      therapyTypeId: "",
      clinicId: "",
      date: "",
      durationMinutes: 45,
      status: "Scheduled",
      notes: "",
    });
    setEditingSession(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (session: Session) => {
    setEditingSession(session);
    setFormData({
      patientId: session.patientId,
      admissionId: session.admissionId,
      therapistId: session.therapistId,
      therapyTypeId: session.therapyTypeId,
      clinicId: session.clinicId,
      date: session.date.split("T")[0],
      durationMinutes: session.durationMinutes,
      status: session.status,
      notes: session.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (
      !formData.patientId ||
      !formData.admissionId ||
      !formData.therapistId ||
      !formData.therapyTypeId ||
      !formData.clinicId ||
      !formData.date
    ) {
      return;
    }

    if (editingSession) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === editingSession.id
            ? { ...s, ...formData, date: new Date(formData.date).toISOString() }
            : s
        )
      );
    } else {
      setSessions((prev) => [
        ...prev,
        {
          id: `s-${Date.now()}`,
          ...formData,
          date: new Date(formData.date).toISOString(),
        },
      ]);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (!editingSession) return;
    setSessions((prev) => prev.filter((s) => s.id !== editingSession.id));
    setDeleteDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Session Management"
        description="Create and track therapy sessions linked to admissions"
        icon={Stethoscope}
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create Session
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Label>Search (patient, ward, notes)</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type to filter sessions"
                />
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as SessionStatus | "ALL")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Therapy Type</Label>
              <Select value={therapyFilter} onValueChange={setTherapyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {therapyTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Clinic</Label>
              <Select value={clinicFilter} onValueChange={setClinicFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Patient</Label>
              <Select value={patientFilter} onValueChange={setPatientFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setTherapyFilter("ALL");
                  setClinicFilter("ALL");
                  setPatientFilter("ALL");
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filteredSessions.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No sessions"
              description="Create a session to get started or adjust filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Admission</TableHead>
                  <TableHead>Therapy</TableHead>
                  <TableHead>Therapist</TableHead>
                  <TableHead>Clinic</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => {
                  const patient = patients.find(
                    (p) => p.id === session.patientId
                  );
                  const admission = admissions.find(
                    (a) => a.id === session.admissionId
                  );
                  const therapist = therapists.find(
                    (t) => t.id === session.therapistId
                  );
                  const therapy = therapyTypes.find(
                    (t) => t.id === session.therapyTypeId
                  );
                  const clinic = clinics.find((c) => c.id === session.clinicId);

                  return (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {patient?.name || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {admission?.ward || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Admit {formatDate(admission?.admissionDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {therapy?.name || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {therapy?.focus}
                        </div>
                      </TableCell>
                      <TableCell>{therapist?.name || "-"}</TableCell>
                      <TableCell>{clinic?.name || "-"}</TableCell>
                      <TableCell>{formatDate(session.date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            session.status === "Scheduled"
                              ? "default"
                              : "outline"
                          }
                        >
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(session)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSession(session);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? "Edit Session" : "Create Session"}
            </DialogTitle>
            <DialogDescription>
              Link a patient admission, assign therapist, and set therapy
              details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Patient *</Label>
              <Select
                value={formData.patientId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, patientId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (Age {p.age})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.patientId && (
                <p className="text-xs text-muted-foreground">
                  Condition:{" "}
                  {patients.find((p) => p.id === formData.patientId)?.condition}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Admission *</Label>
              <Select
                value={formData.admissionId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, admissionId: value }))
                }
                disabled={!formData.patientId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      formData.patientId
                        ? "Select admission"
                        : "Select patient first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {admissions
                    .filter((a) => a.patientId === formData.patientId)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.ward} (Admit {formatDate(a.admissionDate)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Therapy Type *</Label>
                <Select
                  value={formData.therapyTypeId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, therapyTypeId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select therapy" />
                  </SelectTrigger>
                  <SelectContent>
                    {therapyTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Therapist *</Label>
                <Select
                  value={formData.therapistId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, therapistId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select therapist" />
                  </SelectTrigger>
                  <SelectContent>
                    {therapists.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.specialization})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Clinic *</Label>
                <Select
                  value={formData.clinicId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, clinicId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Session Date *</Label>
                <Input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min={15}
                  step={5}
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      durationMinutes: parseInt(e.target.value) || 45,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: value as SessionStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Session focus, precautions, equipment"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingSession ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              This will permanently remove the session for{" "}
              {editingSession &&
                patients.find((p) => p.id === editingSession.patientId)?.name}
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
