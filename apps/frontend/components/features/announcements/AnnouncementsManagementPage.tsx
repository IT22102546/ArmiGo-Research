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

interface Announcement {
  id: string;
  title: string;
  content: string;
  type:
    | "GENERAL"
    | "STOCK_ALERT"
    | "PROMOTION"
    | "MAINTENANCE"
    | "ORDER_UPDATE"
    | "URGENT";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  targetRoles: string[];
  isActive: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  _count?: {
    reads: number;
  };
}

const initialAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "ArmiGo Pro Device Back in Stock",
    content:
      "Great news! The ArmiGo Pro Gaming Device is now back in stock. Limited quantities available. Order now to secure your unit before they sell out again.",
    type: "STOCK_ALERT",
    priority: "HIGH",
    targetRoles: ["CUSTOMER", "DEALER"],
    isActive: true,
    publishedAt: "2024-01-15T09:00:00Z",
    expiresAt: "2024-02-15T23:59:59Z",
    createdAt: "2024-01-15T08:30:00Z",
    _count: { reads: 156 },
  },
  {
    id: "2",
    title: "Scheduled System Maintenance - January 20th",
    content:
      "We will be performing scheduled maintenance on our ordering system on January 20th from 2:00 AM to 6:00 AM. The website and order placement will be temporarily unavailable during this time.",
    type: "MAINTENANCE",
    priority: "URGENT",
    targetRoles: ["CUSTOMER", "DEALER", "DISTRIBUTOR", "ADMIN"],
    isActive: true,
    publishedAt: "2024-01-10T10:00:00Z",
    expiresAt: "2024-01-20T06:00:00Z",
    createdAt: "2024-01-10T09:45:00Z",
    _count: { reads: 423 },
  },
  {
    id: "3",
    title: "New Year Sale - 20% Off All Accessories",
    content:
      "Celebrate the new year with amazing deals! Get 20% off on all gaming accessories including controllers, cases, screen protectors, and more. Use code: NEWYEAR2024 at checkout.",
    type: "PROMOTION",
    priority: "HIGH",
    targetRoles: ["CUSTOMER", "DEALER"],
    isActive: true,
    publishedAt: "2024-01-01T00:00:00Z",
    expiresAt: "2024-01-31T23:59:59Z",
    createdAt: "2023-12-28T14:20:00Z",
    _count: { reads: 892 },
  },
  {
    id: "4",
    title: "Delivery Delays in Central Province",
    content:
      "Due to heavy rainfall in the Central Province, deliveries may experience delays of 1-2 days. We apologize for any inconvenience and are working to expedite deliveries.",
    type: "ORDER_UPDATE",
    priority: "NORMAL",
    targetRoles: ["CUSTOMER"],
    isActive: true,
    publishedAt: "2024-01-12T15:30:00Z",
    expiresAt: "2024-01-25T23:59:59Z",
    createdAt: "2024-01-12T15:00:00Z",
    _count: { reads: 234 },
  },
  {
    id: "5",
    title: "ArmiGo Lite - Out of Stock",
    content:
      "ArmiGo Lite Gaming Device is currently out of stock. Expected restock date: February 1st, 2024. You can pre-order now to reserve your unit.",
    type: "STOCK_ALERT",
    priority: "NORMAL",
    targetRoles: ["CUSTOMER", "DEALER"],
    isActive: true,
    publishedAt: "2024-01-14T11:00:00Z",
    expiresAt: null,
    createdAt: "2024-01-14T10:45:00Z",
    _count: { reads: 178 },
  },
  {
    id: "6",
    title: "New Game Bundle Released",
    content:
      "Introducing the Ultimate Gaming Bundle! Get ArmiGo Pro + 10 premium games + wireless controller for only LKR 95,000 (Save LKR 15,000). Limited time offer!",
    type: "PROMOTION",
    priority: "HIGH",
    targetRoles: ["CUSTOMER", "DEALER"],
    isActive: true,
    publishedAt: "2024-01-08T08:00:00Z",
    expiresAt: "2024-01-30T23:59:59Z",
    createdAt: "2024-01-07T16:30:00Z",
    _count: { reads: 567 },
  },
  {
    id: "7",
    title: "Extended Warranty Program Launched",
    content:
      "Protect your investment! We now offer extended warranty plans for all ArmiGo devices. Get 2 years additional coverage for just LKR 8,000. Contact customer support for details.",
    type: "GENERAL",
    priority: "LOW",
    targetRoles: ["CUSTOMER"],
    isActive: true,
    publishedAt: "2024-01-05T12:00:00Z",
    expiresAt: null,
    createdAt: "2024-01-05T11:30:00Z",
    _count: { reads: 312 },
  },
  {
    id: "8",
    title: "URGENT: Payment Gateway Issue Resolved",
    content:
      "The payment gateway issue that affected some customers between 10 AM - 11 AM today has been resolved. If your payment failed, please try again. Contact support if you face any issues.",
    type: "URGENT",
    priority: "URGENT",
    targetRoles: ["CUSTOMER", "DEALER", "ADMIN"],
    isActive: false,
    publishedAt: "2024-01-11T11:30:00Z",
    expiresAt: "2024-01-11T23:59:59Z",
    createdAt: "2024-01-11T11:15:00Z",
    _count: { reads: 89 },
  },
];

export default function AnnouncementsManagementPage() {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(initialAnnouncements);
  const [_loading, _setLoading] = useState(false);
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
    publishedAt: "",
    expiresAt: "",
  });

  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [readStats, setReadStats] = useState<{
    total: number;
    unread: number;
    byRole: Array<{ role: string; count: number }>;
  } | null>(null);

  useEffect(() => {
    let filtered = [...initialAnnouncements];

    // Filter by type
    if (typeFilter !== "ALL") {
      filtered = filtered.filter((a) => a.type === typeFilter);
    }

    // Filter by status
    if (statusFilter === "ACTIVE") {
      filtered = filtered.filter((a) => a.isActive);
    } else if (statusFilter === "INACTIVE") {
      filtered = filtered.filter((a) => !a.isActive);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setAnnouncements(filtered);
    setPagination((prev) => ({
      ...prev,
      total: filtered.length,
      pages: Math.ceil(filtered.length / pagination.limit),
    }));
  }, [typeFilter, statusFilter, searchTerm, pagination.limit]);

  const handleCreate = () => {
    if (!formData.title || !formData.content) {
      alert("Title and content are required");
      return;
    }

    const newAnnouncement: Announcement = {
      id: String(Date.now()),
      title: formData.title,
      content: formData.content,
      type: formData.type as Announcement["type"],
      priority: formData.priority as Announcement["priority"],
      targetRoles: formData.targetRoles,
      isActive: true,
      publishedAt: formData.publishedAt || new Date().toISOString(),
      expiresAt: formData.expiresAt || null,
      createdAt: new Date().toISOString(),
      _count: { reads: 0 },
    };

    initialAnnouncements.unshift(newAnnouncement);
    setAnnouncements([newAnnouncement, ...announcements]);
    setCreateDialogOpen(false);
    resetForm();
    alert("Announcement created successfully");
  };

  const handleEdit = () => {
    if (!selectedAnnouncement) return;

    const updatedAnnouncements = initialAnnouncements.map((a) =>
      a.id === selectedAnnouncement.id
        ? {
            ...a,
            title: formData.title,
            content: formData.content,
            type: formData.type as Announcement["type"],
            priority: formData.priority as Announcement["priority"],
            targetRoles: formData.targetRoles,
            publishedAt: formData.publishedAt || a.publishedAt,
            expiresAt: formData.expiresAt || a.expiresAt,
          }
        : a
    );

    initialAnnouncements.splice(
      0,
      initialAnnouncements.length,
      ...updatedAnnouncements
    );
    // Trigger re-filter by updating a dependency
    setSearchTerm((prev) => prev);
    setEditDialogOpen(false);
    resetForm();
    alert("Announcement updated successfully");
  };

  const handleDelete = () => {
    if (!selectedAnnouncement) return;

    const index = initialAnnouncements.findIndex(
      (a) => a.id === selectedAnnouncement.id
    );
    if (index > -1) {
      initialAnnouncements.splice(index, 1);
      // Trigger re-filter by updating a dependency
      setSearchTerm((prev) => prev);
    }

    setDeleteDialogOpen(false);
    setSelectedAnnouncement(null);
    alert("Announcement deleted successfully");
  };

  const handleToggleActive = (announcement: Announcement) => {
    const updatedAnnouncements = initialAnnouncements.map((a) =>
      a.id === announcement.id ? { ...a, isActive: !a.isActive } : a
    );
    initialAnnouncements.splice(
      0,
      initialAnnouncements.length,
      ...updatedAnnouncements
    );
    // Trigger re-filter by updating a dependency
    setSearchTerm((prev) => prev);
    alert(
      `Announcement ${announcement.isActive ? "deactivated" : "activated"} successfully`
    );
  };

  const handleExtendExpiry = (announcement: Announcement) => {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 30); // Extend by 30 days

    const updatedAnnouncements = initialAnnouncements.map((a) =>
      a.id === announcement.id
        ? { ...a, expiresAt: newExpiry.toISOString() }
        : a
    );
    initialAnnouncements.splice(
      0,
      initialAnnouncements.length,
      ...updatedAnnouncements
    );
    // Trigger re-filter by updating a dependency
    setSearchTerm((prev) => prev);
    alert("Expiry extended by 30 days");
  };

  const handleViewStats = (announcement: Announcement) => {
    const mockStats = {
      total: announcement._count?.reads || 0,
      unread: Math.floor((announcement._count?.reads || 0) * 0.3),
      byRole: [
        {
          role: "CUSTOMER",
          count: Math.floor((announcement._count?.reads || 0) * 0.6),
        },
        {
          role: "DEALER",
          count: Math.floor((announcement._count?.reads || 0) * 0.25),
        },
        {
          role: "ADMIN",
          count: Math.floor((announcement._count?.reads || 0) * 0.15),
        },
      ],
    };
    setReadStats(mockStats);
    setSelectedAnnouncement(announcement);
    setStatsDialogOpen(true);
  };

  const openEditDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      targetRoles: announcement.targetRoles,
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
      case "URGENT":
        return "destructive";
      case "STOCK_ALERT":
        return "warning";
      case "PROMOTION":
        return "success";
      case "MAINTENANCE":
        return "secondary";
      case "ORDER_UPDATE":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Product Announcements</CardTitle>
            <CardDescription>
              Manage stock alerts, promotions, and system notifications
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
              <SelectItem value="STOCK_ALERT">Stock Alert</SelectItem>
              <SelectItem value="PROMOTION">Promotion</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="ORDER_UPDATE">Order Update</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
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
            {announcements.length === 0 ? (
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
              Create a new announcement about products, stock, or updates
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
                    <SelectItem value="STOCK_ALERT">Stock Alert</SelectItem>
                    <SelectItem value="PROMOTION">Promotion</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="ORDER_UPDATE">Order Update</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
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
              <Label>Target Audience</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  "CUSTOMER",
                  "DEALER",
                  "DISTRIBUTOR",
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
            <Button onClick={handleCreate}>Create Announcement</Button>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Type</Label>
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
                    <SelectItem value="STOCK_ALERT">Stock Alert</SelectItem>
                    <SelectItem value="PROMOTION">Promotion</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="ORDER_UPDATE">Order Update</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
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
              <Label>Target Audience</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  "CUSTOMER",
                  "DEALER",
                  "DISTRIBUTOR",
                  "ADMIN",
                  "SUPER_ADMIN",
                ].map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-role-${role}`}
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
                    <Label htmlFor={`edit-role-${role}`} className="text-sm">
                      {role.replace("_", " ")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-publishedAt">
                  Publish Time (optional)
                </Label>
                <Input
                  id="edit-publishedAt"
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={(e) =>
                    setFormData({ ...formData, publishedAt: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-expiresAt">Expiry Time (optional)</Label>
                <Input
                  id="edit-expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                />
              </div>
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
            <Button onClick={handleEdit}>Update Announcement</Button>
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
              <h4 className="font-semibold mb-2">Target Audience</h4>
              <div className="flex gap-2 flex-wrap">
                {(selectedAnnouncement?.targetRoles || []).map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
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
            <Button variant="destructive" onClick={handleDelete}>
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
                    {readStats?.total || 0}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Unread</CardDescription>
                  <CardTitle className="text-3xl">
                    {readStats?.unread || 0}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
            {readStats?.byRole && (
              <div>
                <h4 className="font-semibold mb-2">Reads by Role</h4>
                <div className="space-y-2">
                  {readStats.byRole.map(({ role, count }) => (
                    <div
                      key={role}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm">{role}</span>
                      <Badge>{count}</Badge>
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
