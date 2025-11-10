"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTable } from "@/components/admin/SortableTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { academicYearsApi } from "@/lib/api/endpoints/academic-years";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
const logger = createLogger("AcademicYearManagement");
import { Switch } from "@/components/ui/switch";

interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
}

const AcademicYearManagement: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [sortedAcademicYears, setSortedAcademicYears] = useState<
    AcademicYear[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState<FormData>({
    year: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAcademicYears();
  }, []);
  useEffect(() => {
    setSortedAcademicYears(academicYears);
  }, [academicYears]);

  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const response = await academicYearsApi.getAll({ includeInactive: true });
      // AcademicYearsApi returns { academicYears: [], total, page, limit }
      setAcademicYears(response?.academicYears || []);
    } catch (error) {
      logger.error("Error fetching academic years:", error);
      handleApiError(
        error,
        "AcademicYearManagement.fetchAcademicYears",
        "Failed to load academic years"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (year?: AcademicYear) => {
    if (year) {
      setEditingYear(year);
      setFormData({
        year: year.year,
        startDate: year.startDate.split("T")[0],
        endDate: year.endDate.split("T")[0],
        isCurrent: year.isCurrent,
        isActive: year.isActive,
      });
    } else {
      setEditingYear(null);
      setFormData({
        year: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingYear(null);
    setFormData({
      year: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.year || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        year: formData.year,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        isCurrent: formData.isCurrent,
        isActive: formData.isActive,
      };

      if (editingYear) {
        await ApiClient.put(`/admin/academic-years/${editingYear.id}`, payload);
        handleApiSuccess("Academic year updated successfully");
      } else {
        await ApiClient.post("/admin/academic-years", payload);
        handleApiSuccess("Academic year created successfully");
      }

      handleCloseModal();
      fetchAcademicYears();
    } catch (error) {
      logger.error("Error saving academic year:", error);
      handleApiError(
        error,
        "AcademicYearManagement.handleSubmit",
        "Failed to save academic year"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this academic year?")) {
      return;
    }

    try {
      await ApiClient.delete(`/admin/academic-years/${id}`);
      toast.success("Academic year deleted successfully");
      fetchAcademicYears();
    } catch (error) {
      logger.error("Error deleting academic year:", error);
      handleApiError(
        error,
        "AcademicYearManagement.handleDelete",
        "Failed to delete academic year"
      );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Academic Year Management</CardTitle>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Academic Year
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : academicYears.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No academic years found</p>
              <Button
                onClick={() => handleOpenModal()}
                variant="outline"
                className="mt-4"
              >
                Create First Academic Year
              </Button>
            </div>
          ) : (
            <SortableTable
              data={sortedAcademicYears}
              columns={[
                {
                  key: "year",
                  label: "Year",
                  render: (y: AcademicYear) => (
                    <span className="font-medium">{y.year}</span>
                  ),
                },
                {
                  key: "startDate",
                  label: "Start Date",
                  render: (y: AcademicYear) => formatDate(y.startDate),
                },
                {
                  key: "endDate",
                  label: "End Date",
                  render: (y: AcademicYear) => formatDate(y.endDate),
                },
                {
                  key: "status",
                  label: "Status",
                  render: (y: AcademicYear) =>
                    y.isActive ? "Active" : "Inactive",
                },
                {
                  key: "current",
                  label: "Current",
                  render: (y: AcademicYear) => (y.isCurrent ? "Yes" : "No"),
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (y: AcademicYear) => (
                    <div className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(y)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        className="ml-2"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(y.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              onReorder={async (items) => {
                setSortedAcademicYears(items);
                const data = items.map((item, idx) => ({
                  id: item.id,
                  sortOrder: idx + 1,
                }));
                await ApiClient.post("/admin/academic-years/reorder", {
                  items: data,
                });
                fetchAcademicYears();
              }}
              getItemId={(y) => y.id}
              enableDragDrop={true}
            ></SortableTable>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingYear ? "Edit Academic Year" : "Create Academic Year"}
            </DialogTitle>
            <DialogDescription>
              {editingYear
                ? "Update the academic year information"
                : "Add a new academic year to the system"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="year">
                  Academic Year <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="year"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                  placeholder="e.g., 2025"
                  maxLength={4}
                  pattern="\d{4}"
                  title="Please enter a 4-digit year (e.g., 2025)"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter a single year (e.g., 2025)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">
                    End Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isCurrent">Set as Current Year</Label>
                <Switch
                  id="isCurrent"
                  checked={formData.isCurrent}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isCurrent: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingYear ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AcademicYearManagement;
