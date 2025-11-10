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
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Copy,
  AlertCircle,
  CheckCircle,
  Users,
  Loader2,
  CalendarDays,
  BookOpen,
} from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { timetableApi } from "@/lib/api/endpoints/timetable";
import { academicYearsApi } from "@/lib/api/endpoints/academic-years";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
import {
  GradeSelect,
  SubjectSelect,
  MediumSelect,
  TeacherSelect,
} from "@/components/shared/selects";

interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface TimetableEntry {
  id: string;
  gradeId: string;
  grade: { name: string; level: number };
  subjectId: string;
  subject: { name: string };
  mediumId: string;
  medium: { name: string };
  teacherId: string;
  teacher: { firstName: string; lastName: string };
  teacherAssignmentId: string;
  classLink: string;
  classId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  validFrom: string;
  validUntil: string;
  recurring: boolean;
  active: boolean;
  academicYear: number;
  term: number;
  batch?: string;
  color?: string;
  notes?: string;
  recurrencePattern?: string;
  excludeDates?: string;
}

interface Conflict {
  type: string;
  message: string;
  conflictingEntry: TimetableEntry;
}

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

const CURRENT_YEAR = new Date().getFullYear();
const TERMS = [1, 2, 3];

export function TimetableBuilder() {
  // Filter states
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedMedium, setSelectedMedium] = useState<string>("");
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] =
    useState<number>(CURRENT_YEAR);
  const [selectedTerm, setSelectedTerm] = useState<number>(1);

  // Data states
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [copyWeekDialogOpen, setCopyWeekDialogOpen] = useState(false);

  // Entry states
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(
    null
  );
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    gradeId: "",
    subjectId: "",
    mediumId: "",
    teacherId: "",
    classLink: "",
    dayOfWeek: 1,
    startTime: "08:00",
    endTime: "09:00",
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    recurring: true,
    academicYear: CURRENT_YEAR,
    term: 1,
    batch: "",
    color: "#3b82f6",
    notes: "",
    excludeDates: "",
  });

  // Fetch timetable entries when filters change
  useEffect(() => {
    fetchTimetableEntries();
  }, [
    selectedGrade,
    selectedSubject,
    selectedMedium,
    selectedAcademicYear,
    selectedTerm,
  ]);

  // Fetch academic years on mount
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await academicYearsApi.getAll({
          includeInactive: false,
        });
        const years = response?.academicYears || [];
        setAcademicYears(years);
        // Set current year as default if available
        const currentYear = years.find((y: AcademicYear) => y.isCurrent);
        if (currentYear) {
          setSelectedAcademicYear(parseInt(currentYear.year, 10));
        }
      } catch (error) {
        console.error("Error fetching academic years:", error);
      }
    };
    fetchAcademicYears();
  }, []);

  const fetchTimetableEntries = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedGrade) params.gradeId = selectedGrade;
      if (selectedSubject) params.subjectId = selectedSubject;
      if (selectedMedium) params.mediumId = selectedMedium;
      params.academicYear = selectedAcademicYear;
      params.term = selectedTerm;

      const response = await timetableApi.getAll(params);
      setTimetableEntries(Array.isArray(response) ? response : []);
    } catch (error) {
      handleApiError(error, "Failed to fetch timetable entries");
      setTimetableEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const checkConflicts = async (data: typeof formData) => {
    try {
      const conflictResponse = await timetableApi.checkConflicts({
        teacherId: data.teacherId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
      });
      return Array.isArray(conflictResponse) ? conflictResponse : [];
    } catch (error) {
      return [];
    }
  };

  const handleCreateEntry = async () => {
    if (
      !formData.gradeId ||
      !formData.subjectId ||
      !formData.mediumId ||
      !formData.teacherId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check conflicts first
    const foundConflicts = await checkConflicts(formData);
    if (foundConflicts.length > 0) {
      setConflicts(foundConflicts);
      setConflictDialogOpen(true);
      return;
    }

    try {
      await timetableApi.create(formData);
      handleApiSuccess("Timetable entry created successfully");
      setCreateDialogOpen(false);
      resetForm();
      fetchTimetableEntries();
    } catch (error) {
      handleApiError(error, "Failed to create timetable entry");
    }
  };

  const handleEditEntry = async () => {
    if (!selectedEntry) return;

    const foundConflicts = await checkConflicts(formData);
    if (foundConflicts.length > 0) {
      setConflicts(foundConflicts);
      setConflictDialogOpen(true);
      return;
    }

    try {
      await timetableApi.update(selectedEntry.id, formData);
      handleApiSuccess("Timetable entry updated successfully");
      setEditDialogOpen(false);
      setSelectedEntry(null);
      resetForm();
      fetchTimetableEntries();
    } catch (error) {
      handleApiError(error, "Failed to update timetable entry");
    }
  };

  const handleDeleteEntry = async () => {
    if (!deleteEntryId) return;

    try {
      await timetableApi.delete(deleteEntryId);
      handleApiSuccess("Timetable entry deleted successfully");
      setDeleteDialogOpen(false);
      setDeleteEntryId(null);
      fetchTimetableEntries();
    } catch (error) {
      handleApiError(error, "Failed to delete timetable entry");
    }
  };

  const openCreateDialog = (dayOfWeek?: number, startTime?: string) => {
    resetForm();
    if (dayOfWeek !== undefined)
      setFormData((prev) => ({ ...prev, dayOfWeek }));
    if (startTime) setFormData((prev) => ({ ...prev, startTime }));
    setCreateDialogOpen(true);
  };

  const openEditDialog = (entry: TimetableEntry) => {
    setSelectedEntry(entry);
    setFormData({
      gradeId: entry.gradeId,
      subjectId: entry.subjectId,
      mediumId: entry.mediumId,
      teacherId: entry.teacherId,
      classLink: entry.classLink,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      validFrom: entry.validFrom
        ? entry.validFrom.split("T")[0]
        : new Date().toISOString().split("T")[0],
      validUntil: entry.validUntil
        ? entry.validUntil.split("T")[0]
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
      recurring: entry.recurring,
      academicYear: entry.academicYear ?? CURRENT_YEAR,
      term: entry.term ?? 1,
      batch: entry.batch || "",
      color: entry.color || "#3b82f6",
      notes: entry.notes || "",
      excludeDates: entry.excludeDates || "",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (entryId: string) => {
    setDeleteEntryId(entryId);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      gradeId: selectedGrade || "",
      subjectId: selectedSubject || "",
      mediumId: selectedMedium || "",
      teacherId: "",
      classLink: "",
      dayOfWeek: 1,
      startTime: "08:00",
      endTime: "09:00",
      validFrom: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      recurring: true,
      academicYear: selectedAcademicYear,
      term: selectedTerm,
      batch: "",
      color: "#3b82f6",
      notes: "",
      excludeDates: "",
    });
  };

  // Get entries for a specific day and time slot
  const getEntriesForSlot = (dayOfWeek: number, timeSlot: string) => {
    return timetableEntries.filter((entry) => {
      if (entry.dayOfWeek !== dayOfWeek) return false;
      if (!entry.startTime || !entry.endTime) return false;
      const slotTime = timeSlot.split(":").map(Number);
      const startTime = entry.startTime.split(":").map(Number);
      const endTime = entry.endTime.split(":").map(Number);

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
          <h1 className="text-3xl font-bold">Timetable Builder</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage recurring class schedules with weekly view
          </p>
        </div>
        <Button onClick={() => openCreateDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Timetable Entry
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Select grade, subject, medium, academic year, and term to view
            timetable
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <Label>Grade</Label>
              <GradeSelect
                value={selectedGrade}
                onValueChange={setSelectedGrade}
                allowClear
              />
            </div>
            <div>
              <Label>Subject</Label>
              <SubjectSelect
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                allowClear
              />
            </div>
            <div>
              <Label>Medium</Label>
              <MediumSelect
                value={selectedMedium}
                onValueChange={setSelectedMedium}
                allowClear
              />
            </div>
            <div>
              <Label>Academic Year</Label>
              <Select
                value={selectedAcademicYear.toString()}
                onValueChange={(val) => setSelectedAcademicYear(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.filter((year) => year.year).length > 0
                    ? academicYears
                        .filter((year) => year.year)
                        .map((year) => (
                          <SelectItem key={year.id} value={year.year}>
                            {year.year} {year.isCurrent && "(Current)"}
                          </SelectItem>
                        ))
                    : // Fallback to hardcoded years if no academic years from API
                      [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(
                        (year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        )
                      )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Term</Label>
              <Select
                value={selectedTerm.toString()}
                onValueChange={(val) => setSelectedTerm(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((term) => (
                    <SelectItem key={term} value={term.toString()}>
                      Term {term}
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
            <BookOpen className="h-5 w-5" />
            Weekly Schedule
          </CardTitle>
          <CardDescription>
            Click on a time slot to create a new entry. Click on an existing
            entry to edit or delete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Time</TableHead>
                    {DAYS_OF_WEEK.map((day) => (
                      <TableHead
                        key={day.value}
                        className="text-center min-w-[140px]"
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
                            className="p-1 align-top cursor-pointer hover:bg-muted/50"
                            onClick={() =>
                              entries.length === 0 &&
                              openCreateDialog(day.value, timeSlot)
                            }
                          >
                            {entries.length > 0 ? (
                              <div className="space-y-1">
                                {entries.map((entry) => (
                                  /* eslint-disable-next-line react/forbid-dom-props */
                                  <div
                                    key={entry.id}
                                    className="p-2 rounded-md text-xs border-l-4 hover:shadow-md transition-shadow"
                                    style={{
                                      borderLeftColor: entry.color || "#3b82f6",
                                      backgroundColor: `${entry.color || "#3b82f6"}10`,
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditDialog(entry);
                                    }}
                                  >
                                    <div className="font-semibold">
                                      {entry.subject?.name ?? "Unknown subject"}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {entry.grade?.name ?? "Unknown grade"}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {`${entry.teacher?.firstName ?? ""} ${entry.teacher?.lastName ?? ""}`.trim() ||
                                        "Unknown teacher"}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {entry.startTime} - {entry.endTime}
                                    </div>
                                    {!entry.active && (
                                      <Badge
                                        variant="destructive"
                                        className="mt-1"
                                      >
                                        Inactive
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="h-16 flex items-center justify-center text-muted-foreground text-xs">
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
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setSelectedEntry(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editDialogOpen
                ? "Edit Timetable Entry"
                : "Create Timetable Entry"}
            </DialogTitle>
            <DialogDescription>
              Create a recurring slot for a specific teacher, subject, and
              class.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Grade <span className="text-red-500">*</span>
                </Label>
                <GradeSelect
                  value={formData.gradeId}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, gradeId: val }))
                  }
                />
              </div>
              <div>
                <Label>
                  Medium <span className="text-red-500">*</span>
                </Label>
                <MediumSelect
                  value={formData.mediumId}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, mediumId: val }))
                  }
                />
              </div>
              <div>
                <Label>
                  Subject <span className="text-red-500">*</span>
                </Label>
                <SubjectSelect
                  value={formData.subjectId}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, subjectId: val }))
                  }
                />
              </div>
              <div>
                <Label>
                  Teacher <span className="text-red-500">*</span>
                </Label>
                <TeacherSelect
                  value={formData.teacherId}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, teacherId: val }))
                  }
                />
              </div>
              <div>
                <Label>
                  Day of Week <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.dayOfWeek.toString()}
                  onValueChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      dayOfWeek: parseInt(val),
                    }))
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
                <Label>Class Link</Label>
                <Input
                  value={formData.classLink}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      classLink: e.target.value,
                    }))
                  }
                  placeholder="https://zoom.us/..."
                />
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
                  Valid From <span className="text-red-500">*</span>
                </Label>
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
                <Label>
                  Valid Until <span className="text-red-500">*</span>
                </Label>
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
              <div>
                <Label>Academic Year</Label>
                <Select
                  value={formData.academicYear.toString()}
                  onValueChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      academicYear: parseInt(val),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.filter((year) => year.year).length > 0
                      ? academicYears
                          .filter((year) => year.year)
                          .map((year) => (
                            <SelectItem key={year.id} value={year.year}>
                              {year.year} {year.isCurrent && "(Current)"}
                            </SelectItem>
                          ))
                      : [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(
                          (year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          )
                        )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Term</Label>
                <Select
                  value={formData.term.toString()}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, term: parseInt(val) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TERMS.map((term) => (
                      <SelectItem key={term} value={term.toString()}>
                        Term {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Batch (Optional)</Label>
                <Input
                  value={formData.batch}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, batch: e.target.value }))
                  }
                  placeholder="Batch name"
                />
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-2">
                <Label>Notes (Optional)</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Additional notes..."
                />
              </div>
              <div className="col-span-2">
                <Label>Exclude Dates (Optional)</Label>
                <Input
                  value={formData.excludeDates}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      excludeDates: e.target.value,
                    }))
                  }
                  placeholder="2024-12-25,2025-01-01 (comma-separated)"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editDialogOpen && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedEntry) {
                    openDeleteDialog(selectedEntry.id);
                    setEditDialogOpen(false);
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditDialogOpen(false);
                setSelectedEntry(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editDialogOpen ? handleEditEntry : handleCreateEntry}
            >
              {editDialogOpen ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict Dialog */}
      <AlertDialog
        open={conflictDialogOpen}
        onOpenChange={setConflictDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Scheduling Conflicts Detected
            </AlertDialogTitle>
            <AlertDialogDescription>
              The following conflicts were found with existing timetable
              entries:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {conflicts.map((conflict, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg bg-destructive/10"
              >
                <p className="text-sm font-medium text-destructive">
                  {conflict.message}
                </p>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConflictDialogOpen(false);
                if (editDialogOpen && selectedEntry) {
                  handleEditEntry();
                } else if (createDialogOpen) {
                  handleCreateEntry();
                }
              }}
            >
              Create Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this timetable entry. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEntry}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
