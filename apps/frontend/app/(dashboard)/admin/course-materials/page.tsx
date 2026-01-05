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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  FileText,
  Settings,
  File,
  Download,
  Eye,
  Trash2,
  Edit,
  Filter,
  Upload,
  BookOpen,
  Wrench,
  PlayCircle,
} from "lucide-react";

type MaterialType =
  | "SETUP_GUIDE"
  | "USER_MANUAL"
  | "VIDEO_TUTORIAL"
  | "GAME_GUIDE"
  | "TROUBLESHOOTING"
  | "MAINTENANCE";

interface ProductResource {
  id: string;
  title: string;
  description?: string;
  type: MaterialType;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  category: string[];
  productModel?: string;
  isPublic: boolean;
  views: number;
  uploadedById: string;
  uploadedBy?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

const initialResources: ProductResource[] = [
  {
    id: "1",
    title: "ArmiGo Pro Quick Start Guide",
    description:
      "Complete setup guide for first-time users of ArmiGo Pro Gaming Device. Learn how to unbox, connect, and start playing in minutes.",
    type: "SETUP_GUIDE",
    fileUrl: "/resources/quick-start-guide.pdf",
    fileSize: 2457600,
    fileType: "application/pdf",
    category: ["ArmiGo Pro", "Getting Started"],
    productModel: "ArmiGo Pro",
    isPublic: true,
    views: 1245,
    uploadedById: "admin-1",
    uploadedBy: {
      firstName: "Kasun",
      lastName: "Perera",
    },
    createdAt: "2024-01-10T08:30:00Z",
  },
  {
    id: "2",
    title: "Complete User Manual - ArmiGo Devices",
    description:
      "Comprehensive user manual covering all features, settings, and troubleshooting for ArmiGo gaming devices.",
    type: "USER_MANUAL",
    fileUrl: "/resources/user-manual.pdf",
    fileSize: 8912000,
    fileType: "application/pdf",
    category: ["ArmiGo Pro", "ArmiGo Lite", "Documentation"],
    productModel: "All Models",
    isPublic: true,
    views: 2341,
    uploadedById: "admin-1",
    uploadedBy: {
      firstName: "Kasun",
      lastName: "Perera",
    },
    createdAt: "2024-01-05T10:00:00Z",
  },
  {
    id: "3",
    title: "Controller Pairing Tutorial Video",
    description:
      "Step-by-step video tutorial on how to pair wireless controllers with your ArmiGo device. Includes troubleshooting tips.",
    type: "VIDEO_TUTORIAL",
    fileUrl: "/resources/controller-pairing.mp4",
    fileSize: 45678000,
    fileType: "video/mp4",
    category: ["Accessories", "Controllers", "Tutorial"],
    productModel: "All Models",
    isPublic: true,
    views: 892,
    uploadedById: "admin-2",
    uploadedBy: {
      firstName: "Saman",
      lastName: "Silva",
    },
    createdAt: "2024-01-12T14:20:00Z",
  },
  {
    id: "4",
    title: "Top 10 Games Setup Guide",
    description:
      "Installation and configuration guide for the most popular games on ArmiGo. Includes optimal settings and tips.",
    type: "GAME_GUIDE",
    fileUrl: "/resources/top-games-guide.pdf",
    fileSize: 5234000,
    fileType: "application/pdf",
    category: ["Games", "Configuration"],
    productModel: "ArmiGo Pro",
    isPublic: true,
    views: 1567,
    uploadedById: "admin-2",
    uploadedBy: {
      firstName: "Saman",
      lastName: "Silva",
    },
    createdAt: "2024-01-08T11:45:00Z",
  },
  {
    id: "5",
    title: "Common Issues and Solutions",
    description:
      "Troubleshooting guide for common problems like connectivity issues, audio problems, and performance optimization.",
    type: "TROUBLESHOOTING",
    fileUrl: "/resources/troubleshooting.pdf",
    fileSize: 3456000,
    fileType: "application/pdf",
    category: ["Support", "Technical"],
    productModel: "All Models",
    isPublic: true,
    views: 3421,
    uploadedById: "admin-1",
    uploadedBy: {
      firstName: "Kasun",
      lastName: "Perera",
    },
    createdAt: "2024-01-15T09:00:00Z",
  },
  {
    id: "6",
    title: "Device Maintenance and Care",
    description:
      "Best practices for cleaning, storing, and maintaining your ArmiGo device to ensure longevity and optimal performance.",
    type: "MAINTENANCE",
    fileUrl: "/resources/maintenance-guide.pdf",
    fileSize: 1890000,
    fileType: "application/pdf",
    category: ["Care", "Maintenance"],
    productModel: "All Models",
    isPublic: true,
    views: 678,
    uploadedById: "admin-1",
    uploadedBy: {
      firstName: "Kasun",
      lastName: "Perera",
    },
    createdAt: "2024-01-11T15:30:00Z",
  },
  {
    id: "7",
    title: "Wi-Fi Setup and Optimization",
    description:
      "Video guide on connecting your ArmiGo device to Wi-Fi and optimizing network settings for the best gaming experience.",
    type: "VIDEO_TUTORIAL",
    fileUrl: "/resources/wifi-setup.mp4",
    fileSize: 38900000,
    fileType: "video/mp4",
    category: ["Network", "Setup", "Tutorial"],
    productModel: "All Models",
    isPublic: true,
    views: 1123,
    uploadedById: "admin-2",
    uploadedBy: {
      firstName: "Saman",
      lastName: "Silva",
    },
    createdAt: "2024-01-14T16:00:00Z",
  },
  {
    id: "8",
    title: "ArmiGo Lite Getting Started",
    description:
      "Complete beginner's guide for ArmiGo Lite users including unboxing, setup, and first game installation.",
    type: "SETUP_GUIDE",
    fileUrl: "/resources/lite-getting-started.pdf",
    fileSize: 1567000,
    fileType: "application/pdf",
    category: ["ArmiGo Lite", "Getting Started"],
    productModel: "ArmiGo Lite",
    isPublic: true,
    views: 834,
    uploadedById: "admin-1",
    uploadedBy: {
      firstName: "Kasun",
      lastName: "Perera",
    },
    createdAt: "2024-01-13T10:15:00Z",
  },
  {
    id: "9",
    title: "Multiplayer Gaming Setup",
    description:
      "Learn how to set up local and online multiplayer gaming sessions with friends and family on ArmiGo devices.",
    type: "GAME_GUIDE",
    fileUrl: "/resources/multiplayer-guide.pdf",
    fileSize: 4123000,
    fileType: "application/pdf",
    category: ["Games", "Multiplayer"],
    productModel: "ArmiGo Pro",
    isPublic: true,
    views: 1890,
    uploadedById: "admin-2",
    uploadedBy: {
      firstName: "Saman",
      lastName: "Silva",
    },
    createdAt: "2024-01-09T13:45:00Z",
  },
  {
    id: "10",
    title: "System Updates and Backup",
    description:
      "Guide on keeping your ArmiGo device up-to-date with the latest system updates and backing up your game data.",
    type: "MAINTENANCE",
    fileUrl: "/resources/updates-backup.pdf",
    fileSize: 2678000,
    fileType: "application/pdf",
    category: ["System", "Updates", "Backup"],
    productModel: "All Models",
    isPublic: true,
    views: 945,
    uploadedById: "admin-1",
    uploadedBy: {
      firstName: "Kasun",
      lastName: "Perera",
    },
    createdAt: "2024-01-07T11:00:00Z",
  },
];

export default function ProductResourcesPage() {
  const [resources, setResources] =
    useState<ProductResource[]>(initialResources);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    category: "",
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] =
    useState<ProductResource | null>(null);

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      !filters.search ||
      resource.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      resource.description
        ?.toLowerCase()
        .includes(filters.search.toLowerCase());

    const matchesType = !filters.type || resource.type === filters.type;

    const matchesCategory =
      !filters.category ||
      resource.category.some((c) =>
        c.toLowerCase().includes(filters.category.toLowerCase())
      );

    return matchesSearch && matchesType && matchesCategory;
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this resource?")) {
      setResources(resources.filter((r) => r.id !== id));
      alert("Resource deleted successfully");
    }
  };

  const getTypeIcon = (type: MaterialType) => {
    switch (type) {
      case "VIDEO_TUTORIAL":
        return <PlayCircle className="h-4 w-4" />;
      case "SETUP_GUIDE":
        return <Settings className="h-4 w-4" />;
      case "USER_MANUAL":
        return <BookOpen className="h-4 w-4" />;
      case "GAME_GUIDE":
        return <FileText className="h-4 w-4" />;
      case "TROUBLESHOOTING":
        return <Wrench className="h-4 w-4" />;
      case "MAINTENANCE":
        return <Settings className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: MaterialType) => {
    const styles: Record<MaterialType, string> = {
      SETUP_GUIDE: "bg-blue-100 text-blue-800",
      USER_MANUAL: "bg-purple-100 text-purple-800",
      VIDEO_TUTORIAL: "bg-red-100 text-red-800",
      GAME_GUIDE: "bg-green-100 text-green-800",
      TROUBLESHOOTING: "bg-yellow-100 text-yellow-800",
      MAINTENANCE: "bg-orange-100 text-orange-800",
    };
    return <Badge className={styles[type]}>{type.replace("_", " ")}</Badge>;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleView = (resource: ProductResource) => {
    setSelectedResource(resource);
    setViewDialogOpen(true);
  };

  const stats = {
    total: filteredResources.length,
    guides: filteredResources.filter(
      (r: ProductResource) =>
        r.type === "SETUP_GUIDE" || r.type === "USER_MANUAL"
    ).length,
    videos: filteredResources.filter(
      (r: ProductResource) => r.type === "VIDEO_TUTORIAL"
    ).length,
    support: filteredResources.filter(
      (r: ProductResource) =>
        r.type === "TROUBLESHOOTING" || r.type === "MAINTENANCE"
    ).length,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Resource Library</h1>
          <p className="text-muted-foreground">
            Guides, tutorials, and support materials for customers
          </p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Resource
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
            <CardTitle className="text-sm font-medium">Setup Guides</CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.guides}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Video Tutorials
            </CardTitle>
            <PlayCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.videos}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support Docs</CardTitle>
            <Wrench className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.support}
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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
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
                <SelectValue placeholder="Resource Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="SETUP_GUIDE">Setup Guide</SelectItem>
                <SelectItem value="USER_MANUAL">User Manual</SelectItem>
                <SelectItem value="VIDEO_TUTORIAL">Video Tutorial</SelectItem>
                <SelectItem value="GAME_GUIDE">Game Guide</SelectItem>
                <SelectItem value="TROUBLESHOOTING">Troubleshooting</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.category}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  category: value === "all" ? "" : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="ArmiGo Pro">ArmiGo Pro</SelectItem>
                <SelectItem value="ArmiGo Lite">ArmiGo Lite</SelectItem>
                <SelectItem value="Getting Started">Getting Started</SelectItem>
                <SelectItem value="Games">Games</SelectItem>
                <SelectItem value="Support">Support</SelectItem>
                <SelectItem value="Tutorial">Tutorial</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setFilters({ search: "", type: "", category: "" })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
          <CardDescription>
            {filteredResources.length} resource(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground"
                  >
                    No resources found
                  </TableCell>
                </TableRow>
              ) : (
                filteredResources.map((resource: ProductResource) => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(resource.type)}
                        <div>
                          <div className="font-medium">{resource.title}</div>
                          {resource.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {resource.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(resource.type)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {resource.category?.map((c, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {resource.uploadedBy
                        ? `${resource.uploadedBy.firstName} ${resource.uploadedBy.lastName}`
                        : "-"}
                    </TableCell>
                    <TableCell>{formatFileSize(resource.fileSize)}</TableCell>
                    <TableCell>{resource.views || 0}</TableCell>
                    <TableCell>
                      {new Date(resource.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(resource)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {resource.fileUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(resource.fileUrl, "_blank")
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(resource.id)}
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

      {/* View Resource Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resource Details</DialogTitle>
          </DialogHeader>
          {selectedResource && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  {getTypeIcon(selectedResource.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {selectedResource.title}
                  </h3>
                  {selectedResource.description && (
                    <p className="text-muted-foreground mt-1">
                      {selectedResource.description}
                    </p>
                  )}
                </div>
                {getTypeBadge(selectedResource.type)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Categories</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedResource.category?.map((c, i) => (
                      <Badge key={i} variant="secondary">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Product Model</Label>
                  <p className="mt-1">
                    {selectedResource.productModel || "All Models"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">File Size</Label>
                  <p className="mt-1">
                    {formatFileSize(selectedResource.fileSize)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Views</Label>
                  <p className="mt-1">{selectedResource.views || 0}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Uploaded By</Label>
                  <p className="mt-1">
                    {selectedResource.uploadedBy
                      ? `${selectedResource.uploadedBy.firstName} ${selectedResource.uploadedBy.lastName}`
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Uploaded</Label>
                  <p className="mt-1">
                    {new Date(selectedResource.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Visibility</Label>
                <Badge
                  className="mt-1"
                  variant={selectedResource.isPublic ? "default" : "secondary"}
                >
                  {selectedResource.isPublic ? "Public" : "Private"}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedResource?.fileUrl && (
              <Button
                onClick={() => window.open(selectedResource.fileUrl, "_blank")}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
