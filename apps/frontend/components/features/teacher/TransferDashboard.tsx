"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  BookOpen,
  Users,
  RefreshCw,
  AlertCircle,
  FileText,
  ArrowRight,
} from "lucide-react";
import { teacherTransferApi } from "@/lib/api";
import { handleApiError } from "@/lib/error-handling";
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

export default function TransferDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch my transfer profile/requests
      const profileData = await teacherTransferApi.getMyRequests();
      setMyProfile(
        Array.isArray(profileData) && profileData.length > 0
          ? profileData[0]
          : null
      );
      setMyRequests(Array.isArray(profileData) ? profileData : []);

      // Fetch sent requests - use getAll with appropriate filtering
      const sentData = await teacherTransferApi.getAll();
      setSentRequests(Array.isArray(sentData) ? sentData : []);

      // Fetch received requests - use getAll
      const receivedData = await teacherTransferApi.getAll();
      setReceivedRequests(Array.isArray(receivedData) ? receivedData : []);

      // Fetch matches
      const matchesData = await teacherTransferApi.findMatches();
      setMatches(Array.isArray(matchesData) ? matchesData.slice(0, 5) : []);
    } catch (error) {
      handleApiError(error, "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, verified: boolean) => {
    if (!verified && status === "PENDING") {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending Verification
        </Badge>
      );
    }

    switch (status) {
      case "VERIFIED":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Verified
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge variant="default" className="gap-1 bg-blue-600">
            <CheckCircle className="h-3 w-3" />
            Accepted
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="secondary" className="gap-1">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transfer Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your mutual transfer requests and find matches
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboardData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Registration Status
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {myProfile ? (
                <>
                  <div className="text-2xl font-bold">Registered</div>
                  {getStatusBadge(myProfile.status, myProfile.verified)}
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">Not Registered</div>
                  <Button
                    size="sm"
                    onClick={() => router.push("/teacher/transfers/register")}
                  >
                    Register Now
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Requests
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                sentRequests.filter(
                  (r) => r.status !== "CANCELLED" && r.status !== "COMPLETED"
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {sentRequests.length} total sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Received Requests
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receivedRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              {receivedRequests.filter((r) => r.status === "PENDING").length}{" "}
              pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Potential Matches
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matches.length}</div>
            <Button
              size="sm"
              variant="link"
              className="p-0 h-auto"
              onClick={() => router.push("/teacher/transfers/search")}
            >
              View all matches
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Registration Profile */}
      {myProfile && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Transfer Profile</CardTitle>
                <CardDescription>
                  Registration ID: {myProfile.registrationId}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/teacher/transfers/profile")}
              >
                Edit Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Current Zone</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{myProfile.currentZone}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Desired Zones</p>
                <div className="flex flex-wrap gap-1">
                  {myProfile.toZones?.map((zone: string, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {zone}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Subject</p>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {myProfile.subject} ({myProfile.medium})
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => router.push("/teacher/transfers/search")}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Search & Matches
            </CardTitle>
            <CardDescription>
              Find teachers looking for mutual transfers
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => router.push("/teacher/transfers/requests")}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Transfer Requests
            </CardTitle>
            <CardDescription>
              View sent and received transfer requests
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() =>
            router.push(
              myProfile
                ? "/teacher/transfers/profile"
                : "/teacher/transfers/register"
            )
          }
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {myProfile ? "My Profile" : "Register"}
            </CardTitle>
            <CardDescription>
              {myProfile
                ? "Update your transfer profile"
                : "Register for mutual transfers"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Top Matches */}
      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Matches</CardTitle>
                <CardDescription>
                  Teachers with compatible transfer needs
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/teacher/transfers/search")}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matches.map((match: any) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/teacher/transfers/search?highlight=${match.id}`
                    )
                  }
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">
                        {match.teacherName || "Teacher"}
                      </p>
                      <Badge variant="outline">{match.matchScore}% match</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {match.currentZone}
                      </span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{match.desiredZones?.join(", ")}</span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {match.subject}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert if not registered */}
      {!myProfile && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <CardTitle className="text-yellow-900">
                  Registration Required
                </CardTitle>
                <CardDescription className="text-yellow-700">
                  You need to register your transfer profile before you can
                  search for matches and send requests.
                </CardDescription>
              </div>
              <Button
                onClick={() => router.push("/teacher/transfers/register")}
              >
                Register Now
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
