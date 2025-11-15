"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  ShoppingCart,
  Star,
  BookOpen,
  Download,
  Eye,
  Heart,
  Grid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { publicationsApi } from "@/lib/api/endpoints/publications";
import { useAuthStore } from "@/stores/auth-store";
import { Publication } from "@/lib/api/types/publications.types";
import PaymentConfirmationModal from "@/components/features/marketplace/PaymentConfirmationModal";
import { getDisplayName } from "@/lib/utils/display";

interface MarketplaceFilters {
  search: string;
  grade: string;
  subject: string;
  medium: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
}

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<Set<string>>(new Set());
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [userPurchases, setUserPurchases] = useState<Set<string>>(new Set());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPublicationForPurchase, setSelectedPublicationForPurchase] =
    useState<Publication | null>(null);

  const [filters, setFilters] = useState<MarketplaceFilters>({
    search: searchParams?.get("search") || "",
    grade: searchParams?.get("grade") || "",
    subject: searchParams?.get("subject") || "",
    medium: searchParams?.get("medium") || "",
    minPrice: searchParams?.get("minPrice") || "",
    maxPrice: searchParams?.get("maxPrice") || "",
    sortBy: searchParams?.get("sortBy") || "newest",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  // Categories for filtering
  const categories = [
    { value: "all", label: "All Publications" },
    { value: "textbook", label: "Textbooks" },
    { value: "workbook", label: "Workbooks" },
    { value: "guide", label: "Study Guides" },
    { value: "reference", label: "Reference Materials" },
    { value: "exam_prep", label: "Exam Preparation" },
  ];

  // Subjects for filtering
  const subjects = [
    "Mathematics",
    "Science",
    "English",
    "History",
    "Geography",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Art",
  ];

  // Load publications
  useEffect(() => {
    fetchPublications();
  }, [filters, pagination.page]);

  // Load user purchases
  useEffect(() => {
    if (user) {
      fetchUserPurchases();
    }
  }, [user]);

  const fetchPublications = async () => {
    try {
      setLoading(true);
      const response = await publicationsApi.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        status: "PUBLISHED",
        minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
      });

      setPublications(response.publications || []);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 1,
      }));
    } catch (error) {
      toast.error("Failed to load publications");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPurchases = async () => {
    try {
      const response = await publicationsApi.getUserPurchases();
      const purchasedIds = new Set(
        (response.purchases || []).map((p: any) => p.publication.id)
      );
      setUserPurchases(purchasedIds);
    } catch (error) {
      // Error fetching user purchases
    }
  };

  const handleFilterChange = (key: keyof MarketplaceFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePurchase = async (publication: Publication) => {
    if (!user) {
      toast.error("Please sign in to purchase publications");
      router.push("/sign-in");
      return;
    }

    setSelectedPublicationForPurchase(publication);
    setShowPaymentModal(true);
  };

  const handleAddToCart = (publicationId: string) => {
    setCart((prev) => new Set([...prev, publicationId]));
    toast.success("Added to cart");
  };

  const handleRemoveFromCart = (publicationId: string) => {
    setCart((prev) => {
      const newCart = new Set(prev);
      newCart.delete(publicationId);
      return newCart;
    });
    toast.success("Removed from cart");
  };

  const handlePurchaseSuccess = () => {
    if (selectedPublicationForPurchase) {
      setUserPurchases(
        (prev) => new Set([...prev, selectedPublicationForPurchase.id])
      );
      setCart((prev) => {
        const newCart = new Set(prev);
        newCart.delete(selectedPublicationForPurchase.id);
        return newCart;
      });
      fetchUserPurchases(); // Refresh purchases
    }
  };

  const handleToggleWishlist = (publicationId: string) => {
    setWishlist((prev) => {
      const newWishlist = new Set(prev);
      if (newWishlist.has(publicationId)) {
        newWishlist.delete(publicationId);
        toast.success("Removed from wishlist");
      } else {
        newWishlist.add(publicationId);
        toast.success("Added to wishlist");
      }
      return newWishlist;
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(price);
  };

  const PublicationCard = ({ publication }: { publication: Publication }) => {
    const isPurchased = userPurchases.has(publication.id);
    const isInCart = cart.has(publication.id);
    const isWishlisted = wishlist.has(publication.id);

    return (
      <Card className="group hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
        <CardHeader className="p-0">
          <div className="relative aspect-[3/4] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-t-lg overflow-hidden">
            {publication.coverImage ? (
              <img
                src={publication.coverImage}
                alt={publication.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-blue-300" />
              </div>
            )}

            {/* Quick actions overlay */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant={isWishlisted ? "default" : "secondary"}
                className="h-8 w-8 p-0"
                onClick={() => handleToggleWishlist(publication.id)}
              >
                <Heart
                  className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`}
                />
              </Button>
            </div>

            {/* Status badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isPurchased && (
                <Badge variant="default" className="text-xs">
                  Owned
                </Badge>
              )}
              {publication.discountPrice && (
                <Badge variant="destructive" className="text-xs">
                  Sale
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-blue-600 cursor-pointer">
              {publication.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {publication.shortDescription || publication.description}
            </CardDescription>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {publication.grade && publication.grade.length > 0 && (
                <Badge variant="outline">
                  {getDisplayName(publication.grade)}
                </Badge>
              )}
              {publication.subject && publication.subject.length > 0 && (
                <Badge variant="outline">
                  {getDisplayName(publication.subject)}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {publication.views}
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                {publication.downloads}
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                4.5
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {publication.discountPrice ? (
                  <>
                    <span className="text-lg font-bold text-green-600">
                      {formatPrice(publication.discountPrice)}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(publication.price)}
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-bold">
                    {formatPrice(publication.price)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {isPurchased ? (
                <Button
                  className="flex-1"
                  onClick={() => router.push(`/publications/${publication.id}`)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      isInCart
                        ? handleRemoveFromCart(publication.id)
                        : handleAddToCart(publication.id)
                    }
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {isInCart ? "Remove" : "Add to Cart"}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePurchase(publication)}
                  >
                    Buy Now
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Publications Marketplace</h1>
        <p className="text-muted-foreground">
          Discover and purchase educational publications from verified authors
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search publications..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Cart */}
          {cart.size > 0 && (
            <Button variant="outline" className="relative">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart ({cart.size})
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {cart.size}
              </Badge>
            </Button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-4">
          <Select
            value={filters.grade}
            onValueChange={(value) => handleFilterChange("grade", value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={`Grade ${i + 1}`}>
                  Grade {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.subject}
            onValueChange={(value) => handleFilterChange("subject", value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.sortBy}
            onValueChange={(value) => handleFilterChange("sortBy", value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Publications Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-gray-200 rounded-t-lg" />
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : publications.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No publications found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div
          className={`grid gap-6 ${
            viewMode === "grid"
              ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          }`}
        >
          {publications.map((publication) => (
            <PublicationCard key={publication.id} publication={publication} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {publications.length > 0 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
            }
            disabled={pagination.page === 1}
          >
            Previous
          </Button>

          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
            }
            disabled={pagination.page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {selectedPublicationForPurchase && (
        <PaymentConfirmationModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPublicationForPurchase(null);
          }}
          publication={selectedPublicationForPurchase}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
}

export default function PublicationsMarketplace() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading marketplace...</p>
          </div>
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
