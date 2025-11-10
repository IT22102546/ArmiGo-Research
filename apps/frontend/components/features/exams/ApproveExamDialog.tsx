"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
const logger = createLogger("ApproveExamDialog");
import { ApiClient } from "@/lib/api/api-client";

interface ApproveExamDialogProps {
  examId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApproveExamDialog({
  examId,
  open,
  onClose,
  onSuccess,
}: ApproveExamDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [useScheduledPublish, setUseScheduledPublish] = useState(false);
  const [scheduledPublishAt, setScheduledPublishAt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const payload: any = {};

      if (notes.trim()) {
        payload.notes = notes.trim();
      }

      if (useScheduledPublish && scheduledPublishAt) {
        // Convert to ISO string
        const publishDate = new Date(scheduledPublishAt);
        payload.scheduledPublishAt = publishDate.toISOString();
      }

      await ApiClient.post(`/api/v1/exams/${examId}/approve`, payload);

      handleApiSuccess("Exam approved successfully");
      resetForm();
      onSuccess();
    } catch (error) {
      logger.error("Error approving exam:", error);
      handleApiError(
        error,
        "ApproveExamDialog.handleSubmit",
        "Failed to approve exam"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setNotes("");
    setUseScheduledPublish(false);
    setScheduledPublishAt("");
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Approve Exam
          </DialogTitle>
          <DialogDescription>
            Approve this exam to make it available for students. You can
            optionally add notes and schedule when it should be published.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Approval Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes or feedback for the exam creator..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={submitting}
            />
            <p className="text-sm text-muted-foreground">
              These notes will be visible to the exam creator
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="scheduled-publish"
              checked={useScheduledPublish}
              onCheckedChange={(checked) =>
                setUseScheduledPublish(checked as boolean)
              }
              disabled={submitting}
            />
            <Label htmlFor="scheduled-publish" className="text-sm font-medium">
              Schedule publish date
            </Label>
          </div>

          {useScheduledPublish && (
            <div className="space-y-2">
              <Label htmlFor="scheduledPublishAt">Publish Date & Time</Label>
              <Input
                id="scheduledPublishAt"
                type="datetime-local"
                value={scheduledPublishAt}
                onChange={(e) => setScheduledPublishAt(e.target.value)}
                disabled={submitting}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-sm text-muted-foreground">
                The exam will automatically be published at this date and time
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve Exam
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
