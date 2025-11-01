import React, { useState } from "react";
import { FiArrowLeft, FiSend, FiPlus } from "react-icons/fi";

const FiArrowLeftIcon = FiArrowLeft as React.ComponentType<any>;
const FiSendIcon = FiSend as React.ComponentType<any>;
const FiPlusIcon = FiPlus as React.ComponentType<any>;
import Image from "next/image";

interface Message {
  from: "me" | "them";
  text: string;
  link?: string;
}

interface Chat {
  id: number;
  sender: string;
  time: string;
  avatar: string;
  unread?: boolean;
  messages: Message[];
}

const chatList: Chat[] = [
  {
    id: 1,
    sender: "Sarah Johnson",
    time: "12:01pm",
    avatar: "https://i.pravatar.cc/40?img=47",
    messages: [
      { from: "me", text: "Hey!" },
      {
        from: "them",
        text: "Hey we haven't seen each other in like 2 weeks hahaha do you want to go grab coffee nearby?",
      },
      {
        from: "them",
        text: "I just need to find some time on my calendar since I have been so busy, and I know we both have!",
      },
      { from: "me", text: "Yes I would love that!" },
      { from: "me", text: "Pick a place" },
      { from: "me", text: "Sorry working so I can't look up one" },
      {
        from: "them",
        text: "Beans and Cats at 5402 N State St",
        link: "https://maps.google.com/?q=5402+N+State+St",
      },
      {
        from: "me",
        text: "Thanks, I can't wait to see you tomorrow for coffee!",
      },
    ],
  },
  {
    id: 2,
    sender: "Jane Carr",
    time: "11:54am",
    avatar: "https://i.pravatar.cc/40?img=32",
    unread: true,
    messages: [
      { from: "them", text: "I can't join, sorry! Have fun!" },
      { from: "me", text: "No worries, maybe next time!" },
    ],
  },
  {
    id: 3,
    sender: "Mike Smith",
    time: "11:22pm",
    avatar: "https://i.pravatar.cc/40?img=15",
    messages: [
      {
        from: "them",
        text: "Thanks, I can't wait to see you tomorrow for coffee!",
      },
      { from: "me", text: "See you soon!" },
    ],
  },
  {
    id: 4,
    sender: "Phillip Aminoff",
    time: "11:22pm",
    avatar: "https://i.pravatar.cc/40?img=18",
    messages: [
      { from: "them", text: "I know! Where is the time going?!" },
      { from: "me", text: "Right?! It's crazy!" },
    ],
  },
  {
    id: 5,
    sender: "Maria Carder",
    time: "11:22pm",
    avatar: "https://i.pravatar.cc/40?img=45",
    messages: [
      { from: "them", text: "Too freaking cute!! I love puppies!" },
      { from: "me", text: "Haha yes! They're adorable!" },
    ],
  },
  {
    id: 6,
    sender: "Haylie Schleifer",
    time: "11:22pm",
    avatar: "https://i.pravatar.cc/40?img=55",
    messages: [
      { from: "them", text: "Sounds good" },
      { from: "me", text: "Perfect!" },
    ],
  },
];

export default function AdminChat() {
  const [selectedChat, setSelectedChat] = useState<Chat>(chatList[0]);
  const [newMessage, setNewMessage] = useState<string>("");

  const handleSend = (): void => {
    if (!newMessage.trim()) return;
    setSelectedChat((prev) => ({
      ...prev,
      messages: [...prev.messages, { from: "me", text: newMessage }],
    }));
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-100">
        <div className="flex items-center gap-2">
          <FiArrowLeftIcon className="text-gray-600 text-lg cursor-pointer" />
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Admin chat</h1>
            <p className="text-xs text-gray-500">Create Exam</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/4 border-r flex flex-col bg-gray-100">
          <div className="p-3">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {chatList.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`flex items-start justify-between px-4 py-3 border-b cursor-pointer transition-all ${
                  selectedChat.id === chat.id
                    ? "bg-white shadow-sm"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <div className="flex gap-3">
                  <Image
                    src={chat.avatar}
                    alt={chat.sender}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {chat.sender}
                    </p>
                    <p className="text-sm text-gray-600 truncate w-40">
                      {chat.messages[chat.messages.length - 1].text}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-400 text-right">
                  <p>{chat.time}</p>
                  {chat.unread && (
                    <span className="bg-blue-600 text-white text-[10px] rounded-full px-2 py-[1px] ml-1">
                      1
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col justify-between bg-white">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <p className="text-center text-gray-400 text-sm">Today 10:27am</p>
            {selectedChat.messages.map((msg, i) =>
              msg.from === "me" ? (
                <div key={i} className="flex items-start gap-2">
                  <Image
                    src={selectedChat.avatar}
                    alt="me"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl max-w-[60%]">
                    <p>{msg.text}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex flex-col items-end space-y-2">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl max-w-[70%]">
                    {msg.link ? (
                      <p>
                        Beans and Cats at{" "}
                        <a
                          href={msg.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          5402 N State St
                        </a>
                      </p>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Message Input */}
          <div className="flex items-center p-4 border-t bg-gray-50">
            <div className="flex items-center gap-2 w-full bg-gray-200 px-4 py-2 rounded-full shadow-inner">
              <button className="p-2 hover:bg-gray-300 rounded-full transition">
                <FiPlusIcon className="text-gray-600 text-lg" />
              </button>
              <input
                type="text"
                placeholder="Message"
                value={newMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewMessage(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                  e.key === "Enter" && handleSend()
                }
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-500 focus:outline-none border-none"
              />
              <button
                onClick={handleSend}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition"
              >
                <FiSendIcon size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
