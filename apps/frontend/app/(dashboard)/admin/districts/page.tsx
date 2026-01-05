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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";

export default function DistrictsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    provinceId: "",
  });

  const { data: districts, isLoading } = useQuery({
    queryKey: ["districts"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/admin/districts");
      const resp = response?.data ?? response ?? {};
      return resp.districts || resp || [];
    },
  });
  const [sortedDistricts, setSortedDistricts] = useState<any[]>([]);
  useEffect(() => {
    if (districts) setSortedDistricts(districts);
  }, [districts]);

  const { data: provinces } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/admin/provinces");
      const resp = response?.data ?? response ?? {};
      return resp.provinces || resp || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => ApiClient.post("/admin/districts", data),
    onSuccess: () => {
      toast.success("District created successfully");
      queryClient.invalidateQueries({ queryKey: ["districts"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create district");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ApiClient.put(`/admin/districts/${id}`, data),
    onSuccess: () => {
      toast.success("District updated successfully");
      queryClient.invalidateQueries({ queryKey: ["districts"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update district");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiClient.delete(`/admin/districts/${id}`),
    onSuccess: () => {
      toast.success("District deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["districts"] });
      setDeleteDialogOpen(false);
      setSelectedDistrict(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete district");
    },
  });

  const handleOpenDialog = (district?: any) => {
    if (district) {
      setSelectedDistrict(district);
      setFormData({
        name: district.name,
        code: district.code,
        provinceId: district.provinceId,
      });
    } else {
      setSelectedDistrict(null);
      setFormData({
        name: "",
        code: "",
        provinceId: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedDistrict(null);
    setFormData({
      name: "",
      code: "",
      provinceId: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code || !formData.provinceId) {
      toast.error("Please fill in all fields");
      return;
    }

    if (selectedDistrict) {
      updateMutation.mutate({ id: selectedDistrict.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (selectedDistrict) {
      deleteMutation.mutate(selectedDistrict.id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">District Management</h1>
          <p className="text-muted-foreground">Manage districts and zones</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add District
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading districts...</div>
          ) : (
            <SortableTable
              data={sortedDistricts}
              columns={[
                {
                  key: "name",
                  label: "Name",
                  render: (d: any) => (
                    <span className="font-medium">{d.name}</span>
                  ),
                },
                { key: "code", label: "Code" },
                {
                  key: "province",
                  label: "Province",
                  render: (d: any) => d.province?.name,
                },
                {
                  key: "zones",
                  label: "Zones",
                  render: (d: any) => d._count?.zones || 0,
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (d: any) => (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(d)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDistrict(d);
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
                setSortedDistricts(items);
                const data = items.map((item, idx) => ({
                  id: item.id,
                  sortOrder: idx + 1,
                }));
                await ApiClient.post("/admin/districts/reorder", {
                  items: data,
                });
                queryClient.invalidateQueries({ queryKey: ["districts"] });
              }}
              getItemId={(d) => d.id}
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
              {selectedDistrict ? "Edit District" : "Create District"}
            </DialogTitle>
            <DialogDescription>
              {selectedDistrict
                ? "Update district information"
                : "Add a new district to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">District Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter district name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">District Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="Enter district code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <Select
                value={formData.provinceId}
                onValueChange={(value) =>
                  setFormData({ ...formData, provinceId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {provinces
                    ?.filter((province: any) => province.id)
                    .map((province: any) => (
                      <SelectItem key={province.id} value={province.id}>
                        {province.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
              {selectedDistrict ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete District</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedDistrict?.name}"? This
              will also affect all zones under this district.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedDistrict(null);
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
