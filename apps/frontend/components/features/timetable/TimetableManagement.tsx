"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  Event as RBCEvent,
} from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addDays,
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
} from "date-fns";
import styles from "./timetable-management.module.css";
import { getDisplayName } from "@/lib/utils/display";
import { enUS } from "date-fns/locale";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
} from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  Grid3x3,
  List,
  Plus,
  Edit,
  Trash2,
  Copy,
  Loader2,
  Download,
  Upload,
  Filter,
  GripVertical,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
import { createLogger } from "@/lib/utils/logger";
const logger = createLogger("TimetableManagement");
import { cn } from "@/lib/utils";

// Setup the localizer for react-big-calendar
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface TimetableEntry {
  id: string;
  grade: string;
  academicYear: number;
  term: number;
  subject: string;
  medium?: string;
  teacherId: string;
  teacher: {
    firstName: string;
    lastName: string;
  };
  classLink: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  validFrom: string;
  validUntil: string;
  recurring: boolean;
  recurrencePattern?: string;
  roomNumber?: string;
  color?: string;
  notes?: string;
  active: boolean;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
}

interface CalendarEvent extends RBCEvent {
  id: string;
  entry: TimetableEntry;
  resourceId?: string;
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const hour = i + 6;
  return `${hour.toString().padStart(2, "0")}:00`;
});

const GRADES = ["6", "7", "8", "9", "10", "11", "12", "13"];
const TERMS = [1, 2, 3];
const SUBJECT_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

type ViewMode = "calendar" | "gantt" | "list";

const TimetableManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string>("10");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedTerm, setSelectedTerm] = useState<number>(1);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [formData, setFormData] = useState({
    grade: "10",
    academicYear: new Date().getFullYear(),
    term: 1,
    subject: "",
    medium: "English",
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
    recurrencePattern: "WEEKLY",
    roomNumber: "",
    color: SUBJECT_COLORS[0],
    notes: "",
  });

  useEffect(() => {
    fetchTimetable();
    fetchTeachers();
  }, [selectedGrade, selectedYear, selectedTerm]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        grade: selectedGrade,
        academicYear: selectedYear.toString(),
        term: selectedTerm.toString(),
      });
      const response = await ApiClient.get<TimetableEntry[]>(
        `/timetable?${params.toString()}`
      );
      setTimetable(response);
    } catch (error) {
      console.error("Error fetching timetable:", error);
      toast.error("Failed to load timetable");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await ApiClient.get<{ data: Teacher[] }>(
        "/users?role=INTERNAL_TEACHER,EXTERNAL_TEACHER"
      );
      setTeachers(response.data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  // Convert timetable entries to calendar events
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    return timetable.flatMap((entry) => {
      const events: CalendarEvent[] = [];
      const startDate = startOfWeek(selectedDate);

      for (let i = 0; i < 7; i++) {
        const date = addDays(startDate, i);
        if (getDay(date) === entry.dayOfWeek) {
          const [startHour, startMin] = entry.startTime.split(":").map(Number);
          const [endHour, endMin] = entry.endTime.split(":").map(Number);

          events.push({
            id: entry.id,
            title: `${getDisplayName(entry.subject)} - ${entry.teacher?.firstName || ""} ${entry.teacher?.lastName || "Unknown"}`,
            start: setMinutes(setHours(date, startHour), startMin),
            end: setMinutes(setHours(date, endHour), endMin),
            entry,
            resourceId: entry.roomNumber,
          });
        }
      }

      return events;
    });
  }, [timetable, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingEntry) {
        await ApiClient.put(`/timetable/${editingEntry.id}`, formData);
        handleApiSuccess("Timetable updated successfully");
      } else {
        await ApiClient.post("/timetable", formData);
        handleApiSuccess("Timetable created successfully");
      }
      setIsFormOpen(false);
      resetForm();
      fetchTimetable();
    } catch (error) {
      logger.error("Error saving timetable:", error);
      handleApiError(
        error,
        "TimetableManagement.handleSubmit",
        "Failed to save timetable"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this timetable entry?"))
      return;
    try {
      await ApiClient.delete(`/timetable/${id}`);
      handleApiSuccess("Timetable deleted successfully");
      fetchTimetable();
    } catch (error) {
      logger.error("Error deleting timetable:", error);
      handleApiError(
        error,
        "TimetableManagement.handleDelete",
        "Failed to delete timetable"
      );
    }
  };

  const handleEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData({
      grade: entry.grade,
      academicYear: entry.academicYear,
      term: entry.term,
      subject: entry.subject,
      medium: entry.medium || "English",
      teacherId: entry.teacherId,
      classLink: entry.classLink,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      validFrom: entry.validFrom.split("T")[0],
      validUntil: entry.validUntil.split("T")[0],
      recurring: entry.recurring,
      recurrencePattern: entry.recurrencePattern || "WEEKLY",
      roomNumber: entry.roomNumber || "",
      color: entry.color || SUBJECT_COLORS[0],
      notes: entry.notes || "",
    });
    setIsFormOpen(true);
  };

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      const dayOfWeek = getDay(start);
      const startTime = format(start, "HH:mm");
      const endTime = format(end, "HH:mm");

      setFormData((prev) => ({
        ...prev,
        dayOfWeek,
        startTime,
        endTime,
      }));
      setIsFormOpen(true);
    },
    []
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    handleEdit(event.entry);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const entryId = active.id as string;
    const entry = timetable.find((e) => e.id === entryId);
    if (!entry) return;

    // Handle drop logic here - update time/day based on where it was dropped
    toast.info("Drag-and-drop update coming soon!");
  };

  const resetForm = () => {
    setEditingEntry(null);
    setFormData({
      grade: selectedGrade,
      academicYear: selectedYear,
      term: selectedTerm,
      subject: "",
      medium: "English",
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
      recurrencePattern: "WEEKLY",
      roomNumber: "",
      color: SUBJECT_COLORS[0],
      notes: "",
    });
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const style = {
      backgroundColor: event.entry.color || "#3b82f6",
      borderRadius: "5px",
      opacity: 0.9,
      color: "white",
      border: "0px",
      display: "block",
    };
    return { style };
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Timetable Management</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage class schedules with interactive calendar and Gantt chart
                views
              </p>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Grade</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>
                      Grade {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Academic Year</Label>
              <Input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Term</Label>
              <Select
                value={selectedTerm.toString()}
                onValueChange={(v) => setSelectedTerm(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((t) => (
                    <SelectItem key={t} value={t.toString()}>
                      Term {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>View Mode</Label>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "calendar" ? "default" : "outline"}
                  onClick={() => setViewMode("calendar")}
                  className="flex-1"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
                <Button
                  variant={viewMode === "gantt" ? "default" : "outline"}
                  onClick={() => setViewMode("gantt")}
                  className="flex-1"
                >
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Gantt
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  onClick={() => setViewMode("list")}
                  className="flex-1"
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : viewMode === "calendar" ? (
            <div className="h-[700px]">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                className="h-full"
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                selectable
                eventPropGetter={eventStyleGetter}
                views={[Views.WEEK, Views.DAY, Views.AGENDA]}
                defaultView={Views.WEEK}
                step={30}
                showMultiDayTimes
                min={new Date(2024, 0, 1, 6, 0)}
                max={new Date(2024, 0, 1, 20, 0)}
              />
            </div>
          ) : viewMode === "gantt" ? (
            <GanttView
              entries={timetable}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <ListView
              entries={timetable}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Timetable Entry" : "Add Timetable Entry"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subject *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Teacher *</Label>
                <Select
                  value={formData.teacherId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, teacherId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers
                      .filter((t) => t.id)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.firstName} {t.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Day of Week *</Label>
                <Select
                  value={formData.dayOfWeek.toString()}
                  onValueChange={(v) =>
                    setFormData({ ...formData, dayOfWeek: Number(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Room Number</Label>
                <Input
                  value={formData.roomNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, roomNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Start Time *</Label>
                <Select
                  value={formData.startTime}
                  onValueChange={(v) =>
                    setFormData({ ...formData, startTime: v })
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
                <Label>End Time *</Label>
                <Select
                  value={formData.endTime}
                  onValueChange={(v) =>
                    setFormData({ ...formData, endTime: v })
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
                <Label>Class Link</Label>
                <Input
                  value={formData.classLink}
                  onChange={(e) =>
                    setFormData({ ...formData, classLink: e.target.value })
                  }
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2">
                  {SUBJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      title={`Select color ${color}`}
                      aria-label={`Select color ${color}`}
                      className={cn(
                        styles.colorButton,
                        formData.color === color
                          ? "border-black"
                          : "border-gray-300"
                      )}
                      // Dynamic color value requires inline style
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingEntry ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Gantt View Component
const GanttView: React.FC<{
  entries: TimetableEntry[];
  onEdit: (entry: TimetableEntry) => void;
  onDelete: (id: string) => void;
}> = ({ entries, onEdit, onDelete }) => {
  const entriesByDay = useMemo(() => {
    const grouped: Record<number, TimetableEntry[]> = {};
    entries.forEach((entry) => {
      if (!grouped[entry.dayOfWeek]) {
        grouped[entry.dayOfWeek] = [];
      }
      grouped[entry.dayOfWeek].push(entry);
    });
    Object.values(grouped).forEach((dayEntries) => {
      dayEntries.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return grouped;
  }, [entries]);

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const calculatePosition = (startTime: string, endTime: string) => {
    const dayStart = 6 * 60; // 6 AM
    const dayEnd = 20 * 60; // 8 PM
    const totalMinutes = dayEnd - dayStart;

    const start = timeToMinutes(startTime) - dayStart;
    const duration = timeToMinutes(endTime) - timeToMinutes(startTime);

    const left = (start / totalMinutes) * 100;
    const width = (duration / totalMinutes) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b">
        <Clock className="h-4 w-4" />
        <span>Timeline: 6:00 AM - 8:00 PM</span>
      </div>
      {DAYS_OF_WEEK.map((day, idx) => (
        <div key={idx} className="space-y-2">
          <div className="font-semibold text-sm">{day}</div>
          <div className="relative h-16 bg-muted rounded-lg border">
            {/* Time markers */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: 15 }, (_, i) => (
                <div
                  key={i}
                  className="flex-1 border-r border-gray-200 text-xs text-gray-400 p-1"
                >
                  {i === 0 && "6AM"}
                  {i === 7 && "1PM"}
                  {i === 14 && "8PM"}
                </div>
              ))}
            </div>
            {/* Entries */}
            {entriesByDay[idx]?.map((entry) => {
              const pos = calculatePosition(entry.startTime, entry.endTime);
              return (
                <div
                  key={entry.id}
                  className="absolute top-2 bottom-2 rounded px-2 py-1 text-white text-xs flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                  // Dynamic positioning and color require inline styles
                  style={{
                    left: pos.left,
                    width: pos.width,
                    backgroundColor: entry.color || "#3b82f6",
                  }}
                  onClick={() => onEdit(entry)}
                >
                  <span className="truncate">
                    {getDisplayName(entry.subject)}
                  </span>
                  <span className="text-[10px] ml-1">{entry.startTime}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// List View Component
const ListView: React.FC<{
  entries: TimetableEntry[];
  onEdit: (entry: TimetableEntry) => void;
  onDelete: (id: string) => void;
}> = ({ entries, onEdit, onDelete }) => {
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [entries]);

  return (
    <div className="space-y-2">
      {sortedEntries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted transition-colors"
        >
          {/* Dynamic color value requires inline style */}
          <div
            className="w-1 h-16 rounded"
            style={{ backgroundColor: entry.color || "#3b82f6" }}
          />
          <div className="flex-1 grid grid-cols-5 gap-4">
            <div>
              <div className="text-sm font-semibold">
                {getDisplayName(entry.subject)}
              </div>
              <div className="text-xs text-muted-foreground">
                {entry.teacher?.firstName || ""}{" "}
                {entry.teacher?.lastName || "Unknown"}
              </div>
            </div>
            <div className="text-sm">
              <div className="font-medium">{DAYS_OF_WEEK[entry.dayOfWeek]}</div>
              <div className="text-xs text-muted-foreground">
                {entry.startTime} - {entry.endTime}
              </div>
            </div>
            <div className="text-sm">
              <Badge variant="outline">{entry.roomNumber || "No Room"}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Grade {getDisplayName(entry.grade)} | Term {entry.term}
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => onEdit(entry)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(entry.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      {sortedEntries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No timetable entries found
        </div>
      )}
    </div>
  );
};

export default TimetableManagement;
