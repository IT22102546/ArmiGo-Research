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
  FileText,
  Video,
  Image,
  File,
  Download,
  Eye,
  Trash2,
  Edit,
  Filter,
  Upload,
  BookOpen,
} from "lucide-react";

type MaterialType =
  | "NOTES"
  | "SLIDES"
  | "VIDEO"
  | "ASSIGNMENT"
  | "REFERENCE"
  | "OTHER";

interface CourseMaterial {
  id: string;
  title: string;
  description?: string;
  type: MaterialType;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  grade: string[];
  subject?: string;
  classId?: string;
  isPublic: boolean;
  downloads: number;
  uploadedById: string;
  uploadedBy?: {
    firstName: string;
    lastName: string;
  };
  class?: {
    name: string;
  };
  createdAt: string;
}

export default function CourseMaterialsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    grade: "",
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] =
    useState<CourseMaterial | null>(null);

  const { data: materials, isLoading } = useQuery({
    queryKey: ["course-materials", filters],
    queryFn: async () => {
      const params: any = {};
      if (filters.type) params.type = filters.type;
      if (filters.grade) params.grade = filters.grade;
      if (filters.search) params.search = filters.search;

      const response = await ApiClient.get<any>("/course-materials", {
        params,
      });
      return response?.data || response || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await ApiClient.delete(`/course-materials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-materials"] });
      toast.success("Material deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete material");
    },
  });

  const materialsList = Array.isArray(materials)
    ? materials
    : materials?.materials || [];

  const getTypeIcon = (type: MaterialType) => {
    switch (type) {
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "SLIDES":
        return <Image className="h-4 w-4" />;
      case "NOTES":
      case "ASSIGNMENT":
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: MaterialType) => {
    const styles: Record<MaterialType, string> = {
      NOTES: "bg-blue-100 text-blue-800",
      SLIDES: "bg-purple-100 text-purple-800",
      VIDEO: "bg-red-100 text-red-800",
      ASSIGNMENT: "bg-green-100 text-green-800",
      REFERENCE: "bg-yellow-100 text-yellow-800",
      OTHER: "bg-gray-100 text-gray-800",
    };
    return <Badge className={styles[type]}>{type}</Badge>;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleView = (material: CourseMaterial) => {
    setSelectedMaterial(material);
    setViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this material?")) {
      deleteMutation.mutate(id);
    }
  };

  const stats = {
    total: materialsList.length,
    notes: materialsList.filter((m: CourseMaterial) => m.type === "NOTES")
      .length,
    videos: materialsList.filter((m: CourseMaterial) => m.type === "VIDEO")
      .length,
    assignments: materialsList.filter(
      (m: CourseMaterial) => m.type === "ASSIGNMENT"
    ).length,
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
          <h1 className="text-3xl font-bold">Course Materials</h1>
          <p className="text-muted-foreground">
            Manage uploaded course materials and resources
          </p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Material
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Materials
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.notes}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
            <Video className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.videos}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.assignments}
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
                <SelectValue placeholder="Material Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="NOTES">Notes</SelectItem>
                <SelectItem value="SLIDES">Slides</SelectItem>
                <SelectItem value="VIDEO">Video</SelectItem>
                <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                <SelectItem value="REFERENCE">Reference</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.grade}
              onValueChange={(value) =>
                setFilters({ ...filters, grade: value === "all" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {[...Array(13)].map((_, i) => (
                  <SelectItem key={i} value={`Grade ${i + 1}`}>
                    Grade {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setFilters({ search: "", type: "", grade: "" })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Materials</CardTitle>
          <CardDescription>
            {materialsList.length} material(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialsList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground"
                  >
                    No materials found
                  </TableCell>
                </TableRow>
              ) : (
                materialsList.map((material: CourseMaterial) => (
                  <TableRow key={material.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(material.type)}
                        <div>
                          <div className="font-medium">{material.title}</div>
                          {material.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {material.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(material.type)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {material.grade?.map((g, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {material.uploadedBy
                        ? `${material.uploadedBy.firstName} ${material.uploadedBy.lastName}`
                        : "-"}
                    </TableCell>
                    <TableCell>{formatFileSize(material.fileSize)}</TableCell>
                    <TableCell>{material.downloads || 0}</TableCell>
                    <TableCell>
                      {format(new Date(material.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(material)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {material.fileUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(material.fileUrl, "_blank")
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
                          onClick={() => handleDelete(material.id)}
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

      {/* View Material Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Material Details</DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  {getTypeIcon(selectedMaterial.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {selectedMaterial.title}
                  </h3>
                  {selectedMaterial.description && (
                    <p className="text-muted-foreground mt-1">
                      {selectedMaterial.description}
                    </p>
                  )}
                </div>
                {getTypeBadge(selectedMaterial.type)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Grade(s)</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedMaterial.grade?.map((g, i) => (
                      <Badge key={i} variant="secondary">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">File Size</Label>
                  <p className="mt-1">
                    {formatFileSize(selectedMaterial.fileSize)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Downloads</Label>
                  <p className="mt-1">{selectedMaterial.downloads || 0}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Uploaded</Label>
                  <p className="mt-1">
                    {format(new Date(selectedMaterial.createdAt), "PPp")}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Visibility</Label>
                <Badge
                  className="mt-1"
                  variant={selectedMaterial.isPublic ? "default" : "secondary"}
                >
                  {selectedMaterial.isPublic ? "Public" : "Private"}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedMaterial?.fileUrl && (
              <Button
                onClick={() => window.open(selectedMaterial.fileUrl, "_blank")}
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
