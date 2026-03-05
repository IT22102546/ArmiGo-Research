"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Building2,
  CalendarClock,
  CalendarOff,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
  Search,
  Stethoscope,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ApiClient } from "@/lib/api/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type AvailabilityStatus = "AVAILABLE" | "IN_WORK" | "NOT_AVAILABLE";

interface Hospital {
  id: string;
  name: string;
}

interface UnavailableDate {
  id: string;
  date: string;
  reason?: string | null;
}

interface Physio {
  id: string;
  name: string;
  role: string;
  specialization?: string;
  phone: string;
  email?: string;
  isActive: boolean;
  hospitalId: string;
  availabilityStatus?: string | null;
  availabilityNote?: string | null;
  availabilityUpdatedAt?: string | null;
  hospital?: Hospital;
  unavailableDates?: UnavailableDate[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AvailabilityStatus,
  {
    label: string;
    textColor: string;
    bgColor: string;
    borderColor: string;
    activeBg: string;
    icon: React.ElementType;
  }
> = {
  AVAILABLE: {
    label: "Available",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    activeBg: "bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white",
    icon: CheckCircle2,
  },
  IN_WORK: {
    label: "In Work",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    activeBg: "bg-blue-600 hover:bg-blue-700 border-blue-600 text-white",
    icon: Activity,
  },
  NOT_AVAILABLE: {
    label: "Not Available",
    textColor: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    activeBg: "bg-rose-600 hover:bg-rose-700 border-rose-600 text-white",
    icon: XCircle,
  },
};

function resolveStatus(raw?: string | null): AvailabilityStatus {
  if (raw === "IN_WORK" || raw === "NOT_AVAILABLE") return raw;
  return "AVAILABLE";
}

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return "Never updated today";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Physio Card ──────────────────────────────────────────────────────────────

function PhysioCard({
  physio,
  isHospitalScoped,
  onStatusChange,
  statusPending,
}: {
  physio: Physio;
  isHospitalScoped: boolean;
  onStatusChange: (id: string, status: AvailabilityStatus) => void;
  statusPending: boolean;
}) {
  const queryClient = useQueryClient();
  const [showSchedule, setShowSchedule] = useState(false);
  const [addingDate, setAddingDate] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);

  const status = resolveStatus(physio.availabilityStatus);
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;
  const upcomingDates = physio.unavailableDates ?? [];

  // Today in YYYY-MM-DD for min date
  const todayStr = new Date().toISOString().split("T")[0];

  const addDateMutation = useMutation({
    mutationFn: () =>
      ApiClient.post<any>(`/patients/locations/physiotherapists/${physio.id}/unavailable-dates`, {
        date: newDate,
        reason: newReason.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["physio-avail", "list"] });
      toast.success(`Scheduled off: ${formatDate(newDate)}`);
      setNewDate("");
      setNewReason("");
      setAddingDate(false);
    },
    onError: (err: any) => toast.error(err?.message || "Failed to add date"),
  });

  const removeDateMutation = useMutation({
    mutationFn: (dateId: string) =>
      ApiClient.delete<any>(
        `/patients/locations/physiotherapists/${physio.id}/unavailable-dates/${dateId}`
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["physio-avail", "list"] });
      toast.success("Removed scheduled off day");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to remove date"),
  });

  return (
    <Card className={`border transition-all ${cfg.borderColor} ${cfg.bgColor}`}>
      {/* Card header */}
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0 rounded-full bg-white border shadow-sm p-1.5">
              <Stethoscope className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base leading-tight truncate">{physio.name}</CardTitle>
              {physio.specialization && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {physio.specialization}
                </p>
              )}
            </div>
          </div>
          <Badge
            className={`shrink-0 gap-1 text-xs ${cfg.textColor} ${cfg.bgColor} border ${cfg.borderColor}`}
            variant="outline"
          >
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* Hospital */}
        {!isHospitalScoped && physio.hospital && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{physio.hospital.name}</span>
          </div>
        )}

        {/* Last updated */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {physio.availabilityUpdatedAt
            ? `Updated ${timeAgo(physio.availabilityUpdatedAt)}`
            : "Never updated today"}
        </div>

        {/* Status buttons */}
        <div className="flex gap-1.5">
          {(["AVAILABLE", "IN_WORK", "NOT_AVAILABLE"] as AvailabilityStatus[]).map((s) => {
            const c = STATUS_CONFIG[s];
            const BtnIcon = c.icon;
            const isActive = status === s;
            return (
              <Button
                key={s}
                size="sm"
                variant={isActive ? "default" : "outline"}
                disabled={statusPending}
                className={`flex-1 gap-1 text-xs h-8 ${isActive ? c.activeBg : ""}`}
                onClick={() => !isActive && onStatusChange(physio.id, s)}
              >
                <BtnIcon className="h-3 w-3 shrink-0" />
                <span className="hidden sm:inline">{c.label}</span>
                <span className="sm:hidden">
                  {s === "AVAILABLE" ? "Avail" : s === "IN_WORK" ? "Work" : "Off"}
                </span>
              </Button>
            );
          })}
        </div>

        <Separator className="opacity-50" />

        {/* Scheduled off section */}
        <button
          className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowSchedule((v) => !v)}
        >
          <span className="flex items-center gap-1.5">
            <CalendarOff className="h-3.5 w-3.5" />
            Scheduled Off Days
            {upcomingDates.length > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                {upcomingDates.length}
              </Badge>
            )}
          </span>
          {showSchedule ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showSchedule && (
          <div className="space-y-2 pt-0.5">
            {/* Existing dates */}
            {upcomingDates.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No upcoming off days scheduled</p>
            ) : (
              <div className="space-y-1.5">
                {upcomingDates.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between bg-white/70 rounded-md px-2.5 py-1.5 text-xs border border-rose-100"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-rose-700">{formatDate(d.date)}</span>
                      {d.reason && (
                        <span className="ml-1.5 text-muted-foreground truncate">— {d.reason}</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 text-muted-foreground hover:text-rose-600"
                      disabled={removeDateMutation.isPending}
                      onClick={() => removeDateMutation.mutate(d.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add date form */}
            {addingDate ? (
              <div className="space-y-2 pt-1 bg-white/60 rounded-lg p-2.5 border border-dashed border-rose-200">
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    ref={dateInputRef}
                    type="date"
                    min={todayStr}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Reason (optional)</Label>
                  <Input
                    placeholder="e.g. Training, Leave..."
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    disabled={!newDate || addDateMutation.isPending}
                    onClick={() => addDateMutation.mutate()}
                  >
                    {addDateMutation.isPending ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      setAddingDate(false);
                      setNewDate("");
                      setNewReason("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs gap-1.5 border-dashed"
                onClick={() => {
                  setAddingDate(true);
                  setTimeout(() => dateInputRef.current?.focus(), 50);
                }}
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                Add Off Day
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PhysioAvailabilityPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userRoles = Array.isArray((user as any)?.roles)
    ? ((user as any).roles as string[])
    : ([user?.role].filter(Boolean) as string[]);
  const isHospitalScoped =
    userRoles.includes("HOSPITAL_ADMIN") && user?.email !== "armigo@gmail.com";

  const [hospitalFilter, setHospitalFilter] = useState("all");
  const [search, setSearch] = useState("");

  // ─── Hospitals ────────────────────────────────────────────────────────────

  const { data: hospitals = [] } = useQuery<Hospital[]>({
    queryKey: ["physio-avail", "hospitals"],
    queryFn: async () => {
      const resp = await ApiClient.get<any>("/patients/locations/hospitals");
      const d = resp?.data ?? resp ?? {};
      const list = d.data || d || [];
      return Array.isArray(list) ? list : [];
    },
    enabled: !isHospitalScoped,
  });

  // ─── Physio list ──────────────────────────────────────────────────────────

  const queryHospitalId =
    isHospitalScoped ? undefined : hospitalFilter === "all" ? undefined : hospitalFilter;

  const { data: physios = [], isLoading, refetch } = useQuery<Physio[]>({
    queryKey: ["physio-avail", "list", queryHospitalId],
    queryFn: async () => {
      const params: Record<string, string> = { includeInactive: "false" };
      if (queryHospitalId) params.hospitalId = queryHospitalId;
      const resp = await ApiClient.get<any>("/patients/locations/physiotherapists", { params });
      const d = resp?.data ?? resp ?? {};
      const list = d.data || d || [];
      return Array.isArray(list) ? list : [];
    },
    refetchInterval: 30_000,
  });

  // Auto-refetch on window focus
  useEffect(() => {
    const onFocus = () => refetch();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refetch]);

  // ─── Status mutation (optimistic) ─────────────────────────────────────────

  const [pendingId, setPendingId] = useState<string | null>(null);

  const availMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AvailabilityStatus }) =>
      ApiClient.put<any>(`/patients/locations/physiotherapists/${id}/availability`, { status }),
    onMutate: ({ id }) => setPendingId(id),
    onSuccess: async (_, vars) => {
      await queryClient.invalidateQueries({ queryKey: ["physio-avail", "list"] });
      toast.success(`${STATUS_CONFIG[vars.status].label} — updated`);
    },
    onError: (err: any) => toast.error(err?.message || "Failed to update status"),
    onSettled: () => setPendingId(null),
  });

  // ─── Filtered + stats ─────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return physios.filter((p) => {
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.specialization ?? "").toLowerCase().includes(q) ||
        (p.hospital?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [physios, search]);

  const stats = useMemo(
    () => ({
      total: filtered.length,
      available: filtered.filter((p) => resolveStatus(p.availabilityStatus) === "AVAILABLE").length,
      inWork: filtered.filter((p) => resolveStatus(p.availabilityStatus) === "IN_WORK").length,
      notAvailable: filtered.filter(
        (p) => resolveStatus(p.availabilityStatus) === "NOT_AVAILABLE"
      ).length,
    }),
    [filtered]
  );

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <CalendarClock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Physiotherapy Availability</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 self-start">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, textColor: "text-foreground", bg: "bg-muted/40" },
          { label: "Available", value: stats.available, textColor: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
          { label: "In Work", value: stats.inWork, textColor: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
          { label: "Not Available", value: stats.notAvailable, textColor: "text-rose-700", bg: "bg-rose-50 border-rose-100" },
        ].map((s) => (
          <Card key={s.label} className={`border shadow-sm ${s.bg}`}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-3xl font-bold mt-0.5 ${s.textColor}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or specialization…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {!isHospitalScoped && (
          <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
            <SelectTrigger className="w-56">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Hospitals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hospitals</SelectItem>
              {hospitals.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          Loading physiotherapists…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-medium text-lg">No physiotherapists found</p>
          <p className="text-sm text-muted-foreground">
            {search
              ? "Try adjusting your search"
              : "No physiotherapists for the selected hospital"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <PhysioCard
              key={p.id}
              physio={p}
              isHospitalScoped={isHospitalScoped}
              onStatusChange={(id, status) => availMutation.mutate({ id, status })}
              statusPending={pendingId === p.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
