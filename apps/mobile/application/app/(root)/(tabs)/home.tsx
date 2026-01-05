import React from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import useAuthStore from "@/stores/authStore";
import { icons, images } from "@/constants";

const Home = () => {
  const { currentUser, signOut } = useAuthStore();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/onBoard1");
        },
      },
    ]);
  };

  // Dummy data for upcoming schedules (physiotherapy focused)
  const upcomingSchedules = [
    {
      id: 1,
      courseTitle: "Elbow Rehabilitation",
      scheduleTitle: "Elbow Rehabilitation",
      date: "12th June 2025",
      time: "3:00 pm - 3:15 pm",
      instructor: "Dr. Sarah Johnson",
      image: images.test,
    },
    {
      id: 2,
      courseTitle: "Finger Rehabilitation",
      scheduleTitle: "Finger Rehabilitation",
      date: "12th June 2025",
      time: "3:30 pm - 4:00 pm",
      instructor: "Dr. Sarah Johnson",
      image: images.test,
    },
    {
      id: 3,
      courseTitle: "Knee Strengthening",
      scheduleTitle: "Knee Strengthening",
      date: "15th June 2025",
      time: "10:00 am - 10:45 am",
      instructor: "Dr. Michael Chen",
      image: images.test,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      {/* Custom Status Bar */}
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0057FF"
        translucent={false}
      />

      {/* System Status Bar Area (for battery, signal, etc.) */}
      <View style={styles.systemStatusBar} />

      {/* Blue Header Area with Rounded Bottom */}
      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.userName}>{currentUser?.firstName + " " + currentUser?.lastName || "Randy Perera"}</Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              {/* Notification Button with Better Styling */}
              <TouchableOpacity 
                style={styles.notificationButton} 
                onPress={() => router.push("/(root)/(tabs)/notifications")}
              >
                <View style={styles.notificationIconContainer}>
                  <Ionicons name="notifications-outline" size={22} color="#fff" />
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>3</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Profile Avatar with Better Styling */}
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => router.push("/(root)/(tabs)/profile")}
              >
                {currentUser?.profilePicture ? (
                  <Image 
                    source={{ uri: currentUser.profilePicture }} 
                    style={styles.profileAvatar}
                  />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Text style={styles.profileInitials}>
                      {currentUser?.firstName?.[0] || "R"}{currentUser?.lastName?.[0] || "P"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search Bar on Blue Background */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises, therapists..."
              placeholderTextColor="#64748b"
            />
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Access Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessContainer}>
            <TouchableOpacity
              style={styles.quickAccessItem}
              onPress={() => router.push("/(root)/(tabs)/exams")}
            >
              <View style={styles.quickAccessCard}>
                <View style={[styles.quickAccessIconContainer, { backgroundColor: "#4B9BFF" }]}>
                  <Image
                    source={icons.home_book}
                    style={styles.quickAccessIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.quickAccessText}>Exercises</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessItem}
              onPress={() => router.push("/(root)/(tabs)/publications")}
            >
              <View style={styles.quickAccessCard}>
                <View style={[styles.quickAccessIconContainer, { backgroundColor: "#FF6B6B" }]}>
                  <Image
                    source={icons.home_publication}
                    style={styles.quickAccessIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.quickAccessText}>Progress</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessItem}
              onPress={() => router.push("/(root)/(tabs)/schedule")}
            >
              <View style={styles.quickAccessCard}>
                <View style={[styles.quickAccessIconContainer, { backgroundColor: "#6BCF7F" }]}>
                  <Ionicons name="calendar-outline" size={28} color="#fff" />
                </View>
                <Text style={styles.quickAccessText}>Schedule</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Schedules Section - Changed to Horizontal Scroll */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {upcomingSchedules.map((schedule) => (
              <View key={schedule.id} style={styles.scheduleCard}>
                {/* Schedule Image */}
                <View style={styles.scheduleImageContainer}>
                  <Image
                    source={schedule.image}
                    style={styles.scheduleImage}
                    resizeMode="cover"
                  />
                  <View style={styles.scheduleImageOverlay} />
                </View>

                <View style={styles.scheduleContent}>
                  <View style={styles.scheduleHeader}>
                    <Text style={styles.courseTitle}>{schedule.courseTitle}</Text>
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>Live in 2h</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.scheduleTitle}>
                    {schedule.scheduleTitle}
                  </Text>

                  <View style={styles.scheduleDetails}>
                    <View style={styles.scheduleTime}>
                      <Ionicons name="calendar-outline" size={14} color="#64748b" />
                      <Text style={styles.scheduleText}>{schedule.date}</Text>
                    </View>
                    <View style={styles.scheduleTime}>
                      <Ionicons name="time-outline" size={14} color="#64748b" />
                      <Text style={styles.scheduleText}>{schedule.time}</Text>
                    </View>
                  </View>

                  <View style={styles.instructorContainer}>
                    <Ionicons name="person-outline" size={14} color="#64748b" />
                    <Text style={styles.instructorText}>
                      {schedule.instructor}
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.joinButton}>
                    <Text style={styles.joinButtonText}>Join Session</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityContainer}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="checkmark-circle" size={20} color="#2196F3" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Elbow Exercise Completed</Text>
                <Text style={styles.activityTime}>10 minutes ago</Text>
              </View>
              <Text style={styles.activityScore}>+5 pts</Text>
            </View>
            
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="trending-up" size={20} color="#4CAF50" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Progress Improved by 15%</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
              <Text style={styles.activityScore}>+10 pts</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  systemStatusBar: {
    backgroundColor: "#3b82f6",
    height: 0,
  },
  header: {
    backgroundColor: "#0057FF",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeContainer: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
    fontFamily: "Poppins-Regular",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
    fontFamily: "Poppins-Bold",
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1e293b",
    fontFamily: "Poppins-Regular",
  },
  notificationButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  notificationIconContainer: {
    position: "relative",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#0057FF",
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
  },
  profileButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  profileInitials: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
  },
  content: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    paddingBottom: 100,
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
    fontSize: 20,
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
  horizontalScrollContent: {
    paddingRight: 20,
  },
  quickAccessContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  quickAccessItem: {
    flex: 1,
  },
  quickAccessCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  quickAccessIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickAccessIcon: {
    width: 28,
    height: 28,
    tintColor: "#fff",
  },
  quickAccessText: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "Poppins-SemiBold",
  },
  scheduleCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    width: 300,
    marginRight: 16,
    overflow: "hidden",
  },
  scheduleImageContainer: {
    width: "100%",
    height: 140,
    position: "relative",
  },
  scheduleImage: {
    width: "100%",
    height: "100%",
  },
  scheduleImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 87, 255, 0.1)",
  },
  scheduleContent: {
    padding: 16,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3b82f6",
    fontFamily: "Poppins-SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF3B30",
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    color: "#FF3B30",
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
    fontFamily: "Poppins-Bold",
    lineHeight: 24,
  },
  scheduleDetails: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 16,
  },
  scheduleTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scheduleText: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
  },
  instructorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 4,
  },
  instructorText: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
  },
  joinButton: {
    backgroundColor: "#0057FF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
  },
  activityContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "Poppins-Regular",
  },
  activityScore: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
  },
});

export default Home;