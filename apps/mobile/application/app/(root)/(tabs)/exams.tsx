import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { icons, images } from "@/constants";
import useAuthStore from "../../../stores/authStore";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";

const { width: screenWidth } = Dimensions.get("window");

export default function Exercises() {
  const [bodyPart, setBodyPart] = useState("All Body Parts");
  const [difficulty, setDifficulty] = useState("All Levels");
  const [exercises, setExercises] = useState<any[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBodyPartDropdown, setShowBodyPartDropdown] = useState(false);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null
  );
  const [zIndexBodyPart, setZIndexBodyPart] = useState(1);
  const [zIndexDifficulty, setZIndexDifficulty] = useState(1);

  const { currentUser, isSignedIn } = useAuthStore();

  // Define available body parts and difficulties
  const bodyParts = [
    { id: "all", name: "All Body Parts" },
    { id: "fingers", name: "Fingers" },
    { id: "wrist", name: "Wrist" },
    { id: "elbow", name: "Elbow" },
    { id: "shoulder", name: "Shoulder" },
    { id: "hand", name: "Hand" },
    { id: "arm", name: "Arm" },
  ];

  const difficultyLevels = [
    { id: "all", name: "All Levels" },
    { id: "beginner", name: "Beginner" },
    { id: "intermediate", name: "Intermediate" },
    { id: "advanced", name: "Advanced" },
  ];

  // Mock exercises data for physiotherapy
  const mockExercises = [
    {
      id: 1,
      title: "Finger Extensions",
      description: "Gently extend and flex each finger individually",
      bodyPart: "fingers",
      difficulty: "beginner",
      duration: "5-10 minutes",
      sets: "3 sets of 10 reps",
      benefits: "Improves finger mobility and reduces stiffness",
      icon: "hand",
      color: "#4B9BFF",
      image: images.test,
    },
    {
      id: 2,
      title: "Wrist Flexion",
      description: "Bend wrist forward and backward with gentle pressure",
      bodyPart: "wrist",
      difficulty: "beginner",
      duration: "5 minutes",
      sets: "3 sets of 15 reps",
      benefits: "Increases wrist flexibility and strength",
      icon: "fitness",
      color: "#6BCF7F",
      image: images.test,
    },
    {
      id: 3,
      title: "Elbow Bends",
      description: "Slow elbow flexion and extension exercises",
      bodyPart: "elbow",
      difficulty: "beginner",
      duration: "8-10 minutes",
      sets: "4 sets of 12 reps",
      benefits: "Improves elbow range of motion",
      icon: "accessibility",
      color: "#FF6B6B",
      image: images.test,
    },
    {
      id: 4,
      title: "Shoulder Circles",
      description: "Forward and backward shoulder rotations",
      bodyPart: "shoulder",
      difficulty: "intermediate",
      duration: "10 minutes",
      sets: "3 sets of 20 reps",
      benefits: "Enhances shoulder mobility",
      icon: "body",
      color: "#FFB74D",
      image: images.test,
    },
    {
      id: 5,
      title: "Grip Strengthening",
      description: "Squeeze stress ball or therapy putty",
      bodyPart: "hand",
      difficulty: "beginner",
      duration: "5 minutes",
      sets: "4 sets of 8 reps",
      benefits: "Builds hand and grip strength",
      icon: "grip-horizontal",
      color: "#9575CD",
      image: images.test,
    },
    {
      id: 6,
      title: "Forearm Rotation",
      description: "Pronation and supination exercises",
      bodyPart: "arm",
      difficulty: "intermediate",
      duration: "8 minutes",
      sets: "3 sets of 15 reps",
      benefits: "Improves forearm rotation ability",
      icon: "rotate-right",
      color: "#4DB6AC",
      image: images.test,
    },
    {
      id: 7,
      title: "Finger Opposition",
      description: "Touch each finger to thumb sequentially",
      bodyPart: "fingers",
      difficulty: "beginner",
      duration: "5 minutes",
      sets: "2 sets of 10 reps each hand",
      benefits: "Enhances finger coordination",
      icon: "hand-peace",
      color: "#4B9BFF",
      image: images.test,
    },
    {
      id: 8,
      title: "Resisted Wrist Extension",
      description: "Extend wrist against light resistance",
      bodyPart: "wrist",
      difficulty: "intermediate",
      duration: "10 minutes",
      sets: "3 sets of 12 reps",
      benefits: "Strengthens wrist extensors",
      icon: "fitness",
      color: "#6BCF7F",
      image: images.test,
    },
    {
      id: 9,
      title: "Shoulder Press",
      description: "Gentle overhead pressing motion",
      bodyPart: "shoulder",
      difficulty: "advanced",
      duration: "12 minutes",
      sets: "4 sets of 10 reps",
      benefits: "Builds shoulder strength",
      icon: "weight-lifter",
      color: "#FFB74D",
      image: images.test,
    },
  ];

  const getExerciseIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      hand: "hand",
      fitness: "fitness",
      accessibility: "accessibility",
      body: "body-outline",
      "grip-horizontal": "hand-right",
      "rotate-right": "refresh-circle",
      "hand-peace": "hand-left",
      "weight-lifter": "barbell",
    };
    return iconMap[iconName] || "fitness";
  };

  const getExerciseColor = (baseColor: string) => {
    return {
      iconBg: baseColor,
      bg: `${baseColor}20`,
      btnColor: baseColor,
      waveColor: `${baseColor}33`,
      textColor: baseColor,
    };
  };

  const loadExercises = async () => {
    try {
      setLoading(true);
      
      // In real app, you would fetch from API
      // For now, use mock data
      setTimeout(() => {
        setExercises(mockExercises);
        setFilteredExercises(mockExercises);
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error loading exercises:", error);
      // Fallback to mock data
      setExercises(mockExercises);
      setFilteredExercises(mockExercises);
      setLoading(false);
    }
  };

  const filterExercises = useCallback(() => {
    let filtered = [...exercises];

    if (selectedBodyPart && selectedBodyPart !== "all") {
      filtered = filtered.filter(
        (exercise) => exercise.bodyPart === selectedBodyPart
      );
    }

    if (selectedDifficulty && selectedDifficulty !== "all") {
      filtered = filtered.filter(
        (exercise) => exercise.difficulty === selectedDifficulty
      );
    }

    const formattedExercises = filtered.map((exercise) => {
      const colors = getExerciseColor(exercise.color);

      return {
        ...exercise,
        iconBg: colors.iconBg,
        bg: colors.bg,
        btnColor: colors.btnColor,
        waveColor: colors.waveColor,
        textColor: colors.textColor,
      };
    });

    setFilteredExercises(formattedExercises);
  }, [exercises, selectedBodyPart, selectedDifficulty]);

  const handleBodyPartSelect = (part: any) => {
    setBodyPart(part.name);
    setSelectedBodyPart(part.id === "all" ? null : part.id);
    setShowBodyPartDropdown(false);
  };

  const handleDifficultySelect = (level: any) => {
    setDifficulty(level.name);
    setSelectedDifficulty(level.id === "all" ? null : level.id);
    setShowDifficultyDropdown(false);
  };

  const handleBodyPartDropdownToggle = () => {
    setShowBodyPartDropdown(!showBodyPartDropdown);
    if (!showBodyPartDropdown) {
      setZIndexBodyPart(100);
      setZIndexDifficulty(1);
      setShowDifficultyDropdown(false);
    }
  };

  const handleDifficultyDropdownToggle = () => {
    setShowDifficultyDropdown(!showDifficultyDropdown);
    if (!showDifficultyDropdown) {
      setZIndexDifficulty(100);
      setZIndexBodyPart(1);
      setShowBodyPartDropdown(false);
    }
  };

  const resetFilters = () => {
    setBodyPart("All Body Parts");
    setDifficulty("All Levels");
    setSelectedBodyPart(null);
    setSelectedDifficulty(null);
    setShowBodyPartDropdown(false);
    setShowDifficultyDropdown(false);
  };

  const handleStartExercise = (exercise: any) => {
    Alert.alert(
      "Start Exercise",
      `Ready to start ${exercise.title}?\n\nDuration: ${exercise.duration}\nSets: ${exercise.sets}\n\n${exercise.description}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: () => {
            router.push({
              pathname: "/exercise-detail",
              params: {
                exerciseId: exercise.id.toString(),
                title: exercise.title,
                description: exercise.description,
                duration: exercise.duration,
                sets: exercise.sets,
                benefits: exercise.benefits,
                bodyPart: exercise.bodyPart,
                difficulty: exercise.difficulty,
              },
            });
          },
        },
      ]
    );
  };

  const handleViewProgress = (exercise: any) => {
    router.push({
      pathname: "/exercise-progress",
      params: {
        exerciseId: exercise.id.toString(),
        title: exercise.title,
      },
    });
  };

  useEffect(() => {
    if (isSignedIn && currentUser) {
      loadExercises();
    }
  }, [isSignedIn, currentUser]);

  useEffect(() => {
    if (exercises.length > 0) {
      filterExercises();
    }
  }, [selectedBodyPart, selectedDifficulty, exercises, filterExercises]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0057FF" />
        <Text style={styles.loadingText}>Loading Exercises...</Text>
      </View>
    );
  }

  if (!isSignedIn || !currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Please sign in to view exercises</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Welcome Back,</Text>
            <Text style={styles.userName}>
              {currentUser?.firstName || "Patient"}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.progressButton}
            onPress={() => router.push("/progress-overview")}
          >
            <MaterialIcons name="trending-up" size={20} color="#0057FF" />
            <Text style={styles.progressButtonText}>Progress</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.appTitle}>Rehabilitation Exercises</Text>

        {/* Filter Box */}
        <View style={styles.filterContainer}>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.dropdown, { zIndex: zIndexBodyPart }]}
              onPress={handleBodyPartDropdownToggle}
            >
              <MaterialIcons name="accessibility" size={20} color="#777" />
              <Text style={styles.dropdownText}>{bodyPart}</Text>
              <MaterialIcons
                name={showBodyPartDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={20}
                color="#777"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dropdown, { zIndex: zIndexDifficulty }]}
              onPress={handleDifficultyDropdownToggle}
            >
              <MaterialIcons name="signal-cellular-alt" size={20} color="#777" />
              <Text style={styles.dropdownText}>{difficulty}</Text>
              <MaterialIcons
                name={showDifficultyDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={20}
                color="#777"
              />
            </TouchableOpacity>
          </View>

          {showBodyPartDropdown && (
            <View
              style={[
                styles.dropdownMenu,
                { left: 0, width: "48%", zIndex: 101 },
              ]}
            >
              <ScrollView style={styles.dropdownScroll}>
                {bodyParts.map((part) => (
                  <TouchableOpacity
                    key={part.id}
                    style={styles.dropdownItem}
                    onPress={() => handleBodyPartSelect(part)}
                  >
                    <MaterialIcons 
                      name={part.id === "all" ? "apps" : "accessibility"} 
                      size={18} 
                      color="#0057FF" 
                    />
                    <Text style={styles.dropdownItemText}>{part.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {showDifficultyDropdown && (
            <View
              style={[
                styles.dropdownMenu,
                { right: 0, width: "48%", zIndex: 101 },
              ]}
            >
              <ScrollView style={styles.dropdownScroll}>
                {difficultyLevels.map((level) => (
                  <TouchableOpacity
                    key={level.id}
                    style={styles.dropdownItem}
                    onPress={() => handleDifficultySelect(level)}
                  >
                    <MaterialIcons 
                      name={
                        level.id === "all" ? "star" : 
                        level.id === "beginner" ? "star-outline" :
                        level.id === "intermediate" ? "star-half" :
                        "star"
                      } 
                      size={18} 
                      color="#0057FF" 
                    />
                    <Text style={styles.dropdownItemText}>{level.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Reset Filters Button */}
        {(selectedBodyPart || selectedDifficulty) && (
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <MaterialIcons name="refresh" size={16} color="#0057FF" />
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Exercise Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="fitness" size={24} color="#4B9BFF" />
          <Text style={styles.statNumber}>{filteredExercises.length}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
        
        <View style={styles.statCard}>
          <MaterialIcons name="timer" size={24} color="#6BCF7F" />
          <Text style={styles.statNumber}>
            {filteredExercises.reduce((sum, ex) => {
              const mins = parseInt(ex.duration.split('-')[0]) || 5;
              return sum + mins;
            }, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Minutes</Text>
        </View>
        
        <View style={styles.statCard}>
          <MaterialIcons name="check-circle" size={24} color="#FF6B6B" />
          <Text style={styles.statNumber}>
            {filteredExercises.filter(ex => ex.difficulty === 'beginner').length}
          </Text>
          <Text style={styles.statLabel}>Beginner</Text>
        </View>
      </View>

      {/* Exercises List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Available Exercises</Text>
        <Text style={styles.subTitle}>
          {selectedBodyPart || selectedDifficulty 
            ? `Filtered (${filteredExercises.length} exercises)` 
            : `All exercises (${filteredExercises.length} total)`}
        </Text>
      </View>

      {filteredExercises.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="fitness" size={60} color="#999" />
          <Text style={styles.emptyText}>
            No exercises found for your selected filters
          </Text>
          <TouchableOpacity style={styles.resetButtonLarge} onPress={resetFilters}>
            <Text style={styles.resetButtonTextLarge}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              data={exercise}
              onStart={handleStartExercise}
              onViewProgress={handleViewProgress}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function ExerciseCard({
  data,
  onStart,
  onViewProgress,
}: {
  data: any;
  onStart: (data: any) => void;
  onViewProgress: (data: any) => void;
}) {
  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'star-outline';
      case 'intermediate': return 'star-half';
      case 'advanced': return 'star';
      default: return 'star-outline';
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: data.bg }]}>
      {/* Wave Background */}
      <View style={styles.simpleWaveContainer}>
        <Svg
          height="100%"
          width="80"
          viewBox="0 0 80 320"
          preserveAspectRatio="none"
          style={styles.simpleWaveSvg}
        >
          <Path
            fill={data.waveColor}
            fillOpacity="0.25"
            d="M0 0 
               C 80 0 320 20 80 -40
               C 95 130 2 220 65 320
               L 0 340
               Z "
          />
        </Svg>
      </View>

      {/* Exercise Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: data.iconBg }]}>
          <MaterialIcons name={getExerciseIcon(data.icon)} size={24} color="#FFF" />
        </View>
        
        <View style={styles.cardTitleContainer}>
          <Text style={[styles.cardTitle, { color: data.textColor }]}>
            {data.title}
          </Text>
          
          <View style={styles.cardTags}>
            <View style={[styles.tag, { backgroundColor: data.textColor + '20' }]}>
              <MaterialIcons 
                name={getDifficultyIcon(data.difficulty)} 
                size={14} 
                color={data.textColor} 
              />
              <Text style={[styles.tagText, { color: data.textColor }]}>
                {data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1)}
              </Text>
            </View>
            
            <View style={[styles.tag, { backgroundColor: data.textColor + '20' }]}>
              <MaterialIcons name="accessibility" size={14} color={data.textColor} />
              <Text style={[styles.tagText, { color: data.textColor }]}>
                {data.bodyPart.charAt(0).toUpperCase() + data.bodyPart.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Exercise Description */}
      <Text style={styles.cardDescription}>{data.description}</Text>

      {/* Exercise Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <MaterialIcons name="timer" size={16} color="#666" />
          <Text style={styles.detailText}>{data.duration}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <MaterialIcons name="repeat" size={16} color="#666" />
          <Text style={styles.detailText}>{data.sets}</Text>
        </View>
      </View>

      {/* Exercise Benefits */}
      <View style={styles.benefitsContainer}>
        <MaterialIcons name="check-circle" size={16} color="#6BCF7F" />
        <Text style={styles.benefitsText}>{data.benefits}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.viewProgressButton, { borderColor: data.btnColor }]}
          onPress={() => onViewProgress(data)}
        >
          <MaterialIcons name="trending-up" size={16} color={data.btnColor} />
          <Text style={[styles.viewProgressText, { color: data.btnColor }]}>
            Progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: data.btnColor }]}
          onPress={() => onStart(data)}
        >
          <MaterialIcons name="play-arrow" size={16} color="#FFF" />
          <Text style={styles.startText}>Start Exercise</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getExerciseIcon = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    hand: "hand",
    fitness: "fitness",
    accessibility: "accessibility",
    "body-outline": "body",
    "grip-horizontal": "hand-right",
    "rotate-right": "refresh-circle",
    "hand-peace": "hand-left",
    "weight-lifter": "barbell",
  };
  return iconMap[iconName] || "fitness";
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
  },
  header: {
    backgroundColor: "#0057FF",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    position: "relative",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  welcomeText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontFamily: "Poppins-Regular",
  },
  userName: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
  },
  progressButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  progressButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
  },
  appTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    fontFamily: "Poppins-Bold",
  },
  filterContainer: {
    position: "relative",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    position: "relative",
  },
  dropdown: {
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    gap: 8,
  },
  dropdownText: {
    color: "#666",
    fontSize: 14,
    flex: 1,
    fontFamily: "Poppins-Regular",
  },
  dropdownMenu: {
    position: "absolute",
    top: 50,
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 8,
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Poppins-Regular",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 5,
    marginTop: 5,
  },
  resetButtonText: {
    color: "#0057FF",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
  },
  resetButtonLarge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#0057FF",
    borderRadius: 10,
    marginTop: 20,
  },
  resetButtonTextLarge: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 5,
    fontFamily: "Poppins-Bold",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    fontFamily: "Poppins-Bold",
  },
  subTitle: {
    color: "#888",
    marginTop: 2,
    fontSize: 12,
    fontFamily: "Poppins-Regular",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    marginTop: 15,
    fontFamily: "Poppins-Regular",
  },
  scrollView: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  card: {
    padding: 15,
    marginVertical: 8,
    borderRadius: 18,
    elevation: 4,
    overflow: "hidden",
    position: "relative",
  },
  simpleWaveContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 80,
    zIndex: 1,
  },
  simpleWaveSvg: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 80,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    position: "relative",
    zIndex: 2,
    marginBottom: 10,
  },
  iconBox: {
    padding: 12,
    borderRadius: 12,
    position: "relative",
    zIndex: 2,
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: 12,
    position: "relative",
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    fontFamily: "Poppins-Bold",
  },
  cardTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
  },
  cardDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
    lineHeight: 18,
    position: "relative",
    zIndex: 2,
    fontFamily: "Poppins-Regular",
  },
  detailsContainer: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 10,
    position: "relative",
    zIndex: 2,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  detailText: {
    fontSize: 12,
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  benefitsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 15,
    position: "relative",
    zIndex: 2,
  },
  benefitsText: {
    flex: 1,
    fontSize: 12,
    color: "#6BCF7F",
    fontStyle: "italic",
    fontFamily: "Poppins-Regular",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "relative",
    zIndex: 2,
  },
  viewProgressButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  viewProgressText: {
    fontWeight: "600",
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 5,
  },
  startText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
});