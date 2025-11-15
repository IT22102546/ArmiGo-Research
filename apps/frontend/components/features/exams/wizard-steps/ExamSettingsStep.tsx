"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExamFormData } from "../ExamBuilderWizard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Shuffle,
  ClipboardList,
  BarChart3,
  Globe,
  Shield,
  Camera,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  RotateCcw,
  Layers,
  BookMarked,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamSettingsStepProps {
  formData: ExamFormData;
  updateFormData: (updates: Partial<ExamFormData>) => void;
}

const TIMEZONES = [
  { value: "Asia/Colombo", label: "Sri Lanka (GMT+5:30)" },
  { value: "Asia/Kolkata", label: "India (GMT+5:30)" },
  { value: "UTC", label: "UTC (GMT+0)" },
  { value: "America/New_York", label: "New York (EST)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Asia/Dubai", label: "Dubai (GMT+4)" },
  { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
  { value: "Australia/Sydney", label: "Sydney (GMT+11)" },
];

// Setting toggle component for consistent UI
function SettingToggle({
  id,
  label,
  description,
  checked,
  onChange,
  icon: Icon,
  variant = "default",
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ElementType;
  variant?: "default" | "warning" | "security";
}) {
  return (
    <div
      className={cn(
        "flex items-start space-x-4 p-3 rounded-lg border transition-colors",
        checked &&
          variant === "security" &&
          "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
        checked &&
          variant === "warning" &&
          "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
        checked &&
          variant === "default" &&
          "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
        !checked && "bg-card border-border"
      )}
    >
      {Icon && (
        <div
          className={cn(
            "p-2 rounded-full",
            checked &&
              variant === "security" &&
              "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
            checked &&
              variant === "warning" &&
              "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400",
            checked &&
              variant === "default" &&
              "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
            !checked && "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="font-medium cursor-pointer">
            {label}
          </Label>
          <Switch id={id} checked={checked} onCheckedChange={onChange} />
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

export default function ExamSettingsStep({
  formData,
  updateFormData,
}: ExamSettingsStepProps) {
  return (
    <div className="space-y-6">
      {/* Exam Format & Access Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookMarked className="h-5 w-5" />
            Exam Format & Access
          </CardTitle>
          <CardDescription>
            Configure exam format, visibility, and question source
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">Exam Format</Label>
              <Select
                value={formData.format || "FULL_ONLINE"}
                onValueChange={(value) =>
                  updateFormData({ format: value as any })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_ONLINE">Full Online</SelectItem>
                  <SelectItem value="HALF_ONLINE_HALF_UPLOAD">
                    Half Online + Upload
                  </SelectItem>
                  <SelectItem value="FULL_UPLOAD">Full Upload</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose how the exam will be conducted
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                value={formData.visibility || "BOTH"}
                onValueChange={(value) =>
                  updateFormData({ visibility: value as any })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL_ONLY">Internal Only</SelectItem>
                  <SelectItem value="EXTERNAL_ONLY">External Only</SelectItem>
                  <SelectItem value="BOTH">Both Internal & External</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Who can access this exam
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchical Structure Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Question Organization
          </CardTitle>
          <CardDescription>
            Organize questions into sections and groups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingToggle
            id="useHierarchicalStructure"
            label="Use Hierarchical Structure"
            description="Organize questions into sections and groups for better organization and display"
            checked={formData.useHierarchicalStructure !== false}
            onChange={(checked) =>
              updateFormData({ useHierarchicalStructure: checked })
            }
            icon={Layers}
            variant="default"
          />
        </CardContent>
      </Card>

      {/* Security & Proctoring Settings */}
      <Card className="border-2 border-green-200">
        <CardHeader className="pb-3 bg-green-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2 text-green-800">
            <Shield className="h-5 w-5" />
            Security & Proctoring
            {(formData.faceVerificationRequired ||
              formData.randomizeQuestions ||
              formData.randomizeOptions) && (
              <Badge
                variant="outline"
                className="ml-auto bg-green-100 text-green-700"
              >
                {
                  [
                    formData.faceVerificationRequired,
                    formData.randomizeQuestions,
                    formData.randomizeOptions,
                  ].filter(Boolean).length
                }{" "}
                active
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Enable proctoring features to maintain exam integrity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <SettingToggle
            id="faceVerification"
            label="Face Verification Required"
            description="Students must verify their identity via webcam before starting the exam"
            checked={formData.faceVerificationRequired || false}
            onChange={(checked) =>
              updateFormData({ faceVerificationRequired: checked })
            }
            icon={Camera}
            variant="security"
          />

          <SettingToggle
            id="randomizeQuestions"
            label="Randomize Question Order"
            description="Questions will appear in different order for each student"
            checked={formData.randomizeQuestions}
            onChange={(checked) =>
              updateFormData({ randomizeQuestions: checked })
            }
            icon={Shuffle}
            variant="security"
          />

          <SettingToggle
            id="randomizeOptions"
            label="Randomize Answer Options"
            description="Multiple choice options will be shuffled for each student"
            checked={formData.randomizeOptions}
            onChange={(checked) =>
              updateFormData({ randomizeOptions: checked })
            }
            icon={Shuffle}
            variant="security"
          />
        </CardContent>
      </Card>

      {/* Results & Feedback Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Results & Feedback
          </CardTitle>
          <CardDescription>
            Configure how and when students see their results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingToggle
            id="showResults"
            label="Show Results Immediately"
            description="Students can see their score right after submission (auto-graded questions only)"
            checked={formData.showResults}
            onChange={(checked) => updateFormData({ showResults: checked })}
            icon={formData.showResults ? Eye : EyeOff}
          />

          <div className="p-3 rounded-lg border bg-card">
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-muted text-muted-foreground">
                <RotateCcw className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="attemptsAllowed" className="font-medium">
                  Retake Attempts
                </Label>
                <p className="text-xs text-muted-foreground">
                  How many times students can attempt this exam
                </p>
                <Select
                  value={String(formData.attemptsAllowed)}
                  onValueChange={(value) =>
                    updateFormData({ attemptsAllowed: parseInt(value) })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 attempt (no retakes)</SelectItem>
                    <SelectItem value="2">2 attempts</SelectItem>
                    <SelectItem value="3">3 attempts</SelectItem>
                    <SelectItem value="5">5 attempts</SelectItem>
                    <SelectItem value="10">Unlimited (10 max)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Late Submission Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Late Submission Policy
            <Badge variant="outline" className="ml-auto">
              Optional
            </Badge>
          </CardTitle>
          <CardDescription>
            Configure whether late submissions are allowed after the exam end
            time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle
            id="lateSubmission"
            label="Allow Late Submissions"
            description="Students can submit after the exam end time with a penalty"
            checked={formData.lateSubmissionAllowed}
            onChange={(checked) =>
              updateFormData({ lateSubmissionAllowed: checked })
            }
            icon={AlertTriangle}
            variant="warning"
          />

          {formData.lateSubmissionAllowed && (
            <div className="pl-12 space-y-3 animate-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label htmlFor="latePenalty">Late Penalty (%)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    id="latePenalty"
                    min={0}
                    max={100}
                    value={formData.latePenaltyPercent || 10}
                    onChange={(e) =>
                      updateFormData({
                        latePenaltyPercent: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-24"
                  />
                  <p className="text-sm text-muted-foreground">
                    Points will be deducted from late submissions
                  </p>
                </div>
              </div>
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Example: A student scoring 80/100 with{" "}
                {formData.latePenaltyPercent || 10}% penalty gets{" "}
                {Math.round(
                  80 * (1 - (formData.latePenaltyPercent || 10) / 100)
                )}{" "}
                marks
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timezone Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Timezone
          </CardTitle>
          <CardDescription>
            Set the timezone for exam scheduling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timeZone">Exam Timezone</Label>
            <Select
              value={formData.timeZone || "Asia/Colombo"}
              onValueChange={(value) => updateFormData({ timeZone: value })}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              All exam times will be displayed in this timezone
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Exam Instructions
          </CardTitle>
          <CardDescription>
            Provide clear instructions for students taking this exam
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              placeholder={`Enter instructions for students taking this exam...

Example:
1. Read all questions carefully before answering.
2. You have ${formData.duration} minutes to complete this exam.
3. Once you start, you cannot pause the exam.
4. Make sure to save your answers before submitting.
5. Any form of cheating will result in disqualification.`}
              value={formData.instructions || ""}
              onChange={(e) => updateFormData({ instructions: e.target.value })}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              These instructions will be shown to students before they start the
              exam
            </p>
          </div>

          {/* Quick instruction templates */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Quick Templates
            </Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded"
                onClick={() => {
                  const template = `EXAM INSTRUCTIONS

1. Read all questions carefully before answering.
2. You have ${formData.duration} minutes to complete this exam.
3. Total marks: ${formData.totalMarks}. Passing marks: ${formData.passingMarks}.
4. Once started, the timer cannot be paused.
5. Submit your answers before the time expires.
6. Review your answers before final submission.

Good luck!`;
                  updateFormData({ instructions: template });
                }}
              >
                Standard Template
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded"
                onClick={() => {
                  const template = `IMPORTANT RULES

• This is a timed exam. The timer starts as soon as you begin.
• Each question must be answered in sequence.
• You may not go back to previous questions.
• Tab switching or browser changes may be monitored.
• Use of external resources is prohibited unless specified.
• Submit only your own work.

Violations may result in automatic disqualification.`;
                  updateFormData({ instructions: template });
                }}
              >
                Strict Mode Template
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded"
                onClick={() => {
                  const template = `PRACTICE EXAM

This is a practice exam to help you prepare.
• Take your time to understand each question.
• You can retake this exam multiple times.
• Your results will help identify areas for improvement.
• Feel free to use reference materials while practicing.

Happy learning!`;
                  updateFormData({ instructions: template });
                }}
              >
                Practice Exam Template
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
