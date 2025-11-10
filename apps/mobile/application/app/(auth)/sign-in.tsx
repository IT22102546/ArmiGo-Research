import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Image,
  ImageSourcePropType,
  Alert,
  KeyboardTypeOptions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import CheckBox from "expo-checkbox";
import { useRouter, useLocalSearchParams } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { icons } from "@/constants";
import useAuthStore from "@/stores/authStore";

const API = process.env.EXPO_PUBLIC_API_URL;

// Enhanced helper function to validate email or phone
const isValidIdentifier = (value: string): boolean => {
  if (!value || value.trim() === "") return false;
  
  // Check if it's an email
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (emailRegex.test(value)) {
    return true;
  }
  
  // Check if it's a valid phone number (supports international formats)
  const cleanPhone = value.replace(/\D/g, ''); // Remove non-digits
  
  // Phone number should be 9-15 digits (with optional country code)
  return cleanPhone.length >= 9 && cleanPhone.length <= 15;
};

// Helper function to format phone number
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 0, convert to +94 format
  if (cleaned.startsWith('0')) {
    return `+94${cleaned.substring(1)}`;
  }
  
  // If it's 9 digits, assume it's a Sri Lankan number and add +94
  if (cleaned.length === 9) {
    return `+94${cleaned}`;
  }
  
  // If it starts with 94, add the +
  if (cleaned.startsWith('94')) {
    return `+${cleaned}`;
  }
  
  // Otherwise return as is with +
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

// Improved helper to determine if identifier is likely email
const isLikelyEmail = (identifier: string): boolean => {
  if (!identifier) return false;
  
  // If it already contains @, it's definitely an email
  if (identifier.includes('@')) {
    return true;
  }
  
  // If it contains . (dot) and letters, it might be an email without @ yet
  if (identifier.includes('.') && /[a-zA-Z]/.test(identifier)) {
    return true;
  }
  
  // If it contains only digits, it's likely a phone number
  if (/^\d+$/.test(identifier.replace(/\D/g, ''))) {
    return false;
  }
  
  // If it contains letters, assume it's an email being typed
  if (/[a-zA-Z]/.test(identifier)) {
    return true;
  }
  
  // Default to phone for empty or numeric input
  return false;
};

// Get keyboard type based on input
const getKeyboardType = (value: string): KeyboardTypeOptions => {
  if (!value) return "default";
  
  if (isLikelyEmail(value)) {
    return "email-address";
  }
  
  // Check if input looks like a phone number
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length > 0 && /^\d+$/.test(cleanValue)) {
    return "phone-pad";
  }
  
  // Default to default keyboard for mixed input
  return "default";
};

// Get placeholder based on current input
const getPlaceholder = (value: string): string => {
  if (!value) return "Enter your email or phone number";
  
  if (isLikelyEmail(value)) {
    return "Enter your email address";
  }
  
  return "Enter your phone number";
};

// Get icon based on input
const getIconName = (value: string): string => {
  if (!value) return "person-outline";
  
  if (isLikelyEmail(value)) {
    return "mail-outline";
  }
  
  return "call-outline";
};

const SignIn = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    watch,
  } = useForm({
    defaultValues: {
      identifier: "",
      password: "",
    },
  });
  
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [apiErrors, setApiErrors] = useState({
    identifier: "",
    password: "",
  });
  
  const identifierValue = watch("identifier");

  const router = useRouter();
  const params = useLocalSearchParams();
  const { signIn, isSignedIn } = useAuthStore();

  // Animation values for icons
  const animatedValues = useRef(
    Array(15)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;
  const animationRefs = useRef<Animated.CompositeAnimation[]>([]);

  // Get role from navigation params
  useEffect(() => {
    if (params.role) {
      setUserRole(params.role as string);
      console.log("User role from params:", params.role);
      console.log("Backend role from params:", params.backendRole);
    }
  }, [params.role, params.backendRole]);

  // Animation functions
  const startAnimations = () => {
    animationRefs.current.forEach((animation) => animation.stop());
    animationRefs.current = [];

    animatedValues.forEach((value) => value.setValue(0));

    const iconAnimations = animatedValues.map((animValue, index) => {
      const delay = index * 150 + Math.random() * 400;

      const animation = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      );

      animationRefs.current.push(animation);
      return animation;
    });

    iconAnimations.forEach((animation) => animation.start());
  };

  const stopAnimations = () => {
    animationRefs.current.forEach((animation) => animation.stop());
    animationRefs.current = [];
  };

  useEffect(() => {
    startAnimations();
    return () => {
      stopAnimations();
    };
  }, []);

  // Clear API errors when user starts typing
  const clearApiErrors = (field: string) => {
    setApiErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
    clearErrors(field);
  };

  // Handle forgot password navigation
  const handleForgotPassword = () => {
    router.push("/(auth)/forgetpassword");
  };

  // Handle sign up navigation
 const handleSignUp = () => {
  router.push({
    pathname: "/(auth)/sign-up",
    params: { role: userRole } // Pass the role parameter
  });
};

  // Handle sign in with email or phone
  const onSubmit = async (credentials: { identifier: string; password: string }) => {
    try {
      setLoading(true);

      // Validate identifier
      if (!isValidIdentifier(credentials.identifier)) {
        setError("identifier", {
          type: "manual",
          message: "Please enter a valid email or phone number",
        });
        setLoading(false);
        return;
      }

      // Format phone number if it's not an email
      let formattedIdentifier = credentials.identifier;
      const isEmailInput = isLikelyEmail(credentials.identifier) && credentials.identifier.includes('@');
      
      if (!isEmailInput) {
        formattedIdentifier = formatPhoneNumber(credentials.identifier);
      }

      console.log("📤 Sending login request:", {
        identifier: formattedIdentifier,
        isEmail: isEmailInput,
        selectedRole: userRole,
      });

      // Prepare allowedRoles based on selected role
      let allowedRoles: string[] = [];
      
      if (userRole) {
        // Define which roles are allowed based on the selected portal
        if (userRole === "Teacher" || userRole === "TEACHER") {
          // Teacher portal - allow only teacher roles
          allowedRoles = ["INTERNAL_TEACHER", "EXTERNAL_TEACHER"];
        } else if (userRole === "Internal" || userRole === "INTERNAL_STUDENT") {
          // Student portal - allow only student roles
          allowedRoles = ["INTERNAL_STUDENT", "EXTERNAL_STUDENT"];
        }
      }

      const requestBody: any = {
        identifier: formattedIdentifier,
        password: credentials.password,
      };

      // Only add allowedRoles if we have them
      if (allowedRoles.length > 0) {
        requestBody.allowedRoles = allowedRoles;
      }

      const response = await fetch(`${API}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-type": "mobile",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📡 Login Response Status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if error is due to role mismatch
        if (errorData.message?.includes("role") || errorData.message?.includes("Role") || errorData.message?.includes("not allowed")) {
          Alert.alert(
            "Role Mismatch",
            `This account cannot access the ${userRole === "Teacher" || userRole === "TEACHER" ? "Teacher" : "Student"} portal. Please use the correct portal for your account type.`,
            [
              {
                text: "Go Back",
                onPress: () => router.back(),
                style: "cancel"
              }
            ]
          );
        } else {
          throw new Error(errorData.message || "Login failed");
        }
        
        setLoading(false);
        return;
      }

      const result = await response.json();
      console.log("📱 Login API Response:", result);

      // Extract data from response
      const { accessToken, refreshToken, user } = result;

      console.log("🔍 Checking for tokens in response...");
      console.log("🔑 Access Token:", accessToken ? "Yes" : "No");
      console.log("🔑 Refresh Token:", refreshToken ? "Yes" : "No");
      console.log("👤 User:", user ? "Yes" : "No");
      console.log("👤 User Role:", user?.role);

      if (!accessToken || !refreshToken || !user) {
        console.warn("⚠️ No tokens or user data in response");
        console.warn("Response structure:", result);
        throw new Error("Missing tokens or user data in response");
      }

      // Verify the user role matches the expected portal
      if (userRole) {
        const isTeacherPortal = userRole === "Teacher" || userRole === "TEACHER";
        const isStudentPortal = userRole === "Internal" || userRole === "INTERNAL_STUDENT";
        
        const userIsTeacher = user.role === "INTERNAL_TEACHER" || user.role === "EXTERNAL_TEACHER";
        const userIsStudent = user.role === "INTERNAL_STUDENT" || user.role === "EXTERNAL_STUDENT";
        
        if ((isTeacherPortal && !userIsTeacher) || (isStudentPortal && !userIsStudent)) {
          Alert.alert(
            "Invalid Portal Access",
            `You are trying to access the ${isTeacherPortal ? "Teacher" : "Student"} portal with a ${user.role} account. Please use the correct portal.`,
            [
              {
                text: "Go Back",
                onPress: () => router.back(),
                style: "cancel"
              }
            ]
          );
          setLoading(false);
          return;
        }
      }

      // Call signIn with the extracted data
      await signIn(user, accessToken, refreshToken);

      console.log("✅ Sign in successful!");
      if(userRole === "Internal" || userRole === "INTERNAL_STUDENT" || userRole === "External" || userRole === "EXTERNAL_STUDENT") {
              router.replace("/(root)/(tabs)/home");
      } else if(userRole === "Teacher" || userRole === "TEACHER" || userRole === "INTERNAL_TEACHER" || userRole === "EXTERNAL_TEACHER") {
              router.replace("/(root)/(tabs)/TeacherHome");
      }
    } catch (error: any) {
      console.error("❌ Sign in error:", error);
      Alert.alert("Sign In Error", error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine input border color
  const getInputBorderColor = (fieldName: string) => {
    if (errors[fieldName] || apiErrors[fieldName]) {
      return "#ef4444";
    }
    return "#d1d5db";
  };

  // Render icons animation
  const renderDistributedIcons = () => {
    const selectedIcons: ImageSourcePropType[] = [
      icons.Icon1,
      icons.Icon2,
      icons.Icon3,
      icons.Icon4,
      icons.Icon5,
      icons.Icon6,
      icons.Icon1,
      icons.Icon3,
      icons.Icon2,
      icons.Icon4,
      icons.Icon3,
      icons.Icon5,
      icons.Icon1,
      icons.Icon6,
      icons.Icon2,
    ];

    const predefinedPositions = [
      { top: 25, left: 10 },
      { top: 25, left: 50 },
      { top: 25, left: 90 },
      { top: 60, left: 20 },
      { top: 60, left: 80 },
      { top: 95, left: 5 },
      { top: 95, left: 35 },
      { top: 95, left: 65 },
      { top: 95, left: 95 },
      { top: 130, left: 15 },
      { top: 130, left: 50 },
      { top: 130, left: 85 },
      { top: 165, left: 25 },
      { top: 165, left: 75 },
      { top: 200, left: 5 },
      { top: 200, left: 40 },
      { top: 200, left: 60 },
      { top: 200, left: 95 },
    ];

    return selectedIcons.map((icon, index) => {
      let position;

      if (index < predefinedPositions.length) {
        position = predefinedPositions[index];
      } else {
        position = {
          top: 30 + Math.random() * 140,
          left: 15 + Math.random() * 70,
        };
      }

      const randomOpacity = 0.8 + Math.random() * 0.2;
      const randomSize = 20 + Math.random() * 12;
      const randomRotation = Math.random() * 20 - 10;

      const translateY = animatedValues[index].interpolate({
        inputRange: [0, 1],
        outputRange: [0, -15],
      });

      const scale = animatedValues[index].interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.1],
      });

      const rotate = animatedValues[index].interpolate({
        inputRange: [0, 1],
        outputRange: [`${randomRotation}deg`, `${randomRotation + 8}deg`],
      });

      const opacity = animatedValues[index].interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [randomOpacity, randomOpacity * 1.4, randomOpacity],
      });

      return (
        <Animated.Image
          key={index}
          source={icon}
          style={{
            position: "absolute",
            top: position.top,
            left: `${position.left}%`,
            width: randomSize,
            height: randomSize,
            opacity: opacity,
            tintColor: "#FFFFFF",
            zIndex: 2,
            transform: [
              { translateY: translateY },
              { scale: scale },
              { rotate: rotate },
            ],
            shadowColor: "#FFFFFF",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
          }}
          resizeMode="contain"
        />
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Gradient with Icons and Waves */}
      <LinearGradient
        colors={["#4B3AFF", "#5C6CFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topSection}
      >
        {/* Icons Layer with Animation */}
        <View style={styles.iconsLayer}>{renderDistributedIcons()}</View>

        {/* Title - Only Learn APP in top section */}
        <Text style={styles.header}>Learn APP</Text>

        {/* Light Blue Wave - BELOW the white wave */}
        <View style={styles.lightBlueWaveContainer}>
          <Svg
            height="92"
            width="90%"
            viewBox="0 0 1440 320"
            style={styles.lightBlueWaveSvg}
          >
            <Path
              fill="#4B9BFF"
              d="M0,180L48,170C96,160,192,140,288,130C384,120,480,120,576,135C672,150,768,180,864,190C960,200,1056,190,1152,175C1248,160,1344,130,1392,115L1440,100L1440,320L0,320Z"
            />
          </Svg>
        </View>

        {/* White Wave - ABOVE the blue wave */}
        <Svg
          height="92"
          width="100%"
          viewBox="0 0 1440 320"
          style={styles.whiteWaveWrapper}
        >
          <Path
            fill="#ffffff"
            d="M0,224L48,202.7C96,181,192,139,288,128C384,117,480,139,576,165.3C672,192,768,224,864,234.7C960,245,1056,235,1152,213.3C1248,192,1344,160,1392,144L1440,128L1440,320L0,320Z"
          />
        </Svg>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <View style={styles.headingContainer}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Role Indicator */}
        {userRole && (
          <View style={styles.roleIndicator}>
            <Text style={styles.roleIndicatorText}>
              {userRole === "Teacher" || userRole === "TEACHER" 
                ? "Signing in as Teacher" 
                : "Signing in as Student"}
            </Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Email or Phone */}
          <Controller
            control={control}
            name="identifier"
            rules={{
              required: "Email or phone number is required",
              validate: (value) => isValidIdentifier(value) || "Please enter a valid email or phone number",
            }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Email or Phone Number <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    { borderColor: getInputBorderColor("identifier") },
                  ]}
                >
                  <Ionicons
                    name={getIconName(value)}
                    size={18}
                    color={errors.identifier || apiErrors.identifier ? "#ef4444" : "gray"}
                  />
                  <TextInput
                    placeholder={getPlaceholder(value)}
                    placeholderTextColor="#9ca3af"
                    keyboardType={getKeyboardType(value)}
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      clearApiErrors("identifier");
                    }}
                    style={styles.textInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                  />
                </View>
                {(errors.identifier || apiErrors.identifier) && (
                  <Text style={styles.errorText}>
                    {(errors.identifier?.message as string) || apiErrors.identifier}
                  </Text>
                )}
                {value && !errors.identifier && (
                  <Text style={styles.identifierTypeText}>
                    {isLikelyEmail(value) ? "Using email to sign in" : "Using phone number to sign in"}
                  </Text>
                )}
              </View>
            )}
          />

          {/* Password */}
          <Controller
            control={control}
            name="password"
            rules={{ required: "Password is required" }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Password <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    { borderColor: getInputBorderColor("password") },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={
                      errors.password || apiErrors.password ? "#ef4444" : "gray"
                    }
                  />
                  <TextInput
                    placeholder="Enter Your Password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={secureText}
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      clearApiErrors("password");
                    }}
                    style={styles.textInput}
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                  <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                    <Ionicons
                      name={secureText ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={
                        errors.password || apiErrors.password
                          ? "#ef4444"
                          : "gray"
                      }
                    />
                  </TouchableOpacity>
                </View>
                {(errors.password || apiErrors.password) && (
                  <Text style={styles.errorText}>
                    {(errors.password?.message as string) || apiErrors.password}
                  </Text>
                )}
              </View>
            )}
          />

          {/* Remember Me + Forgot */}
          <View style={styles.optionsContainer}>
            <View style={styles.rememberMeContainer}>
              <CheckBox
                value={rememberMe}
                onValueChange={setRememberMe}
                color={rememberMe ? "#2563eb" : undefined}
              />
              <Text style={styles.rememberMeText}>Remember Me</Text>
            </View>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            style={[styles.signInButton, loading && styles.disabledButton]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signInText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't You Have An Account? </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topSection: {
    position: "relative",
    width: "100%",
    height: 230,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  iconsLayer: {
    position: "absolute",
    width: "100%",
    height: "95%",
    zIndex: 7,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    zIndex: 5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    fontFamily: "Poppins-Bold",
  },
  whiteWaveWrapper: {
    position: "absolute",
    bottom: -5,
    left: 0,
    zIndex: 3,
  },
  lightBlueWaveContainer: {
    position: "absolute",
    bottom: -0.1,
    left: "5%",
    right: "-20%",
    alignItems: "center",
    zIndex: 2,
  },
  lightBlueWaveSvg: {},
  scrollContainer: {
    flexGrow: 1,
  },
  headingContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  roleIndicator: {
    backgroundColor: "#f0f4ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  roleIndicatorText: {
    color: "#3b82f6",
    fontFamily: "Poppins-Medium",
    fontSize: 14,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    fontFamily: "Poppins-Bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
    fontFamily: "Poppins-Regular",
  },
  formContainer: {
    paddingHorizontal: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: "#000",
    marginBottom: 8,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
  },
  required: {
    color: "#ef4444",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 8,
    color: "#000",
    fontFamily: "Poppins-Regular",
    fontSize: 14,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Poppins-Regular",
  },
  identifierTypeText: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Poppins-Regular",
    fontStyle: "italic",
  },
  optionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    marginTop: 8,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberMeText: {
    marginLeft: 8,
    color: "#000",
    fontFamily: "Poppins-Regular",
    fontSize: 14,
  },
  forgotPassword: {
    color: "#3b82f6",
    fontFamily: "Poppins-Regular",
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signInText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  signUpText: {
    color: "#666",
    fontFamily: "Poppins-Regular",
    fontSize: 14,
  },
  signUpLink: {
    color: "#3b82f6",
    fontFamily: "Poppins-Medium",
    fontSize: 14,
  },
});

export default SignIn;