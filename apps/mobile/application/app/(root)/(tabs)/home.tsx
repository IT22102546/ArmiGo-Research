import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import useAuthStore from "@/stores/authStore";
import useNotificationStore from "@/stores/notificationStore";
import { apiFetch } from "@/utils/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STATUS_BAR_HEIGHT = Platform.OS === "android" ? (StatusBar.currentHeight || 36) : 44;

// ── helpers ────────────────────────────────────────────────────────────
const extractData = (payload: any) =>
  payload?.success && payload?.data ? payload.data : payload;

const formatDateSmart = (value?: string | null) => {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  const now = new Date();
  const diff = parsed.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1 && days <= 7) return `In ${days} days`;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: parsed.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

const formatTime = (start?: string | null, end?: string | null) => {
  if (!start && !end) return "";
  if (start && end) return `${start} – ${end}`;
  return start || end || "";
};

const AVAILABILITY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: "checkmark-circle" | "time" | "close-circle" }> = {
  AVAILABLE: { label: "Available", color: "#10b981", bg: "#ecfdf5", icon: "checkmark-circle" },
  IN_WORK: { label: "In Session", color: "#f59e0b", bg: "#fffbeb", icon: "time" },
  NOT_AVAILABLE: { label: "Unavailable", color: "#ef4444", bg: "#fef2f2", icon: "close-circle" },
};

const EXERCISE_CONFIG: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }[] = [
  { key: "exerciseFingers", label: "Fingers", icon: "hand-left-outline", color: "#6366F1", bg: "#eef2ff" },
  { key: "exerciseWrist", label: "Wrist", icon: "hand-right-outline", color: "#8b5cf6", bg: "#f5f3ff" },
  { key: "exerciseElbow", label: "Elbow", icon: "fitness-outline", color: "#f59e0b", bg: "#fffbeb" },
  { key: "exerciseShoulder", label: "Shoulder", icon: "body-outline", color: "#ec4899", bg: "#fdf2f8" },
];

type ChildInfo = { id: string; firstName?: string; lastName?: string };
type PhysioInfo = {
  id?: string;
  name?: string;
  specialization?: string;
  phone?: string;
  email?: string;
  availabilityStatus?: string;
  availabilityNote?: string;
  unavailableDates?: { id: string; date: string; reason?: string }[];
};
type ProgressTracker = {
  startProgress?: number;
  currentProgress?: number;
  playTimeMinutes?: number;
  fingerProgress?: number;
  wristProgress?: number;
  elbowProgress?: number;
  shoulderProgress?: number;
};
type ChildDetail = ChildInfo & {
  exerciseFingers?: boolean;
  exerciseWrist?: boolean;
  exerciseElbow?: boolean;
  exerciseShoulder?: boolean;
  playTimeMinutes?: number;
  playHours?: number;
  hospital?: { id?: string; name?: string };
  physioAssignments?: { physiotherapist?: PhysioInfo }[];
  progressTracker?: ProgressTracker;
};
type SessionItem = {
  id: string;
  admissionDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  status?: string;
  notes?: string | null;
  child?: ChildInfo;
  physiotherapist?: { name?: string; specialization?: string } | null;
  hospital?: { name?: string } | null;
};
type AssignmentItem = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  dueDate?: string | null;
  child?: ChildInfo;
  physiotherapist?: { name?: string } | null;
};

// ── component ──────────────────────────────────────────────────────────
const Home = () => {
  const { currentUser, signOut, isSignedIn } = useAuthStore();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [childName, setChildName] = useState("");
  const [childId, setChildId] = useState<string | null>(null);
  const [childDetail, setChildDetail] = useState<ChildDetail | null>(null);
  const [onlineSessions, setOnlineSessions] = useState<SessionItem[]>([]);
  const [physicalSessions, setPhysicalSessions] = useState<SessionItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const childDetailFetched = useRef(false);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  // resolve child id ────────────────────────────────────────────────────
  const resolveChildId = useCallback(async (): Promise<string | null> => {
    const role = String((currentUser as any)?.role || "").toUpperCase();
    const isStudent = role.includes("STUDENT");
    const candidates = [
      (currentUser as any)?.childId,
      (currentUser as any)?.child?.id,
      (currentUser as any)?.profile?.childId,
      (currentUser as any)?.studentProfile?.childId,
      ...(isStudent ? [(currentUser as any)?.id, (currentUser as any)?._id] : []),
    ].filter(Boolean);
    if (candidates.length) return String(candidates[0]);

    try {
      const res = await apiFetch("/api/v1/users/mobile/profile", { method: "GET" });
      if (res.ok) {
        const json = await res.json();
        const data = extractData(json);
        const first = Array.isArray(data?.children) ? data.children[0] : null;
        if (first?.id) {
          const name = `${first.firstName || ""} ${first.lastName || ""}`.trim();
          if (name) setChildName(name);
          setChildDetail(first);
          childDetailFetched.current = true;
          return String(first.id);
        }
      }
    } catch {}
    try {
      const res = await apiFetch("/api/v1/users/my-children", { method: "GET" });
      if (res.ok) {
        const json = await res.json();
        const rows: ChildDetail[] = extractData(json) || [];
        const first = Array.isArray(rows) ? rows[0] : null;
        if (first?.id) {
          const name = `${first.firstName || ""} ${first.lastName || ""}`.trim();
          if (name) setChildName(name);
          setChildDetail(first);
          childDetailFetched.current = true;
          return String(first.id);
        }
      }
    } catch {}
    return null;
  }, [currentUser]);

  // fetch all home data ────────────────────────────────────────────────
  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!isSignedIn || !currentUser) { setLoading(false); return; }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const cid = await resolveChildId();
        setChildId(cid);
        if (!cid) { setLoading(false); setRefreshing(false); return; }

        // Refresh notification count from the store
        useNotificationStore.getState().fetchUnreadCount();

        const [onlineRes, physicalRes, assignRes, childrenRes] = await Promise.all([
          apiFetch(`/api/v1/users/my-online-sessions?childId=${encodeURIComponent(cid)}`, { method: "GET" }).catch(() => null),
          apiFetch(`/api/v1/users/my-admission-trackings?childId=${encodeURIComponent(cid)}`, { method: "GET" }).catch(() => null),
          apiFetch(`/api/v1/users/my-assignments?childId=${encodeURIComponent(cid)}`, { method: "GET" }).catch(() => null),
          apiFetch("/api/v1/users/my-children", { method: "GET" }).catch(() => null),
        ]);

        if (onlineRes?.ok) {
          const json = await onlineRes.json();
          const rows: SessionItem[] = Array.isArray(extractData(json)) ? extractData(json) : [];
          const filtered = rows.filter((s) => s?.child?.id === cid);
          setOnlineSessions(filtered);
          if (!childName && filtered[0]?.child) {
            const n = `${filtered[0].child.firstName || ""} ${filtered[0].child.lastName || ""}`.trim();
            if (n) setChildName(n);
          }
        }
        if (physicalRes?.ok) {
          const json = await physicalRes.json();
          const rows: SessionItem[] = Array.isArray(extractData(json)) ? extractData(json) : [];
          setPhysicalSessions(rows.filter((s) => s?.child?.id === cid));
        }
        if (assignRes?.ok) {
          const json = await assignRes.json();
          const root = extractData(json);
          let items: AssignmentItem[] = [];
          if (Array.isArray(root)) items = root;
          else if (Array.isArray(root?.assignments)) items = root.assignments;
          else if (Array.isArray(root?.data?.assignments)) items = root.data.assignments;
          setAssignments(items);
        }
        // Populate childDetail from my-children or mobile/profile fallback
        if (childrenRes?.ok) {
          try {
            const json = await childrenRes.json();
            const rows: ChildDetail[] = extractData(json) || [];
            const match = Array.isArray(rows) ? rows.find((c) => c.id === cid) || rows[0] : null;
            if (match) { setChildDetail(match); childDetailFetched.current = true; }
          } catch {}
        }
        // Fallback: if childDetail still not set, try mobile/profile
        if (!childDetailFetched.current) {
          try {
            const profileRes = await apiFetch("/api/v1/users/mobile/profile", { method: "GET" });
            if (profileRes?.ok) {
              const json = await profileRes.json();
              const data = extractData(json);
              const children: ChildDetail[] = Array.isArray(data?.children) ? data.children : [];
              const match = children.find((c) => c.id === cid) || children[0] || null;
              if (match) {
                setChildDetail(match);
                childDetailFetched.current = true;
                if (!childName) {
                  const n = `${match.firstName || ""} ${match.lastName || ""}`.trim();
                  if (n) setChildName(n);
                }
              }
            }
          } catch {}
        }
      } catch {} finally { setLoading(false); setRefreshing(false); }
    },
    [childName, currentUser, isSignedIn, resolveChildId]
  );

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await signOut(); router.replace("/(auth)/onBoard1"); } },
    ]);
  };

  // derived data ────────────────────────────────────────────────────────
  const upcomingOnline = onlineSessions
    .filter((s) => { const st = String(s.status || "").toUpperCase(); return st === "SCHEDULED" || st === "ONGOING"; })
    .sort((a, b) => new Date(a.admissionDate || "").getTime() - new Date(b.admissionDate || "").getTime())
    .slice(0, 3);

  const upcomingPhysical = physicalSessions
    .filter((s) => { const st = String(s.status || "").toUpperCase(); return st === "SCHEDULED" || st === "ONGOING" || st === "ACTIVE"; })
    .sort((a, b) => new Date(a.admissionDate || "").getTime() - new Date(b.admissionDate || "").getTime())
    .slice(0, 3);

  const latestAssignments = [...assignments]
    .sort((a, b) => new Date(b.dueDate || "").getTime() - new Date(a.dueDate || "").getTime())
    .slice(0, 3);

  const scheduledOnline = onlineSessions.filter((s) => String(s.status || "").toUpperCase() === "SCHEDULED").length;
  const scheduledPhysical = physicalSessions.filter((s) => { const st = String(s.status || "").toUpperCase(); return st === "SCHEDULED" || st === "ACTIVE"; }).length;
  const totalSessions = onlineSessions.length + physicalSessions.length + assignments.length;

  const displayName = childName || `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() || "User";
  const initials = (childName ? childName.split(" ").map((w: string) => w[0]).join("").slice(0, 2) : "") || `${currentUser?.firstName?.[0] || ""}${currentUser?.lastName?.[0] || ""}` || "U";

  // derived – physio & exercises ──────────────────────────────────────
  const physio = childDetail?.physioAssignments?.[0]?.physiotherapist || null;
  const availConfig = physio?.availabilityStatus ? AVAILABILITY_CONFIG[physio.availabilityStatus] : null;
  const enabledExercises = EXERCISE_CONFIG.filter((e) => !!(childDetail as any)?.[e.key]);

  // ── render ──────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {loading ? (
        <View style={styles.loaderWrap}><ActivityIndicator size="large" color="#6366F1" /></View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={["#6366F1"]} tintColor="#6366F1" />}
        >

      {/* ── HEADER (now scrollable) ─────────────────────────────────── */}
      <LinearGradient colors={["#4338CA", "#6366F1", "#818CF8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.topRow}>
          <View style={styles.greetingWrap}>
            <Text style={styles.greetingText}>{greeting} 👋</Text>
            <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/(root)/(tabs)/Notifications")}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text></View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push("/(root)/(tabs)/profile")}>
              {currentUser?.profilePicture ? (
                <Image source={{ uri: currentUser.profilePicture }} style={styles.avatarImg} />
              ) : (
                <LinearGradient colors={["#a78bfa", "#7c3aed"]} style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Compact Progress + Stats in one row */}
        {enabledExercises.length > 0 ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.progressSection}
            onPress={() => router.push({ pathname: "/(root)/(screens)/exercise_progress" as any, params: { childId: childId || "" } })}
          >
            <View style={styles.progressHeader}>
              <View style={styles.progressTitleWrap}>
                <Ionicons name="analytics-outline" size={14} color="#c7d2fe" />
                <Text style={styles.progressTitle}>Progress</Text>
              </View>
              <View style={styles.viewDetailBtn}>
                <Text style={styles.viewDetailText}>Details</Text>
                <Ionicons name="chevron-forward" size={12} color="#fff" />
              </View>
            </View>
            <View style={styles.progressBarWrap}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, childDetail?.progressTracker?.currentProgress ?? 0))}%` }]} />
              </View>
              <Text style={styles.progressPercent}>{Math.round(childDetail?.progressTracker?.currentProgress ?? 0)}%</Text>
            </View>
            <View style={styles.exerciseMiniList}>
              {enabledExercises.map((ex) => {
                const progKey = ex.key === "exerciseFingers" ? "fingerProgress"
                  : ex.key === "exerciseWrist" ? "wristProgress"
                  : ex.key === "exerciseElbow" ? "elbowProgress"
                  : "shoulderProgress";
                const val = (childDetail?.progressTracker as any)?.[progKey] ?? 0;
                const brightColor = ex.key === "exerciseFingers" ? "#67e8f9"
                  : ex.key === "exerciseWrist" ? "#a78bfa"
                  : ex.key === "exerciseElbow" ? "#fbbf24"
                  : "#f9a8d4";
                return (
                  <View key={ex.key} style={styles.exerciseMiniRow}>
                    <View style={styles.exerciseMiniLeft}>
                      <View style={[styles.exerciseMiniIconWrap, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                        <Ionicons name={ex.icon as any} size={14} color={brightColor} />
                      </View>
                      <Text style={styles.exerciseMiniLabel}>{ex.label}</Text>
                    </View>
                    <View style={styles.exerciseMiniBarBg}>
                      <View style={[styles.exerciseMiniBarFill, { width: `${Math.min(100, Math.max(0, val))}%`, backgroundColor: brightColor }]} />
                    </View>
                    <Text style={[styles.exerciseMiniVal, { color: brightColor }]}>{Math.round(val)}%</Text>
                  </View>
                );
              })}
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Stats ribbon */}
        <View style={styles.statsRow}>
          {[
            { label: "Online", value: scheduledOnline, color: "#34d399" },
            { label: "Physical", value: scheduledPhysical, color: "#fbbf24" },
            { label: "Tasks", value: assignments.length, color: "#f472b6" },
            { label: "Total", value: totalSessions, color: "#60a5fa" },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── BODY ───────────────────────────────────────────────────── */}
      <View style={styles.body}>
        <View style={styles.bodyContent}>
          {/* Quick Access Grid */}
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickGrid}>
            {[
              { icon: "videocam-outline" as const, label: "Online\nSessions", color: "#6366F1", bg: "#eef2ff", route: "/(root)/(tabs)/online_sessions" },
              { icon: "fitness-outline" as const, label: "Physical\nSessions", color: "#f59e0b", bg: "#fffbeb", route: "/(root)/(tabs)/admission_tracking" },
              { icon: "document-text-outline" as const, label: "Assignments", color: "#10b981", bg: "#ecfdf5", route: "/(root)/(tabs)/assignments" },
              { icon: "people-outline" as const, label: "Physio-\ntherapists", color: "#ec4899", bg: "#fdf2f8", route: "/(root)/(tabs)/physiotherapists" },
              { icon: "book-outline" as const, label: "Publications", color: "#8b5cf6", bg: "#f5f3ff", route: "/(root)/(tabs)/publications" },
              { icon: "notifications-outline" as const, label: "Alerts", color: "#ef4444", bg: "#fef2f2", route: "/(root)/(tabs)/Notifications" },
            ].map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.quickCard} activeOpacity={0.7} onPress={() => router.push(item.route as any)}>
                <View style={[styles.quickIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Online Sessions ─────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Online Sessions</Text>
            <TouchableOpacity onPress={() => router.push("/(root)/(tabs)/online_sessions")}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          {upcomingOnline.length === 0 ? (
            <View style={styles.emptyCard}><Ionicons name="videocam-off-outline" size={28} color="#a5b4fc" /><Text style={styles.emptyText}>No upcoming online sessions</Text></View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
              {upcomingOnline.map((s) => (
                <LinearGradient key={s.id} colors={["#6366F1", "#818CF8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sessionCard}>
                  <View style={styles.sessionRow}>
                    <Ionicons name="videocam" size={16} color="#c7d2fe" />
                    <Text style={styles.sessionDate}>{formatDateSmart(s.admissionDate)}</Text>
                  </View>
                  <Text style={styles.sessionTime}>{formatTime(s.startTime, s.endTime) || "Time TBD"}</Text>
                  {s.physiotherapist?.name ? <Text style={styles.sessionPhysio}>Dr. {s.physiotherapist.name}</Text> : null}
                  <View style={styles.chipRow}>
                    <View style={styles.statusChip}><Text style={styles.statusChipText}>{s.status}</Text></View>
                  </View>
                </LinearGradient>
              ))}
            </ScrollView>
          )}

          {/* ── Physical Sessions ───────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Physical Sessions</Text>
            <TouchableOpacity onPress={() => router.push("/(root)/(tabs)/admission_tracking")}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          {upcomingPhysical.length === 0 ? (
            <View style={styles.emptyCard}><Ionicons name="walk-outline" size={28} color="#fbbf24" /><Text style={styles.emptyText}>No upcoming physical sessions</Text></View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
              {upcomingPhysical.map((s) => (
                <LinearGradient key={s.id} colors={["#f59e0b", "#fbbf24"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sessionCard}>
                  <View style={styles.sessionRow}>
                    <Ionicons name="fitness" size={16} color="#fff8e1" />
                    <Text style={[styles.sessionDate, { color: "#fff8e1" }]}>{formatDateSmart(s.admissionDate)}</Text>
                  </View>
                  <Text style={styles.sessionTime}>{formatTime(s.startTime, s.endTime) || "Time TBD"}</Text>
                  {s.physiotherapist?.name ? <Text style={[styles.sessionPhysio, { color: "#fff8e1" }]}>Dr. {s.physiotherapist.name}</Text> : null}
                  {s.hospital?.name ? <Text style={[styles.sessionPhysio, { color: "#fff8e1" }]}>{s.hospital.name}</Text> : null}
                  <View style={styles.chipRow}>
                    <View style={[styles.statusChip, { backgroundColor: "rgba(255,255,255,0.3)" }]}><Text style={styles.statusChipText}>{s.status}</Text></View>
                  </View>
                </LinearGradient>
              ))}
            </ScrollView>
          )}

          {/* ── Assignments ─────────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assignments</Text>
            <TouchableOpacity onPress={() => router.push("/(root)/(tabs)/assignments")}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          {latestAssignments.length === 0 ? (
            <View style={styles.emptyCard}><Ionicons name="document-text-outline" size={28} color="#10b981" /><Text style={styles.emptyText}>No assignments yet</Text></View>
          ) : (
            latestAssignments.map((a) => (
              <View key={a.id} style={styles.assignCard}>
                <View style={styles.assignLeft}>
                  <View style={styles.assignDot} />
                </View>
                <View style={styles.assignBody}>
                  <Text style={styles.assignTitle} numberOfLines={1}>{a.title}</Text>
                  {a.description ? <Text style={styles.assignDesc} numberOfLines={2}>{a.description}</Text> : null}
                  <View style={styles.assignMeta}>
                    <Ionicons name="calendar-outline" size={13} color="#94a3b8" />
                    <Text style={styles.assignMetaText}>Due: {formatDateSmart(a.dueDate)}</Text>
                    <View style={[styles.assignStatus, { backgroundColor: String(a.status).toUpperCase() === "ACTIVE" ? "#ecfdf5" : "#fef2f2" }]}>
                      <Text style={[styles.assignStatusText, { color: String(a.status).toUpperCase() === "ACTIVE" ? "#10b981" : "#ef4444" }]}>{a.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}

          {/* ── Physiotherapist Availability ─────────────────────────── */}
          {physio && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Physiotherapist</Text>
              </View>
              <View style={styles.physioCard}>
                <View style={styles.physioTop}>
                  <LinearGradient colors={["#6366F1", "#818CF8"]} style={styles.physioAvatar}>
                    <Ionicons name="person" size={22} color="#fff" />
                  </LinearGradient>
                  <View style={styles.physioInfo}>
                    <Text style={styles.physioName}>{physio.name || "Physiotherapist"}</Text>
                    {physio.specialization ? <Text style={styles.physioSpec}>{physio.specialization}</Text> : null}
                    {physio.phone ? (
                      <View style={styles.physioContactRow}>
                        <Ionicons name="call-outline" size={12} color="#94a3b8" />
                        <Text style={styles.physioContactText}>{physio.phone}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                {availConfig && (
                  <View style={[styles.availBadge, { backgroundColor: availConfig.bg }]}>
                    <Ionicons name={availConfig.icon} size={16} color={availConfig.color} />
                    <Text style={[styles.availText, { color: availConfig.color }]}>{availConfig.label}</Text>
                    {physio.availabilityNote ? <Text style={styles.availNote}>– {physio.availabilityNote}</Text> : null}
                  </View>
                )}
                {physio.unavailableDates && physio.unavailableDates.length > 0 && (
                  <View style={styles.unavailWrap}>
                    <Text style={styles.unavailTitle}>Upcoming Unavailable Dates</Text>
                    {physio.unavailableDates.slice(0, 3).map((ud) => (
                      <View key={ud.id} style={styles.unavailRow}>
                        <Ionicons name="calendar-outline" size={13} color="#ef4444" />
                        <Text style={styles.unavailDate}>{new Date(ud.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</Text>
                        {ud.reason ? <Text style={styles.unavailReason}>({ud.reason})</Text> : null}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}

          {/* ── Exercises ────────────────────────────────────────────── */}
          {enabledExercises.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Exercises</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: "/(root)/(screens)/exercise_progress" as any, params: { childId: childId || "" } })}>
                  <Text style={styles.seeAll}>View Progress</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.exerciseGrid}>
                {enabledExercises.map((ex) => (
                  <TouchableOpacity
                    key={ex.key}
                    style={styles.exerciseCard}
                    activeOpacity={0.7}
                    onPress={() => router.push({ pathname: "/(root)/(screens)/exercise_progress" as any, params: { childId: childId || "" } })}
                  >
                    <View style={[styles.exerciseIconWrap, { backgroundColor: ex.bg }]}>
                      <Ionicons name={ex.icon} size={26} color={ex.color} />
                    </View>
                    <Text style={styles.exerciseLabel}>{ex.label}</Text>
                    <View style={styles.exerciseActiveChip}>
                      <View style={[styles.exerciseActiveDot, { backgroundColor: ex.color }]} />
                      <Text style={styles.exerciseActiveText}>Active</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              {(childDetail?.playTimeMinutes ?? 0) > 0 && (
                <View style={styles.playTimeCard}>
                  <Ionicons name="time-outline" size={18} color="#6366F1" />
                  <Text style={styles.playTimeText}>Total play time: <Text style={styles.playTimeBold}>{childDetail?.playHours ?? 0}h ({childDetail?.playTimeMinutes ?? 0} min)</Text></Text>
                </View>
              )}
            </>
          )}

          {/* ── More section ────────────────────────────────────────── */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>More</Text>
          <View style={styles.moreRow}>
            {[
              { icon: "log-out-outline" as const, label: "Sign out", color: "#ef4444", action: handleSignOut },
            ].map((m, i) => (
              <TouchableOpacity key={i} style={styles.moreBtn} onPress={m.action}>
                <Ionicons name={m.icon} size={20} color={m.color} />
                <Text style={[styles.moreBtnText, { color: m.color }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </View>
        </ScrollView>
      )}
    </View>
  );
};

// ── styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#4338CA" },

  /* header */
  header: { paddingHorizontal: 20, paddingTop: STATUS_BAR_HEIGHT + 16, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: "hidden" },
  decorCircle1: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.06)", top: -40, right: -30 },
  decorCircle2: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.05)", bottom: -20, left: -20 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greetingWrap: { flex: 1, marginRight: 12 },
  greetingText: { fontSize: 14, color: "#c7d2fe", fontFamily: "Poppins-Regular" },
  displayName: { fontSize: 22, fontWeight: "700", color: "#fff", fontFamily: "Poppins-Bold", marginTop: 2 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  badge: { position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#ef4444", justifyContent: "center", alignItems: "center", paddingHorizontal: 4, borderWidth: 1.5, borderColor: "#4338CA" },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  avatarBtn: {},
  avatarImg: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.25)" },
  avatarInitials: { color: "#fff", fontSize: 14, fontWeight: "700", fontFamily: "Poppins-Bold" },

  /* progress tracker */
  progressSection: { marginTop: 14, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14, padding: 12 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressTitleWrap: { flexDirection: "row", alignItems: "center", gap: 5 },
  progressTitle: { fontSize: 13, fontWeight: "600", color: "#e0e7ff", fontFamily: "Poppins-SemiBold" },
  viewDetailBtn: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  viewDetailText: { fontSize: 10, color: "#fff", fontWeight: "600", fontFamily: "Poppins-SemiBold" },
  progressBarWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  progressBarBg: { flex: 1, height: 8, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: 8, backgroundColor: "#34d399", borderRadius: 4 },
  progressPercent: { fontSize: 13, fontWeight: "800", color: "#34d399", fontFamily: "Poppins-Bold", minWidth: 32, textAlign: "right" },

  /* exercise mini rows inside progress */
  exerciseMiniList: { marginBottom: 0 },
  exerciseMiniRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  exerciseMiniLeft: { flexDirection: "row", alignItems: "center", gap: 6, width: 90 },
  exerciseMiniIconWrap: { width: 24, height: 24, borderRadius: 8, justifyContent: "center" as const, alignItems: "center" as const },
  exerciseMiniLabel: { fontSize: 10, color: "#fff", fontFamily: "Poppins-Regular", fontWeight: "600" as const },
  exerciseMiniBarBg: { flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 4, overflow: "hidden" as const, marginHorizontal: 6 },
  exerciseMiniBarFill: { height: 6, borderRadius: 4 },
  exerciseMiniVal: { fontSize: 10, fontWeight: "800" as const, fontFamily: "Poppins-Bold", minWidth: 30, textAlign: "right" as const },

  /* stats */
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 12 },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 20, fontWeight: "800", fontFamily: "Poppins-Bold" },
  statLabel: { fontSize: 10, color: "#c7d2fe", fontFamily: "Poppins-Regular", marginTop: 4 },

  /* body */
  body: { backgroundColor: "#f8fafc" },
  bodyContent: { paddingHorizontal: 20, paddingTop: 20 },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },

  /* quick grid */
  quickGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 12, marginBottom: 8 },
  quickCard: { width: (SCREEN_WIDTH - 60) / 3, alignItems: "center", marginBottom: 16 },
  quickIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 6 },
  quickLabel: { fontSize: 11, textAlign: "center", color: "#475569", fontFamily: "Poppins-Regular", lineHeight: 14 },

  /* sections */
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1e293b", fontFamily: "Poppins-Bold" },
  seeAll: { fontSize: 13, color: "#6366F1", fontFamily: "Poppins-SemiBold" },

  /* session cards */
  sessionCard: { width: 200, borderRadius: 16, padding: 16, marginRight: 12, marginBottom: 12 },
  sessionRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sessionDate: { fontSize: 12, color: "#c7d2fe", fontFamily: "Poppins-Regular" },
  sessionTime: { fontSize: 16, fontWeight: "700", color: "#fff", marginTop: 6, fontFamily: "Poppins-Bold" },
  sessionPhysio: { fontSize: 12, color: "#c7d2fe", marginTop: 2, fontFamily: "Poppins-Regular" },
  chipRow: { flexDirection: "row", marginTop: 10 },
  statusChip: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusChipText: { fontSize: 10, color: "#fff", fontWeight: "600", fontFamily: "Poppins-SemiBold", textTransform: "uppercase" },

  /* empty */
  emptyCard: { backgroundColor: "#fff", borderRadius: 14, padding: 24, alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  emptyText: { fontSize: 13, color: "#94a3b8", marginTop: 8, fontFamily: "Poppins-Regular" },

  /* assignment cards */
  assignCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  assignLeft: { marginRight: 12, paddingTop: 4 },
  assignDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#6366F1" },
  assignBody: { flex: 1 },
  assignTitle: { fontSize: 15, fontWeight: "600", color: "#1e293b", fontFamily: "Poppins-SemiBold" },
  assignDesc: { fontSize: 12, color: "#64748b", marginTop: 2, fontFamily: "Poppins-Regular" },
  assignMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  assignMetaText: { fontSize: 11, color: "#94a3b8", fontFamily: "Poppins-Regular" },
  assignStatus: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  assignStatusText: { fontSize: 10, fontWeight: "600", fontFamily: "Poppins-SemiBold", textTransform: "uppercase" },

  /* more */
  moreRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  moreBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  moreBtnText: { fontSize: 13, fontWeight: "600", fontFamily: "Poppins-SemiBold" },

  /* physio card */
  physioCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  physioTop: { flexDirection: "row", alignItems: "center" },
  physioAvatar: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  physioInfo: { flex: 1, marginLeft: 12 },
  physioName: { fontSize: 15, fontWeight: "700", color: "#1e293b", fontFamily: "Poppins-Bold" },
  physioSpec: { fontSize: 12, color: "#64748b", fontFamily: "Poppins-Regular", marginTop: 2 },
  physioContactRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  physioContactText: { fontSize: 11, color: "#94a3b8", fontFamily: "Poppins-Regular" },
  availBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  availText: { fontSize: 13, fontWeight: "600", fontFamily: "Poppins-SemiBold" },
  availNote: { fontSize: 11, color: "#64748b", fontFamily: "Poppins-Regular", marginLeft: 4, flex: 1 },
  unavailWrap: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  unavailTitle: { fontSize: 12, fontWeight: "600", color: "#64748b", fontFamily: "Poppins-SemiBold", marginBottom: 6 },
  unavailRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  unavailDate: { fontSize: 12, color: "#1e293b", fontFamily: "Poppins-Regular" },
  unavailReason: { fontSize: 11, color: "#94a3b8", fontFamily: "Poppins-Regular" },

  /* exercise grid */
  exerciseGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 8, marginBottom: 4 },
  exerciseCard: { width: (SCREEN_WIDTH - 52) / 2, backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  exerciseIconWrap: { width: 56, height: 56, borderRadius: 18, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  exerciseLabel: { fontSize: 14, fontWeight: "600", color: "#1e293b", fontFamily: "Poppins-SemiBold" },
  exerciseActiveChip: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  exerciseActiveDot: { width: 6, height: 6, borderRadius: 3 },
  exerciseActiveText: { fontSize: 11, color: "#64748b", fontFamily: "Poppins-Regular" },
  playTimeCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#eef2ff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  playTimeText: { fontSize: 13, color: "#475569", fontFamily: "Poppins-Regular" },
  playTimeBold: { fontWeight: "700", color: "#6366F1", fontFamily: "Poppins-Bold" },
});

export default Home;