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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { getErrorMessage } from "@/lib/types/api.types";

const logger = createLogger("ZonesComponent");
import { toast } from "sonner";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";

interface District {
  id: string;
  name: string;
  code?: string;
}

interface Zone {
  id: string;
  name: string;
  code?: string;
  districtId?: string;
  district?: District;
  createdAt: string;
  updatedAt: string;
}

function ZoneManagement() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [districtFilter, setDistrictFilter] = useState<string | "all">("all");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [newZoneName, setNewZoneName] = useState<string>("");
  const [newZoneDistrictId, setNewZoneDistrictId] = useState<string>("");
  const [editZoneName, setEditZoneName] = useState<string>("");
  const [editZoneDistrictId, setEditZoneDistrictId] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    fetchZones();
    fetchDistricts();
  }, [districtFilter]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const queryParam =
        districtFilter !== "all" ? `?districtId=${districtFilter}` : "";
      const response = await ApiClient.get<{ total: number; zones: Zone[] }>(
        `/admin/zones${queryParam}`
      );
      setZones(response.zones);
    } catch (error) {
      logger.error("Failed to fetch zones:", {
        message: getErrorMessage(error),
      });
      handleApiError(
        error,
        "ZoneManagement.fetchZones",
        "Failed to load zones"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async () => {
    try {
      const response = await ApiClient.get<{
        total: number;
        districts: District[];
      }>("/admin/districts");
      setDistricts(response.districts || []);
    } catch (error) {
      logger.error("Failed to fetch districts:", {
        message: getErrorMessage(error),
      });
      handleApiError(
        error,
        "ZoneManagement.fetchDistricts",
        "Failed to load districts"
      );
    }
  };

  const handleAddZone = async (): Promise<void> => {
    if (!newZoneName.trim()) {
      setFormError("This field is required");
      return;
    }

    try {
      setSaving(true);
      await ApiClient.post("/admin/zones", {
        name: newZoneName,
        districtId: newZoneDistrictId || undefined,
      });
      handleApiSuccess("Zone added successfully");
      setNewZoneName("");
      setNewZoneDistrictId("");
      setFormError("");
      setShowAddModal(false);
      fetchZones();
    } catch (error) {
      logger.error("Failed to add zone:", { message: getErrorMessage(error) });
      handleApiError(
        error,
        "ZoneManagement.handleAddZone",
        "Failed to add zone"
      );
      setFormError(
        asApiError(error).response?.data?.message || "Failed to add zone"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditZone = async (): Promise<void> => {
    if (!editZoneName.trim()) {
      setFormError("This field is required");
      return;
    }
    if (!selectedZone) return;

    try {
      setSaving(true);
      await ApiClient.put(`/api/v1/admin/zones/${selectedZone.id}`, {
        name: editZoneName,
        districtId: editZoneDistrictId || undefined,
      });
      handleApiSuccess("Zone updated successfully");
      setEditZoneName("");
      setEditZoneDistrictId("");
      setFormError("");
      setShowEditModal(false);
      setSelectedZone(null);
      fetchZones();
    } catch (error) {
      logger.error("Failed to update zone:", {
        message: getErrorMessage(error),
      });
      handleApiError(
        error,
        "ZoneManagement.handleEditZone",
        "Failed to update zone"
      );
      setFormError(
        asApiError(error).response?.data?.message || "Failed to update zone"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (): Promise<void> => {
    if (!selectedZone) return;

    try {
      setSaving(true);
      await ApiClient.delete(`/api/v1/admin/zones/${selectedZone.id}`);
      handleApiSuccess("Zone deleted successfully");
      setShowDeleteModal(false);
      setSelectedZone(null);
      fetchZones();
    } catch (error) {
      logger.error("Failed to delete zone:", {
        message: getErrorMessage(error),
      });
      handleApiError(
        error,
        "ZoneManagement.handleDeleteZone",
        "Failed to delete zone"
      );
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (zone: Zone): void => {
    setSelectedZone(zone);
    setEditZoneName(zone.name);
    setEditZoneDistrictId(zone.districtId || "none");
    setFormError("");
    setShowEditModal(true);
  };

  const openDeleteModal = (zone: Zone): void => {
    setSelectedZone(zone);
    setShowDeleteModal(true);
  };

  const openAddModal = (): void => {
    setNewZoneName("");
    setNewZoneDistrictId("");
    setFormError("");
    setShowAddModal(true);
  };

  const filteredZones = zones.filter((zone) => {
    const matchesSearch =
      zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (zone.code &&
        zone.code.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading zones...</span>
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
          <span className="text-foreground">Zones</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Zones</h1>
          <p className="text-muted-foreground">Manage zones within districts</p>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search zones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={districtFilter.toString()}
              onValueChange={(value) =>
                setDistrictFilter(value === "all" ? "all" : value)
              }
            >
              <SelectTrigger className="w-[200px]">
                <span className="text-sm">District</span>
                <ChevronDown className="w-4 h-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districts
                  .filter((district) => district.id)
                  .map((district) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={openAddModal}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Zone
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-semibold text-sm">
                  Zone Code
                </th>
                <th className="text-left p-4 font-semibold text-sm">
                  Zone Name
                </th>
                <th className="text-left p-4 font-semibold text-sm">
                  District
                </th>
                <th className="text-left p-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredZones.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No zones found
                  </td>
                </tr>
              ) : (
                filteredZones.map((zone) => (
                  <tr
                    key={zone.id}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4 text-sm">{zone.code || zone.id}</td>
                    <td className="p-4 text-sm font-medium">{zone.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {zone.district?.name || "N/A"}
                      {zone.district?.code && (
                        <span className="text-xs ml-1">
                          ({zone.district.code})
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(zone)}
                          className="p-2 hover:bg-warning/10 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-warning" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(zone)}
                          className="p-2 hover:bg-destructive/10 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Zone Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Zone</DialogTitle>
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
                <Label htmlFor="zone-name">
                  Zone Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="zone-name"
                  placeholder="Enter zone name"
                  value={newZoneName}
                  onChange={(e) => {
                    setNewZoneName(e.target.value);
                    setFormError("");
                  }}
                  className={formError ? "border-destructive" : ""}
                />
                {formError && (
                  <p className="text-xs text-destructive">{formError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Code will be auto-generated from name
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone-district">District</Label>
                <Select
                  value={newZoneDistrictId || undefined}
                  onValueChange={(value) =>
                    setNewZoneDistrictId(value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger id="zone-district">
                    <SelectValue placeholder="Select district (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No District</SelectItem>
                    {districts.map((district) => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddZone}
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

        {/* Edit Zone Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Zone</DialogTitle>
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
                <Label htmlFor="edit-zone-name">
                  Zone Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-zone-name"
                  value={editZoneName}
                  onChange={(e) => {
                    setEditZoneName(e.target.value);
                    setFormError("");
                  }}
                  className={formError ? "border-destructive" : ""}
                />
                {formError && (
                  <p className="text-xs text-destructive">{formError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-zone-district">District</Label>
                <Select
                  value={editZoneDistrictId || undefined}
                  onValueChange={(value) =>
                    setEditZoneDistrictId(value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger id="edit-zone-district">
                    <SelectValue placeholder="Select district (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No District</SelectItem>
                    {districts
                      .filter((district) => district.id)
                      .map((district) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditZone}
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
                  Do you really want to delete this zone?
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
                  onClick={handleDeleteZone}
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

export default ZoneManagement;
