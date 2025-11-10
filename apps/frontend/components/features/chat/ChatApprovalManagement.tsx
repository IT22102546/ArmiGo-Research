import React, { useState } from "react";
import { FiSearch, FiFilter, FiEye } from "react-icons/fi";
import { HiOutlineChevronDown } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import Image from "next/image";

const FiSearchIcon = FiSearch as React.ComponentType<any>;
const FiFilterIcon = FiFilter as React.ComponentType<any>;
const FiEyeIcon = FiEye as React.ComponentType<any>;
const HiOutlineChevronDownIcon =
  HiOutlineChevronDown as React.ComponentType<any>;
const IoCloseIcon = IoClose as React.ComponentType<any>;

interface Message {
  id: string;
  from: string;
  to: string;
  type: "Teacher - Student" | "Student - Teacher";
  message: string;
  date: string;
  status: "Approved" | "Pending" | "Rejected";
}

const ChatApprove = () => {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [messages] = useState<Message[]>([
    {
      id: "#12345",
      from: "Amila Ranathunga",
      to: "John Keela",
      type: "Teacher - Student",
      message: "A great teacher is a treasure to students...",
      date: "12.12.2025 AT 3.30 PM",
      status: "Approved",
    },
    {
      id: "#12346",
      from: "Amila Ranathunga",
      to: "John Keela",
      type: "Teacher - Student",
      message: "Please check your...",
      date: "12.04.2024",
      status: "Pending",
    },
    {
      id: "#12347",
      from: "Amila Ranathunga",
      to: "John Keela",
      type: "Teacher - Student",
      message: "Please check your...",
      date: "12.04.2024",
      status: "Rejected",
    },
    {
      id: "#12348",
      from: "Amila Ranathunga",
      to: "John Keela",
      type: "Student - Teacher",
      message: "Please check your...",
      date: "12.04.2024",
      status: "Pending",
    },
  ]);

  const getStatusColor = (status: Message["status"]): string => {
    switch (status) {
      case "Approved":
        return "text-green-600 bg-green-100";
      case "Pending":
        return "text-yellow-600 bg-yellow-100";
      case "Rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getTypeColor = (type: Message["type"]): string => {
    return type === "Teacher - Student"
      ? "bg-blue-100 text-blue-600"
      : "bg-green-100 text-green-600";
  };

  const handleView = (msg: Message): void => {
    setSelectedMessage(msg);
    setIsModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setSelectedMessage(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground mb-4 flex items-center space-x-1">
        <span className="cursor-pointer hover:underline">Message Approval</span>
        <span>/</span>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Message Approval
        </h1>
        <p className="text-muted-foreground text-sm">
          View Comprehensive Student Details and Training Status
        </p>
      </div>

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center rounded-md bg-card px-3 py-2 w-full sm:w-72 shadow-sm border border-border focus-within:ring-2 focus-within:ring-blue-500">
          <FiSearchIcon className="text-muted-foreground mr-2" />
          <input
            type="text"
            placeholder="Search for..."
            className="w-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <button className="flex items-center border border-border rounded-md px-3 py-2 bg-card text-foreground text-sm hover:bg-muted">
            <FiFilterIcon className="mr-2" />
            Filter
          </button>
          <button className="flex items-center border border-border rounded-md px-3 py-2 bg-card text-foreground text-sm hover:bg-muted">
            Status
            <HiOutlineChevronDownIcon className="ml-2" />
          </button>
          <button className="flex items-center border border-border rounded-md px-3 py-2 bg-card text-foreground text-sm hover:bg-muted">
            Export As
            <HiOutlineChevronDownIcon className="ml-2" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-card rounded-lg shadow border border-border">
        <table className="w-full text-left text-sm text-muted-foreground">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 w-10">
                <input type="checkbox" />
              </th>
              <th className="px-4 py-3 font-semibold">Msg_ID</th>
              <th className="px-4 py-3 font-semibold">From</th>
              <th className="px-4 py-3 font-semibold">To</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Message</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((msg, index) => (
              <tr
                key={msg.id}
                className="border-b border-border hover:bg-muted transition"
              >
                <td className="px-4 py-3">
                  <input type="checkbox" />
                </td>
                <td className="px-4 py-3">{msg.id}</td>

                {/* From */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Image
                      src={`https://i.pravatar.cc/40?img=${index + 2}`}
                      alt="avatar"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full border border-border"
                    />
                    <span className="text-foreground font-medium">
                      {msg.from}
                    </span>
                  </div>
                </td>

                {/* To */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Image
                      src={`https://i.pravatar.cc/40?img=${index + 5}`}
                      alt="avatar"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full border border-border"
                    />
                    <span className="text-foreground font-medium">
                      {msg.to}
                    </span>
                  </div>
                </td>

                {/* Type */}
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-md ${getTypeColor(
                      msg.type
                    )}`}
                  >
                    {msg.type}
                  </span>
                </td>

                <td className="px-4 py-3 text-muted-foreground truncate max-w-[180px]">
                  {msg.message}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{msg.date}</td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-md ${getStatusColor(
                      msg.status
                    )}`}
                  >
                    {msg.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleView(msg)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FiEyeIcon size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-lg max-w-xl w-full p-6 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <IoCloseIcon size={22} />
            </button>

            <h2 className="text-xl font-semibold text-foreground mb-6">
              Message Approval
            </h2>

            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">From</p>
                <div className="flex items-center gap-2">
                  <Image
                    src={`https://i.pravatar.cc/40?u=${selectedMessage.from}`}
                    alt={`${selectedMessage.from} avatar`}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full border border-border"
                  />
                  <span className="text-foreground font-medium">
                    Teacher – {selectedMessage.from}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">To</p>
                <div className="flex items-center gap-2">
                  <Image
                    src={`https://i.pravatar.cc/40?u=${selectedMessage.to}`}
                    alt={`${selectedMessage.to} avatar`}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full border border-border"
                  />
                  <span className="text-foreground font-medium">
                    Student – {selectedMessage.to}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Type</p>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-md ${getTypeColor(
                    selectedMessage.type
                  )}`}
                >
                  {selectedMessage.type}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Date & Time
                </p>
                <p className="text-foreground font-medium">
                  {selectedMessage.date}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-1">Message</p>
              <textarea
                value={selectedMessage.message}
                readOnly
                rows={4}
                className="w-full border rounded-md p-3 text-foreground text-sm resize-none bg-muted focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-card text-foreground rounded-md hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors">
                Reject
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Approve Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApprove;
