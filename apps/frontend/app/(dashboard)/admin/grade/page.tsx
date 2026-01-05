"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { useToast } from "@/lib/hooks/use-toast";
import { ApiClient } from "@/lib/api/api-client";
import { SortableTable } from "@/components/admin/SortableTable";

interface Grade {
  id: string;
  name: string;
  code: string;
  level: number;
  isActive: boolean;
  sortOrder?: number;
}

export default function GradePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "" });
  const [sortedGrades, setSortedGrades] = useState<Grade[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: grades, isLoading } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      const response = await ApiClient.request<any>("/admin/grades");
      const gradesData = response.data?.grades || response.grades || [];
      // Prefer server-side sortOrder, fallback to level
      return gradesData.sort(
        (a: Grade, b: Grade) =>
          (a.sortOrder ?? a.level) - (b.sortOrder ?? b.level)
      );
    },
  });

  useEffect(() => {
    if (grades) {
      setSortedGrades(grades);
    }
  }, [grades]);

  const createMutation = useMutation({
    mutationFn: (data: typeof formData & { level: number }) =>
      ApiClient.post("/admin/grades", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast({ title: "Grade created successfully", status: "success" });
      setIsDialogOpen(false);
      setFormData({ name: "", code: "" });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to create grade";
      toast({
        title: "Error",
        description: Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage,
        status: "error",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: typeof formData & { level: number };
    }) => ApiClient.put(`/admin/grades/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast({ title: "Grade updated successfully", status: "success" });
      setIsDialogOpen(false);
      setEditingGrade(null);
      setFormData({ name: "", code: "" });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to update grade";
      toast({
        title: "Error",
        description: Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage,
        status: "error",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiClient.delete(`/admin/grades/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast({ title: "Grade deleted successfully", status: "success" });
    },
    onError: () =>
      toast({
        title: "Failed to delete grade",
        description: "Please try again",
        status: "error",
      }),
  });

  const handleReorder = async (reorderedGrades: Grade[]) => {
    const previous = sortedGrades;
    setSortedGrades(reorderedGrades);

    // Build items in the { id, sortOrder } shape expected by the backend
    const items = reorderedGrades.map((grade, index) => ({
      id: grade.id,
      sortOrder: index + 1,
    }));

    try {
      await ApiClient.post("/admin/grades/reorder", { items });
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      // No UI toasts for reorder updates; keep quiet on success
    } catch (error) {
      // Log the error only to console as requested
      console.error("Failed to update grade order", error);
      // Revert the UI order to previous state to keep it consistent
      setSortedGrades(previous);
    }
  };

  const handleEdit = (grade: Grade) => {
    setEditingGrade(grade);
    setFormData({ name: grade.name, code: grade.code });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingGrade) {
      updateMutation.mutate({
        id: editingGrade.id,
        data: { ...formData, level: editingGrade.level },
      });
    } else {
      // Auto-generate level for new grade
      const maxLevel =
        sortedGrades.length > 0
          ? Math.max(...sortedGrades.map((g) => g.level))
          : 0;
      createMutation.mutate({ ...formData, level: maxLevel + 1 });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this grade?")) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (grade: Grade) => (
        <span className="font-medium">{grade.name}</span>
      ),
    },
    {
      key: "code",
      label: "Code",
    },
    {
      key: "level",
      label: "Level",
      render: (grade: Grade) => (
        <span className="font-mono text-sm">{grade.level}</span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (grade: Grade) => (
        <Badge variant={grade.isActive ? "default" : "secondary"}>
          {grade.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (grade: Grade) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(grade)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(grade.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Grade Management</h1>
          <p className="text-muted-foreground">
            Manage academic grades and levels - Drag to reorder
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingGrade(null);
            setFormData({ name: "", code: "" });
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Grade
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading grades...</div>
          ) : (
            <SortableTable
              data={sortedGrades}
              columns={columns}
              onReorder={handleReorder}
              getItemId={(grade) => grade.id}
              emptyMessage="No grades found. Click 'Add Grade' to create one."
              enableDragDrop={true}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGrade ? "Edit Grade" : "Add Grade"}
            </DialogTitle>
            <DialogDescription>
              {editingGrade
                ? "Update the grade details"
                : "Create a new grade level"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Grade 1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g., G1"
                />
              </div>
              {editingGrade && (
                <div className="text-sm text-muted-foreground">
                  Current Level: {editingGrade.level}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingGrade ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
