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

interface Medium {
  id: string;
  name: string;
  status: "Active" | "Inactive";
}

function DashMedium() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedMedium, setSelectedMedium] = useState<Medium | null>(null);
  const [newMediumName, setNewMediumName] = useState<string>("");
  const [editMediumName, setEditMediumName] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  const [mediums, setMediums] = useState<Medium[]>([
    { id: "MED-001", name: "Sinhala", status: "Active" },
    { id: "MED-002", name: "Tamil", status: "Active" },
    { id: "MED-003", name: "English", status: "Active" },
    { id: "MED-004", name: "Sinhala/Tamil", status: "Inactive" },
    { id: "MED-005", name: "Sinhala/English", status: "Active" },
    { id: "MED-006", name: "Tamil/English", status: "Inactive" },
  ]);

  const handleAddMedium = (): void => {
    if (!newMediumName.trim()) {
      setFormError("This field is required");
      return;
    }
    const newMedium: Medium = {
      id: `MED-${String(mediums.length + 1).padStart(3, "0")}`,
      name: newMediumName,
      status: "Active",
    };
    setMediums([...mediums, newMedium]);
    setNewMediumName("");
    setFormError("");
    setShowAddModal(false);
  };

  const handleEditMedium = (): void => {
    if (!editMediumName.trim()) {
      setFormError("This field is required");
      return;
    }
    if (!selectedMedium) return;

    setMediums(
      mediums.map((medium) =>
        medium.id === selectedMedium.id
          ? { ...medium, name: editMediumName }
          : medium
      )
    );
    setEditMediumName("");
    setFormError("");
    setShowEditModal(false);
    setSelectedMedium(null);
  };

  const handleDeleteMedium = (): void => {
    if (!selectedMedium) return;

    setMediums(mediums.filter((medium) => medium.id !== selectedMedium.id));
    setShowDeleteModal(false);
    setSelectedMedium(null);
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
      medium.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      medium.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

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
            Manage your language mediums and their status
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search for mediums..."
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-semibold text-sm">
                  Medium ID
                </th>
                <th className="text-left p-4 font-semibold text-sm">
                  Medium Name
                </th>
                <th className="text-left p-4 font-semibold text-sm">Status</th>
                <th className="text-left p-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMediums.map((medium, index) => (
                <tr
                  key={`${medium.id}-${index}`}
                  className="border-b border-border hover:bg-muted/20 transition-colors"
                >
                  <td className="p-4 text-sm">{medium.id}</td>
                  <td className="p-4 text-sm font-medium">{medium.name}</td>
                  <td className="p-4">
                    <Badge
                      variant={
                        medium.status === "Active" ? "success" : "warning"
                      }
                      className={
                        medium.status === "Active"
                          ? "bg-success/10 text-success hover:bg-success/20"
                          : "bg-warning/10 text-warning hover:bg-warning/20"
                      }
                    >
                      {medium.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(medium)}
                        className="p-2 hover:bg-warning/10 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-warning" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(medium)}
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

        {/* Add Medium Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Medium</DialogTitle>
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="medium-name">Medium Name</Label>
                <Input
                  id="medium-name"
                  placeholder="Enter medium name"
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
              >
                Save
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

export default DashMedium;
