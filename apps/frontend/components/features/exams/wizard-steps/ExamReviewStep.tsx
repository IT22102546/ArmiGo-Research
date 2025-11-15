"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ExamFormData } from "../ExamBuilderWizard";
import { prepareRichText } from "@/lib/utils";
import {
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Clock,
  Calendar,
  FileQuestion,
  Settings,
  Shield,
  Upload,
  Trophy,
  Timer,
} from "lucide-react";

interface ExamReviewStepProps {
  formData: ExamFormData;
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_FALSE: "True/False",
  SHORT_ANSWER: "Short Answer",
  ESSAY: "Essay",
  FILL_BLANK: "Fill in the Blank",
  MATCHING: "Matching",
};

const EXAM_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple Choice Only",
  ESSAY: "Essay Only",
  MIXED: "Mixed Format",
  PRACTICAL: "Practical",
};

export default function ExamReviewStep({ formData }: ExamReviewStepProps) {
  const part1Questions = formData.questions.filter((q) => q.examPart === 1);
  const part2Questions = formData.questions.filter((q) => q.examPart === 2);
  const totalQuestionMarks = formData.questions.reduce(
    (sum, q) => sum + q.points,
    0
  );

  const validationIssues: string[] = [];
  const warnings: string[] = [];

  // Required field validations
  if (!formData.title?.trim()) validationIssues.push("Exam title is required");
  if (!formData.gradeId) validationIssues.push("Grade is required");
  if (!formData.subjectId) validationIssues.push("Subject is required");
  if (!formData.duration || formData.duration <= 0)
    validationIssues.push("Duration is required");
  if (!formData.totalMarks || formData.totalMarks <= 0)
    validationIssues.push("Total marks is required");
  if (!formData.passingMarks || formData.passingMarks <= 0)
    validationIssues.push("Passing marks is required");
  if (formData.questions.length === 0)
    validationIssues.push("At least one question is required");

  // Logical validations
  if (formData.passingMarks > formData.totalMarks) {
    validationIssues.push("Passing marks cannot exceed total marks");
  }
  if (
    formData.startTime &&
    formData.endTime &&
    new Date(formData.startTime) >= new Date(formData.endTime)
  ) {
    validationIssues.push("End time must be after start time");
  }
  if (
    formData.windowStart &&
    formData.windowEnd &&
    new Date(formData.windowStart) >= new Date(formData.windowEnd)
  ) {
    validationIssues.push("Window end time must be after window start time");
  }

  // Warnings (non-blocking)
  if (totalQuestionMarks !== formData.totalMarks) {
    warnings.push(
      `Question marks (${totalQuestionMarks}) don't match total marks (${formData.totalMarks})`
    );
  }
  if (!formData.startTime) {
    warnings.push(
      "No start time set - exam will need to be manually activated"
    );
  }
  if (!formData.instructions?.trim()) {
    warnings.push("No exam instructions provided");
  }
  if (
    formData.type === "MIXED" &&
    (part1Questions.length === 0 || part2Questions.length === 0)
  ) {
    warnings.push("Mixed exam type but only one part has questions");
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      {validationIssues.length > 0 ? (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800 mb-2">
                  Please fix these issues before creating the exam
                </h4>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                  {validationIssues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">✓ Exam is ready to be created</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">
                  Recommendations
                </h4>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Exam Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-3">
              <Label className="text-muted-foreground text-xs">Title</Label>
              <p className="font-medium text-lg">{formData.title || "-"}</p>
            </div>

            {formData.description && (
              <div className="col-span-2 md:col-span-3">
                <Label className="text-muted-foreground text-xs">
                  Description
                </Label>
                <p className="text-sm">{formData.description}</p>
              </div>
            )}

            <div>
              <Label className="text-muted-foreground text-xs">Exam Type</Label>
              <p className="font-medium">
                {EXAM_TYPE_LABELS[formData.type] || formData.type}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Duration</Label>
              <p className="font-medium">{formData.duration} minutes</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">
                Attempts Allowed
              </Label>
              <p className="font-medium">{formData.attemptsAllowed}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {formData.totalMarks}
              </p>
              <p className="text-xs text-muted-foreground">Total Marks</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {formData.passingMarks}
              </p>
              <p className="text-xs text-muted-foreground">Passing Marks</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(
                  (formData.passingMarks / formData.totalMarks) * 100
                )}
                %
              </p>
              <p className="text-xs text-muted-foreground">Pass Rate</p>
            </div>
          </div>

          {/* {(formData.part1Marks || formData.part2Marks) && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 border rounded-lg">
                <Label className="text-muted-foreground text-xs">
                  Part 1 Marks
                </Label>
                <p className="font-medium">{formData.part1Marks || 0}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <Label className="text-muted-foreground text-xs">
                  Part 2 Marks
                </Label>
                <p className="font-medium">{formData.part2Marks || 0}</p>
              </div>
            </div>
          )} */}
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">
                Start Time
              </Label>
              <p className="font-medium">
                {formatDateTime(formData.startTime)}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">End Time</Label>
              <p className="font-medium">{formatDateTime(formData.endTime)}</p>
            </div>
            {(formData.windowStart || formData.windowEnd) && (
              <>
                <div>
                  <Label className="text-muted-foreground text-xs">
                    Access Window Start
                  </Label>
                  <p className="font-medium">
                    {formatDateTime(formData.windowStart)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">
                    Access Window End
                  </Label>
                  <p className="font-medium">
                    {formatDateTime(formData.windowEnd)}
                  </p>
                </div>
              </>
            )}
          </div>
          {formData.lateSubmissionAllowed && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Late submission allowed with{" "}
                {formData.latePenaltyPercent || 0}% penalty
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            Questions ({formData.questions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {formData.questions.length}
              </p>
              <p className="text-xs text-muted-foreground">Total Questions</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {part1Questions.length}
              </p>
              <p className="text-xs text-muted-foreground">Part 1</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {part2Questions.length}
              </p>
              <p className="text-xs text-muted-foreground">Part 2</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">
              Question Types
            </Label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(QUESTION_TYPE_LABELS).map((type) => {
                const count = formData.questions.filter(
                  (q) => q.type === type
                ).length;
                if (count === 0) return null;
                return (
                  <Badge key={type} variant="outline">
                    {QUESTION_TYPE_LABELS[type]}: {count}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="p-3 border rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Question Marks</span>
              <span className="font-bold">{totalQuestionMarks}</span>
            </div>
            {totalQuestionMarks !== formData.totalMarks && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ Doesn't match declared total ({formData.totalMarks})
              </p>
            )}
          </div>

          {/* Question Preview */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Preview</Label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {formData.questions.slice(0, 5).map((q, idx) => (
                <div
                  key={q.id}
                  className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded"
                >
                  <Badge variant="secondary" className="text-xs">
                    {q.examPart === 2 ? "P2" : "P1"}
                  </Badge>
                  <span className="font-medium">Q{idx + 1}.</span>
                  <span
                    className="truncate flex-1 rich-text-content"
                    dangerouslySetInnerHTML={{
                      __html: prepareRichText(q.question),
                    }}
                  />
                  <Badge variant="outline" className="text-xs">
                    {q.points} pts
                  </Badge>
                </div>
              ))}
              {formData.questions.length > 5 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  ... and {formData.questions.length - 5} more questions
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Format & Access */}
          <div className="p-3 border rounded-lg space-y-2">
            <Label className="text-sm font-medium">Format & Access</Label>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>Format: {formData.format || "FULL_ONLINE"}</span>
              <span>Visibility: {formData.visibility || "BOTH"}</span>
              <span>
                Hierarchical: {formData.useHierarchicalStructure ? "Yes" : "No"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SettingItem
              enabled={formData.randomizeQuestions}
              label="Randomize Questions"
            />
            <SettingItem
              enabled={formData.randomizeOptions}
              label="Randomize Options"
            />
            <SettingItem
              enabled={formData.showResults}
              label="Show Results Immediately"
            />
            <SettingItem
              enabled={formData.enableRanking}
              label="Enable Ranking"
            />
          </div>

          {formData.enableRanking &&
            formData.rankingLevels &&
            formData.rankingLevels.length > 0 && (
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">
                  Ranking Levels: {formData.rankingLevels.join(", ")}
                </span>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      {(formData.allowFileUpload ||
        formData.aiMonitoringEnabled ||
        formData.faceVerificationRequired ||
        formData.browseLockEnabled) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Advanced
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            {formData.allowFileUpload && (
              <div className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="font-medium text-sm">
                    File Upload Enabled
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Max Size: {formData.maxFileSize || 5}MB</span>
                  <span>
                    Types: {formData.allowedFileTypes?.join(", ") || "All"}
                  </span>
                </div>
              </div>
            )}

            {/* Security Settings */}
            <div className="grid grid-cols-2 gap-3">
              <SettingItem
                enabled={formData.aiMonitoringEnabled}
                label="AI Monitoring"
                icon="🤖"
              />
              <SettingItem
                enabled={formData.faceVerificationRequired}
                label="Face Verification"
                icon="👤"
              />
              <SettingItem
                enabled={formData.browseLockEnabled}
                label="Browser Lock"
                icon="🔒"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions Preview */}
      {formData.instructions && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Instructions Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg max-h-40 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-sans">
                {formData.instructions}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SettingItem({
  enabled,
  label,
  icon,
}: {
  enabled?: boolean;
  label: string;
  icon?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon ? (
        <span className="text-sm">{icon}</span>
      ) : (
        <div
          className={`h-2 w-2 rounded-full ${enabled ? "bg-green-500" : "bg-gray-300"}`}
        />
      )}
      <span className={`text-sm ${enabled ? "" : "text-muted-foreground"}`}>
        {label}
      </span>
      {enabled && <CheckCircle2 className="h-3 w-3 text-green-500" />}
    </div>
  );
}
