import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { apiFetch } from "@/utils/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Premium Color Palette ───────────────────────────────────────
const COLORS = {
  primary: "#6366F1", // Indigo
  primaryLight: "#818CF8",
  primarySoft: "#EEF2FF",
  secondary: "#8B5CF6", // Purple
  success: "#10B981", // Emerald
  warning: "#F59E0B", // Amber
  danger: "#EF4444", // Red
  info: "#3B82F6", // Blue
  purple: "#8B5CF6",
  pink: "#EC4899",
  
  slate: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
};

interface UnavailableDate {
  id: string;
  date: string;
  reason?: string | null;
}

interface Physiotherapist {
  id: string;
  name: string;
  role?: string;
  specialization?: string;
  phone?: string;
  email?: string;
  avatar?: string | null;
  availabilityStatus?: "AVAILABLE" | "IN_WORK" | "NOT_AVAILABLE" | string | null;
  availabilityNote?: string | null;
  availabilityUpdatedAt?: string | null;
  unavailableDates?: UnavailableDate[];
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  assignedDoctor?: string | null;
  physioAssignments?: Array<{
    id: string;
    physiotherapist?: Physiotherapist | null;
  }>;
}

const statusConfig = {
  AVAILABLE: {
    label: "Available",
    color: COLORS.success,
    bgColor: COLORS.success + "12",
    icon: "checkmark-circle",
    gradient: [COLORS.success + "20", COLORS.success + "05"] as const,
  },
  IN_WORK: {
    label: "In Work",
    color: COLORS.info,
    bgColor: COLORS.info + "12",
    icon: "time",
    gradient: [COLORS.info + "20", COLORS.info + "05"] as const,
  },
  NOT_AVAILABLE: {
    label: "Not Available",
    color: COLORS.danger,
    bgColor: COLORS.danger + "12",
    icon: "close-circle",
    gradient: [COLORS.danger + "20", COLORS.danger + "05"] as const,
  },
} as const;

const resolveStatus = (raw?: string | null): keyof typeof statusConfig => {
  if (raw === "IN_WORK" || raw === "NOT_AVAILABLE") return raw;
  return "AVAILABLE";
};

const formatDate = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatRelativeTime = (date?: string | null): string => {
  if (!date) return "";
  try {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(date);
  } catch {
    return formatDate(date);
  }
};

const getInitials = (name?: string): string => {
  if (!name) return "?";
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export default function PhysiotherapistsTab() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChildPhysioDetails = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);
      const response = await apiFetch("/api/v1/users/my-children", { method: "GET" });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const json = await response.json();
      const data: Child[] = json?.success && Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
          ? json
          : [];

      setChildren(data);
    } catch (err: any) {
      setChildren([]);
      setError(err?.message || "Unable to load physiotherapist details.");
      Alert.alert("Error", "Unable to load physiotherapist details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChildPhysioDetails(false);
  }, [fetchChildPhysioDetails]);

  const cards = useMemo(
    () =>
      children.map((child) => {
        const physio = child.physioAssignments?.[0]?.physiotherapist ?? null;
        const status = resolveStatus(physio?.availabilityStatus);
        const nextUnavailable = physio?.unavailableDates?.[0] ?? null;
        return { child, physio, status, nextUnavailable };
      }),
    [children]
  );

  const dashboardStats = useMemo(() => {
    const total = cards.length;
    const assigned = cards.filter((item) => !!item.physio).length;
    const available = cards.filter((item) => item.status === "AVAILABLE").length;
    const inWork = cards.filter((item) => item.status === "IN_WORK").length;
    return { total, assigned, available, inWork };
  }, [cards]);

  const renderHeader = () => (
    <LinearGradient
      colors={["#eff6ff", "#eef2ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerCard}
    >
      <View style={styles.headerTopRow}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="medkit-outline" size={18} color={COLORS.primary} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Physiotherapists</Text>
          <Text style={styles.headerSubtitle}>
            {cards.length > 0
              ? `${cards.length} assigned therapist${cards.length > 1 ? "s" : ""}`
              : "No therapists assigned"}
          </Text>
        </View>
      </View>

      <View style={styles.headerStatsRow}>
        <View style={styles.headerStatChip}>
          <Text style={styles.headerStatValue}>{dashboardStats.total}</Text>
          <Text style={styles.headerStatLabel}>Children</Text>
        </View>
        <View style={styles.headerStatChip}>
          <Text style={styles.headerStatValue}>{dashboardStats.assigned}</Text>
          <Text style={styles.headerStatLabel}>Assigned</Text>
        </View>
        <View style={styles.headerStatChip}>
          <Text style={styles.headerStatValue}>{dashboardStats.available}</Text>
          <Text style={styles.headerStatLabel}>Available</Text>
        </View>
        <View style={styles.headerStatChip}>
          <Text style={styles.headerStatValue}>{dashboardStats.inWork}</Text>
          <Text style={styles.headerStatLabel}>In Work</Text>
        </View>
      </View>
    </LinearGradient>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading therapist details...</Text>
            <Text style={styles.loadingSubtext}>Please wait</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <FlatList
        data={cards}
        keyExtractor={(item) => item.child.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchChildPhysioDetails(true)}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <Animated.View entering={FadeInUp.springify()} style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="medical-outline" size={48} color={COLORS.slate[300]} />
            </View>
            <Text style={styles.emptyTitle}>No Therapists Assigned</Text>
            <Text style={styles.emptyMessage}>
              {error || "Your children's physiotherapists will appear here once assigned."}
            </Text>
            {error && (
              <View style={styles.errorBadge}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={styles.errorBadgeText}>{error}</Text>
              </View>
            )}
          </Animated.View>
        }
        renderItem={({ item, index }) => {
          const status = statusConfig[item.status];
          const hasPhysio = !!item.physio;
          
          return (
            <Animated.View 
              entering={FadeInDown.delay(index * 100).springify()}
              style={styles.cardContainer}
            >
              <LinearGradient
                colors={[COLORS.white, "#f8faff"]}
                style={styles.card}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.childInfo}>
                    <View style={styles.childAvatar}>
                      <Text style={styles.childAvatarText}>
                        {getInitials(item.child.firstName + " " + item.child.lastName)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.childName}>
                        {item.child.firstName} {item.child.lastName}
                      </Text>
                      <Text style={styles.childMeta}>
                        Child • ID: {item.child.id.substring(0, 8)}
                      </Text>
                    </View>
                  </View>

                  {hasPhysio ? (
                    <LinearGradient
                      colors={status.gradient}
                      style={[styles.statusBadge, { borderColor: status.color + "30" }]}
                    >
                      <Ionicons name={status.icon as any} size={14} color={status.color} />
                      <Text style={[styles.statusText, { color: status.color }]}>
                        Physio: {status.label}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.statusBadge, styles.unassignedBadge]}>
                      <Ionicons name="person-outline" size={14} color={COLORS.slate[500]} />
                      <Text style={[styles.statusText, { color: COLORS.slate[500] }]}>Unassigned</Text>
                    </View>
                  )}
                </View>

                {!hasPhysio ? (
                  <View style={styles.noPhysioContainer}>
                    <Ionicons name="person-outline" size={24} color={COLORS.slate[400]} />
                    <Text style={styles.noPhysioText}>No physiotherapist assigned</Text>
                  </View>
                ) : (
                  <>
                    {/* Therapist Info */}
                    <View style={styles.therapistSection}>
                      <View style={styles.therapistHeader}>
                        <View style={styles.therapistAvatar}>
                          <Text style={styles.therapistAvatarText}>
                            {getInitials(item.physio?.name)}
                          </Text>
                        </View>
                        <View style={styles.therapistInfo}>
                          <Text style={styles.therapistName}>{item.physio?.name || "Physiotherapist"}</Text>
                          <Text style={styles.therapistSpecialization}>
                            {item.physio?.specialization || item.physio?.role || "Physiotherapist"}
                          </Text>
                        </View>
                      </View>

                      {/* Availability Info */}
                      <View style={styles.infoGrid}>
                        {item.physio?.availabilityUpdatedAt && (
                          <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={16} color={COLORS.slate[500]} />
                            <Text style={styles.infoLabel}>Last Updated:</Text>
                            <Text style={styles.infoValue}>
                              {formatRelativeTime(item.physio?.availabilityUpdatedAt)}
                            </Text>
                          </View>
                        )}

                        {item.physio?.availabilityNote && (
                          <View style={styles.infoRow}>
                            <Ionicons name="information-circle-outline" size={16} color={COLORS.slate[500]} />
                            <Text style={styles.infoLabel}>Note:</Text>
                            <Text style={styles.infoValue} numberOfLines={2}>
                              {item.physio?.availabilityNote}
                            </Text>
                          </View>
                        )}

                        {item.nextUnavailable?.date && (
                          <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={16} color={COLORS.slate[500]} />
                            <Text style={styles.infoLabel}>Next Off:</Text>
                            <Text style={styles.infoValue}>
                              {formatDate(item.nextUnavailable.date)}
                              {item.nextUnavailable.reason ? ` • ${item.nextUnavailable.reason}` : ""}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Contact Info */}
                      <View style={styles.contactSection}>
                        <Text style={styles.contactTitle}>Contact Information</Text>
                        
                        {item.physio?.phone && (
                          <View style={styles.contactRow}>
                            <View style={[styles.contactIcon, { backgroundColor: COLORS.info + "12" }]}>
                              <Ionicons name="call-outline" size={16} color={COLORS.info} />
                            </View>
                            <Text style={styles.contactValue}>{item.physio?.phone}</Text>
                          </View>
                        )}
                        
                        {item.physio?.email && (
                          <View style={styles.contactRow}>
                            <View style={[styles.contactIcon, { backgroundColor: COLORS.purple + "12" }]}>
                              <Ionicons name="mail-outline" size={16} color={COLORS.purple} />
                            </View>
                            <Text style={styles.contactValue}>{item.physio?.email}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </>
                )}
              </LinearGradient>
            </Animated.View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate[50],
  },
  unassignedBadge: {
    backgroundColor: COLORS.slate[100],
    borderColor: COLORS.slate[200],
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[100],
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.primaryLight + "35",
    padding: 14,
    gap: 10,
  },
  headerTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: COLORS.slate[900],
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[500],
  },
  headerStatsRow: {
    flexDirection: "row",
    gap: 8,
  },
  headerStatChip: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
  },
  headerStatValue: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
    color: COLORS.primary,
  },
  headerStatLabel: {
    fontSize: 10,
    fontFamily: "Poppins-Medium",
    color: COLORS.slate[500],
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 12,
    shadowColor: COLORS.slate[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: COLORS.slate[700],
    marginTop: 8,
  },
  loadingSubtext: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[400],
  },
  listContent: {
    padding: 16,
    paddingBottom: 140,
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
    shadowColor: COLORS.slate[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  childInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  childAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  childAvatarText: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: COLORS.primary,
  },
  childName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.slate[900],
    marginBottom: 2,
  },
  childMeta: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[500],
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
  },
  noPhysioContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
    backgroundColor: COLORS.slate[50],
    borderRadius: 16,
  },
  noPhysioText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[500],
  },
  therapistSection: {
    gap: 16,
  },
  therapistHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[100],
  },
  therapistAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  therapistAvatarText: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: COLORS.secondary,
  },
  therapistInfo: {
    flex: 1,
  },
  therapistName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.slate[900],
    marginBottom: 2,
  },
  therapistSpecialization: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[500],
  },
  infoGrid: {
    backgroundColor: COLORS.slate[50],
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: COLORS.slate[600],
    minWidth: 70,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[700],
  },
  contactSection: {
    gap: 8,
  },
  contactTitle: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: COLORS.slate[600],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  contactValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[800],
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.slate[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.slate[800],
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[500],
    textAlign: "center",
    lineHeight: 20,
  },
  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.danger + "10",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  errorBadgeText: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: COLORS.danger,
  },
});