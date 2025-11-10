"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Filter,
  BarChart3,
  RefreshCw,
  CheckCheck,
} from "lucide-react";
import { chatModerationApi } from "@/lib/api";
import type {
  ChatMessage,
  UserRole,
  ModerationFilters,
} from "@/lib/api/endpoints/chat-moderation";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
import { format } from "date-fns";

const safeFormatDate = (value?: string | Date | null, fmt = "PPp") => {
  if (!value) return "-";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (!d || isNaN(d.getTime())) return "-";
    return format(d, fmt);
  } catch {
    return "-";
  }
};

export default function AdminChatModerationPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [messageTypeFilter, setMessageTypeFilter] = useState<string>("ALL");
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [messageToReject, setMessageToReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch pending messages
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ["pending-messages", page, roleFilter, messageTypeFilter],
    queryFn: () => {
      const filters: ModerationFilters = {
        page,
        limit: 20,
      };
      if (roleFilter !== "ALL") {
        filters.fromRole = roleFilter as UserRole;
      }
      if (messageTypeFilter !== "ALL") {
        filters.contextType =
          messageTypeFilter as ModerationFilters["contextType"];
      }
      return chatModerationApi.getPendingMessages(filters);
    },
  });

  // Fetch moderation stats
  const { data: stats } = useQuery({
    queryKey: ["moderation-stats"],
    queryFn: () => chatModerationApi.getStats(),
  });

  // Approve message mutation
  const approveMutation = useMutation({
    mutationFn: (messageId: string) => chatModerationApi.approve(messageId),
    onSuccess: () => {
      handleApiSuccess("Message approved successfully");
      queryClient.invalidateQueries({ queryKey: ["pending-messages"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-stats"] });
    },
    onError: (error) => {
      handleApiError(error, "Failed to approve message");
    },
  });

  // Reject message mutation
  const rejectMutation = useMutation({
    mutationFn: ({
      messageId,
      reason,
    }: {
      messageId: string;
      reason: string;
    }) => chatModerationApi.reject(messageId, { reason }),
    onSuccess: () => {
      handleApiSuccess("Message rejected successfully");
      queryClient.invalidateQueries({ queryKey: ["pending-messages"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-stats"] });
      setRejectDialogOpen(false);
      setRejectionReason("");
      setMessageToReject(null);
    },
    onError: (error) => {
      handleApiError(error, "Failed to reject message");
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: (messageIds: string[]) =>
      chatModerationApi.bulkApprove({ messageIds }),
    onSuccess: () => {
      handleApiSuccess("Messages approved successfully");
      queryClient.invalidateQueries({ queryKey: ["pending-messages"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-stats"] });
      setSelectedMessages([]);
    },
    onError: (error) => {
      handleApiError(error, "Failed to approve messages");
    },
  });

  const handleApprove = (messageId: string) => {
    approveMutation.mutate(messageId);
  };

  const handleReject = (messageId: string) => {
    setMessageToReject(messageId);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (messageToReject && rejectionReason.trim()) {
      rejectMutation.mutate({
        messageId: messageToReject,
        reason: rejectionReason,
      });
    }
  };

  const handleBulkApprove = () => {
    if (selectedMessages.length > 0) {
      bulkApproveMutation.mutate(selectedMessages);
    }
  };

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMessages.length === messagesData?.data.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(messagesData?.data.map((m) => m.id) || []);
    }
  };

  const getMessageTypeBadge = (type: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "outline" | "destructive"
    > = {
      DIRECT: "default",
      GROUP: "secondary",
      ANNOUNCEMENT: "outline",
    };
    const variant = variants[type] ?? "default";
    return <Badge variant={variant}>{type.replace("_", " ")}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      STUDENT: "bg-blue-100 text-blue-800",
      TEACHER: "bg-green-100 text-green-800",
      ADMIN: "bg-purple-100 text-purple-800",
      SUPER_ADMIN: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role] || ""}`}
      >
        {role.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chat Moderation</h1>
          <p className="text-muted-foreground mt-1">
            Review and moderate pending chat messages
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["pending-messages"] })
          }
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Messages
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Sender Role
              </label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="INTERNAL_STUDENT">
                    Internal Student
                  </SelectItem>
                  <SelectItem value="EXTERNAL_STUDENT">
                    External Student
                  </SelectItem>
                  <SelectItem value="INTERNAL_TEACHER">
                    Internal Teacher
                  </SelectItem>
                  <SelectItem value="EXTERNAL_TEACHER">
                    External Teacher
                  </SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Message Type
              </label>
              <Select
                value={messageTypeFilter}
                onValueChange={setMessageTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="DIRECT">Direct</SelectItem>
                  <SelectItem value="GROUP">Group</SelectItem>
                  <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedMessages.length > 0 && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedMessages.length} message(s) selected
              </span>
              <Button
                size="sm"
                onClick={handleBulkApprove}
                disabled={bulkApproveMutation.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Approve Selected
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Messages</CardTitle>
          <CardDescription>
            {messagesData?.pagination.total || 0} pending messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : !messagesData?.data.length ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending messages</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedMessages.length === messagesData.data.length
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messagesData.data.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedMessages.includes(message.id)}
                          onCheckedChange={() =>
                            toggleMessageSelection(message.id)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {message.from?.firstName || "Unknown"}{" "}
                            {message.from?.lastName || ""}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getRoleBadge(message.from?.role || "")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {message.to?.firstName || "Unknown"}{" "}
                            {message.to?.lastName || ""}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getRoleBadge(message.to?.role || "")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getMessageTypeBadge(message.messageType)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {message.content}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {safeFormatDate(message.createdAt, "PPp")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(message.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(message.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {messagesData.pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {messagesData.pagination.pages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= messagesData.pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Message</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this message.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              Reject Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
