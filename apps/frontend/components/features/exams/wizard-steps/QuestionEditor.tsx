"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Trash2,
  GripVertical,
  CheckCircle2,
  Circle,
  HelpCircle,
  ArrowRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Question, QuestionType } from "../ExamBuilderWizard";
import ImageUpload from "@/components/shared/ImageUpload";
import RichTextEditor from "@/components/shared/RichTextEditor";

interface QuestionEditorProps {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
}

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True/False" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "ESSAY", label: "Essay" },
  { value: "FILL_BLANK", label: "Fill in the Blank" },
  { value: "MATCHING", label: "Matching" },
];

const SECTION_OPTIONS = [
  { value: "PART_I", label: "Part I" },
  { value: "PART_II", label: "Part II" },
  { value: "PART_III", label: "Part III" },
];

export default function QuestionEditor({
  question,
  onUpdate,
}: QuestionEditorProps) {
  // Parse matching pairs from JSON string
  const [matchingPairs, setMatchingPairs] = useState<
    Array<{ left: string; right: string }>
  >(() => {
    if (question.matchingPairs) {
      try {
        return JSON.parse(question.matchingPairs);
      } catch {
        return [{ left: "", right: "" }];
      }
    }
    return [{ left: "", right: "" }];
  });

  // Update matching pairs and sync to question
  const updateMatchingPairs = (
    pairs: Array<{ left: string; right: string }>
  ) => {
    setMatchingPairs(pairs);
    onUpdate({ matchingPairs: JSON.stringify(pairs) });
  };

  // Add option for MCQ
  const addOption = () => {
    const currentOptions = question.options || [];
    if (currentOptions.length < 6) {
      onUpdate({ options: [...currentOptions, ""] });
    }
  };

  // Remove option
  const removeOption = (index: number) => {
    const currentOptions = [...(question.options || [])];
    const removedOption = currentOptions[index];
    currentOptions.splice(index, 1);

    // If removed option was the correct answer, clear it
    const updates: Partial<Question> = { options: currentOptions };
    if (question.correctAnswer === removedOption) {
      updates.correctAnswer = "";
    }

    onUpdate(updates);
  };;

  // Update option text
  const updateOption = (index: number, value: string) => {
    const currentOptions = [...(question.options || [])];
    const oldValue = currentOptions[index];
    currentOptions[index] = value;

    // If this was the correct answer, update correctAnswer too
    const updates: Partial<Question> = { options: currentOptions };
    if (question.correctAnswer === oldValue) {
      updates.correctAnswer = value;
    }

    onUpdate(updates);
  };

  // Set correct answer for MCQ
  const setCorrectOption = (optionText: string) => {
    onUpdate({ correctAnswer: optionText });
  };

  // Add matching pair
  const addMatchingPair = () => {
    if (matchingPairs.length < 8) {
      updateMatchingPairs([...matchingPairs, { left: "", right: "" }]);
    }
  };

  // Remove matching pair
  const removeMatchingPair = (index: number) => {
    const newPairs = matchingPairs.filter((_, i) => i !== index);
    updateMatchingPairs(newPairs.length ? newPairs : [{ left: "", right: "" }]);
  };

  // Update matching pair
  const updatePair = (index: number, side: "left" | "right", value: string) => {
    const newPairs = [...matchingPairs];
    newPairs[index] = { ...newPairs[index], [side]: value };
    updateMatchingPairs(newPairs);
  };

  return (
    <div className="space-y-4">
      {/* Question Text with Rich Formatting */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            Question Text
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Use the formatting toolbar to add bold, italic, or other
                    formatting. You can also attach an image below.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RichTextEditor
            value={question.question || ""}
            onChange={(value) => onUpdate({ question: value })}
            placeholder="Enter your question here..."
            rows={3}
            showFormatting={true}
          />

          {/* Question Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Question Image (Optional)
            </Label>
            <ImageUpload
              value={question.imageUrl}
              onChange={(url) => onUpdate({ imageUrl: url })}
              placeholder="Click to upload question image"
              category="exam-question"
              aspectRatio="auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Type-specific Answer Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              Answer Options
              {question.type === "MULTIPLE_CHOICE" && (
                <Badge variant="secondary" className="text-xs">
                  {question.options?.filter((o) => o).length || 0} options
                </Badge>
              )}
            </span>
            {question.type === "MULTIPLE_CHOICE" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                disabled={(question.options?.length || 0) >= 6}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Multiple Choice Options */}
          {question.type === "MULTIPLE_CHOICE" && (
            <div className="space-y-3">
              {(question.options || ["", ""]).map((option, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    question.correctAnswer === option && option
                      ? "bg-green-50 border-green-300 dark:bg-green-950/20"
                      : "hover:border-gray-300"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {/* Option Selection Radio */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 rounded-full mt-1",
                        question.correctAnswer === option && option
                          ? "text-green-600"
                          : "text-gray-400 hover:text-gray-600"
                      )}
                      onClick={() => option && setCorrectOption(option)}
                      disabled={!option}
                    >
                      {question.correctAnswer === option && option ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </Button>

                    {/* Option Input */}
                    <div className="flex-1 space-y-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        className="h-9"
                      />

                      {/* Option Image Upload */}
                      <div className="pl-1">
                        <ImageUpload
                          value={question.optionImages?.[index]}
                          onChange={(url) => {
                            const newOptionImages = [
                              ...(question.optionImages || []),
                            ];
                            // Ensure array is long enough
                            while (newOptionImages.length <= index) {
                              newOptionImages.push("");
                            }
                            newOptionImages[index] = url || "";
                            onUpdate({ optionImages: newOptionImages });
                          }}
                          placeholder="Add image to this option (optional)"
                          category="exam-question"
                          aspectRatio="auto"
                          className="h-24"
                        />
                      </div>
                    </div>

                    {/* Remove Option Button */}
                    {(question.options?.length || 0) > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          removeOption(index);
                          // Also remove the corresponding option image
                          const newOptionImages = [
                            ...(question.optionImages || []),
                          ];
                          newOptionImages.splice(index, 1);
                          onUpdate({ optionImages: newOptionImages });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Click the circle icon to mark the correct answer. Images are
                optional for each option.
              </p>
            </div>
          )}

          {/* True/False Options */}
          {question.type === "TRUE_FALSE" && (
            <div className="flex gap-4">
              {["True", "False"].map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={
                    question.correctAnswer === option ? "default" : "outline"
                  }
                  className={cn(
                    "flex-1 h-12",
                    question.correctAnswer === option &&
                      "bg-green-600 hover:bg-green-700"
                  )}
                  onClick={() => onUpdate({ correctAnswer: option })}
                >
                  {question.correctAnswer === option && (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  {option}
                </Button>
              ))}
            </div>
          )}

          {/* Short Answer */}
          {question.type === "SHORT_ANSWER" && (
            <div className="space-y-2">
              <Label className="text-sm">Expected Answer / Keywords</Label>
              <RichTextEditor
                value={question.correctAnswer || ""}
                onChange={(value) => onUpdate({ correctAnswer: value })}
                placeholder="Enter the expected answer or keywords for grading reference..."
                rows={2}
                showFormatting={false}
              />
              <p className="text-xs text-muted-foreground">
                This will be shown to graders as a reference. Multiple
                acceptable answers can be listed.
              </p>
            </div>
          )}

          {/* Essay */}
          {question.type === "ESSAY" && (
            <div className="space-y-2">
              <Label className="text-sm">Grading Guidelines / Rubric</Label>
              <RichTextEditor
                value={question.correctAnswer || ""}
                onChange={(value) => onUpdate({ correctAnswer: value })}
                placeholder="Enter grading guidelines, rubric, or expected points to cover..."
                rows={4}
                showFormatting={true}
              />
              <p className="text-xs text-muted-foreground">
                Provide detailed grading criteria for manual marking.
              </p>
            </div>
          )}

          {/* Fill in the Blank */}
          {question.type === "FILL_BLANK" && (
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Use underscores (___) in your question to indicate blanks
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Correct Answer(s)</Label>
                <Input
                  value={question.correctAnswer || ""}
                  onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
                  placeholder="Enter correct answer (use | for multiple acceptable answers)"
                />
                <p className="text-xs text-muted-foreground">
                  Example: "photosynthesis | Photosynthesis" accepts both
                  variations
                </p>
              </div>
            </div>
          )}

          {/* Matching */}
          {question.type === "MATCHING" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm">Matching Pairs</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMatchingPair}
                  disabled={matchingPairs.length >= 8}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Pair
                </Button>
              </div>
              <div className="space-y-2">
                {matchingPairs.map((pair, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-lg border bg-gray-50/50 dark:bg-gray-900/20"
                  >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <Input
                      value={pair.left}
                      onChange={(e) =>
                        updatePair(index, "left", e.target.value)
                      }
                      placeholder={`Left item ${index + 1}`}
                      className="flex-1"
                    />
                    <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                    <Input
                      value={pair.right}
                      onChange={(e) =>
                        updatePair(index, "right", e.target.value)
                      }
                      placeholder={`Right item ${index + 1}`}
                      className="flex-1"
                    />
                    {matchingPairs.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        onClick={() => removeMatchingPair(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Students will match items from the left column to the right
                column
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Question Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Points */}
            <div className="space-y-2">
              <Label className="text-sm">Points</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={question.points || 1}
                onChange={(e) =>
                  onUpdate({
                    points: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                className="w-full"
              />
            </div>

            {/* Section */}
            <div className="space-y-2">
              <Label className="text-sm">Section (Optional)</Label>
              <Select
                value={
                  question.section && question.section !== ""
                    ? question.section
                    : "none"
                }
                onValueChange={(value) =>
                  onUpdate({ section: value === "none" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Section</SelectItem>
                  {SECTION_OPTIONS.filter((opt) => opt.value).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Question Type - Read Only Display */}
            <div className="space-y-2">
              <Label className="text-sm">Question Type</Label>
              <div className="h-10 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm flex items-center">
                {QUESTION_TYPE_OPTIONS.find(
                  (opt) => opt.value === question.type
                )?.label || question.type}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Explanation Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            Explanation
            <Badge variant="outline" className="text-xs font-normal">
              Optional
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={question.explanation || ""}
            onChange={(value) => onUpdate({ explanation: value })}
            placeholder="Add an explanation that will be shown after the exam (optional)..."
            rows={2}
            showFormatting={true}
          />
          <p className="text-xs text-muted-foreground mt-2">
            This explanation will be shown to students when reviewing their
            results.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
