import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState } from "react";
import { icons, images } from "@/constants";
import { apiFetch } from "@/utils/api";
import useAuthStore from "@/stores/authStore";
import { useRouter } from "expo-router";

export default function Publications() {
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchases, setPurchases] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const { currentUser, isSignedIn, refreshTokens } = useAuthStore();
  const router = useRouter();

  // Enhanced API call function with token refresh
  const makeAuthenticatedRequest = async (endpoint, options = {}) => {
    try {
      const response = await apiFetch(endpoint, options);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("401");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result; // Return the full result object
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  };

  // Fetch Publications from API
  const fetchPublications = async (page = 1) => {
    try {
      if (!isSignedIn || !currentUser) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log(" Fetching Publications for user:", currentUser.email);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        status: "PUBLISHED",
        sortBy: "newest",
      });

      // Make the request
      const response = await apiFetch(
        `/api/v1/publications?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Publications API response:", result);

      // CORRECTED: Get data from the correct structure
      const publicationsArray = result?.data || [];
      const paginationData = result?.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
      };

      console.log(
        " Publications fetched successfully:",
        publicationsArray.length,
        "Publications"
      );

      // If refreshing or first page, replace publications
      if (page === 1) {
        setPublications(publicationsArray);
      } else {
        setPublications((prev) => [...prev, ...publicationsArray]);
      }

      setPagination(paginationData);

      // If user is logged in, fetch their purchases
      if (currentUser) {
        fetchUserPurchases();
      }
    } catch (error) {
      console.error(" Error fetching Publications:", error);

      if (error.message.includes("401")) {
        // Handle token refresh
        const refreshSuccess = await refreshTokens();
        if (refreshSuccess) {
          // Retry the request after refresh
          return fetchPublications(page);
        } else {
          Alert.alert("Session Expired", "Please sign in again", [
            { text: "OK", onPress: () => useAuthStore.getState().signOut() },
          ]);
        }
      } else {
        // Set empty array as fallback
        setPublications([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch user's purchases
  const fetchUserPurchases = async () => {
    try {
      const purchasesData = await makeAuthenticatedRequest(
        "/api/v1/publications/user/purchases?page=1&limit=100"
      );

      // Create a map of purchased publication IDs for quick lookup
      const purchasesMap = {};
      const purchasesList = purchasesData?.purchases || [];

      console.log(" Purchases fetched:", purchasesList.length, "items");

      purchasesList.forEach((purchase) => {
        if (purchase.publication?.id) {
          purchasesMap[purchase.publication.id] = true;
        } else if (purchase.publicationId) {
          purchasesMap[purchase.publicationId] = true;
        }
      });

      setPurchases(purchasesMap);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      // Silently fail - purchases data is not critical for viewing
    }
  };

  // Handle purchase
  const handlePurchase = async (publicationId, publicationTitle, price) => {
    try {
      if (!isSignedIn) {
        Alert.alert(
          "Sign In Required",
          "Please sign in to purchase publications",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Sign In", onPress: () => router.push("/sign-in") },
          ]
        );
        return;
      }

      Alert.alert(
        "Confirm Purchase",
        `Purchase "${publicationTitle}" for LKR ${price.toFixed(2)}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Purchase",
            onPress: async () => {
              try {
                const purchaseResult = await makeAuthenticatedRequest(
                  `/api/v1/publications/${publicationId}/purchase`,
                  {
                    method: "POST",
                  }
                );

                console.log("Purchase successful:", purchaseResult);

                Alert.alert("Success", "Publication purchased successfully!", [
                  {
                    text: "OK",
                    onPress: () => {
                      // Refresh purchases status
                      fetchUserPurchases();
                    },
                  },
                ]);
              } catch (error) {
                console.error("Purchase error details:", error);
                Alert.alert(
                  "Purchase Failed",
                  error.message ||
                    "Failed to purchase publication. Please check your wallet balance."
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Purchase error:", error);
      Alert.alert("Error", "Failed to process purchase");
    }
  };

  // Handle download
  const handleDownload = async (publicationId) => {
    try {
      const downloadData = await makeAuthenticatedRequest(
        `/api/v1/publications/${publicationId}/download`
      );

      if (downloadData.url) {
        Alert.alert(
          "Download Available",
          "The download URL has been generated.",
          [
            {
              text: "OK",
              onPress: () => {
                // You can implement file download here
                // For now, just log the URL
                console.log("Download URL:", downloadData.url);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert(
        "Download Failed",
        error.message || "Failed to generate download link."
      );
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchPublications(1);
  };

  // Load more publications
  const loadMorePublications = () => {
    if (pagination.page < pagination.totalPages && !loading) {
      fetchPublications(pagination.page + 1);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (isSignedIn && currentUser) {
        await fetchPublications(1);
      } else {
        setLoading(false);
      }
    };
    loadData();
  }, [isSignedIn, currentUser]);

  // Publication Card Component - Updated for backend data structure
  const PublicationCard = ({ publication }) => {
    const isPurchased = purchases[publication.id];
    const finalPrice = publication.discountPrice || publication.price;
    const purchaseCount = publication._count?.purchases || 0;
    const reviewCount = publication._count?.reviews || 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image
            source={
              publication.coverImage
                ? { uri: publication.coverImage }
                : images.test
            }
            style={styles.publicationImage}
          />
          <View style={styles.cardContent}>
            <Text style={styles.title}>{publication.title}</Text>

            <Text style={styles.description} numberOfLines={2}>
              {publication.shortDescription ||
                publication.description ||
                "No description available"}
            </Text>

            <View style={styles.metaInfo}>
              <Text style={styles.author}>
                By {publication.author || "Unknown"}
              </Text>

              {publication.publisher && (
                <View style={styles.publisherTag}>
                  <Text style={styles.publisherText}>
                    {publication.publisher}
                  </Text>
                </View>
              )}
            </View>

            {/* Stats row */}
            <View style={styles.statsContainer}>
              {purchaseCount > 0 && (
                <View style={styles.statItem}>
                  <Text style={styles.statText}>{purchaseCount} purchases</Text>
                </View>
              )}

              {reviewCount > 0 && (
                <View style={styles.statItem}>
                  <Image source={icons.star} style={styles.statIcon} />
                  <Text style={styles.statText}>{reviewCount} reviews</Text>
                </View>
              )}

              {publication.downloads > 0 && (
                <View style={styles.statItem}>
                  <Image source={icons.download} style={styles.statIcon} />
                  <Text style={styles.statText}>
                    {publication.downloads} downloads
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Rating and price section */}
        <View style={styles.ratingPriceContainer}>
          {publication.rating && (
            <View style={styles.ratingContainer}>
              <Image source={icons.star} style={styles.starIcon} />
              <Text style={styles.ratingText}>
                {publication.rating.toFixed(1)}
              </Text>
              <Text style={styles.ratingCount}>({reviewCount})</Text>
            </View>
          )}

          <View style={styles.priceContainer}>
            {publication.discountPrice && (
              <Text style={styles.originalPrice}>
                LKR {publication.price.toFixed(2)}
              </Text>
            )}
            <Text style={styles.finalPrice}>LKR {finalPrice.toFixed(2)}</Text>
            {publication.discountPrice && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  Save{" "}
                  {(
                    ((publication.price - publication.discountPrice) /
                      publication.price) *
                    100
                  ).toFixed(0)}
                  %
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionContainer}>
          {isPurchased ? (
            <>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => handleDownload(publication.id)}
              >
                <Image source={icons.download} style={styles.buttonIcon} />
                <Text style={styles.downloadButtonText}>Download</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => {
                  // Navigate to review screen or show review modal
                  Alert.alert(
                    "Leave a Review",
                    "Would you like to review this publication?",
                    [
                      { text: "Later" },
                      {
                        text: "Review Now",
                        onPress: () => {
                          // Implement review functionality
                          router.push({
                            pathname: "/review",
                            params: {
                              publicationId: publication.id,
                              title: publication.title,
                            },
                          });
                        },
                      },
                    ]
                  );
                }}
              >
                <Image source={icons.star} style={styles.buttonIcon} />
                <Text style={styles.reviewButtonText}>Review</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.buyButton}
              onPress={() =>
                handlePurchase(publication.id, publication.title, finalPrice)
              }
            >
              <View style={styles.buyButtonContent}>
                <Image
                  source={icons.shoppingCart}
                  style={styles.buyButtonIcon}
                />
                <View style={styles.buyButtonTextContainer}>
                  <Text style={styles.buyButtonText}>Buy Now</Text>
                  <Text style={styles.buyButtonSubText}>
                    {publication.discountPrice
                      ? "Discounted Price"
                      : "Regular Price"}
                  </Text>
                </View>
                <Text style={styles.buyButtonPrice}>
                  LKR {finalPrice.toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Status and metadata */}
        <View style={styles.footerContainer}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                publication.status === "PUBLISHED"
                  ? styles.publishedBadge
                  : publication.status === "DRAFT"
                    ? styles.draftBadge
                    : styles.archivedBadge,
              ]}
            >
              <Text style={styles.statusText}>
                {publication.status?.toLowerCase()}
              </Text>
            </View>

            {publication.publishedAt && (
              <Text style={styles.publishedDate}>
                {new Date(publication.publishedAt).toLocaleDateString()}
              </Text>
            )}
          </View>

          {publication.fileType && (
            <View style={styles.fileTypeContainer}>
              <Image
                source={publication.fileType === "pdf" ? icons.pdf : icons.file}
                style={styles.fileTypeIcon}
              />
              <Text style={styles.fileTypeText}>
                {publication.fileType.toUpperCase()}
                {publication.fileSize && ` • ${publication.fileSize} MB`}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading Publications...</Text>
      </View>
    );
  }

  if (!isSignedIn || !currentUser) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>Sign In Required</Text>
        <Text style={styles.authText}>
          Please sign in to view and purchase publications
        </Text>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => router.push("/sign-in")}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#007bff"]}
          tintColor="#007bff"
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.statsOverview}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pagination.total}</Text>
            <Text style={styles.statLabel}>Total Publications</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {Object.keys(purchases).length}
            </Text>
            <Text style={styles.statLabel}>Your Purchases</Text>
          </View>
        </View>
      </View>

      {publications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Publications Found</Text>
          <Text style={styles.emptyText}>
            There are currently no published materials available. Check back
            later for new content.
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              Showing {publications.length} of {pagination.total} publications
            </Text>
            <Text style={styles.pageInfo}>
              Page {pagination.page} of {pagination.totalPages}
            </Text>
          </View>

          {publications.map((publication) => (
            <PublicationCard key={publication.id} publication={publication} />
          ))}

          {pagination.page < pagination.totalPages && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={loadMorePublications}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#007bff" />
              ) : (
                <Text style={styles.loadMoreText}>Load More Publications</Text>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  statsOverview: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#005CFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  resultsCount: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  pageInfo: {
    fontSize: 12,
    color: "#999",
    backgroundColor: "#e9ecef",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  publicationImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: "#e9ecef",
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: "#636e72",
    lineHeight: 20,
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  author: {
    fontSize: 13,
    color: "#666",
    marginRight: 12,
  },
  publisherTag: {
    backgroundColor: "#e9ecef",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  publisherText: {
    fontSize: 11,
    color: "#495057",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
    tintColor: "#6c757d",
  },
  statText: {
    fontSize: 12,
    color: "#6c757d",
  },
  ratingPriceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
    tintColor: "#ffc107",
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginRight: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: "#6c757d",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  originalPrice: {
    fontSize: 14,
    color: "#6c757d",
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  finalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#28a745",
  },
  discountBadge: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  discountText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  actionContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  buyButton: {
    flex: 1,
    backgroundColor: "#005CFF",
    borderRadius: 10,
    overflow: "hidden",
  },
  buyButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  buyButtonIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
    marginRight: 12,
  },
  buyButtonTextContainer: {
    flex: 1,
  },
  buyButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 2,
  },
  buyButtonSubText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
  },
  buyButtonPrice: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 8,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: "#28a745",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 10,
  },
  reviewButton: {
    flex: 1,
    backgroundColor: "#ffc107",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 10,
  },
  buttonIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    tintColor: "#fff",
  },
  downloadButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  reviewButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  publishedBadge: {
    backgroundColor: "#d4edda",
  },
  draftBadge: {
    backgroundColor: "#fff3cd",
  },
  archivedBadge: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  publishedBadgeText: {
    color: "#155724",
  },
  draftBadgeText: {
    color: "#856404",
  },
  archivedBadgeText: {
    color: "#721c24",
  },
  publishedDate: {
    fontSize: 11,
    color: "#6c757d",
  },
  fileTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  fileTypeIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    tintColor: "#6c757d",
  },
  fileTypeText: {
    fontSize: 11,
    color: "#6c757d",
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
  authContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  authText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: "#005CFF",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  signInButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
    opacity: 0.7,
    borderRadius: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  refreshButton: {
    backgroundColor: "#005CFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  loadMoreButton: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  loadMoreText: {
    color: "#005CFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
