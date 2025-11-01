import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  CalendarDays,
  Plus,
  Trash2,
  CheckCircle,
  Loader2,
  Clock,
  GripVertical,
} from "lucide-react";
import { examsApi } from "@/lib/api/endpoints/exams";
import { classesApi } from "@/lib/api/endpoints/classes";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

interface Class {
  id: string;
  name: string;
  subject: string;
  grade: string;
  teacherId: string; // This is crucial for filtering
  status: string;
  currentEnrollment?: number;
  maxStudents?: number;
}

interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

interface Question {
  type:
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE"
    | "SHORT_ANSWER"
    | "ESSAY"
    | "FILL_BLANK"
    | "MATCHING";
  question: string;
  options: string[];
  correctAnswer: string;
  matchingPairs: MatchingPair[];
  points: number;
  order: number;
  // explanation?: string;
}

interface DashExamsProps {
  classes?: Class[];
  onExamCreated: () => void;
  onCancel: () => void;
}

const DashExams: React.FC<DashExamsProps> = ({
  classes = [],
  onExamCreated,
  onCancel,
}) => {
  const { isAuthenticated, checkAuth, user: currentUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingClasses, setFetchingClasses] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<Class[]>(classes);
  const [examData, setExamData] = useState({
    title: "",
    description: "",
    type: "MULTIPLE_CHOICE" as
      | "MULTIPLE_CHOICE"
      | "ESSAY"
      | "MIXED"
      | "PRACTICAL"
      | "FULL_ONLINE"
      | "HALF_ONLINE_HALF_UPLOAD"
      | "FULL_UPLOAD",
    duration: 60,
    totalMarks: 100,
    passingMarks: 60,
    attemptsAllowed: 1,
    classId: "",
    startTime: new Date(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    instructions: "",
    aiMonitoringEnabled: false,
    faceVerificationRequired: false,
    // New optional fields
    part1Marks: undefined as number | undefined,
    part2Marks: undefined as number | undefined,
    allowFileUpload: false,
    maxFileSize: 10,
    allowedFileTypes: ["pdf", "docx", "jpg", "png"],
    uploadInstructions: "",
    windowStart: undefined as Date | undefined,
    windowEnd: undefined as Date | undefined,
    lateSubmissionAllowed: false,
    latePenaltyPercent: 0,
    enableRanking: false,
    rankingLevels: [] as string[],
    browseLockEnabled: false,
    allowedResources: "",
    // metadata: JSON.stringify({
    //   allowCalculator: false,
    //   materials: [],
    //   restrictions: [],
    // }),
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      type: "MULTIPLE_CHOICE",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      matchingPairs: [],
      points: 10,
      order: 1,
    },
  ]);

  const [startTimeInput, setStartTimeInput] = useState("09:00");
  const [endTimeInput, setEndTimeInput] = useState("17:00");
  const [draggedPair, setDraggedPair] = useState<{
    questionIndex: number;
    pairId: string;
  } | null>(null);

  const steps = [
    { number: 1, label: "Exam Details" },
    { number: 2, label: "Questions" },
    { number: 3, label: "Review & Create" },
  ];

  // Check authentication and fetch teacher's classes
  useEffect(() => {
    const initializeData = async () => {
      const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";

      if (classes.length > 0) {
        // If classes are passed as props, filter them by current teacher (unless admin)
        const filteredClasses = isAdmin 
          ? classes 
          : classes.filter((cls) => cls.teacherId === currentUser?.id);
        setAvailableClasses(filteredClasses);
        return;
      }

      if (fetchingClasses) {
        return;
      }

      setFetchingClasses(true);

      try {
        if (!isAuthenticated) {
          await checkAuth();

          const authState = useAuthStore.getState();
          if (!authState.isAuthenticated) {
            toast.error("Please log in to access your classes");
            return;
          }
        }

        // Fetch classes based on role
        let response;
        if (isAdmin) {
          // Admins get all classes
          response = await classesApi.getAll();
        } else {
          // Teachers get only their classes
          response = await classesApi.getMyClasses();
        }

        let teacherClasses: Class[] = [];

        if (Array.isArray(response)) {
          teacherClasses = response;
        } else if (response?.data && Array.isArray(response.data)) {
          teacherClasses = response.data;
        } else if (response?.classes && Array.isArray(response.classes)) {
          teacherClasses = response.classes;
        }

        // Filter classes based on role
        const myClasses = isAdmin 
          ? teacherClasses 
          : teacherClasses.filter((cls) => cls.teacherId === currentUser?.id);

        if (myClasses.length === 0) {
          toast.info(isAdmin ? "No classes available" : "You don't have any classes yet. Create a class first.");
        }

        setAvailableClasses(myClasses);
      } catch (error: any) {
        if (
          error.message?.includes("Authentication required") ||
          error.message?.includes("Please log in") ||
          error.response?.status === 401
        ) {
          toast.error("Please log in to access your classes");
          await checkAuth();
        } else {
          toast.error(error.message || "Failed to load your classes");
        }

        setAvailableClasses([]);
      } finally {
        setFetchingClasses(false);
      }
    };

    if (availableClasses.length === 0 && !fetchingClasses) {
      initializeData();
    }
  }, [classes, isAuthenticated, checkAuth, currentUser]);

  // Combine date and time
  const combineDateTime = (date: Date, timeString: string): Date => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  const handleCreateExam = async () => {
    // Validate exam data
    if (!examData.title.trim()) {
      toast.error("Please enter exam title");
      return;
    }

    if (!examData.classId) {
      toast.error("Please select a class");
      return;
    }

    // Double-check class ownership before submitting
    const selectedClassForExam = availableClasses.find(
      (c) => c.id === examData.classId
    );
    if (!selectedClassForExam) {
      toast.error("Selected class not found");
      return;
    }

    // Allow admins to create exams for any class
    const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";
    if (!isAdmin && selectedClassForExam.teacherId !== currentUser?.id) {
      toast.error("You can only create exams for your own classes");
      return;
    }

    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    // Validate questions (existing validation code remains the same)
    for (let index = 0; index < questions.length; index++) {
      const question = questions[index];
      if (!question.question.trim()) {
        toast.error(`Please enter question text for question ${index + 1}`);
        return;
      }

      if (question.type === "MULTIPLE_CHOICE") {
        const emptyOptions = question.options.filter(
          (opt: string) => !opt.trim()
        );
        if (emptyOptions.length > 0) {
          toast.error(`Please fill all options for question ${index + 1}`);
          return;
        }
        if (!question.correctAnswer.trim()) {
          toast.error(`Please select correct answer for question ${index + 1}`);
          return;
        }
      }

      if (question.type === "TRUE_FALSE" && !question.correctAnswer.trim()) {
        toast.error(`Please select correct answer for question ${index + 1}`);
        return;
      }

      if (
        (question.type === "SHORT_ANSWER" || question.type === "ESSAY") &&
        !question.correctAnswer.trim()
      ) {
        toast.error(`Please provide correct answer for question ${index + 1}`);
        return;
      }

      if (question.type === "FILL_BLANK") {
        const emptyOptions = question.options.filter(
          (opt: string) => !opt.trim()
        );
        if (emptyOptions.length > 0) {
          toast.error(
            `Please fill all blank answers for question ${index + 1}`
          );
          return;
        }
        // For fill blank, store all correct answers as JSON array
        question.correctAnswer = JSON.stringify(question.options);
      }

      if (question.type === "MATCHING") {
        const emptyPairs = question.matchingPairs.filter(
          (pair: MatchingPair) => !pair.left.trim() || !pair.right.trim()
        );
        if (emptyPairs.length > 0) {
          toast.error(
            `Please fill all matching pairs for question ${index + 1}`
          );
          return;
        }
        if (question.matchingPairs.length < 2) {
          toast.error(
            `Please add at least 2 matching pairs for question ${index + 1}`
          );
          return;
        }
      }
    }

    setLoading(true);
    try {
      // Combine date with time
      const startTime = combineDateTime(examData.startTime, startTimeInput);
      const endTime = combineDateTime(examData.endTime, endTimeInput);

      // Calculate total marks from questions
      const calculatedTotalMarks = questions.reduce(
        (sum, q) => sum + q.points,
        0
      );

      // Create exam payload
      const examPayload: any = {
        title: examData.title,
        description: examData.description,
        type: examData.type,
        duration: examData.duration,
        totalMarks: calculatedTotalMarks,
        passingMarks: examData.passingMarks,
        attemptsAllowed: examData.attemptsAllowed,
        classId: examData.classId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        instructions: examData.instructions,
        aiMonitoringEnabled: examData.aiMonitoringEnabled,
        faceVerificationRequired: examData.faceVerificationRequired,
      };

      // Add optional fields only if they have values
      if (examData.part1Marks !== undefined) {
        examPayload.part1Marks = examData.part1Marks;
      }
      if (examData.part2Marks !== undefined) {
        examPayload.part2Marks = examData.part2Marks;
      }
      if (examData.allowFileUpload) {
        examPayload.allowFileUpload = examData.allowFileUpload;
        examPayload.maxFileSize = examData.maxFileSize;
        examPayload.allowedFileTypes = examData.allowedFileTypes;
        if (examData.uploadInstructions) {
          examPayload.uploadInstructions = examData.uploadInstructions;
        }
      }
      if (examData.windowStart) {
        examPayload.windowStart = examData.windowStart.toISOString();
      }
      if (examData.windowEnd) {
        examPayload.windowEnd = examData.windowEnd.toISOString();
      }
      if (examData.lateSubmissionAllowed) {
        examPayload.lateSubmissionAllowed = examData.lateSubmissionAllowed;
        examPayload.latePenaltyPercent = examData.latePenaltyPercent;
      }
      if (examData.enableRanking) {
        examPayload.enableRanking = examData.enableRanking;
        examPayload.rankingLevels = examData.rankingLevels;
      }
      if (examData.browseLockEnabled) {
        examPayload.browseLockEnabled = examData.browseLockEnabled;
      }
      if (examData.allowedResources) {
        examPayload.allowedResources = examData.allowedResources;
      }

      // Create exam
      const examResponse = await examsApi.create(examPayload);
      const examId = examResponse.id;

      // Add questions
      for (const question of questions) {
        let questionPayload: any = {
          type: question.type,
          question: question.question,
          points: question.points,
          order: question.order,
          // explanation: question.explanation || "",
        };

        // Handle different question types
        if (
          question.type === "MULTIPLE_CHOICE" ||
          question.type === "TRUE_FALSE"
        ) {
          questionPayload.options = question.options;
          questionPayload.correctAnswer = question.correctAnswer;
        } else if (question.type === "FILL_BLANK") {
          questionPayload.options = question.options; // Store blank answers as options
          questionPayload.correctAnswer = JSON.stringify(question.options); // Store as JSON array
        } else if (question.type === "MATCHING") {
          questionPayload.matchingPairs = JSON.stringify(
            question.matchingPairs
          );
          questionPayload.correctAnswer = JSON.stringify(
            question.matchingPairs
          );
        } else {
          // SHORT_ANSWER, ESSAY
          questionPayload.correctAnswer = question.correctAnswer;
          questionPayload.options = [];
        }

        await examsApi.addQuestion(examId, questionPayload);
      }

      toast.success("Exam Created Successfully", {
        description: `${questions.length} questions • ${totalMarks} total marks`,
        action: {
          label: "View Exam",
          onClick: () => (window.location.href = `/exams/${examId}`),
        },
        duration: 5000,
      });
      if (onExamCreated && typeof onExamCreated === "function") {
        onExamCreated();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create exam"
      );
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: "MULTIPLE_CHOICE",
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        matchingPairs: [],
        points: 10,
        order: questions.length + 1,
      },
    ]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };

    if (field === "type") {
      // Reset fields when question type changes
      if (value === "TRUE_FALSE") {
        updated[index].options = ["True", "False"];
        updated[index].correctAnswer = "True";
        updated[index].matchingPairs = [];
      } else if (value === "MULTIPLE_CHOICE") {
        updated[index].options = ["", "", "", ""];
        updated[index].correctAnswer = "";
        updated[index].matchingPairs = [];
      } else if (value === "FILL_BLANK") {
        updated[index].options = [""]; // Start with one blank
        updated[index].correctAnswer = "";
        updated[index].matchingPairs = [];
      } else if (value === "MATCHING") {
        updated[index].options = [];
        updated[index].correctAnswer = "";
        updated[index].matchingPairs = [
          { id: `pair-${Date.now()}-1`, left: "", right: "" },
          { id: `pair-${Date.now()}-2`, left: "", right: "" },
        ];
      } else {
        // SHORT_ANSWER, ESSAY
        updated[index].options = [];
        updated[index].correctAnswer = "";
        updated[index].matchingPairs = [];
      }
    }

    setQuestions(updated);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.push("");
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options.length > 1) {
      updated[questionIndex].options.splice(optionIndex, 1);
      setQuestions(updated);
    }
  };

  // Matching pairs functions
  const addMatchingPair = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].matchingPairs.push({
      id: `pair-${Date.now()}`,
      left: "",
      right: "",
    });
    setQuestions(updated);
  };

  const updateMatchingPair = (
    questionIndex: number,
    pairIndex: number,
    field: "left" | "right",
    value: string
  ) => {
    const updated = [...questions];
    updated[questionIndex].matchingPairs[pairIndex][field] = value;
    setQuestions(updated);
  };

  const removeMatchingPair = (questionIndex: number, pairIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].matchingPairs.length > 2) {
      updated[questionIndex].matchingPairs.splice(pairIndex, 1);
      setQuestions(updated);
    }
  };

  // Drag and drop for matching pairs
  const handleDragStart = (questionIndex: number, pairId: string) => {
    setDraggedPair({ questionIndex, pairId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (questionIndex: number, targetPairId: string) => {
    if (!draggedPair || draggedPair.questionIndex !== questionIndex) return;

    const updated = [...questions];
    const pairs = updated[questionIndex].matchingPairs;
    const draggedIndex = pairs.findIndex((p) => p.id === draggedPair.pairId);
    const targetIndex = pairs.findIndex((p) => p.id === targetPairId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedItem] = pairs.splice(draggedIndex, 1);
      pairs.splice(targetIndex, 0, draggedItem);
      setQuestions(updated);
    }

    setDraggedPair(null);
  };

  // Fill blank functions
  const addFillBlank = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.push("");
    setQuestions(updated);
  };

  const removeFillBlank = (questionIndex: number, blankIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options.length > 1) {
      updated[questionIndex].options.splice(blankIndex, 1);
      setQuestions(updated);
    }
  };

  const deleteQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.error("You must have at least one question");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const totalMarks = questions.reduce((sum, q) => sum + q.points, 0);

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!examData.title.trim()) {
        toast.error("Please enter exam title");
        return;
      }
      if (!examData.classId) {
        toast.error("Please select a class");
        return;
      }
    } else if (currentStep === 2) {
      // Validate step 2
      if (questions.length === 0) {
        toast.error("Please add at least one question");
        return;
      }
      for (let index = 0; index < questions.length; index++) {
        const question = questions[index];
        if (!question.question.trim()) {
          toast.error(`Please enter question text for question ${index + 1}`);
          return;
        }
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  if (!isAuthenticated && !fetchingClasses) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-8">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      currentStep === step.number
                        ? "bg-primary text-primary-foreground"
                        : currentStep > step.number
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      currentStep >= step.number
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 ${
                      currentStep > step.number ? "bg-green-500" : "bg-muted"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Exam Details */}
      {currentStep === 1 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-6">Exam Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Exam Title *
                  </label>
                  <Input
                    value={examData.title}
                    onChange={(e) =>
                      setExamData({ ...examData, title: e.target.value })
                    }
                    placeholder="Enter exam title"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description
                  </label>
                  <Textarea
                    value={examData.description}
                    onChange={(e) =>
                      setExamData({ ...examData, description: e.target.value })
                    }
                    placeholder="Enter exam description"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Class *
                  </label>
                  <Select
                    value={examData.classId}
                    onValueChange={(value) =>
                      setExamData({ ...examData, classId: value })
                    }
                    disabled={fetchingClasses || availableClasses.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          fetchingClasses
                            ? "Loading your classes..."
                            : availableClasses.length === 0
                              ? "No classes available"
                              : "Select class"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClasses && availableClasses.length > 0 ? (
                        availableClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} - {cls.subject} ({cls.grade})
                            {cls.currentEnrollment !== undefined && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({cls.currentEnrollment}/{cls.maxStudents}{" "}
                                students)
                              </span>
                            )}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-classes" disabled>
                          {fetchingClasses
                            ? "Loading..."
                            : "No classes available - Create a class first"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {availableClasses.length === 0 && !fetchingClasses && (
                    <p className="text-sm text-muted-foreground mt-1">
                      You don't have any active classes. Create a class first to
                      create exams.
                    </p>
                  )}
                  {availableClasses.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Showing {availableClasses.length} of your classes
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Exam Type *
                  </label>
                  <Select
                    value={examData.type}
                    onValueChange={(
                      value:
                        | "MULTIPLE_CHOICE"
                        | "ESSAY"
                        | "MIXED"
                        | "PRACTICAL"
                        | "FULL_ONLINE"
                        | "HALF_ONLINE_HALF_UPLOAD"
                        | "FULL_UPLOAD"
                    ) => setExamData({ ...examData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MULTIPLE_CHOICE">
                        Multiple Choice
                      </SelectItem>
                      <SelectItem value="ESSAY">Essay</SelectItem>
                      <SelectItem value="MIXED">Mixed</SelectItem>
                      <SelectItem value="PRACTICAL">Practical</SelectItem>
                      <SelectItem value="FULL_ONLINE">Full Online</SelectItem>
                      <SelectItem value="HALF_ONLINE_HALF_UPLOAD">
                        Half Online Half Upload
                      </SelectItem>
                      <SelectItem value="FULL_UPLOAD">Full Upload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Duration (minutes) *
                  </label>
                  <Input
                    type="number"
                    value={examData.duration}
                    onChange={(e) =>
                      setExamData({
                        ...examData,
                        duration: parseInt(e.target.value) || 60,
                      })
                    }
                    min="1"
                    max="480"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Start Date *
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {format(examData.startTime, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={examData.startTime}
                          onSelect={(date) =>
                            date &&
                            setExamData({ ...examData, startTime: date })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Start Time *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={startTimeInput}
                        onChange={(e) => setStartTimeInput(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      End Date *
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {format(examData.endTime, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={examData.endTime}
                          onSelect={(date) =>
                            date && setExamData({ ...examData, endTime: date })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      End Time *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={endTimeInput}
                        onChange={(e) => setEndTimeInput(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Passing Marks *
                  </label>
                  <Input
                    type="number"
                    value={examData.passingMarks}
                    onChange={(e) =>
                      setExamData({
                        ...examData,
                        passingMarks: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Attempts Allowed *
                  </label>
                  <Input
                    type="number"
                    value={examData.attemptsAllowed}
                    onChange={(e) =>
                      setExamData({
                        ...examData,
                        attemptsAllowed: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                    max="10"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Instructions
                  </label>
                  <Textarea
                    value={examData.instructions}
                    onChange={(e) =>
                      setExamData({ ...examData, instructions: e.target.value })
                    }
                    placeholder="Enter exam instructions"
                    rows={3}
                  />
                </div>

                {/* Advanced Options */}
                <div className="border-t pt-6 mt-6">
                  <h4 className="text-md font-semibold mb-4">
                    Advanced Options (Optional)
                  </h4>

                  {/* Part Marks (for mixed exams) */}
                  {(examData.type === "MIXED" ||
                    examData.type === "HALF_ONLINE_HALF_UPLOAD") && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Part 1 Marks (Auto-graded)
                        </label>
                        <Input
                          type="number"
                          value={examData.part1Marks || ""}
                          onChange={(e) =>
                            setExamData({
                              ...examData,
                              part1Marks: e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="MCQ section marks"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Part 2 Marks (Manual grading)
                        </label>
                        <Input
                          type="number"
                          value={examData.part2Marks || ""}
                          onChange={(e) =>
                            setExamData({
                              ...examData,
                              part2Marks: e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="Essay/Upload section marks"
                          min="0"
                        />
                      </div>
                    </div>
                  )}

                  {/* File Upload Settings */}
                  {(examData.type === "HALF_ONLINE_HALF_UPLOAD" ||
                    examData.type === "FULL_UPLOAD") && (
                    <div className="space-y-4 mb-4 p-4 bg-muted/50 rounded-lg">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={examData.allowFileUpload}
                          onChange={(e) =>
                            setExamData({
                              ...examData,
                              allowFileUpload: e.target.checked,
                            })
                          }
                        />
                        <span className="text-sm font-medium">
                          Allow File Upload
                        </span>
                      </label>

                      {examData.allowFileUpload && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Max File Size (MB)
                              </label>
                              <Input
                                type="number"
                                value={examData.maxFileSize}
                                onChange={(e) =>
                                  setExamData({
                                    ...examData,
                                    maxFileSize: parseInt(e.target.value) || 10,
                                  })
                                }
                                min="1"
                                max="100"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Allowed File Types
                              </label>
                              <Input
                                value={examData.allowedFileTypes.join(", ")}
                                onChange={(e) =>
                                  setExamData({
                                    ...examData,
                                    allowedFileTypes: e.target.value
                                      .split(",")
                                      .map((t) => t.trim()),
                                  })
                                }
                                placeholder="pdf, docx, jpg, png"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Upload Instructions
                            </label>
                            <Textarea
                              value={examData.uploadInstructions}
                              onChange={(e) =>
                                setExamData({
                                  ...examData,
                                  uploadInstructions: e.target.value,
                                })
                              }
                              placeholder="Instructions for file upload"
                              rows={2}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Late Submission */}
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                    <label className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        checked={examData.lateSubmissionAllowed}
                        onChange={(e) =>
                          setExamData({
                            ...examData,
                            lateSubmissionAllowed: e.target.checked,
                          })
                        }
                      />
                      <span className="text-sm font-medium">
                        Allow Late Submission
                      </span>
                    </label>

                    {examData.lateSubmissionAllowed && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Late Penalty (%)
                        </label>
                        <Input
                          type="number"
                          value={examData.latePenaltyPercent}
                          onChange={(e) =>
                            setExamData({
                              ...examData,
                              latePenaltyPercent: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="Penalty percentage per day/hour"
                          min="0"
                          max="100"
                        />
                      </div>
                    )}
                  </div>

                  {/* Ranking System */}
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                    <label className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        checked={examData.enableRanking}
                        onChange={(e) =>
                          setExamData({
                            ...examData,
                            enableRanking: e.target.checked,
                          })
                        }
                      />
                      <span className="text-sm font-medium">
                        Enable Ranking System
                      </span>
                    </label>

                    {examData.enableRanking && (
                      <div className="flex gap-2 flex-wrap">
                        {["ISLAND", "DISTRICT", "ZONE", "SCHOOL"].map(
                          (level) => (
                            <label
                              key={level}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="checkbox"
                                checked={examData.rankingLevels.includes(level)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setExamData({
                                      ...examData,
                                      rankingLevels: [
                                        ...examData.rankingLevels,
                                        level,
                                      ],
                                    });
                                  } else {
                                    setExamData({
                                      ...examData,
                                      rankingLevels:
                                        examData.rankingLevels.filter(
                                          (l) => l !== level
                                        ),
                                    });
                                  }
                                }}
                              />
                              <span className="text-sm">{level}</span>
                            </label>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Other Resources */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Allowed Resources (e.g., calculator, formula sheet)
                    </label>
                    <Textarea
                      value={examData.allowedResources}
                      onChange={(e) =>
                        setExamData({
                          ...examData,
                          allowedResources: e.target.value,
                        })
                      }
                      placeholder="List resources students can use during the exam"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={examData.aiMonitoringEnabled}
                      onChange={(e) =>
                        setExamData({
                          ...examData,
                          aiMonitoringEnabled: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm">AI Monitoring</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={examData.faceVerificationRequired}
                      onChange={(e) =>
                        setExamData({
                          ...examData,
                          faceVerificationRequired: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm">Face Verification</span>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Questions */}
      {currentStep === 2 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Questions</h3>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Total Marks: {totalMarks}
                </div>
                <Button onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {questions.map((question, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteQuestion(index)}
                        className="text-red-600 hover:text-red-700"
                        disabled={questions.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Question Text *
                        </label>
                        <Textarea
                          value={question.question}
                          onChange={(e) =>
                            updateQuestion(index, "question", e.target.value)
                          }
                          placeholder="Enter your question"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Type *
                          </label>
                          <Select
                            value={question.type}
                            onValueChange={(value: any) =>
                              updateQuestion(index, "type", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MULTIPLE_CHOICE">
                                Multiple Choice
                              </SelectItem>
                              <SelectItem value="TRUE_FALSE">
                                True/False
                              </SelectItem>
                              <SelectItem value="SHORT_ANSWER">
                                Short Answer
                              </SelectItem>
                              <SelectItem value="ESSAY">Essay</SelectItem>
                              <SelectItem value="FILL_BLANK">
                                Fill in the Blanks
                              </SelectItem>
                              <SelectItem value="MATCHING">Matching</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Points *
                          </label>
                          <Input
                            type="number"
                            value={question.points}
                            onChange={(e) =>
                              updateQuestion(
                                index,
                                "points",
                                parseInt(e.target.value) || 1
                              )
                            }
                            min="1"
                          />
                        </div>
                      </div>

                      {/* Multiple Choice */}
                      {question.type === "MULTIPLE_CHOICE" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium block">
                              Options *
                            </label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(index)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Option
                            </Button>
                          </div>
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="flex items-center gap-3"
                            >
                              <Input
                                value={option}
                                onChange={(e) =>
                                  updateOption(
                                    index,
                                    optionIndex,
                                    e.target.value
                                  )
                                }
                                placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                              />
                              <input
                                type="radio"
                                name={`correct-${index}`}
                                checked={question.correctAnswer === option}
                                onChange={() =>
                                  updateQuestion(index, "correctAnswer", option)
                                }
                                className="w-4 h-4"
                                title="Select as correct answer"
                                aria-label={`Mark option ${String.fromCharCode(65 + optionIndex)} as correct`}
                              />
                              {question.options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeOption(index, optionIndex)
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* True/False */}
                      {question.type === "TRUE_FALSE" && (
                        <div className="space-y-3">
                          <label className="text-sm font-medium block">
                            Correct Answer *
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`tf-${index}`}
                                checked={question.correctAnswer === "True"}
                                onChange={() =>
                                  updateQuestion(index, "correctAnswer", "True")
                                }
                                className="w-4 h-4"
                              />
                              <span>True</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`tf-${index}`}
                                checked={question.correctAnswer === "False"}
                                onChange={() =>
                                  updateQuestion(
                                    index,
                                    "correctAnswer",
                                    "False"
                                  )
                                }
                                className="w-4 h-4"
                              />
                              <span>False</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Short Answer & Essay */}
                      {(question.type === "SHORT_ANSWER" ||
                        question.type === "ESSAY") && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Correct Answer *
                          </label>
                          <Textarea
                            value={question.correctAnswer}
                            onChange={(e) =>
                              updateQuestion(
                                index,
                                "correctAnswer",
                                e.target.value
                              )
                            }
                            placeholder="Enter the correct answer"
                            rows={question.type === "ESSAY" ? 4 : 2}
                          />
                        </div>
                      )}

                      {/* Fill in the Blanks */}
                      {question.type === "FILL_BLANK" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium block">
                              Blank Answers *
                            </label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addFillBlank(index)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Blank
                            </Button>
                          </div>
                          {question.options.map((blank, blankIndex) => (
                            <div
                              key={blankIndex}
                              className="flex items-center gap-3"
                            >
                              <Input
                                value={blank}
                                onChange={(e) =>
                                  updateOption(
                                    index,
                                    blankIndex,
                                    e.target.value
                                  )
                                }
                                placeholder={`Answer for blank ${blankIndex + 1}`}
                              />
                              {question.options.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeFillBlank(index, blankIndex)
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Matching Questions */}
                      {question.type === "MATCHING" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium block">
                              Matching Pairs *
                            </label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addMatchingPair(index)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Pair
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {question.matchingPairs.map((pair, pairIndex) => (
                              <div
                                key={pair.id}
                                className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50"
                                draggable
                                onDragStart={() =>
                                  handleDragStart(index, pair.id)
                                }
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(index, pair.id)}
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                <div className="grid grid-cols-2 gap-3 flex-1">
                                  <Input
                                    value={pair.left}
                                    onChange={(e) =>
                                      updateMatchingPair(
                                        index,
                                        pairIndex,
                                        "left",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Left item"
                                  />
                                  <Input
                                    value={pair.right}
                                    onChange={(e) =>
                                      updateMatchingPair(
                                        index,
                                        pairIndex,
                                        "right",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Right item"
                                  />
                                </div>
                                {question.matchingPairs.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      removeMatchingPair(index, pairIndex)
                                    }
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>

                          <p className="text-xs text-muted-foreground">
                            Drag and drop the grip icon to reorder pairs
                          </p>
                        </div>
                      )}

                      {/* <div>
                        <label className="text-sm font-medium mb-2 block">
                          Explanation (Optional)
                        </label>
                        <Textarea
                          value={question.explanation || ""}
                          onChange={(e) =>
                            updateQuestion(index, "explanation", e.target.value)
                          }
                          placeholder="Enter explanation for the answer"
                          rows={2}
                        />
                      </div> */}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-6">Review & Create</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Exam Details</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Title:</span>
                      <p className="font-medium">
                        {examData.title || "Not set"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Description:
                      </span>
                      <p className="font-medium">
                        {examData.description || "Not set"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Class:</span>
                      <p className="font-medium">
                        {availableClasses.find((c) => c.id === examData.classId)
                          ?.name || "Not selected"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium">{examData.type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="font-medium">{examData.duration} minutes</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-4">Schedule & Settings</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Start:</span>
                      <p className="font-medium">
                        {format(examData.startTime, "PPP")} at {startTimeInput}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">End:</span>
                      <p className="font-medium">
                        {format(examData.endTime, "PPP")} at {endTimeInput}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Questions:</span>
                      <p className="font-medium">{questions.length}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Total Marks:
                      </span>
                      <p className="font-medium">{totalMarks}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <p className="font-medium text-blue-600">DRAFT</p>
                    </div>
                  </div>
                </div>
              </div>

              {examData.instructions && (
                <div>
                  <h4 className="font-medium mb-2">Instructions</h4>
                  <p className="text-sm text-muted-foreground">
                    {examData.instructions}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-4">Questions Summary</h4>
                <div className="space-y-2">
                  {questions.map((q, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">Q{index + 1}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-md">
                          {q.question || "No question text"}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {q.type.toLowerCase().replace("_", " ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{q.points} points</p>
                        {q.type === "MATCHING" && (
                          <p className="text-xs text-muted-foreground">
                            {q.matchingPairs.length} pairs
                          </p>
                        )}
                        {q.type === "FILL_BLANK" && (
                          <p className="text-xs text-muted-foreground">
                            {q.options.length} blanks
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : prevStep}
          disabled={loading}
        >
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>

        <div className="flex gap-2">
          {currentStep < 3 && (
            <Button onClick={nextStep} disabled={loading}>
              Next
            </Button>
          )}
          {currentStep === 3 && (
            <Button onClick={handleCreateExam} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Exam as Draft
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashExams;
