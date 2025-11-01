import React, { useState } from "react";
import { FiSearch, FiFilter, FiEye } from "react-icons/fi";
import { HiOutlineChevronDown } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import Image from "next/image";

const FiSearchIcon = FiSearch as React.ComponentType<any>;
const FiFilterIcon = FiFilter as React.ComponentType<any>;
const FiEyeIcon = FiEye as React.ComponentType<any>;
const HiOutlineChevronDownIcon = HiOutlineChevronDown as React.ComponentType<any>;
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
    { id: "#12345", from: "Amila Ranathunga", to: "John Keela", type: "Teacher - Student", message: "A great teacher is a treasure to students...", date: "12.12.2025 AT 3.30 PM", status: "Approved" },
    { id: "#12346", from: "Amila Ranathunga", to: "John Keela", type: "Teacher - Student", message: "Please check your...", date: "12.04.2024", status: "Pending" },
    { id: "#12347", from: "Amila Ranathunga", to: "John Keela", type: "Teacher - Student", message: "Please check your...", date: "12.04.2024", status: "Rejected" },
    { id: "#12348", from: "Amila Ranathunga", to: "John Keela", type: "Student - Teacher", message: "Please check your...", date: "12.04.2024", status: "Pending" },
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
        return "text-gray-600 bg-gray-100";
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
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4 flex items-center space-x-1">
        <span className="cursor-pointer hover:underline">Message Approval</span>
        <span>/</span>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Message Approval</h1>
        <p className="text-gray-500 text-sm">
          View Comprehensive Student Details and Training Status
        </p>
      </div>

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center rounded-md bg-white px-3 py-2 w-full sm:w-72 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
          <FiSearchIcon className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search for..."
            className="w-full text-sm text-gray-700 focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <button className="flex items-center border rounded-md px-3 py-2 bg-white text-gray-700 text-sm hover:bg-gray-100">
            <FiFilterIcon className="mr-2" />
            Filter
          </button>
          <button className="flex items-center border rounded-md px-3 py-2 bg-white text-gray-700 text-sm hover:bg-gray-100">
            Status
            <HiOutlineChevronDownIcon className="ml-2" />
          </button>
          <button className="flex items-center border rounded-md px-3 py-2 bg-white text-gray-700 text-sm hover:bg-gray-100">
            Export As
            <HiOutlineChevronDownIcon className="ml-2" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="bg-gray-50 border-b border-gray-200">
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
                className="border-b border-gray-100 hover:bg-gray-50 transition"
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
                      className="w-8 h-8 rounded-full border border-gray-200"
                    />
                    <span className="text-gray-800 font-medium">
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
                      className="w-8 h-8 rounded-full border border-gray-200"
                    />
                    <span className="text-gray-800 font-medium">{msg.to}</span>
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

                <td className="px-4 py-3 text-gray-600 truncate max-w-[180px]">{msg.message}</td>
                <td className="px-4 py-3 text-gray-600">{msg.date}</td>

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
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <IoCloseIcon size={22} />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Message Approval
            </h2>

            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">From</p>
                <div className="flex items-center gap-2">
                  <Image
                    src={`https://i.pravatar.cc/40?u=${selectedMessage.from}`}
                    alt={`${selectedMessage.from} avatar`}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full border"
                  />
                  <span className="text-gray-800 font-medium">
                    Teacher – {selectedMessage.from}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">To</p>
                <div className="flex items-center gap-2">
                  <Image
                    src={`https://i.pravatar.cc/40?u=${selectedMessage.to}`}
                    alt={`${selectedMessage.to} avatar`}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full border"
                  />
                  <span className="text-gray-800 font-medium">
                    Student – {selectedMessage.to}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Type</p>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-md ${getTypeColor(
                    selectedMessage.type
                  )}`}
                >
                  {selectedMessage.type}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                <p className="text-gray-800 font-medium">{selectedMessage.date}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Message</p>
              <textarea
                value={selectedMessage.message}
                readOnly
                rows={4}
                className="w-full border rounded-md p-3 text-gray-800 text-sm resize-none bg-gray-50 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
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