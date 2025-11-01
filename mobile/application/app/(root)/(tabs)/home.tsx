import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import useAuthStore from "@/stores/authStore";

const Home = () => {
  const { currentUser, signOut } = useAuthStore();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/onBoard1");
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.userName}>
            {currentUser?.fullName || "User"}
          </Text>
        </View>
        
        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Hello, {currentUser?.fullName || "there"}! 👋</Text>
          <Text style={styles.welcomeSubtitle}>
            Welcome to Learn APP. Start your learning journey today.
          </Text>
        </View>

        {/* Add your home screen content here */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Your Dashboard</Text>
          
          <View style={styles.featureCard}>
            <Ionicons name="book-outline" size={32} color="#3b82f6" />
            <Text style={styles.featureTitle}>Courses</Text>
            <Text style={styles.featureDescription}>
              Explore available courses and start learning
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="stats-chart-outline" size={32} color="#10b981" />
            <Text style={styles.featureTitle}>Progress</Text>
            <Text style={styles.featureDescription}>
              Track your learning progress and achievements
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="person-outline" size={32} color="#8b5cf6" />
            <Text style={styles.featureTitle}>Profile</Text>
            <Text style={styles.featureDescription}>
              Manage your account and personal information
            </Text>
          </View>
        </View>

        {/* User Info Card */}
        <View style={styles.userInfoCard}>
          <Text style={styles.userInfoTitle}>Account Information</Text>
          <View style={styles.userInfoItem}>
            <Text style={styles.userInfoLabel}>Full Name:</Text>
            <Text style={styles.userInfoValue}>{currentUser?.fullName || "N/A"}</Text>
          </View>
          <View style={styles.userInfoItem}>
            <Text style={styles.userInfoLabel}>Email:</Text>
            <Text style={styles.userInfoValue}>{currentUser?.email || "N/A"}</Text>
          </View>
          <View style={styles.userInfoItem}>
            <Text style={styles.userInfoLabel}>User Type:</Text>
            <Text style={styles.userInfoValue}>{currentUser?.userType || "N/A"}</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  welcomeText: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    fontFamily: "Poppins-SemiBold",
    marginTop: 2,
  },
  signOutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
  },
  content: {
    flex: 1,
  },
  welcomeContainer: {
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    fontFamily: "Poppins-Bold",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
    lineHeight: 22,
  },
  featuresContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    fontFamily: "Poppins-SemiBold",
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    fontFamily: "Poppins-SemiBold",
    marginTop: 12,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
    lineHeight: 20,
  },
  userInfoCard: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    fontFamily: "Poppins-SemiBold",
    marginBottom: 16,
  },
  userInfoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  userInfoLabel: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
  },
  userInfoValue: {
    fontSize: 14,
    color: "#1e293b",
    fontFamily: "Poppins-Medium",
  },
});

export default Home;