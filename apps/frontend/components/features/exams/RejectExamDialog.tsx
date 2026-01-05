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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { XCircle, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
const logger = createLogger("RejectExamDialog");
import { ApiClient } from "@/lib/api/api-client";

interface RejectExamDialogProps {
  examId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RejectExamDialog({
  examId,
  open,
  onClose,
  onSuccess,
}: RejectExamDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [changeRequests, setChangeRequests] = useState<string[]>([]);
  const [newChange, setNewChange] = useState("");
  const [errors, setErrors] = useState<{ reason?: string; feedback?: string }>(
    {}
  );

  const addChangeRequest = () => {
    if (newChange.trim()) {
      setChangeRequests([...changeRequests, newChange.trim()]);
      setNewChange("");
    }
  };

  const removeChangeRequest = (index: number) => {
    setChangeRequests(changeRequests.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: { reason?: string; feedback?: string } = {};

    if (!reason.trim() || reason.trim().length < 10) {
      newErrors.reason = "Reason must be at least 10 characters";
    }

    if (!feedback.trim() || feedback.trim().length < 20) {
      newErrors.feedback = "Detailed feedback must be at least 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        reason: reason.trim(),
        feedback: feedback.trim(),
        requestChanges: changeRequests.length > 0 ? changeRequests : undefined,
      };

      await ApiClient.patch(`/api/v1/exams/${examId}/reject`, payload);

      handleApiSuccess("Exam rejected");
      resetForm();
      onSuccess();
    } catch (error) {
      logger.error("Error rejecting exam:", error);
      handleApiError(
        error,
        "RejectExamDialog.handleSubmit",
        "Failed to reject exam"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setReason("");
    setFeedback("");
    setChangeRequests([]);
    setNewChange("");
    setErrors({});
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Reject Exam
          </DialogTitle>
          <DialogDescription>
            Provide detailed feedback to help the exam creator understand what
            needs to be improved.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Brief reason for rejection (e.g., Questions not aligned with curriculum)"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors({ ...errors, reason: undefined });
              }}
              rows={2}
              disabled={submitting}
              className={errors.reason ? "border-red-500" : ""}
            />
            {errors.reason && (
              <p className="text-sm text-red-600">{errors.reason}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Provide a concise reason for rejection (minimum 10 characters)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Detailed Feedback *</Label>
            <Textarea
              id="feedback"
              placeholder="Provide comprehensive feedback on what needs improvement..."
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                if (errors.feedback)
                  setErrors({ ...errors, feedback: undefined });
              }}
              rows={4}
              disabled={submitting}
              className={errors.feedback ? "border-red-500" : ""}
            />
            {errors.feedback && (
              <p className="text-sm text-red-600">{errors.feedback}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Give detailed feedback to help improve the exam (minimum 20
              characters)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Requested Changes (Optional)</Label>
            <p className="text-sm text-muted-foreground">
              Add specific changes you want the creator to make
            </p>

            <div className="flex gap-2">
              <Input
                placeholder="e.g., Add more questions for Topic X"
                value={newChange}
                onChange={(e) => setNewChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChangeRequest();
                  }
                }}
                disabled={submitting}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addChangeRequest}
                disabled={!newChange.trim() || submitting}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {changeRequests.length > 0 && (
              <div className="space-y-2 mt-3">
                {changeRequests.map((change, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md"
                  >
                    <Badge variant="outline" className="mt-0.5">
                      {index + 1}
                    </Badge>
                    <span className="flex-1 text-sm">{change}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChangeRequest(index)}
                      disabled={submitting}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Exam
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
