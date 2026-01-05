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

  // Dummy data for upcoming schedules with images
  const upcomingSchedules = [
    {
      id: 1,
      courseTitle: "INTRODUCTION TO MICROBIOLOGY",
      scheduleTitle: "Microbiology Introduction",
      date: "12th June 2025",
      time: "3:00 pm - 5:00 pm",
      instructor: "Dr. Sarah Johnson",
      image: images.test, // Using test image as example
    },
    {
      id: 2,
      courseTitle: "ADVANCED BIOCHEMISTRY",
      scheduleTitle: "Protein Structure Analysis",
      date: "15th June 2025",
      time: "10:00 am - 12:00 pm",
      instructor: "Dr. Michael Chen",
      image: images.test,
    },
    {
      id: 3,
      courseTitle: "CELL BIOLOGY",
      scheduleTitle: "Cell Division Process",
      date: "18th June 2025",
      time: "2:00 pm - 4:00 pm",
      instructor: "Dr. Emily Rodriguez",
      image: images.test,
    },
    {
      id: 4,
      courseTitle: "GENETICS",
      scheduleTitle: "Mendelian Inheritance",
      date: "20th June 2025",
      time: "11:00 am - 1:00 pm",
      instructor: "Dr. James Wilson",
      image: images.test,
    },
    {
      id: 5,
      courseTitle: "IMMUNOLOGY",
      scheduleTitle: "Immune System Response",
      date: "25th June 2025",
      time: "4:00 pm - 6:00 pm",
      instructor: "Dr. Lisa Thompson",
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
          <View className="flex flex-row justify-between">
            <Text style={styles.welcomeText}>Welcome Back</Text>
          </View>
          <Text style={styles.userName}>
            {currentUser?.firstName + " " + currentUser?.lastName ||
              "Randy Wigham"}
          </Text>
        </View>

        {/* Search Bar on Blue Background */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search ....."
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
                <View style={styles.quickAccessIconContainer}>
                  <Image
                    source={icons.home_book}
                    style={styles.quickAccessIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.quickAccessText}>Exams</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessItem}
              onPress={() => router.push("/(root)/(tabs)/publications")}
            >
              <View style={styles.quickAccessCard}>
                <View style={styles.quickAccessIconContainer}>
                  <Image
                    source={icons.home_publication}
                    style={styles.quickAccessIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.quickAccessText}>Publications</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Schedules Section - Changed to Horizontal Scroll */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Schedules</Text>
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
                </View>

                <Text style={styles.courseTitle}>{schedule.courseTitle}</Text>
                <Text style={styles.scheduleTitle}>
                  {schedule.scheduleTitle}
                </Text>

                <View
                  className="gap-4 flex flex-row"
                  style={styles.scheduleDetails}
                >
                  <View style={styles.scheduleTime}>
                    <Image source={icons.calender} style={styles.inputIcon} />
                    <Text style={styles.scheduleText}>{schedule.date}</Text>
                  </View>
                  <View style={styles.scheduleTime}>
                    <Image source={icons.clock} style={styles.inputIcon} />
                    <Text style={styles.scheduleText}>{schedule.time}</Text>
                  </View>
                </View>

                <View style={styles.instructorContainer}>
                  <Image source={icons.nav_user} style={styles.inputIcon} />
                  <Text style={styles.instructorText}>
                    {schedule.instructor}
                  </Text>
                </View>

                <TouchableOpacity style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>Join Seminar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
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
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  welcomeContainer: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1e293b",
  },
  notificationButton: {
    right: 5,
    width: 25,
    height: 25,
    color: "#fff",
  },
  content: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    padding: 20,
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
    marginBottom: 14,
  },
  seeAllText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "600",
  },
  horizontalScrollContent: {
    paddingRight: 20,
  },
  quickAccessContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  quickAccessItem: {
    flex: 1,
  },
  quickAccessCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAccessIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#005CFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickAccessIcon: {
    width: 30,
    height: 30,
    tintColor: "#fff",
  },
  quickAccessText: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "600",
    textAlign: "center",
  },
  scheduleCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 280,
    marginRight: 16,
  },
  scheduleImageContainer: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#f1f5f9", // Light background for image container
  },
  scheduleImage: {
    width: "100%",
    height: "100%",
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3b82f6",
    marginBottom: 4,
    lineHeight: 18,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
    lineHeight: 20,
  },
  scheduleDetails: {
    marginBottom: 8,
  },
  scheduleTime: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  scheduleText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 6,
  },
  instructorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  instructorText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 6,
  },
  joinButton: {
    backgroundColor: "#005CFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: "center",
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  inputIcon: {
    width: 16,
    height: 16,
    tintColor: "#3b82f6",
    marginRight: 2,
  },
});

export default Home;













