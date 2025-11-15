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
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
const logger = createLogger("GradeManagement");

interface Grade {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sortOrder?: number;
}

function GradeManagement() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [newGradeName, setNewGradeName] = useState<string>("");
  const [editGradeName, setEditGradeName] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [grades, setGrades] = useState<Grade[]>([]);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<{ total: number; grades: Grade[] }>(
        "/admin/grades"
      );
      setGrades(response.grades);
    } catch (error) {
      logger.error("Failed to fetch grades:", error);
      handleApiError(
        error,
        "GradeManagement.fetchGrades",
        "Failed to load grades"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddGrade = async (): Promise<void> => {
    if (!newGradeName.trim()) {
      setFormError("This field is required");
      return;
    }

    try {
      setSaving(true);
      await ApiClient.post("/admin/grades", { name: newGradeName });
      handleApiSuccess("Grade added successfully");
      setNewGradeName("");
      setFormError("");
      setShowAddModal(false);
      fetchGrades();
    } catch (error) {
      logger.error("Failed to add grade:", error);
      handleApiError(
        error,
        "GradeManagement.handleAddGrade",
        "Failed to add grade"
      );
      setFormError(
        asApiError(error).response?.data?.message || "Failed to add grade"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditGrade = async (): Promise<void> => {
    if (!editGradeName.trim()) {
      setFormError("This field is required");
      return;
    }
    if (!selectedGrade) return;

    try {
      setSaving(true);
      await ApiClient.put(`/admin/grades/${selectedGrade.id}`, {
        name: editGradeName,
      });
      handleApiSuccess("Grade updated successfully");
      setEditGradeName("");
      setFormError("");
      setShowEditModal(false);
      setSelectedGrade(null);
      fetchGrades();
    } catch (error) {
      logger.error("Failed to update grade:", error);
      handleApiError(
        error,
        "GradeManagement.handleEditGrade",
        "Failed to update grade"
      );
      setFormError(
        asApiError(error).response?.data?.message || "Failed to update grade"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGrade = async (): Promise<void> => {
    if (!selectedGrade) return;

    try {
      setSaving(true);
      await ApiClient.delete(`/admin/grades/${selectedGrade.id}`);
      handleApiSuccess("Grade deleted successfully");
      setShowDeleteModal(false);
      setSelectedGrade(null);
      fetchGrades();
    } catch (error) {
      logger.error("Failed to delete grade:", error);
      handleApiError(
        error,
        "GradeManagement.handleDeleteGrade",
        "Failed to delete grade"
      );
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (grade: Grade): void => {
    setSelectedGrade(grade);
    setEditGradeName(grade.name);
    setFormError("");
    setShowEditModal(true);
  };

  const openDeleteModal = (grade: Grade): void => {
    setSelectedGrade(grade);
    setShowDeleteModal(true);
  };

  const openAddModal = (): void => {
    setNewGradeName("");
    setFormError("");
    setShowAddModal(true);
  };

  const filteredGrades = grades.filter((grade) => {
    const matchesSearch =
      grade.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (grade.code &&
        grade.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && grade.isActive) ||
      (statusFilter === "inactive" && !grade.isActive);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading grades...</span>
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
          <span className="text-foreground">Grade</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Grade</h1>
          <p className="text-muted-foreground">
            Manage you send and receive Transfer Request
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search for..."
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
            Add Grade
          </Button>
        </div>

        {/* Table */}
        <SortableTable
          data={filteredGrades}
          getItemId={(grade) => grade.id}
          onReorder={async (reordered) => {
            const previous = grades;
            setGrades(reordered);
            const items = reordered.map((g, idx) => ({
              id: g.id,
              sortOrder: idx + 1,
            }));
            try {
              await ApiClient.post("/admin/grades/reorder", { items });
            } catch (err) {
              console.error("Failed to reorder grades", err);
              setGrades(previous);
            }
          }}
          columns={[
            {
              key: "code",
              label: "Grade Code",
              render: (grade) => (
                <span className="text-sm">{grade.code || grade.id}</span>
              ),
            },
            {
              key: "name",
              label: "Grade Name",
              render: (grade) => (
                <span className="text-sm font-medium">{grade.name}</span>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (grade) => (
                <Badge
                  variant={grade.isActive ? "success" : "secondary"}
                  className={
                    grade.isActive
                      ? "bg-success/10 text-success hover:bg-success/20"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {grade.isActive ? "Active" : "Inactive"}
                </Badge>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (grade) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(grade)}
                    className="p-2 hover:bg-warning/10 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-warning" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(grade)}
                    className="p-2 hover:bg-destructive/10 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ),
            },
          ]}
          emptyMessage="No grades found"
        />

        {/* Add Grade Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Grade</DialogTitle>
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
                <Label htmlFor="grade-name">Grade</Label>
                <Input
                  id="grade-name"
                  placeholder="Enter Grade"
                  value={newGradeName}
                  onChange={(e) => {
                    setNewGradeName(e.target.value);
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
                onClick={handleAddGrade}
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

        {/* Edit Grade Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Grade</DialogTitle>
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
                <Label htmlFor="edit-grade-name">Grade</Label>
                <Input
                  id="edit-grade-name"
                  value={editGradeName}
                  onChange={(e) => {
                    setEditGradeName(e.target.value);
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
                onClick={handleEditGrade}
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
                  Do you really want to delete these records?
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
                  onClick={handleDeleteGrade}
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

export default GradeManagement;
