"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";
import { ExamFormData } from "../ExamBuilderWizard";
import {
  Upload,
  Clock,
  Shield,
  Eye,
  Brain,
  AlertTriangle,
  Trophy,
  BarChart3,
} from "lucide-react";

interface ExamAdvancedSettingsStepProps {
  formData: ExamFormData;
  updateFormData: (updates: Partial<ExamFormData>) => void;
}

export default function ExamAdvancedSettingsStep({
  formData,
  updateFormData,
}: ExamAdvancedSettingsStepProps) {
  const handleFileTypesChange = (type: string, checked: boolean) => {
    const current = formData.allowedFileTypes || [];
    const updated = checked
      ? [...current, type]
      : current.filter((t) => t !== type);
    updateFormData({ allowedFileTypes: updated });
  };

  const handleRankingLevelChange = (level: string, checked: boolean) => {
    const current = formData.rankingLevels || [];
    const updated = checked
      ? [...current, level]
      : current.filter((l) => l !== level);
    updateFormData({ rankingLevels: updated });
  };

  return (
    <div className="space-y-6">
      {/* File Upload Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Upload Settings
          </CardTitle>
          <CardDescription>
            Allow students to upload answer files (for essay/practical exams)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowFileUpload"
              checked={formData.allowFileUpload}
              onCheckedChange={(checked) =>
                updateFormData({ allowFileUpload: checked as boolean })
              }
            />
            <Label htmlFor="allowFileUpload" className="cursor-pointer">
              Enable file upload for answers
            </Label>
          </div>

          {formData.allowFileUpload && (
            <div className="ml-6 space-y-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxFileSize || 10}
                  onChange={(e) =>
                    updateFormData({
                      maxFileSize: parseInt(e.target.value) || 10,
                    })
                  }
                  className="w-32"
                />
              </div>

              <div className="space-y-2">
                <Label>Allowed File Types</Label>
                <div className="flex flex-wrap gap-3">
                  {["pdf", "docx", "doc", "jpg", "png", "jpeg", "txt"].map(
                    (type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`file-${type}`}
                          checked={(formData.allowedFileTypes || []).includes(
                            type
                          )}
                          onCheckedChange={(checked) =>
                            handleFileTypesChange(type, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`file-${type}`}
                          className="cursor-pointer uppercase text-xs font-mono"
                        >
                          .{type}
                        </Label>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="uploadInstructions">Upload Instructions</Label>
                <Textarea
                  id="uploadInstructions"
                  placeholder="e.g., Upload your answer sheet as a single PDF file. Make sure all pages are clearly visible."
                  value={formData.uploadInstructions || ""}
                  onChange={(e) =>
                    updateFormData({ uploadInstructions: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Monitoring Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Monitoring & Security
          </CardTitle>
          <CardDescription>
            Advanced monitoring and security features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="aiMonitoringEnabled"
              checked={formData.aiMonitoringEnabled || false}
              onCheckedChange={(checked) =>
                updateFormData({ aiMonitoringEnabled: checked as boolean })
              }
            />
            <Label htmlFor="aiMonitoringEnabled" className="cursor-pointer">
              Enable AI Monitoring
            </Label>
            <Badge variant="outline" className="ml-auto">
              Advanced
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            Use AI to detect suspicious behavior during the exam
          </p>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="browseLockEnabled"
              checked={formData.browseLockEnabled || false}
              onCheckedChange={(checked) =>
                updateFormData({ browseLockEnabled: checked as boolean })
              }
            />
            <Label htmlFor="browseLockEnabled" className="cursor-pointer">
              Enable Browser Lock
            </Label>
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            Prevent students from switching tabs or applications during exam
          </p>
        </CardContent>
      </Card>

      {/* Ranking & Results Settings */}
      {/* <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Ranking & Results
          </CardTitle>
          <CardDescription>
            Configure ranking and result display settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableRanking"
              checked={formData.enableRanking || false}
              onCheckedChange={(checked) =>
                updateFormData({ enableRanking: checked as boolean })
              }
            />
            <Label htmlFor="enableRanking" className="cursor-pointer">
              Enable Ranking
            </Label>
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            Calculate and display student rankings at different levels
          </p>

          {formData.enableRanking && (
            <div className="ml-6 space-y-3 p-3 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Ranking Levels</Label>
              <div className="space-y-2">
                {[
                  { value: "NATIONAL", label: "National" },
                  { value: "PROVINCIAL", label: "Provincial" },
                  { value: "DISTRICT", label: "District" },
                  { value: "ZONAL", label: "Zonal" },
                  { value: "SCHOOL", label: "School" },
                ].map((level) => (
                  <div
                    key={level.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`ranking-${level.value}`}
                      checked={(formData.rankingLevels || []).includes(
                        level.value
                      )}
                      onCheckedChange={(checked) =>
                        handleRankingLevelChange(
                          level.value,
                          checked as boolean
                        )
                      }
                    />
                    <Label
                      htmlFor={`ranking-${level.value}`}
                      className="cursor-pointer text-sm"
                    >
                      {level.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card> */}
    </div>
  );
}
