import React, { useState, useEffect } from "react";
import { getDisplayName } from "@/lib/utils/display";
import { asApiError } from "@/lib/error-handling";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Video,
  Play,
  Users,
  Loader2,
  X,
  StopCircle,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { videoApi, VideoSession } from "@/lib/api/endpoints/video";
import { classesApi } from "@/lib/api/endpoints/classes";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { format } from "date-fns";

interface Class {
  id: string;
  name: string;
  subject: string | { id: string; name: string; code?: string };
  grade: string | { id: string; name: string; code?: string };
}

function SeminarManagement() {
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<VideoSession | null>(
    null
  );
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchSessions();
    fetchClasses();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await videoApi.getSessions();
      const sessionsData = response?.sessions || response || [];
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } catch (error) {
      toast.error("Failed to load video sessions");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classesApi.getAll();
      const classesData = response?.classes || response || [];
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      setClasses([]);
    }
  };

  const resetForm = () => {
    setTitle("");
    setClassId("");
    setScheduledDate("");
    setScheduledTime("");
    setDescription("");
    setFormError("");
  };

  const handleAddSession = async () => {
    if (!title.trim() || !classId) {
      setFormError("Please fill in title and select a class");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const scheduledAt =
        scheduledDate && scheduledTime
          ? `${scheduledDate}T${scheduledTime}:00Z`
          : undefined;

      await videoApi.createSession({
        classId,
        title,
        description: description || undefined,
        scheduledAt,
      });

      toast.success("Video session created successfully");
      resetForm();
      setShowAddModal(false);
      fetchSessions();
    } catch (error) {
      const errorMessage =
        asApiError(error)?.response?.data?.message ||
        "Failed to create session";
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSession) return;

    try {
      setSubmitting(true);
      await videoApi.deleteSession(selectedSession.id);
      toast.success("Session deleted successfully");
      setShowDeleteModal(false);
      setSelectedSession(null);
      fetchSessions();
    } catch (error) {
      const errorMessage =
        asApiError(error)?.response?.data?.message ||
        "Failed to delete session";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      await videoApi.startSession(sessionId);
      toast.success("Session started successfully");
      fetchSessions();
    } catch (error) {
      toast.error(
        asApiError(error)?.response?.data?.message || "Failed to start session"
      );
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      await videoApi.endSession(sessionId);
      toast.success("Session ended successfully");
      fetchSessions();
    } catch (error) {
      toast.error(
        asApiError(error)?.response?.data?.message || "Failed to end session"
      );
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    try {
      const displayName =
        `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() ||
        currentUser?.email ||
        "User";
      const response = await videoApi.joinSession(sessionId, { displayName });

      if (response?.meetingUrl) {
        window.open(response.meetingUrl, "_blank");
      } else {
        toast.error("Meeting URL not available");
      }
    } catch (error) {
      toast.error(
        asApiError(error)?.response?.data?.message || "Failed to join session"
      );
    }
  };

  const openDeleteModal = (session: VideoSession) => {
    setSelectedSession(session);
    setShowDeleteModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.class?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getDisplayName(session.class?.subject)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      session.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      SCHEDULED: "bg-blue-100 text-blue-800",
      ACTIVE: "bg-green-100 text-green-800",
      ENDED: "bg-muted text-muted-foreground",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || "bg-muted"}>
        {status}
      </Badge>
    );
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Not scheduled";
    try {
      return format(new Date(dateString), "MMM dd, yyyy hh:mm a");
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading video sessions...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Video className="w-6 h-6" />
                Video Sessions
              </CardTitle>
              <CardDescription>
                Manage video conference sessions
              </CardDescription>
            </div>
            <Button onClick={openAddModal} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Session
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Scheduled At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No video sessions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {session.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {session.class?.name || "N/A"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {getDisplayName(session.class?.subject)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDateTime(session.scheduledAt)}
                      </TableCell>
                      <TableCell>{getStatusBadge(session.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{session.participants || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {session.status === "SCHEDULED" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleStartSession(session.id)}
                              title="Start session"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          {session.status === "ACTIVE" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleJoinSession(session.id)}
                                title="Join session"
                              >
                                <Users className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEndSession(session.id)}
                                title="End session"
                              >
                                <StopCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteModal(session)}
                            title="Delete session"
                          >
                            <Trash className="w-4 h-4" />
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

      {/* Add Session Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Video Session</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => setShowAddModal(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formError && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="add-title">Session Title *</Label>
              <Input
                id="add-title"
                placeholder="Enter session title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-class">Class *</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger id="add-class">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes
                    .filter((cls) => cls.id)
                    .map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {getDisplayName(cls.subject)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-date">Date</Label>
                <Input
                  id="add-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-time">Time</Label>
                <Input
                  id="add-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-description">Description</Label>
              <Textarea
                id="add-description"
                placeholder="Session description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSession} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Session"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Session Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete{" "}
              <strong>{selectedSession?.title}</strong>? This action cannot be
              undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSession}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SeminarManagement;
