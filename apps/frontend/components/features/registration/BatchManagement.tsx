"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, Loader2 } from "lucide-react";
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
const logger = createLogger("BatchManagement");

interface Batch {
  id: string;
  name: string;
  code?: string;
  academicYear?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BatchManagement() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [newBatchName, setNewBatchName] = useState<string>("");
  const [editBatchName, setEditBatchName] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<{ total: number; batches: Batch[] }>(
        "/admin/batches"
      );
      setBatches(response.batches || []);
    } catch (error) {
      logger.error("Failed to fetch batches:", error);
      handleApiError(
        error,
        "BatchManagement.fetchBatches",
        "Failed to load batches"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = async (): Promise<void> => {
    if (!newBatchName.trim()) {
      setFormError("This field is required");
      return;
    }

    try {
      setSaving(true);
      await ApiClient.post("/admin/batches", { name: newBatchName });
      handleApiSuccess("Batch added successfully");
      setNewBatchName("");
      setFormError("");
      setShowAddModal(false);
      fetchBatches();
    } catch (error) {
      logger.error("Failed to add batch:", error);
      handleApiError(
        error,
        "BatchManagement.handleAddBatch",
        "Failed to add batch"
      );
      const err = error as Error & {
        response?: { data?: { message?: string } };
      };
      setFormError(err.response?.data?.message || "Failed to add batch");
    } finally {
      setSaving(false);
    }
  };

  const handleEditBatch = async (): Promise<void> => {
    if (!editBatchName.trim()) {
      setFormError("This field is required");
      return;
    }
    if (!selectedBatch) return;

    try {
      setSaving(true);
      await ApiClient.put(`/admin/batches/${selectedBatch.id}`, {
        name: editBatchName,
      });
      handleApiSuccess("Batch updated successfully");
      setEditBatchName("");
      setFormError("");
      setShowEditModal(false);
      setSelectedBatch(null);
      fetchBatches();
    } catch (error) {
      logger.error("Failed to update batch:", error);
      handleApiError(
        error,
        "BatchManagement.handleEditBatch",
        "Failed to update batch"
      );
      const err = error as Error & {
        response?: { data?: { message?: string } };
      };
      setFormError(err.response?.data?.message || "Failed to update batch");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBatch = async (): Promise<void> => {
    if (!selectedBatch) return;

    try {
      setSaving(true);
      await ApiClient.delete(`/admin/batches/${selectedBatch.id}`);
      handleApiSuccess("Batch deleted successfully");
      setShowDeleteModal(false);
      setSelectedBatch(null);
      fetchBatches();
    } catch (error) {
      logger.error("Failed to delete batch:", error);
      handleApiError(
        error,
        "BatchManagement.handleDeleteBatch",
        "Failed to delete batch"
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (batch.code &&
        batch.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && batch.isActive) ||
      (statusFilter === "inactive" && !batch.isActive);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading batches...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Batch Management</h2>
        <p className="text-muted-foreground">Manage academic batches</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search batches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Batch
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredBatches.map((batch) => (
          <div
            key={batch.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <h3 className="font-medium">{batch.name}</h3>
              {batch.code && (
                <p className="text-sm text-muted-foreground">{batch.code}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={batch.isActive ? "default" : "secondary"}>
                {batch.isActive ? "Active" : "Inactive"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedBatch(batch);
                  setEditBatchName(batch.name);
                  setShowEditModal(true);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedBatch(batch);
                  setShowDeleteModal(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Batch Name</Label>
              <Input
                value={newBatchName}
                onChange={(e) => setNewBatchName(e.target.value)}
                placeholder="Enter batch name"
              />
              {formError && (
                <p className="text-sm text-destructive mt-1">{formError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBatch} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Batch Name</Label>
              <Input
                value={editBatchName}
                onChange={(e) => setEditBatchName(e.target.value)}
                placeholder="Enter batch name"
              />
              {formError && (
                <p className="text-sm text-destructive mt-1">{formError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditBatch} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Batch</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this batch?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBatch}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
