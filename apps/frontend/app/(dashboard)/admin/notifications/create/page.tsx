"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Send,
  Users,
  Eye,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  Filter,
} from "lucide-react";
import { format } from "date-fns";

interface Grade {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  name: string;
  grade: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface PreviewUser {
  id: string;
  name: string;
  email: string;
}

export default function NotificationCreatePage() {
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("ANNOUNCEMENT");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Targeting state
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectedStudentTypes, setSelectedStudentTypes] = useState<string[]>(
    []
  );
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [teacherSearch, setTeacherSearch] = useState("");

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);
  const [previewUsers, setPreviewUsers] = useState<PreviewUser[]>([]);

  // Queries
  const { data: gradesData } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/admin/grades");
      return response?.grades || response?.data || [];
    },
  });

  const { data: batchesData } = useQuery({
    queryKey: ["batches", selectedGrades],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/batches", {
        params: {
          grades: selectedGrades.join(","),
        },
      });
      return response?.batches || response?.data || response || [];
    },
    enabled: selectedGrades.length > 0,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/subjects");
      return Array.isArray(response)
        ? response
        : response?.subjects || response?.data || [];
    },
  });

  const { data: teachersData } = useQuery({
    queryKey: ["teachers", teacherSearch],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/users/teachers", {
        params: {
          search: teacherSearch || undefined,
          limit: 50,
        },
      });
      return (
        response?.teachers ||
        response?.users ||
        response?.data ||
        response ||
        []
      );
    },
  });

  // Mutations
  const previewMutation = useMutation({
    mutationFn: (targeting: any) =>
      ApiClient.post("/notifications/admin/preview-targeting", targeting),
    onSuccess: (data: any) => {
      setRecipientCount(data.totalCount || 0);
      setPreviewUsers(data.users || []);
      setPreviewOpen(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to preview recipients",
        status: "error",
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (data: any) =>
      ApiClient.post("/notifications/admin/create-targeted", data),
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: `Notification sent to ${data.recipientCount} users`,
        status: "success",
      });
      // Reset form
      setTitle("");
      setMessage("");
      setSelectedGrades([]);
      setSelectedBatches([]);
      setSelectedSubjects([]);
      setSelectedTeachers([]);
      setSelectedStudentTypes([]);
      setSelectedRoles([]);
      setScheduleDate("");
      setScheduleTime("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        status: "error",
      });
    },
  });

  const grades = Array.isArray(gradesData) ? gradesData : [];
  const batches = Array.isArray(batchesData) ? batchesData : [];
  const subjects = Array.isArray(subjectsData) ? subjectsData : [];
  const teachers = Array.isArray(teachersData) ? teachersData : [];

  const notificationTypes = [
    { value: "ANNOUNCEMENT", label: "Announcement" },
    { value: "CLASS_UPDATE", label: "Class Update" },
    { value: "EXAM_REMINDER", label: "Exam Reminder" },
    { value: "PAYMENT_UPDATE", label: "Payment Update" },
    { value: "GRADE_RELEASED", label: "Grade Released" },
    { value: "SYSTEM", label: "System" },
    { value: "GENERAL", label: "General" },
  ];

  const studentTypes = [
    { value: "INTERNAL", label: "Internal" },
    { value: "EXTERNAL", label: "External" },
  ];

  const roles = [
    { value: "STUDENT", label: "Students" },
    { value: "INTERNAL_TEACHER", label: "Internal Teachers" },
    { value: "EXTERNAL_TEACHER", label: "External Teachers" },
    { value: "ADMIN", label: "Admins" },
  ];

  const buildTargeting = () => {
    return {
      grades: selectedGrades.length > 0 ? selectedGrades : undefined,
      batches: selectedBatches.length > 0 ? selectedBatches : undefined,
      subjects: selectedSubjects.length > 0 ? selectedSubjects : undefined,
      teachers: selectedTeachers.length > 0 ? selectedTeachers : undefined,
      studentTypes:
        selectedStudentTypes.length > 0 ? selectedStudentTypes : undefined,
      roles: selectedRoles.length > 0 ? selectedRoles : undefined,
    };
  };

  const handlePreview = () => {
    const targeting = buildTargeting();
    previewMutation.mutate(targeting);
  };

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and message are required",
        status: "error",
      });
      return;
    }

    const targeting = buildTargeting();
    const scheduleAt =
      scheduleDate && scheduleTime
        ? new Date(`${scheduleDate}T${scheduleTime}`)
        : undefined;

    sendMutation.mutate({
      title,
      message,
      type,
      targeting,
      scheduleAt,
    });
  };

  const toggleGrade = (gradeId: string) => {
    if (selectedGrades.includes(gradeId)) {
      setSelectedGrades(selectedGrades.filter((id) => id !== gradeId));
      // Clear batches from this grade
      const gradeBatches = batches
        .filter((b: Batch) => b.grade === gradeId)
        .map((b: Batch) => b.id);
      setSelectedBatches(
        selectedBatches.filter((id) => !gradeBatches.includes(id))
      );
    } else {
      setSelectedGrades([...selectedGrades, gradeId]);
    }
  };

  const toggleBatch = (batchId: string) => {
    if (selectedBatches.includes(batchId)) {
      setSelectedBatches(selectedBatches.filter((id) => id !== batchId));
    } else {
      setSelectedBatches([...selectedBatches, batchId]);
    }
  };

  const toggleSubject = (subjectId: string) => {
    if (selectedSubjects.includes(subjectId)) {
      setSelectedSubjects(selectedSubjects.filter((id) => id !== subjectId));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectId]);
    }
  };

  const toggleTeacher = (teacherId: string) => {
    if (selectedTeachers.includes(teacherId)) {
      setSelectedTeachers(selectedTeachers.filter((id) => id !== teacherId));
    } else {
      setSelectedTeachers([...selectedTeachers, teacherId]);
    }
  };

  const toggleStudentType = (studentType: string) => {
    if (selectedStudentTypes.includes(studentType)) {
      setSelectedStudentTypes(
        selectedStudentTypes.filter((t) => t !== studentType)
      );
    } else {
      setSelectedStudentTypes([...selectedStudentTypes, studentType]);
    }
  };

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Create Notification</h1>
        <p className="text-muted-foreground">
          Send targeted notifications to users
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Details</CardTitle>
              <CardDescription>
                Compose your notification message
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="Notification title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea
                  placeholder="Notification message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">
                  {message.length} characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map((nt) => (
                      <SelectItem key={nt.value} value={nt.value}>
                        {nt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Schedule Date (Optional)</Label>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Schedule Time (Optional)</Label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Targeting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Recipient Targeting
              </CardTitle>
              <CardDescription>
                Select who should receive this notification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Roles */}
              <div className="space-y-2">
                <Label>User Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <Badge
                      key={role.value}
                      variant={
                        selectedRoles.includes(role.value)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleRole(role.value)}
                    >
                      {role.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Student Types */}
              {selectedRoles.includes("STUDENT") && (
                <div className="space-y-2">
                  <Label>Student Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {studentTypes.map((st) => (
                      <Badge
                        key={st.value}
                        variant={
                          selectedStudentTypes.includes(st.value)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleStudentType(st.value)}
                      >
                        {st.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Grades */}
              <div className="space-y-2">
                <Label>Grades</Label>
                <div className="flex flex-wrap gap-2">
                  {grades.map((grade: Grade) => (
                    <Badge
                      key={grade.id}
                      variant={
                        selectedGrades.includes(grade.id)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleGrade(grade.id)}
                    >
                      {grade.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Batches */}
              {selectedGrades.length > 0 && batches.length > 0 && (
                <div className="space-y-2">
                  <Label>Batches</Label>
                  <div className="flex flex-wrap gap-2">
                    {batches.map((batch: Batch) => (
                      <Badge
                        key={batch.id}
                        variant={
                          selectedBatches.includes(batch.id)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleBatch(batch.id)}
                      >
                        {batch.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Subjects */}
              <div className="space-y-2">
                <Label>Subjects</Label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject: Subject) => (
                    <Badge
                      key={subject.id}
                      variant={
                        selectedSubjects.includes(subject.id)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleSubject(subject.id)}
                    >
                      {subject.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Teachers */}
              <div className="space-y-2">
                <Label>Specific Teachers</Label>
                <Input
                  placeholder="Search teachers..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                />
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {teachers.map((teacher: Teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => toggleTeacher(teacher.id)}
                    >
                      <Checkbox
                        checked={selectedTeachers.includes(teacher.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{teacher.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {teacher.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                variant="outline"
                onClick={handlePreview}
                disabled={previewMutation.isPending}
              >
                {previewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Preview Recipients
              </Button>

              <Button
                className="w-full"
                onClick={handleSend}
                disabled={sendMutation.isPending || !title || !message}
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {scheduleDate ? "Schedule Notification" : "Send Now"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Targeting Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {selectedRoles.length > 0 && (
                <div>
                  <span className="font-medium">Roles: </span>
                  {selectedRoles.length}
                </div>
              )}
              {selectedGrades.length > 0 && (
                <div>
                  <span className="font-medium">Grades: </span>
                  {selectedGrades.length}
                </div>
              )}
              {selectedBatches.length > 0 && (
                <div>
                  <span className="font-medium">Batches: </span>
                  {selectedBatches.length}
                </div>
              )}
              {selectedSubjects.length > 0 && (
                <div>
                  <span className="font-medium">Subjects: </span>
                  {selectedSubjects.length}
                </div>
              )}
              {selectedTeachers.length > 0 && (
                <div>
                  <span className="font-medium">Teachers: </span>
                  {selectedTeachers.length}
                </div>
              )}
              {selectedStudentTypes.length > 0 && (
                <div>
                  <span className="font-medium">Student Types: </span>
                  {selectedStudentTypes.length}
                </div>
              )}
              {selectedRoles.length === 0 &&
                selectedGrades.length === 0 &&
                selectedBatches.length === 0 &&
                selectedSubjects.length === 0 &&
                selectedTeachers.length === 0 &&
                selectedStudentTypes.length === 0 && (
                  <p className="text-muted-foreground">
                    No targeting selected. Will send to all users.
                  </p>
                )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recipient Preview</DialogTitle>
            <DialogDescription>
              {recipientCount} users will receive this notification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-blue-50 rounded">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">
                  {recipientCount} Total Recipients
                </p>
                <p className="text-sm text-blue-700">
                  Showing first {Math.min(10, previewUsers.length)} users
                </p>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {previewUsers.map((user) => (
                <div key={user.id} className="p-3 border rounded">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
