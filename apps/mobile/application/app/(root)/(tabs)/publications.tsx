import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { LineChart, PieChart } from "react-native-chart-kit";
import useAuthStore from "@/stores/authStore";
import { router } from "expo-router";
import { icons, images } from "@/constants";

const { width: screenWidth } = Dimensions.get("window");

export default function ProgressOverview() {
  const { currentUser, isSignedIn } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState("week");
  const [selectedChild, setSelectedChild] = useState(null);
  const [isPhysiotherapist, setIsPhysiotherapist] = useState(false);

  // Mock children data
  const children = [
    { id: 1, name: "Emma Johnson", age: 8, condition: "Elbow Rehabilitation", image: images.test },
    { id: 2, name: "Noah Smith", age: 10, condition: "Knee Strengthening", image: images.test },
  ];

  // Mock patients data for physiotherapist
  const patients = [
    { id: 1, name: "John Smith", age: 8, condition: "Elbow Rehabilitation", sessions: 12, image: images.test },
    { id: 2, name: "Sarah Wilson", age: 7, condition: "Finger Dexterity", sessions: 8, image: images.test },
    { id: 3, name: "Michael Brown", age: 9, condition: "Shoulder Mobility", sessions: 15, image: images.test },
  ];

  // Mock progress data for parent view
  const childProgressData = {
    week: [65, 70, 72, 75, 78, 80, 82],
    month: [60, 65, 68, 72, 75, 78, 80, 82, 85, 88, 90, 92],
    year: [50, 55, 60, 65, 70, 75, 80, 82, 85, 88, 90, 92],
  };

  // Mock body part progress for parent view
  const bodyPartProgress = [
    { part: "Fingers", progress: 85, color: "#4B9BFF", sessions: 15 },
    { part: "Wrist", progress: 78, color: "#6BCF7F", sessions: 12 },
    { part: "Elbow", progress: 92, color: "#FF6B6B", sessions: 20 },
    { part: "Shoulder", progress: 70, color: "#FFB74D", sessions: 10 },
  ];

  // Mock gaming/play data
  const gamingData = [
    { date: "Today", duration: "45 mins", exercises: 8, score: 95 },
    { date: "Yesterday", duration: "38 mins", exercises: 6, score: 88 },
    { date: "2 days ago", duration: "42 mins", exercises: 7, score: 92 },
  ];

  // Mock analysis insights for parent
  const analysisInsights = [
    { 
      title: "Excellent Progress!", 
      description: "Emma has improved elbow mobility by 40% this week.",
      icon: "trending-up",
      color: "#6BCF7F"
    },
    { 
      title: "Consistency Award", 
      description: "Completed all exercises for 7 days straight!",
      icon: "check-circle",
      color: "#4B9BFF"
    },
    { 
      title: "Focus Area", 
      description: "Wrist exercises need more practice.",
      icon: "warning",
      color: "#FFB74D"
    },
  ];

  // Mock patient overview for physiotherapist
  const patientOverview = [
    { 
      patient: "John Smith", 
      status: "Excellent Progress", 
      lastSession: "Today",
      nextSession: "Tomorrow, 3 PM",
      compliance: 95
    },
    { 
      patient: "Sarah Wilson", 
      status: "Good Progress", 
      lastSession: "Yesterday",
      nextSession: "Dec 20, 10 AM",
      compliance: 85
    },
    { 
      patient: "Michael Brown", 
      status: "Needs Attention", 
      lastSession: "2 days ago",
      nextSession: "Dec 19, 2 PM",
      compliance: 65
    },
  ];

  // Mock played activities for physiotherapist
  const playedActivities = [
    { patient: "John Smith", game: "Finger Flex Challenge", duration: "15 mins", score: 98, date: "Today" },
    { patient: "Sarah Wilson", game: "Wrist Rotation Game", duration: "12 mins", score: 87, date: "Yesterday" },
    { patient: "Michael Brown", game: "Elbow Bend Adventure", duration: "20 mins", score: 72, date: "Today" },
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
      // Check if user is physiotherapist
      const userRole = currentUser?.role || "";
      setIsPhysiotherapist(
        userRole.includes("PHYSIOTHERAPIST") || 
        userRole.includes("DOCTOR") ||
        userRole === "Physiotherapist"
      );
      // Set first child/patient as selected
      setSelectedChild(isPhysiotherapist ? patients[0] : children[0]);
    }, 1000);
  }, [currentUser]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0057FF" />
        <Text style={styles.loadingText}>Loading Progress Data...</Text>
      </View>
    );
  }

  if (!isSignedIn || !currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Please sign in to view progress</Text>
      </View>
    );
  }

  // Chart configuration
  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 87, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#0057FF",
    },
  };

  const chartData = {
    labels: selectedTimeframe === "week" 
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : selectedTimeframe === "month"
      ? ["W1", "W2", "W3", "W4"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [{
      data: selectedTimeframe === "week" ? childProgressData.week :
             selectedTimeframe === "month" ? childProgressData.month :
             childProgressData.year,
      color: (opacity = 1) => `rgba(0, 87, 255, ${opacity})`,
      strokeWidth: 2
    }]
  };

  // Parent View Components
  const ParentProgressView = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Progress Overview</Text>
            <Text style={styles.userName}>{currentUser?.firstName || "Parent"}</Text>
          </View>
          <TouchableOpacity style={styles.shareButton}>
            <MaterialIcons name="share" size={20} color="#0057FF" />
          </TouchableOpacity>
        </View>

        {/* Child Selector */}
        <View style={styles.childSelector}>
          <Text style={styles.sectionTitle}>Select Child</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childScroll}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childCard,
                  selectedChild?.id === child.id && styles.selectedChildCard
                ]}
                onPress={() => setSelectedChild(child)}
              >
                <Image source={child.image} style={styles.childImage} />
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childCondition}>{child.condition}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Today's Gaming Hours */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Gaming Hours</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.gamingCard}>
          <View style={styles.gamingStats}>
            <View style={styles.gamingStat}>
              <MaterialIcons name="timer" size={24} color="#4B9BFF" />
              <Text style={styles.gamingStatValue}>45 mins</Text>
              <Text style={styles.gamingStatLabel}>Duration</Text>
            </View>
            <View style={styles.gamingStat}>
              <MaterialIcons name="fitness" size={24} color="#6BCF7F" />
              <Text style={styles.gamingStatValue}>8</Text>
              <Text style={styles.gamingStatLabel}>Exercises</Text>
            </View>
            <View style={styles.gamingStat}>
              <MaterialIcons name="star" size={24} color="#FFB74D" />
              <Text style={styles.gamingStatValue}>95%</Text>
              <Text style={styles.gamingStatLabel}>Score</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.startGamingButton}>
            <MaterialIcons name="play-arrow" size={20} color="#FFF" />
            <Text style={styles.startGamingText}>Continue Gaming</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Progress Trend</Text>
          <View style={styles.timeframeSelector}>
            {["week", "month", "year"].map((timeframe) => (
              <TouchableOpacity
                key={timeframe}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === timeframe && styles.selectedTimeframeButton
                ]}
                onPress={() => setSelectedTimeframe(timeframe)}
              >
                <Text style={[
                  styles.timeframeText,
                  selectedTimeframe === timeframe && styles.selectedTimeframeText
                ]}>
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      </View>

      {/* Body Part Analysis */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Body Part Analysis</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.analysisGrid}>
          {bodyPartProgress.map((item) => (
            <View key={item.part} style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <View style={[styles.analysisIcon, { backgroundColor: item.color }]}>
                  <MaterialIcons name="accessibility" size={20} color="#FFF" />
                </View>
                <Text style={styles.analysisTitle}>{item.part}</Text>
              </View>
              <Text style={styles.analysisProgress}>{item.progress}%</Text>
              <Text style={styles.analysisSessions}>{item.sessions} sessions</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${item.progress}%`, backgroundColor: item.color }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Insights & Recommendations */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Insights & Recommendations</Text>
          <MaterialIcons name="insights" size={24} color="#0057FF" />
        </View>
        <View style={styles.insightsContainer}>
          {analysisInsights.map((insight, index) => (
            <View key={index} style={styles.insightCard}>
              <View style={[styles.insightIcon, { backgroundColor: insight.color + '20' }]}>
                <MaterialIcons name={insight.icon} size={20} color={insight.color} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Gaming Sessions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Gaming Sessions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>History</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.gamingSessions}>
          {gamingData.map((session, index) => (
            <View key={index} style={styles.gamingSession}>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionDate}>{session.date}</Text>
                <View style={styles.sessionScore}>
                  <MaterialIcons name="star" size={16} color="#FFB74D" />
                  <Text style={styles.sessionScoreText}>{session.score}%</Text>
                </View>
              </View>
              <View style={styles.sessionDetails}>
                <View style={styles.sessionDetail}>
                  <MaterialIcons name="timer" size={14} color="#666" />
                  <Text style={styles.sessionDetailText}>{session.duration}</Text>
                </View>
                <View style={styles.sessionDetail}>
                  <MaterialIcons name="fitness" size={14} color="#666" />
                  <Text style={styles.sessionDetailText}>{session.exercises} exercises</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // Physiotherapist View Components
  const PhysiotherapistProgressView = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Patient Progress</Text>
            <Text style={styles.userName}>Dr. {currentUser?.lastName || "Therapist"}</Text>
          </View>
          <TouchableOpacity style={styles.reportButton}>
            <MaterialIcons name="description" size={20} color="#0057FF" />
            <Text style={styles.reportButtonText}>Generate Report</Text>
          </TouchableOpacity>
        </View>

        {/* Patient Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{patients.length}</Text>
            <Text style={styles.statLabel}>Active Patients</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>Avg. Compliance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
        </View>
      </View>

      {/* Patient Overview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Patient Overview</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>All Patients</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.patientsContainer}>
          {patientOverview.map((patient, index) => (
            <TouchableOpacity key={index} style={styles.patientCard}>
              <View style={styles.patientHeader}>
                <Image source={images.test} style={styles.patientImage} />
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.patient}</Text>
                  <Text style={styles.patientStatus}>{patient.status}</Text>
                </View>
                <View style={[
                  styles.complianceBadge,
                  patient.compliance >= 90 && styles.excellentCompliance,
                  patient.compliance < 90 && patient.compliance >= 70 && styles.goodCompliance,
                  patient.compliance < 70 && styles.needsAttentionCompliance
                ]}>
                  <Text style={styles.complianceText}>{patient.compliance}%</Text>
                </View>
              </View>
              <View style={styles.patientDetails}>
                <View style={styles.patientDetail}>
                  <MaterialIcons name="history" size={14} color="#666" />
                  <Text style={styles.patientDetailText}>Last: {patient.lastSession}</Text>
                </View>
                <View style={styles.patientDetail}>
                  <MaterialIcons name="schedule" size={14} color="#666" />
                  <Text style={styles.patientDetailText}>Next: {patient.nextSession}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recently Played Activities */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Game Activities</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activitiesContainer}>
          {playedActivities.map((activity, index) => (
            <View key={index} style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <View style={styles.activityPatient}>
                  <Image source={images.test} style={styles.activityPatientImage} />
                  <View>
                    <Text style={styles.activityPatientName}>{activity.patient}</Text>
                    <Text style={styles.activityGame}>{activity.game}</Text>
                  </View>
                </View>
                <View style={styles.activityScore}>
                  <Text style={styles.activityScoreText}>{activity.score}%</Text>
                  <MaterialIcons name="star" size={16} color="#FFB74D" />
                </View>
              </View>
              <View style={styles.activityDetails}>
                <View style={styles.activityDetail}>
                  <MaterialIcons name="timer" size={14} color="#666" />
                  <Text style={styles.activityDetailText}>{activity.duration}</Text>
                </View>
                <Text style={styles.activityDate}>{activity.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Compliance Analytics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compliance Analytics</Text>
        <View style={styles.complianceChart}>
          <PieChart
            data={[
              { name: "Excellent", population: 45, color: "#6BCF7F", legendFontColor: "#333" },
              { name: "Good", population: 35, color: "#4B9BFF", legendFontColor: "#333" },
              { name: "Needs Attention", population: 20, color: "#FF6B6B", legendFontColor: "#333" },
            ]}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIcon, { backgroundColor: "#E3F2FD" }]}>
              <MaterialIcons name="assignment" size={24} color="#2196F3" />
            </View>
            <Text style={styles.quickActionText}>Add Exercise</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIcon, { backgroundColor: "#E8F5E9" }]}>
              <MaterialIcons name="schedule" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.quickActionText}>Schedule Session</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIcon, { backgroundColor: "#FFF3E0" }]}>
              <MaterialIcons name="analytics" size={24} color="#FF9800" />
            </View>
            <Text style={styles.quickActionText}>Detailed Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIcon, { backgroundColor: "#F3E5F5" }]}>
              <MaterialIcons name="message" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.quickActionText}>Message Parents</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return isPhysiotherapist ? <PhysiotherapistProgressView /> : <ParentProgressView />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  header: {
    backgroundColor: "#0057FF",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: "Poppins-Regular",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    fontFamily: "Poppins-Bold",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  reportButtonText: {
    color: "#0057FF",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    fontFamily: "Poppins-Bold",
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
    fontFamily: "Poppins-Regular",
  },
  childSelector: {
    marginTop: 20,
  },
  childScroll: {
    marginTop: 10,
  },
  childCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginRight: 10,
    width: 220,
  },
  selectedChildCard: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "#fff",
  },
  childImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "Poppins-SemiBold",
  },
  childCondition: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    fontFamily: "Poppins-Bold",
  },
  seeAllText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
  },
  gamingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  gamingStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  gamingStat: {
    alignItems: "center",
  },
  gamingStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 8,
    fontFamily: "Poppins-Bold",
  },
  gamingStatLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontFamily: "Poppins-Regular",
  },
  startGamingButton: {
    backgroundColor: "#0057FF",
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startGamingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
  },
  timeframeSelector: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    padding: 4,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedTimeframeButton: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeframeText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
  },
  selectedTimeframeText: {
    color: "#0057FF",
    fontWeight: "600",
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chart: {
    borderRadius: 16,
  },
  analysisGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  analysisCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  analysisHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  analysisIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    fontFamily: "Poppins-SemiBold",
  },
  analysisProgress: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
    fontFamily: "Poppins-Bold",
  },
  analysisSessions: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 8,
    fontFamily: "Poppins-Regular",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  insightsContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
    fontFamily: "Poppins-SemiBold",
  },
  insightDescription: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
  },
  gamingSessions: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  gamingSession: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    fontFamily: "Poppins-SemiBold",
  },
  sessionScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sessionScoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b",
    fontFamily: "Poppins-SemiBold",
  },
  sessionDetails: {
    flexDirection: "row",
    gap: 16,
  },
  sessionDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sessionDetailText: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
  },
  // Physiotherapist specific styles
  patientsContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  patientCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  patientHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  patientImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    fontFamily: "Poppins-SemiBold",
  },
  patientStatus: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  complianceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  excellentCompliance: {
    backgroundColor: "#E8F5E9",
  },
  goodCompliance: {
    backgroundColor: "#E3F2FD",
  },
  needsAttentionCompliance: {
    backgroundColor: "#FFEBEE",
  },
  complianceText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
  },
  patientDetails: {
    flexDirection: "row",
    gap: 16,
  },
  patientDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  patientDetailText: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
  },
  activitiesContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  activityCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  activityPatient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activityPatientImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  activityPatientName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
    fontFamily: "Poppins-SemiBold",
  },
  activityGame: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
  },
  activityScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activityScoreText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
    fontFamily: "Poppins-Bold",
  },
  activityDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activityDetailText: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
  },
  activityDate: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "Poppins-Regular",
  },
  complianceChart: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: "#1e293b",
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "Poppins-SemiBold",
  },
});