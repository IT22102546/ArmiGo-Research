"use client";

import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GradeSelect, SubjectSelect, MediumSelect } from "@/components/shared";
import { ExamFormData, ExamType } from "../ExamBuilderWizard";
import {
  CalendarIcon,
  Clock,
  FileText,
  Target,
  Users,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ExamDetailsStepProps {
  formData: ExamFormData;
  updateFormData: (updates: Partial<ExamFormData>) => void;
}

interface ValidationError {
  field: string;
  message: string;
}

// Helper component for validation feedback
function ValidationMessage({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (error) {
    return (
      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
        <CheckCircle2 className="h-3 w-3" />
        {success}
      </p>
    );
  }
  return null;
}

export default function ExamDetailsStep({
  formData,
  updateFormData,
}: ExamDetailsStepProps) {
  // Compute validation errors
  const validationErrors = useMemo(() => {
    const errors: ValidationError[] = [];

    // Title validation
    if (!formData.title.trim()) {
      errors.push({ field: "title", message: "Exam title is required" });
    } else if (formData.title.length < 5) {
      errors.push({
        field: "title",
        message: "Title must be at least 5 characters",
      });
    }

    // Passing marks validation
    if (formData.passingMarks > formData.totalMarks) {
      errors.push({
        field: "passingMarks",
        message: `Passing marks (${formData.passingMarks}) cannot exceed total marks (${formData.totalMarks})`,
      });
    }

    // Part marks validation for MIXED type
    if (formData.type === "MIXED") {
      const part1 = formData.part1Marks || 0;
      const part2 = formData.part2Marks || 0;
      const sum = part1 + part2;
      if (sum !== formData.totalMarks && formData.totalMarks > 0) {
        errors.push({
          field: "partMarks",
          message: `Part 1 (${part1}) + Part 2 (${part2}) = ${sum} must equal Total Marks (${formData.totalMarks})`,
        });
      }
    }

    // Time validation
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);

      if (end <= start) {
        errors.push({
          field: "endTime",
          message: "End time must be after start time",
        });
      }

      // Duration fits validation
      if (formData.duration > 0) {
        const windowMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        if (formData.duration > windowMinutes) {
          errors.push({
            field: "duration",
            message: `Duration (${formData.duration} min) exceeds available time window (${Math.round(windowMinutes)} min)`,
          });
        }
      }

      // Future date validation
      const now = new Date();
      if (start <= now) {
        errors.push({
          field: "startTime",
          message: "Start time must be in the future",
        });
      }
    }

    return errors;
  }, [formData]);

  // Helper to get error for a field
  const getError = (field: string) => {
    return validationErrors.find((e) => e.field === field)?.message;
  };

  // Helper to check if field has error
  const hasError = (field: string) => {
    return validationErrors.some((e) => e.field === field);
  };

  // Calculate computed values
  const computedValues = useMemo(() => {
    const values: {
      passPercentage?: number;
      durationHours?: string;
      timeWindow?: string;
    } = {};

    if (formData.totalMarks > 0 && formData.passingMarks >= 0) {
      values.passPercentage = Math.round(
        (formData.passingMarks / formData.totalMarks) * 100
      );
    }

    if (formData.duration > 0) {
      const hours = Math.floor(formData.duration / 60);
      const mins = formData.duration % 60;
      values.durationHours =
        hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`;
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      const diffMs = end.getTime() - start.getTime();
      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        values.timeWindow = `${hours}h ${mins}m window`;
      }
    }

    return values;
  }, [formData]);

  // Get timezone for display
  const timezone = useMemo(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, []);

  return (
    <div className="space-y-6">
      {/* Basic Information Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Exam Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Grade 10 Mathematics - Term 1 Midterm"
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
              className={cn(
                "text-lg",
                hasError("title") && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            <ValidationMessage error={getError("title")} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide a brief description of the exam content and objectives..."
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Exam Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Exam Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                updateFormData({ type: value as ExamType })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select exam type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MULTIPLE_CHOICE">
                  <div className="flex flex-col">
                    <span>Multiple Choice Only</span>
                    <span className="text-xs text-muted-foreground">
                      Auto-graded MCQ questions
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="ESSAY">
                  <div className="flex flex-col">
                    <span>Essay/Subjective</span>
                    <span className="text-xs text-muted-foreground">
                      Requires manual grading
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="MIXED">
                  <div className="flex flex-col">
                    <span>Mixed (Part 1 + Part 2)</span>
                    <span className="text-xs text-muted-foreground">
                      Combines auto-graded and subjective
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Target Audience Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Target Audience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Grade */}
            <div className="space-y-2">
              <Label>
                Grade <span className="text-red-500">*</span>
              </Label>
              <GradeSelect
                value={formData.gradeId}
                onValueChange={(value) => updateFormData({ gradeId: value })}
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label>
                Subject <span className="text-red-500">*</span>
              </Label>
              <SubjectSelect
                value={formData.subjectId}
                onValueChange={(value) => updateFormData({ subjectId: value })}
              />
            </div>

            {/* Medium */}
            <div className="space-y-2">
              <Label>
                Medium <span className="text-red-500">*</span>
              </Label>
              <MediumSelect
                value={formData.mediumId}
                onValueChange={(value) => updateFormData({ mediumId: value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marks & Duration Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Marks & Duration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">
                Duration (minutes) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="480"
                placeholder="e.g., 60"
                value={formData.duration}
                onChange={(e) =>
                  updateFormData({ duration: parseInt(e.target.value) || 0 })
                }
                className={cn(
                  hasError("duration") &&
                    "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {computedValues.durationHours && !hasError("duration") && (
                <p className="text-xs text-muted-foreground">
                  = {computedValues.durationHours}
                </p>
              )}
              <ValidationMessage error={getError("duration")} />
            </div>

            {/* Total Marks */}
            <div className="space-y-2">
              <Label htmlFor="totalMarks">
                Total Marks <span className="text-red-500">*</span>
              </Label>
              <Input
                id="totalMarks"
                type="number"
                min="1"
                placeholder="e.g., 100"
                value={formData.totalMarks}
                onChange={(e) =>
                  updateFormData({ totalMarks: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            {/* Passing Marks */}
            <div className="space-y-2">
              <Label htmlFor="passingMarks">
                Passing Marks <span className="text-red-500">*</span>
              </Label>
              <Input
                id="passingMarks"
                type="number"
                min="0"
                max={formData.totalMarks}
                placeholder="e.g., 40"
                value={formData.passingMarks}
                onChange={(e) =>
                  updateFormData({
                    passingMarks: parseInt(e.target.value) || 0,
                  })
                }
                className={cn(
                  hasError("passingMarks") &&
                    "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {computedValues.passPercentage !== undefined &&
                !hasError("passingMarks") && (
                  <p className="text-xs text-green-600">
                    = {computedValues.passPercentage}% pass threshold
                  </p>
                )}
              <ValidationMessage error={getError("passingMarks")} />
            </div>

            {/* Attempts Allowed */}
            <div className="space-y-2">
              <Label htmlFor="attemptsAllowed">Attempts Allowed</Label>
              <Input
                id="attemptsAllowed"
                type="number"
                min="1"
                max="10"
                placeholder="e.g., 1"
                value={formData.attemptsAllowed}
                onChange={(e) =>
                  updateFormData({
                    attemptsAllowed: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>

          {/* Part Marks for Mixed Type */}
          {formData.type === "MIXED" && (
            <div
              className={cn(
                "grid grid-cols-2 gap-4 mt-4 p-4 rounded-lg",
                hasError("partMarks")
                  ? "bg-red-50 border border-red-200"
                  : "bg-blue-50"
              )}
            >
              <div className="space-y-2">
                <Label htmlFor="part1Marks">Part 1 Marks (Auto-graded)</Label>
                <Input
                  id="part1Marks"
                  type="number"
                  min="0"
                  placeholder="e.g., 60"
                  value={formData.part1Marks || ""}
                  onChange={(e) => {
                    const part1 = parseInt(e.target.value) || 0;
                    // Auto-calculate part2 if totalMarks is set
                    const updates: Partial<ExamFormData> = {
                      part1Marks: part1,
                    };
                    if (formData.totalMarks > 0) {
                      updates.part2Marks = Math.max(
                        0,
                        formData.totalMarks - part1
                      );
                    }
                    updateFormData(updates);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  MCQ, True/False, Fill in the blank
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="part2Marks">Part 2 Marks (Subjective)</Label>
                <Input
                  id="part2Marks"
                  type="number"
                  min="0"
                  placeholder="e.g., 40"
                  value={formData.part2Marks || ""}
                  onChange={(e) => {
                    const part2 = parseInt(e.target.value) || 0;
                    // Auto-calculate part1 if totalMarks is set
                    const updates: Partial<ExamFormData> = {
                      part2Marks: part2,
                    };
                    if (formData.totalMarks > 0) {
                      updates.part1Marks = Math.max(
                        0,
                        formData.totalMarks - part2
                      );
                    }
                    updateFormData(updates);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Essay, Short Answer (requires manual grading)
                </p>
              </div>
              {/* Part marks sum indicator */}
              <div className="col-span-2">
                {formData.totalMarks > 0 && (
                  <div
                    className={cn(
                      "text-sm p-2 rounded",
                      hasError("partMarks")
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    )}
                  >
                    Part 1 ({formData.part1Marks || 0}) + Part 2 (
                    {formData.part2Marks || 0}) ={" "}
                    {(formData.part1Marks || 0) + (formData.part2Marks || 0)} /{" "}
                    {formData.totalMarks} Total
                    {!hasError("partMarks") && (
                      <CheckCircle2 className="inline h-4 w-4 ml-2" />
                    )}
                  </div>
                )}
                <ValidationMessage error={getError("partMarks")} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Schedule
            <span className="text-xs font-normal text-muted-foreground ml-auto">
              Timezone: {timezone}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="startTime">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="startDate"
                  type="date"
                  value={
                    formData.startTime ? formData.startTime.split("T")[0] : ""
                  }
                  onChange={(e) => {
                    const time = formData.startTime?.split("T")[1] || "09:00";
                    updateFormData({ startTime: `${e.target.value}T${time}` });
                  }}
                  className={cn(
                    "flex-1",
                    hasError("startTime") && "border-red-500"
                  )}
                  min={new Date().toISOString().split("T")[0]}
                />
                <Input
                  id="startTimeInput"
                  type="time"
                  value={
                    formData.startTime
                      ? formData.startTime.split("T")[1]?.substring(0, 5)
                      : ""
                  }
                  onChange={(e) => {
                    const date =
                      formData.startTime?.split("T")[0] ||
                      new Date().toISOString().split("T")[0];
                    updateFormData({ startTime: `${date}T${e.target.value}` });
                  }}
                  className={cn(
                    "w-32",
                    hasError("startTime") && "border-red-500"
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                When the exam becomes available to students
              </p>
              <ValidationMessage error={getError("startTime")} />
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label htmlFor="endTime">
                End Time <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endTime ? formData.endTime.split("T")[0] : ""}
                  onChange={(e) => {
                    const time = formData.endTime?.split("T")[1] || "17:00";
                    updateFormData({ endTime: `${e.target.value}T${time}` });
                  }}
                  className={cn(
                    "flex-1",
                    hasError("endTime") && "border-red-500"
                  )}
                  min={formData.startTime?.split("T")[0]}
                />
                <Input
                  id="endTimeInput"
                  type="time"
                  value={
                    formData.endTime
                      ? formData.endTime.split("T")[1]?.substring(0, 5)
                      : ""
                  }
                  onChange={(e) => {
                    const date =
                      formData.endTime?.split("T")[0] ||
                      formData.startTime?.split("T")[0] ||
                      new Date().toISOString().split("T")[0];
                    updateFormData({ endTime: `${date}T${e.target.value}` });
                  }}
                  className={cn(
                    "w-32",
                    hasError("endTime") && "border-red-500"
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                When the exam closes for submissions
              </p>
              <ValidationMessage error={getError("endTime")} />
            </div>
          </div>

          {/* Time Window Summary */}
          {computedValues.timeWindow &&
            !hasError("endTime") &&
            !hasError("startTime") && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <Clock className="h-4 w-4" />
                    <span>Exam availability: {computedValues.timeWindow}</span>
                  </div>
                  {formData.duration > 0 && (
                    <span className="text-muted-foreground">
                      Students have {formData.duration} min once started
                    </span>
                  )}
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
