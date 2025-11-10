import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Modal,
  SafeAreaView,
  StatusBar,
  FlatList,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  X,
  Clock,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle,
  Send,
  Users,
  ArrowRight,
  FileText,
  Download,
} from "lucide-react-native";
import { apiFetch } from "@/utils/api";
import useAuthStore from "@/stores/authStore";
import { MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Types based on your backend DTOs
interface TransferRequest {
  id: string;
  uniqueId?: string;
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  fromZone?: { id: string; name: string } | string;
  toZones?: Array<{ id: string; name: string } | string>;
  subject?: { id: string; name: string } | string;
  medium?: { id: string; name: string } | string;
  currentSchool?: string;
  currentSchoolType?: string;
  currentDistrict?: string;
  currentZone?: string;
  yearsOfService?: number;
  qualifications?: string[];
  isInternalTeacher?: boolean;
  preferredSchoolTypes?: string[];
  additionalRequirements?: string;
  notes?: string;
  status?: string;
  verified?: boolean;
  verifiedAt?: string;
  level?: string;
  createdAt?: string;
  updatedAt?: string;
  attachments?: string[];
}

interface TransferStats {
  activeRequests?: number;
  totalSent?: number;
  pendingRequests?: number;
  potentialMatches?: number;
  verifiedCount?: number;
  reqSend?: number;
  reqReceived?: number;
  pendingApproval?: number;
}

// Helper function to extract field name
const getFieldName = (field: any): string => {
  if (!field) return "N/A";
  if (typeof field === "string") return field;
  if (field.name) return field.name;
  if (field.code) return field.code;
  return "N/A";
};

export default function TeacherTransferRequests() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const viewId = params.view as string;

  const { currentUser, isSignedIn } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"sent" | "received">("received");

  // Data states
  const [sentRequests, setSentRequests] = useState<TransferRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<TransferRequest[]>([]);
  const [stats, setStats] = useState<TransferStats>({});

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Detail modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);

  // Action dialogs
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"accept" | "decline" | "withdraw">("accept");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      if (!isSignedIn) {
        Alert.alert(
          "Authentication Required",
          "Please sign in to access transfer requests",
          [
            {
              text: "Sign In",
              onPress: () => router.replace("/(auth)/selectSignIn"),
            },
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => router.back(),
            },
          ]
        );
        return;
      }
      await fetchData();
    };

    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    if (viewId && (sentRequests.length > 0 || receivedRequests.length > 0)) {
      const found =
        sentRequests.find((r) => r.id === viewId) ||
        receivedRequests.find((r) => r.id === viewId);
      if (found) {
        setSelectedRequest(found);
        setDetailModalVisible(true);
      }
    }
  }, [viewId, sentRequests, receivedRequests]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSentRequests(),
        fetchAvailableRequests(),
        fetchStats(),
      ]);
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      handleApiError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const response = await apiFetch("/api/v1/transfer/matches");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSentRequests(Array.isArray(data) ? data : data.data || []);
    } catch (error: any) {
      console.error("Failed to fetch sent requests:", error);
      setSentRequests([]);
    }
  };

  const fetchAvailableRequests = async () => {
    try {
      const response = await apiFetch("/api/v1/transfer/browse");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      let requests: TransferRequest[] = [];
      
      if (Array.isArray(data)) {
        requests = data;
      } else if (data.requests && Array.isArray(data.requests)) {
        requests = data.requests;
      } else if (data.data && Array.isArray(data.data)) {
        requests = data.data;
      }
      
      const mappedRequests: TransferRequest[] = requests.map((item: any) => ({
        id: item.id || item._id || Math.random().toString(),
        uniqueId: item.uniqueId || `TR-${(item.id || Math.random().toString()).slice(0, 8)}`,
        requester: item.requester || {
          firstName: "Teacher",
          lastName: "",
        },
        fromZone: item.fromZone || "Unknown Zone",
        toZones: item.toZones || item.desiredZones || [],
        subject: item.subject || "Unknown Subject",
        medium: item.medium || "Unknown Medium",
        currentSchool: item.currentSchool || "Unknown School",
        currentSchoolType: item.currentSchoolType,
        currentDistrict: item.currentDistrict,
        currentZone: item.currentZone || item.fromZone || "Unknown Zone",
        yearsOfService: item.yearsOfService || 0,
        qualifications: item.qualifications || [],
        isInternalTeacher: item.isInternalTeacher !== undefined ? item.isInternalTeacher : true,
        preferredSchoolTypes: item.preferredSchoolTypes || [],
        additionalRequirements: item.additionalRequirements,
        notes: item.notes,
        status: item.status || "PENDING",
        verified: item.verified || false,
        verifiedAt: item.verifiedAt,
        level: item.level || "PRIMARY",
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        attachments: item.attachments || [],
      }));
      
      setReceivedRequests(mappedRequests);
    } catch (error: any) {
      console.error("Failed to fetch available requests:", error);
      setReceivedRequests([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiFetch("/api/v1/transfer/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchRequestDetail = async (requestId: string) => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/v1/transfer/${requestId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSelectedRequest(data);
      setDetailModalVisible(true);
    } catch (error: any) {
      console.error("Failed to fetch request detail:", error);
      Alert.alert("Error", "Failed to load request details");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (requestId: string) => {
    try {
      setActionLoading(true);
      
      const response = await apiFetch(`/api/v1/transfer/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: "Request sent for mutual transfer"
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      Alert.alert("Success", "Transfer request sent successfully!");
      await fetchData();
      
    } catch (error: any) {
      console.error("Failed to send request:", error);
      Alert.alert("Error", error.message || "Failed to send request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);

      switch (actionType) {
        case "accept":
          await apiFetch(`/api/v1/transfer/${selectedRequest.id}/accept`, {
            method: "POST",
            body: JSON.stringify({
              notes: "Request accepted",
            }),
          });
          Alert.alert("Success", "Transfer request accepted");
          break;
        case "decline":
        case "withdraw":
          await apiFetch(`/api/v1/transfer/${selectedRequest.id}`, {
            method: "DELETE",
          });
          Alert.alert(
            "Success",
            `Transfer request ${actionType === "decline" ? "declined" : "withdrawn"}`
          );
          break;
      }

      await fetchData();
      setShowActionDialog(false);
      setDetailModalVisible(false);
    } catch (error: any) {
      console.error(`Failed to ${actionType} request:`, error);
      Alert.alert("Error", error.message || `Failed to ${actionType} request`);
    } finally {
      setActionLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleApiError = (error: any) => {
    if (error.message?.includes("401") || error.message?.includes("403")) {
      Alert.alert(
        "Session Expired",
        "Your session has expired. Please sign in again.",
        [
          {
            text: "Sign In",
            onPress: () => {
              useAuthStore.getState().signOut();
              router.replace("/(auth)/selectSignIn");
            },
          },
        ]
      );
    } else {
      Alert.alert("Error", "Failed to load data. Please try again.");
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    const actualStatus = status || "PENDING";
    
    const configs = {
      PENDING: {
        color: "#F59E0B",
        bgColor: "#FEF3C7",
        label: "Pending",
        icon: Clock,
      },
      VERIFIED: {
        color: "#3B82F6",
        bgColor: "#DBEAFE",
        label: "Verified",
        icon: CheckCircle,
      },
      ACCEPTED: {
        color: "#10B981",
        bgColor: "#D1FAE5",
        label: "Accepted",
        icon: CheckCircle,
      },
      REJECTED: {
        color: "#EF4444",
        bgColor: "#FEE2E2",
        label: "Rejected",
        icon: XCircle,
      },
      COMPLETED: {
        color: "#059669",
        bgColor: "#D1FAE5",
        label: "Completed",
        icon: CheckCircle,
      },
      CANCELLED: {
        color: "#EF4444",
        bgColor: "#FEE2E2",
        label: "Cancelled",
        icon: XCircle,
      },
      MATCHED: {
        color: "#8B5CF6",
        bgColor: "#F3E8FF",
        label: "Matched",
        icon: Users,
      },
    };

    return configs[actualStatus as keyof typeof configs] || configs.PENDING;
  };

  const filterRequests = (requests: TransferRequest[]) => {
    let filtered = requests;

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (request) =>
          request.uniqueId?.toLowerCase().includes(term) ||
          request.currentSchool?.toLowerCase().includes(term) ||
          (typeof request.fromZone === 'string' 
            ? request.fromZone.toLowerCase().includes(term)
            : request.fromZone?.name?.toLowerCase().includes(term)) ||
          getFieldName(request.subject).toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const canWithdraw = (request: TransferRequest) => {
    const status = request.status || "PENDING";
    return ["PENDING", "VERIFIED"].includes(status);
  };

  // Render Stats Cards
  const StatCard = ({ title, value, color, icon: Icon }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

// Render Request Card - Fixed with error handling
const RequestCard = ({
  request,
  type,
}: {
  request: TransferRequest;
  type: "sent" | "received";
}) => {
  const statusConfig = getStatusBadge(request.status);
  const StatusIcon = statusConfig.icon;
  const canWithdrawRequest = type === "sent" && canWithdraw(request);

  const location = request.currentSchool && typeof request.currentSchool === 'string' 
    ? request.currentSchool.split(',')[0] 
    : "Kaluthara";

  return (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => fetchRequestDetail(request.id)}
    >
      {/* Header with ID and Location */}
      <View style={styles.cardHeader}>
        <View style={styles.headerIdContainer}>
          <Text style={styles.headerId}># {request.uniqueId || `TR-${request.id.slice(0, 8)}`}</Text>
        </View>
        {/* Status Badge */}
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusConfig.bgColor },
          ]}
        >
          <StatusIcon size={12} color={statusConfig.color} />
          <Text
            style={[styles.statusText, { color: statusConfig.color }]}
          >
            {statusConfig.label}
          </Text>
        </View>
      </View>
      </View>

      
      {/* Subject and Details - exactly like screenshot */}
      <View className="flex flex-row justify-between" style={styles.subjectSection}>
        <View className="flex flex-row gap-2">
          <MaterialIcons name="library-books" size={16} color="#6B7280" />
           <Text style={styles.subjectText}>
          {getFieldName(request.subject)}
        </Text>
        </View>
       
        <View className="flex flex-row gap-2" style={styles.detailsRow}>
                    <MaterialIcons name="language" size={16} color="#6B7280" />

          <Text style={styles.detailText}>
            {getFieldName(request.medium)} ,{request.level?.toLowerCase() || "Primary"}
          </Text>
        </View>
      </View>

      {/* Zones Container - exactly like screenshot */}
      <View style={styles.zonesContainer}>
        <View style={styles.zoneItem}>
          <View style={[styles.zoneIcon, styles.wantZoneIcon]}>
            <Text style={styles.zoneIconText}>+</Text>
          </View>
          <View style={styles.zoneInfo}>
            <Text style={styles.zoneLabel}>Want to :</Text>
            <View style={styles.zoneTags}>
              {request.toZones && request.toZones.length > 0 ? (
                <>
                  {request.toZones.slice(0, 2).map((zone, idx) => (
                    <View key={idx} style={styles.zoneTag}>
                      <Text style={styles.zoneTagText}>
                        {getFieldName(zone)}
                      </Text>
                    </View>
                  ))}
                  {request.toZones.length > 2 && (
                    <View style={styles.moreZoneTag}>
                      <Text style={styles.moreZoneTagText}>
                        +{request.toZones.length - 2}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.zoneTag}>
                  <Text style={styles.zoneTagText}>Any Zone</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.zoneItem}>
          <View style={[styles.zoneIcon, styles.currentZoneIcon]}>
            <Text style={[styles.zoneIconText, { color: "#3B82F6" }]}>•</Text>
          </View>
          <View style={styles.zoneInfo}>
            <Text style={styles.zoneLabel}>Current :</Text>
            <View style={styles.zoneTags}>
              <View style={styles.zoneTag}>
                <Text style={styles.zoneTagText}>
                  {getFieldName(request.fromZone)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* SINGLE BUTTON - Only Send Request button like in screenshot */}
      {type === "received" && (request.status === "VERIFIED" || request.status === "PENDING")  && (
        <TouchableOpacity
          style={styles.sendRequestButton}
          onPress={(e) => {
            e.stopPropagation();
            handleSendRequest(request.id);
          }}
          disabled={actionLoading}
        >
          <Send size={16} color="#fff" />
          <Text style={styles.sendRequestText}>Send Request</Text>
        </TouchableOpacity>
      )}

      {/* For sent requests, show nothing - no withdraw button */}
    </TouchableOpacity>
  );
};

  const EmptyState = ({ type }: { type: "sent" | "received" }) => (
    <View style={styles.emptyState}>
      <Send size={48} color="#9CA3AF" />
      <Text style={styles.emptyStateTitle}>
        {type === "sent" ? "No requests sent yet" : "No available requests"}
      </Text>
      <Text style={styles.emptyStateText}>
        {type === "sent"
          ? "Start searching for compatible matches to send requests"
          : "There are no transfer requests available at the moment"}
      </Text>
    </View>
  );

  // Render Detail Modal
  const renderDetailModal = () => (
    <Modal
      visible={detailModalVisible}
      animationType="slide"
      onRequestClose={() => setDetailModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalBackButton}
            onPress={() => setDetailModalVisible(false)}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Transfer Request Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {selectedRequest && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.statusSection}>
              <Text style={styles.sectionLabel}>Status:</Text>
              <View
                style={[
                  styles.detailStatusBadge,
                  {
                    backgroundColor: getStatusBadge(selectedRequest.status)
                      .bgColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.detailStatusText,
                    { color: getStatusBadge(selectedRequest.status).color },
                  ]}
                >
                  {getStatusBadge(selectedRequest.status).label}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Registration Information</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Registration ID:</Text>
                  <Text style={styles.infoValue}>
                    {selectedRequest.uniqueId || "N/A"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Years of Service:</Text>
                  <Text style={styles.infoValue}>
                    {selectedRequest.yearsOfService || 0} years
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current School</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>School:</Text>
                  <Text style={styles.infoValue}>
                    {selectedRequest.currentSchool || "N/A"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Type:</Text>
                  <Text style={styles.infoValue}>
                    {selectedRequest.currentSchoolType || "N/A"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>District:</Text>
                  <Text style={styles.infoValue}>
                    {selectedRequest.currentDistrict || "N/A"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Zone:</Text>
                  <Text style={styles.infoValue}>
                    {selectedRequest.currentZone || "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transfer Preferences</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>From Zone:</Text>
                  <Text style={styles.infoValue}>
                    {getFieldName(selectedRequest.fromZone)}
                  </Text>
                </View>
                {selectedRequest.toZones &&
                  selectedRequest.toZones.length > 0 && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Desired Zones:</Text>
                      <View style={styles.tagsContainer}>
                        {selectedRequest.toZones.map((zone, idx) => (
                          <View key={idx} style={styles.tag}>
                            <Text style={styles.tagText}>
                              {getFieldName(zone)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Teaching Details</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Subject:</Text>
                  <Text style={styles.infoValue}>
                    {getFieldName(selectedRequest.subject)}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Medium:</Text>
                  <Text style={styles.infoValue}>
                    {getFieldName(selectedRequest.medium)}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Level:</Text>
                  <Text style={styles.infoValue}>
                    {selectedRequest.level?.toUpperCase() || "PRIMARY"}
                  </Text>
                </View>
              </View>
            </View>

            {(selectedRequest.additionalRequirements ||
              selectedRequest.notes) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                {selectedRequest.additionalRequirements && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Requirements:</Text>
                    <Text style={styles.infoValue}>
                      {selectedRequest.additionalRequirements}
                    </Text>
                  </View>
                )}
                {selectedRequest.notes && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Notes:</Text>
                    <Text style={styles.infoValue}>
                      {selectedRequest.notes}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {selectedRequest.attachments &&
              selectedRequest.attachments.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Attachments</Text>
                  <View style={styles.attachmentsContainer}>
                    {selectedRequest.attachments.map((attachment, idx) => (
                      <View key={idx} style={styles.attachmentItem}>
                        <FileText size={16} color="#6B7280" />
                        <Text style={styles.attachmentName} numberOfLines={1}>
                          {attachment.split("/").pop() || attachment}
                        </Text>
                        <TouchableOpacity style={styles.downloadButton}>
                          <Download size={16} color="#4F46E5" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Created:</Text>
                  <Text style={styles.infoValue}>
                    {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : "N/A"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Updated:</Text>
                  <Text style={styles.infoValue}>
                    {selectedRequest.updatedAt ? new Date(selectedRequest.updatedAt).toLocaleString() : "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            {activeTab === "received" && selectedRequest.status === "VERIFIED" && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.sendActionButton]}
                  onPress={() => handleSendRequest(selectedRequest.id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Send size={20} color="#fff" />
                      <Text style={styles.sendActionText}>Send Request</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {activeTab === "sent" && selectedRequest.status === "PENDING" && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.withdrawActionButton]}
                  onPress={() => {
                    setActionType("withdraw");
                    setShowActionDialog(true);
                  }}
                >
                  <Trash2 size={20} color="#EF4444" />
                  <Text style={styles.withdrawActionText}>Withdraw Request</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalSpacer} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  // Render Action Dialog
  const renderActionDialog = () => (
    <Modal
      visible={showActionDialog}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowActionDialog(false)}
    >
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogContainer}>
          <AlertCircle size={48} color="#EF4444" />

          <Text style={styles.dialogTitle}>
            {actionType === "accept" && "Accept Transfer Request?"}
            {actionType === "decline" && "Decline Transfer Request?"}
            {actionType === "withdraw" && "Withdraw Transfer Request?"}
          </Text>

          <Text style={styles.dialogMessage}>
            {actionType === "accept" &&
              "By accepting, you agree to proceed with this mutual transfer. This action cannot be undone."}
            {actionType === "decline" &&
              "The sender will be notified of your decision. This action cannot be undone."}
            {actionType === "withdraw" &&
              "Your transfer request will be cancelled and removed from the system."}
          </Text>

          <View style={styles.dialogButtons}>
            <TouchableOpacity
              style={[styles.dialogButton, styles.dialogCancelButton]}
              onPress={() => setShowActionDialog(false)}
              disabled={actionLoading}
            >
              <Text style={styles.dialogCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dialogButton,
                actionType === "accept"
                  ? styles.dialogAcceptButton
                  : actionType === "decline"
                    ? styles.dialogDeclineButton
                    : styles.dialogWithdrawButton,
              ]}
              onPress={handleAction}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.dialogActionText}>
                  {actionType === "accept" && "Yes, Accept"}
                  {actionType === "decline" && "Yes, Decline"}
                  {actionType === "withdraw" && "Yes, Withdraw"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const currentRequests =
    activeTab === "sent" ? sentRequests : receivedRequests;
  const filteredRequests = filterRequests(currentRequests);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
      >
        <StatCard
          title="Received "
          value={stats.reqSend || sentRequests.length}
          color="#3B82F6"
          icon={Send}
        />
        <StatCard
          title="Transfer "
          value={stats.reqReceived || receivedRequests.length}
          color="#22C55E"
          icon={Send}
        />
        <StatCard
          title="Pending"
          value={
            stats.pendingApproval ||
            sentRequests.filter((r) => r.status === "PENDING").length +
              receivedRequests.filter((r) => r.status === "PENDING").length
          }
          color="#F59E0B"
          icon={Clock}
        />
        <StatCard
          title="Verified"
          value={
            stats.verifiedCount ||
            sentRequests.filter((r) => r.status === "VERIFIED").length +
              receivedRequests.filter((r) => r.status === "VERIFIED").length
          }
          color="#10B981"
          icon={CheckCircle}
        />
      </ScrollView>
      
      <View style={styles.refreshContainer}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchData}
          disabled={loading}
        >
          <RefreshCw size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "received" && styles.activeTab]}
          onPress={() => setActiveTab("received")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "received" && styles.activeTabText,
            ]}
          >
            Transfer Requests ({receivedRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "sent" && styles.activeTab]}
          onPress={() => setActiveTab("sent")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "sent" && styles.activeTabText,
            ]}
          >
            Received Requests ({sentRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search requests..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm ? (
              <TouchableOpacity onPress={() => setSearchTerm("")}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color="#4F46E5" />
          <Text style={styles.filterButtonText}>Filter</Text>
          {showFilters ? (
            <ChevronUp size={16} color="#4F46E5" />
          ) : (
            <ChevronDown size={16} color="#4F46E5" />
          )}
        </TouchableOpacity>
      </View>

      {showFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusFiltersContainer}
        >
          <TouchableOpacity
            style={[
              styles.statusFilter,
              statusFilter === "all" && styles.activeStatusFilter,
            ]}
            onPress={() => setStatusFilter("all")}
          >
            <Text
              style={[
                styles.statusFilterText,
                statusFilter === "all" && styles.activeStatusFilterText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {[
            "PENDING",
            "VERIFIED",
            "ACCEPTED",
            "REJECTED",
            "COMPLETED",
            "CANCELLED",
            "MATCHED",
          ].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusFilter,
                statusFilter === status && styles.activeStatusFilter,
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  statusFilter === status && styles.activeStatusFilterText,
                ]}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestCard request={item} type={activeTab} />
        )}
        ListEmptyComponent={<EmptyState type={activeTab} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {renderDetailModal()}
      {renderActionDialog()}
    </View>
  );
}

/* ---------------- Styles ---------------- */

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
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  refreshContainer: {
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  refreshButton: {
    padding: 8,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  statCard: {
    width: 120,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#4F46E5",
  },
  tabText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  activeTabText: {
    color: "#fff",
    fontFamily: "Inter-SemiBold",
  },
  filtersContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    gap: 12,
  },
  searchContainer: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 14,
    color: "#111827",
    fontFamily: "Inter-Regular",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: "#4F46E5",
    fontFamily: "Inter-Medium",
  },
  statusFiltersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  statusFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeStatusFilter: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  statusFilterText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  activeStatusFilterText: {
    color: "#fff",
    fontFamily: "Inter-SemiBold",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  
  // REQUEST CARD STYLES - UPDATED TO MATCH SCREENSHOT
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter-Bold",
  },
  statusRow: {
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  locationText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter-Regular",
  },
  subjectSection: {
    marginBottom: 16,
  },
  subjectText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6B7280",
    fontFamily: "poppins",
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 16,
    color: "#6B7280",
    fontFamily: "poppins",
  },
  zonesContainer: {
    marginBottom: 16,
  },
  zoneItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  zoneIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  wantZoneIcon: {
    backgroundColor: "#10B98120",
  },
  currentZoneIcon: {
    backgroundColor: "#3B82F620",
  },
  zoneIconText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10B981",
  },
  zoneInfo: {
    flex: 1,
  },
  zoneLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    fontFamily: "Inter-Medium",
  },
  zoneTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  zoneTag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  zoneTagText: {
    fontSize: 12,
    color: "#4B5563",
    fontFamily: "Inter-Medium",
  },
  moreZoneTag: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  moreZoneTagText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  // Send Request Button - Full width like in screenshot
  sendRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: "#4F46E5",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  sendRequestText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  // Removed styles that are no longer needed:
  // cardButtonsContainer, viewButton, viewButtonText, withdrawButton, withdrawButtonText
  
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "Inter-SemiBold",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "Inter-Regular",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalBackButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter-SemiBold",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statusSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
    fontFamily: "Inter-SemiBold",
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
    fontFamily: "Inter-Medium",
  },
  infoValue: {
    fontSize: 16,
    color: "#111827",
    fontFamily: "Inter-Regular",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: "#4B5563",
    fontFamily: "Inter-Medium",
  },
  attachmentsContainer: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  attachmentName: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
    fontFamily: "Inter-Regular",
  },
  downloadButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  sendActionButton: {
    backgroundColor: "#4F46E5",
  },
  sendActionText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  withdrawActionButton: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  withdrawActionText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  modalSpacer: {
    height: 40,
  },
  // Dialog Styles
  dialogOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  dialogContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "Inter-SemiBold",
  },
  dialogMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: "Inter-Regular",
  },
  dialogButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  dialogButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  dialogCancelButton: {
    backgroundColor: "#F3F4F6",
  },
  dialogCancelText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  dialogAcceptButton: {
    backgroundColor: "#10B981",
  },
  dialogDeclineButton: {
    backgroundColor: "#EF4444",
  },
  dialogWithdrawButton: {
    backgroundColor: "#EF4444",
  },
  dialogActionText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
});