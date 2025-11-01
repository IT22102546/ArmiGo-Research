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

interface Grade {
  id: string;
  name: string;
  status: "Active" | "Inactive";
}

function DashGrade() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [newGradeName, setNewGradeName] = useState<string>("");
  const [editGradeName, setEditGradeName] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  const [grades, setGrades] = useState<Grade[]>([
    { id: "TDI2-4567123", name: "Grade 01", status: "Active" },
    { id: "TDI2-4567123", name: "Grade 02", status: "Active" },
    { id: "TDI2-4567123", name: "Grade 03", status: "Inactive" },
    { id: "TDI2-4567123", name: "Grade 03", status: "Active" },
  ]);

  const handleAddGrade = (): void => {
    if (!newGradeName.trim()) {
      setFormError("This field is required");
      return;
    }
    const newGrade: Grade = {
      id: `TDI2-${Math.floor(Math.random() * 10000000)}`,
      name: newGradeName,
      status: "Active",
    };
    setGrades([...grades, newGrade]);
    setNewGradeName("");
    setFormError("");
    setShowAddModal(false);
  };

  const handleEditGrade = (): void => {
    if (!editGradeName.trim()) {
      setFormError("This field is required");
      return;
    }
    if (!selectedGrade) return;

    setGrades(
      grades.map((grade) =>
        grade.id === selectedGrade.id
          ? { ...grade, name: editGradeName }
          : grade
      )
    );
    setEditGradeName("");
    setFormError("");
    setShowEditModal(false);
    setSelectedGrade(null);
  };

  const handleDeleteGrade = (): void => {
    if (!selectedGrade) return;

    setGrades(grades.filter((grade) => grade.id !== selectedGrade.id));
    setShowDeleteModal(false);
    setSelectedGrade(null);
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
      grade.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      grade.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

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
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-semibold text-sm">
                  Grade ID
                </th>
                <th className="text-left p-4 font-semibold text-sm">
                  Grade Name
                </th>
                <th className="text-left p-4 font-semibold text-sm">Status</th>
                <th className="text-left p-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.map((grade, index) => (
                <tr
                  key={`${grade.id}-${index}`}
                  className="border-b border-border hover:bg-muted/20 transition-colors"
                >
                  <td className="p-4 text-sm">{grade.id}</td>
                  <td className="p-4 text-sm font-medium">{grade.name}</td>
                  <td className="p-4">
                    <Badge
                      variant={
                        grade.status === "Active" ? "success" : "warning"
                      }
                      className={
                        grade.status === "Active"
                          ? "bg-success/10 text-success hover:bg-success/20"
                          : "bg-warning/10 text-warning hover:bg-warning/20"
                      }
                    >
                      {grade.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(grade)}
                        className="p-2 hover:bg-warning/10 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-warning" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(grade)}
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

        {/* Add Grade Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Grade</DialogTitle>
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
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
              >
                Save
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

export default DashGrade;
