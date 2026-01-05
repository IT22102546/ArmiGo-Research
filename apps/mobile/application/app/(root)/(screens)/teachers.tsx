import { icons } from "@/constants";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { apiFetch } from "@/utils/api";
import useAuthStore from "@/stores/authStore";

const Teachers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("INTERNAL"); // ALL, INTERNAL, EXTERNAL
  
  // Get auth state from store
  const { isSignedIn, refreshTokens } = useAuthStore();

  // Fetch teachers from the specific endpoint
  const fetchTeachers = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      else setRefreshing(true);

      console.log(`🔍 Fetching teachers from /teachers/list endpoint`);

      // Check if user is signed in
      if (!isSignedIn) {
        Alert.alert(
          "Authentication Required",
          "Please sign in to view teachers.",
          [{ text: "OK" }]
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Using your apiFetch utility with the specific endpoint
      const response = await apiFetch('/api/v1/classes/teachers/list', {
        method: 'GET',
      });

      // Check if token expired and try to refresh
      if (response.status === 401) {
        console.log("🔐 Token expired, attempting to refresh...");
        const refreshSuccess = await refreshTokens();
        
        if (refreshSuccess) {
          console.log("🔄 Token refreshed, retrying request...");
          return fetchTeachers(isRefreshing);
        } else {
          Alert.alert(
            "Session Expired",
            "Please sign in again.",
            [{ text: "OK" }]
          );
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error: ${response.status}`, errorText);
        throw new Error(`Failed to load teachers: ${response.status}`);
      }

      const result = await response.json();
      
      console.log(`📊 Received teachers data:`, result);
      
      // Filter teachers based on filter type
      let filteredTeachers = [];
      if (Array.isArray(result)) {
        filteredTeachers = result.filter(teacher => {
          if (filter === "INTERNAL") {
            return teacher.role === "INTERNAL_TEACHER" || 
                   teacher.user?.role === "INTERNAL_TEACHER" ||
                   teacher.type === "INTERNAL";
          } 
          return true;
        });
      } else if (result.data && Array.isArray(result.data)) {
        filteredTeachers = result.data.filter(teacher => {
           if (filter === "INTERNAL") {
            return teacher.role === "INTERNAL_TEACHER" || 
                   teacher.user?.role === "INTERNAL_TEACHER" ||
                   teacher.type === "INTERNAL";
          } 
          return true;
        });
      } else {
        console.warn("⚠️ Unexpected response format:", result);
        filteredTeachers = [];
      }
      
      // Apply search filter
      if (searchQuery) {
        filteredTeachers = filteredTeachers.filter(teacher => {
          const searchLower = searchQuery.toLowerCase();
          return (
            (teacher.firstName?.toLowerCase() || '').includes(searchLower) ||
            (teacher.lastName?.toLowerCase() || '').includes(searchLower) ||
            (teacher.fullName?.toLowerCase() || '').includes(searchLower) ||
            (teacher.name?.toLowerCase() || '').includes(searchLower) ||
            (teacher.email?.toLowerCase() || '').includes(searchLower) ||
            (teacher.phone?.toLowerCase() || '').includes(searchLower) ||
            (teacher.subject?.toLowerCase() || '').includes(searchLower) ||
            (teacher.subjects?.some((sub: string) => sub.toLowerCase().includes(searchLower)) || false)
          );
        });
      }
      
      console.log(`✅ Displaying ${filteredTeachers.length} teachers after filtering`);
      setTeachers(filteredTeachers);
      
    } catch (error) {
      console.error("❌ Error fetching teachers:", error);
      Alert.alert(
        "Error",
        "Failed to load teachers. Please try again.",
        [{ text: "OK", onPress: handleRefresh }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    fetchTeachers(true);
  };

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, filter]);

  // Initial fetch
  useEffect(() => {
    const initFetch = async () => {
      // Check auth status first
      await useAuthStore.getState().checkAuthStatus();
      const { isSignedIn: signedIn } = useAuthStore.getState();
      
      if (signedIn) {
        await fetchTeachers(false);
      } else {
        setLoading(false);
        Alert.alert(
          "Authentication Required",
          "Please sign in to view teachers.",
          [{ text: "OK" }]
        );
      }
    };
    
    initFetch();
  }, []);

  // Filter button component
  const FilterButton = ({ title, value }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === value && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === value && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Get teacher name from different possible field structures
  const getTeacherName = (teacher) => {
    if (teacher.fullName) return teacher.fullName;
    if (teacher.firstName && teacher.lastName) {
      return `${teacher.firstName} ${teacher.lastName}`;
    }
    if (teacher.name) return teacher.name;
    if (teacher.user?.fullName) return teacher.user.fullName;
    if (teacher.user?.firstName && teacher.user?.lastName) {
      return `${teacher.user.firstName} ${teacher.user.lastName}`;
    }
    if (teacher.user?.name) return teacher.user.name;
    return "Teacher";
  };

  // Get teacher email
  const getTeacherEmail = (teacher) => {
    return teacher.email || teacher.user?.email || "No email";
  };

  // Get teacher subjects
  const getTeacherSubjects = (teacher) => {
    if (teacher.subjects && Array.isArray(teacher.subjects)) {
      return teacher.subjects;
    }
    if (teacher.subject) {
      return [teacher.subject];
    }
    if (teacher.subjectAssignments && Array.isArray(teacher.subjectAssignments)) {
      return teacher.subjectAssignments.map(sa => sa.subject?.name).filter(Boolean);
    }
    return ["No subjects assigned"];
  };

  // Get teacher type
  const getTeacherType = (teacher) => {
    if (teacher.role) {
      if (teacher.role === "INTERNAL_TEACHER") return "Internal";
      if (teacher.role === "EXTERNAL_TEACHER") return "External";
      return teacher.role.replace("_", " ");
    }
    if (teacher.user?.role) {
      if (teacher.user.role === "INTERNAL_TEACHER") return "Internal";
      if (teacher.user.role === "EXTERNAL_TEACHER") return "External";
      return teacher.user.role.replace("_", " ");
    }
    if (teacher.type) {
      return teacher.type.charAt(0).toUpperCase() + teacher.type.slice(1);
    }
    return "Teacher";
  };

  // Get teacher status
  const getTeacherStatus = (teacher) => {
    return teacher.status || teacher.user?.status || "ACTIVE";
  };

  // Avatar component with fallback to initials
  const Avatar = ({ teacher }) => {
    const getInitials = () => {
      const name = getTeacherName(teacher);
      if (!name || name === "Teacher") return "T";
      
      return name
        .split(' ')
        .map(word => word[0])
        .filter(char => char && char.match(/[A-Za-z]/))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    };

    const getAvatarColor = () => {
      const colors = ['#005CFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
      const teacherId = teacher.id || teacher._id || teacher.userId || teacher.user?.id || '';
      if (!teacherId) return colors[0];
      
      const index = parseInt(teacherId, 36) % colors.length;
      return colors[index];
    };

    if (teacher.profilePicture || teacher.avatar || teacher.user?.profilePicture) {
      return (
        <Image
          source={{ uri: teacher.profilePicture || teacher.avatar || teacher.user?.profilePicture }}
          style={styles.avatarImage}
        />
      );
    }

    return (
      <View style={[
        styles.avatarPlaceholder,
        { backgroundColor: getAvatarColor() }
      ]}>
        <Text style={styles.avatarText}>
          {getInitials()}
        </Text>
      </View>
    );
  };

  // Render teacher card
  const renderTeacherCard = ({ item }) => {
    const teacherName = getTeacherName(item);
    const teacherType = getTeacherType(item);
    const subjects = getTeacherSubjects(item);
    const primarySubject = subjects[0];
    const status = getTeacherStatus(item);
    
    // Get stars/ratings (you can update this based on your actual data)
    const stars = item.rating || item.stars || Math.floor(Math.random() * 20) + 5;

    return (
      <View style={styles.teacherCard}>
        <View style={styles.teacherInfo}>
          <View style={styles.avatarContainer}>
            <Avatar teacher={item} />
           {/*} <View style={[
              styles.teacherTypeBadge,
              (item.role === 'INTERNAL_TEACHER' || item.user?.role === 'INTERNAL_TEACHER') && styles.internalBadge,
              (item.role === 'EXTERNAL_TEACHER' || item.user?.role === 'EXTERNAL_TEACHER') && styles.externalBadge,
            ]}>
              <Text style={styles.teacherTypeText}>{teacherType}</Text>
            </View>*/}
          </View>
          
          <View style={styles.teacherDetails}>
            <Text style={styles.teacherName}>{teacherName}</Text>
            
            <Text style={styles.teacherEmail}>
              {getTeacherEmail(item)}
            </Text>
            
            <Text style={styles.teacherSubject}>{primarySubject}</Text>
            
            {subjects.length > 1 && (
              <Text style={styles.additionalSubjects}>
                +{subjects.length - 1} more subject{subjects.length > 2 ? 's' : ''}
              </Text>
            )}
            
            <View style={styles.statsContainer}>
              <View style={styles.starsContainer}>
                <Image source={icons.star} style={styles.starIcon} />
                <Text style={styles.starsText}>{stars} Stars</Text>
              </View>
              
              <View style={styles.statusBadge}>
                <Text style={[
                  styles.statusText,
                  status === 'ACTIVE' && styles.statusActive,
                  status === 'PENDING' && styles.statusPending,
                  status === 'SUSPENDED' && styles.statusSuspended,
                  status === 'INACTIVE' && styles.statusInactive,
                ]}>
                  {status}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => {
            Alert.alert(
              "Start Chat",
              `Would you like to start a chat with ${teacherName}?`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Start Chat", onPress: () => {
                  console.log(`Start chat with teacher: ${item.id}`);
                  // Navigate to chat screen
                  // navigation.navigate('Chat', { teacherId: item.id, teacherName })
                }}
              ]
            );
          }}
        >
          <Image source={icons.chatT} style={styles.chatIcon} />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Show loading indicator
  if (loading && teachers.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#005CFF" />
        <Text style={styles.loadingText}>Loading teachers...</Text>
      </View>
    );
  }

  // Show auth required message
  if (!isSignedIn && !loading) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.authTitle}>Authentication Required</Text>
        <Text style={styles.authText}>
          Please sign in to view the teachers list
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Image source={icons.search} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, subject, or email"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      {/* Stats Summary */}
      {teachers.length > 0 && (
        <View style={styles.statsSummary}>
          <Text style={styles.statsText}>
            {teachers.length} teacher{teachers.length !== 1 ? 's' : ''} found
            {filter !== 'INTERNAL' ? ` (${filter})` : ''}
          </Text>
        </View>
      )}

      {/* Teachers List */}
      <FlatList
        data={teachers}
        renderItem={renderTeacherCard}
        keyExtractor={(item) => 
          item.id || 
          item._id || 
          item.userId || 
          item.user?.id || 
          Math.random().toString()
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#005CFF"]}
            tintColor="#005CFF"
          />
        }
        ListEmptyComponent={
          !isSignedIn ? null : (
            <View style={styles.emptyContainer}>
              <Image source={icons.search} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No Teachers Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? `No teachers match "${searchQuery}"`
                  : filter !== 'INTERNAL'
                  ? `No ${filter.toLowerCase()} teachers found`
                  : "No teachers available"}
              </Text>
              <TouchableOpacity
                style={styles.tryAgainButton}
                onPress={handleRefresh}
              >
                <Text style={styles.tryAgainText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  authTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  authText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#005CFF",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: "#9CA3AF",
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  statsSummary: {
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#005CFF",
    textAlign: "center",
  },
  listContainer: {
    paddingBottom: 20,
  },
  teacherCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  teacherInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  teacherTypeBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#10B981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  internalBadge: {
    backgroundColor: "#005CFF",
  },
  externalBadge: {
    backgroundColor: "#8B5CF6",
  },
  teacherTypeText: {
    color: "white",
    fontSize: 8,
    fontWeight: "bold",
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  teacherEmail: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  teacherSubject: {
    fontSize: 14,
    color: "#005CFF",
    marginBottom: 4,
    fontWeight: "600",
  },
  additionalSubjects: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starIcon: {
    width: 15,
    height: 15,
    marginRight: 4,
    tintColor: "#F59E0B",
  },
  starsText: {
    fontSize: 14,
    color: "#6B7280",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#F3F4F6",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusActive: {
    color: "#10B981",
  },
  statusPending: {
    color: "#F59E0B",
  },
  statusSuspended: {
    color: "#EF4444",
  },
  statusInactive: {
    color: "#6B7280",
  },
  chatButton: {
    backgroundColor: "#005CFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    minWidth: 80,
  },
  chatButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  chatIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    tintColor: "white",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    tintColor: "#9CA3AF",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  tryAgainButton: {
    backgroundColor: "#005CFF",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tryAgainText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default Teachers;