"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, LayoutGrid, Globe, MapPin, GitBranch, Search } from "lucide-react";
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

export default function DistrictsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", code: "", provinceId: "" });
  const [search, setSearch] = useState("");

  const { data: districts, isLoading } = useQuery({
    queryKey: ["districts"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/geography/districts");
      const resp = response?.data ?? response ?? {};
      return resp.data || resp.districts || resp || [];
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
  const [sortedDistricts, setSortedDistricts] = useState<any[]>([]);
  useEffect(() => {
    if (districts) setSortedDistricts(districts);
  }, [districts]);

  const { data: provinces } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/geography/provinces");
      const resp = response?.data ?? response ?? {};
      return resp.data || resp.provinces || resp || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => ApiClient.post("/geography/districts", data),
    onSuccess: () => {
      toast.success("District created successfully");
      queryClient.invalidateQueries({ queryKey: ["districts"] });
      queryClient.invalidateQueries({ queryKey: ["provinces"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create district");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ApiClient.put(`/geography/districts/${id}`, data),
    onSuccess: () => {
      toast.success("District updated successfully");
      queryClient.invalidateQueries({ queryKey: ["districts"] });
      queryClient.invalidateQueries({ queryKey: ["provinces"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update district");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiClient.delete(`/geography/districts/${id}`),
    onSuccess: () => {
      toast.success("District deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["districts"] });
      queryClient.invalidateQueries({ queryKey: ["provinces"] });
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
      setFormData({ name: district.name, code: district.code, provinceId: district.provinceId });
    } else {
      setSelectedDistrict(null);
      setFormData({ name: "", code: "", provinceId: "" });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedDistrict(null);
    setFormData({ name: "", code: "", provinceId: "" });
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
    if (selectedDistrict) deleteMutation.mutate(selectedDistrict.id);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sortedDistricts.filter(
      (d: any) =>
        !q ||
        d.name?.toLowerCase().includes(q) ||
        d.code?.toLowerCase().includes(q) ||
        d.province?.name?.toLowerCase().includes(q)
    );
  }, [sortedDistricts, search]);

  const uniqueProvinces = useMemo(() => {
    const ids = new Set<string>();
    sortedDistricts.forEach((d: any) => d.province?.id && ids.add(d.province.id));
    return ids.size;
  }, [sortedDistricts]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <LayoutGrid className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Districts</h1>
            <p className="text-sm text-muted-foreground">Manage districts and their zones</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Add District
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/40 dark:to-violet-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <LayoutGrid className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Districts</p>
              <p className="text-2xl font-bold">{sortedDistricts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Provinces</p>
              <p className="text-2xl font-bold">{uniqueProvinces}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <GitBranch className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Zones</p>
              <p className="text-2xl font-bold">
                {sortedDistricts.reduce((acc: number, d: any) => acc + (d._count?.zones ?? d.zones?.length ?? 0), 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="text-base font-semibold">All Districts</CardTitle>
            <div className="relative sm:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code or province..."
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
                {search ? "No districts match your search" : "No districts found"}
              </p>
              {!search && (
                <p className="text-sm text-muted-foreground mt-1">Click &apos;Add District&apos; to get started.</p>
              )}
            </div>
          ) : (
            <SortableTable
              data={filtered}
              columns={[
                {
                  key: "name",
                  label: "District",
                  render: (d: any) => (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-violet-600">{d.name?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <span className="font-medium">{d.name}</span>
                    </div>
                  ),
                },
                {
                  key: "code",
                  label: "Code",
                  render: (d: any) => (
                    <Badge variant="secondary" className="font-mono font-semibold tracking-wider">{d.code}</Badge>
                  ),
                },
                {
                  key: "province",
                  label: "Province",
                  render: (d: any) =>
                    d.province?.name ? (
                      <Badge variant="outline" className="gap-1">
                        <Globe className="w-3 h-3" />
                        {d.province.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    ),
                },
                {
                  key: "zones",
                  label: "Zones",
                  render: (d: any) => {
                    const count = d._count?.zones ?? d.zones?.length ?? 0;
                    return (
                      <div className="flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  },
                },
                {
                  key: "actions",
                  label: "",
                  render: (d: any) => (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleOpenDialog(d)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => { setSelectedDistrict(d); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              onReorder={async (items) => {
                setSortedDistricts(items);
                const data = items.map((item, idx) => ({ id: item.id, sortOrder: idx + 1 }));
                await ApiClient.post("/geography/districts/reorder", { items: data });
                queryClient.invalidateQueries({ queryKey: ["districts"] });
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
                <LayoutGrid className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle>{selectedDistrict ? "Edit District" : "Add District"}</DialogTitle>
            </div>
            <DialogDescription>
              {selectedDistrict ? "Update the district details below." : "Fill in the details to add a new district."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">District Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Colombo"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code">Code <span className="text-destructive">*</span></Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. COL"
                  className="font-mono uppercase"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="province">Province <span className="text-destructive">*</span></Label>
              <Select
                value={formData.provinceId}
                onValueChange={(value) => setFormData({ ...formData, provinceId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {provinces?.filter((p: any) => p.id).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
                : selectedDistrict ? "Save Changes" : "Create District"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete District</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">&quot;{selectedDistrict?.name}&quot;</span>?
              This will also affect all zones under this district. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setSelectedDistrict(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete District"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
