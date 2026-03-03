"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, BadgeVariant } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Eye, Calendar, Filter, Pencil, Trash2, Bell, Send, Activity } from "lucide-react";
import { notificationsApi } from "@/lib/api/endpoints";
import type { Notification } from "@/lib/api/endpoints/notifications";
import { handleApiError } from "@/lib/error-handling";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { ApiClient } from "@/lib/api/api-client";

export default function NotificationsOverviewPage() {
  const user = useAuthStore((state) => state.user);
  const userRoles = Array.isArray((user as any)?.roles)
    ? ((user as any).roles as string[])
    : ([user?.role].filter(Boolean) as string[]);
  const isHospitalScopedUser =
    userRoles.includes("HOSPITAL_ADMIN") && user?.email !== "armigo@gmail.com";
  const [scopedHospital, setScopedHospital] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [patients, setPatients] = useState<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      parentUserId: string | null;
      parentName: string | null;
      hospitalId: string | null;
      hospitalName: string | null;
    }>
  >([]);
  const [hospitals, setHospitals] = useState<
    Array<{
      id: string;
      name: string;
      adminUserId: string | null;
      adminName: string | null;
    }>
  >([]);
  const [sending, setSending] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [sendForm, setSendForm] = useState({
    title: "",
    message: "",
    type: "GENERAL",
    audienceScope: "DEFAULT" as "DEFAULT" | "HOSPITAL_ONLY",
    patientIds: [] as string[],
    hospitalIds: [] as string[],
  });

  const [editForm, setEditForm] = useState({
    title: "",
    message: "",
    type: "GENERAL",
    status: "UNREAD" as "UNREAD" | "READ" | "ARCHIVED",
  });
  const [bulkHospitalId, setBulkHospitalId] = useState<string>("ALL");

  useEffect(() => {
    if (!isHospitalScopedUser) return;

    let mounted = true;
    const loadHospitalScope = async () => {
      try {
        const profile = await ApiClient.get<any>("/users/profile");
        const payload = profile?.data ?? profile ?? {};
        const hospital = payload?.hospitalProfile?.hospital;
        if (!mounted || !hospital?.id) return;

        setScopedHospital({
          id: hospital.id,
          name: hospital.name || "Hospital",
        });
      } catch {
        // Keep page functional even if profile fetch fails.
      }
    };

    loadHospitalScope();
    return () => {
      mounted = false;
    };
  }, [isHospitalScopedUser]);

  const patientHospitals = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    const sourcePatients =
      isHospitalScopedUser && scopedHospital?.id
        ? patients.filter((patient) => patient.hospitalId === scopedHospital.id)
        : patients;

    sourcePatients.forEach((patient) => {
      if (!patient.hospitalId || !patient.hospitalName) return;
      const existing = map.get(patient.hospitalId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(patient.hospitalId, {
          id: patient.hospitalId,
          name: patient.hospitalName,
          count: 1,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const term = patientSearch.trim().toLowerCase();
    const sourcePatients =
      isHospitalScopedUser && scopedHospital?.id
        ? patients.filter((patient) => patient.hospitalId === scopedHospital.id)
        : patients;

    if (!term) {
      return sourcePatients;
    }

    return sourcePatients.filter((patient) => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const parentName = (patient.parentName || "").toLowerCase();
      const hospitalName = (patient.hospitalName || "").toLowerCase();
      return (
        fullName.includes(term) ||
        parentName.includes(term) ||
        hospitalName.includes(term)
      );
    });
  }, [patients, patientSearch, isHospitalScopedUser, scopedHospital?.id]);

  const scopedPatients = useMemo(() => {
    if (!isHospitalScopedUser || !scopedHospital?.id) {
      return patients;
    }
    return patients.filter((patient) => patient.hospitalId === scopedHospital.id);
  }, [patients, isHospitalScopedUser, scopedHospital?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [
    pagination.page,
    typeFilter,
    statusFilter,
    roleFilter,
    dateFrom,
    dateTo,
    searchTerm,
  ]);

  useEffect(() => {
    fetchTargetOptions();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getAllAdmin({
        page: pagination.page,
        limit: pagination.limit,
        type: typeFilter !== "ALL" ? typeFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: searchTerm || undefined,
      });

      const respAny: any = response;
      const notificationsArr = Array.isArray(respAny)
        ? respAny
        : (respAny.data ?? []);
      setNotifications(notificationsArr);
      setPagination((prev) => ({
        ...prev,
        total: respAny?.total ?? respAny?.pagination?.total ?? 0,
        pages:
          respAny?.pagination?.pages ??
          Math.ceil((respAny?.total ?? 0) / pagination.limit),
      }));
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTargetOptions = async () => {
    try {
      const response = await notificationsApi.getTargetOptions();
      const payload: any = response;
      setPatients(payload?.patients || []);
      setHospitals(payload?.hospitals || []);
    } catch (error) {
      handleApiError(error);
    }
  };

  const togglePatient = (id: string, checked: boolean) => {
    setSendForm((prev) => ({
      ...prev,
      patientIds: checked
        ? [...prev.patientIds, id]
        : prev.patientIds.filter((value) => value !== id),
    }));
  };

  const toggleHospital = (id: string, checked: boolean) => {
    setSendForm((prev) => ({
      ...prev,
      hospitalIds: checked
        ? [...prev.hospitalIds, id]
        : prev.hospitalIds.filter((value) => value !== id),
    }));
  };

  const selectAllPatients = () => {
    setSendForm((prev) => ({
      ...prev,
      patientIds: scopedPatients.map((patient) => patient.id),
    }));
  };

  const clearPatientSelection = () => {
    setSendForm((prev) => ({
      ...prev,
      patientIds: [],
    }));
  };

  const selectPatientsByHospital = (hospitalId: string) => {
    if (!hospitalId || hospitalId === "ALL") {
      return;
    }

    const hospitalPatientIds = patients
      .filter((patient) => patient.hospitalId === hospitalId)
      .map((patient) => patient.id);

    setSendForm((prev) => ({
      ...prev,
      patientIds: Array.from(new Set([...prev.patientIds, ...hospitalPatientIds])),
    }));
  };

  const handleSendNotification = async () => {
    if (!sendForm.title.trim() || !sendForm.message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    if (isHospitalScopedUser && !scopedHospital?.id) {
      toast.error("Hospital context not found for this account");
      return;
    }

    const effectiveHospitalIds = isHospitalScopedUser
      ? scopedHospital?.id
        ? [scopedHospital.id]
        : []
      : sendForm.hospitalIds;

    if (isHospitalScopedUser && sendForm.patientIds.length === 0) {
      toast.error("Select at least one child from your hospital");
      return;
    }

    if (sendForm.patientIds.length === 0 && effectiveHospitalIds.length === 0) {
      toast.error("Select at least one patient or hospital target");
      return;
    }

    try {
      setSending(true);
      const selectedHospitalAdminUserIds = hospitals
        .filter((hospital) => effectiveHospitalIds.includes(hospital.id))
        .map((hospital) => hospital.adminUserId)
        .filter((value): value is string => Boolean(value));

      if (
        sendForm.audienceScope === "HOSPITAL_ONLY" &&
        effectiveHospitalIds.length > 0 &&
        selectedHospitalAdminUserIds.length === 0
      ) {
        toast.error(
          "Selected hospitals have no linked hospital admin user account"
        );
        return;
      }

      const response: any = await notificationsApi.sendToTargets({
        title: sendForm.title,
        message: sendForm.message,
        type: sendForm.type,
        audienceScope: isHospitalScopedUser ? "DEFAULT" : sendForm.audienceScope,
        patientIds: sendForm.patientIds,
        hospitalIds: effectiveHospitalIds,
        hospitalAdminUserIds: selectedHospitalAdminUserIds,
      });

      toast.success(
        response?.message ||
          `Notification sent to ${response?.sent || 0} recipient(s)`
      );

      setSendForm({
        title: "",
        message: "",
        type: "GENERAL",
        audienceScope: "DEFAULT",
        patientIds: [],
        hospitalIds: [],
      });

      setStatusFilter("ALL");
      setRoleFilter("ALL");
      setTypeFilter("ALL");
      setSearchTerm("");
      setDateFrom("");
      setDateTo("");
      setPagination((prev) => ({ ...prev, page: 1 }));

      fetchNotifications();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSending(false);
    }
  };

  const handleViewDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    setViewDialogOpen(true);
  };

  const handleOpenEdit = (notification: Notification) => {
    setSelectedNotification(notification);
    setEditForm({
      title: notification.title,
      message: notification.message,
      type: notification.type || "GENERAL",
      status: (notification.status || "UNREAD") as "UNREAD" | "READ" | "ARCHIVED",
    });
    setEditDialogOpen(true);
  };

  const handleUpdateNotification = async () => {
    if (!selectedNotification) return;
    try {
      await notificationsApi.updateAdmin(selectedNotification.id, {
        title: editForm.title,
        message: editForm.message,
        type: editForm.type,
        status: editForm.status,
        isRead: editForm.status === "READ",
      });
      toast.success("Notification updated successfully");
      setEditDialogOpen(false);
      setSelectedNotification(null);
      fetchNotifications();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleDeleteNotification = async () => {
    if (!selectedNotification) return;
    try {
      await notificationsApi.deleteAdmin(selectedNotification.id);
      toast.success("Notification deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedNotification(null);
      fetchNotifications();
    } catch (error) {
      handleApiError(error);
    }
  };

  const getTypeColor = (type: string): BadgeVariant => {
    switch (type) {
      case "SYSTEM":
        return "destructive";
      case "CLASS_UPDATE":
        return "default";
      case "EXAM_REMINDER":
        return "secondary";
      case "PAYMENT_UPDATE":
        return "success";
      case "GRADE_RELEASED":
        return "warning";
      case "ANNOUNCEMENT":
        return "outline";
      case "CHAT_MESSAGE":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string): BadgeVariant => {
    switch (status) {
      case "UNREAD":
        return "default";
      case "READ":
        return "secondary";
      case "ARCHIVED":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">System Notifications</h1>
          <p className="text-sm text-muted-foreground">
            View and monitor all sent notifications for debugging and support
          </p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Send className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold">
              {isHospitalScopedUser
                ? `Send Notification (${scopedHospital?.name || "Hospital"})`
                : "Send Notification (Super Admin)"}
            </h3>
          </div>
            <p className="text-sm text-muted-foreground">
              {isHospitalScopedUser
                ? "Select patients from your hospital. Notifications will be restricted to your hospital audience."
                : "Select patients and/or hospitals. Parents of selected patients and admins of selected hospitals will receive this notification."}
            </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input
                value={sendForm.title}
                onChange={(e) =>
                  setSendForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Notification title"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={sendForm.type}
                onValueChange={(value) =>
                  setSendForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                  <SelectItem value="SYSTEM">System</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isHospitalScopedUser ? (
            <div>
              <Label>Audience Scope</Label>
              <Select
                value={sendForm.audienceScope}
                onValueChange={(value: "DEFAULT" | "HOSPITAL_ONLY") =>
                  setSendForm((prev) => ({ ...prev, audienceScope: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Audience scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEFAULT">Default (patients + hospitals)</SelectItem>
                  <SelectItem value="HOSPITAL_ONLY">Hospital only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div>
            <Label>Message</Label>
            <Textarea
              value={sendForm.message}
              onChange={(e) =>
                setSendForm((prev) => ({ ...prev, message: e.target.value }))
              }
              rows={3}
              placeholder="Notification message"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-md p-3">
              <Label className="mb-2 block">Patients (notify parents)</Label>
              <Input
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder={
                  isHospitalScopedUser
                    ? "Search patient or parent"
                    : "Search patient, parent, or hospital"
                }
                className="mb-3"
              />
              <div className="flex flex-wrap gap-2 mb-3">
                <Button type="button" variant="outline" size="sm" onClick={selectAllPatients}>
                  Select All Patients
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearPatientSelection}
                >
                  Clear Patients
                </Button>
              </div>
              {!isHospitalScopedUser ? (
                <div className="flex gap-2 mb-3">
                  <Select value={bulkHospitalId} onValueChange={setBulkHospitalId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select hospital to add all patients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Select hospital...</SelectItem>
                      {patientHospitals.map((hospital) => (
                        <SelectItem key={hospital.id} value={hospital.id}>
                          {hospital.name} ({hospital.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => selectPatientsByHospital(bulkHospitalId)}
                  >
                    Add Hospital Patients
                  </Button>
                </div>
              ) : null}
              <div className="max-h-40 overflow-y-auto space-y-2">
                {filteredPatients.map((patient) => (
                  <div key={patient.id} className="flex items-start space-x-2">
                    <Checkbox
                      checked={sendForm.patientIds.includes(patient.id)}
                      onCheckedChange={(checked) =>
                        togglePatient(patient.id, Boolean(checked))
                      }
                    />
                    <div className="text-sm">
                      <div>
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Parent: {patient.parentName || "N/A"} • Hospital: {patient.hospitalName || "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredPatients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No patients found</p>
                ) : null}
              </div>
            </div>

            {!isHospitalScopedUser ? (
              <div className="border rounded-md p-3">
                <Label className="mb-2 block">Hospitals (notify hospital admins)</Label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {hospitals.map((hospital) => (
                    <div key={hospital.id} className="flex items-start space-x-2">
                      <Checkbox
                        checked={sendForm.hospitalIds.includes(hospital.id)}
                        onCheckedChange={(checked) =>
                          toggleHospital(hospital.id, Boolean(checked))
                        }
                      />
                      <div className="text-sm">
                        <div>{hospital.name}</div>
                        <div className="text-muted-foreground text-xs">
                          Admin: {hospital.adminName || "N/A"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSendNotification} disabled={sending}>
              {sending ? "Sending..." : "Send Notification"}
            </Button>
          </div>
        </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, message, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
                <SelectItem value="CLASS_UPDATE">Class Update</SelectItem>
                <SelectItem value="EXAM_REMINDER">Exam Reminder</SelectItem>
                <SelectItem value="PAYMENT_UPDATE">Payment Update</SelectItem>
                <SelectItem value="GRADE_RELEASED">Grade Released</SelectItem>
                <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                <SelectItem value="CHAT_MESSAGE">Chat Message</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="UNREAD">Unread</SelectItem>
                <SelectItem value="READ">Read</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="PARENT">Parent</SelectItem>
                <SelectItem value="HOSPITAL_ADMIN">Hospital Admin</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="dateFrom" className="text-sm">
                From Date
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="dateTo" className="text-sm">
                To Date
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setTypeFilter("ALL");
                setStatusFilter("ALL");
                setRoleFilter("ALL");
                setSearchTerm("");
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sent Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Message Preview</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Read At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}>
                        <div className="h-10 rounded-lg bg-muted animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : notifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="p-3 rounded-full bg-muted">
                          <Bell className="h-6 w-6" />
                        </div>
                        <p className="font-medium">No notifications found</p>
                        <p className="text-xs">Send a notification or adjust your filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
            ) : (
              notifications.map((notification) => (
                <TableRow
                  key={notification.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewDetail(notification)}
                >
                  <TableCell>
                    {notification.sentAt
                      ? new Date(notification.sentAt).toLocaleString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {notification.user ? (
                      <>
                        <div className="font-medium">
                          {notification.user.firstName}{" "}
                          {notification.user.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {notification.user.email}
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {notification.user?.role || "SYSTEM"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeColor(notification.type)}>
                      {notification.type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {notification.title}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {notification.message}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusColor(
                        notification.status || notification.isRead
                          ? "READ"
                          : "UNREAD"
                      )}
                    >
                      {notification.status ||
                        (notification.isRead ? "READ" : "UNREAD")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {notification.readAt
                      ? new Date(notification.readAt).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 hover:bg-sky-500/10 hover:text-sky-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(notification);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(notification);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNotification(notification);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {notifications.length} of {pagination.total} notifications
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
      </Card>

      {/* View Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
            <DialogDescription>
              <div className="flex gap-2 mt-2">
                <Badge variant={getTypeColor(selectedNotification?.type || "")}>
                  {selectedNotification?.type.replace("_", " ")}
                </Badge>
                <Badge
                  variant={getStatusColor(selectedNotification?.status || "")}
                >
                  {selectedNotification?.status}
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">User</h4>
              {selectedNotification?.user ? (
                <div>
                  <p className="font-medium">
                    {selectedNotification.user.firstName}{" "}
                    {selectedNotification.user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedNotification.user.email}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {selectedNotification.user.role}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  System notification
                </p>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Message</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {selectedNotification?.message}
              </p>
            </div>
            {selectedNotification?.data && (
              <div>
                <h4 className="font-semibold mb-2">Additional Data</h4>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                  {JSON.stringify(selectedNotification.data, null, 2)}
                </pre>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-1">Sent At</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedNotification?.sentAt
                    ? new Date(selectedNotification.sentAt).toLocaleString()
                    : "-"}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Read At</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedNotification?.readAt
                    ? new Date(selectedNotification.readAt).toLocaleString()
                    : "Not read yet"}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Notification</DialogTitle>
            <DialogDescription>Update notification content and status</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={editForm.message}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, message: e.target.value }))
                }
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Input
                  value={editForm.type}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, type: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: "UNREAD" | "READ" | "ARCHIVED") =>
                    setEditForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNREAD">Unread</SelectItem>
                    <SelectItem value="READ">Read</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateNotification}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Notification</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this notification?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteNotification}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
