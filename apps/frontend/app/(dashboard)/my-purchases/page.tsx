"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  Calendar,
  BookOpen,
  Star,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { publicationsApi } from "@/lib/api/endpoints/publications";
import { useAuthStore } from "@/stores/auth-store";

import { getDisplayName } from "@/lib/utils/display";
interface UserPurchase {
  id: string;
  purchaseDate: string;
  price: number;
  publication: {
    id: string;
    title: string;
    description: string;
    shortDescription?: string;
    author?: string;
    grade?: string[];
    subject?: string[];
    coverImage?: string;
    fileUrl: string;
    downloads: number;
    views: number;
  };
}

export default function MyPurchases() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<UserPurchase[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchUserPurchases();
    } else {
      router.push("/sign-in");
    }
  }, [user, router]);

  useEffect(() => {
    // Filter purchases based on search query
    const filtered = purchases.filter(
      (purchase) =>
        purchase.publication.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        purchase.publication.author
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        purchase.publication.subject?.some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
    setFilteredPurchases(filtered);
  }, [purchases, searchQuery]);

  const fetchUserPurchases = async () => {
    try {
      setLoading(true);
      const response = await publicationsApi.getUserPurchases();

      // Transform API response to match UserPurchase interface
      const transformedPurchases = (response.purchases || []).map(
        (purchase: any) => ({
          id: purchase.id,
          purchaseDate: purchase.purchaseDate,
          price: purchase.purchasePrice, // Map purchasePrice to price
          publication: purchase.publication,
        })
      );

      setPurchases(transformedPurchases);
    } catch (error) {
      toast.error("Failed to load your purchases");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (publication: UserPurchase["publication"]) => {
    try {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(publication.id);
        return newSet;
      });

      const response = await publicationsApi.getDownloadUrl(publication.id);

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = response.downloadUrl;
      link.download = `${publication.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started");
    } catch (error) {
      toast.error("Failed to download publication");
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(publication.id);
        return newSet;
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
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
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Publications</h1>
        <p className="text-muted-foreground">
          Access and download your purchased publications
        </p>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your publications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchUserPurchases}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button onClick={() => router.push("/marketplace")}>
            Browse Marketplace
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Purchases
                </p>
                <p className="text-2xl font-bold">{purchases.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Spent
                </p>
                <p className="text-2xl font-bold">
                  {formatPrice(purchases.reduce((sum, p) => sum + p.price, 0))}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Downloaded
                </p>
                <p className="text-2xl font-bold">
                  {purchases.reduce(
                    (sum, p) => sum + p.publication.downloads,
                    0
                  )}
                </p>
              </div>
              <Download className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Publications Grid */}
      {filteredPurchases.length === 0 ? (
        <div className="text-center py-12">
          {purchases.length === 0 ? (
            <>
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
              <p className="text-muted-foreground mb-6">
                Start building your digital library by purchasing publications
              </p>
              <Button onClick={() => router.push("/marketplace")}>
                Browse Marketplace
              </Button>
            </>
          ) : (
            <>
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPurchases.map((purchase) => (
            <Card
              key={purchase.id}
              className="group hover:shadow-lg transition-all duration-200"
            >
              <CardHeader className="p-0">
                <div className="relative aspect-[3/4] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-t-lg overflow-hidden">
                  {purchase.publication.coverImage ? (
                    <img
                      src={purchase.publication.coverImage}
                      alt={purchase.publication.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-blue-300" />
                    </div>
                  )}

                  {/* Purchase date badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      Owned
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4">
                <div className="space-y-2">
                  <CardTitle className="text-lg font-semibold line-clamp-2">
                    {purchase.publication.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {purchase.publication.shortDescription ||
                      purchase.publication.description}
                  </CardDescription>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {purchase.publication.grade &&
                      purchase.publication.grade.length > 0 && (
                        <Badge variant="outline">
                          {getDisplayName(purchase.publication.grade)}
                        </Badge>
                      )}
                    {purchase.publication.subject &&
                      purchase.publication.subject.length > 0 && (
                        <Badge variant="outline">
                          {getDisplayName(purchase.publication.subject)}
                        </Badge>
                      )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(purchase.purchaseDate)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {purchase.publication.views}
                    </div>
                  </div>

                  <div className="text-lg font-bold text-green-600">
                    Paid {formatPrice(purchase.price)}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button
                  className="w-full"
                  onClick={() => handleDownload(purchase.publication)}
                  disabled={downloadingIds.has(purchase.publication.id)}
                >
                  {downloadingIds.has(purchase.publication.id) ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
