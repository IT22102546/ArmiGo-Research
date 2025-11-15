"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  FileEdit,
  Trash2,
  Clock,
  FileQuestion,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExamFormData } from "./ExamBuilderWizard";

// Draft storage key prefix - must match ExamBuilderWizard
const DRAFT_STORAGE_KEY = "exam_draft";

interface ExamDraft {
  formData: ExamFormData;
  currentStep: number;
  lastSaved: string;
  version: number;
}

interface StoredDraft {
  key: string;
  draft: ExamDraft;
}

export function ExamDraftsList({
  onContinueDraft,
  basePath = "/teacher/exams/create",
}: {
  onContinueDraft?: (draftKey: string) => void;
  basePath?: string;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<StoredDraft[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<StoredDraft | null>(null);

  // Load all drafts from localStorage
  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = () => {
    const loadedDrafts: StoredDraft[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(DRAFT_STORAGE_KEY)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const draft = JSON.parse(stored) as ExamDraft;
            loadedDrafts.push({ key, draft });
          }
        }
      }
      // Sort by last saved (newest first)
      loadedDrafts.sort(
        (a, b) =>
          new Date(b.draft.lastSaved).getTime() -
          new Date(a.draft.lastSaved).getTime()
      );
      setDrafts(loadedDrafts);
    } catch (error) {
      console.error("Failed to load drafts", error);
    }
  };

  const handleContinueDraft = (storedDraft: StoredDraft) => {
    if (onContinueDraft) {
      onContinueDraft(storedDraft.key);
    } else {
      // Navigate to exam creation page
      router.push(basePath);
    }
  };

  const handleDeleteDraft = (storedDraft: StoredDraft) => {
    setSelectedDraft(storedDraft);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDraft) {
      try {
        localStorage.removeItem(selectedDraft.key);
        setDrafts((prev) => prev.filter((d) => d.key !== selectedDraft.key));
        toast.success("Draft deleted");
      } catch (error) {
        toast.error("Failed to delete draft");
      }
    }
    setDeleteDialogOpen(false);
    setSelectedDraft(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getStepName = (step: number) => {
    const steps = ["Details", "Questions", "Settings", "Advanced", "Review"];
    return steps[step - 1] || "Unknown";
  };

  if (drafts.length === 0) {
    return null; // Don't show anything if no drafts
  }

  return (
    <>
      <Card className="border-dashed border-2 border-yellow-300 bg-yellow-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
            <FolderOpen className="h-5 w-5" />
            Saved Drafts ({drafts.length})
          </CardTitle>
          <CardDescription className="text-yellow-700">
            You have unsaved exam drafts. Continue where you left off.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {drafts.map((storedDraft) => (
              <div
                key={storedDraft.key}
                className="flex items-center justify-between p-3 bg-card rounded-lg border shadow-sm"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <FileEdit className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium truncate">
                      {storedDraft.draft.formData.title || "Untitled Exam"}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(storedDraft.draft.lastSaved)}
                      </span>
                      {storedDraft.draft.formData.questions.length > 0 && (
                        <span className="flex items-center gap-1">
                          <FileQuestion className="h-3 w-3" />
                          {storedDraft.draft.formData.questions.length}{" "}
                          questions
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        Step {storedDraft.draft.currentStep}:{" "}
                        {getStepName(storedDraft.draft.currentStep)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Button
                    size="sm"
                    onClick={() => handleContinueDraft(storedDraft)}
                  >
                    Continue
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDraft(storedDraft)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Delete Draft?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the draft "
              {selectedDraft?.draft.formData.title || "Untitled Exam"}". This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ExamDraftsList;
