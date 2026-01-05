// Profile.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import useAuthStore from "@/stores/authStore";
import { icons } from "@/constants";
import { apiFetch } from "@/utils/api";
import * as SecureStore from "expo-secure-store";

const Profile = () => {
  const { currentUser, signOut, userupdate } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch fresh user data from API
  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      console.log("🔍 Fetching profile with JWT token...");

      // Check if we have a token first
      const accessToken = await SecureStore.getItemAsync("access_token");
      if (!accessToken) {
        console.log("❌ No access token found");
        Alert.alert(
          "Authentication Required",
          "Please sign in again to access your profile.",
          [
            {
              text: "Sign In",
              onPress: () => router.replace("/(auth)/selectSignIn"),
            },
          ]
        );
        return;
      }

      const response = await apiFetch("/api/v1/users/profile", {
        method: "GET",
      });

      console.log("📡 Profile Response Status:", response.status);

      if (response.status === 401) {
        console.log("🔐 Authentication failed - token invalid or expired");
        // Clear stored tokens
        await SecureStore.deleteItemAsync("access_token");
        await SecureStore.deleteItemAsync("refresh_token");

        Alert.alert(
          "Session Expired",
          "Your session has expired. Please sign in again.",
          [
            {
              text: "Sign In",
              onPress: () => router.replace("/(auth)/selectSignIn"),
            },
          ]
        );
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log("✅ Profile data received:", apiResponse);

      // ✅ FIX: Pass the data object, not the whole response
      if (apiResponse.success && apiResponse.data) {
        userupdate(apiResponse.data);
        console.log("🔄 Updated auth store with user data");
      } else {
        console.error("❌ Invalid API response structure:", apiResponse);
      }
    } catch (error: any) {
      console.error("❌ Profile fetch error:", error);

      if (
        error.message.includes("401") ||
        error.message.includes("Authentication")
      ) {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please sign in again.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/selectSignIn") }]
        );
      } else {
        Alert.alert("Error", "Failed to load profile data. Please try again.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchUserProfile();
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          // Clear SecureStore tokens
          await SecureStore.deleteItemAsync("access_token");
          await SecureStore.deleteItemAsync("refresh_token");
          await signOut();
          router.replace("/(auth)/selectSignIn");
        },
      },
    ]);
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime())
        ? "Invalid date"
        : date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
    } catch {
      return "Invalid date";
    }
  };

  // Get user data with proper field mapping
  const getUserData = () => {
    if (!currentUser) return null;

    console.log("🔍 Current user data in store:", currentUser);
    console.log("🔍 Zone value:", currentUser.zone);

    return {
      firstName: currentUser.firstName || "Not set",
      lastName: currentUser.lastName || "Not set",
      email: currentUser.email || "Not set",
      phone: currentUser.phone || "Not set",
      role: currentUser.role || "Not set",
      dateOfBirth: currentUser.dateOfBirth || null,
      joinDate: currentUser.createdAt || currentUser.joinDate || new Date(),
      district: currentUser.district?.name || "Not set",
      // ✅ FIX: Check if zone exists and is not null/undefined
      zone: currentUser.zone ? currentUser.zone : "Not set",
    };
  };

  const userData = getUserData();
  console.log("🔍 Processed user data for display:", userData);
  console.log("🔍 Zone in processed data:", userData?.zone);

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container} edges={["right", "left"]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#3b82f6"
          translucent={false}
        />
        <View style={styles.systemStatusBar} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No user data found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchUserProfile}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: "#64748b", marginTop: 8 },
            ]}
            onPress={() => router.replace("/home")}
          >
            <Text style={styles.retryButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#fff"
        translucent={false}
      />

      <View style={styles.systemStatusBar} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#fff"]}
            tintColor="#fff"
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {currentUser.avatar ? (
              <Image
                source={{ uri: currentUser.avatar }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={40} color="#3b82f6" />
            )}
          </View>
          <Text style={styles.userName}>
            {userData?.firstName} {userData?.lastName}
          </Text>
          <Text style={styles.userRole}>
            {userData?.role?.replace("_", " ").toLowerCase()}
          </Text>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push("/update_profile")}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Image source={icons.nav_user} style={styles.inputIcon} />
                <Text style={styles.detailLabel}>Name</Text>
              </View>
              <Text style={styles.detailValue}>
                {userData?.firstName} {userData?.lastName}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Image source={icons.emailFill} style={styles.inputIcon} />
                <Text style={styles.detailLabel}>Email</Text>
              </View>
              <Text style={styles.detailValue}>{userData?.email}</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Image source={icons.phoneFill} style={styles.inputIcon} />
                <Text style={styles.detailLabel}>Contact</Text>
              </View>
              <Text style={styles.detailValue}>{userData?.phone}</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Image source={icons.calender} style={styles.inputIcon} />
                <Text style={styles.detailLabel}>Date of Birth</Text>
              </View>
              <Text style={styles.detailValue}>
                {userData?.dateOfBirth
                  ? formatDate(userData.dateOfBirth)
                  : "Not set"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Image source={icons.location} style={styles.inputIcon} />
                <Text style={styles.detailLabel}>Location</Text>
              </View>
              <Text style={styles.detailValue}>
                {/* ✅ FIX: Check if zone is truthy and not "Not set" */}
                {userData?.zone && userData?.zone !== "Not set" && userData?.district && userData?.district !== "Not set"
                  ? `${userData.zone}, ${userData.district}`
                  : "Not set"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Image source={icons.calender} style={styles.inputIcon} />
                <Text style={styles.detailLabel}>Join Date</Text>
              </View>
              <Text style={styles.detailValue}>
                {formatDate(userData?.joinDate)}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/change-password")}
          >
            <Ionicons
              name="key-outline"
              size={20}
              color="#005CFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.actionButtonText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#ef4444"
              style={styles.buttonIcon}
            />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  systemStatusBar: {
    height: StatusBar.currentHeight,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
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
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  content: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#e2e8f0",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
    textAlign: "center",
  },
  userRole: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 16,
    textTransform: "capitalize",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#005CFF",
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  detailsCard: {
    margin: 15,
    padding: 15,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  detailSection: {
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  detailLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    margin: 5,
  },
  detailLabel: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
    marginLeft: 8,
    padding: 5,
  },
  detailValue: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
    flex: 1.5,
    textAlign: "right",
  },
  actionContainer: {
    margin: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
    borderColor: "#005CFF",
    borderWidth: 1,
  },
  actionButtonText: {
    color: "#005CFF",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  logoutButtonText: {
    color: "#ef4444",
  },
  buttonIcon: {
    marginRight: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#005CFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  inputIcon: {
    width: 16,
    height: 16,
    tintColor: "#9797AA",
    marginRight: 8,
  },
});

export default Profile;