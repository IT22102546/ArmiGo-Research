"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { SortableTable } from "@/components/admin/SortableTable";
import { Badge } from "@/components/ui/badge";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function InstitutionsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "",
    address: "",
    phone: "",
    email: "",
    zoneId: "",
    isActive: true,
  });

  const { data: institutions, isLoading } = useQuery({
    queryKey: ["institutions"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/admin/institutions");
      const resp = response?.data ?? response ?? {};
      return resp.institutions || resp || [];
    },
  });
  const [sortedInstitutions, setSortedInstitutions] = useState<any[]>([]);
  useEffect(() => {
    if (institutions) setSortedInstitutions(institutions);
  }, [institutions]);

  const { data: zones } = useQuery({
    queryKey: ["zones"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/admin/zones");
      const resp = response?.data ?? response ?? {};
      return resp.zones || resp || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => ApiClient.post("/admin/institutions", data),
    onSuccess: () => {
      toast.success("Institution created successfully");
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create institution"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ApiClient.put(`/admin/institutions/${id}`, data),
    onSuccess: () => {
      toast.success("Institution updated successfully");
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update institution"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiClient.delete(`/admin/institutions/${id}`),
    onSuccess: () => {
      toast.success("Institution deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      setDeleteDialogOpen(false);
      setSelectedInstitution(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete institution"
      );
    },
  });

  const handleOpenDialog = (institution?: any) => {
    if (institution) {
      setSelectedInstitution(institution);
      setFormData({
        name: institution.name,
        code: institution.code || "",
        type: institution.type,
        address: institution.address || "",
        phone: institution.phone || "",
        email: institution.email || "",
        zoneId: institution.zoneId,
        isActive: institution.isActive,
      });
    } else {
      setSelectedInstitution(null);
      setFormData({
        name: "",
        code: "",
        type: "",
        address: "",
        phone: "",
        email: "",
        zoneId: "",
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedInstitution(null);
    setFormData({
      name: "",
      code: "",
      type: "",
      address: "",
      phone: "",
      email: "",
      zoneId: "",
      isActive: true,
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.type || !formData.zoneId) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedInstitution) {
      updateMutation.mutate({ id: selectedInstitution.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (selectedInstitution) {
      deleteMutation.mutate(selectedInstitution.id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clinics Management</h1>
          <p className="text-muted-foreground">
            Manage clinics and healthcare institutions
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading institutions...</div>
          ) : (
            <SortableTable
              data={sortedInstitutions}
              columns={[
                {
                  key: "name",
                  label: "Name",
                  render: (i: any) => (
                    <span className="font-medium">{i.name}</span>
                  ),
                },
                { key: "code", label: "Code" },
                {
                  key: "type",
                  label: "Type",
                  render: (i: any) => <Badge variant="outline">{i.type}</Badge>,
                },
                {
                  key: "zone",
                  label: "Zone",
                  render: (i: any) => i.zone?.name,
                },
                {
                  key: "status",
                  label: "Status",
                  render: (i: any) => (
                    <Badge variant={i.isActive ? "default" : "secondary"}>
                      {i.isActive ? "Active" : "Inactive"}
                    </Badge>
                  ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (i: any) => (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(i)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedInstitution(i);
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
                setSortedInstitutions(items);
                const data = items.map((item, idx) => ({
                  id: item.id,
                  sortOrder: idx + 1,
                }));
                await ApiClient.post("/admin/institutions/reorder", {
                  items: data,
                });
                queryClient.invalidateQueries({ queryKey: ["institutions"] });
              }}
              getItemId={(i) => i.id}
              enableDragDrop={true}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedInstitution ? "Edit Clinic" : "Add Clinic"}
            </DialogTitle>
            <DialogDescription>
              {selectedInstitution
                ? "Update the clinic details"
                : "Create a new clinic"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Clinic name"
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
                  placeholder="Clinic code"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">
                  Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHOOL">Clinic</SelectItem>
                    <SelectItem value="COLLEGE">Hospital OPD</SelectItem>
                    <SelectItem value="UNIVERSITY">PVT Clinic</SelectItem>
                    <SelectItem value="INSTITUTE">Rehab Centre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zoneId">
                  Zone <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.zoneId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, zoneId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones
                      ?.filter((zone: any) => zone.id)
                      .map((zone: any) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Clinic address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Email address"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="isActive">Active Status</Label>
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
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {selectedInstitution ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Institution</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedInstitution?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedInstitution(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
