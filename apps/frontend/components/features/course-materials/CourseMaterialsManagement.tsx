"use client";

import React, { useState, useEffect } from "react";
import { asApiError } from "@/lib/error-handling";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getDisplayName } from "@/lib/utils/display";
import { ApiClient } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Upload,
  FileText,
  Video,
  BookOpen,
  FileImage,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Plus,
  Filter,
  Search,
} from "lucide-react";

interface CourseMaterial {
  id: string;
  title: string;
  description?: string;
  type: "NOTES" | "SLIDES" | "VIDEO" | "ASSIGNMENT" | "REFERENCE" | "OTHER";
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  thumbnailUrl?: string;
  grade: string[];
  subject?: string;
  isPublic: boolean;
  downloads: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  uploader: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  class?: {
    id: string;
    name: string;
    subject: string;
  };
}

const materialTypes = [
  { value: "NOTES", label: "Notes", icon: FileText },
  { value: "SLIDES", label: "Slides", icon: FileImage },
  { value: "VIDEO", label: "Video", icon: Video },
  { value: "ASSIGNMENT", label: "Assignment", icon: BookOpen },
  { value: "REFERENCE", label: "Reference", icon: FileText },
  { value: "OTHER", label: "Other", icon: FileText },
];

const grades = ["6", "7", "8", "9", "10", "11", "12", "13"];
const subjects = [
  "Mathematics",
  "Science",
  "English",
  "History",
  "Geography",
  "ICT",
];

export default function CourseMaterialsManagement() {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] =
    useState<CourseMaterial | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    type: "NOTES" as const,
    grade: [] as string[],
    subject: "",
    isPublic: false,
    file: null as File | null,
  });
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    grade: "",
    subject: "",
    isPublic: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMaterials();
  }, [filters]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.type) params.append("type", filters.type);
      if (filters.grade) params.append("grade", filters.grade);
      if (filters.subject) params.append("subject", filters.subject);
      if (filters.isPublic) params.append("isPublic", filters.isPublic);

      const response = await fetch(
        `/api/course-materials/my-materials?${params}`
      );
      const data = await response.json();

      if (response.ok) {
        setMaterials(data.data || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch materials",
          status: "error",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch materials",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        status: "warning",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("title", uploadForm.title);
      formData.append("description", uploadForm.description);
      formData.append("type", uploadForm.type);
      formData.append("grade", JSON.stringify(uploadForm.grade));
      formData.append("subject", uploadForm.subject);
      formData.append("isPublic", uploadForm.isPublic.toString());

      await ApiClient.request("/course-materials/upload", {
        method: "POST",
        body: formData,
      });

      toast({
        title: "Success",
        description: "Material uploaded successfully",
        status: "success",
      });
      setUploadDialogOpen(false);
      setUploadForm({
        title: "",
        description: "",
        type: "NOTES",
        grade: [],
        subject: "",
        isPublic: false,
        file: null,
      });
      fetchMaterials();
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: asApiError(error).message || "Failed to upload material",
        status: "error",
      });
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const response = await fetch(`/api/course-materials/${materialId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Material deleted successfully",
          status: "success",
        });
        fetchMaterials();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete material",
          status: "error",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete material",
        status: "error",
      });
    }
  };

  const handleDownload = async (material: CourseMaterial) => {
    try {
      // Track download
      await fetch(`/api/course-materials/${material.id}/download`, {
        method: "POST",
      });

      // Open file in new tab
      window.open(material.fileUrl, "_blank");
    } catch (error) {
      console.error("Failed to track download:", error);
      // Still open the file even if tracking fails
      window.open(material.fileUrl, "_blank");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getTypeIcon = (type: string) => {
    const materialType = materialTypes.find((t) => t.value === type);
    return materialType ? materialType.icon : FileText;
  };

  const MaterialCard = ({ material }: { material: CourseMaterial }) => {
    const IconComponent = getTypeIcon(material.type);

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <IconComponent className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-lg">{material.title}</CardTitle>
                <CardDescription className="mt-1">
                  {material.description || "No description"}
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDownload(material)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedMaterial(material);
                    setEditDialogOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(material.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Metadata */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{material.type}</Badge>
              {material.grade.map((g) => (
                <Badge key={getDisplayName(g)} variant="outline">
                  Grade {getDisplayName(g)}
                </Badge>
              ))}
              {material.subject && (
                <Badge variant="outline">
                  {getDisplayName(material.subject)}
                </Badge>
              )}
              {material.isPublic && (
                <Badge className="bg-green-100 text-green-800">Public</Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {material.views} views
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                {material.downloads} downloads
              </span>
              <span>{formatFileSize(material.fileSize)}</span>
            </div>

            {/* Class info */}
            {material.class && (
              <div className="text-sm text-gray-600">
                Class:{" "}
                <span className="font-medium">{material.class.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Materials</h1>
          <p className="text-gray-600 mt-2">
            Upload and manage your course materials
          </p>
        </div>

        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Course Material</DialogTitle>
              <DialogDescription>
                Upload a new file for your students to access
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      file: e.target.files?.[0] || null,
                    })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, title: e.target.value })
                  }
                  placeholder="Enter material title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description of the material"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label>Type</Label>
                <Select
                  value={uploadForm.type}
                  onValueChange={(value: any) =>
                    setUploadForm({ ...uploadForm, type: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {materialTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Subject</Label>
                <Select
                  value={uploadForm.subject}
                  onValueChange={(value) =>
                    setUploadForm({ ...uploadForm, subject: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={uploadForm.isPublic}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, isPublic: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label="Make material publicly accessible"
                />
                <Label htmlFor="isPublic">Make publicly accessible</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUploadDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpload}>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search materials..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) =>
                  setFilters({ ...filters, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {materialTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Grade</Label>
              <Select
                value={filters.grade}
                onValueChange={(value) =>
                  setFilters({ ...filters, grade: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All grades</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subject</Label>
              <Select
                value={filters.subject}
                onValueChange={(value) =>
                  setFilters({ ...filters, subject: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Visibility</Label>
              <Select
                value={filters.isPublic}
                onValueChange={(value) =>
                  setFilters({ ...filters, isPublic: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All materials" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All materials</SelectItem>
                  <SelectItem value="true">Public only</SelectItem>
                  <SelectItem value="false">Private only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading materials...</p>
          </div>
        </div>
      ) : materials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No materials found
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {Object.values(filters).some((f) => f)
                ? "No materials match your current filters"
                : "You haven't uploaded any materials yet"}
            </p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload First Material
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {materials.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      )}
    </div>
  );
}
