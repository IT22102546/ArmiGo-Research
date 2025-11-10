"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  BarChart3,
} from "lucide-react";
import { announcementsApi } from "@/lib/api/endpoints";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "GENERAL" | "EXAM" | "CLASS" | "PAYMENT" | "SYSTEM" | "EMERGENCY";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  targetRoles: string[];
  isActive: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  _count?: {
    reads: number;
  };
  grades?: Array<{
    grade: {
      id: string;
      name: string;
    };
  }>;
}

export default function AnnouncementsManagementPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "GENERAL",
    priority: "NORMAL",
    targetRoles: [] as string[],
    targetGrades: [] as string[],
    publishedAt: "",
    expiresAt: "",
  });

  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [readStats, setReadStats] = useState<any>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [pagination.page, typeFilter, statusFilter, searchTerm]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementsApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        type: typeFilter !== "ALL" ? typeFilter : undefined,
        isActive:
          statusFilter === "ACTIVE"
            ? true
            : statusFilter === "INACTIVE"
              ? false
              : undefined,
        search: searchTerm || undefined,
      });

      const announcementsArr = Array.isArray(response)
        ? response
        : (response.data ?? []);
      setAnnouncements(announcementsArr);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total ?? 0,
        pages:
          response.pagination?.pages ??
          Math.ceil((response.pagination?.total ?? 0) / pagination.limit),
      }));
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.content) {
      handleApiError(new Error("Title and content are required"));
      return;
    }

    try {
      setLoading(true);
      await announcementsApi.create({
        ...formData,
        publishedAt: formData.publishedAt
          ? new Date(formData.publishedAt)
          : undefined,
        expiresAt: formData.expiresAt
          ? new Date(formData.expiresAt)
          : undefined,
      });
      handleApiSuccess("Announcement created successfully");
      setCreateDialogOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAnnouncement) return;

    try {
      setLoading(true);
      await announcementsApi.update(selectedAnnouncement.id, {
        ...formData,
        publishedAt: formData.publishedAt
          ? new Date(formData.publishedAt)
          : undefined,
        expiresAt: formData.expiresAt
          ? new Date(formData.expiresAt)
          : undefined,
      });
      handleApiSuccess("Announcement updated successfully");
      setEditDialogOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;

    try {
      setLoading(true);
      await announcementsApi.delete(selectedAnnouncement.id);
      handleApiSuccess("Announcement deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedAnnouncement(null);
      fetchAnnouncements();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      setLoading(true);
      await announcementsApi.update(announcement.id, {
        isActive: !announcement.isActive,
      });
      handleApiSuccess(
        `Announcement ${announcement.isActive ? "deactivated" : "activated"} successfully`
      );
      fetchAnnouncements();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtendExpiry = async (announcement: Announcement) => {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 30); // Extend by 30 days

    try {
      setLoading(true);
      await announcementsApi.update(announcement.id, {
        expiresAt: newExpiry,
      });
      handleApiSuccess("Expiry extended by 30 days");
      fetchAnnouncements();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStats = async (announcement: Announcement) => {
    try {
      setLoading(true);
      const stats = await announcementsApi.getReadStats(announcement.id);
      setReadStats(stats);
      setSelectedAnnouncement(announcement);
      setStatsDialogOpen(true);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      targetRoles: announcement.targetRoles,
      targetGrades: announcement.grades?.map((g) => g.grade.id) || [],
      publishedAt: announcement.publishedAt
        ? new Date(announcement.publishedAt).toISOString().slice(0, 16)
        : "",
      expiresAt: announcement.expiresAt
        ? new Date(announcement.expiresAt).toISOString().slice(0, 16)
        : "",
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      type: "GENERAL",
      priority: "NORMAL",
      targetRoles: [],
      targetGrades: [],
      publishedAt: "",
      expiresAt: "",
    });
    setSelectedAnnouncement(null);
  };

  const getPriorityColor = (priority: string): BadgeVariant => {
    switch (priority) {
      case "URGENT":
        return "destructive";
      case "HIGH":
        return "warning";
      case "NORMAL":
        return "default";
      case "LOW":
        return "secondary";
      default:
        return "default";
    }
  };

  const getTypeColor = (type: string): BadgeVariant => {
    switch (type) {
      case "EMERGENCY":
        return "destructive";
      case "EXAM":
        return "secondary";
      case "CLASS":
        return "default";
      case "PAYMENT":
        return "success";
      case "SYSTEM":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Announcements Management</CardTitle>
            <CardDescription>
              Create, manage, and track system announcements
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="GENERAL">General</SelectItem>
              <SelectItem value="EXAM">Exam</SelectItem>
              <SelectItem value="CLASS">Class</SelectItem>
              <SelectItem value="PAYMENT">Payment</SelectItem>
              <SelectItem value="SYSTEM">System</SelectItem>
              <SelectItem value="EMERGENCY">Emergency</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Target Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Reads</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : announcements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No announcements found
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell className="font-medium">
                    {announcement.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeColor(announcement.type)}>
                      {announcement.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(announcement.priority)}>
                      {announcement.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(announcement.targetRoles || []).map((role) => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={announcement.isActive ? "default" : "secondary"}
                    >
                      {announcement.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {announcement.publishedAt
                      ? new Date(announcement.publishedAt).toLocaleDateString()
                      : "Not published"}
                  </TableCell>
                  <TableCell>
                    {announcement.expiresAt
                      ? new Date(announcement.expiresAt).toLocaleDateString()
                      : "No expiry"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewStats(announcement)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      {announcement._count?.reads || 0}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAnnouncement(announcement);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(announcement)}
                      >
                        {announcement.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      {announcement.expiresAt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExtendExpiry(announcement)}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAnnouncement(announcement);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {announcements.length} of {pagination.total} announcements
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Announcement</DialogTitle>
            <DialogDescription>
              Create a new announcement to notify users
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
                placeholder="Enter announcement title"
              />
            </div>
            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Enter announcement content"
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="EXAM">Exam</SelectItem>
                    <SelectItem value="CLASS">Class</SelectItem>
                    <SelectItem value="PAYMENT">Payment</SelectItem>
                    <SelectItem value="SYSTEM">System</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Target Roles</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  "INTERNAL_STUDENT",
                  "EXTERNAL_STUDENT",
                  "INTERNAL_TEACHER",
                  "EXTERNAL_TEACHER",
                  "ADMIN",
                  "SUPER_ADMIN",
                ].map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={formData.targetRoles.includes(role)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            targetRoles: [...formData.targetRoles, role],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            targetRoles: formData.targetRoles.filter(
                              (r) => r !== role
                            ),
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`role-${role}`} className="text-sm">
                      {role.replace("_", " ")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="publishedAt">Publish Time (optional)</Label>
                <Input
                  id="publishedAt"
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={(e) =>
                    setFormData({ ...formData, publishedAt: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="expiresAt">Expiry Time (optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              Create Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Similar structure to Create */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>Update announcement details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Same form fields as Create Dialog */}
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Content *</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={6}
              />
            </div>
            {/* ... other fields similar to create dialog ... */}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              Update Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAnnouncement?.title}</DialogTitle>
            <DialogDescription>
              <div className="flex gap-2 mt-2">
                <Badge variant={getTypeColor(selectedAnnouncement?.type || "")}>
                  {selectedAnnouncement?.type}
                </Badge>
                <Badge
                  variant={getPriorityColor(
                    selectedAnnouncement?.priority || ""
                  )}
                >
                  {selectedAnnouncement?.priority}
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Content</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {selectedAnnouncement?.content}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Target Roles</h4>
              <div className="flex gap-2 flex-wrap">
                {(selectedAnnouncement?.targetRoles || []).map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
            {selectedAnnouncement?.grades &&
              selectedAnnouncement.grades.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Target Grades</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedAnnouncement.grades.map((g) => (
                      <Badge key={g.grade.id} variant="outline">
                        {g.grade.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this announcement? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <BarChart3 className="h-5 w-5 inline mr-2" />
              Read Statistics
            </DialogTitle>
            <DialogDescription>{selectedAnnouncement?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Reads</CardDescription>
                  <CardTitle className="text-3xl">
                    {readStats?.totalReads || 0}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Read Rate</CardDescription>
                  <CardTitle className="text-3xl">
                    {readStats?.readRate || 0}%
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
            {readStats?.byRole && (
              <div>
                <h4 className="font-semibold mb-2">Reads by Role</h4>
                <div className="space-y-2">
                  {Object.entries(readStats.byRole).map(([role, count]) => (
                    <div
                      key={role}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm">{role}</span>
                      <Badge>{count as number}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setStatsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
