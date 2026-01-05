"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  FileText,
  CheckCircle2,
  Circle,
  Type,
  List,
  Square,
  MessageSquare,
  AlignLeft,
  CheckSquare,
  Layers,
  FileEdit,
} from "lucide-react";
import {
  ExamFormData,
  Question,
  QuestionType,
  EnhancedQuestion,
  ExamSection,
} from "../ExamBuilderWizard";
import QuestionEditor from "./QuestionEditor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { cn, prepareRichText } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { mediumsApi } from "@/lib/api/endpoints/mediums";
import { LanguageInput } from "@/components/shared/LanguageInput";
import { LanguageTextarea } from "@/components/shared/LanguageTextarea";
import { getLanguageFontStyle } from "@/lib/utils/fonts";

interface ExamQuestionsStepProps {
  formData: ExamFormData;
  updateFormData: (updates: Partial<ExamFormData>) => void;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_FALSE: "True/False",
  SHORT_ANSWER: "Short Answer",
  ESSAY: "Essay",
  FILL_BLANK: "Fill in the Blank",
  MATCHING: "Matching",
};

const QUESTION_TYPE_ICONS: Record<QuestionType, React.ReactNode> = {
  MULTIPLE_CHOICE: <CheckSquare className="h-4 w-4" />,
  TRUE_FALSE: <Square className="h-4 w-4" />,
  SHORT_ANSWER: <MessageSquare className="h-4 w-4" />,
  ESSAY: <AlignLeft className="h-4 w-4" />,
  FILL_BLANK: <Type className="h-4 w-4" />,
  MATCHING: <Layers className="h-4 w-4" />,
};

// Helper function to remove section prefix (e.g., "Part I - " from titles)
function getSectionDisplayTitle(title: string): string {
  // Remove patterns like "Part I - ", "Part II - ", "PART_I - ", "PART_II - " etc.
  return title.replace(/^(Part|PART)\s+([IVX]+)\s*[-–]\s*/i, "").trim();
}

// Question Preview Component
function QuestionPreview({
  question,
  index,
  sectionTitle,
  mediumName,
}: {
  question: Question;
  index: number;
  sectionTitle?: string;
  mediumName?: string;
}) {
  const fontStyle = getLanguageFontStyle(mediumName);

  const renderAnswerArea = () => {
    switch (question.type) {
      case "MULTIPLE_CHOICE":
        return (
          <div className="space-y-2 mt-4">
            {question.options
              ?.filter((o) => o)
              .map((option, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-lg border",
                    option === question.correctAnswer
                      ? "bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-800"
                      : "bg-card"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {option === question.correctAnswer ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/50" />
                    )}
                    <span style={fontStyle}>{option}</span>
                    {option === question.correctAnswer && (
                      <Badge className="ml-auto bg-green-100 text-green-700">
                        Correct
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
          </div>
        );
      case "TRUE_FALSE":
        return (
          <div className="flex gap-4 mt-4">
            {["True", "False"].map((option) => (
              <div
                key={option}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border",
                  option === question.correctAnswer
                    ? "bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-800"
                    : "bg-card"
                )}
              >
                {option === question.correctAnswer ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/50" />
                )}
                <span className="font-medium" style={fontStyle}>
                  {option}
                </span>
              </div>
            ))}
          </div>
        );
      case "FILL_BLANK": {
        const parts = question.question.split("[BLANK]");
        return (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Student will see:
            </p>
            <p className="text-base" style={fontStyle}>
              {parts.map((part, i) => (
                <React.Fragment key={i}>
                  {part}
                  {i < parts.length - 1 && (
                    <span className="inline-block w-24 h-6 bg-gray-200 rounded mx-1 align-middle"></span>
                  )}
                </React.Fragment>
              ))}
            </p>
            {question.correctAnswer && (
              <p className="mt-2 text-sm text-green-600">
                <span className="font-medium">Correct answer:</span>{" "}
                <span style={fontStyle}>{question.correctAnswer}</span>
              </p>
            )}
          </div>
        );
      }
      case "SHORT_ANSWER":
        return (
          <div className="mt-4">
            <div className="border-b-2 border-dashed border-border py-4 text-muted-foreground text-sm">
              Student will enter a short text response here...
            </div>
            {question.correctAnswer && (
              <p className="mt-2 text-sm text-green-600">
                <span className="font-medium">Expected answer:</span>{" "}
                <span style={fontStyle}>{question.correctAnswer}</span>
              </p>
            )}
          </div>
        );
      case "ESSAY":
        return (
          <div className="mt-4 border-2 border-dashed border-border rounded-lg p-6 text-muted-foreground text-sm">
            <FileText className="h-8 w-8 mx-auto mb-2" />
            <p className="text-center">
              Student will write an essay response here...
            </p>
          </div>
        );
      case "MATCHING":
        return (
          <div className="mt-4 text-sm text-muted-foreground">
            Matching pairs will be displayed here
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-6 bg-card">
      {sectionTitle && (
        <div className="mb-4 pb-3 border-b">
          <Badge variant="outline" className="mb-2">
            {sectionTitle}
          </Badge>
        </div>
      )}
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
          {index + 1}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Badge
              className={getQuestionTypeColorStatic(question.type)}
              variant="outline"
            >
              {QUESTION_TYPE_LABELS[question.type]}
            </Badge>
            <Badge variant="secondary">{question.points} points</Badge>
          </div>
          {question.question ? (
            <div
              className="text-lg font-medium max-w-none rich-text-content"
              style={fontStyle}
              dangerouslySetInnerHTML={{
                __html: prepareRichText(question.question),
              }}
            />
          ) : (
            <p className="text-lg font-medium text-gray-400 italic">
              No question text
            </p>
          )}
          {question.imageFile && (
            <div className="mt-4">
              <img
                src={URL.createObjectURL(question.imageFile)}
                alt="Question image"
                className="max-h-48 rounded-lg border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {question.imageFile.name} (to be uploaded)
              </p>
            </div>
          )}
          {question.imageUrl && !question.imageFile && (
            <div className="mt-4">
              <img
                src={question.imageUrl}
                alt="Question image"
                className="max-h-48 rounded-lg border"
              />
            </div>
          )}
          {renderAnswerArea()}
        </div>
      </div>
    </Card>
  );
}

// Static helper for color
function getQuestionTypeColorStatic(type: QuestionType) {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "TRUE_FALSE":
      return "bg-green-100 text-green-800 border-green-300";
    case "SHORT_ANSWER":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "ESSAY":
      return "bg-purple-100 text-purple-800 border-purple-300";
    case "FILL_BLANK":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "MATCHING":
      return "bg-pink-100 text-pink-800 border-pink-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

export default function ExamQuestionsStep({
  formData,
  updateFormData,
}: ExamQuestionsStepProps) {
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<
    number | null
  >(null);
  const [previewQuestion, setPreviewQuestion] = useState<{
    question: Question;
    index: number;
    sectionTitle?: string;
  } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [showEditSectionDialog, setShowEditSectionDialog] = useState<{
    open: boolean;
    section: ExamSection | null;
  }>({ open: false, section: null });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [mediumName, setMediumName] = useState<string>("");

  const [newSectionData, setNewSectionData] = useState({
    title: "",
    instruction: "",
    questionType: "MULTIPLE_CHOICE" as QuestionType,
  });

  // Fetch medium name when mediumId changes
  useEffect(() => {
    const fetchMedium = async () => {
      if (!formData.mediumId) {
        setMediumName("");
        return;
      }
      try {
        // Get all mediums and find the one matching our ID
        const response = await mediumsApi.getAll({ includeInactive: false });
        const mediums = response?.mediums || [];
        const selectedMedium = mediums.find((m) => m.id === formData.mediumId);
        if (selectedMedium) {
          setMediumName(selectedMedium.name);
          console.log("Medium fetched successfully:", selectedMedium.name);
        } else {
          console.warn("Medium not found for ID:", formData.mediumId);
          setMediumName("");
        }
      } catch (error) {
        console.error("Error fetching medium:", error);
        setMediumName("");
      }
    };
    fetchMedium();
  }, [formData.mediumId]);

  // Initialize with one section if empty
  React.useEffect(() => {
    if (!formData.sections || formData.sections.length === 0) {
      const initialSection: ExamSection = {
        id: `section_${Date.now()}`,
        type: "INSTRUCTION",
        title: "Part I - Multiple Choice Questions",
        instruction: "Choose the correct answer for each question below.",
        order: 1,
        examPart: 1,
        numberingStyle: "numeric",
      };
      updateFormData({
        sections: [initialSection],
        useHierarchicalStructure: true,
      });
      setExpandedSections(new Set([initialSection.id]));
    } else {
      // Auto-expand first section
      if (formData.sections.length > 0 && expandedSections.size === 0) {
        setExpandedSections(new Set([formData.sections[0].id]));
      }
    }
  }, []);

  // ========== SECTION MANAGEMENT ==========
  const addNewSection = () => {
    if (!newSectionData.title.trim()) {
      alert("Please enter a section title");
      return;
    }

    const newSection: ExamSection = {
      id: `section_${Date.now()}`,
      type: "INSTRUCTION",
      title: newSectionData.title,
      instruction: newSectionData.instruction,
      order: (formData.sections?.length || 0) + 1,
      examPart: 1,
      numberingStyle: "numeric",
    };

    const updatedSections = [...(formData.sections || []), newSection];
    updateFormData({ sections: updatedSections });

    // Auto-expand new section
    setExpandedSections((prev) => new Set([...prev, newSection.id]));

    // Reset form
    setNewSectionData({
      title: "",
      instruction: "",
      questionType: "MULTIPLE_CHOICE",
    });
    setShowAddSectionDialog(false);
  };

  const updateSection = (id: string, updates: Partial<ExamSection>) => {
    const updated = (formData.sections || []).map((section) =>
      section.id === id ? { ...section, ...updates } : section
    );
    updateFormData({ sections: updated });
  };

  const deleteSection = (id: string) => {
    const updated = (formData.sections || []).filter((s) => s.id !== id);
    // Also delete questions in this section
    const updatedQuestions = formData.questions.filter(
      (q) => q.sectionId !== id
    );
    updateFormData({ sections: updated, questions: updatedQuestions });
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const sections = [...(formData.sections || [])];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    [sections[index], sections[newIndex]] = [
      sections[newIndex],
      sections[index],
    ];
    // Update order numbers
    sections.forEach((s, i) => {
      s.order = i + 1;
    });

    updateFormData({ sections });
  };

  // ========== QUESTION MANAGEMENT ==========
  const addQuestionToSection = (sectionId: string, type?: QuestionType) => {
    const section = formData.sections?.find((s) => s.id === sectionId);
    if (!section) return;

    const questionType = type || "MULTIPLE_CHOICE";

    const newQuestion: EnhancedQuestion = {
      id: `q_${Date.now()}`,
      type: questionType,
      question: "",
      options:
        questionType === "MULTIPLE_CHOICE" || questionType === "TRUE_FALSE"
          ? ["", "", "", ""]
          : [],
      correctAnswer: "",
      points: 1,
      order:
        formData.questions.filter((q) => q.sectionId === sectionId).length + 1,
      examPart: section.examPart,
      sectionId: sectionId,
      subQuestions: [],
      showNumber: true,
    };

    if (questionType === "TRUE_FALSE") {
      newQuestion.options = ["True", "False"];
    }

    if (questionType === "FILL_BLANK") {
      newQuestion.question = "Fill in the blank: ______";
    }

    updateFormData({ questions: [...formData.questions, newQuestion] });
    setEditingQuestionIndex(formData.questions.length);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updated = [...formData.questions];
    updated[index] = { ...updated[index], ...updates };
    updateFormData({ questions: updated });
  };

  const deleteQuestion = (index: number) => {
    const updated = formData.questions.filter((_, i) => i !== index);
    updateFormData({ questions: updated });
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
    }
  };

  const duplicateQuestion = (index: number) => {
    const questionToCopy = { ...formData.questions[index] };
    delete questionToCopy.id;
    const sectionId = questionToCopy.sectionId;
    questionToCopy.order =
      formData.questions.filter((q) => q.sectionId === sectionId).length + 1;
    updateFormData({ questions: [...formData.questions, questionToCopy] });
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const question = formData.questions[index];
    const sectionQuestions = formData.questions
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => q.sectionId === question.sectionId)
      .sort((a, b) => (a.q.order || 0) - (b.q.order || 0));

    const currentSectionIndex = sectionQuestions.findIndex(
      (sq) => sq.i === index
    );
    if (currentSectionIndex === -1) return;

    const newSectionIndex =
      direction === "up" ? currentSectionIndex - 1 : currentSectionIndex + 1;
    if (newSectionIndex < 0 || newSectionIndex >= sectionQuestions.length)
      return;

    const newGlobalIndex = sectionQuestions[newSectionIndex].i;

    // Swap orders
    const updated = [...formData.questions];
    const tempOrder = updated[index].order;
    updated[index].order = updated[newGlobalIndex].order;
    updated[newGlobalIndex].order = tempOrder;

    updateFormData({ questions: updated });
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(newGlobalIndex);
    }
  };

  // ========== RENDER FUNCTIONS ==========
  const getQuestionTypeColor = (type: QuestionType) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "TRUE_FALSE":
        return "bg-green-100 text-green-800 border-green-300";
      case "SHORT_ANSWER":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "ESSAY":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "FILL_BLANK":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "MATCHING":
        return "bg-pink-100 text-pink-800 border-pink-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const renderSection = (section: ExamSection, index: number) => {
    const questionsInSection = formData.questions
      .filter((q) => q.sectionId === section.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const isExpanded = expandedSections.has(section.id);
    const defaultType = "MULTIPLE_CHOICE";

    return (
      <Card
        key={section.id}
        className="mb-6 overflow-hidden border-2 border-blue-100"
      >
        {/* Section Header */}
        <div
          className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => {
            setExpandedSections((prev) => {
              const next = new Set(prev);
              if (next.has(section.id)) {
                next.delete(section.id);
              } else {
                next.add(section.id);
              }
              return next;
            });
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-blue-400" />
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-blue-600" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-blue-600" />
                )}
              </div>

              <div className="flex items-center gap-3">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                  Section {index + 1}
                </Badge>

                <div>
                  <h3 className="font-semibold text-gray-900">
                    {getSectionDisplayTitle(section.title)}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={getQuestionTypeColor(defaultType)}
                    >
                      {QUESTION_TYPE_ICONS[defaultType]}
                      {QUESTION_TYPE_LABELS[defaultType]} Questions
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {questionsInSection.length} questions
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  moveSection(index, "up");
                }}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  moveSection(index, "down");
                }}
                disabled={index === (formData.sections?.length || 0) - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditSectionDialog({ open: true, section });
                }}
              >
                <FileEdit className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(section.id);
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Section Content */}
        {isExpanded && (
          <div className="p-6 space-y-6">
            {/* Section Instruction Display */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-800">
                  Instructions for this section:
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setShowEditSectionDialog({ open: true, section })
                  }
                >
                  Edit
                </Button>
              </div>
              {section.instruction ? (
                <div
                  className="p-3 bg-white rounded border rich-text-content"
                  dangerouslySetInnerHTML={{
                    __html: prepareRichText(section.instruction),
                  }}
                />
              ) : (
                <p className="text-gray-500 italic p-3 bg-white rounded border">
                  No instructions added yet. Students will see the default
                  prompt for {QUESTION_TYPE_LABELS[defaultType]} questions.
                </p>
              )}
            </Card>

            {/* Questions in this Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-lg">
                  Questions in this section ({questionsInSection.length})
                </h4>

                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Question
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          addQuestionToSection(section.id, defaultType)
                        }
                      >
                        <div className="flex items-center gap-2">
                          {QUESTION_TYPE_ICONS[defaultType]}
                          <span>Add {QUESTION_TYPE_LABELS[defaultType]}</span>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                        Other question types:
                      </div>

                      {Object.entries(QUESTION_TYPE_LABELS)
                        .filter(([type]) => type !== defaultType)
                        .map(([type, label]) => (
                          <DropdownMenuItem
                            key={type}
                            onClick={() =>
                              addQuestionToSection(
                                section.id,
                                type as QuestionType
                              )
                            }
                          >
                            <div className="flex items-center gap-2">
                              {QUESTION_TYPE_ICONS[type as QuestionType]}
                              <span>Add {label}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {questionsInSection.length === 0 ? (
                <Card className="text-center py-8 border-2 border-dashed rounded-lg">
                  <div className="mb-4 text-gray-400">
                    <CheckSquare className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="font-medium text-gray-600">
                    No questions added yet
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Add questions to this section based on: "
                    {section.instruction ||
                      getSectionDisplayTitle(section.title)}
                    "
                  </p>
                  <Button
                    onClick={() => addQuestionToSection(section.id)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Question
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {questionsInSection.map((q, qIndex) => {
                    const globalIndex = formData.questions.findIndex(
                      (question) => question.id === q.id
                    );

                    return (
                      <Card
                        key={q.id}
                        className="p-4 border-l-4 border-blue-500 hover:border-blue-600 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant="default"
                                className="bg-blue-100 text-blue-800"
                              >
                                Q{qIndex + 1}
                              </Badge>
                              <Badge
                                className={cn(
                                  "text-xs",
                                  getQuestionTypeColor(q.type)
                                )}
                              >
                                {QUESTION_TYPE_LABELS[q.type]}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {q.points} pts
                              </Badge>
                            </div>

                            {q.question ? (
                              <div
                                className="text-sm line-clamp-2 rich-text-content"
                                dangerouslySetInnerHTML={{
                                  __html: prepareRichText(q.question),
                                }}
                              />
                            ) : (
                              <p className="text-sm text-gray-400 italic">
                                Click "Edit" to add question text
                              </p>
                            )}

                            {/* Quick Info */}
                            {q.type === "MULTIPLE_CHOICE" && q.options && (
                              <div className="mt-2 text-xs text-gray-500">
                                {q.options.filter((o) => o.trim()).length}{" "}
                                options • Correct:{" "}
                                {q.correctAnswer || "Not set"}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setPreviewQuestion({
                                  question: q,
                                  index: qIndex,
                                  sectionTitle: getSectionDisplayTitle(
                                    section.title
                                  ),
                                })
                              }
                              title="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveQuestion(globalIndex, "up")}
                              disabled={qIndex === 0}
                              title="Move up"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveQuestion(globalIndex, "down")}
                              disabled={
                                qIndex === questionsInSection.length - 1
                              }
                              title="Move down"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => duplicateQuestion(globalIndex)}
                              title="Duplicate"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant={
                                editingQuestionIndex === globalIndex
                                  ? "default"
                                  : "ghost"
                              }
                              onClick={() =>
                                setEditingQuestionIndex(
                                  editingQuestionIndex === globalIndex
                                    ? null
                                    : globalIndex
                                )
                              }
                            >
                              {editingQuestionIndex === globalIndex
                                ? "Close"
                                : "Edit"}
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteQuestion(globalIndex)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Question Editor */}
                        {editingQuestionIndex === globalIndex && (
                          <div className="mt-4 pt-4 border-t">
                            <QuestionEditor
                              question={q}
                              onUpdate={(updates) =>
                                updateQuestion(globalIndex, updates)
                              }
                              mediumName={mediumName}
                            />
                          </div>
                        )}
                      </Card>
                    );
                  })}

                  {/* Add Question button at the end of section */}
                  <div className="flex justify-center pt-4 mt-6 border-t border-dashed">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-2 border-dashed"
                        >
                          <Plus className="h-4 w-4" />
                          Add Question to Section
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        <DropdownMenuItem
                          onClick={() =>
                            addQuestionToSection(section.id, defaultType)
                          }
                        >
                          <div className="flex items-center gap-2">
                            {QUESTION_TYPE_ICONS[defaultType]}
                            <span>Add {QUESTION_TYPE_LABELS[defaultType]}</span>
                          </div>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                          Other question types:
                        </div>

                        {Object.entries(QUESTION_TYPE_LABELS)
                          .filter(([type]) => type !== defaultType)
                          .map(([type, label]) => (
                            <DropdownMenuItem
                              key={type}
                              onClick={() =>
                                addQuestionToSection(
                                  section.id,
                                  type as QuestionType
                                )
                              }
                            >
                              <div className="flex items-center gap-2">
                                {QUESTION_TYPE_ICONS[type as QuestionType]}
                                <span>Add {label}</span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  // Calculate statistics
  const totalQuestions = formData.questions.length;
  const totalPoints = formData.questions.reduce((sum, q) => sum + q.points, 0);
  const sectionsCount = formData.sections?.length || 0;

  const questionTypeBreakdown = useMemo(() => {
    return formData.questions.reduce(
      (acc, q) => {
        acc[q.type] = (acc[q.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [formData.questions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Build Your Exam Paper</h2>
          <p className="text-gray-600">
            Create sections with instructions, then add questions to each
            section. This is exactly how students will see the exam.
          </p>
        </div>

        <Button onClick={() => setShowAddSectionDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Section
        </Button>
      </div>

      {/* Instructions Card */}
      <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <List className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-green-800 mb-1">
              How to build your exam:
            </h4>
            <ol className="text-sm text-green-700 space-y-1 list-decimal pl-4">
              <li>
                <strong>Add a section</strong> with instructions (e.g., "Fill in
                the blanks with correct words")
              </li>
              <li>
                <strong>Choose a question type</strong> for that section
                (Multiple Choice, True/False, etc.)
              </li>
              <li>
                <strong>Add questions</strong> to the section that match the
                instructions
              </li>
              <li>
                <strong>Add more sections</strong> with different instructions
                and question types
              </li>
              <li>
                <strong>Preview</strong> to see exactly how students will see
                the exam
              </li>
            </ol>
          </div>
        </div>
      </Card>

      {/* Sections List */}
      <div className="space-y-4">
        {formData.sections && formData.sections.length > 0 ? (
          formData.sections
            .sort((a, b) => a.order - b.order)
            .map((section, index) => renderSection(section, index))
        ) : (
          <Card className="text-center py-12 border-2 border-dashed">
            <div className="mb-4 text-gray-400">
              <FileText className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Start building your exam paper
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create your first section with instructions, then add questions
              that match those instructions.
            </p>
            <Button
              onClick={() => setShowAddSectionDialog(true)}
              size="lg"
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              Create First Section
            </Button>
          </Card>
        )}
      </div>

      {formData.sections && formData.sections.length > 0 && (
        <div className="flex justify-center py-4">
          <Button
            onClick={() => setShowAddSectionDialog(true)}
            variant="outline"
            className="gap-2 border-2 border-dashed"
          >
            <Plus className="h-5 w-5" />
            Add Another Section
          </Button>
        </div>
      )}

      {/* Exam Summary */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-lg font-semibold mb-4">Exam Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Quick Stats</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg border text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {sectionsCount}
                </div>
                <div className="text-xs text-gray-600">Sections</div>
              </div>
              <div className="bg-white p-3 rounded-lg border text-center">
                <div className="text-2xl font-bold text-green-600">
                  {totalQuestions}
                </div>
                <div className="text-xs text-gray-600">Total Questions</div>
              </div>
              <div className="bg-white p-3 rounded-lg border text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {totalPoints}
                </div>
                <div className="text-xs text-gray-600">Total Points</div>
              </div>
              <div className="bg-white p-3 rounded-lg border text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formData.sections?.filter((s) => s.type === "INSTRUCTION")
                    .length || 0}
                </div>
                <div className="text-xs text-gray-600">Sections</div>
              </div>
            </div>
          </div>

          {/* Question Type Breakdown */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Question Types</h4>
            <div className="space-y-2">
              {Object.entries(questionTypeBreakdown).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${getQuestionTypeColor(type as QuestionType).split(" ")[0]}`}
                    ></div>
                    <span className="text-sm">
                      {QUESTION_TYPE_LABELS[type as QuestionType]}
                    </span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Sections Overview */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">
              Sections Overview
            </h4>
            <div className="space-y-2">
              {formData.sections?.map((section, idx) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {idx + 1}
                    </Badge>
                    <span className="truncate">
                      {getSectionDisplayTitle(section.title)}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {
                      formData.questions.filter(
                        (q) => q.sectionId === section.id
                      ).length
                    }{" "}
                    Q
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Add Section Dialog */}
      <AlertDialog
        open={showAddSectionDialog}
        onOpenChange={setShowAddSectionDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Section</AlertDialogTitle>
            <AlertDialogDescription>
              Add a section with instructions for students. All questions in
              this section will follow these instructions.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Section Title *</Label>
              <LanguageInput
                mediumName={mediumName}
                showVirtualKeyboard={true}
                value={newSectionData.title}
                onChange={(e) =>
                  setNewSectionData({
                    ...newSectionData,
                    title: e.target.value,
                  })
                }
                placeholder="e.g. Multiple Choice Questions"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will appear as a heading in the exam
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Instructions for Students *
              </Label>
              <LanguageTextarea
                mediumName={mediumName}
                showVirtualKeyboard={true}
                value={newSectionData.instruction}
                onChange={(e) =>
                  setNewSectionData({
                    ...newSectionData,
                    instruction: e.target.value,
                  })
                }
                placeholder="e.g., Choose the correct answer from the options given below."
                className="mt-1 min-h-[100px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Students will see this instruction before the questions
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Question Type for this Section
              </Label>
              <Select
                value={newSectionData.questionType}
                onValueChange={(val: QuestionType) =>
                  setNewSectionData({ ...newSectionData, questionType: val })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QUESTION_TYPE_LABELS).map(([type, label]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {QUESTION_TYPE_ICONS[type as QuestionType]}
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                All questions in this section will be{" "}
                {QUESTION_TYPE_LABELS[
                  newSectionData.questionType
                ].toLowerCase()}{" "}
                questions
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={addNewSection}
              disabled={
                !newSectionData.title.trim() ||
                !newSectionData.instruction.trim()
              }
            >
              Add Section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Section Dialog */}
      <AlertDialog
        open={showEditSectionDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditSectionDialog({ open: false, section: null });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Section</AlertDialogTitle>
            <AlertDialogDescription>
              Update the section title, instructions, or question type.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {showEditSectionDialog.section && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium">Section Title</Label>
                <LanguageInput
                  mediumName={mediumName}
                  showVirtualKeyboard={true}
                  value={showEditSectionDialog.section?.title || ""}
                  onChange={(e) => {
                    if (showEditSectionDialog.section) {
                      setShowEditSectionDialog({
                        ...showEditSectionDialog,
                        section: {
                          ...showEditSectionDialog.section,
                          title: e.target.value,
                        },
                      });
                      updateSection(showEditSectionDialog.section.id, {
                        title: e.target.value,
                      });
                    }
                  }}
                  placeholder="e.g. Multiple Choice Questions"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Instructions</Label>
                <LanguageTextarea
                  mediumName={mediumName}
                  showVirtualKeyboard={true}
                  value={showEditSectionDialog.section?.instruction || ""}
                  onChange={(e) => {
                    if (showEditSectionDialog.section) {
                      setShowEditSectionDialog({
                        ...showEditSectionDialog,
                        section: {
                          ...showEditSectionDialog.section,
                          instruction: e.target.value,
                        },
                      });
                      updateSection(showEditSectionDialog.section.id, {
                        instruction: e.target.value,
                      });
                    }
                  }}
                  placeholder="e.g., Choose the correct answer from the options given below."
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Question Type for this Section
                </Label>
                <Select
                  value={"MULTIPLE_CHOICE"}
                  onValueChange={(_val: QuestionType) =>
                    showEditSectionDialog.section &&
                    updateSection(showEditSectionDialog.section.id, {
                      // Note: defaultQuestionType doesn't exist in ExamSection
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(QUESTION_TYPE_LABELS).map(
                      ([type, label]) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            {QUESTION_TYPE_ICONS[type as QuestionType]}
                            <span>{label}</span>
                          </div>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowEditSectionDialog({ open: false, section: null });
              }}
            >
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Section Confirmation Dialog */}
      <AlertDialog
        open={!!showDeleteConfirm}
        onOpenChange={() => setShowDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this section? This will also
              delete all questions in this section. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (showDeleteConfirm) {
                  deleteSection(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Question Preview Dialog */}
      <Dialog
        open={!!previewQuestion}
        onOpenChange={(open) => !open && setPreviewQuestion(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Question Preview
            </DialogTitle>
            <DialogDescription>
              This is exactly how the question will appear to students
            </DialogDescription>
          </DialogHeader>
          {previewQuestion && (
            <div className="mt-4">
              <QuestionPreview
                question={previewQuestion.question}
                index={previewQuestion.index}
                sectionTitle={previewQuestion.sectionTitle}
                mediumName={mediumName}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
