"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  Clock,
  Trash2,
  RotateCcw,
} from "lucide-react";
import ExamDetailsStep from "./wizard-steps/ExamDetailsStep";
import ExamQuestionsStep from "./wizard-steps/ExamQuestionsStep";
import ExamSettingsStep from "./wizard-steps/ExamSettingsStep";
import ExamAdvancedSettingsStep from "./wizard-steps/ExamAdvancedSettingsStep";
import ExamReviewStep from "./wizard-steps/ExamReviewStep";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
const logger = createLogger("ExamBuilderWizard");
import { ApiClient } from "@/lib/api/api-client";

// Draft storage key prefix
const DRAFT_STORAGE_KEY = "exam_draft";
const DRAFT_AUTO_SAVE_INTERVAL = 30000; // Auto-save every 30 seconds

// Backend-aligned enums
export type ExamType = "MULTIPLE_CHOICE" | "ESSAY" | "MIXED" | "PRACTICAL";
export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "ESSAY"
  | "FILL_BLANK"
  | "MATCHING";

export interface ExamFormData {
  // Basic Details
  title: string;
  description: string;
  type: ExamType;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  attemptsAllowed: number;

  // Target Audience (using IDs from backend)
  subjectId: string;
  gradeId: string;
  mediumId: string;
  classId?: string;

  // Schedule
  startTime: string;
  endTime: string;

  // Questions (backend uses 'questions' array)
  questions: EnhancedQuestion[];

  // Hierarchical exam paper structure
  sections?: ExamSection[];
  questionGroups?: QuestionGroup[];
  useHierarchicalStructure?: boolean;

  // Part marks (for mixed exams)
  part1Marks?: number; // Auto-marked section
  part2Marks?: number; // Subjective section

  // File upload settings
  allowFileUpload: boolean;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  uploadInstructions?: string;

  // Windowed access
  windowStart?: string;
  windowEnd?: string;
  lateSubmissionAllowed: boolean;
  latePenaltyPercent?: number;

  // Ranking settings
  enableRanking: boolean;
  rankingLevels?: string[];

  // AI monitoring
  aiMonitoringEnabled: boolean;
  faceVerificationRequired: boolean;
  browseLockEnabled: boolean;

  // Other settings
  instructions: string;
  timeZone?: string;
  allowedResources?: string;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showResults: boolean;

  // Format and access
  format?: "FULL_ONLINE" | "HALF_ONLINE_HALF_UPLOAD" | "FULL_UPLOAD";
  visibility?: "INTERNAL_ONLY" | "EXTERNAL_ONLY" | "BOTH";
}

export interface Question {
  id?: string;
  type: QuestionType;
  question: string; // Backend uses 'question' not 'questionText'
  options: string[]; // Backend uses string array
  optionImages?: string[]; // Image URLs for each option (index matches options array)
  correctAnswer: string;
  matchingPairs?: string; // Backend expects JSON string
  points: number; // Backend uses 'points' not 'marks'
  order: number;
  section?: string; // PART_I, PART_II, PART_III
  examPart: 1 | 2; // 1 = auto-marked, 2 = subjective
  imageUrl?: string;
  videoUrl?: string;
  attachmentUrl?: string;
  explanation?: string;
}

// Hierarchical exam paper structures
export interface QuestionPart {
  id: string;
  type: "TEXT" | "IMAGE" | "FORMULA";
  content: string;
  order: number;
}

export interface EnhancedQuestion extends Question {
  sectionId?: string;
  groupId?: string;
  subQuestions?: Question[];
  parts?: QuestionPart[];
  showNumber?: boolean;
  numbering?: string; // e.g., "1.", "2.", "i.", "ii."
}

export interface QuestionGroup {
  id: string;
  sectionId: string;
  title?: string;
  instruction?: string;
  questions: EnhancedQuestion[];
  order: number;
}

export interface ExamSection {
  id: string;
  type: "INSTRUCTION" | "QUESTIONS" | "DIVIDER";
  title: string;
  description?: string;
  content?: string;
  instruction?: string;
  order: number;
  examPart: 1 | 2;
  numberingStyle?: "numeric" | "roman" | "alphabet";
  defaultQuestionType?: QuestionType;
}

// Keep these for internal UI use
export interface Option {
  id?: string;
  optionText: string;
  isCorrect: boolean;
  order: number;
}

export interface MatchingPair {
  id?: string;
  leftItem: string;
  rightItem: string;
  order: number;
}

export interface SubQuestion {
  id?: string;
  questionText: string;
  marks: number;
  order: number;
  correctAnswer?: string;
}

const STEPS = [
  { id: 1, name: "Details", description: "Basic exam information" },
  { id: 2, name: "Questions", description: "Add and manage questions" },
  { id: 3, name: "Settings", description: "Configure exam settings" },
  { id: 4, name: "Advanced", description: "Advanced options" },
  { id: 5, name: "Review", description: "Review and submit" },
];

// Draft interface for storage
interface ExamDraft {
  formData: ExamFormData;
  currentStep: number;
  lastSaved: string;
  version: number;
}

// Helper functions for draft management
const getDraftKey = (draftId?: string) =>
  draftId ? `${DRAFT_STORAGE_KEY}_${draftId}` : `${DRAFT_STORAGE_KEY}_new`;

const saveDraftToStorage = (draft: ExamDraft, draftId?: string): void => {
  try {
    const key = getDraftKey(draftId);
    localStorage.setItem(key, JSON.stringify(draft));
    logger.debug("Draft saved to localStorage", {
      key,
      lastSaved: draft.lastSaved,
    });
  } catch (error) {
    logger.error("Failed to save draft to localStorage", error);
  }
};

const loadDraftFromStorage = (draftId?: string): ExamDraft | null => {
  try {
    const key = getDraftKey(draftId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const draft = JSON.parse(stored) as ExamDraft;
      logger.debug("Draft loaded from localStorage", {
        key,
        lastSaved: draft.lastSaved,
      });
      return draft;
    }
  } catch (error) {
    logger.error("Failed to load draft from localStorage", error);
  }
  return null;
};

const clearDraftFromStorage = (draftId?: string): void => {
  try {
    const key = getDraftKey(draftId);
    localStorage.removeItem(key);
    logger.debug("Draft cleared from localStorage", { key });
  } catch (error) {
    logger.error("Failed to clear draft from localStorage", error);
  }
};

const getAllDrafts = (): { key: string; draft: ExamDraft }[] => {
  const drafts: { key: string; draft: ExamDraft }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DRAFT_STORAGE_KEY)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          drafts.push({ key, draft: JSON.parse(stored) });
        }
      }
    }
  } catch (error) {
    logger.error("Failed to get all drafts", error);
  }
  return drafts;
};

export default function ExamBuilderWizard({
  onClose,
  onComplete,
  isAdmin = false,
  draftId,
}: {
  onClose?: () => void;
  onComplete?: (examId: string) => void;
  isAdmin?: boolean;
  draftId?: string;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showClearDraftDialog, setShowClearDraftDialog] = useState(false);
  const [existingDraft, setExistingDraft] = useState<ExamDraft | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChanges = useRef(false);

  const defaultFormData: ExamFormData = {
    // Basic Details
    title: "",
    description: "",
    type: "MIXED",
    duration: 60,
    totalMarks: 100,
    passingMarks: 40,
    attemptsAllowed: 1,

    // Target Audience
    subjectId: "",
    gradeId: "",
    mediumId: "",
    classId: "",

    // Schedule
    startTime: "",
    endTime: "",

    // Questions
    questions: [],

    // Hierarchical structure
    sections: [],
    questionGroups: [],
    useHierarchicalStructure: false,

    // Part marks
    part1Marks: 60,
    part2Marks: 40,

    // File upload settings
    allowFileUpload: false,
    maxFileSize: 10,
    allowedFileTypes: ["pdf", "docx", "jpg", "png"],
    uploadInstructions: "",

    // Windowed access
    windowStart: "",
    windowEnd: "",
    lateSubmissionAllowed: false,
    latePenaltyPercent: 10,

    // Ranking settings
    enableRanking: true,
    rankingLevels: ["NATIONAL", "DISTRICT"],

    // AI monitoring
    aiMonitoringEnabled: false,
    faceVerificationRequired: false,
    browseLockEnabled: false,

    // Other settings
    instructions: "",
    timeZone: "Asia/Colombo",
    allowedResources: "",
    randomizeQuestions: false,
    randomizeOptions: false,
    showResults: true,

    // Format and access
    format: "FULL_ONLINE",
    visibility: "BOTH",
  };

  const [formData, setFormData] = useState<ExamFormData>(defaultFormData);

  // Load existing draft callback
  const loadDraft = useCallback(() => {
    if (existingDraft) {
      setFormData(existingDraft.formData);
      setCurrentStep(existingDraft.currentStep);
      setLastSaved(new Date(existingDraft.lastSaved));
      toast.success("Draft restored successfully");
    }
    setShowDraftDialog(false);
  }, [existingDraft]);

  // Discard existing draft
  const discardDraft = useCallback(() => {
    clearDraftFromStorage(draftId);
    setExistingDraft(null);
    setShowDraftDialog(false);
    toast.info("Starting fresh");
  }, [draftId]);

  // Save draft manually or automatically - MUST be defined before useEffects that use it
  const saveDraft = useCallback(
    async (showToast = true) => {
      if (!formData.title.trim()) {
        if (showToast) {
          toast.error("Please enter an exam title to save draft");
        }
        return;
      }

      setSavingDraft(true);
      try {
        const draft: ExamDraft = {
          formData,
          currentStep,
          lastSaved: new Date().toISOString(),
          version: 1,
        };

        saveDraftToStorage(draft, draftId);
        setLastSaved(new Date());
        hasUnsavedChanges.current = false;

        if (showToast) {
          toast.success("Draft saved successfully");
        }
      } catch (error) {
        logger.error("Failed to save draft", error);
        if (showToast) {
          toast.error("Failed to save draft");
        }
      } finally {
        setSavingDraft(false);
      }
    },
    [formData, currentStep, draftId]
  );

  // Clear draft
  const clearDraft = useCallback(() => {
    clearDraftFromStorage(draftId);
    setFormData(defaultFormData);
    setCurrentStep(1);
    setLastSaved(null);
    hasUnsavedChanges.current = false;
    setShowClearDraftDialog(false);
    toast.success("Draft cleared");
  }, [draftId]);

  // Check for existing draft on mount
  useEffect(() => {
    const draft = loadDraftFromStorage(draftId);
    if (draft && !isDraftLoaded) {
      setExistingDraft(draft);
      setShowDraftDialog(true);
    }
    setIsDraftLoaded(true);
  }, [draftId, isDraftLoaded]);

  // Auto-save timer
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      if (hasUnsavedChanges.current) {
        saveDraft(false); // Silent save
      }
    }, DRAFT_AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [saveDraft]);

  // Save draft before leaving (browser unload) and keyboard shortcut
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current && formData.title.trim()) {
        saveDraftToStorage(
          {
            formData,
            currentStep,
            lastSaved: new Date().toISOString(),
            version: 1,
          },
          draftId
        );
        e.preventDefault();
        e.returnValue = "";
      }
    };

    // Keyboard shortcut for saving (Ctrl+S or Cmd+S)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (formData.title.trim()) {
          saveDraft(true);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [formData, currentStep, draftId, saveDraft]);

  const updateFormData = (updates: Partial<ExamFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    hasUnsavedChanges.current = true;
  };

  const goToNextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
      hasUnsavedChanges.current = true;
      // Auto-save on step change
      if (formData.title.trim()) {
        saveDraft(false);
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      hasUnsavedChanges.current = true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Helper function to convert datetime-local to ISO string
      const formatDateTimeForBackend = (dateTimeLocal: string): string => {
        if (!dateTimeLocal) return "";

        const date = new Date(dateTimeLocal);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date format: ${dateTimeLocal}`);
        }
        return date.toISOString();
      };

      // Validate required fields
      const validationErrors: string[] = [];

      if (!formData.title?.trim())
        validationErrors.push("Exam title is required");
      if (!formData.subjectId) validationErrors.push("Subject is required");
      if (!formData.gradeId) validationErrors.push("Grade is required");
      if (!formData.mediumId) validationErrors.push("Medium is required");
      if (!formData.startTime) validationErrors.push("Start time is required");
      if (!formData.endTime) validationErrors.push("End time is required");
      if (formData.duration <= 0)
        validationErrors.push("Duration must be greater than 0");
      if (formData.totalMarks <= 0)
        validationErrors.push("Total marks must be greater than 0");
      if (formData.passingMarks <= 0)
        validationErrors.push("Passing marks must be greater than 0");
      if (formData.questions.length === 0)
        validationErrors.push("At least one question is required");

      if (validationErrors.length > 0) {
        toast.error(`Please fix these errors: ${validationErrors.join(", ")}`);
        setSubmitting(false);
        return;
      }

      // Create the exam payload - REMOVE useHierarchicalStructure for now
      const examPayload = {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        duration: formData.duration,
        totalMarks: formData.totalMarks,
        passingMarks: formData.passingMarks,
        attemptsAllowed: formData.attemptsAllowed,

        // REQUIRED fields
        subjectId: formData.subjectId,
        gradeId: formData.gradeId,
        mediumId: formData.mediumId,

        // Optional class
        classId: formData.classId || undefined,

        // Schedule - REQUIRED
        startTime: formatDateTimeForBackend(formData.startTime),
        endTime: formatDateTimeForBackend(formData.endTime),

        // Instructions
        instructions: formData.instructions || undefined,

        // Part marks - only for MIXED exams
        ...(formData.type === "MIXED" && {
          part1Marks: formData.part1Marks,
          part2Marks: formData.part2Marks,
        }),

        // File upload settings
        allowFileUpload: formData.allowFileUpload || false,
        ...(formData.allowFileUpload && {
          maxFileSize: formData.maxFileSize || 10,
          allowedFileTypes: formData.allowedFileTypes || [
            "pdf",
            "docx",
            "jpg",
            "png",
          ],
          uploadInstructions: formData.uploadInstructions || undefined,
        }),

        // Windowed access
        ...(formData.windowStart && {
          windowStart: formatDateTimeForBackend(formData.windowStart),
        }),
        ...(formData.windowEnd && {
          windowEnd: formatDateTimeForBackend(formData.windowEnd),
        }),
        lateSubmissionAllowed: formData.lateSubmissionAllowed || false,
        ...(formData.lateSubmissionAllowed && {
          latePenaltyPercent: formData.latePenaltyPercent || 10,
        }),

        // Ranking settings
        enableRanking: formData.enableRanking || false,
        ...(formData.enableRanking && {
          rankingLevels: formData.rankingLevels || [],
        }),

        // AI monitoring
        aiMonitoringEnabled: formData.aiMonitoringEnabled || false,
        faceVerificationRequired: formData.faceVerificationRequired || false,
        browseLockEnabled: formData.browseLockEnabled || false,

        // Other fields
        timeZone: formData.timeZone || "Asia/Colombo",
        allowedResources: formData.allowedResources || undefined,

        // New fields  to DTO
        randomizeQuestions: formData.randomizeQuestions || false,
        randomizeOptions: formData.randomizeOptions || false,
        showResults: formData.showResults !== false,

        // REMOVE THIS FOR NOW - it's causing the error
        useHierarchicalStructure: formData.useHierarchicalStructure || false,

        // Also removed sections from initial payload
        ...(formData.useHierarchicalStructure &&
          formData.sections &&
          formData.sections.length > 0 && {
            sections: formData.sections.map((section) => ({
              title: section.title,
              description: section.instruction || section.description || "",
              order: section.order,
              examPart: section.examPart || 1,
            })),
          }),
      };

      console.log("=== DEBUG: Exam Payload (without useHierarchicalStructure) ===");
      console.log("Payload:", JSON.stringify(examPayload, null, 2));
      console.log("Subject ID:", examPayload.subjectId);
      console.log("Questions count:", formData.questions.length);
      console.log("=== END DEBUG ===");

      // Create the exam
      const examResponse = await ApiClient.post<{ id: string; data?: { id: string; data?: { id: string } } }>("/exams", examPayload);

      // Handle response format
      let examId: string;
      if (examResponse && (examResponse as any).id) {
        examId = (examResponse as any).id;
      } else if (
        examResponse &&
        (examResponse as any).data &&
        (examResponse as any).data.id
      ) {
        examId =
          (examResponse as any).data.data?.id || (examResponse as any).data.id;
      } else {
        console.error("Unexpected response format:", examResponse);
        throw new Error("Failed to get exam ID from response");
      }

      console.log("Exam created successfully with ID:", examId);

      // IMPORTANT: Now create sections and questions

      // Step 1: Create sections if hierarchical structure is enabled
      if (
        formData.useHierarchicalStructure &&
        formData.sections &&
        formData.sections.length > 0
      ) {
        try {
          const sectionsPayload = formData.sections.map((section) => ({
            title: section.title,
            description: section.instruction || section.description || "",
            order: section.order,
            examPart: section.examPart || 1,
          }));

          console.log("Creating sections:", sectionsPayload.length);
          await ApiClient.post(`/exams/${examId}/sections/bulk`, {
            sections: sectionsPayload,
          });
          console.log("Sections created successfully");
        } catch (sectionError: any) {
          console.error("Failed to create sections:", sectionError);
          toast.error(
            `Exam created but sections failed: ${sectionError.message}`
          );
        }
      }

      // Step 2: Create questions
      if (formData.questions.length > 0) {
        try {
          const questionsPayload = formData.questions.map((question, index) => {
            // Prepare base question
            const baseQuestion: any = {
              type: question.type,
              question: question.question || "",
              points: question.points || 1,
              order: index + 1,
              examPart: question.examPart || 1,
              section: question.section || undefined,
              imageUrl: question.imageUrl,
              videoUrl: question.videoUrl,
              attachmentUrl: question.attachmentUrl,
              explanation: question.explanation,
              sectionId: question.sectionId,
              groupId: question.groupId,
              showNumber: question.showNumber !== false,
              numbering: question.numbering,
            };

            // Add type-specific fields
            switch (question.type) {
              case "MULTIPLE_CHOICE":
              case "TRUE_FALSE":
                // Convert options to MCQOption format
                baseQuestion.options = ((question.options || []) as any[]).map(
                  (opt, idx) => ({
                    id: `opt_${idx + 1}`,
                    text:
                      typeof opt === "string" ? opt : (opt as any).text || "",
                    isCorrect:
                      (typeof opt === "string" ? opt : (opt as any).text) ===
                      question.correctAnswer,
                  })
                );
                baseQuestion.correctAnswer = question.correctAnswer || "";
                break;
              case "FILL_BLANK":
                baseQuestion.correctAnswer = question.correctAnswer || "";
                break;
              case "MATCHING":
                baseQuestion.matchingPairs = question.matchingPairs || "";
                break;
              case "SHORT_ANSWER":
              case "ESSAY":
                baseQuestion.correctAnswer = question.correctAnswer || "";
                break;
            }

            return baseQuestion;
          });

          console.log("Creating questions:", questionsPayload.length);
          console.log(
            "Questions payload:",
            JSON.stringify(questionsPayload[0], null, 2)
          );
          await ApiClient.post(`/exams/${examId}/questions/bulk`, {
            questions: questionsPayload,
          });

          console.log("Questions created successfully");
        } catch (questionsError: any) {
          console.error("Failed to create questions:", questionsError);
          toast.error(
            `Exam created but questions failed: ${questionsError.message}`
          );
        }
      }

      // Clear draft after successful submission
      clearDraftFromStorage(draftId);
      hasUnsavedChanges.current = false;

      handleApiSuccess("Exam created successfully!");

      if (onComplete) onComplete(examId);
      if (onClose) onClose();
    } catch (error: any) {
      console.error("Error creating exam:", error);

      if (error.message?.includes("useHierarchicalStructure")) {
        toast.error(
          "Database field missing. Please contact admin to add useHierarchicalStructure field to exams table."
        );
      } else if (error.message?.includes("Medium ID is required")) {
        toast.error("Please select a medium (language) for the exam");
      } else if (error.message?.includes("400")) {
        toast.error("Invalid exam data. Please check all required fields.");
      } else {
        handleApiError(
          error,
          "ExamBuilderWizard.handleSubmit",
          "Failed to create exam. Please check all required fields and try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.title.trim() !== "" &&
          formData.gradeId !== "" &&
          formData.subjectId !== "" &&
          formData.mediumId !== "" &&
          formData.duration > 0 &&
          formData.totalMarks > 0 &&
          formData.passingMarks > 0 &&
          formData.startTime !== "" &&
          formData.endTime !== ""
        );
      case 2:
        return formData.questions.length > 0;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Restore Draft Dialog */}
      <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Restore Previous Draft?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You have an unsaved exam draft from{" "}
                <strong>
                  {existingDraft?.lastSaved
                    ? new Date(existingDraft.lastSaved).toLocaleString()
                    : "earlier"}
                </strong>
              </p>
              {existingDraft?.formData.title && (
                <p className="text-sm">
                  Title: <strong>{existingDraft.formData.title}</strong>
                </p>
              )}
              {existingDraft?.formData.questions.length ? (
                <p className="text-sm">
                  Questions:{" "}
                  <strong>{existingDraft.formData.questions.length}</strong>
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground mt-2">
                Would you like to continue where you left off?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={discardDraft}>
              Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction onClick={loadDraft}>
              Restore Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Draft Confirmation Dialog */}
      <AlertDialog
        open={showClearDraftDialog}
        onOpenChange={setShowClearDraftDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Clear Draft?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your saved draft and reset the form.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={clearDraft}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl">Create New Exam</CardTitle>

            {/* Draft Status & Actions */}
            <div className="flex items-center gap-2">
              {lastSaved && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 text-xs"
                >
                  <Clock className="h-3 w-3" />
                  Saved {new Date(lastSaved).toLocaleTimeString()}
                </Badge>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => saveDraft(true)}
                disabled={savingDraft || !formData.title.trim()}
              >
                {savingDraft ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="ml-1 hidden sm:inline">Save Draft</span>
              </Button>

              {(lastSaved || formData.title.trim()) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearDraftDialog(true)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Step Progress */}
          <div className="mt-4 space-y-4">
            <Progress value={progress} className="h-2" />

            <div className="flex justify-between">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 ${
                    step.id === currentStep
                      ? "text-primary font-semibold"
                      : step.id < currentStep
                        ? "text-green-600"
                        : "text-gray-400"
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                        step.id === currentStep
                          ? "border-primary bg-primary text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {step.id}
                    </div>
                  )}
                  <div className="hidden md:block">
                    <div className="text-sm font-medium">{step.name}</div>
                    <div className="text-xs">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-h-[500px]">
          {currentStep === 1 && (
            <ExamDetailsStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          {currentStep === 2 && (
            <ExamQuestionsStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          {currentStep === 3 && (
            <ExamSettingsStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          {currentStep === 4 && (
            <ExamAdvancedSettingsStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          {currentStep === 5 && <ExamReviewStep formData={formData} />}
        </CardContent>

        {/* Navigation Buttons */}
        <div className="flex justify-between p-6 border-t">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 1 || submitting}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={goToNextStep}
              disabled={!canProceed() || submitting}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Exam...
                </>
              ) : (
                "Create Exam"
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
