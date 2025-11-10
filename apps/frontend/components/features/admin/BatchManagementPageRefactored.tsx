"use client";

/**
 * Batch Management Page - REFACTORED with TanStack Query
 *
 * Demonstrates:
 * - TanStack Query for data fetching
 * - Optimistic updates for better UX
 * - Centralized error handling
 * - Loading and error states
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2, Users, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { GradeSelect } from "@/components/shared/selects/GradeSelect";
import {
  useBatches,
  useCreateBatch,
  useUpdateBatch,
  useDeleteBatch,
} from "@/lib/hooks/queries";
import type { Batch } from "@/lib/api/endpoints/batches";

interface Grade {
  id: string;
  name: string;
  code: string;
}

interface AddEditBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editBatch: Batch | null;
}

const AddEditBatchDialog = ({
  open,
  onOpenChange,
  editBatch,
}: AddEditBatchDialogProps) => {
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [formData, setFormData] = useState({
    name: editBatch?.name || "",
    code: editBatch?.code || "",
    gradeId: editBatch?.gradeId || "",
    description: editBatch?.description || "",
  });

  const createMutation = useCreateBatch();
  const updateMutation = useUpdateBatch();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  React.useEffect(() => {
    if (editBatch) {
      setFormData({
        name: editBatch.name,
        code: editBatch.code || "",
        gradeId: editBatch.gradeId,
        description: editBatch.description || "",
      });
      setCodeManuallyEdited(true);
    } else {
      setFormData({
        name: "",
        code: "",
        gradeId: "",
        description: "",
      });
      setCodeManuallyEdited(false);
    }
  }, [editBatch, open]);

  // Auto-generate code from name when creating new batch
  React.useEffect(() => {
    if (!editBatch && !codeManuallyEdited && formData.name.trim()) {
      const generatedCode = formData.name
        .trim()
        .replace(/\s+/g, "-")
        .toUpperCase();
      setFormData((prev) => ({ ...prev, code: generatedCode }));
    }
  }, [formData.name, editBatch, codeManuallyEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code || !formData.gradeId) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editBatch) {
      updateMutation.mutate(
        { id: editBatch.id, data: formData },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editBatch ? "Edit Batch" : "Add New Batch"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">
                Batch Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Morning Batch"
                required
              />
            </div>

            <div>
              <Label htmlFor="code">
                Batch Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => {
                  setCodeManuallyEdited(true);
                  setFormData({ ...formData, code: e.target.value });
                }}
                placeholder="Auto-generated from name"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Code must be unique within the selected grade
              </p>
            </div>

            <div className="col-span-2">
              <Label htmlFor="grade">
                Grade <span className="text-red-500">*</span>
              </Label>
              <GradeSelect
                value={formData.gradeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, gradeId: value })
                }
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Batch description..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editBatch ? "Update" : "Create"} Batch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const BatchManagementPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");

  // Use TanStack Query for data fetching
  const {
    data: batches = [],
    isLoading,
    isError,
    error,
  } = useBatches(selectedGradeId ? { gradeId: selectedGradeId } : undefined);

  const deleteMutation = useDeleteBatch();

  const handleEdit = (batch: Batch) => {
    setEditBatch(batch);
    setDialogOpen(true);
  };

  const handleDeleteClick = (batch: Batch) => {
    setBatchToDelete(batch);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!batchToDelete) return;

    deleteMutation.mutate(batchToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setBatchToDelete(null);
      },
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditBatch(null);
  };

  // Group batches by grade
  const batchesByGrade = batches.reduce(
    (acc: Record<string, Batch[]>, batch: Batch) => {
      const gradeName = batch.grade?.name || "Unknown Grade";
      if (!acc[gradeName]) {
        acc[gradeName] = [];
      }
      acc[gradeName].push(batch);
      return acc;
    },
    {} as Record<string, Batch[]>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Batch Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage batches for different grades
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Batch
        </Button>
      </div>

      {/* Filter by Grade */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Grade</CardTitle>
          <CardDescription>
            Select a grade to view its batches, or leave empty to see all
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="filterGrade">Grade</Label>
              <GradeSelect
                value={selectedGradeId}
                onValueChange={setSelectedGradeId}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setSelectedGradeId("")}
              disabled={!selectedGradeId}
            >
              Clear Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Batches</p>
              <p className="text-3xl font-bold">{batches.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-3xl font-bold">
                {batches.reduce(
                  (sum: number, b: Batch) => sum + (b._count?.students || 0),
                  0
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Grades</p>
              <p className="text-3xl font-bold">
                {Object.keys(batchesByGrade).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {isError && (
        <Card className="border-red-500">
          <CardContent className="p-6 text-center text-red-600">
            <p>Error loading batches: {(error as Error)?.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Batches List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : batches.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Batches Found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedGradeId
                ? "No batches found for the selected grade"
                : "Get started by creating your first batch"}
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Batch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {(Object.entries(batchesByGrade) as [string, Batch[]][]).map(
            ([gradeName, gradeBatches]) => (
              <Card key={gradeName}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{gradeName}</span>
                    <Badge variant="secondary">
                      {gradeBatches.length} batches
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gradeBatches.map((batch: Batch) => (
                      <Card key={batch.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{batch.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Code: {batch.code}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(batch)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteClick(batch)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>

                          {batch.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {batch.description}
                            </p>
                          )}

                          <div className="flex items-center justify-start text-sm text-muted-foreground">
                            <Users className="h-4 w-4 mr-1" />
                            {batch._count?.students || 0} students
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <AddEditBatchDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        editBatch={editBatch}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the batch &quot;{batchToDelete?.name}
              &quot;. This action cannot be undone.
              {batchToDelete?._count?.students &&
                batchToDelete._count.students > 0 && (
                  <span className="block mt-2 text-red-600 font-semibold">
                    Warning: This batch has {batchToDelete._count.students}{" "}
                    enrolled student(s).
                  </span>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BatchManagementPage;
