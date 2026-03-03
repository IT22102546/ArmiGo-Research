"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  dateFnsLocalizer,
  Event as RBCEvent,
  Views,
} from "react-big-calendar";
import { enUS } from "date-fns/locale";
import { format, getDay, parse, setHours, setMinutes, startOfWeek } from "date-fns";
import { ApiClient } from "@/lib/api/api-client";
import { useAuthStore } from "@/stores/auth-store";
import styles from "./timetable-management.module.css";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  CalendarClock,
  Building2,
  Users,
  Activity,
} from "lucide-react";

type Hospital = {
  id: string;
  name: string;
};

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  hospitalId?: string | null;
};

type Physiotherapist = {
  id: string;
  name: string;
  hospitalId?: string | null;
  isActive?: boolean;
};

type SessionRecord = {
  id: string;
  childId: string;
  physiotherapistId?: string | null;
  hospitalId?: string | null;
  admissionDate: string;
  startTime?: string | null;
  endTime?: string | null;
  status: string;
  notes?: string | null;
  clinic?: string | null;
  room?: string | null;
  child?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  physiotherapist?: {
    id: string;
    name: string;
  } | null;
  hospital?: {
    id: string;
    name: string;
  } | null;
};

type CalendarEvent = RBCEvent & {
  id: string;
  session: SessionRecord;
};

type SessionForm = {
  hospitalId: string;
  childId: string;
  physiotherapistId: string;
  admissionDate: string;
  startTime: string;
  endTime: string;
  clinic: string;
  room: string;
  meetingLink: string;
  notes: string;
};

const initialForm: SessionForm = {
  hospitalId: "",
  childId: "",
  physiotherapistId: "",
  admissionDate: new Date().toISOString().split("T")[0],
  startTime: "",
  endTime: "",
  clinic: "",
  room: "",
  meetingLink: "",
  notes: "",
};

const getStatusBadgeVariant = (status: string) => {
  if (status === "ONGOING") return "default" as const;
  if (status === "SCHEDULED") return "secondary" as const;
  if (status === "ATTENDED_COMPLETE") return "default" as const;
  if (status === "ABSENT_INCOMPLETE") return "destructive" as const;
  return "outline" as const;
};

const formatStatus = (status: string) =>
  status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

const parseMeetingLinkFromNotes = (notes?: string | null) => {
  if (!notes) return "";
  const lines = notes.split("\n");
  const line = lines.find((item) => item.startsWith("Meeting Link:"));
  if (!line) return "";
  return line.replace("Meeting Link:", "").trim();
};

const stripMeetingLinkFromNotes = (notes?: string | null) => {
  if (!notes) return "";
  return notes
    .split("\n")
    .filter((item) => !item.startsWith("Meeting Link:"))
    .join("\n")
    .trim();
};

const composeNotes = (meetingLink: string, notes: string) => {
  const trimmedLink = meetingLink.trim();
  const trimmedNotes = notes.trim();

  if (trimmedLink && trimmedNotes) {
    return `Meeting Link: ${trimmedLink}\n${trimmedNotes}`;
  }
  if (trimmedLink) {
    return `Meeting Link: ${trimmedLink}`;
  }
  return trimmedNotes || undefined;
};

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

const mergeDateAndTime = (admissionDate: string, timeValue?: string | null) => {
  const base = new Date(admissionDate);
  const [hourText, minuteText] = (timeValue || "00:00").split(":");
  const hours = Number(hourText || 0);
  const minutes = Number(minuteText || 0);
  return setMinutes(setHours(base, hours), minutes);
};

const timeToMinutes = (timeValue: string) => {
  const [hourText, minuteText] = (timeValue || "").split(":");
  const hours = Number(hourText || 0);
  const minutes = Number(minuteText || 0);
  return hours * 60 + minutes;
};

const SessionCalendarEvent = ({ event }: { event: CalendarEvent }) => {
  const childName = event.session.child
    ? `${event.session.child.firstName} ${event.session.child.lastName}`
    : "Child";
  const physioName = event.session.physiotherapist?.name || "Physiotherapist";
  const timeRange = `${format(event.start, "hh:mm a")} - ${format(event.end, "hh:mm a")}`;
  const meetingLink = parseMeetingLinkFromNotes(event.session.notes);

  return (
    <div
      className={styles.calendarEventCard}
      title={`${childName} | ${physioName} | ${timeRange}${meetingLink ? ` | ${meetingLink}` : ""}`}
    >
      <div className={styles.calendarEventTime}>{timeRange}</div>
      <div className={styles.calendarEventTitle}>{childName} • {physioName}</div>
    </div>
  );
};

export default function TimetableManagement() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const roles = Array.isArray((user as any)?.roles)
    ? ((user as any).roles as string[])
    : [user?.role].filter(Boolean);
  const isHospitalScopedUser =
    roles.includes("HOSPITAL_ADMIN") && user?.email !== "armigo@gmail.com";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarInitialized, setCalendarInitialized] = useState(false);
  const [calendarView, setCalendarView] = useState<
    "week" | "day" | "agenda"
  >(Views.WEEK);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selected, setSelected] = useState<SessionRecord | null>(null);
  const [viewingSession, setViewingSession] = useState<SessionRecord | null>(null);
  const [formData, setFormData] = useState<SessionForm>(initialForm);

  const hospitalContextId = selectedHospitalId;

  const { data: hospitals = [] } = useQuery({
    queryKey: ["online-session-schedule", "hospitals"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/patients/locations/hospitals");
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload || [];
      return Array.isArray(list) ? list : [];
    },
  });

  const { data: children = [] } = useQuery({
    queryKey: ["online-session-schedule", "children", hospitalContextId],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/patients", {
        params: {
          limit: 1000,
          hospitalId: hospitalContextId || undefined,
        },
      });
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload || [];
      return Array.isArray(list) ? list : [];
    },
  });

  const { data: physiotherapists = [] } = useQuery({
    queryKey: ["online-session-schedule", "physiotherapists", hospitalContextId],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/patients/locations/physiotherapists", {
        params: {
          hospitalId: hospitalContextId || undefined,
        },
      });
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload || [];
      return Array.isArray(list) ? list : [];
    },
  });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: [
      "online-session-schedule",
      "records",
      search,
      statusFilter,
      hospitalContextId,
    ],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/patients/management/admissions", {
        params: {
          hospitalId: hospitalContextId || undefined,
          search: search || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          admissionType: "ONLINE",
        },
      });
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload || [];
      return Array.isArray(list) ? list : [];
    },
  });

  useEffect(() => {
    if (hospitals.length === 0) return;

    if (isHospitalScopedUser) {
      const scopedHospital = hospitals[0]?.id || "";
      setSelectedHospitalId(scopedHospital);
      setFormData((prev) => ({
        ...prev,
        hospitalId: scopedHospital || prev.hospitalId,
      }));
      return;
    }

    if (!selectedHospitalId) {
      setSelectedHospitalId("");
    }
  }, [hospitals, isHospitalScopedUser]);

  const activePhysiotherapists = useMemo(
    () =>
      physiotherapists.filter(
        (physio: Physiotherapist) => physio.isActive !== false
      ),
    [physiotherapists]
  );

  const filteredChildren = useMemo(() => {
    if (!formData.hospitalId) return children;
    return children.filter((child: Child) => child.hospitalId === formData.hospitalId);
  }, [children, formData.hospitalId]);

  const filteredPhysiotherapists = useMemo(() => {
    if (!formData.hospitalId) return activePhysiotherapists;
    return activePhysiotherapists.filter(
      (physio: Physiotherapist) => physio.hospitalId === formData.hospitalId
    );
  }, [activePhysiotherapists, formData.hospitalId]);

  const stats = useMemo(() => {
    return {
      total: sessions.length,
      scheduled: sessions.filter((item: SessionRecord) => item.status === "SCHEDULED")
        .length,
      ongoing: sessions.filter((item: SessionRecord) => item.status === "ONGOING").length,
      physiotherapists: new Set(
        sessions
          .map((item: SessionRecord) => item.physiotherapistId)
          .filter(Boolean)
      ).size,
    };
  }, [sessions]);

  useEffect(() => {
    if (calendarInitialized || sessions.length === 0) return;

    const sortedByDate = [...sessions].sort(
      (a: SessionRecord, b: SessionRecord) =>
        new Date(a.admissionDate).getTime() - new Date(b.admissionDate).getTime()
    );

    const nextSession =
      sortedByDate.find(
        (item: SessionRecord) => new Date(item.admissionDate).getTime() >= new Date().setHours(0, 0, 0, 0)
      ) || sortedByDate[0];

    if (nextSession?.admissionDate) {
      setCalendarDate(new Date(nextSession.admissionDate));
    }

    setCalendarInitialized(true);
  }, [sessions, calendarInitialized]);

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    return sessions
      .filter((session: SessionRecord) => session.admissionDate && session.startTime && session.endTime)
      .map((session: SessionRecord) => {
        const childName = session.child
          ? `${session.child.firstName} ${session.child.lastName}`
          : "Child";
        const physioName = session.physiotherapist?.name || "Physiotherapist";

        return {
          id: session.id,
          title: `${childName} • ${physioName}`,
          start: mergeDateAndTime(session.admissionDate, session.startTime),
          end: mergeDateAndTime(session.admissionDate, session.endTime),
          session,
          allDay: false,
        };
      });
  }, [sessions]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.session.status;
    const backgroundColor =
      status === "ONGOING"
        ? "hsl(var(--primary))"
        : status === "ATTENDED_COMPLETE"
          ? "hsl(var(--secondary))"
          : status === "ABSENT_INCOMPLETE"
            ? "hsl(var(--destructive))"
            : "hsl(var(--foreground))";

    return {
      style: {
        backgroundColor,
        borderRadius: "8px",
        border: "1px solid hsl(var(--border))",
        color: "hsl(var(--primary-foreground))",
        fontSize: "12px",
        padding: "6px 8px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.20)",
        overflow: "hidden",
      },
    };
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => ApiClient.post("/patients/management/admissions", payload),
    onSuccess: () => {
      toast.success("Online session scheduled successfully");
      queryClient.invalidateQueries({ queryKey: ["online-session-schedule"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to schedule session");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      ApiClient.put(`/patients/management/admissions/${id}`, payload),
    onSuccess: () => {
      toast.success("Online session updated successfully");
      queryClient.invalidateQueries({ queryKey: ["online-session-schedule"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update session");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiClient.delete(`/patients/management/admissions/${id}`),
    onSuccess: () => {
      toast.success("Session deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["online-session-schedule"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete session");
    },
  });

  const handleOpenCreate = () => {
    setSelected(null);
    setFormData({
      ...initialForm,
      hospitalId: selectedHospitalId || "",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (record: SessionRecord) => {
    setSelected(record);
    setFormData({
      hospitalId: record.hospitalId || selectedHospitalId || "",
      childId: record.childId || "",
      physiotherapistId: record.physiotherapistId || "",
      admissionDate: record.admissionDate
        ? new Date(record.admissionDate).toISOString().split("T")[0]
        : initialForm.admissionDate,
      startTime: record.startTime || "",
      endTime: record.endTime || "",
      clinic: record.clinic || "",
      room: record.room || "",
      meetingLink: parseMeetingLinkFromNotes(record.notes),
      notes: stripMeetingLinkFromNotes(record.notes),
    });
    setDialogOpen(true);
  };

  const handleOpenView = (record: SessionRecord) => {
    setViewingSession(record);
    setViewDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelected(null);
    setFormData(initialForm);
  };

  const handleCloseView = () => {
    setViewDialogOpen(false);
    setViewingSession(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !formData.hospitalId ||
      !formData.childId ||
      !formData.physiotherapistId ||
      !formData.admissionDate ||
      !formData.startTime ||
      !formData.endTime
    ) {
      toast.error(
        "Hospital, child, physiotherapist, date, start time and end time are required"
      );
      return;
    }

    const latestAllowedMinutes = 21 * 60;
    const startMinutes = timeToMinutes(formData.startTime);
    const endMinutes = timeToMinutes(formData.endTime);

    if (startMinutes >= latestAllowedMinutes) {
      toast.error("Start time must be before 09:00 PM");
      return;
    }

    if (endMinutes > latestAllowedMinutes) {
      toast.error("End time cannot be after 09:00 PM");
      return;
    }

    const payload = {
      childId: formData.childId,
      physiotherapistId: formData.physiotherapistId,
      hospitalId: formData.hospitalId,
      admissionDate: formData.admissionDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      clinic: formData.clinic || "Online Session",
      room: formData.room || undefined,
      notes: composeNotes(formData.meetingLink, formData.notes),
      admissionType: "ONLINE",
      status: "SCHEDULED",
    };

    if (selected) {
      updateMutation.mutate({ id: selected.id, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Sessions & Scheduling</p>
          <h1 className="text-2xl font-semibold">Online Physiotherapy Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule online therapy sessions by hospital, physiotherapist, and child.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Online Session
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-semibold">{stats.scheduled}</p>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ongoing</p>
                <p className="text-2xl font-semibold">{stats.ongoing}</p>
              </div>
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Physiotherapists</p>
                <p className="text-2xl font-semibold">{stats.physiotherapists}</p>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Session Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select
              value={selectedHospitalId || "ALL"}
              onValueChange={(value) => setSelectedHospitalId(value === "ALL" ? "" : value)}
              disabled={isHospitalScopedUser}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select hospital" />
              </SelectTrigger>
              <SelectContent>
                {!isHospitalScopedUser ? <SelectItem value="ALL">All hospitals</SelectItem> : null}
                {hospitals.map((hospital: Hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search child, physiotherapist..."
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="ONGOING">Ongoing</SelectItem>
                <SelectItem value="FINISHED">Finished</SelectItem>
                <SelectItem value="ATTENDED_COMPLETE">Attended + Complete</SelectItem>
                <SelectItem value="ABSENT_INCOMPLETE">Absent + Incomplete</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center md:justify-end">
              {isHospitalScopedUser ? (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  Hospital scoped view
                </span>
              ) : (
                <span>Super Admin View</span>
              )}
            </div>
          </div>

          <div className="rounded-md border p-3 bg-background">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-secondary" /> Scheduled
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Ongoing
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-secondary" /> Attended
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Absent
              </span>
            </div>
            <div className={styles.calendarContainer}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                date={calendarDate}
                onNavigate={(date) => {
                  setCalendarDate(date);
                  setCalendarInitialized(true);
                }}
                view={calendarView}
                onView={(nextView) =>
                  setCalendarView(nextView as "week" | "day" | "agenda")
                }
                views={[Views.WEEK, Views.DAY, Views.AGENDA]}
                defaultView={Views.WEEK}
                startAccessor="start"
                endAccessor="end"
                components={{
                  event: SessionCalendarEvent,
                }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) => handleOpenView((event as CalendarEvent).session)}
                min={new Date(2025, 1, 1, 6, 0)}
                max={new Date(2025, 1, 1, 21, 0)}
                step={30}
                timeslots={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Session List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Child</TableHead>
                  <TableHead>Physiotherapist</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Loading sessions...
                    </TableCell>
                  </TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No sessions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((record: SessionRecord) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.hospital?.name || "-"}</TableCell>
                      <TableCell className="font-medium">
                        {record.child
                          ? `${record.child.firstName} ${record.child.lastName}`
                          : "-"}
                      </TableCell>
                      <TableCell>{record.physiotherapist?.name || "-"}</TableCell>
                      <TableCell>{new Date(record.admissionDate).toLocaleDateString()}</TableCell>
                      <TableCell>{record.startTime || "-"}</TableCell>
                      <TableCell>{record.endTime || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {formatStatus(record.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenView(record)}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(record)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(record.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-3xl h-[90dvh] max-h-[90dvh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle>{selected ? "Update Online Session" : "Add Online Session"}</DialogTitle>
          </DialogHeader>

          <form
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 px-6 pb-6 pt-4"
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isHospitalScopedUser ? (
                <div className="space-y-2">
                  <Label>Hospital</Label>
                  <Select
                    value={formData.hospitalId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        hospitalId: value,
                        childId: "",
                        physiotherapistId: "",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals.map((hospital: Hospital) => (
                        <SelectItem key={hospital.id} value={hospital.id}>
                          {hospital.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-2 md:col-span-2">
                <Label>Child</Label>
                <Select
                  value={formData.childId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, childId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredChildren.map((child: Child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.firstName} {child.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Physiotherapist</Label>
                <Select
                  value={formData.physiotherapistId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, physiotherapistId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select physiotherapist" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPhysiotherapists.map((physio: Physiotherapist) => (
                      <SelectItem key={physio.id} value={physio.id}>
                        {physio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.admissionDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, admissionDate: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  max="20:59"
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  max="21:00"
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Online Meeting Link</Label>
                <Input
                  value={formData.meetingLink}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, meetingLink: e.target.value }))
                  }
                  placeholder="https://meet.google.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label>Clinic / Session Type</Label>
                <Input
                  value={formData.clinic}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, clinic: e.target.value }))
                  }
                  placeholder="Online Neuro Rehab"
                />
              </div>

              <div className="space-y-2">
                <Label>Room / Virtual Room</Label>
                <Input
                  value={formData.room}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, room: e.target.value }))
                  }
                  placeholder="Virtual Room A"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional therapy instructions"
                rows={4}
              />
            </div>

            <DialogFooter className="pt-3 border-t bg-background">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {selected ? "Update Session" : "Create Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl h-[85dvh] max-h-[85dvh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle>Online Session Details</DialogTitle>
          </DialogHeader>

          {viewingSession ? (
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 px-6 pb-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Hospital</Label>
                  <p className="text-sm">{viewingSession.hospital?.name || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <div>
                    <Badge variant={getStatusBadgeVariant(viewingSession.status)}>
                      {formatStatus(viewingSession.status)}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Child</Label>
                  <p className="text-sm">
                    {viewingSession.child
                      ? `${viewingSession.child.firstName} ${viewingSession.child.lastName}`
                      : "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Physiotherapist</Label>
                  <p className="text-sm">{viewingSession.physiotherapist?.name || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label>Date</Label>
                  <p className="text-sm">
                    {new Date(viewingSession.admissionDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Time</Label>
                  <p className="text-sm">
                    {viewingSession.startTime || "-"} - {viewingSession.endTime || "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Meeting Link</Label>
                {parseMeetingLinkFromNotes(viewingSession.notes) ? (
                  <a
                    href={parseMeetingLinkFromNotes(viewingSession.notes)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline break-all"
                  >
                    {parseMeetingLinkFromNotes(viewingSession.notes)}
                  </a>
                ) : (
                  <p className="text-sm">-</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Notes</Label>
                <p className="text-sm whitespace-pre-wrap">
                  {stripMeetingLinkFromNotes(viewingSession.notes) || "-"}
                </p>
              </div>
            </div>
          ) : null}

          <DialogFooter className="px-6 py-3 border-t bg-background">
            <Button type="button" variant="outline" onClick={handleCloseView}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
