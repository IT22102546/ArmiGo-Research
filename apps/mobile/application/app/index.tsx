import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import useAuthStore from "@/stores/authStore";

const Home = () => {
  const { currentUser, isSignedIn, checkAuthStatus } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      await checkAuthStatus();
      setLoading(false);
    };
    initialize();
  }, []);

  if (loading) return null;

  return isSignedIn ? (
    currentUser?.role === "Teacher" ||
    currentUser?.role === "TEACHER" ||
    currentUser?.role === "INTERNAL_TEACHER" ||
    currentUser?.role === "EXTERNAL_TEACHER" ? (
      <Redirect href="/(root)/(tabs)/TeacherHome" />
    ) : (
      <Redirect href="/(root)/(tabs)/home" />
    )
  ) : (
    <Redirect href="/(auth)/onBoard1" />
  );
};

export default Home;
