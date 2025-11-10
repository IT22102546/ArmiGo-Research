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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { icons } from "@/constants";
import useAuthStore from "../../../stores/authStore";
import { apiFetch } from "../../../utils/api";
import { router, useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";

export default function Exams() {
  const [grade, setGrade] = useState("Grade");
  const [medium, setMedium] = useState("Medium");
  const [subject, setSubject] = useState("Subject");
  const [grades, setGrades] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showMediumDropdown, setShowMediumDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const [selectedMediumId, setSelectedMediumId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null
  );
  const [zIndexGrade, setZIndexGrade] = useState(1);
  const [zIndexMedium, setZIndexMedium] = useState(1);
  const [zIndexSubject, setZIndexSubject] = useState(1);
  const [allExams, setAllExams] = useState<any[]>([]);
  const [filteredExams, setFilteredExams] = useState<any[]>([]);

  const { currentUser, isSignedIn, refreshTokens } = useAuthStore();
  const router = useRouter();

  // Enhanced API call function
  const makeAuthenticatedRequest = async (
    endpoint: string,
    options: any = {}
  ) => {
    try {
      console.log(` Making request to: ${endpoint}`);
      let response = await apiFetch(endpoint, options);

      if (response.status === 401) {
        console.log(" Token expired, attempting refresh...");
        const refreshSuccess = await refreshTokens();

        if (refreshSuccess) {
          response = await apiFetch(endpoint, options);
        } else {
          throw new Error("Authentication failed. Please login again.");
        }
      }

      if (!response.ok) {
        if (response.status === 400) {
          const errorText = await response.text();
          console.log(` 400 Error details for ${endpoint}:`, errorText);
          throw new Error(`Bad request (400): ${errorText}`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(` Response for ${endpoint}:`, result);

      if (result.data !== undefined) {
        if (
          typeof result.data === "object" &&
          result.data !== null &&
          !Array.isArray(result.data)
        ) {
          for (const key in result.data) {
            if (Array.isArray(result.data[key])) {
              console.log(` Found array in data.${key}`);
              return result;
            }
          }
        }
        return result.data;
      } else if (Array.isArray(result)) {
        return result;
      } else {
        return result;
      }
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  };

  // Main function to load all data
  const loadAllData = async () => {
    try {
      setLoading(true);

      console.log(" Loading all data...");

      // Fetch exams first
      const examsResponse = await makeAuthenticatedRequest(
        "/api/v1/exams/student/my-exams?&limit=100"
      );

      let examsArray: any[] = [];

      if (
        examsResponse &&
        examsResponse.data &&
        Array.isArray(examsResponse.data)
      ) {
        examsArray = examsResponse.data;
        console.log(" Got paginated exams data:", examsArray.length);
      } else if (Array.isArray(examsResponse)) {
        examsArray = examsResponse;
        console.log(" Got direct array exams data:", examsArray.length);
      } else if (examsResponse && Array.isArray(examsResponse.exams)) {
        examsArray = examsResponse.exams;
        console.log(" Got exams array from exams field:", examsArray.length);
      } else if (examsResponse && Array.isArray(examsResponse.items)) {
        examsArray = examsResponse.items;
        console.log("Got exams array from items field:", examsArray.length);
      }

      if (examsArray.length === 0) {
        console.log(" No exams found");
        setAllExams([]);
        setFilteredExams([]);
        setGrades([]);
        setMediums([]);
        setSubjects([]);
        return;
      }

      const gradeIds = [
        ...new Set(examsArray.map((exam) => exam.gradeId).filter(Boolean)),
      ];
      const mediumIds = [
        ...new Set(examsArray.map((exam) => exam.mediumId).filter(Boolean)),
      ];
      const subjectIds = [
        ...new Set(examsArray.map((exam) => exam.subjectId).filter(Boolean)),
      ];

      console.log(" Extracted IDs:", {
        gradeIds: gradeIds.length,
        mediumIds: mediumIds.length,
        subjectIds: subjectIds.length,
      });

      const fetchPromises = [];

      fetchPromises.push(
        (async () => {
          try {
            const response = await makeAuthenticatedRequest("/api/v1/grades");
            if (
              response &&
              response.data &&
              Array.isArray(response.data.grades)
            ) {
              return response.data.grades;
            } else if (response && Array.isArray(response.grades)) {
              return response.grades;
            } else if (Array.isArray(response)) {
              return response;
            }
            return [];
          } catch (error) {
            console.log(" Failed to fetch grades, trying alternative...");
            try {
              const response = await makeAuthenticatedRequest(
                "/api/v1/grades?isActive=true"
              );
              return Array.isArray(response) ? response : [];
            } catch (e) {
              return [];
            }
          }
        })()
      );

      fetchPromises.push(
        (async () => {
          try {
            const response = await makeAuthenticatedRequest("/api/v1/mediums");
            console.log(" Mediums response structure:", response);

            if (
              response &&
              response.data &&
              Array.isArray(response.data.mediums)
            ) {
              console.log(" Found mediums in data.mediums");
              return response.data.mediums;
            } else if (
              response &&
              response.data &&
              Array.isArray(response.data)
            ) {
              console.log(" Found mediums in data array");
              return response.data;
            } else if (response && Array.isArray(response.mediums)) {
              console.log(" Found mediums in response.mediums");
              return response.mediums;
            } else if (Array.isArray(response)) {
              console.log(" Found direct array response");
              return response;
            }
            return [];
          } catch (error) {
            console.log(
              "First mediums endpoint failed, trying alternatives..."
            );

            const endpoints = [
              "/api/v1/mediums?isActive=true",
              "/api/v1/mediums?status=active",
              "/api/v1/mediums?limit=100",
            ];

            for (const endpoint of endpoints) {
              try {
                console.log(` Trying endpoint: ${endpoint}`);
                const response = await makeAuthenticatedRequest(endpoint);

                if (response) {
                  if (response.data && Array.isArray(response.data.mediums)) {
                    return response.data.mediums;
                  } else if (response.data && Array.isArray(response.data)) {
                    return response.data;
                  } else if (Array.isArray(response.mediums)) {
                    return response.mediums;
                  } else if (Array.isArray(response)) {
                    return response;
                  }
                }
              } catch (e) {
                console.log(` Failed on ${endpoint}:`, e.message);
                continue;
              }
            }

            return [];
          }
        })()
      );

      fetchPromises.push(
        (async () => {
          try {
            const response = await makeAuthenticatedRequest(
              "/api/v1/subjects?isActive=true"
            );
            if (Array.isArray(response)) {
              return response;
            }
            return [];
          } catch (error) {
            try {
              const response =
                await makeAuthenticatedRequest("/api/v1/subjects");
              return Array.isArray(response) ? response : [];
            } catch (e) {
              return [];
            }
          }
        })()
      );

      const [gradesArray, mediumsArray, subjectsArray] =
        await Promise.all(fetchPromises);

      console.log(" Fetched data:", {
        exams: examsArray.length,
        grades: gradesArray.length,
        mediums: mediumsArray.length,
        subjects: subjectsArray.length,
      });

      if (mediumsArray.length === 0) {
        console.log(" No mediums from API, extracting from exams...");
        const mediumMap = new Map();
        examsArray.forEach((exam) => {
          if (exam.mediumId && exam.medium) {
            mediumMap.set(exam.mediumId, {
              id: exam.mediumId,
              name: exam.medium.name,
            });
          } else if (exam.mediumId) {
            mediumMap.set(exam.mediumId, {
              id: exam.mediumId,
              name: `Medium ${exam.mediumId}`,
            });
          }
        });
        mediumsArray.push(...Array.from(mediumMap.values()));
      }

      setAllExams(examsArray);
      setGrades(gradesArray);
      setMediums(mediumsArray);
      setSubjects(subjectsArray);

      const formattedExams = examsArray.map((exam) => {
        const grade = gradesArray.find((g: any) => g.id === exam.gradeId) || {
          id: exam.gradeId,
          name: exam.grade?.name || `Grade ${exam.gradeId}`,
        };
        const medium = mediumsArray.find(
          (m: any) => m.id === exam.mediumId
        ) || {
          id: exam.mediumId,
          name: exam.medium?.name || `Medium ${exam.mediumId}`,
        };
        const subject = subjectsArray.find(
          (s: any) => s.id === exam.subjectId
        ) || {
          id: exam.subjectId,
          name: exam.subject?.name || `Subject ${exam.subjectId}`,
        };

        const subjectName = subject.name || "General";
        const examColors = getExamColor(subjectName);

        return {
          id: exam.id,
          title: exam.title || "Untitled Exam",
          description: exam.description,
          grade: grade.name,
          medium: medium.name,
          subject: subjectName,
          className: exam.class?.name || exam.className || "General",
          time: exam.duration ? `${exam.duration} minutes` : "Not specified",
          startTime: exam.startTime,
          endTime: exam.endTime,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          icon: getExamIcon(subjectName),
          iconBg: examColors.iconBg,
          bg: examColors.bg,
          btnColor: examColors.btnColor,
          waveColor: examColors.waveColor,
          examData: {
            id: exam.id,
            title: exam.title,
            duration: exam.duration,
            startTime: exam.startTime,
            endTime: exam.endTime,
            gradeId: exam.gradeId,
            mediumId: exam.mediumId,
            subjectId: exam.subjectId,
            classId: exam.classId,
            totalMarks: exam.totalMarks,
            passingMarks: exam.passingMarks,
            instructions: exam.instructions,
          },
        };
      });

      setFilteredExams(formattedExams);
      console.log(" Formatted exams for display:", formattedExams.length);
    } catch (error) {
      console.error(" Error loading data:", error);
      setAllExams([]);
      setFilteredExams([]);
      setGrades([]);
      setMediums([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const getExamIcon = (subjectName: string): any => {
    if (!subjectName) return "assignment";

    const lowerSubject = subjectName.toLowerCase();

    if (lowerSubject.includes("math")) return "calculate";
    if (lowerSubject.includes("scien")) return "science";
    if (lowerSubject.includes("english")) return "menu-book";
    if (lowerSubject.includes("sinhala")) return "translate";
    if (lowerSubject.includes("tamil")) return "translate";
    if (lowerSubject.includes("history")) return "history";

    return "assignment";
  };

  const getExamColor = (subjectName: string) => {
    if (!subjectName) {
      return {
        iconBg: "#43A047",
        bg: "#E8F5E9",
        btnColor: "#43A047",
        waveColor: "#2E7D3233",
      };
    }

    const lowerSubject = subjectName.toLowerCase();

    if (lowerSubject.includes("math")) {
      return {
        iconBg: "#1E88E5",
        bg: "#E3F2FD",
        btnColor: "#1E88E5",
        waveColor: "#1E88E533",
      };
    }
    if (lowerSubject.includes("scien")) {
      return {
        iconBg: "#D81B60",
        bg: "#FCE4EC",
        btnColor: "#D81B60",
        waveColor: "#D81B6033",
      };
    }
    if (lowerSubject.includes("english")) {
      return {
        iconBg: "#FB8C00",
        bg: "#FFF3E0",
        btnColor: "#FB8C00",
        waveColor: "#FB8C0033",
      };
    }
    if (lowerSubject.includes("sinhala") || lowerSubject.includes("tamil")) {
      return {
        iconBg: "#00897B",
        bg: "#E0F2F1",
        btnColor: "#00897B",
        waveColor: "#00897B33",
      };
    }
    if (lowerSubject.includes("history")) {
      return {
        iconBg: "#6A1B9A",
        bg: "#F3E5F5",
        btnColor: "#6A1B9A",
        waveColor: "#6A1B9A33",
      };
    }

    return {
      iconBg: "#43A047",
      bg: "#E8F5E9",
      btnColor: "#43A047",
      waveColor: "#43A04733",
    };
  };

  const filterExams = useCallback(() => {
    console.log(" Filtering exams with criteria:", {
      gradeId: selectedGradeId,
      mediumId: selectedMediumId,
      subjectId: selectedSubjectId,
      totalExams: allExams.length,
    });

    if (allExams.length === 0) {
      setFilteredExams([]);
      return;
    }

    let filtered = [...allExams];

    if (selectedGradeId) {
      filtered = filtered.filter(
        (exam) => String(exam.gradeId) === String(selectedGradeId)
      );
    }

    if (selectedMediumId) {
      filtered = filtered.filter(
        (exam) => String(exam.mediumId) === String(selectedMediumId)
      );
    }

    if (selectedSubjectId) {
      filtered = filtered.filter(
        (exam) => String(exam.subjectId) === String(selectedSubjectId)
      );
    }

    const formattedExams = filtered.map((exam) => {
      const grade = grades.find((g: any) => g.id === exam.gradeId) || {
        id: exam.gradeId,
        name: exam.grade?.name || `Grade ${exam.gradeId}`,
      };
      const medium = mediums.find((m: any) => m.id === exam.mediumId) || {
        id: exam.mediumId,
        name: exam.medium?.name || `Medium ${exam.mediumId}`,
      };
      const subject = subjects.find((s: any) => s.id === exam.subjectId) || {
        id: exam.subjectId,
        name: exam.subject?.name || `Subject ${exam.subjectId}`,
      };

      const subjectName = subject.name || "General";
      const examColors = getExamColor(subjectName);

      return {
        id: exam.id,
        title: exam.title || "Untitled Exam",
        grade: grade.name,
        medium: medium.name,
        subject: subjectName,
        className: exam.class?.name || "General",
        time: exam.duration ? `${exam.duration} minutes` : "Not specified",
        startTime: exam.startTime,
        endTime: exam.endTime,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        icon: getExamIcon(subjectName),
        iconBg: examColors.iconBg,
        bg: examColors.bg,
        btnColor: examColors.btnColor,
        waveColor: examColors.waveColor,
        examData: {
          id: exam.id,
          title: exam.title,
          duration: exam.duration,
          startTime: exam.startTime,
          endTime: exam.endTime,
          gradeId: exam.gradeId,
          mediumId: exam.mediumId,
          subjectId: exam.subjectId,
          classId: exam.classId,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
        },
      };
    });

    console.log(" Filtered exams count:", formattedExams.length);
    setFilteredExams(formattedExams);
  }, [
    allExams,
    selectedGradeId,
    selectedMediumId,
    selectedSubjectId,
    grades,
    mediums,
    subjects,
  ]);

  const handleGradeSelect = (gradeItem: any) => {
    console.log(` Grade selected:`, gradeItem);
    setGrade(gradeItem.name);
    setSelectedGradeId(gradeItem.id);
    setShowGradeDropdown(false);
  };

  const handleMediumSelect = (mediumItem: any) => {
    console.log(` Medium selected:`, mediumItem);
    setMedium(mediumItem.name);
    setSelectedMediumId(mediumItem.id);
    setShowMediumDropdown(false);
  };

  const handleSubjectSelect = (subjectItem: any) => {
    console.log(` Subject selected:`, subjectItem);
    setSubject(subjectItem.name);
    setSelectedSubjectId(subjectItem.id);
    setShowSubjectDropdown(false);
  };

  const handleGradeDropdownToggle = () => {
    setShowGradeDropdown(!showGradeDropdown);
    if (!showGradeDropdown) {
      setZIndexGrade(100);
      setZIndexMedium(1);
      setZIndexSubject(1);
      setShowMediumDropdown(false);
      setShowSubjectDropdown(false);
    }
  };

  const handleMediumDropdownToggle = () => {
    setShowMediumDropdown(!showMediumDropdown);
    if (!showMediumDropdown) {
      setZIndexMedium(100);
      setZIndexGrade(1);
      setZIndexSubject(1);
      setShowGradeDropdown(false);
      setShowSubjectDropdown(false);
    }
  };

  const handleSubjectDropdownToggle = () => {
    setShowSubjectDropdown(!showSubjectDropdown);
    if (!showSubjectDropdown) {
      setZIndexSubject(100);
      setZIndexGrade(1);
      setZIndexMedium(1);
      setShowGradeDropdown(false);
      setShowMediumDropdown(false);
    }
  };

  const handleStartExam = async (exam) => {
    try {
      console.log("🚀 Starting exam:", exam.examData.id);

      // Get token directly
      const { accessToken } = useAuthStore.getState();
      const token = accessToken;

      console.log("🔍 Token for exam start:", {
        hasToken: !!token,
        tokenLength: token?.length,
      });

      if (!token) {
        Alert.alert(
          "Authentication Required",
          "Please login again to continue.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Login",
              onPress: () => router.push("/(auth)/sign-in"),
            },
          ]
        );
        return;
      }

      Alert.alert(
        "Start Exam",
        `Are you ready to start ${exam.title} exam?\n\nDuration: ${exam.time}\nGrade: ${exam.grade}\nMedium: ${exam.medium}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Start Exam",
            onPress: async () => {
              try {
                // Navigate with token
                router.push({
                  pathname: "/exam_start",
                  params: {
                    examId: exam.examData.id,
                    examTitle: exam.title,
                    duration: exam.examData.duration?.toString() || "60",
                    grade: exam.grade,
                    medium: exam.medium,
                    subject: exam.subject,
                    token: token, // Pass token
                    gradeId: exam.examData.gradeId?.toString() || "",
                    mediumId: exam.examData.mediumId?.toString() || "",
                    subjectId: exam.examData.subjectId?.toString() || "",
                    startTime: exam.examData.startTime || "",
                    endTime: exam.examData.endTime || "",
                    totalMarks: exam.examData.totalMarks?.toString() || "",
                    passingMarks: exam.examData.passingMarks?.toString() || "",
                  },
                });
              } catch (error) {
                console.error(" Error navigating:", error);
                Alert.alert("Error", "Failed to start exam. Please try again.");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error(" Error checking exam status:", error);
      Alert.alert("Error", "Unable to check exam status. Please try again.");
    }
  };

  // Add new function to handle view results/rank

  const resetFilters = () => {
    console.log(" Resetting all filters");
    setGrade("Grade");
    setMedium("Medium");
    setSubject("Subject");
    setSelectedGradeId(null);
    setSelectedMediumId(null);
    setSelectedSubjectId(null);
    setShowGradeDropdown(false);
    setShowMediumDropdown(false);
    setShowSubjectDropdown(false);
  };

  useEffect(() => {
    if (isSignedIn && currentUser) {
      console.log(" Loading data for user:", currentUser.email);
      loadAllData().catch((error) => {
        console.log(" Main load failed:", error);
      });
    }
  }, [isSignedIn, currentUser]);

  useEffect(() => {
    if (allExams.length > 0) {
      filterExams();
    }
  }, [
    selectedGradeId,
    selectedMediumId,
    selectedSubjectId,
    allExams,
    filterExams,
  ]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0057FF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isSignedIn || !currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Please sign in to view exams</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Learn App</Text>

        {/* Filter Box */}
        <View>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.dropdown, { zIndex: zIndexGrade }]}
              onPress={handleGradeDropdownToggle}
            >
              <Text style={styles.dropdownText}>{grade}</Text>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={20}
                color="#777"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dropdown, { zIndex: zIndexMedium }]}
              onPress={handleMediumDropdownToggle}
            >
              <Text style={styles.dropdownText}>{medium}</Text>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={20}
                color="#777"
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.row,
              { position: "relative", zIndex: zIndexSubject },
            ]}
          >
            <TouchableOpacity
              style={[styles.dropdown, { flex: 1 }]}
              onPress={handleSubjectDropdownToggle}
            >
              <Text style={styles.dropdownText}>{subject}</Text>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={20}
                color="#777"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterBtn} onPress={resetFilters}>
              <Image source={icons.filter} style={styles.filterIcon} />
            </TouchableOpacity>
          </View>

          {showGradeDropdown && (
            <View
              style={[
                styles.dropdownMenu,
                { left: 0, width: "48%", zIndex: 101 },
              ]}
            >
              <ScrollView style={styles.dropdownScroll}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setGrade("Grade");
                    setSelectedGradeId(null);
                    setShowGradeDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>All Grades</Text>
                </TouchableOpacity>
                {grades.length > 0 ? (
                  grades.map((gradeItem: any) => (
                    <TouchableOpacity
                      key={gradeItem.id}
                      style={styles.dropdownItem}
                      onPress={() => handleGradeSelect(gradeItem)}
                    >
                      <Text style={styles.dropdownItemText}>
                        {gradeItem.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.dropdownItem}>
                    <Text style={[styles.dropdownItemText, { color: "#999" }]}>
                      No grades available
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {showMediumDropdown && (
            <View
              style={[
                styles.dropdownMenu,
                { right: 0, width: "48%", zIndex: 101 },
              ]}
            >
              <ScrollView style={styles.dropdownScroll}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setMedium("Medium");
                    setSelectedMediumId(null);
                    setShowMediumDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>All Mediums</Text>
                </TouchableOpacity>
                {mediums.length > 0 ? (
                  mediums.map((mediumItem: any) => (
                    <TouchableOpacity
                      key={mediumItem.id}
                      style={styles.dropdownItem}
                      onPress={() => handleMediumSelect(mediumItem)}
                    >
                      <Text style={styles.dropdownItemText}>
                        {mediumItem.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.dropdownItem}>
                    <Text style={[styles.dropdownItemText, { color: "#999" }]}>
                      No mediums available
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {showSubjectDropdown && (
            <View
              style={[
                styles.dropdownMenu,
                { left: 0, width: "78%", zIndex: 101 },
              ]}
            >
              <ScrollView style={styles.dropdownScroll}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSubject("Subject");
                    setSelectedSubjectId(null);
                    setShowSubjectDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>All Subjects</Text>
                </TouchableOpacity>
                {subjects.length > 0 ? (
                  subjects.map((subjectItem: any) => (
                    <TouchableOpacity
                      key={subjectItem.id}
                      style={styles.dropdownItem}
                      onPress={() => handleSubjectSelect(subjectItem)}
                    >
                      <Text style={styles.dropdownItemText}>
                        {subjectItem.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.dropdownItem}>
                    <Text style={[styles.dropdownItemText, { color: "#999" }]}>
                      No subjects available
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Available Exams */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Available Exams</Text>
        <Text style={styles.subTitle}>Choose your test</Text>
        {selectedGradeId || selectedMediumId || selectedSubjectId ? (
          <Text style={styles.filterInfo}>
            Filtered by: {selectedGradeId ? grade + " " : ""}
            {selectedMediumId ? medium + " " : ""}
            {selectedSubjectId ? subject : ""}
            {filteredExams.length > 0 && ` (${filteredExams.length} exams)`}
          </Text>
        ) : (
          <Text style={styles.filterInfo}>
            Showing all exams ({filteredExams.length} available)
          </Text>
        )}
      </View>

      {filteredExams.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="assignment" size={60} color="#999" />
          <Text style={styles.emptyText}>
            {selectedGradeId || selectedMediumId || selectedSubjectId
              ? "No exams found for your selected filters"
              : "No exams available at the moment"}
          </Text>
          {(selectedGradeId || selectedMediumId || selectedSubjectId) && (
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {filteredExams.map((item, index) => (
            <ExamCard
              key={item.id || index}
              data={item}
              onStart={handleStartExam}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function ExamCard({
  data,
  onStart,
}: {
  data: any;
  onStart: (data: any) => void;
}) {
  // Function to check if exam is active (before end time)
  const isExamActive = () => {
    if (!data.examData?.endTime) return true; // If no end time, assume active

    const now = new Date();
    const endTime = new Date(data.examData.endTime);

    return now < endTime;
  };

  // Function to check if exam has started (after start time)
  const hasExamStarted = () => {
    if (!data.examData?.startTime) return true; // If no start time, assume started

    const now = new Date();
    const startTime = new Date(data.examData.startTime);

    return now >= startTime;
  };

  // Determine button state
  const canStartExam = isExamActive() && hasExamStarted();
  const examEnded = !isExamActive();

  return (
    <View style={[styles.card, { backgroundColor: data.bg }]}>
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

      <View style={styles.cardTop}>
        <View style={[styles.iconBox, { backgroundColor: data.iconBg }]}>
          <MaterialIcons name={data.icon} size={24} color="#FFF" />
        </View>

        <View style={styles.cardDetails}>
          <Text style={styles.cardTitle}>{data.subject}</Text>

          <View style={styles.detailRow}>
            <Image source={icons.calender} style={styles.inputIcon} />
            <Text style={styles.detailText}>{data.grade}</Text>
          </View>

          <View style={styles.detailRow}>
            <Image source={icons.clock} style={styles.inputIcon} />
            <Text style={styles.detailText}>{data.time}</Text>
          </View>
        </View>

        <Text
          style={[
            styles.unitExam,
            {
              color: data.btnColor,
              backgroundColor: data.btnColor + "20",
              margin: 4,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: "600",
            },
          ]}
        >
          Unit Exam
        </Text>
      </View>

      {/* Conditional button rendering */}
      {canStartExam ? (
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: data.btnColor }]}
          onPress={() => onStart(data)}
        >
          <Text style={styles.startText}>Start</Text>
        </TouchableOpacity>
      ) : examEnded ? (
        <View style={styles.rankViewContainer}>
          <TouchableOpacity
            style={[styles.rankBtn, { backgroundColor: data.btnColor + "40" }]}
            onPress={() =>
              router.replace({
                pathname: "/(root)/(screens)/ExamRanking",
                params: {
                  examId: data.examData.id,
                },
              })
            }
          >
            <MaterialIcons name="leaderboard" size={16} color={data.btnColor} />
            <Text style={[styles.rankText, { color: data.btnColor }]}>
              Rank
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewBtn, { backgroundColor: data.btnColor }]}
            onPress={() =>
              router.replace({
                pathname: "/ExamFinished",
                params: {
                  examId: data.examData.id,
                  examTitle: data.title,
                  duration: data.examData.duration?.toString() || "60",
                  grade: data.grade,
                  medium: data.medium,
                  subject: data.subject,
                  attemptsAllowed: data.examData.attemptsAllowed,
                  token: data.token, // Pass token
                  gradeId: data.examData.gradeId?.toString() || "",
                  mediumId: data.examData.mediumId?.toString() || "",
                  subjectId: data.examData.subjectId?.toString() || "",
                  startTime: data.examData.startTime || "",
                  endTime: data.examData.endTime || "",
                  totalMarks: data.examData.totalMarks?.toString() || "",
                  passingMarks: data.examData.passingMarks?.toString() || "",
                  enableRanking: data.examData.enableRanking?.toString(), // Add this
                  showResults: data.examData.showResults?.toString(), // Add this
                },
              })
            }
          >
            <MaterialIcons name="visibility" size={16} color="#FFF" />
            <Text style={styles.viewText}>View</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.disabledBtnContainer}>
          <Text style={[styles.disabledText, { color: data.btnColor }]}>
            Not Started
          </Text>
        </View>
      )}
    </View>
  );
}

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
  appTitle: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 10,
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
  },
  dropdownText: {
    color: "#666",
    fontSize: 14,
  },
  dropdownMenu: {
    position: "absolute",
    top: 50,
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },
  filterBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  filterIcon: {
    width: 20,
    height: 15,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  subTitle: {
    color: "#888",
    marginTop: 2,
  },
  filterInfo: {
    fontSize: 12,
    color: "#0057FF",
    marginTop: 5,
    fontStyle: "italic",
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
    marginBottom: 20,
  },
  resetButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#0057FF",
    borderRadius: 8,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  scrollView: {
    paddingHorizontal: 15,
  },
  card: {
    padding: 10,
    marginVertical: 10,
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
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    position: "relative",
    zIndex: 2,
  },
  iconBox: {
    padding: 12,
    borderRadius: 12,
    position: "relative",
    zIndex: 2,
  },
  cardDetails: {
    position: "relative",
    zIndex: 2,
    flex: 1,
    marginLeft: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 0,
    color: "#333",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  detailText: {
    color: "#666",
    marginTop: 4,
  },
  inputIcon: {
    width: 15,
    height: 15,
    marginTop: 3,
  },
  unitExam: {
    fontWeight: "600",
    fontSize: 14,
    marginTop: -2,
    position: "relative",
    zIndex: 2,
  },
  startBtn: {
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: "flex-end",
    position: "relative",
    zIndex: 2,
  },
  startText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  // New styles for rank/view buttons
  rankViewContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    position: "relative",
    zIndex: 2,
    gap: 4,
  },
  rankBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 5,
  },
  rankText: {
    fontWeight: "600",
    fontSize: 14,
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 5,
  },
  viewText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  disabledBtnContainer: {
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: "flex-end",
    position: "relative",
    zIndex: 2,
    backgroundColor: "#f0f0f0",
  },
  disabledText: {
    fontWeight: "600",
    fontSize: 14,
  },
});
