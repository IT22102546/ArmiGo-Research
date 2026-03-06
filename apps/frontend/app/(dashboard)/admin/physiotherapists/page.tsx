"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, Stethoscope, Search, RefreshCw,
  BadgeCheck, Activity, XCircle, Phone, Mail, Building2, Power,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { patientApi, Physiotherapist, Hospital } from "@/lib/api/endpoints/patients";

const AVAILABILITY_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  AVAILABLE:     { label: "Available",    icon: BadgeCheck, className: "text-emerald-700 border-emerald-200 bg-emerald-50" },
  IN_WORK:       { label: "In Session",   icon: Activity,   className: "text-orange-700 border-orange-200 bg-orange-50" },
  NOT_AVAILABLE: { label: "Unavailable",  icon: XCircle,    className: "text-red-700 border-red-200 bg-red-50" },
};

interface FormState {
  name: string;
  phone: string;
  email: string;
  hospitalId: string;
  specialization: string;
}

const EMPTY_FORM: FormState = { name: "", phone: "", email: "", hospitalId: "", specialization: "" };

export default function PhysiotherapistsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Physiotherapist | null>(null);

  const { data: physios = [], isFetching, refetch } = useQuery<Physiotherapist[]>({
    queryKey: ["physiotherapists", showInactive],
    queryFn: async () => {
      const res = await patientApi.getPhysiotherapists(undefined, showInactive);
      return Array.isArray(res) ? res : (res as any)?.data ?? [];
    },
  });

  const { data: hospitals = [] } = useQuery<Hospital[]>({
    queryKey: ["hospitals-list"],
    queryFn: async () => {
      const res = await patientApi.getHospitals();
      return Array.isArray(res) ? res : (res as any)?.data ?? [];
    },
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["physiotherapists"] });
  }, [qc]);

  const createMutation = useMutation({
    mutationFn: (data: FormState) => patientApi.createPhysiotherapist(data),
    onSuccess: () => { toast.success("Physiotherapist created"); setDialogOpen(false); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormState> }) =>
      patientApi.updatePhysiotherapist(id, data),
    onSuccess: () => { toast.success("Physiotherapist updated"); setDialogOpen(false); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      patientApi.setPhysiotherapistStatus(id, isActive),
    onSuccess: (_, { isActive }) => {
      toast.success(`Physiotherapist marked ${isActive ? "active" : "inactive"}`);
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientApi.deletePhysiotherapist(id, "permanent"),
    onSuccess: () => { toast.success("Physiotherapist deleted"); setDeleteTarget(null); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to delete"),
  });

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setDialogOpen(true); };
  const openEdit = (p: Physiotherapist) => {
    setForm({ name: p.name, phone: p.phone, email: p.email ?? "", hospitalId: p.hospitalId, specialization: p.specialization ?? "" });
    setEditId(p.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.hospitalId) {
      toast.error("Name, phone and hospital are required");
      return;
    }
    if (editId) {
      updateMutation.mutate({ id: editId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = physios.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.specialization ?? "").toLowerCase().includes(q) ||
      (p.hospital?.name ?? "").toLowerCase().includes(q)
    );
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-purple-600" />
            Physiotherapists
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage physiotherapy staff and availability
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Physiotherapist
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, specialization or hospital..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Switch checked={showInactive} onCheckedChange={setShowInactive} id="show-inactive" />
              <Label htmlFor="show-inactive">Show inactive</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(Object.entries({
          All: physios.length,
          Available: physios.filter((p) => (p.availabilityStatus ?? "AVAILABLE") === "AVAILABLE").length,
          "In Session": physios.filter((p) => p.availabilityStatus === "IN_WORK").length,
          Inactive: physios.filter((p) => !p.isActive).length,
        })).map(([label, count]) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filtered.length} physiotherapist{filtered.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Stethoscope className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No physiotherapists found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Specialization</th>
                    <th className="text-left py-3 px-4 font-medium">Hospital</th>
                    <th className="text-left py-3 px-4 font-medium">Contact</th>
                    <th className="text-left py-3 px-4 font-medium">Availability</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const avail = AVAILABILITY_CONFIG[p.availabilityStatus ?? "AVAILABLE"] ?? AVAILABILITY_CONFIG["AVAILABLE"];
                    const AvailIcon = avail.icon;
                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{p.role.toLowerCase()}</div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {p.specialization ?? "—"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate max-w-[140px]">{p.hospital?.name ?? "—"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />{p.phone}
                            </div>
                            {p.email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />{p.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={`text-xs ${avail.className}`}>
                            <AvailIcon className="h-3 w-3 mr-1" />
                            {avail.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={p.isActive ? "default" : "secondary"} className="text-xs">
                            {p.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost" size="icon"
                              title={p.isActive ? "Deactivate" : "Activate"}
                              onClick={() => toggleStatusMutation.mutate({ id: p.id, isActive: !p.isActive })}
                            >
                              <Power className={`h-4 w-4 ${p.isActive ? "text-emerald-600" : "text-muted-foreground"}`} />
                            </Button>
                            <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(p)}>
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeleteTarget(p)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Physiotherapist" : "Add Physiotherapist"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Full Name *</Label>
                <Input placeholder="Dr. Jane Smith" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input placeholder="+66 ..." value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="jane@hospital.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Specialization</Label>
                <Input placeholder="Pediatric Physiotherapy" value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Hospital *</Label>
                <Select value={form.hospitalId} onValueChange={(v) => setForm((f) => ({ ...f, hospitalId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitals.map((h) => (
                      <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isMutating}>
              {isMutating ? "Saving..." : editId ? "Save Changes" : "Add Physiotherapist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Physiotherapist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong> and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
