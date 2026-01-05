"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Filter,
  FileText,
  Eye,
  Edit,
  Trash2,
  Download,
  ExternalLink,
  Book,
  Award,
  Calendar,
} from "lucide-react";

type PublicationType =
  | "RESEARCH_PAPER"
  | "ARTICLE"
  | "BOOK"
  | "THESIS"
  | "NEWSLETTER"
  | "MAGAZINE"
  | "OTHER";
type PublicationStatus = "DRAFT" | "UNDER_REVIEW" | "PUBLISHED" | "ARCHIVED";

interface Publication {
  id: string;
  title: string;
  type: PublicationType;
  status: PublicationStatus;
  authors: string[];
  abstract?: string;
  content?: string;
  publishedDate?: string;
  publisher?: string;
  isbn?: string;
  doi?: string;
  url?: string;
  fileUrl?: string;
  keywords?: string[];
  citations?: number;
  downloads?: number;
  createdById: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function PublicationsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    search: "",
    year: "",
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPublication, setSelectedPublication] =
    useState<Publication | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "RESEARCH_PAPER" as PublicationType,
    authors: "",
    abstract: "",
    publisher: "",
    isbn: "",
    doi: "",
    url: "",
    keywords: "",
  });

  const { data: publicationsData, isLoading } = useQuery({
    queryKey: ["publications", filters],
    queryFn: async () => {
      const params: any = {};
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.year) params.year = filters.year;

      const response = await ApiClient.get<any>("/publications", { params });
      return response?.data || response || [];
    },
  });

  const { data: statistics } = useQuery({
    queryKey: ["publication-stats"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/publications/statistics");
      return response?.data || response || {};
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await ApiClient.post("/publications", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publications"] });
      queryClient.invalidateQueries({ queryKey: ["publication-stats"] });
      setCreateDialogOpen(false);
      resetForm();
      toast.success("Publication created successfully");
    },
    onError: () => {
      toast.error("Failed to create publication");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await ApiClient.delete(`/publications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publications"] });
      queryClient.invalidateQueries({ queryKey: ["publication-stats"] });
      toast.success("Publication deleted");
    },
    onError: () => {
      toast.error("Failed to delete publication");
    },
  });

  const publications = Array.isArray(publicationsData)
    ? publicationsData
    : publicationsData?.publications || [];

  const resetForm = () => {
    setFormData({
      title: "",
      type: "RESEARCH_PAPER",
      authors: "",
      abstract: "",
      publisher: "",
      isbn: "",
      doi: "",
      url: "",
      keywords: "",
    });
  };

  const handleCreate = () => {
    if (!formData.title || !formData.authors) {
      toast.error("Title and authors are required");
      return;
    }

    createMutation.mutate({
      ...formData,
      authors: formData.authors.split(",").map((a) => a.trim()),
      keywords: formData.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this publication?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (publication: Publication) => {
    setSelectedPublication(publication);
    setViewDialogOpen(true);
  };

  const getTypeBadge = (type: PublicationType) => {
    const labels: Record<PublicationType, string> = {
      RESEARCH_PAPER: "Research Paper",
      ARTICLE: "Article",
      BOOK: "Book",
      THESIS: "Thesis",
      NEWSLETTER: "Newsletter",
      MAGAZINE: "Magazine",
      OTHER: "Other",
    };
    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  const getStatusBadge = (status: PublicationStatus) => {
    const styles: Record<PublicationStatus, string> = {
      DRAFT: "bg-gray-100 text-gray-800",
      UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
      PUBLISHED: "bg-green-100 text-green-800",
      ARCHIVED: "bg-blue-100 text-blue-800",
    };
    return <Badge className={styles[status]}>{status.replace("_", " ")}</Badge>;
  };

  const stats = {
    total: statistics?.total || publications.length,
    published:
      statistics?.published ||
      publications.filter((p: Publication) => p.status === "PUBLISHED").length,
    totalCitations: statistics?.totalCitations || 0,
    totalDownloads: statistics?.totalDownloads || 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Publications</h1>
          <p className="text-muted-foreground">
            Manage research papers, articles, and academic publications
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Publication
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Publications
            </CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.published}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Citations
            </CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalCitations}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search publications..."
                className="pl-10"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>

            <Select
              value={filters.type}
              onValueChange={(value) =>
                setFilters({ ...filters, type: value === "all" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="RESEARCH_PAPER">Research Paper</SelectItem>
                <SelectItem value="ARTICLE">Article</SelectItem>
                <SelectItem value="BOOK">Book</SelectItem>
                <SelectItem value="THESIS">Thesis</SelectItem>
                <SelectItem value="NEWSLETTER">Newsletter</SelectItem>
                <SelectItem value="MAGAZINE">Magazine</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value === "all" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Year"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            />

            <Button
              variant="outline"
              onClick={() =>
                setFilters({ type: "", status: "", search: "", year: "" })
              }
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Publications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Publications</CardTitle>
          <CardDescription>
            {publications.length} publication(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Authors</TableHead>
                <TableHead>Publisher</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Citations</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {publications.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground"
                  >
                    No publications found
                  </TableCell>
                </TableRow>
              ) : (
                publications.map((pub: Publication) => (
                  <TableRow key={pub.id}>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <div className="font-medium line-clamp-1">
                          {pub.title}
                        </div>
                        {pub.doi && (
                          <div className="text-xs text-muted-foreground">
                            DOI: {pub.doi}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(pub.type)}</TableCell>
                    <TableCell>
                      <div className="max-w-[150px] line-clamp-1">
                        {pub.authors?.join(", ")}
                      </div>
                    </TableCell>
                    <TableCell>{pub.publisher || "-"}</TableCell>
                    <TableCell>{getStatusBadge(pub.status)}</TableCell>
                    <TableCell>
                      {pub.publishedDate
                        ? format(new Date(pub.publishedDate), "MMM yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>{pub.citations || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(pub)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {pub.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(pub.url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(pub.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Publication Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Publication</DialogTitle>
            <DialogDescription>
              Enter publication details below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Publication title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as PublicationType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESEARCH_PAPER">
                      Research Paper
                    </SelectItem>
                    <SelectItem value="ARTICLE">Article</SelectItem>
                    <SelectItem value="BOOK">Book</SelectItem>
                    <SelectItem value="THESIS">Thesis</SelectItem>
                    <SelectItem value="NEWSLETTER">Newsletter</SelectItem>
                    <SelectItem value="MAGAZINE">Magazine</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="publisher">Publisher</Label>
                <Input
                  id="publisher"
                  value={formData.publisher}
                  onChange={(e) =>
                    setFormData({ ...formData, publisher: e.target.value })
                  }
                  placeholder="Publisher name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="authors">Authors * (comma-separated)</Label>
              <Input
                id="authors"
                value={formData.authors}
                onChange={(e) =>
                  setFormData({ ...formData, authors: e.target.value })
                }
                placeholder="John Doe, Jane Smith"
              />
            </div>

            <div>
              <Label htmlFor="abstract">Abstract</Label>
              <Textarea
                id="abstract"
                value={formData.abstract}
                onChange={(e) =>
                  setFormData({ ...formData, abstract: e.target.value })
                }
                placeholder="Publication abstract"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={formData.isbn}
                  onChange={(e) =>
                    setFormData({ ...formData, isbn: e.target.value })
                  }
                  placeholder="978-3-16-148410-0"
                />
              </div>
              <div>
                <Label htmlFor="doi">DOI</Label>
                <Input
                  id="doi"
                  value={formData.doi}
                  onChange={(e) =>
                    setFormData({ ...formData, doi: e.target.value })
                  }
                  placeholder="10.1000/xyz123"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="keywords">Keywords (comma-separated)</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) =>
                  setFormData({ ...formData, keywords: e.target.value })
                }
                placeholder="education, technology, research"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Publication"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Publication Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPublication?.title}</DialogTitle>
          </DialogHeader>
          {selectedPublication && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {getTypeBadge(selectedPublication.type)}
                {getStatusBadge(selectedPublication.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Authors</Label>
                  <p className="font-medium">
                    {selectedPublication.authors?.join(", ")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Publisher</Label>
                  <p className="font-medium">
                    {selectedPublication.publisher || "-"}
                  </p>
                </div>
              </div>

              {selectedPublication.abstract && (
                <div>
                  <Label className="text-muted-foreground">Abstract</Label>
                  <p className="mt-1 text-sm">{selectedPublication.abstract}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                {selectedPublication.publishedDate && (
                  <div>
                    <Label className="text-muted-foreground">
                      Published Date
                    </Label>
                    <p>
                      {format(
                        new Date(selectedPublication.publishedDate),
                        "PPP"
                      )}
                    </p>
                  </div>
                )}
                {selectedPublication.isbn && (
                  <div>
                    <Label className="text-muted-foreground">ISBN</Label>
                    <p>{selectedPublication.isbn}</p>
                  </div>
                )}
                {selectedPublication.doi && (
                  <div>
                    <Label className="text-muted-foreground">DOI</Label>
                    <p>{selectedPublication.doi}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Citations</Label>
                  <p className="text-xl font-bold">
                    {selectedPublication.citations || 0}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Downloads</Label>
                  <p className="text-xl font-bold">
                    {selectedPublication.downloads || 0}
                  </p>
                </div>
              </div>

              {selectedPublication.keywords &&
                selectedPublication.keywords.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Keywords</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedPublication.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {selectedPublication.url && (
                <div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(selectedPublication.url, "_blank")
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Publication
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
