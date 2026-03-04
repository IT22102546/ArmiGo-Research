import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import useAuthStore from "@/stores/authStore";
import { apiFetch } from "@/utils/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const extractData = (payload: any) =>
  payload?.success && payload?.data ? payload.data : payload;

type ProgressTracker = {
  startProgress?: number;
  currentProgress?: number;
  playTimeMinutes?: number;
  fingerProgress?: number;
  wristProgress?: number;
  elbowProgress?: number;
  shoulderProgress?: number;
};

type ChildData = {
  id: string;
  firstName?: string;
  lastName?: string;
  exerciseFingers?: boolean;
  exerciseWrist?: boolean;
  exerciseElbow?: boolean;
  exerciseShoulder?: boolean;
  playTimeMinutes?: number;
  playHours?: number;
  progressTracker?: ProgressTracker;
};

const EXERCISE_DETAILS: {
  key: string;
  flag: keyof ChildData;
  progressKey: keyof ProgressTracker;
  label: string;
  icon: "hand-left-outline" | "hand-right-outline" | "fitness-outline" | "body-outline";
  color: string;
  gradient: [string, string];
  bg: string;
  description: string;
}[] = [
  {
    key: "fingers",
    flag: "exerciseFingers",
    progressKey: "fingerProgress",
    label: "Fingers",
    icon: "hand-left-outline",
    color: "#6366F1",
    gradient: ["#6366F1", "#818CF8"],
    bg: "#eef2ff",
    description: "Fine motor skills and finger dexterity exercises",
  },
  {
    key: "wrist",
    flag: "exerciseWrist",
    progressKey: "wristProgress",
    label: "Wrist",
    icon: "hand-right-outline",
    color: "#8b5cf6",
    gradient: ["#8b5cf6", "#a78bfa"],
    bg: "#f5f3ff",
    description: "Wrist flexibility and range of motion exercises",
  },
  {
    key: "elbow",
    flag: "exerciseElbow",
    progressKey: "elbowProgress",
    label: "Elbow",
    icon: "fitness-outline",
    color: "#f59e0b",
    gradient: ["#f59e0b", "#fbbf24"],
    bg: "#fffbeb",
    description: "Elbow joint strengthening and movement exercises",
  },
  {
    key: "shoulder",
    flag: "exerciseShoulder",
    progressKey: "shoulderProgress",
    label: "Shoulder",
    icon: "body-outline",
    color: "#ec4899",
    gradient: ["#ec4899", "#f472b6"],
    bg: "#fdf2f8",
    description: "Shoulder mobility and rehabilitation exercises",
  },
];

const ProgressBar = ({ progress, color, height = 10 }: { progress: number; color: string; height?: number }) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  return (
    <View style={[styles.progressBarBg, { height }]}>
      <LinearGradient
        colors={[color, color + "cc"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.progressBarFill, { width: `${clampedProgress}%` as any, height }]}
      />
    </View>
  );
};

const ExerciseProgressScreen = () => {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { currentUser, isSignedIn } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [childData, setChildData] = useState<ChildData | null>(null);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!isSignedIn || !currentUser) {
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await apiFetch("/api/v1/users/my-children", { method: "GET" });
        if (res?.ok) {
          const json = await res.json();
          const rows: ChildData[] = extractData(json) || [];
          if (Array.isArray(rows)) {
            const match = childId
              ? rows.find((c) => c.id === childId) || rows[0]
              : rows[0];
            if (match) setChildData(match);
          }
        }
      } catch {
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [childId, currentUser, isSignedIn]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tracker = childData?.progressTracker;
  const startProg = tracker?.startProgress ?? 0;
  const currentProg = tracker?.currentProgress ?? 0;
  const overallProgress = Math.min(100, Math.max(0, currentProg));
  const improvement = currentProg - startProg;
  const enabledExercises = EXERCISE_DETAILS.filter(
    (ex) => !!(childData as any)?.[ex.flag]
  );
  const childName = childData
    ? `${childData.firstName || ""} ${childData.lastName || ""}`.trim()
    : "";

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!childData || enabledExercises.length === 0) {
    return (
      <View style={styles.loaderWrap}>
        <Ionicons name="barbell-outline" size={48} color="#cbd5e1" />
        <Text style={styles.emptyTitle}>No Exercises Assigned</Text>
        <Text style={styles.emptySubtitle}>
          Your child does not have any exercises assigned yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            colors={["#6366F1"]}
            tintColor="#6366F1"
          />
        }
      >
        {/* Overall Progress Header */}
        <LinearGradient
          colors={["#4338CA", "#6366F1", "#818CF8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <View style={styles.headerDecor1} />
          <View style={styles.headerDecor2} />

          {childName ? (
            <Text style={styles.headerChildName}>{childName}'s Progress</Text>
          ) : (
            <Text style={styles.headerChildName}>Exercise Progress</Text>
          )}

          <View style={styles.overallRow}>
            <View style={styles.overallCircle}>
              <Text style={styles.overallValue}>{overallProgress.toFixed(0)}%</Text>
              <Text style={styles.overallLabel}>Overall</Text>
            </View>
            <View style={styles.overallStats}>
              <View style={styles.overallStatItem}>
                <Text style={styles.overallStatValue}>{startProg.toFixed(1)}%</Text>
                <Text style={styles.overallStatLabel}>Start</Text>
              </View>
              <View style={styles.overallStatItem}>
                <Text style={styles.overallStatValue}>{currentProg.toFixed(1)}%</Text>
                <Text style={styles.overallStatLabel}>Current</Text>
              </View>
              <View style={styles.overallStatItem}>
                <Text
                  style={[
                    styles.overallStatValue,
                    { color: improvement >= 0 ? "#34d399" : "#f87171" },
                  ]}
                >
                  {improvement >= 0 ? "+" : ""}
                  {improvement.toFixed(1)}%
                </Text>
                <Text style={styles.overallStatLabel}>Change</Text>
              </View>
            </View>
          </View>

          <ProgressBar progress={overallProgress} color="#34d399" height={8} />

          {(childData.playTimeMinutes ?? 0) > 0 && (
            <View style={styles.headerPlayTime}>
              <Ionicons name="time-outline" size={14} color="#c7d2fe" />
              <Text style={styles.headerPlayTimeText}>
                Total play time: {childData.playHours ?? 0}h (
                {childData.playTimeMinutes ?? 0} min)
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Exercise Cards */}
        <Text style={styles.sectionTitle}>Exercise Breakdown</Text>

        {enabledExercises.map((ex) => {
          const exerciseProgress =
            (tracker as any)?.[ex.progressKey] ?? currentProg;
          const exerciseImprovement = exerciseProgress - startProg;

          return (
            <View key={ex.key} style={styles.exerciseDetailCard}>
              <View style={styles.exerciseDetailTop}>
                <View style={[styles.exerciseDetailIcon, { backgroundColor: ex.bg }]}>
                  <Ionicons name={ex.icon} size={28} color={ex.color} />
                </View>
                <View style={styles.exerciseDetailInfo}>
                  <Text style={styles.exerciseDetailLabel}>{ex.label}</Text>
                  <Text style={styles.exerciseDetailDesc}>{ex.description}</Text>
                </View>
              </View>

              {/* Progress metrics */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Start</Text>
                  <Text style={styles.metricValue}>{startProg.toFixed(1)}%</Text>
                </View>
                <View style={[styles.metricItem, styles.metricItemCenter]}>
                  <Text style={styles.metricLabel}>Current</Text>
                  <Text style={[styles.metricValue, { color: ex.color }]}>
                    {exerciseProgress.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Change</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      {
                        color: exerciseImprovement >= 0 ? "#10b981" : "#ef4444",
                      },
                    ]}
                  >
                    {exerciseImprovement >= 0 ? "+" : ""}
                    {exerciseImprovement.toFixed(1)}%
                  </Text>
                </View>
              </View>

              <ProgressBar
                progress={Math.min(100, Math.max(0, exerciseProgress))}
                color={ex.color}
              />

              <View style={styles.exerciseStatusRow}>
                <View style={[styles.exerciseStatusDot, { backgroundColor: ex.color }]} />
                <Text style={styles.exerciseStatusText}>Active Exercise</Text>
              </View>
            </View>
          );
        })}

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={["#f0fdf4", "#ecfdf5"]}
            style={styles.summaryGradient}
          >
            <Ionicons name="trending-up" size={24} color="#10b981" />
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryTitle}>Progress Summary</Text>
              <Text style={styles.summaryText}>
                {enabledExercises.length} active exercise
                {enabledExercises.length > 1 ? "s" : ""} assigned
                {improvement > 0
                  ? `. Overall improvement of ${improvement.toFixed(1)}% since starting.`
                  : ". Keep up the great work!"}
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 8 },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 16,
    fontFamily: "Poppins-Bold",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
    fontFamily: "Poppins-Regular",
  },

  /* header card */
  headerCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    overflow: "hidden",
  },
  headerDecor1: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -40,
    right: -30,
  },
  headerDecor2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -20,
    left: -20,
  },
  headerChildName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Poppins-Bold",
    marginBottom: 16,
  },
  overallRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  overallCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  overallValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "Poppins-Bold",
  },
  overallLabel: {
    fontSize: 10,
    color: "#c7d2fe",
    fontFamily: "Poppins-Regular",
  },
  overallStats: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  overallStatItem: { alignItems: "center" },
  overallStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Poppins-Bold",
  },
  overallStatLabel: {
    fontSize: 11,
    color: "#c7d2fe",
    fontFamily: "Poppins-Regular",
    marginTop: 2,
  },
  headerPlayTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  headerPlayTimeText: {
    fontSize: 12,
    color: "#c7d2fe",
    fontFamily: "Poppins-Regular",
  },

  /* progress bar */
  progressBarBg: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    overflow: "hidden",
    width: "100%",
  },
  progressBarFill: {
    borderRadius: 6,
  },

  /* section */
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: "Poppins-Bold",
    marginBottom: 12,
  },

  /* exercise detail card */
  exerciseDetailCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  exerciseDetailTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  exerciseDetailIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseDetailInfo: {
    flex: 1,
    marginLeft: 12,
  },
  exerciseDetailLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: "Poppins-Bold",
  },
  exerciseDetailDesc: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
    marginTop: 2,
  },

  /* metrics */
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
  },
  metricItem: { alignItems: "center", flex: 1 },
  metricItemCenter: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#e2e8f0",
  },
  metricLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontFamily: "Poppins-Regular",
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: "Poppins-Bold",
  },

  /* exercise status */
  exerciseStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  exerciseStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  exerciseStatusText: {
    fontSize: 11,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
  },

  /* summary */
  summaryCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
  },
  summaryGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  summaryTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
    fontFamily: "Poppins-Bold",
  },
  summaryText: {
    fontSize: 12,
    color: "#15803d",
    fontFamily: "Poppins-Regular",
    marginTop: 2,
  },
});

export default ExerciseProgressScreen;
