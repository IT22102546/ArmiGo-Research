// app/(root)/(tabs)/profile.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import useAuthStore from "@/stores/authStore";
import { apiFetch } from "@/utils/api";

// ─── Responsive ─────────────────────────────────────────────────
const { width: SW } = Dimensions.get("window");

// ─── Color Palette ───────────────────────────────────────────────
const BLUE        = "#4B3AFF";
const BLUE_LIGHT  = "#5C6CFF";
const BLUE_SOFT   = "#EEF0FF";
const SLATE_50    = "#f8fafc";
const SLATE_100   = "#f1f5f9";
const SLATE_200   = "#e2e8f0";
const SLATE_400   = "#94a3b8";
const SLATE_500   = "#64748b";
const SLATE_700   = "#334155";
const SLATE_900   = "#0f172a";
const GREEN       = "#22c55e";
const RED         = "#ef4444";

// ─── Types ───────────────────────────────────────────────────────
interface Physio {
  id: string;
  name: string;
  role?: string;
  specialization?: string;
  phone?: string;
}

interface Hospital {
  id: string;
  name: string;
  city?: string;
  phone?: string;
  address?: string;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  diagnosis?: string | null;
  diagnosisDate?: string | null;
  medicalNotes?: string | null;
  assignedDoctor?: string | null;
  isActive: boolean;
  enrolledAt: string;
  hospital?: Hospital | null;
  physioAssignments?: Array<{
    id: string;
    title: string;
    status: string;
    physiotherapist?: Physio | null;
  }>;
}

interface ParentData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  role: string;
  status?: string | null;
  dateOfBirth?: string | null;
  avatar?: string | null;
  createdAt?: string | null;
  address?: string | null;
  city?: string | null;
  // Direct User.children relation (Child.parentId → User.id)
  children?: Child[];
  parentProfile?: {
    children?: Child[];
  } | null;
}

interface MobileProfilePayload {
  parent: ParentData;
  children: Child[];
}

// ─── Helpers ─────────────────────────────────────────────────────
const fmtDate = (d?: string | Date | null): string => {
  if (!d) return "Not set";
  try {
    const date = new Date(d as string);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return "—";
  }
};

const calcAge = (dob?: string | null): number | null => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return age >= 0 ? age : null;
};

const toInitials = (first?: string, last?: string): string =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";

const genderColor = (g?: string): string =>
  g?.toLowerCase() === "female" ? "#e91e8c" : "#1E90FF";

const capitalize = (s?: string): string =>
  !s ? "" : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

// ═══════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ─── Section Header ───────────────────────────────────────────
const SectionHeader: React.FC<{ title: string; icon: string; count?: number }> = ({
  title, icon, count,
}) => (
  <View style={sec.row}>
    <View style={sec.iconWrap}>
      <Ionicons name={icon as any} size={16} color={BLUE} />
    </View>
    <Text style={sec.title}>{title}</Text>
    {count !== undefined && (
      <View style={sec.badge}>
        <Text style={sec.badgeTxt}>{count}</Text>
      </View>
    )}
  </View>
);

// ─── Info Row (inside child card) ─────────────────────────────
const InfoRow: React.FC<{
  icon: string; color: string; label: string; value: string; sub?: string;
}> = ({ icon, color, label, value, sub }) => (
  <View style={ir.row}>
    <View style={[ir.icon, { backgroundColor: color + "20" }]}>
      <Ionicons name={icon as any} size={16} color={color} />
    </View>
    <View style={ir.body}>
      <Text style={ir.label}>{label}</Text>
      <Text style={ir.value} numberOfLines={2}>{value}</Text>
      {!!sub && <Text style={ir.sub}>{sub}</Text>}
    </View>
  </View>
);

// ─── Detail Row (parent section) ──────────────────────────────
const DetailRow: React.FC<{
  icon: string; color: string; label: string; value: string; last?: boolean;
}> = ({ icon, color, label, value, last }) => (
  <View style={[dr.row, last && dr.rowLast]}>
    <View style={[dr.icon, { backgroundColor: color + "20" }]}>
      <Ionicons name={icon as any} size={15} color={color} />
    </View>
    <View style={dr.body}>
      <Text style={dr.label}>{label}</Text>
      <Text style={dr.value}>{value}</Text>
    </View>
  </View>
);

// ─── Child Card ───────────────────────────────────────────────
const ChildCard: React.FC<{ child: Child; index: number }> = ({ child, index }) => {
  const [open, setOpen] = useState(index === 0);
  const age = calcAge(child.dateOfBirth) ?? child.age;
  const gc  = genderColor(child.gender);
  const physio = child.physioAssignments?.[0]?.physiotherapist ?? null;

  return (
    <View style={cc.card}>
      {/* ── gradient header row ── */}
      <LinearGradient
        colors={[BLUE, "#7060FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cc.header}
      >
        {/* Avatar circle */}
        <View style={[cc.avatar, { borderColor: "rgba(255,255,255,0.6)" }]}>
          <Text style={cc.avatarTxt}>
            {toInitials(child.firstName, child.lastName)}
          </Text>
        </View>

        {/* Name + gender + age */}
        <View style={cc.headerMid}>
          <Text style={cc.name} numberOfLines={1}>
            {child.firstName} {child.lastName}
          </Text>
          <View style={cc.pills}>
            <View style={[cc.genderPill, { backgroundColor: gc + "30", borderColor: gc + "80" }]}>
              <Text style={[cc.genderTxt, { color: "#fff" }]}>
                {capitalize(child.gender)}
              </Text>
            </View>
            <Text style={cc.ageTxt}>{age} yrs</Text>
          </View>
        </View>

        {/* Status + toggle */}
        <View style={cc.headerRight}>
          <View style={[
            cc.statusBadge,
            { backgroundColor: child.isActive ? GREEN + "25" : RED + "25",
              borderColor: child.isActive ? GREEN : RED },
          ]}>
            <View style={[cc.dot, { backgroundColor: child.isActive ? GREEN : RED }]} />
            <Text style={[cc.statusTxt, { color: child.isActive ? GREEN : RED }]}>
              {child.isActive ? "Active" : "Inactive"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setOpen(v => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={cc.toggle}
          >
            <Ionicons
              name={open ? "chevron-up" : "chevron-down"}
              size={18}
              color="rgba(255,255,255,0.9)"
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── expandable body ── */}
      {open && (
        <View style={cc.body}>
          {/* Hospital */}
          <InfoRow
            icon="business-outline"
            color="#0ea5e9"
            label="Hospital"
            value={child.hospital?.name ?? "Not assigned"}
            sub={[child.hospital?.city, child.hospital?.phone].filter(Boolean).join(" · ")}
          />

          {/* Physiotherapist */}
          <InfoRow
            icon="person-circle-outline"
            color="#8b5cf6"
            label="Physiotherapist"
            value={physio?.name ?? child.assignedDoctor ?? "Not assigned"}
            sub={physio?.specialization ?? physio?.role}
          />

          {/* Diagnosis */}
          <InfoRow
            icon="medical-outline"
            color={RED}
            label="Diagnosis"
            value={child.diagnosis ?? "Not recorded"}
            sub={child.diagnosisDate ? `Diagnosed: ${fmtDate(child.diagnosisDate)}` : undefined}
          />

          {/* Date of Birth */}
          <InfoRow
            icon="calendar-outline"
            color="#f59e0b"
            label="Date of Birth"
            value={fmtDate(child.dateOfBirth)}
          />

          {/* Enrolled */}
          <InfoRow
            icon="clipboard-outline"
            color="#10b981"
            label="Enrolled Since"
            value={fmtDate(child.enrolledAt)}
          />

          {/* Medical notes */}
          {!!child.medicalNotes && (
            <View style={cc.notesBox}>
              <View style={cc.notesHead}>
                <Ionicons name="document-text-outline" size={14} color={SLATE_500} />
                <Text style={cc.notesLabel}> Medical Notes</Text>
              </View>
              <Text style={cc.notesTxt}>{child.medicalNotes}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════════════════════
const Profile = () => {
  const { currentUser, signOut, userupdate } = useAuthStore();
  const router = useRouter();
  // Start without spinner if we already have cached user from auth store
  const [loading, setLoading]     = useState(!currentUser);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState<ParentData | null>(null);
  const [enrichedChildren, setEnrichedChildren] = useState<Child[]>([]);

  // ── API Fetch ────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    const token = await SecureStore.getItemAsync("access_token");
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      Alert.alert("Session Expired", "Please sign in again.", [
        { text: "Sign In", onPress: () => router.replace("/(auth)/sign-in") },
      ]);
      return;
    }

    // ── 1. Mobile parent payload (single source for mobile) ──
    try {
      const profileRes = await apiFetch("/api/v1/users/mobile/profile", { method: "GET" });

      if (profileRes.status === 401) {
        await SecureStore.deleteItemAsync("access_token");
        Alert.alert("Session Expired", "Please sign in again.", [
          { text: "Sign In", onPress: () => router.replace("/(auth)/sign-in") },
        ]);
        return;
      }

      if (profileRes.ok) {
        const profileJson = await profileRes.json();
        const payload: MobileProfilePayload = profileJson?.success && profileJson?.data
          ? profileJson.data
          : profileJson;
        const fetched: ParentData = payload?.parent ?? (payload as any);
        const kids: Child[] = Array.isArray(payload?.children)
          ? payload.children
          : [];
        console.log("✅ Profile loaded:", {
          id: fetched.id,
          name: `${fetched.firstName} ${fetched.lastName}`,
          directChildren: (fetched as any).children?.length ?? 0,
          profileChildren: fetched.parentProfile?.children?.length ?? 0,
          payloadChildren: kids.length,
        });
        setProfileData(fetched);
        setEnrichedChildren(kids);
        userupdate(fetched as any);
      } else {
        console.warn("⚠️ Mobile profile response not ok:", profileRes.status);
      }
    } catch (e: any) {
      console.warn("⚠️ Mobile profile fetch failed:", e?.message ?? e);

      // Fallback to legacy endpoints if mobile profile endpoint fails
      try {
        const legacyProfileRes = await apiFetch("/api/v1/users/profile", { method: "GET" });
        if (legacyProfileRes.ok) {
          const legacyProfileJson = await legacyProfileRes.json();
          const legacyUser: ParentData = legacyProfileJson?.success && legacyProfileJson?.data
            ? legacyProfileJson.data
            : legacyProfileJson;
          setProfileData(legacyUser);
          userupdate(legacyUser as any);
        }
      } catch {
        // Keep showing cached currentUser — no hard error
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    // ── 2. Children (non-blocking, silently degrades) ────────
    try {
      const childrenRes = await apiFetch("/api/v1/users/my-children", { method: "GET" });
      console.log("🧒 my-children status:", childrenRes.status);
      if (childrenRes.ok) {
        const childrenJson = await childrenRes.json();
        const kids: Child[] = childrenJson?.success && Array.isArray(childrenJson?.data)
          ? childrenJson.data
          : Array.isArray(childrenJson)
          ? childrenJson
          : [];
        console.log(`🧒 my-children returned ${kids.length} children:`, kids.map(k => `${k.firstName} (hospital: ${k.hospital?.name ?? "none"}, physio: ${k.physioAssignments?.[0]?.physiotherapist?.name ?? "none"})`));
        if (kids.length > 0) setEnrichedChildren(kids);
      } else {
        console.warn("⚠️ my-children non-ok:", childrenRes.status);
      }
    } catch (e: any) {
      // Silently fall back to profile-embedded children
      console.log("ℹ️ enriched-children fetch skipped:", e?.message ?? e);
    }
  }, [currentUser]);

  useEffect(() => { fetchProfile(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("access_token");
          await SecureStore.deleteItemAsync("refresh_token");
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  const user = profileData ?? (currentUser as any as ParentData);
  // Prefer the dedicated /my-children endpoint (has hospital + physio data);
  // fall back to profile-embedded children if the endpoint hasn't responded yet.
  const profileChildren: Child[] =
    user?.parentProfile?.children?.length
      ? (user.parentProfile!.children as Child[])
      : (user?.children ?? []);
  const children: Child[] = enrichedChildren.length > 0 ? enrichedChildren : profileChildren;

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.flex} edges={["right", "left"]}>
        <StatusBar barStyle="light-content" backgroundColor={BLUE} />
        <LinearGradient colors={[BLUE, BLUE_LIGHT]} style={s.header}>
          <Text style={s.headerTxt}>My Profile</Text>
        </LinearGradient>
        <View style={s.center}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={s.loadTxt}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── No user ──────────────────────────────────────────────────
  if (!user) {
    return (
      <SafeAreaView style={s.flex} edges={["right", "left"]}>
        <StatusBar barStyle="light-content" backgroundColor={BLUE} />
        <LinearGradient colors={[BLUE, BLUE_LIGHT]} style={s.header}>
          <Text style={s.headerTxt}>My Profile</Text>
        </LinearGradient>
        <View style={s.center}>
          <Ionicons name="person-circle-outline" size={64} color={SLATE_200} />
          <Text style={s.loadTxt}>No profile data found.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={fetchProfile}>
            <Text style={s.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ──────────────────────────────────────────────
  return (
    <SafeAreaView style={s.flex} edges={["right", "left"]}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} translucent={false} />

      {/* Gradient top bar */}
      <LinearGradient
        colors={[BLUE, BLUE_LIGHT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.header}
      >
        <Text style={s.headerTxt}>My Profile</Text>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollPad}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BLUE]}
            tintColor={BLUE}
          />
        }
      >
        {/* ═══════════════════════════════════
            PARENT IDENTITY CARD
        ═══════════════════════════════════ */}
        <LinearGradient
          colors={[BLUE, "#7055FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.identityCard}
        >
          {/* Parent avatar */}
          <View style={s.pAvatar}>
            <Text style={s.pAvatarTxt}>
              {toInitials(user.firstName, user.lastName)}
            </Text>
          </View>

          <Text style={s.pName}>{user.firstName} {user.lastName}</Text>

          <View style={s.rolePill}>
            <Ionicons name="shield-checkmark-outline" size={12} color="rgba(255,255,255,0.9)" />
            <Text style={s.roleTxt}>  Parent Account</Text>
          </View>

          <Text style={s.pMeta} numberOfLines={1}>
            {user.email ?? user.phone ?? "Parent Account"}
          </Text>
        </LinearGradient>

        {/* ═══════════════════════════════════
            CHILDREN — PRIMARY FOCUS
        ═══════════════════════════════════ */}
        <View style={s.section}>
          <SectionHeader
            title="My Children"
            icon="people-outline"
            count={children.length}
          />

          {children.length === 0 ? (
            <View style={s.emptyBox}>
              <View style={s.emptyIllustration}>
                <Ionicons name="people-outline" size={48} color={SLATE_400} />
              </View>
              <Text style={s.emptyTitle}>No Children Registered</Text>
              <Text style={s.emptySub}>
                Your child's therapy details will appear here once they are enrolled at a hospital by the admin.
              </Text>
            </View>
          ) : (
            children.map((child, i) => (
              <ChildCard key={child.id} child={child} index={i} />
            ))
          )}
        </View>

        {/* ═══════════════════════════════════
            PARENT DETAILS — SECONDARY
        ═══════════════════════════════════ */}
        <View style={s.section}>
          <SectionHeader title="Parent Details" icon="person-outline" />

          <View style={s.detailCard}>
            {user.email && (
              <DetailRow
                icon="mail-outline"
                color="#0ea5e9"
                label="Email"
                value={user.email}
              />
            )}
            <DetailRow
              icon="call-outline"
              color="#10b981"
              label="Phone"
              value={user.phone ?? "Not set"}
            />
            {user.dateOfBirth && (
              <DetailRow
                icon="calendar-outline"
                color="#f59e0b"
                label="Date of Birth"
                value={fmtDate(user.dateOfBirth)}
              />
            )}
            {(user.city || user.address) && (
              <DetailRow
                icon="location-outline"
                color={RED}
                label="Location"
                value={[user.city, user.address].filter(Boolean).join(", ")}
              />
            )}
            <DetailRow
              icon="time-outline"
              color="#8b5cf6"
              label="Member Since"
              value={fmtDate(user.createdAt)}
              last
            />
          </View>
        </View>

        {/* ═══════════════════════════════════
            ACCOUNT ACTIONS
        ═══════════════════════════════════ */}
        <View style={s.section}>
          <SectionHeader title="Account" icon="settings-outline" />

          <View style={s.actCard}>
            <TouchableOpacity
              style={s.actRow}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={[s.actIco, { backgroundColor: RED + "18" }]}>
                <Ionicons name="log-out-outline" size={18} color={RED} />
              </View>
              <Text style={[s.actLbl, { color: RED }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={16} color={SLATE_400} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ═══════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════

// ─── Screen ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: SLATE_100 },

  header: {
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTxt: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.4,
  },

  scroll: { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 50 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadTxt: { fontSize: 15, color: SLATE_500, fontFamily: "Poppins-Regular" },
  retryBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 8,
  },
  retryTxt: { color: "#fff", fontWeight: "600", fontFamily: "Poppins-SemiBold" },

  // Identity card (parent)
  identityCard: {
    marginTop: 16,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  pAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  pAvatarTxt: { fontSize: 24, fontWeight: "700", color: "#fff", fontFamily: "Poppins-Bold" },
  pName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Poppins-Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  roleTxt: { color: "rgba(255,255,255,0.92)", fontSize: 12, fontFamily: "Poppins-Regular" },
  pMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.88)",
    fontFamily: "Poppins-Regular",
    maxWidth: SW * 0.7,
    textAlign: "center",
  },

  // Section
  section: { marginTop: 22 },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  // Empty children
  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 10,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyIllustration: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SLATE_100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: SLATE_700,
    fontFamily: "Poppins-Bold",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: SLATE_400,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
    lineHeight: 20,
    maxWidth: SW * 0.72,
  },

  // Actions card
  actCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  actRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  actIco: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  actLbl: {
    flex: 1,
    fontSize: 15,
    color: SLATE_900,
    fontFamily: "Poppins-Regular",
    fontWeight: "500",
  },
});

// ─── Section Header ──────────────────────────────────────────────
const sec = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: BLUE_SOFT,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: SLATE_900,
    fontFamily: "Poppins-Bold",
  },
  badge: {
    backgroundColor: BLUE,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeTxt: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Poppins-Bold",
  },
});

// ─── Child Card ──────────────────────────────────────────────────
const cc = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 10,
    overflow: "hidden",
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 11,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 2.5,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Poppins-Bold",
  },
  headerMid: { flex: 1 },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Poppins-Bold",
    marginBottom: 4,
  },
  pills: { flexDirection: "row", alignItems: "center", gap: 6 },
  genderPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  genderTxt: { fontSize: 11, fontWeight: "600", fontFamily: "Poppins-SemiBold" },
  ageTxt: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Poppins-Regular",
  },
  headerRight: { alignItems: "flex-end", gap: 8 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 11, fontWeight: "600", fontFamily: "Poppins-SemiBold" },
  toggle: { padding: 2 },

  body: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  notesBox: {
    backgroundColor: SLATE_50,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: SLATE_200,
    marginTop: 2,
  },
  notesHead: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  notesLabel: {
    fontSize: 12,
    color: SLATE_500,
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
  },
  notesTxt: {
    fontSize: 13,
    color: SLATE_700,
    lineHeight: 19,
    fontFamily: "Poppins-Regular",
  },
});

// ─── Info Row ────────────────────────────────────────────────────
const ir = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  body: { flex: 1 },
  label: {
    fontSize: 11,
    color: SLATE_400,
    fontFamily: "Poppins-Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: SLATE_900,
    fontWeight: "500",
    fontFamily: "Poppins-Regular",
  },
  sub: {
    fontSize: 12,
    color: SLATE_500,
    fontFamily: "Poppins-Regular",
    marginTop: 2,
  },
});

// ─── Detail Row ──────────────────────────────────────────────────
const dr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
    gap: 12,
  },
  rowLast: { borderBottomWidth: 0 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  body: { flex: 1 },
  label: {
    fontSize: 10,
    color: SLATE_400,
    fontFamily: "Poppins-Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  value: {
    fontSize: 14,
    color: SLATE_900,
    fontWeight: "500",
    fontFamily: "Poppins-Regular",
  },
});

export default Profile;
