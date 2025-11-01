import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy,
  Calendar,
  Users,
  FileText,
  Clock,
  BookOpen,
  CheckCircle,
  Play,
  Pencil,
  Plus,
  ListChecks,
  Award,
  TrendingUp,
} from "lucide-react";
import { examsApi } from "@/lib/api/endpoints/exams";
import { classesApi } from "@/lib/api/endpoints/classes";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Exam {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  attemptsAllowed: number;
  startTime: string;
  endTime: string;
  instructions?: string;
  questionCount: number;
  attemptCount: number;
  class: {
    id: string;
    name: string;
    subject: string;
    teacher?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface ExamQuestion {
  id: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  order: number;
  explanation?: string;
  matchingPairs?: Array<{ left: string; right: string }>;
}

interface ExamDetails extends Exam {
  questions: ExamQuestion[];
}

interface Class {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
}

function MyExams() {
  const { user: currentUser } = useAuthStore();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExam, setSelectedExam] = useState<ExamDetails | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [attemptsModalOpen, setAttemptsModalOpen] = useState(false);
  const [examAttempts, setExamAttempts] = useState<any[]>([]);

  useEffect(() => {
    fetchMyData();
  }, []);

  useEffect(() => {
    // Filter exams based on search term and teacher ownership
    const filtered = exams.filter((exam) => {
      const matchesSearch =
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.class.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.class.subject.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    setFilteredExams(filtered);
  }, [exams, searchTerm]);

  const fetchMyData = async () => {
    try {
      setLoading(true);
      const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";

      // Fetch classes based on role
      let myClassesData: Class[] = [];
      
      if (isAdmin) {
        // Admins get all classes
        const classesResponse = await classesApi.getAll();
        if (classesResponse.data && Array.isArray(classesResponse.data)) {
          myClassesData = classesResponse.data.map((cls: any) => ({
            id: cls.id,
            name: cls.name,
            subject: cls.subject,
            teacherId: cls.teacherId || "",
          }));
        } else if (Array.isArray(classesResponse)) {
          myClassesData = classesResponse.map((cls: any) => ({
            id: cls.id,
            name: cls.name,
            subject: cls.subject,
            teacherId: cls.teacherId || "",
          }));
        }
      } else {
        // Teachers get only their classes
        const classesResponse = await classesApi.getTeacherClasses();
        if (classesResponse.data && Array.isArray(classesResponse.data)) {
          myClassesData = classesResponse.data.map((cls: any) => ({
            id: cls.id,
            name: cls.name,
            subject: cls.subject,
            teacherId: currentUser?.id || "",
          }));
        } else if (Array.isArray(classesResponse)) {
          myClassesData = classesResponse.map((cls: any) => ({
            id: cls.id,
            name: cls.name,
            subject: cls.subject,
            teacherId: currentUser?.id || "",
          }));
        }
      }

      setMyClasses(myClassesData);

      // Fetch all exams
      const examsResponse = await examsApi.getAll();

      let examsData: Exam[] = [];

      if (examsResponse.data && Array.isArray(examsResponse.data)) {
        examsData = examsResponse.data;
      } else if (Array.isArray(examsResponse)) {
        examsData = examsResponse;
      }

      // Filter exams: admins see all, teachers see only their classes
      const myExams = isAdmin 
        ? examsData 
        : examsData.filter((exam) => {
            return myClassesData.some((cls) => cls.id === exam.class.id);
          });

      setExams(myExams);
    } catch (error: any) {
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const fetchExamDetails = async (examId: string) => {
    try {
      const response = await examsApi.getById(examId);
      return response;
    } catch (error: any) {
      // If detailed endpoint fails, try to get basic info from our list
      const basicExam = exams.find((exam) => exam.id === examId);
      if (basicExam) {
        return {
          ...basicExam,
          questions: [],
        };
      }

      toast.error("Failed to load exam details");
      return null;
    }
  };

  const handleViewExam = async (exam: Exam) => {
    try {
      const examDetails = await fetchExamDetails(exam.id);
      if (examDetails) {
        setSelectedExam(examDetails);
        setViewModalOpen(true);
      }
    } catch (error) {
      toast.error("Failed to view exam");
    }
  };

  const handleEditExam = async (exam: Exam) => {
    try {
      const examDetails = await fetchExamDetails(exam.id);
      if (examDetails) {
        setSelectedExam(examDetails);
        setEditModalOpen(true);
      }
    } catch (error) {
      toast.error("Failed to edit exam");
    }
  };

  const handleDeleteExam = async (examId: string, examTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${examTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await examsApi.delete(examId);
      toast.success("Exam deleted successfully");
      fetchMyData(); // Refresh the list
    } catch (error: any) {
      toast.error("Failed to delete exam");
    }
  };

  const handleDuplicateExam = async (exam: Exam) => {
    try {
      const duplicateData = {
        title: `${exam.title} (Copy)`,
        description: exam.description,
        type: exam.type,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        attemptsAllowed: exam.attemptsAllowed,
        classId: exam.class.id,
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        instructions: exam.instructions,
        aiMonitoringEnabled: false,
        faceVerificationRequired: false,
      };

      await examsApi.create(duplicateData);
      toast.success("Exam duplicated successfully");
      fetchMyData();
    } catch (error: any) {
      toast.error("Failed to duplicate exam");
    }
  };

  const handlePublishExam = async (examId: string) => {
    try {
      // Get exam details to validate questions exist
      const exam = exams.find((e) => e.id === examId);

      if (!exam) {
        toast.error("Exam not found");
        return;
      }

      // Validate exam has questions
      if (!exam.questionCount || exam.questionCount === 0) {
        toast.error(
          "Cannot publish exam without questions. Please add questions first."
        );
        return;
      }

      // Confirm publish action
      if (
        !confirm(
          `Are you sure you want to publish "${exam.title}"? Students will be able to access it immediately.`
        )
      ) {
        return;
      }

      // Use the new publish endpoint
      await examsApi.publishExam(examId);
      toast.success("Exam published successfully! Students can now access it.");
      fetchMyData(); // Refresh the list
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to publish exam";
      toast.error(errorMessage);
    }
  };

  const handleViewAttempts = async (exam: Exam) => {
    try {
      setSelectedExam(exam as any);
      const response = await examsApi.getExamAttempts(exam.id);

      // Handle different response formats
      let attemptsData = [];
      if (response.data && Array.isArray(response.data)) {
        attemptsData = response.data;
      } else if (Array.isArray(response)) {
        attemptsData = response;
      }

      setExamAttempts(attemptsData);
      setAttemptsModalOpen(true);
    } catch (error: any) {
      toast.error("Failed to load exam attempts");
    }
  };

  const handleUpdateExam = async (examId: string, updateData: any) => {
    try {
      await examsApi.update(examId, updateData);
      toast.success("Exam updated successfully");
      setEditModalOpen(false);
      fetchMyData(); // Refresh the list
    } catch (error: any) {
      toast.error("Failed to update exam");
    }
  };

  const handleCreateExam = () => {
    router.push("/dashboard?tab=exam");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: {
        variant: "secondary" as const,
        label: "Draft",
        color: "bg-gray-100 text-gray-800",
      },
      PUBLISHED: {
        variant: "default" as const,
        label: "Published",
        color: "bg-blue-100 text-blue-800",
      },
      ACTIVE: {
        variant: "default" as const,
        label: "Active",
        color: "bg-green-100 text-green-800",
      },
      COMPLETED: {
        variant: "outline" as const,
        label: "Completed",
        color: "bg-purple-100 text-purple-800",
      },
      CANCELLED: {
        variant: "destructive" as const,
        label: "Cancelled",
        color: "bg-red-100 text-red-800",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      label: status,
      color: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant="outline" className="capitalize bg-white">
        {type.toLowerCase().replace(/_/g, " ")}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your exams...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Exams</h1>
          <p className="text-muted-foreground">
            Manage and view all exams you created
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            {filteredExams.length}{" "}
            {filteredExams.length === 1 ? "exam" : "exams"}
          </Badge>
          <Button
            onClick={handleCreateExam}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Exam
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exams by title, class, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Exams Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Information</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Statistics</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="text-center space-y-3">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">
                        {exams.length === 0
                          ? "No exams created yet"
                          : "No exams match your search"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {exams.length === 0
                          ? "Create your first exam to get started"
                          : "Try adjusting your search terms"}
                      </p>
                      {exams.length === 0 && (
                        <Button
                          onClick={handleCreateExam}
                          className="mt-4 flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Create Your First Exam
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredExams.map((exam) => (
                  <TableRow key={exam.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-semibold text-lg">
                            {exam.title}
                          </div>
                          {exam.description && (
                            <div className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                              {exam.description}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Created {formatDate(exam.createdAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {exam.duration} minutes
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{exam.class.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {exam.class.subject}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(exam.type)}</TableCell>
                    <TableCell>{getStatusBadge(exam.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          Starts: {formatDateTime(exam.startTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          Ends: {formatDateTime(exam.endTime)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-3 w-3 text-muted-foreground" />
                          {exam.questionCount || 0} questions
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {exam.attemptCount || 0} attempts
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-muted-foreground" />
                          {exam.totalMarks} total marks
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewExam(exam)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditExam(exam)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Exam
                          </DropdownMenuItem>
                          {exam.status === "DRAFT" && (
                            <DropdownMenuItem
                              onClick={() => handlePublishExam(exam.id)}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {(exam.status === "PUBLISHED" ||
                            exam.status === "ACTIVE" ||
                            exam.status === "COMPLETED") && (
                            <DropdownMenuItem
                              onClick={() => handleViewAttempts(exam)}
                            >
                              <ListChecks className="h-4 w-4 mr-2" />
                              View Attempts
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDuplicateExam(exam)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDeleteExam(exam.id, exam.title)
                            }
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Exam Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Exam Details: {selectedExam?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedExam && (
            <div className="space-y-6">
              {/* Exam Basic Info */}
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Title
                        </label>
                        <p className="font-semibold">{selectedExam.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Description
                        </label>
                        <p className="text-sm">
                          {selectedExam.description || "No description"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Class
                        </label>
                        <p className="font-medium">
                          {selectedExam.class.name} -{" "}
                          {selectedExam.class.subject}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Type
                          </label>
                          <div className="mt-1">
                            {getTypeBadge(selectedExam.type)}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Status
                          </label>
                          <div className="mt-1">
                            {getStatusBadge(selectedExam.status)}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Duration
                        </label>
                        <p className="font-medium">
                          {selectedExam.duration} minutes
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Total Marks
                        </label>
                        <p className="font-medium">
                          {selectedExam.totalMarks} (Passing:{" "}
                          {selectedExam.passingMarks})
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Questions Section */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Questions ({selectedExam.questions?.length || 0})
                    </h3>
                    <Badge variant="outline">
                      Total Marks: {selectedExam.totalMarks}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {selectedExam.questions &&
                    selectedExam.questions.length > 0 ? (
                      selectedExam.questions.map((question, index) => (
                        <div
                          key={question.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary">Q{index + 1}</Badge>
                              <Badge variant="outline" className="capitalize">
                                {question.type.toLowerCase().replace("_", " ")}
                              </Badge>
                              <Badge variant="outline">
                                {question.points} points
                              </Badge>
                            </div>
                          </div>

                          <p className="font-medium mb-3">
                            {question.question}
                          </p>

                          {question.type === "MULTIPLE_CHOICE" &&
                            question.options &&
                            Array.isArray(question.options) && (
                              <div className="space-y-2 ml-4">
                                {question.options.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className="flex items-center gap-2"
                                  >
                                    <div
                                      className={`w-3 h-3 rounded-full border ${
                                        option === question.correctAnswer
                                          ? "bg-green-500 border-green-500"
                                          : "bg-gray-100 border-gray-300"
                                      }`}
                                    />
                                    <span
                                      className={
                                        option === question.correctAnswer
                                          ? "font-medium text-green-700"
                                          : ""
                                      }
                                    >
                                      {option}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                          {question.type === "TRUE_FALSE" && (
                            <div className="ml-4">
                              <p className="font-medium text-green-700">
                                Correct Answer: {question.correctAnswer}
                              </p>
                            </div>
                          )}

                          {(question.type === "SHORT_ANSWER" ||
                            question.type === "ESSAY") && (
                            <div className="ml-4">
                              <label className="text-sm font-medium text-muted-foreground">
                                Correct Answer:
                              </label>
                              <p className="mt-1 p-2 bg-muted rounded text-sm">
                                {question.correctAnswer}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No questions available for this exam.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setViewModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setViewModalOpen(false);
                    handleEditExam(selectedExam);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Exam
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Exam Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Exam: {selectedExam?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedExam && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Edit Exam Details</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Title
                      </label>
                      <Input
                        value={selectedExam.title}
                        onChange={(e) =>
                          setSelectedExam({
                            ...selectedExam,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Description
                      </label>
                      <textarea
                        className="w-full p-2 border rounded-md"
                        rows={3}
                        value={selectedExam.description || ""}
                        onChange={(e) =>
                          setSelectedExam({
                            ...selectedExam,
                            description: e.target.value,
                          })
                        }
                        placeholder="Enter exam description"
                        aria-label="Exam description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Duration (minutes)
                        </label>
                        <Input
                          type="number"
                          value={selectedExam.duration}
                          onChange={(e) =>
                            setSelectedExam({
                              ...selectedExam,
                              duration: parseInt(e.target.value) || 60,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Passing Marks
                        </label>
                        <Input
                          type="number"
                          value={selectedExam.passingMarks}
                          onChange={(e) =>
                            setSelectedExam({
                              ...selectedExam,
                              passingMarks: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Instructions
                      </label>
                      <textarea
                        className="w-full p-2 border rounded-md"
                        rows={3}
                        value={selectedExam.instructions || ""}
                        onChange={(e) =>
                          setSelectedExam({
                            ...selectedExam,
                            instructions: e.target.value,
                          })
                        }
                        placeholder="Enter exam instructions"
                        aria-label="Exam instructions"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Questions Edit Section */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Edit Questions</h3>

                  <div className="space-y-4">
                    {selectedExam.questions &&
                    selectedExam.questions.length > 0 ? (
                      selectedExam.questions.map((question, index) => (
                        <div
                          key={question.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary">Q{index + 1}</Badge>
                              <Badge variant="outline">
                                {question.points} points
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Question
                              </label>
                              <textarea
                                className="w-full p-2 border rounded-md"
                                rows={2}
                                value={question.question}
                                onChange={(e) => {
                                  const updatedQuestions = [
                                    ...selectedExam.questions,
                                  ];
                                  updatedQuestions[index] = {
                                    ...question,
                                    question: e.target.value,
                                  };
                                  setSelectedExam({
                                    ...selectedExam,
                                    questions: updatedQuestions,
                                  });
                                }}
                                placeholder="Enter question text"
                                aria-label={`Question ${index + 1} text`}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Points
                                </label>
                                <Input
                                  type="number"
                                  value={question.points}
                                  onChange={(e) => {
                                    const updatedQuestions = [
                                      ...selectedExam.questions,
                                    ];
                                    updatedQuestions[index] = {
                                      ...question,
                                      points: parseInt(e.target.value) || 1,
                                    };
                                    setSelectedExam({
                                      ...selectedExam,
                                      questions: updatedQuestions,
                                    });
                                  }}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Correct Answer
                                </label>
                                <Input
                                  value={question.correctAnswer}
                                  onChange={(e) => {
                                    const updatedQuestions = [
                                      ...selectedExam.questions,
                                    ];
                                    updatedQuestions[index] = {
                                      ...question,
                                      correctAnswer: e.target.value,
                                    };
                                    setSelectedExam({
                                      ...selectedExam,
                                      questions: updatedQuestions,
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No questions available for editing.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    handleUpdateExam(selectedExam.id, {
                      title: selectedExam.title,
                      description: selectedExam.description,
                      duration: selectedExam.duration,
                      passingMarks: selectedExam.passingMarks,
                      instructions: selectedExam.instructions,
                    })
                  }
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Update Exam
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Attempts Modal */}
      <Dialog open={attemptsModalOpen} onOpenChange={setAttemptsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Student Attempts: {selectedExam?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Attempts
                      </p>
                      <p className="text-2xl font-bold">
                        {examAttempts.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">
                        {
                          examAttempts.filter(
                            (a) => a.status === "COMPLETED" || a.submittedAt
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Award className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Score</p>
                      <p className="text-2xl font-bold">
                        {examAttempts.length > 0
                          ? (
                              examAttempts
                                .filter(
                                  (a) =>
                                    a.totalScore !== null &&
                                    a.totalScore !== undefined
                                )
                                .reduce(
                                  (sum, a) => sum + (a.totalScore || 0),
                                  0
                                ) /
                              examAttempts.filter((a) => a.totalScore !== null)
                                .length
                            ).toFixed(1)
                          : "0"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pass Rate</p>
                      <p className="text-2xl font-bold">
                        {examAttempts.length > 0
                          ? (
                              (examAttempts.filter(
                                (a) =>
                                  a.totalScore >=
                                  (selectedExam?.passingMarks || 0)
                              ).length /
                                examAttempts.filter(
                                  (a) => a.totalScore !== null
                                ).length) *
                              100
                            ).toFixed(0)
                          : "0"}
                        %
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attempts Table */}
            <Card>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Started At</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>Time Spent</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examAttempts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="text-center space-y-3">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium text-muted-foreground">
                              No attempts yet
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Students haven&apos;t started this exam yet
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      examAttempts.map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 p-2 rounded-full">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {attempt.student?.firstName}{" "}
                                  {attempt.student?.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {attempt.student?.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {formatDateTime(attempt.startedAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {attempt.submittedAt ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {formatDateTime(attempt.submittedAt)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                Not submitted
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {attempt.timeSpent
                                ? `${Math.floor(attempt.timeSpent / 60)}m ${attempt.timeSpent % 60}s`
                                : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {attempt.totalScore !== null &&
                            attempt.totalScore !== undefined ? (
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    attempt.totalScore >=
                                    (selectedExam?.passingMarks || 0)
                                      ? "default"
                                      : "destructive"
                                  }
                                  className={
                                    attempt.totalScore >=
                                    (selectedExam?.passingMarks || 0)
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }
                                >
                                  {attempt.totalScore} /{" "}
                                  {selectedExam?.totalMarks}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                Not graded
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {attempt.submittedAt ? (
                              <Badge className="bg-green-100 text-green-800">
                                Completed
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800">
                                In Progress
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MyExams;
