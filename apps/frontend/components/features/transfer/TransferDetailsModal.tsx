"use client";

import React, { useState, useEffect } from "react";
import { asApiError } from "@/lib/error-handling";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiClient } from "@/lib/api/api-client";
import {
  MapPin,
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  User,
  Mail,
  Phone,
  Hash,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { getDisplayName } from "@/lib/utils/display";
import TransferChat from "./TransferChat";

interface TransferDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
}

interface TransferRequestFull {
  id: string;
  uniqueId: string; // TR-YYYY-#####
  status: string;
  fromZone: string;
  toZones: string[];
  subject: string;
  medium: string;
  level: string;
  notes?: string;
  attachments?: string[];
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: {
    firstName: string;
    lastName: string;
  };
  verificationNotes?: string;
  acceptanceNotes?: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    subject: string;
    medium: string;
    level: string;
  };
  receiver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    subject: string;
    medium: string;
    level: string;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export default function TransferDetailsModal({
  isOpen,
  onClose,
  requestId,
}: TransferDetailsModalProps) {
  const [request, setRequest] = useState<TransferRequestFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (isOpen && requestId) {
      fetchRequestDetails();
    }
  }, [isOpen, requestId]);

  const fetchRequestDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiClient.get(`/transfer/${requestId}`);
      setRequest(response as TransferRequestFull);
    } catch (err) {
      setError(
        asApiError(err).response?.data?.message ||
          "Failed to fetch request details"
      );
      console.error("Error fetching transfer request:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "VERIFIED":
        return "bg-blue-100 text-blue-800";
      case "MATCHED":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      case "CANCELLED":
        return "bg-muted text-foreground";
      default:
        return "bg-muted text-foreground";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transfer Request Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this transfer request
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="py-8 text-center text-muted-foreground">
            Loading request details...
          </div>
        )}

        {error && (
          <div className="py-4 px-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {request && !loading && (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm font-semibold">
                      {request.uniqueId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {request.verified && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Transfer Route - Zone-based */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-foreground">
                    Mutual Transfer Details
                  </h3>

                  {/* From Zone */}
                  <div className="bg-red-50 p-4 rounded-md">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground mb-1">
                          Current Zone
                        </p>
                        <p className="text-base font-semibold">
                          {request.fromZone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="text-2xl text-muted-foreground">⇄</div>
                  </div>

                  {/* To Zones */}
                  <div className="bg-green-50 p-4 rounded-md">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground mb-1">
                          Preferred Zones for Exchange
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {request.toZones.map((zone, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-sm"
                            >
                              {zone}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Teaching Details */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-foreground">
                    Teaching Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Subject</p>
                        <p className="text-sm font-medium">
                          {getDisplayName(request.subject)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">🗣️</span>
                      <div>
                        <p className="text-xs text-muted-foreground">Medium</p>
                        <p className="text-sm font-medium">
                          {getDisplayName(request.medium)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Level</p>
                        <p className="text-sm font-medium">{request.level}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Notes */}
                {request.notes && (
                  <>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-muted-foreground">
                        Transfer Notes
                      </h3>
                      <div className="bg-muted p-4 rounded-md">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {request.notes}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Attachments */}
                {request.attachments && request.attachments.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-muted-foreground">
                        Attachments
                      </h3>
                      <div className="space-y-2">
                        {request.attachments.map((attachment, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 bg-muted rounded-md"
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {attachment}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Requester Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Requester Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="text-sm font-medium">
                          {request.requester.firstName}{" "}
                          {request.requester.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">
                          {request.requester.email}
                        </p>
                      </div>
                    </div>
                    {request.requester.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium text-muted-foreground">
                            {request.requester.phoneNumber}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Teaching
                        </p>
                        <p className="text-sm font-medium">
                          {getDisplayName(request.requester.subject)} (
                          {getDisplayName(request.requester.medium)})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Receiver Info (if matched) */}
                {request.receiver && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm text-muted-foreground">
                        Matched With
                      </h3>
                      <div className="grid grid-cols-2 gap-4 bg-green-50 p-4 rounded-md">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Name
                            </p>
                            <p className="text-sm font-medium">
                              {request.receiver.firstName}{" "}
                              {request.receiver.lastName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Email
                            </p>
                            <p className="text-sm font-medium">
                              {request.receiver.email}
                            </p>
                          </div>
                        </div>
                        {request.receiver.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Phone
                              </p>
                              <p className="text-sm font-medium">
                                {request.receiver.phoneNumber}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Teaching
                            </p>
                            <p className="text-sm font-medium">
                              {getDisplayName(request.receiver.subject)} (
                              {getDisplayName(request.receiver.medium)})
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Timeline */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Timeline
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">
                        {format(new Date(request.createdAt), "PPP")} (
                        {formatDistanceToNow(new Date(request.createdAt), {
                          addSuffix: true,
                        })}
                        )
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Updated:</span>
                      <span className="font-medium">
                        {format(new Date(request.updatedAt), "PPP")} (
                        {formatDistanceToNow(new Date(request.updatedAt), {
                          addSuffix: true,
                        })}
                        )
                      </span>
                    </div>
                    {request.verifiedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">Verified:</span>
                        <span className="font-medium">
                          {format(new Date(request.verifiedAt), "PPP")}
                          {request.verifiedBy &&
                            ` by ${request.verifiedBy.firstName} ${request.verifiedBy.lastName}`}
                        </span>
                      </div>
                    )}
                    {request.completedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                        <span className="text-muted-foreground">
                          Completed:
                        </span>
                        <span className="font-medium">
                          {format(new Date(request.completedAt), "PPP")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Notes */}
                {request.verificationNotes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Verification Notes
                      </h3>
                      <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {request.verificationNotes}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Acceptance Notes */}
                {request.acceptanceNotes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Acceptance Notes
                      </h3>
                      <div className="bg-green-50 p-4 rounded-md border border-green-200">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {request.acceptanceNotes}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Footer Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="messages" className="mt-4">
              <TransferChat
                transferRequestId={requestId}
                transferUniqueId={request.uniqueId}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
