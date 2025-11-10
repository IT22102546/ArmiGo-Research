"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { SortableTable } from "@/components/admin/SortableTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ApiClient } from "@/lib/api/api-client";
import { createLogger } from "@/lib/utils/logger";
const logger = createLogger("MediumComponent");
import { toast } from "sonner";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
  getErrorMessage,
} from "@/lib/error-handling";

interface Medium {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sortOrder?: number;
}

function MediumManagement() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedMedium, setSelectedMedium] = useState<Medium | null>(null);
  const [newMediumName, setNewMediumName] = useState<string>("");
  const [editMediumName, setEditMediumName] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [mediums, setMediums] = useState<Medium[]>([]);

  useEffect(() => {
    fetchMediums();
  }, []);

  const fetchMediums = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<{
        total: number;
        mediums: Medium[];
      }>("/admin/mediums");
      setMediums(response.mediums);
    } catch (error) {
      logger.error("Failed to fetch mediums:", getErrorMessage(error));
      handleApiError(
        error,
        "MediumManagement.fetchMediums",
        "Failed to load mediums"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedium = async (): Promise<void> => {
    if (!newMediumName.trim()) {
      setFormError("This field is required");
      return;
    }

    try {
      setSaving(true);
      await ApiClient.post("/admin/mediums", { name: newMediumName });
      handleApiSuccess("Medium added successfully");
      setNewMediumName("");
      setFormError("");
      setShowAddModal(false);
      fetchMediums();
    } catch (error) {
      logger.error("Failed to add medium:", getErrorMessage(error));
      handleApiError(
        error,
        "MediumManagement.handleAddMedium",
        "Failed to add medium"
      );
      setFormError(
        asApiError(error).response?.data?.message || "Failed to add medium"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditMedium = async (): Promise<void> => {
    if (!editMediumName.trim()) {
      setFormError("This field is required");
      return;
    }
    if (!selectedMedium) return;

    try {
      setSaving(true);
      await ApiClient.put(`/admin/mediums/${selectedMedium.id}`, {
        name: editMediumName,
      });
      handleApiSuccess("Medium updated successfully");
      setEditMediumName("");
      setFormError("");
      setShowEditModal(false);
      setSelectedMedium(null);
      fetchMediums();
    } catch (error) {
      logger.error("Failed to update medium:", getErrorMessage(error));
      handleApiError(
        error,
        "MediumManagement.handleEditMedium",
        "Failed to update medium"
      );
      setFormError(
        asApiError(error).response?.data?.message || "Failed to update medium"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMedium = async (): Promise<void> => {
    if (!selectedMedium) return;

    try {
      setSaving(true);
      await ApiClient.delete(`/admin/mediums/${selectedMedium.id}`);
      handleApiSuccess("Medium deleted successfully");
      setShowDeleteModal(false);
      setSelectedMedium(null);
      fetchMediums();
    } catch (error) {
      logger.error("Failed to delete medium:", getErrorMessage(error));
      handleApiError(
        error,
        "MediumManagement.handleDeleteMedium",
        "Failed to delete medium"
      );
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (medium: Medium): void => {
    setSelectedMedium(medium);
    setEditMediumName(medium.name);
    setFormError("");
    setShowEditModal(true);
  };

  const openDeleteModal = (medium: Medium): void => {
    setSelectedMedium(medium);
    setShowDeleteModal(true);
  };

  const openAddModal = (): void => {
    setNewMediumName("");
    setFormError("");
    setShowAddModal(true);
  };

  const filteredMediums = mediums.filter((medium) => {
    const matchesSearch =
      medium.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (medium.code &&
        medium.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && medium.isActive) ||
      (statusFilter === "inactive" && !medium.isActive);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading mediums...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <button className="hover:text-foreground">Registration</button>
          <span>/</span>
          <span className="text-foreground">Medium</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Medium</h1>
          <p className="text-muted-foreground">
            Manage teaching mediums for classes and subjects
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search mediums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              onClick={() =>
                setStatusFilter(statusFilter === "all" ? "active" : "all")
              }
            >
              <span className="text-sm">Status</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <Button
            onClick={openAddModal}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Medium
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <SortableTable
            data={filteredMediums}
            getItemId={(m) => m.id}
            columns={[
              {
                key: "code",
                label: "Medium Code",
                render: (m: Medium) => m.code || m.id,
              },
              {
                key: "name",
                label: "Medium Name",
                render: (m: Medium) => (
                  <span className="font-medium">{m.name}</span>
                ),
              },
              {
                key: "isActive",
                label: "Status",
                render: (m: Medium) => (
                  <Badge
                    variant={m.isActive ? "success" : "secondary"}
                    className={
                      m.isActive
                        ? "bg-success/10 text-success hover:bg-success/20"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {m.isActive ? "Active" : "Inactive"}
                  </Badge>
                ),
              },
              {
                key: "actions",
                label: "Actions",
                render: (m: Medium) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(m)}
                      className="p-2 hover:bg-warning/10 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-warning" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(m)}
                      className="p-2 hover:bg-destructive/10 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ),
              },
            ]}
            onReorder={async (reordered: Medium[]) => {
              const previous = mediums;
              setMediums(reordered);
              const items = reordered.map((m, idx) => ({
                id: m.id,
                sortOrder: idx + 1,
              }));
              try {
                await ApiClient.post("/admin/mediums/reorder", { items });
              } catch (err) {
                console.error("Failed to reorder mediums", err);
                setMediums(previous);
              }
            }}
            emptyMessage="No mediums found"
          />
        </div>

        {/* Add Medium Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Medium</DialogTitle>
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="medium-name">Medium Name</Label>
                <Input
                  id="medium-name"
                  placeholder="Enter medium name (e.g., Sinhala, English)"
                  value={newMediumName}
                  onChange={(e) => {
                    setNewMediumName(e.target.value);
                    setFormError("");
                  }}
                  className={formError ? "border-destructive" : ""}
                />
                {formError && (
                  <p className="text-xs text-destructive">{formError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddMedium}
                className="bg-primary hover:bg-primary/90"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Medium Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Medium</DialogTitle>
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-medium-name">Medium Name</Label>
                <Input
                  id="edit-medium-name"
                  value={editMediumName}
                  onChange={(e) => {
                    setEditMediumName(e.target.value);
                    setFormError("");
                  }}
                  className={formError ? "border-destructive" : ""}
                />
                {formError && (
                  <p className="text-xs text-destructive">{formError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditMedium}
                className="bg-primary hover:bg-primary/90"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-md">
            <div className="flex flex-col items-center text-center space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Are you sure?</h3>
                <p className="text-sm text-muted-foreground">
                  Do you really want to delete this medium?
                  <br />
                  This process cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteMedium}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default MediumManagement;
