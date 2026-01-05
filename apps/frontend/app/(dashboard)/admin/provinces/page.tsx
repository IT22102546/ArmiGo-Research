"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SortableTable } from "@/components/admin/SortableTable";
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
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";

export default function ProvincesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
  });

  const { data: provinces, isLoading } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/admin/provinces");
      const resp = response?.data ?? response ?? {};
      return resp.provinces || resp || [];
    },
  });
  const [sortedProvinces, setSortedProvinces] = useState<any[]>([]);
  useEffect(() => {
    if (provinces) setSortedProvinces(provinces);
  }, [provinces]);

  const createMutation = useMutation({
    mutationFn: (data: any) => ApiClient.post("/admin/provinces", data),
    onSuccess: () => {
      toast.success("Province created successfully");
      queryClient.invalidateQueries({ queryKey: ["provinces"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create province");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ApiClient.put(`/admin/provinces/${id}`, data),
    onSuccess: () => {
      toast.success("Province updated successfully");
      queryClient.invalidateQueries({ queryKey: ["provinces"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update province");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiClient.delete(`/admin/provinces/${id}`),
    onSuccess: () => {
      toast.success("Province deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["provinces"] });
      setDeleteDialogOpen(false);
      setSelectedProvince(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete province");
    },
  });

  const handleOpenDialog = (province?: any) => {
    if (province) {
      setSelectedProvince(province);
      setFormData({
        name: province.name,
        code: province.code,
      });
    } else {
      setSelectedProvince(null);
      setFormData({
        name: "",
        code: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedProvince(null);
    setFormData({
      name: "",
      code: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code) {
      toast.error("Please fill in all fields");
      return;
    }

    if (selectedProvince) {
      updateMutation.mutate({ id: selectedProvince.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (selectedProvince) {
      deleteMutation.mutate(selectedProvince.id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Province Management</h1>
          <p className="text-muted-foreground">
            Manage provinces and administrative divisions
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Province
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading provinces...</div>
          ) : (
            <SortableTable
              data={sortedProvinces}
              columns={[
                {
                  key: "name",
                  label: "Name",
                  render: (p: any) => (
                    <span className="font-medium">{p.name}</span>
                  ),
                },
                { key: "code", label: "Code" },
                {
                  key: "districts",
                  label: "Districts",
                  render: (p: any) => p._count?.districts || 0,
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (p: any) => (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProvince(p);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              onReorder={async (items) => {
                setSortedProvinces(items);
                const data = items.map((item, idx) => ({
                  id: item.id,
                  sortOrder: idx + 1,
                }));
                await ApiClient.post("/admin/provinces/reorder", {
                  items: data,
                });
                queryClient.invalidateQueries({ queryKey: ["provinces"] });
              }}
              getItemId={(p) => p.id}
              emptyMessage={
                "No provinces found. Click 'Add Province' to create one."
              }
              enableDragDrop={true}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProvince ? "Edit Province" : "Create Province"}
            </DialogTitle>
            <DialogDescription>
              {selectedProvince
                ? "Update province information"
                : "Add a new province to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Province Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter province name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Province Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="Enter province code (e.g., WP, CP)"
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
              {selectedProvince ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Province</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProvince?.name}"? This
              will also affect all districts under this province.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedProvince(null);
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
