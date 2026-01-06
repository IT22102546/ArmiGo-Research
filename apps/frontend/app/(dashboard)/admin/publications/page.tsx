"use client";

import { useState } from "react";
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
import {
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  Download,
  ExternalLink,
  Heart,
  BookOpen,
  Users,
} from "lucide-react";

type PublicationType =
  | "HEALTH_GUIDE"
  | "EXERCISE_GUIDE"
  | "NUTRITION_GUIDE"
  | "THERAPY_RESOURCE"
  | "PARENT_GUIDE"
  | "WELLNESS_ARTICLE";
type PublicationStatus = "DRAFT" | "UNDER_REVIEW" | "PUBLISHED" | "ARCHIVED";

interface Publication {
  id: string;
  title: string;
  type: PublicationType;
  status: PublicationStatus;
  authors: string[];
  summary?: string;
  content?: string;
  publishedDate?: string;
  category?: string;
  ageGroup?: string;
  url?: string;
  fileUrl?: string;
  tags?: string[];
  downloads?: number;
  views?: number;
  createdById: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

const initialPublications: Publication[] = [
  {
    id: "1",
    title: "Healthy Gaming Habits for Children",
    type: "PARENT_GUIDE",
    status: "PUBLISHED",
    authors: ["Dr. Nimal Fernando", "Dr. Priya Jayasinghe"],
    summary:
      "Comprehensive guide for parents on establishing healthy gaming habits, screen time management, and balancing digital play with physical activities.",
    publishedDate: "2024-01-15T00:00:00Z",
    category: "Child Development",
    ageGroup: "All Ages",
    url: "/resources/healthy-gaming-habits.pdf",
    fileUrl: "/downloads/healthy-gaming-habits.pdf",
    tags: ["screen time", "parenting", "digital wellness"],
    downloads: 1245,
    views: 3421,
    createdById: "admin-1",
    createdBy: {
      firstName: "Kasun",
      lastName: "Perera",
    },
    createdAt: "2024-01-10T08:30:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    title: "Active Gaming Exercises for Kids",
    type: "EXERCISE_GUIDE",
    status: "PUBLISHED",
    authors: ["Chaminda Silva", "Ayesha Wijesinghe"],
    summary:
      "Fun physical exercises and stretches designed to be done during gaming breaks. Includes 15 easy exercises suitable for children aged 5-12.",
    publishedDate: "2024-01-12T00:00:00Z",
    category: "Physical Fitness",
    ageGroup: "5-12 years",
    url: "/resources/active-gaming-exercises.pdf",
    fileUrl: "/downloads/active-gaming-exercises.pdf",
    tags: ["exercise", "physical activity", "kids fitness"],
    downloads: 892,
    views: 2134,
    createdById: "admin-2",
    createdBy: {
      firstName: "Saman",
      lastName: "Silva",
    },
    createdAt: "2024-01-08T09:15:00Z",
    updatedAt: "2024-01-12T11:30:00Z",
  },
  {
    id: "3",
    title: "Nutrition Guide for Young Gamers",
    type: "NUTRITION_GUIDE",
    status: "PUBLISHED",
    authors: ["Nutritionist Dilini Rajapaksa"],
    summary:
      "Essential nutrition tips and healthy snack ideas for children who enjoy gaming. Includes meal plans and brain-boosting foods for better focus.",
    publishedDate: "2024-01-10T00:00:00Z",
    category: "Child Nutrition",
    ageGroup: "All Ages",
    url: "/resources/nutrition-young-gamers.pdf",
    fileUrl: "/downloads/nutrition-young-gamers.pdf",
    tags: ["nutrition", "healthy eating", "child health"],
    downloads: 1567,
    views: 4231,
    createdById: "admin-1",
    createdBy: {
      firstName: "Kasun",
      lastName: "Perera",
    },
    createdAt: "2024-01-05T10:00:00Z",
    updatedAt: "2024-01-10T14:20:00Z",
  },
  {
    id: "4",
    title: "Eye Care for Screen Time",
    type: "HEALTH_GUIDE",
    status: "PUBLISHED",
    authors: ["Dr. Samanthi Perera", "Optometrist Rohan Kumar"],
    summary:
      "Protect your child's vision with proper eye care practices. Learn about the 20-20-20 rule, optimal viewing distances, and exercises for eye health.",
    publishedDate: "2024-01-14T00:00:00Z",
    category: "Eye Health",
    ageGroup: "All Ages",
    url: "/resources/eye-care-screen-time.pdf",
    fileUrl: "/downloads/eye-care-screen-time.pdf",
    tags: ["eye health", "vision care", "screen time"],
    downloads: 734,
    views: 1876,
    createdById: "admin-2",
    createdBy: {
      firstName: "Saman",
      lastName: "Silva",
    },
    createdAt: "2024-01-11T11:45:00Z",
    updatedAt: "2024-01-14T09:30:00Z",
  },
  {
    id: "5",
    title: "Therapeutic Gaming for Special Needs Children",
    type: "THERAPY_RESOURCE",
    status: "PUBLISHED",
    authors: ["Therapist Malini Fernando", "Dr. Anura Bandara"],
    summary:
      "How gaming devices can be used as therapeutic tools for children with special needs. Includes recommended games and activities for motor skill development.",
    publishedDate: "2024-01-13T00:00:00Z",
    category: "Special Education",
    ageGroup: "3-15 years",
    url: "/resources/therapeutic-gaming.pdf",
    fileUrl: "/downloads/therapeutic-gaming.pdf",
    tags: ["therapy", "special needs", "rehabilitation"],
    downloads: 456,
    views: 1234,
    createdById: "admin-1",
    createdBy: {
      firstName: "Kasun",
      lastName: "Perera",
    },
    createdAt: "2024-01-09T15:20:00Z",
    updatedAt: "2024-01-13T16:00:00Z",
  },
  {
    id: "6",
    title: "Posture and Ergonomics for Young Gamers",
    type: "HEALTH_GUIDE",
    status: "PUBLISHED",
    authors: ["Physiotherapist Anusha Wickramasinghe"],
    summary:
      "Prevent back pain and promote healthy posture with proper gaming setup. Includes ergonomic tips and stretching routines for children.",
    publishedDate: "2024-01-11T00:00:00Z",
    category: "Physical Health",
    ageGroup: "5-15 years",
    url: "/resources/posture-ergonomics.pdf",
    fileUrl: "/downloads/posture-ergonomics.pdf",
    tags: ["posture", "ergonomics", "back health"],
    downloads: 623,
    views: 1567,
    createdById: "admin-2",
    createdBy: {
      firstName: "Saman",
      lastName: "Silva",
    },
    createdAt: "2024-01-07T13:30:00Z",
    updatedAt: "2024-01-11T10:15:00Z",
  },
  {
    id: "7",
    title: "Mental Wellness Through Balanced Gaming",
    type: "WELLNESS_ARTICLE",
    status: "PUBLISHED",
    authors: ["Psychologist Dr. Tharaka Jayawardena"],
    summary:
      "Understanding the psychological benefits and potential challenges of gaming. Tips for maintaining mental wellness and emotional balance.",
    publishedDate: "2024-01-16T00:00:00Z",
    category: "Mental Health",
    ageGroup: "8-16 years",
    url: "/resources/mental-wellness-gaming.pdf",
    fileUrl: "/downloads/mental-wellness-gaming.pdf",
    tags: ["mental health", "emotional wellness", "psychology"],
    downloads: 889,
    views: 2456,
    createdById: "admin-1",
    createdBy: {
      firstName: "Kasun",
      lastName: "Perera",
    },
    createdAt: "2024-01-13T09:00:00Z",
    updatedAt: "2024-01-16T11:20:00Z",
  },
  {
    id: "8",
    title: "Hand and Finger Exercises for Controllers",
    type: "EXERCISE_GUIDE",
    status: "PUBLISHED",
    authors: ["Occupational Therapist Sanduni Perera"],
    summary:
      "Prevent repetitive strain injuries with these simple hand and finger exercises. Perfect for children who use gaming controllers regularly.",
    publishedDate: "2024-01-09T00:00:00Z",
    category: "Hand Health",
    ageGroup: "6-14 years",
    url: "/resources/hand-exercises.pdf",
    fileUrl: "/downloads/hand-exercises.pdf",
    tags: ["hand health", "exercises", "injury prevention"],
    downloads: 345,
    views: 987,
    createdById: "admin-2",
    createdBy: {
      firstName: "Saman",
      lastName: "Silva",
    },
    createdAt: "2024-01-06T14:45:00Z",
    updatedAt: "2024-01-09T16:30:00Z",
  },
  {
    id: "9",
    title: "Sleep Hygiene for Gaming Children",
    type: "PARENT_GUIDE",
    status: "PUBLISHED",
    authors: ["Dr. Kumari Dissanayake", "Sleep Specialist"],
    summary:
      "Establish healthy sleep routines and manage evening gaming time. Learn about blue light effects and creating bedtime boundaries.",
    publishedDate: "2024-01-08T00:00:00Z",
    category: "Sleep Health",
    ageGroup: "All Ages",
    url: "/resources/sleep-hygiene.pdf",
    fileUrl: "/downloads/sleep-hygiene.pdf",
    tags: ["sleep", "bedtime routine", "blue light"],
    downloads: 1123,
    views: 2987,
    createdById: "admin-1",
    createdBy: {
      firstName: "Kasun",
      lastName: "Perera",
    },
    createdAt: "2024-01-04T10:30:00Z",
    updatedAt: "2024-01-08T12:00:00Z",
  },
  {
    id: "10",
    title: "Brain Development and Educational Gaming",
    type: "WELLNESS_ARTICLE",
    status: "PUBLISHED",
    authors: ["Dr. Lasith Gunasekara", "Education Specialist"],
    summary:
      "Explore the cognitive benefits of educational gaming. How strategic games can enhance problem-solving skills and cognitive development in children.",
    publishedDate: "2024-01-07T00:00:00Z",
    category: "Cognitive Development",
    ageGroup: "5-13 years",
    url: "/resources/brain-development-gaming.pdf",
    fileUrl: "/downloads/brain-development-gaming.pdf",
    tags: ["cognitive development", "brain health", "education"],
    downloads: 978,
    views: 2654,
    createdById: "admin-2",
    createdBy: {
      firstName: "Saman",
      lastName: "Silva",
    },
    createdAt: "2024-01-03T11:15:00Z",
    updatedAt: "2024-01-07T13:45:00Z",
  },
];

export default function HealthPublicationsPage() {
  const [publications, setPublications] =
    useState<Publication[]>(initialPublications);
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
    type: "HEALTH_GUIDE" as PublicationType,
    authors: "",
    summary: "",
    category: "",
    ageGroup: "",
    url: "",
    tags: "",
  });

  const filteredPublications = publications.filter((pub) => {
    const matchesSearch =
      !filters.search ||
      pub.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      pub.summary?.toLowerCase().includes(filters.search.toLowerCase()) ||
      pub.authors.some((a) =>
        a.toLowerCase().includes(filters.search.toLowerCase())
      );

    const matchesType = !filters.type || pub.type === filters.type;
    const matchesStatus = !filters.status || pub.status === filters.status;

    const matchesYear =
      !filters.year ||
      (pub.publishedDate &&
        new Date(pub.publishedDate).getFullYear().toString() === filters.year);

    return matchesSearch && matchesType && matchesStatus && matchesYear;
  });

  const resetForm = () => {
    setFormData({
      title: "",
      type: "HEALTH_GUIDE",
      authors: "",
      summary: "",
      category: "",
      ageGroup: "",
      url: "",
      tags: "",
    });
  };

  const handleCreate = () => {
    if (!formData.title || !formData.authors) {
      alert("Title and authors are required");
      return;
    }

    const newPublication: Publication = {
      id: String(Date.now()),
      title: formData.title,
      type: formData.type,
      status: "PUBLISHED",
      authors: formData.authors.split(",").map((a) => a.trim()),
      summary: formData.summary,
      category: formData.category,
      ageGroup: formData.ageGroup,
      url: formData.url,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      publishedDate: new Date().toISOString(),
      downloads: 0,
      views: 0,
      createdById: "admin-1",
      createdBy: {
        firstName: "Admin",
        lastName: "User",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPublications([newPublication, ...publications]);
    setCreateDialogOpen(false);
    resetForm();
    alert("Publication created successfully");
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this publication?")) {
      setPublications(publications.filter((p) => p.id !== id));
      alert("Publication deleted successfully");
    }
  };

  const handleView = (publication: Publication) => {
    setSelectedPublication(publication);
    setViewDialogOpen(true);
  };

  const getTypeBadge = (type: PublicationType) => {
    const labels: Record<PublicationType, string> = {
      HEALTH_GUIDE: "Health Guide",
      EXERCISE_GUIDE: "Exercise Guide",
      NUTRITION_GUIDE: "Nutrition Guide",
      THERAPY_RESOURCE: "Therapy Resource",
      PARENT_GUIDE: "Parent Guide",
      WELLNESS_ARTICLE: "Wellness Article",
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
    total: filteredPublications.length,
    published: filteredPublications.filter(
      (p: Publication) => p.status === "PUBLISHED"
    ).length,
    totalViews: filteredPublications.reduce(
      (sum, p) => sum + (p.views || 0),
      0
    ),
    totalDownloads: filteredPublications.reduce(
      (sum, p) => sum + (p.downloads || 0),
      0
    ),
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Health & Wellness Resources</h1>
          <p className="text-muted-foreground">
            Downloadable guides about rehabilitation, exercises, and nutrition
            for children
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Resources
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Heart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.published}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalViews.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalDownloads.toLocaleString()}
            </div>
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
                <SelectItem value="HEALTH_GUIDE">Health Guide</SelectItem>
                <SelectItem value="EXERCISE_GUIDE">Exercise Guide</SelectItem>
                <SelectItem value="NUTRITION_GUIDE">Nutrition Guide</SelectItem>
                <SelectItem value="THERAPY_RESOURCE">
                  Therapy Resource
                </SelectItem>
                <SelectItem value="PARENT_GUIDE">Parent Guide</SelectItem>
                <SelectItem value="WELLNESS_ARTICLE">
                  Wellness Article
                </SelectItem>
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
          <CardTitle>Health Resources</CardTitle>
          <CardDescription>
            {filteredPublications.length} resource(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Authors</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Age Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPublications.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground"
                  >
                    No resources found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPublications.map((pub: Publication) => (
                  <TableRow key={pub.id}>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <div className="font-medium line-clamp-1">
                          {pub.title}
                        </div>
                        {pub.category && (
                          <div className="text-xs text-muted-foreground">
                            {pub.category}
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
                    <TableCell>{pub.category || "-"}</TableCell>
                    <TableCell>{pub.ageGroup || "-"}</TableCell>
                    <TableCell>{getStatusBadge(pub.status)}</TableCell>
                    <TableCell>{pub.downloads || 0}</TableCell>
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
            <DialogTitle>Add New Health Resource</DialogTitle>
            <DialogDescription>
              Upload guides about rehabilitation, exercises, or nutrition
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
                placeholder="Resource title"
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
                    <SelectItem value="HEALTH_GUIDE">Health Guide</SelectItem>
                    <SelectItem value="EXERCISE_GUIDE">
                      Exercise Guide
                    </SelectItem>
                    <SelectItem value="NUTRITION_GUIDE">
                      Nutrition Guide
                    </SelectItem>
                    <SelectItem value="THERAPY_RESOURCE">
                      Therapy Resource
                    </SelectItem>
                    <SelectItem value="PARENT_GUIDE">Parent Guide</SelectItem>
                    <SelectItem value="WELLNESS_ARTICLE">
                      Wellness Article
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g., Child Development"
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
                placeholder="Dr. John Doe, Jane Smith"
              />
            </div>

            <div>
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                placeholder="Brief description of the resource"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ageGroup">Age Group</Label>
                <Input
                  id="ageGroup"
                  value={formData.ageGroup}
                  onChange={(e) =>
                    setFormData({ ...formData, ageGroup: e.target.value })
                  }
                  placeholder="e.g., 5-12 years"
                />
              </div>
              <div>
                <Label htmlFor="url">File URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="/resources/..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="health, exercise, nutrition"
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
            <Button onClick={handleCreate}>Create Resource</Button>
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
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">
                    {selectedPublication.category || "-"}
                  </p>
                </div>
              </div>

              {selectedPublication.summary && (
                <div>
                  <Label className="text-muted-foreground">Summary</Label>
                  <p className="mt-1 text-sm">{selectedPublication.summary}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                {selectedPublication.ageGroup && (
                  <div>
                    <Label className="text-muted-foreground">Age Group</Label>
                    <p>{selectedPublication.ageGroup}</p>
                  </div>
                )}
                {selectedPublication.publishedDate && (
                  <div>
                    <Label className="text-muted-foreground">
                      Published Date
                    </Label>
                    <p>
                      {new Date(
                        selectedPublication.publishedDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Views</Label>
                  <p className="text-xl font-bold">
                    {selectedPublication.views || 0}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Downloads</Label>
                  <p className="text-xl font-bold">
                    {selectedPublication.downloads || 0}
                  </p>
                </div>
              </div>

              {selectedPublication.tags &&
                selectedPublication.tags.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedPublication.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
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
                    <Download className="h-4 w-4 mr-2" />
                    Download Resource
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
