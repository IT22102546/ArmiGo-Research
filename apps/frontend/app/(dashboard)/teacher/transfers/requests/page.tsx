"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { teacherTransferApi } from "@/lib/api/endpoints/teacher-transfers";
import type {
  TeacherTransferRequest,
  TransferRequestStatus,
} from "@/lib/api/endpoints/teacher-transfers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ArrowLeft,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Eye,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { handleApiError } from "@/lib/error-handling/api-error-handler";
import { toast } from "sonner";

export default function TransferRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewId = searchParams.get("view");

  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState<TeacherTransferRequest[]>(
    []
  );
  const [receivedRequests, setReceivedRequests] = useState<
    TeacherTransferRequest[]
  >([]);
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] =
    useState<TeacherTransferRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<
    "accept" | "decline" | "withdraw"
  >("accept");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (viewId && (sentRequests.length > 0 || receivedRequests.length > 0)) {
      const found =
        sentRequests.find((r) => r.id === viewId) ||
        receivedRequests.find((r) => r.id === viewId);
      if (found) {
        setSelectedRequest(found);
        setShowDetailModal(true);
      }
    }
  }, [viewId, sentRequests, receivedRequests]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const myRequests = await teacherTransferApi.getMyRequests();
      const received = await teacherTransferApi.getReceivedRequests();

      setSentRequests(Array.isArray(myRequests) ? myRequests : []);
      setReceivedRequests(Array.isArray(received) ? received : []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);

      switch (actionType) {
        case "accept":
          await teacherTransferApi.acceptTransfer(selectedRequest.id, {
            notes: "Request accepted",
          });
          toast.success("Transfer request accepted");
          break;
        case "decline":
          // Note: Decline is handled by admin status change or user can cancel their own request
          await teacherTransferApi.cancel(selectedRequest.id);
          toast.success("Transfer request declined");
          break;
        case "withdraw":
          await teacherTransferApi.cancel(selectedRequest.id);
          toast.success("Transfer request withdrawn");
          break;
      }

      await fetchRequests();
      setShowActionDialog(false);
      setShowDetailModal(false);
    } catch (error) {
      handleApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: TransferRequestStatus) => {
    const statusConfig = {
      PENDING: { icon: Clock, variant: "secondary" as const, label: "Pending" },
      VERIFIED: {
        icon: CheckCircle,
        variant: "default" as const,
        label: "Verified",
      },
      ACCEPTED: {
        icon: CheckCircle,
        variant: "default" as const,
        label: "Accepted",
      },
      REJECTED: {
        icon: XCircle,
        variant: "destructive" as const,
        label: "Rejected",
      },
      COMPLETED: {
        icon: CheckCircle,
        variant: "outline" as const,
        label: "Completed",
      },
      CANCELLED: {
        icon: XCircle,
        variant: "secondary" as const,
        label: "Cancelled",
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filterRequests = (requests: TeacherTransferRequest[]) => {
    if (statusFilter === "all") return requests;
    return requests.filter((r) => r.status === statusFilter);
  };

  const RequestCard = ({
    request,
    type,
  }: {
    request: TeacherTransferRequest;
    type: "sent" | "received";
  }) => {
    const canWithdraw =
      type === "sent" && ["PENDING", "VERIFIED"].includes(request.status);
    const canRespond = type === "received" && request.status === "PENDING";

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{request.subject}</h3>
                {getStatusBadge(request.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                {request.currentSchool}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="font-medium">From Zone:</span>
              <p className="text-muted-foreground">{request.fromZone}</p>
            </div>
            <div>
              <span className="font-medium">To Zones:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {request.toZones?.map((zone) => (
                  <Badge key={zone} variant="secondary" className="text-xs">
                    {zone}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="font-medium">Medium:</span>
              <p className="text-muted-foreground">{request.medium}</p>
            </div>
            <div>
              <span className="font-medium">Level:</span>
              <p className="text-muted-foreground">
                {request.level?.toUpperCase()}
              </p>
            </div>
            <div>
              <span className="font-medium">Experience:</span>
              <p className="text-muted-foreground">
                {request.yearsOfService || 0} years
              </p>
            </div>
            <div>
              <span className="font-medium">Date:</span>
              <p className="text-muted-foreground">
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setSelectedRequest(request);
                setShowDetailModal(true);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>

            {canRespond && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedRequest(request);
                    setActionType("accept");
                    setShowActionDialog(true);
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRequest(request);
                    setActionType("decline");
                    setShowActionDialog(true);
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline
                </Button>
              </>
            )}

            {canWithdraw && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSelectedRequest(request);
                  setActionType("withdraw");
                  setShowActionDialog(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Withdraw
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ type }: { type: "sent" | "received" }) => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Send className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">No {type} requests yet</p>
        <p className="text-sm text-muted-foreground mt-2 mb-4">
          {type === "sent"
            ? "Start searching for compatible matches to send requests"
            : "You haven't received any transfer requests yet"}
        </p>
        {type === "sent" && (
          <Button onClick={() => router.push("/teacher/transfers/search")}>
            <ArrowRight className="mr-2 h-4 w-4" />
            Start Searching
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Transfer Requests</h1>
            <p className="text-muted-foreground mt-1">
              Manage sent and received transfer requests
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={fetchRequests} disabled={loading}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "sent" | "received")}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sent">
            Sent Requests ({sentRequests.length})
          </TabsTrigger>
          <TabsTrigger value="received">
            Received Requests ({receivedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sent" className="space-y-4 mt-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filterRequests(sentRequests).length === 0 ? (
            <EmptyState type="sent" />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filterRequests(sentRequests).map((request) => (
                <RequestCard key={request.id} request={request} type="sent" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="received" className="space-y-4 mt-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filterRequests(receivedRequests).length === 0 ? (
            <EmptyState type="received" />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filterRequests(receivedRequests).map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  type="received"
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transfer Request Details</DialogTitle>
            <DialogDescription>
              Complete information about this transfer request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {/* Registration Info */}
              <div>
                <h3 className="font-semibold mb-2">Registration Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Registration ID:</span>
                    <p className="text-muted-foreground">
                      {selectedRequest.registrationId}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Years of Service:</span>
                    <p className="text-muted-foreground">
                      {selectedRequest.yearsOfService || 0} years
                    </p>
                  </div>
                </div>
              </div>

              {/* School Info */}
              <div>
                <h3 className="font-semibold mb-2">Current School</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">School:</span>
                    <p className="text-muted-foreground">
                      {selectedRequest.currentSchool}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>
                    <p className="text-muted-foreground">
                      {selectedRequest.currentSchoolType}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">District:</span>
                    <p className="text-muted-foreground">
                      {selectedRequest.currentDistrict}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Zone:</span>
                    <p className="text-muted-foreground">
                      {selectedRequest.currentZone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transfer Preferences */}
              <div>
                <h3 className="font-semibold mb-2">Transfer Preferences</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">From Zone:</span>
                    <p className="text-muted-foreground">
                      {selectedRequest.fromZone}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Desired Zones:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRequest.toZones?.map((zone) => (
                        <Badge key={zone} variant="secondary">
                          {zone}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Teaching Details */}
              <div>
                <h3 className="font-semibold mb-2">Teaching Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Subject:</span>
                    <p className="text-muted-foreground">
                      {selectedRequest.subject}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Medium:</span>
                    <p className="text-muted-foreground">
                      {selectedRequest.medium}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Level:</span>
                    <p className="text-muted-foreground">
                      {selectedRequest.level?.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Qualifications:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRequest.qualifications?.map((qual) => (
                        <Badge key={qual} variant="outline" className="text-xs">
                          {qual}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {(selectedRequest.additionalRequirements ||
                selectedRequest.notes) && (
                <div>
                  <h3 className="font-semibold mb-2">Additional Information</h3>
                  {selectedRequest.additionalRequirements && (
                    <div className="mb-2">
                      <span className="font-medium text-sm">Requirements:</span>
                      <p className="text-sm text-muted-foreground">
                        {selectedRequest.additionalRequirements}
                      </p>
                    </div>
                  )}
                  {selectedRequest.notes && (
                    <div>
                      <span className="font-medium text-sm">Notes:</span>
                      <p className="text-sm text-muted-foreground">
                        {selectedRequest.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Dates */}
              <div className="text-xs text-muted-foreground pt-4 border-t">
                <p>
                  Created:{" "}
                  {new Date(selectedRequest.createdAt).toLocaleString()}
                </p>
                <p>
                  Updated:{" "}
                  {new Date(selectedRequest.updatedAt).toLocaleString()}
                </p>
                {selectedRequest.verifiedAt && (
                  <p>
                    Verified:{" "}
                    {new Date(selectedRequest.verifiedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "accept" && "Accept Transfer Request?"}
              {actionType === "decline" && "Decline Transfer Request?"}
              {actionType === "withdraw" && "Withdraw Transfer Request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "accept" &&
                "By accepting, you agree to proceed with this mutual transfer. This action cannot be undone."}
              {actionType === "decline" &&
                "The sender will be notified of your decision. This action cannot be undone."}
              {actionType === "withdraw" &&
                "Your transfer request will be cancelled and removed from the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {actionType === "accept" && "Yes, Accept"}
              {actionType === "decline" && "Yes, Decline"}
              {actionType === "withdraw" && "Yes, Withdraw"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
