import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons, Entypo } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import useNotificationStore, {
  NotificationItem,
  AnnouncementItem,
} from "@/stores/notificationStore";

type TabType = "notifications" | "announcements";

export default function Notifications() {
  const [activeTab, setActiveTab] = useState<TabType>("notifications");
  const [refreshing, setRefreshing] = useState(false);

  const {
    notifications,
    announcements,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchAnnouncements,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotificationStore();

  // Format date to relative time
  const formatTimeAgo = (dateString: string | Date): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60)
        return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
      if (diffHours < 24)
        return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
      if (diffDays < 7)
        return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recently";
    }
  };

  // Get icon based on notification type
  const getIconForType = (type: string, title: string) => {
    const upperType = type?.toUpperCase() || "GENERAL";

    // Match by type first for precision
    switch (upperType) {
      case "SESSION_ONLINE":
        return <Ionicons name="videocam" size={28} color="#6366f1" />;
      case "SESSION_PHYSICAL":
        return <Ionicons name="body" size={28} color="#0d9488" />;
      case "SESSION_REMINDER":
        return <Ionicons name="alarm" size={28} color="#f59e0b" />;
      case "ASSIGNMENT_NEW":
        return <MaterialIcons name="assignment" size={28} color="#6366f1" />;
      case "ANNOUNCEMENT":
        return <Ionicons name="megaphone" size={28} color="#9A2143" />;
      case "SUCCESS":
        return <Ionicons name="checkmark-circle" size={28} color="#10b981" />;
      case "WARNING":
        return <MaterialIcons name="warning" size={28} color="#f59e0b" />;
      case "ERROR":
        return <Ionicons name="alert-circle" size={28} color="#ef4444" />;
    }

    // Fallback: match by title keywords
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("reminder")) {
      return <Ionicons name="alarm" size={28} color="#f59e0b" />;
    }
    if (lowerTitle.includes("online session")) {
      return <Ionicons name="videocam" size={28} color="#6366f1" />;
    }
    if (lowerTitle.includes("physical session") || lowerTitle.includes("session")) {
      return <Ionicons name="body" size={28} color="#0d9488" />;
    }
    if (lowerTitle.includes("assignment")) {
      return <MaterialIcons name="assignment" size={28} color="#6366f1" />;
    }
    if (lowerTitle.includes("approved") || lowerTitle.includes("success")) {
      return <Ionicons name="checkmark-circle" size={28} color="#10b981" />;
    }
    if (lowerTitle.includes("rejected") || lowerTitle.includes("denied")) {
      return <Ionicons name="close-circle" size={28} color="#ef4444" />;
    }

    return <Ionicons name="notifications" size={28} color="#0057FF" />;
  };

  // Get announcement priority color
  const getPriorityStyle = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
      case "URGENT":
        return { borderLeftColor: "#ef4444", bg: "#fef2f2" };
      case "NORMAL":
        return { borderLeftColor: "#0057FF", bg: "#eff6ff" };
      case "LOW":
        return { borderLeftColor: "#10b981", bg: "#ecfdf5" };
      default:
        return { borderLeftColor: "#6b7280", bg: "#f9fafb" };
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    Alert.alert("Success", "All notifications marked as read");
  };

  const handleDeleteNotification = (id: string) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteNotification(id),
        },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Separate today's and older notifications
  const todayNotifications = notifications.filter((n) => {
    try {
      const date = new Date(n.createdAt || n.sentAt);
      return date.toDateString() === new Date().toDateString();
    } catch {
      return false;
    }
  });

  const olderNotifications = notifications.filter((n) => {
    try {
      const date = new Date(n.createdAt || n.sentAt);
      return date.toDateString() !== new Date().toDateString();
    } catch {
      return true;
    }
  });

  // Loading state
  if (loading && notifications.length === 0 && announcements.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0057FF" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  // Error state
  if (error && notifications.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderNotificationCard = (notification: NotificationItem) => (
    <TouchableOpacity
      key={notification.id}
      style={[styles.card, !notification.isRead && styles.cardUnread]}
      onPress={() => handleMarkAsRead(notification.id)}
      onLongPress={() => handleDeleteNotification(notification.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardIcon}>
        {getIconForType(notification.type, notification.title || "Notification")}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>
          {notification.title || "Notification"}
        </Text>
        <Text style={styles.cardMsg} numberOfLines={3}>
          {notification.message || "No message"}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardTime}>
            {notification.sentAt
              ? formatTimeAgo(notification.sentAt)
              : notification.createdAt
              ? formatTimeAgo(notification.createdAt)
              : "Recently"}
          </Text>
          {notification.type && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {notification.type.replace(/_/g, " ")}
              </Text>
            </View>
          )}
        </View>
      </View>
      {!notification.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderAnnouncementCard = (announcement: AnnouncementItem) => {
    const priorityStyle = getPriorityStyle(announcement.priority);
    return (
      <View
        key={announcement.id}
        style={[
          styles.announcementCard,
          { borderLeftColor: priorityStyle.borderLeftColor },
        ]}
      >
        <View style={styles.announcementHeader}>
          <Ionicons name="megaphone" size={22} color="#9A2143" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.announcementTitle}>{announcement.title}</Text>
            {announcement.priority?.toUpperCase() !== "NORMAL" && (
              <View
                style={[
                  styles.priorityBadge,
                  {
                    backgroundColor:
                      announcement.priority?.toUpperCase() === "HIGH" ||
                      announcement.priority?.toUpperCase() === "URGENT"
                        ? "#fef2f2"
                        : "#ecfdf5",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.priorityBadgeText,
                    {
                      color:
                        announcement.priority?.toUpperCase() === "HIGH" ||
                        announcement.priority?.toUpperCase() === "URGENT"
                          ? "#ef4444"
                          : "#10b981",
                    },
                  ]}
                >
                  {announcement.priority.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.announcementContent} numberOfLines={4}>
          {announcement.content}
        </Text>
        <View style={styles.announcementMeta}>
          <Text style={styles.announcementTime}>
            {announcement.publishedAt
              ? formatTimeAgo(announcement.publishedAt)
              : formatTimeAgo(announcement.createdAt)}
          </Text>
          {announcement.type && announcement.type !== "GENERAL" && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{announcement.type}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderNotificationsTab = () => {
    if (notifications.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#999" />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>
            You'll see notifications here when you have new updates
          </Text>
        </View>
      );
    }

    return (
      <>
        {/* Mark all as read */}
        {unreadCount > 0 && (
          <View style={styles.actionRow}>
            <Text style={styles.unreadBadge}>
              {unreadCount} unread
            </Text>
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <Ionicons name="checkmark-done" size={16} color="#0057FF" />
              <Text style={styles.markAllButtonText}>Mark all read</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Today */}
        {todayNotifications.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Today{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </Text>
            {todayNotifications.map(renderNotificationCard)}
          </>
        )}

        {/* Older */}
        {olderNotifications.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
              Earlier
            </Text>
            {olderNotifications.map(renderNotificationCard)}
          </>
        )}
      </>
    );
  };

  const renderAnnouncementsTab = () => {
    if (announcements.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="megaphone-outline" size={64} color="#999" />
          <Text style={styles.emptyText}>No announcements</Text>
          <Text style={styles.emptySubtext}>
            Important announcements from ArmiGo will appear here
          </Text>
        </View>
      );
    }

    return (
      <>
        <Text style={styles.sectionTitle}>
          {announcements.length} Active Announcement
          {announcements.length === 1 ? "" : "s"}
        </Text>
        {announcements.map(renderAnnouncementCard)}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "notifications" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("notifications")}
        >
          <Ionicons
            name="notifications"
            size={18}
            color={activeTab === "notifications" ? "#0057FF" : "#9ca3af"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "notifications" && styles.tabTextActive,
            ]}
          >
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "announcements" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("announcements")}
        >
          <Ionicons
            name="megaphone"
            size={18}
            color={activeTab === "announcements" ? "#9A2143" : "#9ca3af"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "announcements" && styles.tabTextActive,
            ]}
          >
            Announcements
          </Text>
          {announcements.length > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: "#9A2143" }]}>
              <Text style={styles.tabBadgeText}>{announcements.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === "notifications"
          ? renderNotificationsTab()
          : renderAnnouncementsTab()}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {activeTab === "notifications"
              ? `${notifications.length} notification${
                  notifications.length === 1 ? "" : "s"
                }`
              : `${announcements.length} announcement${
                  announcements.length === 1 ? "" : "s"
                }`}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: 10,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Poppins-Regular",
  },
  retryButton: {
    backgroundColor: "#0057FF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 30,
  },
  /* Tabs */
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 18,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    gap: 6,
  },
  tabActive: {
    borderColor: "#0057FF",
    backgroundColor: "#eff6ff",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9ca3af",
  },
  tabTextActive: {
    color: "#111827",
  },
  tabBadge: {
    backgroundColor: "#0057FF",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  /* Action Row */
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  unreadBadge: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "600",
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  markAllButtonText: {
    color: "#0057FF",
    fontSize: 13,
    fontWeight: "600",
  },

  /* Section */
  sectionTitle: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 12,
    fontWeight: "600",
  },

  /* Notification Cards */
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardUnread: {
    backgroundColor: "#fafbff",
    borderLeftWidth: 3,
    borderLeftColor: "#0057FF",
  },
  cardIcon: {
    marginRight: 12,
    marginTop: 2,
    width: 36,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  cardMsg: {
    marginTop: 3,
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 19,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  cardTime: {
    color: "#9ca3af",
    fontSize: 12,
  },
  typeBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  unreadDot: {
    width: 10,
    height: 10,
    backgroundColor: "#0057FF",
    borderRadius: 5,
    marginLeft: 8,
    marginTop: 6,
  },

  /* Announcement Cards */
  announcementCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#0057FF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  announcementContent: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    marginBottom: 10,
  },
  announcementMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  announcementTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },

  /* Footer */
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#9ca3af",
  },
});

