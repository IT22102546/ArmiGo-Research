"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Send } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApiClient } from "@/lib/api/api-client";
import { format } from "date-fns";

export default function AdminChatPage() {
  const [message, setMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  const { data: chats, isLoading } = useQuery({
    queryKey: ["admin-chats"],
    queryFn: async () => {
      const response = await ApiClient.request<any>("/chat/admin");
      return response;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["admin-chat-messages", selectedChat],
    queryFn: async () => {
      if (!selectedChat) return [];
      return await ApiClient.request<any[]>(
        `/admin/chats/${selectedChat}/messages`
      );
    },
    enabled: !!selectedChat,
  });

  const handleSend = () => {
    if (!message.trim() || !selectedChat) return;
    // Send message logic here
    setMessage("");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Chat</h1>
          <p className="text-muted-foreground">
            Internal communication between administrators
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chat List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading chats...</div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {chats?.map((chat: any) => (
                    <div
                      key={chat.id}
                      className={`p-3 rounded-lg cursor-pointer hover:bg-muted ${
                        selectedChat === chat.id ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedChat(chat.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{chat.name}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {chat.lastMessage?.content}
                          </div>
                        </div>
                        {chat.unreadCount > 0 && (
                          <Badge variant="destructive">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {chat.lastMessage?.createdAt &&
                          format(new Date(chat.lastMessage.createdAt), "p")}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>
              {selectedChat
                ? chats?.find((c: any) => c.id === selectedChat)?.name
                : "Select a conversation"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedChat ? (
              <>
                <ScrollArea className="h-[500px] mb-4">
                  <div className="space-y-4">
                    {messages?.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isSentByMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.isSentByMe
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="text-sm font-medium mb-1">
                            {msg.sender?.firstName} {msg.sender?.lastName}
                          </div>
                          <div>{msg.content}</div>
                          <div className="text-xs opacity-70 mt-1">
                            {format(new Date(msg.createdAt), "p")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  />
                  <Button onClick={handleSend}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                Select a conversation to start chatting
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
