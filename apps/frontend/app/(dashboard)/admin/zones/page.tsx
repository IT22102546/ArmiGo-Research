"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Building2, LayoutGrid, MapPin, GitBranch, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [formData, setFormData] = useState({ name: "", code: "", districtId: "" });
  const [search, setSearch] = useState("");

  const { data: zones, isLoading } = useQuery({
    queryKey: ["zones"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/geography/zones");
      const resp = response?.data ?? response ?? {};
      return resp.data || resp.zones || resp || [];
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
  const [sortedZones, setSortedZones] = useState<any[]>([]);
  useEffect(() => {
    if (zones) setSortedZones(zones);
  }, [zones]);

  const { data: districts } = useQuery({
    queryKey: ["districts"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/geography/districts");
      const resp = response?.data ?? response ?? {};
      return resp.data || resp.districts || resp || [];
    },
  });

  // Zone hospital counts come directly from _count.hospitals returned by the backend

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sortedZones.filter(
      (z: any) =>
        !q ||
        z.name?.toLowerCase().includes(q) ||
        z.code?.toLowerCase().includes(q) ||
        z.district?.name?.toLowerCase().includes(q)
    );
  }, [sortedZones, search]);

  const totalHospitals = useMemo(
    () => sortedZones.reduce((acc: number, z: any) => acc + (z._count?.hospitals ?? 0), 0),
    [sortedZones]
  );

  const handleOpenDialog = (zone?: any) => {
    if (zone) {
      setSelectedZone(zone);
      setFormData({ name: zone.name, code: zone.code, districtId: zone.districtId });
    } else {
      setSelectedZone(null);
      setFormData({ name: "", code: "", districtId: "" });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedZone(null);
    setFormData({ name: "", code: "", districtId: "" });
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
    if (selectedZone) deleteMutation.mutate(selectedZone.id);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => ApiClient.post("/geography/zones", data),
    onSuccess: () => {
      toast.success("Zone created successfully");
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      queryClient.invalidateQueries({ queryKey: ["districts"] });
      queryClient.invalidateQueries({ queryKey: ["provinces"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create zone");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ApiClient.put(`/geography/zones/${id}`, data),
    onSuccess: () => {
      toast.success("Zone updated successfully");
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      queryClient.invalidateQueries({ queryKey: ["districts"] });
      queryClient.invalidateQueries({ queryKey: ["provinces"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update zone");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiClient.delete(`/geography/zones/${id}`),
    onSuccess: () => {
      toast.success("Zone deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      queryClient.invalidateQueries({ queryKey: ["districts"] });
      queryClient.invalidateQueries({ queryKey: ["provinces"] });
      setDeleteDialogOpen(false);
      setSelectedZone(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete zone");
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <GitBranch className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Zones</h1>
            <p className="text-sm text-muted-foreground">Manage hospital zones and their coverage</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Add Zone
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <GitBranch className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Zones</p>
              <p className="text-2xl font-bold">{sortedZones.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/40 dark:to-violet-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <LayoutGrid className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Districts</p>
              <p className="text-2xl font-bold">
                {new Set(sortedZones.map((z: any) => z.districtId).filter(Boolean)).size}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/40 dark:to-rose-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10">
              <Building2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hospitals</p>
              <p className="text-2xl font-bold">{totalHospitals}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="text-base font-semibold">All Zones</CardTitle>
            <div className="relative sm:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code or district..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full sm:w-72"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground">
                {search ? "No zones match your search" : "No zones found"}
              </p>
              {!search && (
                <p className="text-sm text-muted-foreground mt-1">Click &apos;Add Zone&apos; to get started.</p>
              )}
            </div>
          ) : (
            <SortableTable
              data={filtered}
              columns={[
                {
                  key: "name",
                  label: "Zone",
                  render: (z: any) => (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-emerald-600">{z.name?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <span className="font-medium">{z.name}</span>
                    </div>
                  ),
                },
                {
                  key: "code",
                  label: "Code",
                  render: (z: any) => (
                    <Badge variant="secondary" className="font-mono font-semibold tracking-wider">{z.code}</Badge>
                  ),
                },
                {
                  key: "district",
                  label: "District",
                  render: (z: any) =>
                    z.district?.name ? (
                      <Badge variant="outline" className="gap-1">
                        <LayoutGrid className="w-3 h-3" />
                        {z.district.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    ),
                },
                {
                  key: "hospitals",
                  label: "Hospitals",
                  render: (z: any) => {
                    const count = z._count?.hospitals ?? 0;
                    return (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  },
                },
                {
                  key: "actions",
                  label: "",
                  render: (z: any) => (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleOpenDialog(z)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => { setSelectedZone(z); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              onReorder={async (items) => {
                setSortedZones(items);
                const data = items.map((item, idx) => ({ id: item.id, sortOrder: idx + 1 }));
                await ApiClient.post("/geography/zones/reorder", { items: data });
                queryClient.invalidateQueries({ queryKey: ["zones"] });
              }}
              getItemId={(d) => d.id}
              enableDragDrop={true}
            />
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-primary/10">
                <GitBranch className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle>{selectedZone ? "Edit Zone" : "Add Zone"}</DialogTitle>
            </div>
            <DialogDescription>
              {selectedZone ? "Update the zone details below." : "Fill in the details to add a new hospital zone."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Zone Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Colombo Zone"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code">Code <span className="text-destructive">*</span></Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. CLZ"
                  className="font-mono uppercase"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="district">District <span className="text-destructive">*</span></Label>
              <Select
                value={formData.districtId}
                onValueChange={(value) => setFormData({ ...formData, districtId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {districts?.filter((d: any) => d.id).map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : selectedZone ? "Save Changes" : "Create Zone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Zone</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">&quot;{selectedZone?.name}&quot;</span>?
              This will also affect all hospitals under this zone. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setSelectedZone(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete Zone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
