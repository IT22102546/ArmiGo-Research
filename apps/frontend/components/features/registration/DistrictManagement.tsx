"use client";

import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
const logger = createLogger("DistrictManagement");
import { Loader2 } from "lucide-react";

interface Province {
  id: string;
  name: string;
  code?: string;
}

interface District {
  id: string;
  name: string;
  code?: string;
  provinceId?: string;
  province?: Province;
  createdAt: string;
  updatedAt: string;
  _count?: {
    zones: number;
  };
}

interface DistrictFormData {
  name: string;
  code?: string;
  provinceId: string | null;
}

interface DistrictFormErrors {
  name?: string;
  code?: string;
  provinceId?: string;
}

const DistrictManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState<string | "all">("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [formData, setFormData] = useState<DistrictFormData>({
    name: "",
    code: "",
    provinceId: null,
  });
  const [errors, setErrors] = useState<DistrictFormErrors>({});

  useEffect(() => {
    fetchDistricts();
    fetchProvinces();
  }, [provinceFilter]);

  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const queryParam =
        provinceFilter !== "all" ? `?provinceId=${provinceFilter}` : "";
      const response = await ApiClient.get<{
        total: number;
        districts: District[];
      }>(`/admin/districts${queryParam}`);
      setDistricts(response.districts || []);
    } catch (error) {
      logger.error("Error fetching districts:", error);
      handleApiError(
        error,
        "DistrictManagement.fetchDistricts",
        "Failed to load districts"
      );
      setDistricts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const response = await ApiClient.get<{
        total: number;
        provinces: Province[];
      }>("/admin/provinces");
      setProvinces(response.provinces || []);
    } catch (error) {
      logger.error("Error fetching provinces:", error);
      handleApiError(
        error,
        "DistrictManagement.fetchProvinces",
        "Failed to load provinces"
      );
      setProvinces([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: DistrictFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "District name is required";
    }

    if (!formData.provinceId) {
      newErrors.provinceId = "Province selection is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    setFormData({
      name: "",
      code: "",
      provinceId: provinceFilter !== "all" ? provinceFilter : null,
    });
    setErrors({});
    setIsAddModalOpen(true);
  };

  const handleEdit = (district: District) => {
    setSelectedDistrict(district);
    setFormData({
      name: district.name,
      code: district.code,
      provinceId: district.provinceId || null,
    });
    setErrors({});
    setIsEditModalOpen(true);
  };

  const handleDelete = (district: District) => {
    setSelectedDistrict(district);
    setIsDeleteModalOpen(true);
  };

  const handleAddDistrict = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      await ApiClient.post("/admin/districts", formData);
      handleApiSuccess("District created successfully");
      setIsAddModalOpen(false);
      await fetchDistricts();
    } catch (error) {
      logger.error("Error creating district:", error);
      handleApiError(
        error,
        "DistrictManagement.handleAddDistrict",
        "Failed to create district"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditDistrict = async () => {
    if (!validateForm() || !selectedDistrict) return;

    try {
      setSaving(true);
      await ApiClient.put(
        `/api/v1/admin/districts/${selectedDistrict.id}`,
        formData
      );
      handleApiSuccess("District updated successfully");
      setIsEditModalOpen(false);
      await fetchDistricts();
    } catch (error) {
      logger.error("Error updating district:", error);
      handleApiError(
        error,
        "DistrictManagement.handleEditDistrict",
        "Failed to update district"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDistrict = async () => {
    if (!selectedDistrict) return;

    try {
      setSaving(true);
      await ApiClient.delete(`/api/v1/admin/districts/${selectedDistrict.id}`);
      handleApiSuccess("District deleted successfully");
      setIsDeleteModalOpen(false);
      await fetchDistricts();
    } catch (error) {
      logger.error("Error deleting district:", error);
      handleApiError(
        error,
        "DistrictManagement.handleDeleteDistrict",
        "Failed to delete district"
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredDistricts = districts.filter((district) => {
    const matchesSearch =
      district.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (district.code &&
        district.code.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Districts</h2>
          <p className="text-muted-foreground">
            Manage districts within provinces
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add District
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search districts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={provinceFilter.toString()}
          onValueChange={(value) =>
            setProvinceFilter(value === "all" ? "all" : value)
          }
        >
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by Province" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Provinces</SelectItem>
            {provinces
              .filter((province) => province.id)
              .map((province) => (
                <SelectItem key={province.id} value={province.id}>
                  {province.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>District Name</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>Zones</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDistricts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No districts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDistricts.map((district) => (
                  <TableRow key={district.id}>
                    <TableCell className="font-mono">
                      {district.code || "N/A"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {district.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{district.province?.name || "N/A"}</span>
                        {district.province?.code && (
                          <span className="text-xs text-muted-foreground">
                            ({district.province.code})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {district._count?.zones || 0} zones
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(district.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(district)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(district)}
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
      )}

      {/* Add District Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New District</DialogTitle>
            <DialogDescription>
              Create a new district within a province
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">District Name*</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Colombo"
                disabled={saving}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Code will be auto-generated from name
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-province">Province*</Label>
              <Select
                value={formData.provinceId || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, provinceId: value })
                }
                disabled={saving || provinces.length === 0}
              >
                <SelectTrigger id="add-province">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {provinces
                    .filter((province) => province.id)
                    .map((province) => (
                      <SelectItem key={province.id} value={province.id}>
                        {province.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.provinceId && (
                <p className="text-sm text-destructive">
                  {String(errors.provinceId)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleAddDistrict} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create District"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit District Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit District</DialogTitle>
            <DialogDescription>Update district information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">District Name*</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={saving}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-province">Province*</Label>
              <Select
                value={formData.provinceId || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, provinceId: value })
                }
                disabled={saving || provinces.length === 0}
              >
                <SelectTrigger id="edit-province">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {provinces
                    .filter((province) => province.id)
                    .map((province) => (
                      <SelectItem key={province.id} value={province.id}>
                        {province.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.provinceId && (
                <p className="text-sm text-destructive">
                  {String(errors.provinceId)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleEditDistrict} disabled={saving}>
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

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete District</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedDistrict?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDistrict}
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
};

export default DistrictManagement;
