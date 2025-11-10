"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiClient } from "@/lib/api/api-client";
import { createLogger } from "@/lib/utils/logger";
const logger = createLogger("ProvincesComponent");
import { toast } from "sonner";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
  getErrorMessage,
} from "@/lib/error-handling";

interface Province {
  id: string;
  name: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    districts: number;
  };
}

interface ProvinceFormData {
  name: string;
  code?: string;
}

function ProvinceManagement() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [formData, setFormData] = useState<ProvinceFormData>({
    name: "",
    code: "",
  });
  const [formError, setFormError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [provinces, setProvinces] = useState<Province[]>([]);

  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<{
        total: number;
        provinces: Province[];
      }>("/admin/provinces");
      setProvinces(response.provinces);
    } catch (error) {
      logger.error("Failed to fetch provinces:", getErrorMessage(error));
      handleApiError(
        error,
        "ProvinceManagement.fetchProvinces",
        "Failed to load provinces"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvince = async (): Promise<void> => {
    if (!formData.name.trim()) {
      setFormError("Province name is required");
      return;
    }

    try {
      setSaving(true);
      await ApiClient.post("/admin/provinces", formData);
      handleApiSuccess("Province added successfully");
      setFormData({ name: "", code: "" });
      setFormError("");
      setShowAddModal(false);
      fetchProvinces();
    } catch (error) {
      logger.error("Failed to add province:", getErrorMessage(error));
      handleApiError(
        error,
        "ProvinceManagement.handleAddProvince",
        "Failed to add province"
      );
      setFormError(
        asApiError(error).response?.data?.message || "Failed to add province"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditProvince = async (): Promise<void> => {
    if (!formData.name.trim()) {
      setFormError("Province name is required");
      return;
    }
    if (!selectedProvince) return;

    try {
      setSaving(true);
      await ApiClient.put(
        `/api/v1/admin/provinces/${selectedProvince.id}`,
        formData
      );
      handleApiSuccess("Province updated successfully");
      setFormData({ name: "", code: "" });
      setFormError("");
      setShowEditModal(false);
      setSelectedProvince(null);
      fetchProvinces();
    } catch (error) {
      logger.error("Failed to update province:", getErrorMessage(error));
      handleApiError(
        error,
        "ProvinceManagement.handleEditProvince",
        "Failed to update province"
      );
      setFormError(
        asApiError(error).response?.data?.message || "Failed to update province"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProvince = async (): Promise<void> => {
    if (!selectedProvince) return;

    try {
      setSaving(true);
      await ApiClient.delete(`/api/v1/admin/provinces/${selectedProvince.id}`);
      handleApiSuccess("Province deleted successfully");
      setShowDeleteModal(false);
      setSelectedProvince(null);
      fetchProvinces();
    } catch (error) {
      logger.error("Failed to delete province:", getErrorMessage(error));
      handleApiError(
        error,
        "ProvinceManagement.handleDeleteProvince",
        "Failed to delete province"
      );
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (province: Province): void => {
    setSelectedProvince(province);
    setFormData({ name: province.name, code: province.code });
    setFormError("");
    setShowEditModal(true);
  };

  const openDeleteModal = (province: Province): void => {
    setSelectedProvince(province);
    setShowDeleteModal(true);
  };

  const openAddModal = (): void => {
    setFormData({ name: "", code: "" });
    setFormError("");
    setShowAddModal(true);
  };

  const filteredProvinces = provinces.filter((province) => {
    const matchesSearch =
      province.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (province.code &&
        province.code.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading provinces...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Provinces</h2>
          <p className="text-muted-foreground">
            Manage provinces in the system
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Province
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search provinces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Province Code</TableHead>
              <TableHead>Province Name</TableHead>
              <TableHead>Districts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProvinces.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  No provinces found
                </TableCell>
              </TableRow>
            ) : (
              filteredProvinces.map((province) => (
                <TableRow key={province.id}>
                  <TableCell className="font-medium">
                    {province.code || province.id}
                  </TableCell>
                  <TableCell>{province.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {province._count?.districts || 0} districts
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(province)}
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteModal(province)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Province Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Province</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="province-name">
                Province Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="province-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter province name"
                className={formError ? "border-red-500" : ""}
              />
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <p className="text-xs text-muted-foreground">
                Code will be auto-generated from name
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleAddProvince} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Province"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Province Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Province</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-province-name">
                Province Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-province-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter province name"
                className={formError ? "border-red-500" : ""}
              />
              {formError && <p className="text-sm text-red-500">{formError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleEditProvince} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Province Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Province</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <strong>{selectedProvince?.name}</strong>? This action cannot be
              undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProvince}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProvinceManagement;
