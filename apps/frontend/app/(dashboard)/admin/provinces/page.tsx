"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Globe, LayoutGrid, GitBranch, MapPin, Search } from "lucide-react";
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
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";

export default function ProvincesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", code: "" });
  const [search, setSearch] = useState("");

  const { data: provinces, isLoading } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/geography/provinces");
      const resp = response?.data ?? response ?? {};
      return resp.data || resp.provinces || resp || [];
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
  const [sortedProvinces, setSortedProvinces] = useState<any[]>([]);
  useEffect(() => {
    if (provinces) setSortedProvinces(provinces);
  }, [provinces]);

  const { data: districts = [] } = useQuery({
    queryKey: ["districts"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/geography/districts");
      const resp = response?.data ?? response ?? {};
      return resp.data || resp.districts || resp || [];
    },
  });

  const districtCountByProvince = useMemo(() => {
    const map = new Map<string, number>();
    sortedProvinces.forEach((p: any) => p?.id && map.set(p.id, 0));
    (districts as any[]).forEach((d: any) => {
      if (d?.provinceId && map.has(d.provinceId))
        map.set(d.provinceId, (map.get(d.provinceId) || 0) + 1);
    });
    return map;
  }, [sortedProvinces, districts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sortedProvinces.filter(
      (p: any) => !q || p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)
    );
  }, [sortedProvinces, search]);

  const totalDistricts = (districts as any[]).length;

  const createMutation = useMutation({
    mutationFn: (data: any) => ApiClient.post("/geography/provinces", data),
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
      ApiClient.put(`/geography/provinces/${id}`, data),
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
    mutationFn: (id: string) => ApiClient.delete(`/geography/provinces/${id}`),
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
      setFormData({ name: province.name, code: province.code });
    } else {
      setSelectedProvince(null);
      setFormData({ name: "", code: "" });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedProvince(null);
    setFormData({ name: "", code: "" });
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Provinces</h1>
            <p className="text-sm text-muted-foreground">Manage provinces and administrative divisions</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Add Province
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Provinces</p>
              <p className="text-2xl font-bold">{sortedProvinces.length}</p>
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
              <p className="text-2xl font-bold">{totalDistricts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <GitBranch className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Districts</p>
              <p className="text-2xl font-bold">
                {sortedProvinces.length ? (totalDistricts / sortedProvinces.length).toFixed(1) : "0"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="text-base font-semibold">All Provinces</CardTitle>
            <div className="relative sm:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full sm:w-64"
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
                {search ? "No provinces match your search" : "No provinces found"}
              </p>
              {!search && (
                <p className="text-sm text-muted-foreground mt-1">Click &apos;Add Province&apos; to get started.</p>
              )}
            </div>
          ) : (
            <SortableTable
              data={filtered}
              columns={[
                {
                  key: "name",
                  label: "Province",
                  render: (p: any) => (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{p.name?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  ),
                },
                {
                  key: "code",
                  label: "Code",
                  render: (p: any) => (
                    <Badge variant="secondary" className="font-mono font-semibold tracking-wider">{p.code}</Badge>
                  ),
                },
                {
                  key: "districts",
                  label: "Districts",
                  render: (p: any) => {
                    const count = districtCountByProvince.get(p.id) ?? p._count?.districts ?? p.districts?.length ?? 0;
                    return (
                      <div className="flex items-center gap-1.5">
                        <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  },
                },
                {
                  key: "actions",
                  label: "",
                  render: (p: any) => (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleOpenDialog(p)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => { setSelectedProvince(p); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              onReorder={async (items) => {
                setSortedProvinces(items);
                const data = items.map((item, idx) => ({ id: item.id, sortOrder: idx + 1 }));
                await ApiClient.post("/geography/provinces/reorder", { items: data });
                queryClient.invalidateQueries({ queryKey: ["provinces"] });
              }}
              getItemId={(p) => p.id}
              emptyMessage="No provinces found."
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
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle>{selectedProvince ? "Edit Province" : "Add Province"}</DialogTitle>
            </div>
            <DialogDescription>
              {selectedProvince ? "Update the province details below." : "Fill in the details to add a new province."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Province Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Western Province"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Province Code <span className="text-destructive">*</span></Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. WP"
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground">Short identifier code (e.g. WP, CP, SP)</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : selectedProvince ? "Save Changes" : "Create Province"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Province</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">&quot;{selectedProvince?.name}&quot;</span>?
              This will also affect all districts and zones under this province. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setSelectedProvince(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete Province"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
