"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, CheckCircle, XCircle, Eye } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ApproveChatPage() {
  const queryClient = useQueryClient();

  const { data: pendingMessages, isLoading } = useQuery({
    queryKey: ["pending-chat-messages"],
    queryFn: async () => {
      const response = await ApiClient.request<any>("/chat/moderation/pending");
      const resp = response?.data ?? response ?? [];
      return Array.isArray(resp) ? resp : resp.messages || resp;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return await ApiClient.request(`/chat/moderation/${messageId}/approve`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-chat-messages"] });
      toast.success("Message approved");
    },
    onError: () => {
      toast.error("Failed to approve message");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return await ApiClient.request(`/chat/moderation/${messageId}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason: "Rejected by admin" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-chat-messages"] });
      toast.success("Message rejected");
    },
    onError: () => {
      toast.error("Failed to reject message");
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Approve Chat Messages</h1>
          <p className="text-muted-foreground">
            Review and approve pending chat messages
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Pending Messages
          </CardTitle>
          <CardDescription>
            Review chat messages awaiting approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading pending messages...</div>
          ) : pendingMessages && pendingMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending messages to review
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingMessages?.map((message: any) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {message.from?.firstName} {message.from?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {message.from?.role}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {message.to?.firstName} {message.to?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {message.to?.role}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {message.content}
                    </TableCell>
                    <TableCell>
                      {format(new Date(message.createdAt), "PPp")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => approveMutation.mutate(message.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => rejectMutation.mutate(message.id)}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
