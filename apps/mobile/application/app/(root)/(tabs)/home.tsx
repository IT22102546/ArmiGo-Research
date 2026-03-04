import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import useAuthStore from "@/stores/authStore";
import { apiFetch } from "@/utils/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

type ChildInfo = { id: string; firstName?: string; lastName?: string };
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
  const [onlineSessions, setOnlineSessions] = useState<SessionItem[]>([]);
  const [physicalSessions, setPhysicalSessions] = useState<SessionItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

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
          return String(first.id);
        }
      }
    } catch {}
    try {
      const res = await apiFetch("/api/v1/users/my-children", { method: "GET" });
      if (res.ok) {
        const json = await res.json();
        const rows: ChildInfo[] = extractData(json) || [];
        const first = Array.isArray(rows) ? rows[0] : null;
        if (first?.id) {
          const name = `${first.firstName || ""} ${first.lastName || ""}`.trim();
          if (name) setChildName(name);
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

        const [onlineRes, physicalRes, assignRes] = await Promise.all([
          apiFetch(`/api/v1/users/my-online-sessions?childId=${encodeURIComponent(cid)}`, { method: "GET" }).catch(() => null),
          apiFetch(`/api/v1/users/my-admission-trackings?childId=${encodeURIComponent(cid)}`, { method: "GET" }).catch(() => null),
          apiFetch(`/api/v1/users/my-assignments?childId=${encodeURIComponent(cid)}`, { method: "GET" }).catch(() => null),
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
  const totalSessions = onlineSessions.length + physicalSessions.length;

  const displayName = childName || `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() || "User";
  const initials = (childName ? childName.split(" ").map((w: string) => w[0]).join("").slice(0, 2) : "") || `${currentUser?.firstName?.[0] || ""}${currentUser?.lastName?.[0] || ""}` || "U";

  // ── render ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <StatusBar barStyle="light-content" backgroundColor="#4338CA" translucent={false} />

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <LinearGradient colors={["#4338CA", "#6366F1", "#818CF8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.topRow}>
          <View style={styles.greetingWrap}>
            <Text style={styles.greetingText}>{greeting} 👋</Text>
            <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>
            {childName ? (
              <View style={styles.childBadge}>
                <Ionicons name="person" size={11} color="#c7d2fe" />
                <Text style={styles.childBadgeText}>Child Profile</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/(root)/(tabs)/Notifications")}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
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

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#a5b4fc" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises, therapists..."
              placeholderTextColor="#a5b4fc"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#a5b4fc" />
              </TouchableOpacity>
            ) : (
              <View style={styles.searchFilter}>
                <Ionicons name="options-outline" size={16} color="#6366F1" />
              </View>
            )}
          </View>
        </View>

        {/* Stats ribbon */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Ionicons name="videocam" size={14} color="#fbbf24" />
            <Text style={styles.statValue}>{scheduledOnline}</Text>
            <Text style={styles.statLabel}>Online</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Ionicons name="medkit" size={14} color="#34d399" />
            <Text style={styles.statValue}>{scheduledPhysical}</Text>
            <Text style={styles.statLabel}>Physical</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Ionicons name="document-text" size={14} color="#f472b6" />
            <Text style={styles.statValue}>{assignments.length}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Ionicons name="pulse" size={14} color="#60a5fa" />
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── BODY ───────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loaderText}>Loading your dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={["#6366F1"]} tintColor="#6366F1" />}
        >
          {/* Quick Access Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.quickGrid}>
              <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(root)/(tabs)/assignments")}>
                <LinearGradient colors={["#3b82f6", "#2563eb"]} style={styles.quickIconWrap}>
                  <Ionicons name="document-text" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.quickLabel}>Assignments</Text>
                <Text style={styles.quickCount}>{assignments.length} total</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(root)/(tabs)/publications")}>
                <LinearGradient colors={["#f43f5e", "#e11d48"]} style={styles.quickIconWrap}>
                  <Ionicons name="bar-chart" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.quickLabel}>Progress</Text>
                <Text style={styles.quickCount}>View reports</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(root)/(screens)/online_sessions")}>
                <LinearGradient colors={["#8b5cf6", "#7c3aed"]} style={styles.quickIconWrap}>
                  <Ionicons name="videocam" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.quickLabel}>Online</Text>
                <Text style={styles.quickCount}>{scheduledOnline} upcoming</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(root)/(tabs)/admission_tracking")}>
                <LinearGradient colors={["#10b981", "#059669"]} style={styles.quickIconWrap}>
                  <Ionicons name="medkit" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.quickLabel}>Physical</Text>
                <Text style={styles.quickCount}>{scheduledPhysical} upcoming</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Upcoming Online Sessions ───────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionDot, { backgroundColor: "#8b5cf6" }]} />
                <Text style={styles.sectionTitle}>Online Sessions</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/(root)/(screens)/online_sessions")}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {upcomingOnline.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="videocam-outline" size={36} color="#c4b5fd" />
                <Text style={styles.emptyTitle}>No Upcoming Online Sessions</Text>
                <Text style={styles.emptySub}>Your scheduled video sessions will appear here</Text>
              </View>
            ) : (
              upcomingOnline.map((session) => (
                <TouchableOpacity key={session.id} style={styles.sessionCard} activeOpacity={0.7} onPress={() => router.push("/(root)/(screens)/online_sessions")}>
                  <View style={[styles.sessionAccent, { backgroundColor: "#8b5cf6" }]} />
                  <View style={styles.sessionBody}>
                    <View style={styles.sessionTop}>
                      <View style={styles.sessionTypeChip}>
                        <Ionicons name="videocam" size={12} color="#7c3aed" />
                        <Text style={styles.sessionTypeText}>Online</Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: String(session.status || "").toUpperCase() === "ONGOING" ? "#dcfce7" : "#fef3c7" }]}>
                        <View style={[styles.statusDot, { backgroundColor: String(session.status || "").toUpperCase() === "ONGOING" ? "#16a34a" : "#f59e0b" }]} />
                        <Text style={[styles.statusText, { color: String(session.status || "").toUpperCase() === "ONGOING" ? "#16a34a" : "#92400e" }]}>{session.status || "Scheduled"}</Text>
                      </View>
                    </View>
                    <View style={styles.sessionInfoRow}>
                      <Ionicons name="calendar-outline" size={14} color="#6366f1" />
                      <Text style={styles.sessionInfoText}>{formatDateSmart(session.admissionDate)}</Text>
                    </View>
                    {(session.startTime || session.endTime) ? (
                      <View style={styles.sessionInfoRow}>
                        <Ionicons name="time-outline" size={14} color="#6366f1" />
                        <Text style={styles.sessionInfoText}>{formatTime(session.startTime, session.endTime)}</Text>
                      </View>
                    ) : null}
                    {session.physiotherapist?.name ? (
                      <View style={styles.sessionInfoRow}>
                        <Ionicons name="person-outline" size={14} color="#6366f1" />
                        <Text style={styles.sessionInfoText}>{session.physiotherapist.name}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* ── Upcoming Physical Sessions ─────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionDot, { backgroundColor: "#10b981" }]} />
                <Text style={styles.sectionTitle}>Physical Sessions</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/(root)/(tabs)/admission_tracking")}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {upcomingPhysical.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="medkit-outline" size={36} color="#86efac" />
                <Text style={styles.emptyTitle}>No Upcoming Physical Sessions</Text>
                <Text style={styles.emptySub}>Your in-person sessions will show up here</Text>
              </View>
            ) : (
              upcomingPhysical.map((session) => (
                <TouchableOpacity key={session.id} style={styles.sessionCard} activeOpacity={0.7} onPress={() => router.push("/(root)/(tabs)/admission_tracking")}>
                  <View style={[styles.sessionAccent, { backgroundColor: "#10b981" }]} />
                  <View style={styles.sessionBody}>
                    <View style={styles.sessionTop}>
                      <View style={[styles.sessionTypeChip, { backgroundColor: "#ecfdf5" }]}>
                        <Ionicons name="medkit" size={12} color="#059669" />
                        <Text style={[styles.sessionTypeText, { color: "#059669" }]}>Physical</Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: String(session.status || "").toUpperCase() === "ACTIVE" ? "#dbeafe" : "#fef3c7" }]}>
                        <View style={[styles.statusDot, { backgroundColor: String(session.status || "").toUpperCase() === "ACTIVE" ? "#2563eb" : "#f59e0b" }]} />
                        <Text style={[styles.statusText, { color: String(session.status || "").toUpperCase() === "ACTIVE" ? "#2563eb" : "#92400e" }]}>{session.status || "Scheduled"}</Text>
                      </View>
                    </View>
                    <View style={styles.sessionInfoRow}>
                      <Ionicons name="calendar-outline" size={14} color="#10b981" />
                      <Text style={styles.sessionInfoText}>{formatDateSmart(session.admissionDate)}</Text>
                    </View>
                    {(session.startTime || session.endTime) ? (
                      <View style={styles.sessionInfoRow}>
                        <Ionicons name="time-outline" size={14} color="#10b981" />
                        <Text style={styles.sessionInfoText}>{formatTime(session.startTime, session.endTime)}</Text>
                      </View>
                    ) : null}
                    {session.physiotherapist?.name ? (
                      <View style={styles.sessionInfoRow}>
                        <Ionicons name="person-outline" size={14} color="#10b981" />
                        <Text style={styles.sessionInfoText}>{session.physiotherapist.name}</Text>
                      </View>
                    ) : null}
                    {session.hospital?.name ? (
                      <View style={styles.sessionInfoRow}>
                        <Ionicons name="location-outline" size={14} color="#10b981" />
                        <Text style={styles.sessionInfoText}>{session.hospital.name}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* ── Latest Assignments ─────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionDot, { backgroundColor: "#3b82f6" }]} />
                <Text style={styles.sectionTitle}>Latest Assignments</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/(root)/(tabs)/assignments")}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {latestAssignments.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="document-text-outline" size={36} color="#93c5fd" />
                <Text style={styles.emptyTitle}>No Assignments Yet</Text>
                <Text style={styles.emptySub}>When you receive assignments they will appear here</Text>
              </View>
            ) : (
              latestAssignments.map((a) => {
                const statusUpper = String(a.status || "").toUpperCase();
                const isPending = statusUpper === "PENDING" || statusUpper === "ASSIGNED";
                const isCompleted = statusUpper.includes("COMPLETE") || statusUpper.includes("SUBMITTED");
                const pillBg = isCompleted ? "#dcfce7" : isPending ? "#fef3c7" : "#f1f5f9";
                const pillColor = isCompleted ? "#16a34a" : isPending ? "#92400e" : "#64748b";
                const dotColor = isCompleted ? "#16a34a" : isPending ? "#f59e0b" : "#94a3b8";
                return (
                  <TouchableOpacity key={a.id} style={styles.sessionCard} activeOpacity={0.7} onPress={() => router.push("/(root)/(tabs)/assignments")}>
                    <View style={[styles.sessionAccent, { backgroundColor: "#3b82f6" }]} />
                    <View style={styles.sessionBody}>
                      <View style={styles.sessionTop}>
                        <Text style={styles.assignTitle} numberOfLines={1}>{a.title}</Text>
                        <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
                          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                          <Text style={[styles.statusText, { color: pillColor }]}>{a.status || "Pending"}</Text>
                        </View>
                      </View>
                      {a.description ? <Text style={styles.assignDesc} numberOfLines={2}>{a.description}</Text> : null}
                      <View style={styles.assignMeta}>
                        <View style={styles.sessionInfoRow}>
                          <Ionicons name="calendar-outline" size={14} color="#3b82f6" />
                          <Text style={styles.sessionInfoText}>Due: {formatDateSmart(a.dueDate)}</Text>
                        </View>
                        {a.physiotherapist?.name ? (
                          <View style={styles.sessionInfoRow}>
                            <Ionicons name="person-outline" size={14} color="#3b82f6" />
                            <Text style={styles.sessionInfoText}>{a.physiotherapist.name}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* ── Quick Links Footer ─────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>More</Text>
            <View style={styles.moreRow}>
              <TouchableOpacity style={styles.moreBtn} onPress={() => router.push("/(root)/(tabs)/physiotherapists")}>
                <LinearGradient colors={["#f97316", "#ea580c"]} style={styles.moreBtnIcon}>
                  <Ionicons name="people" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.moreBtnLabel}>Therapists</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.moreBtn} onPress={() => router.push("/(root)/(tabs)/publications")}>
                <LinearGradient colors={["#06b6d4", "#0891b2"]} style={styles.moreBtnIcon}>
                  <Ionicons name="book" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.moreBtnLabel}>Publications</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.moreBtn} onPress={() => router.push("/(root)/(tabs)/Notifications")}>
                <LinearGradient colors={["#ec4899", "#db2777"]} style={styles.moreBtnIcon}>
                  <Ionicons name="notifications" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.moreBtnLabel}>Alerts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.moreBtn} onPress={handleSignOut}>
                <LinearGradient colors={["#ef4444", "#dc2626"]} style={styles.moreBtnIcon}>
                  <Ionicons name="log-out" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.moreBtnLabel}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ── styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  // header
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  decorCircle1: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)", top: -60, right: -40,
  },
  decorCircle2: {
    position: "absolute", width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.04)", bottom: -30, left: -20,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greetingWrap: { flex: 1, marginRight: 12 },
  greetingText: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "Poppins-Regular" },
  displayName: { fontSize: 22, fontWeight: "700", color: "#fff", fontFamily: "Poppins-Bold", marginTop: 2 },
  childBadge: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.12)",
    alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 6, gap: 4,
  },
  childBadgeText: { fontSize: 11, color: "#c7d2fe", fontFamily: "Poppins-Regular" },
  topActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  badge: {
    position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: "#ef4444", justifyContent: "center", alignItems: "center",
    paddingHorizontal: 3, borderWidth: 2, borderColor: "#4338CA",
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  avatarBtn: {},
  avatarImg: { width: 42, height: 42, borderRadius: 14, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  avatarPlaceholder: {
    width: 42, height: 42, borderRadius: 14, justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
  },
  avatarInitials: { color: "#fff", fontSize: 14, fontWeight: "bold", fontFamily: "Poppins-Bold" },

  // search
  searchWrap: { marginTop: 18 },
  searchBar: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#fff", fontFamily: "Poppins-Regular", paddingVertical: 0 },
  searchFilter: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center", alignItems: "center",
  },

  // stats ribbon
  statsRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, marginTop: 16,
    paddingVertical: 12, paddingHorizontal: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  statChip: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 18, fontWeight: "700", color: "#fff", fontFamily: "Poppins-Bold" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: "Poppins-Regular" },
  statDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.15)" },

  // loader
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loaderText: { fontSize: 14, color: "#94a3b8", fontFamily: "Poppins-Regular" },

  // body
  body: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // sections
  section: { paddingHorizontal: 20, marginTop: 22 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", fontFamily: "Poppins-Bold" },
  seeAll: { fontSize: 13, color: "#6366f1", fontWeight: "600", fontFamily: "Poppins-SemiBold" },

  // quick access grid
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 },
  quickCard: {
    width: (SCREEN_WIDTH - 52) / 2, backgroundColor: "#fff", borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#6366f1", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  quickIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  quickLabel: { fontSize: 15, fontWeight: "600", color: "#1e293b", fontFamily: "Poppins-SemiBold" },
  quickCount: { fontSize: 12, color: "#94a3b8", fontFamily: "Poppins-Regular", marginTop: 2 },

  // session / assignment cards
  sessionCard: {
    flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#e2e8f0", overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  sessionAccent: { width: 5 },
  sessionBody: { flex: 1, padding: 14 },
  sessionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sessionTypeChip: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#ede9fe",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 4,
  },
  sessionTypeText: { fontSize: 11, fontWeight: "600", color: "#7c3aed", fontFamily: "Poppins-SemiBold" },
  statusPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600", fontFamily: "Poppins-SemiBold", textTransform: "capitalize" },
  sessionInfoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  sessionInfoText: { fontSize: 13, color: "#475569", fontFamily: "Poppins-Regular" },

  // assignment extras
  assignTitle: { fontSize: 15, fontWeight: "600", color: "#1e293b", fontFamily: "Poppins-SemiBold", flex: 1, marginRight: 8 },
  assignDesc: { fontSize: 12, color: "#64748b", fontFamily: "Poppins-Regular", lineHeight: 18, marginBottom: 6 },
  assignMeta: { marginTop: 4 },

  // empty states
  emptyCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 28, alignItems: "center",
    borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "dashed",
  },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: "#64748b", fontFamily: "Poppins-SemiBold", marginTop: 10 },
  emptySub: { fontSize: 12, color: "#94a3b8", fontFamily: "Poppins-Regular", textAlign: "center", marginTop: 4 },

  // more links row
  moreRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  moreBtn: { alignItems: "center", gap: 6 },
  moreBtnIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  moreBtnLabel: { fontSize: 11, color: "#475569", fontWeight: "600", fontFamily: "Poppins-SemiBold" },
});

export default Home;