"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { teacherTransferApi } from "@/lib/api/endpoints/teacher-transfers";
import type {
  TeacherTransferRequest,
  TeacherTransferMatch,
  TransferRequestStatus,
} from "@/lib/api/endpoints/teacher-transfers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  ArrowRight,
  Search,
  Send,
  MessageCircle,
  Eye,
  Plus,
  RefreshCw,
  AlertCircle,
  Star,
  MapPin,
  BookOpen,
  Award,
  Loader2,
  X,
  CheckCheck,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-handling/api-error-handler";
import { cn } from "@/lib/utils";

type WorkflowStep = "create" | "search" | "interests" | "chat" | "complete";

export default function EnhancedTransferDashboard() {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [myRequest, setMyRequest] = useState<TeacherTransferRequest | null>(
    null
  );
  const [matches, setMatches] = useState<TeacherTransferMatch[]>([]);
  const [sentInterests, setSentInterests] = useState<TeacherTransferRequest[]>(
    []
  );
  const [receivedInterests, setReceivedInterests] = useState<
    TeacherTransferRequest[]
  >([]);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("create");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMatch, setSelectedMatch] =
    useState<TeacherTransferMatch | null>(null);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [myRequests, matchesData, sent, received] = await Promise.all([
        teacherTransferApi.getMyRequests(),
        teacherTransferApi.findMatches(),
        teacherTransferApi.getMyRequests(), // Sent interests
        teacherTransferApi.getReceivedRequests(), // Received interests
      ]);

      const activeRequest = Array.isArray(myRequests)
        ? myRequests.find(
            (r: TeacherTransferRequest) =>
              r.status !== "CANCELLED" && r.status !== "COMPLETED"
          )
        : null;

      setMyRequest(activeRequest || null);
      setMatches(Array.isArray(matchesData) ? matchesData : []);
      setSentInterests(Array.isArray(sent) ? sent : []);
      setReceivedInterests(Array.isArray(received) ? received : []);

      // Determine current step
      if (!activeRequest) {
        setCurrentStep("create");
      } else if (activeRequest.status === "PENDING") {
        setCurrentStep("search");
      } else if (activeRequest.status === "VERIFIED") {
        setCurrentStep("search");
      } else if (activeRequest.status === "MATCHED") {
        setCurrentStep("interests");
      } else if (activeRequest.status === "ACCEPTED") {
        setCurrentStep("chat");
      } else if (activeRequest.status === "COMPLETED") {
        setCurrentStep("complete");
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInterest = async () => {
    if (!selectedMatch) return;

    try {
      await teacherTransferApi.acceptTransfer(selectedMatch.id, {
        notes: interestMessage || "I'm interested in this transfer",
      });
      toast.success("Interest sent successfully!");
      setShowInterestModal(false);
      setInterestMessage("");
      await fetchData();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleAcceptInterest = async (requestId: string) => {
    try {
      await teacherTransferApi.acceptTransfer(requestId, {
        notes: "Interest accepted",
      });
      toast.success("Interest accepted! You can now chat with this teacher.");
      await fetchData();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleRejectInterest = async (requestId: string) => {
    try {
      await teacherTransferApi.cancel(requestId);
      toast.success("Interest declined");
      await fetchData();
    } catch (error) {
      handleApiError(error);
    }
  };

  const getWorkflowProgress = (): number => {
    const steps: WorkflowStep[] = [
      "create",
      "search",
      "interests",
      "chat",
      "complete",
    ];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const getStatusBadge = (status: TransferRequestStatus) => {
    const config = {
      PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      VERIFIED: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      MATCHED: { color: "bg-purple-100 text-purple-800", icon: Users },
      ACCEPTED: { color: "bg-green-100 text-green-800", icon: CheckCheck },
      COMPLETED: { color: "bg-emerald-100 text-emerald-800", icon: TrendingUp },
      CANCELLED: { color: "bg-gray-100 text-gray-800", icon: X },
    };
    const { color, icon: Icon } =
      config[status as keyof typeof config] || config.PENDING;
    return (
      <Badge className={cn(color, "flex items-center gap-1")}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header with Workflow Guide */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Mutual Transfer Portal
          </h1>
          <p className="text-gray-600 mt-1">
            Find compatible transfer partners and coordinate your swap
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowGuideModal(true)}>
            <Info className="h-4 w-4 mr-2" />
            How It Works
          </Button>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Workflow Progress */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Your Transfer Journey</h3>
            <span className="text-sm text-gray-600">
              {Math.round(getWorkflowProgress())}% Complete
            </span>
          </div>
          <Progress value={getWorkflowProgress()} className="h-2" />
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { step: "create", icon: Plus, label: "Create Request" },
              { step: "search", icon: Search, label: "Find Matches" },
              { step: "interests", icon: Send, label: "Send Interests" },
              { step: "chat", icon: MessageCircle, label: "Communicate" },
              { step: "complete", icon: CheckCircle, label: "Complete" },
            ].map(({ step, icon: Icon, label }) => (
              <div
                key={step}
                className={cn(
                  "flex flex-col items-center gap-2 p-2 rounded-lg transition-all",
                  currentStep === step
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-500"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      {myRequest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Compatible Matches</p>
                <p className="text-2xl font-bold">{matches.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Send className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Interests Sent</p>
                <p className="text-2xl font-bold">{sentInterests.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Interests Received</p>
                <p className="text-2xl font-bold">{receivedInterests.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Request Status</p>
                {getStatusBadge(myRequest.status)}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="my-request">My Request</TabsTrigger>
          <TabsTrigger value="matches">
            Find Matches ({matches.length})
          </TabsTrigger>
          <TabsTrigger value="interests">
            Interests ({receivedInterests.length})
          </TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Current Status Card */}
          {myRequest ? (
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Your Active Transfer Request
                  </h3>
                  <p className="text-gray-600">
                    Reference ID: {myRequest.uniqueId}
                  </p>
                </div>
                {getStatusBadge(myRequest.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Zone</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">{myRequest.fromZone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Desired Zones</p>
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">
                      {myRequest.toZones?.join(", ")}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Subject</p>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">{myRequest.subject}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Medium / Level</p>
                  <p className="font-medium">
                    {myRequest.medium} / {myRequest.level}
                  </p>
                </div>
              </div>

              {/* Status-specific guidance */}
              {myRequest.status === "PENDING" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-1">
                        Pending Admin Verification
                      </h4>
                      <p className="text-sm text-yellow-800">
                        Your request is under review. Once verified, you can
                        search for compatible matches and send interests.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {myRequest.status === "VERIFIED" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-1">
                        Ready to Find Matches!
                      </h4>
                      <p className="text-sm text-blue-800 mb-3">
                        Your request has been verified. Browse compatible
                        teachers and send interests to start the conversation.
                      </p>
                      <Button
                        onClick={() =>
                          document
                            .querySelector('[value="matches"]')
                            ?.dispatchEvent(new MouseEvent("click"))
                        }
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Find Matches Now
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {myRequest.status === "MATCHED" && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-900 mb-1">
                        Interests Received!
                      </h4>
                      <p className="text-sm text-purple-800">
                        Teachers are interested in your transfer request. Review
                        and accept compatible partners to unlock chat.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {myRequest.status === "ACCEPTED" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCheck className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 mb-1">
                        Match Accepted - Coordinate Your Transfer
                      </h4>
                      <p className="text-sm text-green-800 mb-3">
                        You have active chat connections. Use the Messages tab
                        to finalize logistics with your transfer partners.
                      </p>
                      <Button
                        onClick={() =>
                          document
                            .querySelector('[value="messages"]')
                            ?.dispatchEvent(new MouseEvent("click"))
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Go to Messages
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {myRequest.status === "COMPLETED" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-emerald-900 mb-1">
                        Transfer Completed!
                      </h4>
                      <p className="text-sm text-emerald-800">
                        Congratulations! Your mutual transfer has been
                        officially completed by the admin.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            // No active request - create one
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Plus className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  Start Your Transfer Journey
                </h3>
                <p className="text-gray-600 mb-6">
                  Create a transfer request to find compatible swap partners in
                  your desired zone.
                </p>
                <Button
                  size="lg"
                  onClick={() => router.push("/teacher/transfers/register")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Transfer Request
                </Button>
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          {myRequest && myRequest.status === "VERIFIED" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Browse Matches</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      View {matches.length} compatible teachers
                    </p>
                    <Button size="sm" variant="outline">
                      View Matches <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Received Interests</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {receivedInterests.length} teacher(s) interested
                    </p>
                    <Button size="sm" variant="outline">
                      Review <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Messages</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Chat with matched teachers
                    </p>
                    <Button size="sm" variant="outline">
                      Open Chats <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* My Request Tab */}
        <TabsContent value="my-request">
          {myRequest ? (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6">
                Transfer Request Details
              </h3>
              {/* Detailed view of current request */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Unique ID</p>
                    <p className="font-medium">{myRequest.uniqueId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Status</p>
                    {getStatusBadge(myRequest.status)}
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Current School</p>
                    <p className="font-medium">{myRequest.currentSchool}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Current District</p>
                    <p className="font-medium">{myRequest.currentDistrict}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">From Zone</p>
                    <p className="font-medium">{myRequest.fromZone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Desired Zones</p>
                    <p className="font-medium">
                      {myRequest.toZones?.join(", ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Subject</p>
                    <p className="font-medium">{myRequest.subject}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Medium</p>
                    <p className="font-medium">{myRequest.medium}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Level</p>
                    <p className="font-medium">{myRequest.level}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Created</p>
                    <p className="font-medium">
                      {new Date(myRequest.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {myRequest.notes && (
                  <div>
                    <p className="text-gray-600 mb-2">Notes</p>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
                      {myRequest.notes}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(`/teacher/transfers/edit/${myRequest.id}`)
                    }
                  >
                    Edit Request
                  </Button>
                  {myRequest.status !== "COMPLETED" && (
                    <Button variant="destructive">Cancel Request</Button>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                You don't have an active transfer request
              </p>
              <Button
                onClick={() => router.push("/teacher/transfers/register")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Request
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="space-y-4">
          {matches.length > 0 ? (
            matches.map((match) => (
              <Card
                key={match.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg">
                            {match.requester?.firstName}{" "}
                            {match.requester?.lastName}
                          </h4>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            {match.matchScore}% Match
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {match.currentSchool}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-600">From Zone</p>
                        <p className="font-medium">{match.fromZone}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Desired Zones</p>
                        <p className="font-medium">
                          {match.toZones?.join(", ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Subject</p>
                        <p className="font-medium">{match.subject}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      onClick={() => {
                        setSelectedMatch(match);
                        setShowDetailModal(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedMatch(match);
                        setShowInterestModal(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Interest
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No compatible matches found at this time
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Check back later or adjust your desired zones
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Interests Tab */}
        <TabsContent value="interests" className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Received Interests</h3>
          {receivedInterests.length > 0 ? (
            receivedInterests.map((interest) => (
              <Card
                key={interest.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-full">
                        <MessageCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">
                          Teacher from {interest.fromZone}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Interested in swapping to{" "}
                          {interest.toZones?.join(", ")}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Subject</p>
                        <p className="font-medium">{interest.subject}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Medium</p>
                        <p className="font-medium">{interest.medium}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Level</p>
                        <p className="font-medium">{interest.level}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      onClick={() => handleAcceptInterest(interest.id)}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleRejectInterest(interest.id)}
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No interests received yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Teachers will appear here when they show interest in your
                request
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card className="p-12 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Chat feature coming soon!</p>
            <p className="text-sm text-gray-500">
              Accept interests to unlock peer-to-peer messaging
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {/* Match Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transfer Match Details</DialogTitle>
            <DialogDescription>
              Detailed information about this transfer opportunity
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Teacher Name</p>
                  <p className="font-medium">
                    {selectedMatch.requester?.firstName}{" "}
                    {selectedMatch.requester?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Match Score</p>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    {selectedMatch.matchScore}%
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-600">Current School</p>
                  <p className="font-medium">{selectedMatch.currentSchool}</p>
                </div>
                <div>
                  <p className="text-gray-600">School Type</p>
                  <p className="font-medium">
                    {selectedMatch.currentSchoolType || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">From Zone</p>
                  <p className="font-medium">{selectedMatch.fromZone}</p>
                </div>
                <div>
                  <p className="text-gray-600">To Zones</p>
                  <p className="font-medium">
                    {selectedMatch.toZones?.join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Subject</p>
                  <p className="font-medium">{selectedMatch.subject}</p>
                </div>
                <div>
                  <p className="text-gray-600">Medium / Level</p>
                  <p className="font-medium">
                    {selectedMatch.medium} / {selectedMatch.level}
                  </p>
                </div>
                {selectedMatch.yearsOfService && (
                  <div>
                    <p className="text-gray-600">Years of Service</p>
                    <p className="font-medium">
                      {selectedMatch.yearsOfService} years
                    </p>
                  </div>
                )}
              </div>

              {selectedMatch.qualifications &&
                selectedMatch.qualifications.length > 0 && (
                  <div>
                    <p className="text-gray-600 mb-2">Qualifications</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMatch.qualifications.map((qual, idx) => (
                        <Badge key={idx} variant="secondary">
                          {qual}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowDetailModal(false);
                setShowInterestModal(true);
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Interest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Interest Modal */}
      <Dialog open={showInterestModal} onOpenChange={setShowInterestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Interest</DialogTitle>
            <DialogDescription>
              Express your interest in this transfer opportunity
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Introduction Message (Optional)
              </label>
              <textarea
                value={interestMessage}
                onChange={(e) => setInterestMessage(e.target.value)}
                placeholder="Introduce yourself and explain why this transfer works for both parties..."
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {interestMessage.length}/500 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInterestModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendInterest}>
              <Send className="h-4 w-4 mr-2" />
              Send Interest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* How It Works Modal */}
      <Dialog open={showGuideModal} onOpenChange={setShowGuideModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How Mutual Transfer Works</DialogTitle>
            <DialogDescription>
              Step-by-step guide to finding your perfect transfer match
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {[
              {
                step: 1,
                icon: Plus,
                title: "Create Your Request",
                description:
                  "Submit your transfer request with current location and desired zones. Admin will verify it within 24-48 hours.",
              },
              {
                step: 2,
                icon: Search,
                title: "Find Compatible Matches",
                description:
                  "Browse teachers looking for swaps that match your criteria. Our system scores compatibility based on zones, subjects, and preferences.",
              },
              {
                step: 3,
                icon: Send,
                title: "Send & Receive Interests",
                description:
                  "Express interest in compatible matches. Review interests received on your request and accept those that work best.",
              },
              {
                step: 4,
                icon: MessageCircle,
                title: "Communicate Details",
                description:
                  "Once both parties accept, unlock peer-to-peer chat to finalize logistics, share documents, and coordinate the swap.",
              },
              {
                step: 5,
                icon: CheckCircle,
                title: "Complete Transfer",
                description:
                  "After coordinating details, admin will officially complete your transfer and update both teachers' records.",
              },
            ].map(({ step, icon: Icon, title, description }) => (
              <div key={step} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {step}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">{title}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowGuideModal(false)}>Got It!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
