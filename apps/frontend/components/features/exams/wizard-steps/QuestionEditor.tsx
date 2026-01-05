"use client";

import React, { useState, useRef } from "react";
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
import RichTextEditor from "@/components/shared/RichTextEditor";
import { LanguageInput } from "@/components/shared/LanguageInput";

interface QuestionEditorProps {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
  mediumName?: string;
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
  mediumName,
}: QuestionEditorProps) {
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const optionImageRefs = useRef<{ [key: number]: HTMLInputElement | null }>(
    {}
  );

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
  };

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

  const handleImageUploadClick = () => {
    imageUploadRef.current?.click();
  };

  /**
   * Handle image file selection
   * IMPORTANT: Store File object directly, NOT base64
   * This avoids the 413 Payload Too Large error.
   * File will be uploaded separately after question creation.
   */
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store File object for later upload, NOT base64
    onUpdate({ imageFile: file, imageUrl: undefined });
  };

  const handleOptionImageUploadClick = (index: number) => {
    optionImageRefs.current[index]?.click();
  };

  const handleOptionImageFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For option images, still store as File objects
    // TODO: Implement option image upload separately if needed
    this.logger?.warn("Option image uploads not yet implemented");
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input for image upload */}
      <input
        ref={imageUploadRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* Hidden file inputs for option images */}
      {(question.options || []).map((_, index) => (
        <input
          key={`option-image-${index}`}
          ref={(el) => {
            if (el) optionImageRefs.current[index] = el;
          }}
          type="file"
          accept="image/*"
          onChange={(e) => handleOptionImageFileChange(e, index)}
          className="hidden"
        />
      ))}

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
            mediumName={mediumName}
            showVirtualKeyboard={true}
            onImageUploadClick={handleImageUploadClick}
          />

          {/* Question Image Upload - Compact inline */}
          {question.imageFile && (
            <div className="relative w-full max-w-xs">
              <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden">
                <img
                  src={URL.createObjectURL(question.imageFile)}
                  alt="Question"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onUpdate({ imageFile: undefined })}
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  title="Remove image"
                >
                  ×
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {question.imageFile.name} (
                {(question.imageFile.size / 1024).toFixed(1)} KB)
              </p>
            </div>
          )}
          {question.imageUrl && !question.imageFile && (
            <div className="relative w-full max-w-xs">
              <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden">
                <img
                  src={question.imageUrl}
                  alt="Question"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onUpdate({ imageUrl: undefined })}
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  title="Remove image"
                >
                  ×
                </Button>
              </div>
              <p className="text-xs text-green-600 mt-1">✓ Uploaded</p>
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
                step="0.01"
                value={question.points ?? 1}
                onChange={(e) =>
                  onUpdate({
                    points: Math.max(1, parseFloat(e.target.value) || 1),
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
                      <LanguageInput
                        mediumName={mediumName}
                        showVirtualKeyboard={true}
                        onImageUploadClick={() =>
                          handleOptionImageUploadClick(index)
                        }
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        className="h-9"
                      />

                      {/* Option Image Preview */}
                      {question.optionImages?.[index] && (
                        <div className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-300">
                          <img
                            src={question.optionImages[index]}
                            alt={`Option ${String.fromCharCode(65 + index)}`}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newOptionImages = [
                                ...(question.optionImages || []),
                              ];
                              newOptionImages[index] = "";
                              onUpdate({ optionImages: newOptionImages });
                            }}
                            className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
                            title="Remove image"
                          >
                            ×
                          </Button>
                        </div>
                      )}
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
                mediumName={mediumName}
                showVirtualKeyboard={true}
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
                mediumName={mediumName}
                showVirtualKeyboard={true}
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
                <LanguageInput
                  mediumName={mediumName}
                  showVirtualKeyboard={true}
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
                    <LanguageInput
                      mediumName={mediumName}
                      showVirtualKeyboard={true}
                      value={pair.left}
                      onChange={(e) =>
                        updatePair(index, "left", e.target.value)
                      }
                      placeholder={`Left item ${index + 1}`}
                      className="flex-1"
                    />
                    <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                    <LanguageInput
                      mediumName={mediumName}
                      showVirtualKeyboard={true}
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
            mediumName={mediumName}
            showVirtualKeyboard={true}
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
