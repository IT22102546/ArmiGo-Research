"use client";
import { useState } from "react";
import {
  ArrowLeft,
  Send,
  Download,
  Clock,
  MoreHorizontal,
  Check,
  X,
  MapPin,
  BookOpen,
  School,
} from "lucide-react";
import { getDisplayName } from "@/lib/utils/display";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/shared/StatCard";
import { TeacherCard } from "@/components/shared/TeacherCard";
import Image from "next/image";

type Teacher = {
  name: string;
  id: string;
  district: string;
  school: string;
  currentZone: string;
  wantZone: string;
};

type SendRequest = {
  id: string;
  teacherName: string;
  district: string;
  medium: string;
  level: string;
  requestZone: string;
  status: "accepted" | "waiting" | "rejected";
};

type ReceivedRequest = {
  name: string;
  id: string;
  district: string;
  subject: string;
  medium: string;
  currentZone: string;
  desiredZone: string;
  image: string;
};

type StatusType = "accepted" | "waiting" | "rejected" | "pending";

export default function TransferManagement() {
  const [activeTab, setActiveTab] = useState<"transfers" | "request">(
    "transfers"
  );
  const [requestType, setRequestType] = useState<"send" | "received">("send");

  const teachers: Teacher[] = [
    {
      name: "Mr.Sarah Johnson",
      id: "TCXDF-123",
      district: "Kaluthara",
      school: "Science",
      currentZone: "North Zone",
      wantZone: "West Zone",
    },
    {
      name: "Mr.Sarah Johnson",
      id: "TCXDF-123",
      district: "Kaluthara",
      school: "Science",
      currentZone: "North Zone",
      wantZone: "West Zone",
    },
  ];

  const sendRequests: SendRequest[] = [
    {
      id: "TDD-4567523",
      teacherName: "Avish Brazelnaga",
      district: "Kakshara",
      medium: "Tamil",
      level: "Primary",
      requestZone: "West Zone",
      status: "accepted",
    },
    {
      id: "TDD-4567524",
      teacherName: "Avish Brazelnaga",
      district: "Kakshara",
      medium: "Tamil",
      level: "Primary",
      requestZone: "West Zone",
      status: "waiting",
    },
  ];

  const receivedRequests: ReceivedRequest[] = [
    {
      name: "Mr.Sarah Johnson",
      id: "T10230-123",
      district: "Kaluthara",
      subject: "Science",
      medium: "Tamil, Primary",
      currentZone: "West",
      desiredZone: "North",
      image: "https://i.pravatar.cc/100?img=1",
    },
    {
      name: "Mr.Sarah Johnson",
      id: "T10230-123",
      district: "Kaluthara",
      subject: "Science",
      medium: "Tamil, Primary",
      currentZone: "West",
      desiredZone: "North",
      image: "https://i.pravatar.cc/100?img=2",
    },
    {
      name: "Mr.Sarah Johnson",
      id: "T10230-123",
      district: "Kaluthara",
      subject: "Science",
      medium: "Tamil, Primary",
      currentZone: "West",
      desiredZone: "North",
      image: "https://i.pravatar.cc/100?img=3",
    },
  ];

  const getStatusColor = (status: StatusType): string => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "waiting":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusText = (status: StatusType): string => {
    switch (status) {
      case "accepted":
        return "Accepted";
      case "waiting":
        return "Waiting";
      case "rejected":
        return "Rejected";
      default:
        return "Pending";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Mutual Transfer</span>
          </button>
          <h1 className="text-2xl font-bold mb-1">
            {activeTab === "transfers" ? "Mutual Transfer" : "Transfer Request"}
          </h1>
          <p className="text-gray-500">
            {activeTab === "transfers"
              ? "Find and Connect With Teachers With Mutual Transfers"
              : "Manage your send and receive Transfer Request"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={Send}
            label="Request Send"
            count={67}
            variant="primary"
          />
          <StatCard
            icon={Download}
            label="Request Received"
            count={3}
            variant="success"
          />
          <StatCard
            icon={Clock}
            label="Pending Approval"
            count={25}
            variant="warning"
          />
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "transfers" | "request")
          }
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
            <TabsTrigger value="request">Request</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Transfers Section */}
        {activeTab === "transfers" ? (
          <>
            {/* Search Filters */}
            <Card className="p-6 mb-6">
              <h3 className="font-semibold mb-4">Search Filter</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    District
                  </label>
                  <Select defaultValue="kaluthara">
                    <SelectTrigger>
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kaluthara">Kaluthara</SelectItem>
                      <SelectItem value="colombo">Colombo</SelectItem>
                      <SelectItem value="gampaha">Gampaha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Zone</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="To Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="north">North Zone</SelectItem>
                      <SelectItem value="south">South Zone</SelectItem>
                      <SelectItem value="east">East Zone</SelectItem>
                      <SelectItem value="west">West Zone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Subject
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="math">Mathematics</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="tamil">Tamil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline">Reset</Button>
                <Button>Apply Filter</Button>
              </div>
            </Card>

            {/* Teacher List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {teachers.map((teacher, index) => (
                <TeacherCard key={index} {...teacher} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Request Section */}
            <div className="flex gap-4 mb-6">
              <Button
                variant={requestType === "send" ? "default" : "outline"}
                onClick={() => setRequestType("send")}
                className="flex-1"
              >
                Send Request
              </Button>
              <Button
                variant={requestType === "received" ? "default" : "outline"}
                onClick={() => setRequestType("received")}
                className="flex-1"
              >
                Received Request
              </Button>
            </div>

            {requestType === "send" ? (
              /* Send Request Table */
              <Card className="p-6">
                <h3 className="font-semibold mb-4 text-lg">Send Requests</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-sm text-gray-600">
                        <th className="text-left py-3 px-4 font-medium">
                          Request ID
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Teacher Name
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          District
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Medium
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Level
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Request Zone
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sendRequests.map((r, i) => (
                        <tr key={i} className="border-b hover:bg-muted">
                          <td className="py-3 px-4">{r.id}</td>
                          <td className="py-3 px-4">{r.teacherName}</td>
                          <td className="py-3 px-4">{r.district}</td>
                          <td className="py-3 px-4">{r.medium}</td>
                          <td className="py-3 px-4">{r.level}</td>
                          <td className="py-3 px-4">{r.requestZone}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(
                                r.status
                              )}`}
                            >
                              {getStatusText(r.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              /* ✅ Received Request Layout (matches first image) */
              <div className="space-y-4">
                <h3 className="font-semibold mb-2 text-lg">Receive Request</h3>
                {receivedRequests.map((t, i) => (
                  <Card
                    key={i}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <Image
                        src={t.image}
                        alt={t.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {t.name}
                        </h4>
                        <p className="text-sm text-gray-500">{t.id}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <MapPin className="w-4 h-4" />
                          {t.district}
                          <BookOpen className="w-4 h-4 ml-3" />
                          {getDisplayName(t.subject)}
                          <School className="w-4 h-4 ml-3" />
                          {getDisplayName(t.medium)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Current zone: {t.currentZone} | Desired zone:{" "}
                          {t.desiredZone}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2">
                        Approve
                      </Button>
                      <Button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2">
                        Reject
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
