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

export default function ZonesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    districtId: "",
  });

  const { data: zones, isLoading } = useQuery({
    queryKey: ["zones"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/admin/zones");
      const resp = response?.data ?? response ?? {};
      return resp.zones || resp || [];
    },
  });
  const [sortedZones, setSortedZones] = useState<any[]>([]);
  useEffect(() => {
    if (zones) setSortedZones(zones);
  }, [zones]);

  const { data: districts } = useQuery({
    queryKey: ["districts"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/admin/districts");
      const resp = response?.data ?? response ?? {};
      return resp.districts || resp || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => ApiClient.post("/admin/zones", data),
    onSuccess: () => {
      toast.success("Zone created successfully");
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create zone");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ApiClient.put(`/admin/zones/${id}`, data),
    onSuccess: () => {
      toast.success("Zone updated successfully");
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update zone");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiClient.delete(`/admin/zones/${id}`),
    onSuccess: () => {
      toast.success("Zone deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      setDeleteDialogOpen(false);
      setSelectedZone(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete zone");
    },
  });

  const handleOpenDialog = (zone?: any) => {
    if (zone) {
      setSelectedZone(zone);
      setFormData({
        name: zone.name,
        code: zone.code,
        districtId: zone.districtId,
      });
    } else {
      setSelectedZone(null);
      setFormData({
        name: "",
        code: "",
        districtId: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedZone(null);
    setFormData({
      name: "",
      code: "",
      districtId: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code || !formData.districtId) {
      toast.error("Please fill in all fields");
      return;
    }

    if (selectedZone) {
      updateMutation.mutate({ id: selectedZone.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (selectedZone) {
      deleteMutation.mutate(selectedZone.id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Zone Management</h1>
          <p className="text-muted-foreground">Manage educational zones</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Zone
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading zones...</div>
          ) : (
            <SortableTable
              data={sortedZones}
              columns={[
                {
                  key: "name",
                  label: "Name",
                  render: (z: any) => (
                    <span className="font-medium">{z.name}</span>
                  ),
                },
                { key: "code", label: "Code" },
                {
                  key: "district",
                  label: "District",
                  render: (z: any) => z.district?.name,
                },
                {
                  key: "institutions",
                  label: "Institutions",
                  render: (z: any) => z._count?.institutions || 0,
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (z: any) => (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(z)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedZone(z);
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
                setSortedZones(items);
                const data = items.map((item, idx) => ({
                  id: item.id,
                  sortOrder: idx + 1,
                }));
                await ApiClient.post("/admin/zones/reorder", { items: data });
                queryClient.invalidateQueries({ queryKey: ["zones"] });
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
              {selectedZone ? "Edit Zone" : "Create Zone"}
            </DialogTitle>
            <DialogDescription>
              {selectedZone
                ? "Update zone information"
                : "Add a new educational zone to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Zone Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter zone name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Zone Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="Enter zone code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Select
                value={formData.districtId}
                onValueChange={(value) =>
                  setFormData({ ...formData, districtId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {districts
                    ?.filter((district: any) => district.id)
                    .map((district: any) => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name}
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
              {selectedZone ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Zone</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedZone?.name}"? This will
              also affect all institutions under this zone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedZone(null);
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
