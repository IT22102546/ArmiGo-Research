"use client";

import React, { useState } from "react";
import { asApiError } from "@/lib/error-handling";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ApiClient } from "@/lib/api/api-client";
import { CheckCircle, AlertCircle, Loader2, MapPin } from "lucide-react";
import { getDisplayName } from "@/lib/utils/display";

interface AdminTransferVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  request: {
    id: string;
    uniqueId: string; // TR-YYYY-#####
    requester: {
      firstName: string;
      lastName: string;
    };
    fromZone: string;
    toZones: string[];
    subject: string;
    medium: string;
    level: string;
  };
  onSuccess?: () => void;
}

export default function AdminTransferVerification({
  isOpen,
  onClose,
  request,
  onSuccess,
}: AdminTransferVerificationProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!notes.trim()) {
      setError("Verification notes are required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await ApiClient.post(`/transfer/${request.id}/verify`, {
        verified: true,
        verificationNotes: notes,
      });

      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      setError(
        asApiError(err).response?.data?.message ||
          "Failed to verify transfer request"
      );
      console.error("Error verifying request:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNotes("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Verify Mutual Transfer Request</DialogTitle>
          <DialogDescription>
            Review and verify mutual transfer request {request.uniqueId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Request Summary */}
          <div className="bg-muted p-4 rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Request ID:</span>
              <Badge variant="outline">{request.uniqueId}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Requester:</span>
              <span className="text-sm">
                {request.requester.firstName} {request.requester.lastName}
              </span>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Transfer Details:</span>
              <div className="flex items-start gap-2 bg-card p-2 rounded border border-border">
                <MapPin className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="text-sm font-medium">{request.fromZone}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-card p-2 rounded border border-border">
                <MapPin className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    To (Preferred)
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {request.toZones.map((zone, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {zone}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Subject</p>
                <p className="text-sm font-medium">
                  {getDisplayName(request.subject)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Medium</p>
                <p className="text-sm font-medium">
                  {getDisplayName(request.medium)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Level</p>
                <p className="text-sm font-medium">{request.level}</p>
              </div>
            </div>
          </div>

          {/* Verification Form */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-700 bg-blue-50 p-3 rounded-md">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                Verify Mutual Transfer Request
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verification-notes">
                Verification Notes <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="verification-notes"
                placeholder="Enter verification notes, any conditions, or observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className={error && !notes.trim() ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                These notes will be visible to the requester and other
                administrators. Verifying this request enables it to be matched
                with compatible requests.
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Verify Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
