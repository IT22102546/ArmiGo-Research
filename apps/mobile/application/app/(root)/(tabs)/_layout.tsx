import { Tabs, router } from "expo-router";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  Linking,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { icons } from "@/constants";
import useAuthStore from "@/stores/authStore";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Overlay from "@/components/Overlay";

const TabsLayout = () => {
  const phoneNumber = "+94720804389";
  const whatsappNumber = "94720804389";
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { currentUser } = useAuthStore();

  const handlePhoneCall = () => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = () => {
    const message = "Hello, I'm interested in your services";
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=${whatsappNumber}`);
    });
  };

  const handleSubmitAd = () => {
    const state = useAuthStore.getState();
    if (state.isSignedIn) {
      router.push("/#");
    } else {
      router.push("/#");
    }
  };

  const handleProfileNavigation = () => {
    const state = useAuthStore.getState();
    if (state.isSignedIn) {
      setActiveTab("profile");
      router.push("/profile");
    } else {
      router.push("/sign-in");
    }
  };

  const handleTabPress = (tabName: string, route: string) => {
    setActiveTab(tabName);
    router.push(route);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Blue Status Bar */}
      <StatusBar style="light" backgroundColor="#f8fafc" translucent={false} />

      <Tabs
        initialRouteName="TeacherHome"
        screenOptions={{
          headerShown: true,
          headerShadowVisible: false,
          headerTintColor: "black",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerLeft: () => (
            <View>
              <TouchableOpacity
                style={{ marginLeft: 15 }}
                onPress={toggleSidebar}
              >
                <Image
                  source={icons.burgermenu}
                  style={styles.menuIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 20, marginTop: 4 }}
              onPress={() => router.push("/(root)/(tabs)/Notifications")}
            >
              <Image
                source={icons.notification}
                style={styles.notificationIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
            marginBottom: 10,
          },
          tabBarShowLabel: false,
          tabBarStyle: {
            display: "none",
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#0057FF", // Blue only for home
            },
          }}
        />
        <Tabs.Screen
          name="TeacherHome"
          options={{
            title: "",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#0057FF", // Blue only for home
            },
          }}
        />
        <Tabs.Screen
          name="exams"
          options={{
            title: "",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#0057FF", // Default color for other tabs
            },
          }}
        />
        <Tabs.Screen
          name="publications"
          options={{
            title: "Publications",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Default color for other tabs
            },
          }}
        />

        <Tabs.Screen
          name="Requests"
          options={{
            title: "Requests",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Default color for other tabs
            },
          }}
        />

        <Tabs.Screen
          name="CreateTransferRequest"
          options={{
            title: "Transfer Request",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Default color for other tabs
            },
          }}
        />

        <Tabs.Screen
          name="SearchMatches"
          options={{
            title: "Search & Matches",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Default color for other tabs
            },
          }}
        />

        <Tabs.Screen
          name="TeacherTransferRequests"
          options={{
            title: "Transfer Requsests",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Default color for other tabs
            },
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Default color for other tabs
            },
          }}
        />
        <Tabs.Screen
          name="update_profile"
          options={{
            title: "Edit Profile",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Default color for other tabs
            },
          }}
        />
      </Tabs>

      {/* Sidebar and Overlay */}
      <Sidebar
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />
      <Overlay
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />

      {/* Custom Bottom Navigation */}
      <View style={styles.customTabBar} className="rounded-t-3xl shadow-lg">
        {/* Navigation Items */}
        <View style={styles.navItemsContainer}>
          {currentUser?.role === "Internal" ||
          currentUser?.role === "External" ||
          currentUser?.role === "INTERNAL_STUDENT" ||
          currentUser?.role == "EXTERNAL_STUDENT" ? (
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleTabPress("home", "/(tabs)/home")}
            >
              <View
                style={[
                  styles.iconContainer,
                  activeTab === "home" && styles.iconContainerActive,
                ]}
              >
                <Image
                  source={icons.nav_home}
                  style={[
                    styles.navIcon,
                    activeTab === "home" && styles.navIconActive,
                  ]}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[
                  styles.navText,
                  activeTab === "home" && styles.navTextActive,
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.navItem}
              onPress={() =>
                handleTabPress("TeacherHome", "/(tabs)/TeacherHome")
              }
            >
              <View
                style={[
                  styles.iconContainer,
                  activeTab === "TeacherHome" && styles.iconContainerActive,
                ]}
              >
                <Image
                  source={icons.nav_home}
                  style={[
                    styles.navIcon,
                    activeTab === "TeacherHome" && styles.navIconActive,
                  ]}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[
                  styles.navText,
                  activeTab === "TeacherHome" && styles.navTextActive,
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>
          )}

          {(currentUser?.role === "Teacher" ||
            currentUser?.role === "INTERNAL_TEACHER" ||
            currentUser?.role === "EXTERNAL_TEACHER") && (
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleTabPress("search", "/(tabs)/SearchMatches")}
            >
              <View
                style={[
                  styles.iconContainer,
                  activeTab === "search" && styles.iconContainerActive,
                ]}
              >
                <Image
                  source={icons.search}
                  style={[
                    styles.navIcon,
                    activeTab === "search" && styles.navIconActive,
                  ]}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[
                  styles.navText,
                  activeTab === "search" && styles.navTextActive,
                ]}
              >
                Search
              </Text>
            </TouchableOpacity>
          )}

          {(currentUser?.role === "Internal" ||
            currentUser?.role === "External" ||
            currentUser?.role === "INTERNAL_STUDENT" ||
            currentUser?.role == "EXTERNAL_STUDENT") && (
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleTabPress("exams", "/(tabs)/exams")}
            >
              <View
                style={[
                  styles.iconContainer,
                  activeTab === "exams" && styles.iconContainerActive,
                ]}
              >
                <Image
                  source={icons.nav_exam}
                  style={[
                    styles.navIcon,
                    activeTab === "exams" && styles.navIconActive,
                  ]}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[
                  styles.navText,
                  activeTab === "exams" && styles.navTextActive,
                ]}
              >
                Exams
              </Text>
            </TouchableOpacity>
          )}

          {(currentUser?.role === "Teacher" ||
            currentUser?.role === "INTERNAL_TEACHER" ||
            currentUser?.role === "EXTERNAL_TEACHER") && (
            <TouchableOpacity
              style={styles.navItem}
              onPress={() =>
                handleTabPress(
                  "TransferRequest",
                  "/(tabs)/TeacherTransferRequests"
                )
              }
            >
              <View
                style={[
                  styles.iconContainer,
                  activeTab === "TransferRequest" && styles.iconContainerActive,
                ]}
              >
                <Image
                  source={icons.requests}
                  style={[
                    styles.navIcon,
                    activeTab === "TransferRequest" && styles.navIconActive,
                  ]}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[
                  styles.navText,
                  activeTab === "TransferRequest" && styles.navTextActive,
                ]}
              >
                Requests
              </Text>
            </TouchableOpacity>
          )}

          {(currentUser?.role === "Internal" ||
            currentUser?.role === "External" ||
            currentUser?.role === "INTERNAL_STUDENT" ||
            currentUser?.role == "EXTERNAL_STUDENT") && (
            <TouchableOpacity
              style={styles.navItem}
              onPress={() =>
                handleTabPress("publication", "/(tabs)/publications")
              }
            >
              <View
                style={[
                  styles.iconContainer,
                  activeTab === "publication" && styles.iconContainerActive,
                ]}
              >
                <Image
                  source={icons.home_publication}
                  style={[
                    styles.navIcon,
                    activeTab === "publication" && styles.navIconActive,
                  ]}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[
                  styles.navText,
                  activeTab === "publication" && styles.navTextActive,
                ]}
              >
                Publication
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.navItem}
            onPress={handleProfileNavigation}
          >
            <View
              style={[
                styles.iconContainer,
                activeTab === "profile" && styles.iconContainerActive,
              ]}
            >
              <Image
                source={icons.nav_user}
                style={[
                  styles.navIcon,
                  activeTab === "profile" && styles.navIconActive,
                ]}
                resizeMode="contain"
              />
            </View>
            <Text
              style={[
                styles.navText,
                activeTab === "profile" && styles.navTextActive,
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
    marginTop: -45,
  },
  customTabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    height: 90,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "white",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3A3F47",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    marginRight: 10,
    justifyContent: "center",
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3A3F47",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
  buttonIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  buttonText: {
    color: "#FEE01C",
    fontWeight: "500",
    fontSize: 14,
  },
  navItemsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 2,
  },
  navItem: {
    alignItems: "center",
    marginHorizontal: 8,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconContainerActive: {
    backgroundColor: "#005CFF",
  },
  navIcon: {
    width: 25,
    height: 25,
    tintColor: "#64748b",
  },
  navIconActive: {
    tintColor: "white",
  },
  navText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "500",
  },
  navTextActive: {
    color: "#005CFF",
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#FEE01C",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    color: "black",
    fontSize: 24,
    fontWeight: "bold",
  },
  menuIcon: {
    width: 32,
    height: 32,
    tintColor: "black",
  },
  notificationIcon: {
    width: 32,
    height: 32,
    tintColor: "black",
  },
});

export default TabsLayout;
