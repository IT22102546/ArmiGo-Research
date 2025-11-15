"use client";

import { useState, useEffect, useRef, type ElementRef } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { teacherTransferApi } from "@/lib/api/endpoints/teacher-transfers";
import { handleApiError } from "@/lib/error-handling/api-error-handler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Send, Loader2, MessageCircle, CheckCheck, Check } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface TransferMessage {
  id: string;
  transferRequestId: string;
  senderId: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
  content: string;
  read: boolean;
  createdAt: string;
}

interface TransferChatProps {
  transferRequestId: string;
  transferUniqueId?: string;
  onClose?: () => void;
  variant?: "dialog" | "embedded";
}

export function TransferChat({
  transferRequestId,
  transferUniqueId,
  onClose,
  variant = "embedded",
}: TransferChatProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<TransferMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  // ScrollArea from Radix forwards ref to the viewport div
  const scrollRef = useRef<ElementRef<typeof ScrollArea>>(null);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [transferRequestId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const data = await teacherTransferApi.getMessages(transferRequestId);
      setMessages(Array.isArray(data) ? data : []);

      // Mark unread messages as read
      const unreadMessages = (data as TransferMessage[]).filter(
        (msg) => !msg.read && msg.senderId !== user?.id
      );
      for (const msg of unreadMessages) {
        try {
          await teacherTransferApi.markMessageRead(msg.id);
        } catch {
          // Silent fail for read marking
        }
      }
    } catch (error) {
      if (!loading) {
        // Only show error if not initial load
        handleApiError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      await teacherTransferApi.sendMessage({
        transferRequestId,
        content: newMessage.trim(),
      });
      setNewMessage("");
      await fetchMessages();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const chatContent = (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea
        className="flex-1 p-4"
        ref={scrollRef}
        style={{ height: variant === "dialog" ? "400px" : "300px" }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start the conversation to discuss transfer details
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    isOwn ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {!isOwn && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(
                          message.sender.firstName,
                          message.sender.lastName
                        )}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "flex flex-col gap-1 max-w-[70%]",
                      isOwn ? "items-end" : "items-start"
                    )}
                  >
                    {!isOwn && (
                      <span className="text-xs text-muted-foreground">
                        {message.sender.firstName} {message.sender.lastName}
                      </span>
                    )}
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm",
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {message.content}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {isOwn && (
                        <span className="text-xs text-muted-foreground">
                          {message.read ? (
                            <CheckCheck className="h-3 w-3 text-blue-500" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  if (variant === "dialog") {
    return chatContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
        </CardTitle>
        {transferUniqueId && (
          <CardDescription>
            Chat for transfer request {transferUniqueId}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-0">{chatContent}</CardContent>
    </Card>
  );
}

interface TransferChatDialogProps {
  transferRequestId: string;
  transferUniqueId?: string;
  trigger?: React.ReactNode;
}

export function TransferChatDialog({
  transferRequestId,
  transferUniqueId,
  trigger,
}: TransferChatDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Messages
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Transfer Messages
            {transferUniqueId && (
              <span className="text-sm font-normal text-muted-foreground">
                ({transferUniqueId})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <TransferChat
          transferRequestId={transferRequestId}
          transferUniqueId={transferUniqueId}
          variant="dialog"
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default TransferChat;
