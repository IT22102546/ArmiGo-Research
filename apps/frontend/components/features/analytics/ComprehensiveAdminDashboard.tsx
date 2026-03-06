"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import {
  Users,
  Activity,
  Loader2,
  RefreshCw,
  Calendar,
  Stethoscope,
  Building2,
  CheckCircle,
  ClipboardList,
  Plus,
  UserPlus,
  CalendarPlus,
  UserCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  BarChart3,
  MapPin,
  BadgeCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  patientApi,
  PatientStats,
  AdmissionTracking,
  Physiotherapist,
  Hospital as HospitalType,
} from "@/lib/api/endpoints/patients";

interface DashboardData {
  patientStats: PatientStats | null;
  recentPatients: {
    id: string;
    firstName: string;
    lastName: string;
    diagnosis?: string;
    isActive: boolean;
    enrolledAt: string;
  }[];
  todaySessions: AdmissionTracking[];
  upcomingSessions: AdmissionTracking[];
  physiotherapists: Physiotherapist[];
  hospitals: HospitalType[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  SCHEDULED: {
    label: "Scheduled",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
  FINISHED: {
    label: "Finished",
    color: "text-gray-600",
    bg: "bg-gray-50 border-gray-200",
  },
  ATTENDED_COMPLETE: {
    label: "Completed",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  ABSENT_INCOMPLETE: {
    label: "Absent",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-600",
    bg: "bg-red-50 border-red-100",
  },
  DISCHARGED: {
    label: "Discharged",
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
  },
};

function SessionStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: "text-gray-600",
    bg: "",
  };
  return (
    <Badge variant="outline" className={`text-xs ${cfg.color}`}>
      {cfg.label}
    </Badge>
  );
}

function StatCard({
  icon: Icon,
  iconClass,
  title,
  value,
  sub,
  trend,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  value: number | string;
  sub?: string;
  trend?: { value: number; label: string };
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Icon className={`h-4 w-4 ${iconClass}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        {trend && (
          <div
            className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              trend.value >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {trend.value >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value >= 0 ? "+" : ""}
            {trend.value} {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ComprehensiveAdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData>({
    patientStats: null,
    recentPatients: [],
    todaySessions: [],
    upcomingSessions: [],
    physiotherapists: [],
    hospitals: [],
  });

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  // Client-only date label to avoid hydration mismatch
  const [dateLabel, setDateLabel] = useState("");
  useEffect(() => {
    setDateLabel(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const [statsRes, patientsRes, sessionsRes, physioRes] =
        await Promise.allSettled([
          patientApi.getPatientStats(),
          patientApi.getAllPatients({ page: 1, limit: 5 }),
          patientApi.getAdmissionTrackings(),
          patientApi.getPhysiotherapists(),
        ]);

      // ApiClient already unwraps { success, data } — value IS the payload directly
      const patientStats: PatientStats | null =
        statsRes.status === "fulfilled"
          ? ((statsRes.value as any) ?? null)
          : null;

      const recentPatients: any[] =
        patientsRes.status === "fulfilled"
          ? Array.isArray(patientsRes.value)
            ? (patientsRes.value as any)
            : ((patientsRes.value as any)?.data ?? [])
          : [];

      const allSessions: AdmissionTracking[] =
        sessionsRes.status === "fulfilled"
          ? Array.isArray(sessionsRes.value)
            ? (sessionsRes.value as any)
            : ((sessionsRes.value as any)?.data ?? [])
          : [];

      const physiotherapists: Physiotherapist[] =
        physioRes.status === "fulfilled"
          ? Array.isArray(physioRes.value)
            ? (physioRes.value as any)
            : ((physioRes.value as any)?.data ?? [])
          : [];

      const todaySessions = allSessions.filter((s) => {
        const d = new Date(s.admissionDate).toISOString().split("T")[0];
        return d === today;
      });

      const upcomingSessions = allSessions
        .filter((s) => {
          const d = new Date(s.admissionDate).toISOString().split("T")[0];
          return d > today && s.status === "SCHEDULED";
        })
        .slice(0, 6);

      let hospitals: HospitalType[] = [];
      if (isSuperAdmin) {
        const hospitalsRaw = await patientApi.getHospitals().catch(() => null);
        hospitals = Array.isArray(hospitalsRaw)
          ? (hospitalsRaw as any)
          : ((hospitalsRaw as any)?.data ?? []);
      }

      setData({
        patientStats,
        recentPatients,
        todaySessions,
        upcomingSessions,
        physiotherapists,
        hospitals,
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      toast.error("Failed to load some dashboard data");
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    setLoading(true);
    fetchDashboard().finally(() => setLoading(false));
  }, [fetchDashboard]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading dashboard…</span>
      </div>
    );
  }

  const {
    patientStats,
    recentPatients,
    todaySessions,
    upcomingSessions,
    physiotherapists,
    hospitals,
  } = data;

  const availablePhysios = physiotherapists.filter(
    (p) => p.availabilityStatus === "AVAILABLE" || !p.availabilityStatus
  );
  const busyPhysios = physiotherapists.filter(
    (p) => p.availabilityStatus === "IN_WORK"
  );

  const topDiagnoses = patientStats?.byDiagnosis
    ? Object.entries(patientStats.byDiagnosis)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    : [];

  const genderEntries = patientStats?.byGender
    ? Object.entries(patientStats.byGender)
    : [];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {isSuperAdmin ? "System Dashboard" : "Hospital Dashboard"}
            </h1>
            <p className="text-blue-100 mt-1 text-sm">
              Welcome back, {user?.firstName} {user?.lastName}
              {dateLabel ? ` · ${dateLabel}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="secondary"
              size="sm"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
            <Badge variant="secondary" className="text-xs px-3 py-1.5">
              {isSuperAdmin ? "Super Admin" : "Hospital Admin"}
            </Badge>
          </div>
        </div>
      </div>

      {/* ── Key Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          iconClass="text-blue-600"
          title="Total Patients"
          value={patientStats?.totalPatients ?? 0}
          sub={`Active: ${patientStats?.activePatients ?? 0}  ·  Inactive: ${
            patientStats?.inactivePatients ?? 0
          }`}
          trend={{
            value: patientStats?.newPatientsThisWeek ?? 0,
            label: "new this week",
          }}
        />
        <StatCard
          icon={UserCheck}
          iconClass="text-green-600"
          title="Active Patients"
          value={patientStats?.activePatients ?? 0}
          sub={`Avg age: ${patientStats?.averageAge ?? 0} yrs`}
        />
        <StatCard
          icon={Stethoscope}
          iconClass="text-purple-600"
          title="Physiotherapists"
          value={physiotherapists.length}
          sub={`Available: ${availablePhysios.length}  ·  In session: ${busyPhysios.length}`}
        />
        <StatCard
          icon={Calendar}
          iconClass="text-orange-600"
          title="Sessions Today"
          value={todaySessions.length}
          sub={`Upcoming (next days): ${upcomingSessions.length}`}
        />
      </div>

      {/* ── Secondary Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={TrendingUp}
          iconClass="text-emerald-600"
          title="New This Month"
          value={patientStats?.newPatientsThisMonth ?? 0}
          sub="Patient registrations in the last 30 days"
        />
        <StatCard
          icon={BarChart3}
          iconClass="text-sky-600"
          title="Completed Sessions Today"
          value={
            todaySessions.filter((s) =>
              ["ATTENDED_COMPLETE", "FINISHED"].includes(s.status)
            ).length
          }
          sub={`Absent / incomplete: ${
            todaySessions.filter((s) => s.status === "ABSENT_INCOMPLETE").length
          }`}
        />
        {isSuperAdmin ? (
          <StatCard
            icon={Building2}
            iconClass="text-indigo-600"
            title="Total Hospitals"
            value={hospitals.length}
            sub={`Active: ${
              hospitals.filter((h) => h.status === "ACTIVE").length
            }`}
          />
        ) : (
          <StatCard
            icon={ClipboardList}
            iconClass="text-teal-600"
            title="Diagnoses Tracked"
            value={Object.keys(patientStats?.byDiagnosis ?? {}).length}
            sub="Unique diagnoses in your hospital"
          />
        )}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Sessions */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                {"Today's Sessions"}
                <Badge variant="outline" className="ml-auto">
                  {todaySessions.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaySessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Calendar className="h-10 w-10 mb-3 opacity-30" />
                  <p>No sessions scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {todaySessions.map((session) => {
                    const cfg = STATUS_CONFIG[session.status] ?? {
                      label: session.status,
                      color: "text-gray-600",
                      bg: "bg-gray-50 border-gray-200",
                    };
                    return (
                      <div
                        key={session.id}
                        className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${cfg.bg}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="text-xs font-mono font-semibold w-12 text-center shrink-0">
                            {session.startTime ?? "—"}
                          </div>
                          <div className="h-8 w-px bg-gray-300 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">
                              {session.child
                                ? `${session.child.firstName} ${session.child.lastName}`
                                : "—"}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {session.physiotherapist?.name ?? "Unassigned"} &middot;{" "}
                              {session.admissionType}
                            </div>
                          </div>
                        </div>
                        <SessionStatusBadge status={session.status} />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Physiotherapist Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-purple-600" />
              Physiotherapists
            </CardTitle>
          </CardHeader>
          <CardContent>
            {physiotherapists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No physiotherapists found
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {physiotherapists.map((p) => {
                  const status = p.availabilityStatus ?? "AVAILABLE";
                  const isAvail = status === "AVAILABLE";
                  const isBusy = status === "IN_WORK";
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {p.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.specialization ?? p.role}
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                        {isAvail && (
                          <Badge
                            className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs"
                            variant="outline"
                          >
                            <BadgeCheck className="h-3 w-3 mr-1" />
                            Available
                          </Badge>
                        )}
                        {isBusy && (
                          <Badge
                            className="bg-orange-100 text-orange-700 border-orange-200 text-xs"
                            variant="outline"
                          >
                            <Activity className="h-3 w-3 mr-1" />
                            In Session
                          </Badge>
                        )}
                        {!isAvail && !isBusy && (
                          <Badge
                            className="bg-red-100 text-red-700 border-red-200 text-xs"
                            variant="outline"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Unavailable
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patients */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Recent Patients
                <Badge variant="outline" className="ml-auto">
                  {recentPatients.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No patients registered yet
                </div>
              ) : (
                <div className="space-y-2">
                  {recentPatients.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          {p.firstName} {p.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.diagnosis ?? "No diagnosis"} &middot;{" "}
                          {new Date(p.enrolledAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge
                        variant={p.isActive ? "default" : "secondary"}
                        className="ml-2 shrink-0 text-xs"
                      >
                        {p.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Diagnosis Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-teal-600" />
              Top Diagnoses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topDiagnoses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No data yet
              </div>
            ) : (
              <div className="space-y-3">
                {topDiagnoses.map(([label, count]) => {
                  const total = patientStats?.totalPatients ?? 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium truncate max-w-[70%]">
                          {label}
                        </span>
                        <span className="text-muted-foreground">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {genderEntries.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <div className="text-xs font-semibold text-muted-foreground mb-2">
                      By Gender
                    </div>
                    {genderEntries.map(([g, c]) => (
                      <div key={g} className="flex justify-between text-xs">
                        <span className="capitalize">{g.toLowerCase()}</span>
                        <span className="font-medium">{c}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Upcoming Sessions ── */}
      {upcomingSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Upcoming Scheduled Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3 border rounded-lg bg-blue-50 border-blue-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-semibold text-blue-700">
                      {new Date(session.admissionDate).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {session.startTime} &ndash; {session.endTime}
                    </span>
                  </div>
                  <div className="font-medium text-sm">
                    {session.child
                      ? `${session.child.firstName} ${session.child.lastName}`
                      : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {session.physiotherapist?.name ?? "Unassigned"} &middot;{" "}
                    {session.admissionType}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Hospitals Overview (Super Admin only) ── */}
      {isSuperAdmin && hospitals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Hospitals Overview
              <Badge variant="outline" className="ml-auto">
                {hospitals.length} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {hospitals.map((h) => (
                <div
                  key={h.id}
                  className={`p-3 rounded-lg border ${
                    h.status === "ACTIVE"
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">
                        {h.name}
                      </div>
                      {h.city && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {h.city}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${
                        h.status === "ACTIVE"
                          ? "text-emerald-700"
                          : "text-red-600"
                      }`}
                    >
                      {h.status === "ACTIVE" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      )}
                      {h.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Quick Actions ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Button
              onClick={() => router.push("/admin/children")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <UserPlus className="h-5 w-5 text-blue-600" />
              <span className="text-xs">Add Children</span>
            </Button>
            <Button
              onClick={() => router.push("/admin/physiotherapists")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Stethoscope className="h-5 w-5 text-purple-600" />
              <span className="text-xs">Add Physiotherapist</span>
            </Button>
            <Button
              onClick={() => router.push("/admin/timetable")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <CalendarPlus className="h-5 w-5 text-green-600" />
              <span className="text-xs">Schedule Session</span>
            </Button>
            <Button
              onClick={() => router.push("/admin/children")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <ClipboardList className="h-5 w-5 text-orange-600" />
              <span className="text-xs">View Children</span>
            </Button>
            {isSuperAdmin && (
              <Button
                onClick={() => router.push("/admin/hospitals")}
                variant="outline"
                className="h-20 flex-col gap-2"
              >
              <Building2 className="h-5 w-5 text-indigo-600" />
                <span className="text-xs">Manage Hospitals</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
