import React, { useState } from "react";
import { Search, ChevronDown, Plus, Edit2, Trash2, X } from "lucide-react";
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

interface District {
  id: string;
  name: string;
  status: "Active" | "Inactive";
}

function DashDistricts() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [newDistrictName, setNewDistrictName] = useState<string>("");
  const [editDistrictName, setEditDistrictName] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  const [districts, setDistricts] = useState<District[]>([
    { id: "DIS-001", name: "Colombo", status: "Active" },
    { id: "DIS-002", name: "Gampaha", status: "Active" },
    { id: "DIS-003", name: "Kandy", status: "Inactive" },
    { id: "DIS-004", name: "Kalutara", status: "Active" },
    { id: "DIS-005", name: "Galle", status: "Active" },
    { id: "DIS-006", name: "Matara", status: "Inactive" },
  ]);

  const handleAddDistrict = (): void => {
    if (!newDistrictName.trim()) {
      setFormError("This field is required");
      return;
    }
    const newDistrict: District = {
      id: `DIS-${String(districts.length + 1).padStart(3, "0")}`,
      name: newDistrictName,
      status: "Active",
    };
    setDistricts([...districts, newDistrict]);
    setNewDistrictName("");
    setFormError("");
    setShowAddModal(false);
  };

  const handleEditDistrict = (): void => {
    if (!editDistrictName.trim()) {
      setFormError("This field is required");
      return;
    }
    if (!selectedDistrict) return;

    setDistricts(
      districts.map((district) =>
        district.id === selectedDistrict.id
          ? { ...district, name: editDistrictName }
          : district
      )
    );
    setEditDistrictName("");
    setFormError("");
    setShowEditModal(false);
    setSelectedDistrict(null);
  };

  const handleDeleteDistrict = (): void => {
    if (!selectedDistrict) return;

    setDistricts(
      districts.filter((district) => district.id !== selectedDistrict.id)
    );
    setShowDeleteModal(false);
    setSelectedDistrict(null);
  };

  const openEditModal = (district: District): void => {
    setSelectedDistrict(district);
    setEditDistrictName(district.name);
    setFormError("");
    setShowEditModal(true);
  };

  const openDeleteModal = (district: District): void => {
    setSelectedDistrict(district);
    setShowDeleteModal(true);
  };

  const openAddModal = (): void => {
    setNewDistrictName("");
    setFormError("");
    setShowAddModal(true);
  };

  const filteredDistricts = districts.filter((district) => {
    const matchesSearch =
      district.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      district.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      district.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <button className="hover:text-foreground">Registration</button>
          <span>/</span>
          <span className="text-foreground">Districts</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Districts</h1>
          <p className="text-muted-foreground">
            Manage your districts and their status
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search for districts..."
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
            Add District
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-semibold text-sm">
                  District ID
                </th>
                <th className="text-left p-4 font-semibold text-sm">
                  District Name
                </th>
                <th className="text-left p-4 font-semibold text-sm">Status</th>
                <th className="text-left p-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDistricts.map((district, index) => (
                <tr
                  key={`${district.id}-${index}`}
                  className="border-b border-border hover:bg-muted/20 transition-colors"
                >
                  <td className="p-4 text-sm">{district.id}</td>
                  <td className="p-4 text-sm font-medium">{district.name}</td>
                  <td className="p-4">
                    <Badge
                      variant={
                        district.status === "Active" ? "success" : "warning"
                      }
                      className={
                        district.status === "Active"
                          ? "bg-success/10 text-success hover:bg-success/20"
                          : "bg-warning/10 text-warning hover:bg-warning/20"
                      }
                    >
                      {district.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(district)}
                        className="p-2 hover:bg-warning/10 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-warning" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(district)}
                        className="p-2 hover:bg-destructive/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add District Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New District</DialogTitle>
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="district-name">District Name</Label>
                <Input
                  id="district-name"
                  placeholder="Enter district name"
                  value={newDistrictName}
                  onChange={(e) => {
                    setNewDistrictName(e.target.value);
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
                onClick={handleAddDistrict}
                className="bg-primary hover:bg-primary/90"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit District Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update District</DialogTitle>
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-district-name">District Name</Label>
                <Input
                  id="edit-district-name"
                  value={editDistrictName}
                  onChange={(e) => {
                    setEditDistrictName(e.target.value);
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
                onClick={handleEditDistrict}
                className="bg-primary hover:bg-primary/90"
              >
                Update
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
                  Do you really want to delete this district?
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
                  onClick={handleDeleteDistrict}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default DashDistricts;
