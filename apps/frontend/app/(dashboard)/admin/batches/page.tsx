"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Users,
  GraduationCap,
  Layers,
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Batch {
  id: string;
  name: string;
  code: string;
  gradeId: string;
  isActive: boolean;
  sortOrder?: number;
  grade?: {
    id: string;
    name: string;
    level?: number;
  };
  _count?: {
    studentProfiles: number;
  };
}

interface Grade {
  id: string;
  name: string;
  level?: number;
  sortOrder?: number;
}

interface GradeGroup {
  grade: Grade;
  batches: Batch[];
  totalStudents: number;
  activeBatches: number;
  inactiveBatches: number;
}

export default function BatchesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    gradeId: "",
    isActive: true,
  });

  // Fetch batches
  const { data: batches, isLoading: batchesLoading } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/admin/batches");
      const resp = response?.data ?? response ?? {};
      return (resp.batches || resp || []) as Batch[];
    },
  });

  // Fetch grades
  const { data: grades } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/admin/grades");
      const resp = response?.data ?? response ?? {};
      return (resp.grades || resp || []) as Grade[];
    },
  });

  // Group batches by grade
  const gradeGroups = useMemo(() => {
    if (!batches || !grades) return [];

    const groups: Map<string, GradeGroup> = new Map();

    // Initialize groups for all grades
    grades.forEach((grade) => {
      groups.set(grade.id, {
        grade,
        batches: [],
        totalStudents: 0,
        activeBatches: 0,
        inactiveBatches: 0,
      });
    });

    // Populate groups with batches
    batches.forEach((batch) => {
      const gradeId = batch.gradeId || batch.grade?.id;
      if (gradeId && groups.has(gradeId)) {
        const group = groups.get(gradeId)!;
        group.batches.push(batch);
        group.totalStudents += batch._count?.studentProfiles || 0;
        if (batch.isActive) {
          group.activeBatches++;
        } else {
          group.inactiveBatches++;
        }
      }
    });

    // Sort and filter groups
    let result = Array.from(groups.values())
      .filter((group) => group.batches.length > 0 || searchQuery === "")
      .sort(
        (a, b) =>
          (a.grade.sortOrder || a.grade.level || 0) -
          (b.grade.sortOrder || b.grade.level || 0)
      );

    // Apply search filter
    if (searchQuery) {
      result = result
        .map((group) => ({
          ...group,
          batches: group.batches.filter(
            (batch) =>
              batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              batch.code.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((group) => group.batches.length > 0);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result
        .map((group) => ({
          ...group,
          batches: group.batches.filter((batch) =>
            statusFilter === "active" ? batch.isActive : !batch.isActive
          ),
        }))
        .filter((group) => group.batches.length > 0);
    }

    return result;
  }, [batches, grades, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    if (!batches) return { total: 0, active: 0, inactive: 0, totalStudents: 0 };
    return {
      total: batches.length,
      active: batches.filter((b) => b.isActive).length,
      inactive: batches.filter((b) => !b.isActive).length,
      totalStudents: batches.reduce(
        (acc, b) => acc + (b._count?.studentProfiles || 0),
        0
      ),
    };
  }, [batches]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => ApiClient.post("/admin/batches", data),
    onSuccess: () => {
      toast.success("Batch created successfully");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create batch");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ApiClient.put(`/admin/batches/${id}`, data),
    onSuccess: () => {
      toast.success("Batch updated successfully");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update batch");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiClient.delete(`/admin/batches/${id}`),
    onSuccess: () => {
      toast.success("Batch deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setDeleteDialogOpen(false);
      setSelectedBatch(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete batch");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      ApiClient.put(`/admin/batches/${id}`, { isActive }),
    onSuccess: () => {
      toast.success("Batch status updated");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });

  // Toggle grade expansion
  const toggleGrade = (gradeId: string) => {
    setExpandedGrades((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(gradeId)) {
        newSet.delete(gradeId);
      } else {
        newSet.add(gradeId);
      }
      return newSet;
    });
  };

  // Expand all / Collapse all
  const expandAll = () => {
    setExpandedGrades(new Set(gradeGroups.map((g) => g.grade.id)));
  };

  const collapseAll = () => {
    setExpandedGrades(new Set());
  };

  const handleOpenDialog = (batch?: Batch, preselectedGradeId?: string) => {
    if (batch) {
      setSelectedBatch(batch);
      setFormData({
        name: batch.name,
        code: batch.code,
        gradeId: batch.gradeId,
        isActive: batch.isActive,
      });
    } else {
      setSelectedBatch(null);
      setFormData({
        name: "",
        code: "",
        gradeId: preselectedGradeId || "",
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBatch(null);
    setFormData({
      name: "",
      code: "",
      gradeId: "",
      isActive: true,
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a batch name");
      return;
    }
    if (!formData.code.trim()) {
      toast.error("Please enter a batch code");
      return;
    }
    if (!formData.gradeId) {
      toast.error("Please select a grade");
      return;
    }

    if (selectedBatch) {
      updateMutation.mutate({ id: selectedBatch.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (selectedBatch) {
      deleteMutation.mutate(selectedBatch.id);
    }
  };

  const duplicateBatch = (batch: Batch) => {
    setFormData({
      name: `${batch.name} (Copy)`,
      code: `${batch.code}-COPY`,
      gradeId: batch.gradeId,
      isActive: true,
    });
    setSelectedBatch(null);
    setDialogOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Layers className="h-8 w-8 text-primary" />
              Batch Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Organize students into batches within each grade
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Add New Batch
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Batches
                  </p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Batches
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.active}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Inactive Batches
                  </p>
                  <p className="text-3xl font-bold text-gray-500">
                    {stats.inactive}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Students
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.totalStudents}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4 w-full sm:w-auto">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search batches by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(v: any) => setStatusFilter(v)}
                >
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={expandAll}>
                  Expand All
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll}>
                  Collapse All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grade-wise Batch List */}
        <div className="space-y-4">
          {batchesLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading batches...</p>
                </div>
              </CardContent>
            </Card>
          ) : gradeGroups.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Batches Found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== "all"
                      ? "No batches match your search criteria"
                      : "Get started by creating your first batch"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Button onClick={() => handleOpenDialog()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Batch
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            gradeGroups.map((group) => (
              <Collapsible
                key={group.grade.id}
                open={expandedGrades.has(group.grade.id)}
                onOpenChange={() => toggleGrade(group.grade.id)}
              >
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {expandedGrades.has(group.grade.id) ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <GraduationCap className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div>
                            <CardTitle className="text-xl">
                              {group.grade.name}
                            </CardTitle>
                            <CardDescription>
                              {group.batches.length} batch
                              {group.batches.length !== 1 ? "es" : ""} •{" "}
                              {group.totalStudents} student
                              {group.totalStudents !== 1 ? "s" : ""}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex gap-2">
                            <Badge
                              variant="default"
                              className="bg-green-100 text-green-700 hover:bg-green-100"
                            >
                              {group.activeBatches} Active
                            </Badge>
                            {group.inactiveBatches > 0 && (
                              <Badge variant="secondary">
                                {group.inactiveBatches} Inactive
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(undefined, group.grade.id);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Batch
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Separator />
                    <CardContent className="pt-4">
                      <div className="grid gap-3">
                        {group.batches
                          .sort(
                            (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
                          )
                          .map((batch) => (
                            <div
                              key={batch.id}
                              className={cn(
                                "flex items-center justify-between p-4 rounded-lg border transition-colors",
                                batch.isActive
                                  ? "bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                                  : "bg-gray-50 dark:bg-gray-800/50 opacity-75"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={cn(
                                    "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-lg",
                                    batch.isActive
                                      ? "bg-primary/10 text-primary"
                                      : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                                  )}
                                >
                                  {batch.code.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">
                                      {batch.name}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className="font-mono text-xs"
                                    >
                                      {batch.code}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {batch._count?.studentProfiles || 0}{" "}
                                      students
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={batch.isActive}
                                        onCheckedChange={(checked) =>
                                          toggleStatusMutation.mutate({
                                            id: batch.id,
                                            isActive: checked,
                                          })
                                        }
                                      />
                                      <span className="text-sm text-muted-foreground w-16">
                                        {batch.isActive ? "Active" : "Inactive"}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Toggle batch status
                                  </TooltipContent>
                                </Tooltip>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleOpenDialog(batch)}
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit Batch
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => duplicateBatch(batch)}
                                    >
                                      <Copy className="h-4 w-4 mr-2" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => {
                                        setSelectedBatch(batch);
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                {selectedBatch ? "Edit Batch" : "Create New Batch"}
              </DialogTitle>
              <DialogDescription>
                {selectedBatch
                  ? "Update the batch information below"
                  : "Add a new batch to organize students"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="grade">
                  Grade <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.gradeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gradeId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades
                      ?.filter((grade) => grade.id)
                      .map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Batch Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Batch A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Batch Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g., A"
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                <div className="space-y-0.5">
                  <Label htmlFor="status" className="font-medium">
                    Active Status
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive batches won't accept new enrollments
                  </p>
                </div>
                <Switch
                  id="status"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : selectedBatch
                    ? "Update Batch"
                    : "Create Batch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Delete Batch
              </DialogTitle>
              <DialogDescription className="pt-2">
                Are you sure you want to delete{" "}
                <strong>"{selectedBatch?.name}"</strong>?
                {selectedBatch?._count?.studentProfiles &&
                selectedBatch._count.studentProfiles > 0 ? (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-amber-800 dark:text-amber-200 text-sm">
                      <strong>Warning:</strong> This batch has{" "}
                      {selectedBatch._count.studentProfiles} student(s)
                      enrolled. They will need to be reassigned.
                    </p>
                  </div>
                ) : null}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSelectedBatch(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Batch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
