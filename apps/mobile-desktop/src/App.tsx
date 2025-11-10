import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Storage adapter
import "./adapters/storage-adapter";

// Placeholder screens - you'll replace these with actual mobile app screens
const HomeScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Welcome to LearnApp Desktop</Text>
    <Text style={styles.subtitle}>
      This is the desktop version of the mobile app
    </Text>
    <Text style={styles.info}>
      Platform: {window.electron?.platform || "unknown"}
    </Text>
    <Text style={styles.info}>
      Version: {window.electron?.versions?.electron || "unknown"}
    </Text>
  </View>
);

const Stack = createStackNavigator();

const App = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize the app
    const init = async () => {
      try {
        // Add any initialization logic here
        // For example, check authentication, load user data, etc.
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setIsReady(true); // Set to true anyway to avoid infinite loading
      }
    };

    init();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: "#3498db",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "LearnApp" }}
          />
          {/* Add more screens here */}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  info: {
    fontSize: 14,
    color: "#999",
    marginTop: 10,
  },
});

export default App;
