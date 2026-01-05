"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SortableTable } from "@/components/admin/SortableTable";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";

export default function MediumsPage() {
  const queryClient = useQueryClient();
  const [localMediums, setLocalMediums] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMedium, setSelectedMedium] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    isActive: true,
  });

  const { data: mediums, isLoading } = useQuery({
    queryKey: ["mediums"],
    queryFn: async () => {
      const response = await ApiClient.request<any>("/admin/mediums");
      return response?.mediums || [];
    },
  });

  // Sync local copy for optimistic updates and reordering
  useEffect(() => {
    // @ts-ignore
    setLocalMediums(mediums || []);
  }, [mediums]);

  const createMutation = useMutation({
    mutationFn: (data: any) => ApiClient.post("/admin/mediums", data),
    onSuccess: () => {
      toast.success("Medium created successfully");
      queryClient.invalidateQueries({ queryKey: ["mediums"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create medium");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ApiClient.put(`/admin/mediums/${id}`, data),
    onSuccess: () => {
      toast.success("Medium updated successfully");
      queryClient.invalidateQueries({ queryKey: ["mediums"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update medium");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiClient.delete(`/admin/mediums/${id}`),
    onSuccess: () => {
      toast.success("Medium deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["mediums"] });
      setDeleteDialogOpen(false);
      setSelectedMedium(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete medium");
    },
  });

  const handleOpenDialog = (medium?: any) => {
    if (medium) {
      setSelectedMedium(medium);
      setFormData({
        name: medium.name,
        code: medium.code,
        description: medium.description || "",
        isActive: medium.isActive ?? true,
      });
    } else {
      setSelectedMedium(null);
      setFormData({
        name: "",
        code: "",
        description: "",
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMedium(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      isActive: true,
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedMedium) {
      updateMutation.mutate({ id: selectedMedium.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (selectedMedium) {
      deleteMutation.mutate(selectedMedium.id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Medium Management</h1>
          <p className="text-muted-foreground">
            Manage language mediums for courses
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Medium
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading mediums...</div>
          ) : mediums?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No mediums found. Click "Add Medium" to create one.
            </div>
          ) : (
            <SortableTable
              data={localMediums || []}
              getItemId={(m: any) => m.id}
              columns={[
                {
                  key: "name",
                  label: "Name",
                  render: (m: any) => (
                    <span className="font-medium">{m.name}</span>
                  ),
                },
                { key: "code", label: "Code", render: (m: any) => m.code },
                {
                  key: "description",
                  label: "Description",
                  render: (m: any) => m.description || "-",
                },
                {
                  key: "isActive",
                  label: "Status",
                  render: (m: any) => (
                    <Badge variant={m.isActive ? "default" : "secondary"}>
                      {m.isActive ? "Active" : "Inactive"}
                    </Badge>
                  ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (m: any) => (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(m)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMedium(m);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              onReorder={async (reordered: any[]) => {
                const previous = localMediums || [];
                // optimistic update
                setLocalMediums(reordered);
                const items = reordered.map((m: any, idx: number) => ({
                  id: m.id,
                  sortOrder: idx + 1,
                }));
                try {
                  await ApiClient.post("/admin/mediums/reorder", { items });
                } catch (err) {
                  console.error("Failed to reorder mediums", err);
                  // revert
                  setLocalMediums(previous);
                }
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMedium ? "Edit Medium" : "Create Medium"}
            </DialogTitle>
            <DialogDescription>
              {selectedMedium
                ? "Update medium information"
                : "Add a new language medium to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Medium Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter medium name (e.g., Sinhala, Tamil, English)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Medium Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="Enter medium code (e.g., SI, TA, EN)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive">Active</Label>
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
              {selectedMedium ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Medium</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedMedium?.name}"? This
              will affect all courses and institutions using this medium.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedMedium(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
