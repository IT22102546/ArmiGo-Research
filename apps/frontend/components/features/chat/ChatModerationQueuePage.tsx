"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  Paperclip,
  MessageSquare,
} from "lucide-react";
import { chatModerationApi } from "@/lib/api/endpoints/chat-moderation";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";

interface ChatMessage {
  id: string;
  from?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email?: string;
  };
  to?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email?: string;
  };
  content: string;
  attachments: string[];
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  metadata?: {
    classId?: string;
    className?: string;
    examId?: string;
    examTitle?: string;
  };
  createdAt: string;
  rejectionReason?: string;
}

export default function ChatModerationQueuePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromRoleFilter, setFromRoleFilter] = useState<string>("ALL");
  const [contextFilter, setContextFilter] = useState<string>("ALL");
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
    new Set()
  );

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Preview dialog
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(
    null
  );

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectMessage, setRejectMessage] = useState<ChatMessage | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchMessages();
  }, [pagination.page, fromRoleFilter, contextFilter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await chatModerationApi.getPendingMessages({
        page: pagination.page,
        limit: pagination.limit,
        fromRole: (fromRoleFilter === "ALL"
          ? undefined
          : fromRoleFilter) as any,
        contextType: (contextFilter === "ALL"
          ? undefined
          : contextFilter) as any,
      });
      const messagesArr = Array.isArray(response)
        ? response
        : (response.data ?? []);
      setMessages(messagesArr);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total ?? 0,
        pages:
          response.pagination?.pages ??
          Math.ceil((response.pagination?.total ?? 0) / pagination.limit),
      }));
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (message: ChatMessage) => {
    setSelectedMessage(message);
    setPreviewDialogOpen(true);
  };

  const handleApprove = async (messageId: string) => {
    try {
      setLoading(true);
      await chatModerationApi.approve(messageId);
      handleApiSuccess("Message approved");
      fetchMessages();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectMessage || !rejectionReason.trim()) {
      handleApiError("Please provide a rejection reason");
      return;
    }

    try {
      setLoading(true);
      await chatModerationApi.reject(rejectMessage.id, {
        reason: rejectionReason,
      });
      handleApiSuccess("Message rejected");
      setRejectDialogOpen(false);
      setRejectionReason("");
      setRejectMessage(null);
      fetchMessages();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedMessages.size === 0) {
      handleApiError("No messages selected");
      return;
    }

    try {
      setLoading(true);
      await chatModerationApi.bulkApprove({
        messageIds: Array.from(selectedMessages),
      });
      handleApiSuccess(
        `${selectedMessages.size} message(s) approved successfully`
      );
      setSelectedMessages(new Set());
      fetchMessages();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMessageSelection = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const toggleAllMessages = () => {
    if (selectedMessages.size === messages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(messages.map((m) => m.id)));
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chat Moderation Queue</CardTitle>
          <CardDescription>
            Review and moderate pending chat messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-4">
              <Select value={fromRoleFilter} onValueChange={setFromRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="From Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="INTERNAL_STUDENT">Student</SelectItem>
                  <SelectItem value="INTERNAL_TEACHER">Teacher</SelectItem>
                  <SelectItem value="EXTERNAL_TEACHER">
                    External Teacher
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={contextFilter} onValueChange={setContextFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Context" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Contexts</SelectItem>
                  <SelectItem value="CLASS">Class</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                  <SelectItem value="DIRECT">Direct Message</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={fetchMessages} variant="outline" size="icon">
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>

            {selectedMessages.size > 0 && (
              <Button onClick={handleBulkApprove} disabled={loading}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Selected ({selectedMessages.size})
              </Button>
            )}
          </div>

          {/* Messages Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        messages.length > 0 &&
                        selectedMessages.size === messages.length
                      }
                      onCheckedChange={toggleAllMessages}
                    />
                  </TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Loading messages...
                      </p>
                    </TableCell>
                  </TableRow>
                ) : messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No pending messages to moderate
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedMessages.has(message.id)}
                          onCheckedChange={() =>
                            toggleMessageSelection(message.id)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(message.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {message.from?.firstName} {message.from?.lastName}
                          </span>
                          <Badge variant="outline" className="w-fit text-xs">
                            {message.from?.role}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {message.to?.firstName} {message.to?.lastName}
                          </span>
                          <Badge variant="outline" className="w-fit text-xs">
                            {message.to?.role}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                              {truncateText(message.content, 80)}
                            </p>
                            {message.attachments.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <Paperclip className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {message.attachments.length} attachment(s)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {message.metadata?.classId && (
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Class
                            </span>
                            <span className="text-sm font-medium">
                              {message.metadata.className}
                            </span>
                          </div>
                        )}
                        {message.metadata?.examId && (
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Exam
                            </span>
                            <span className="text-sm font-medium">
                              {message.metadata.examTitle}
                            </span>
                          </div>
                        )}
                        {!message.metadata?.classId &&
                          !message.metadata?.examId && (
                            <Badge variant="secondary" className="text-xs">
                              Direct
                            </Badge>
                          )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(message)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700 border-green-600"
                            onClick={() => handleApprove(message.id)}
                            disabled={loading}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 border-red-600"
                            onClick={() => {
                              setRejectMessage(message);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} messages
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Preview</DialogTitle>
            <DialogDescription>
              Review the complete message before approving or rejecting
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-6">
              {/* Message Header */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <Label className="text-muted-foreground">From</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">
                      {selectedMessage.from?.firstName}{" "}
                      {selectedMessage.from?.lastName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {selectedMessage.from?.role}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">To</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">
                      {selectedMessage.to?.firstName}{" "}
                      {selectedMessage.to?.lastName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {selectedMessage.to?.role}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sent</Label>
                  <p className="font-medium mt-1">
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Context</Label>
                  <div className="mt-1">
                    {selectedMessage.metadata?.classId && (
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          Class
                        </span>
                        <span className="font-medium">
                          {selectedMessage.metadata.className}
                        </span>
                      </div>
                    )}
                    {selectedMessage.metadata?.examId && (
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          Exam
                        </span>
                        <span className="font-medium">
                          {selectedMessage.metadata.examTitle}
                        </span>
                      </div>
                    )}
                    {!selectedMessage.metadata?.classId &&
                      !selectedMessage.metadata?.examId && (
                        <Badge variant="secondary">Direct Message</Badge>
                      )}
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Message</Label>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">
                    {selectedMessage.content}
                  </p>
                </div>
              </div>

              {/* Attachments */}
              {selectedMessage.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Attachments</Label>
                  <div className="space-y-2">
                    {selectedMessage.attachments.map((attachment, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-muted p-3 rounded"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm flex-1">{attachment}</span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 border-red-600"
              onClick={() => {
                if (selectedMessage) {
                  setRejectMessage(selectedMessage);
                  setPreviewDialogOpen(false);
                  setRejectDialogOpen(true);
                }
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (selectedMessage) {
                  handleApprove(selectedMessage.id);
                  setPreviewDialogOpen(false);
                }
              }}
              disabled={loading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Message</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this message
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>
                Rejection Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Explain why this message is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
                setRejectMessage(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={loading || !rejectionReason.trim()}
              variant="destructive"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
