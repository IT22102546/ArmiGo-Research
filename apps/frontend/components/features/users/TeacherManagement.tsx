"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, Pencil, Power, Stethoscope, Activity, Users } from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

type Zone = {
  id: string;
  name: string;
};

type Hospital = {
  id: string;
  name: string;
  status?: string;
  zoneId?: string | null;
  zone?: {
    id: string;
    name: string;
  } | null;
};

type Physiotherapist = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  specialization?: string;
  isActive: boolean;
  hospitalId: string;
  hospital?: {
    id: string;
    name: string;
    zoneId?: string | null;
    zone?: {
      id: string;
      name: string;
    } | null;
  };
};

type FormData = {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  zoneId: string;
  hospitalId: string;
};

const initialForm: FormData = {
  name: "",
  email: "",
  phone: "",
  specialization: "",
  zoneId: "",
  hospitalId: "",
};

export default function TeacherManagement() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const userRoles = Array.isArray((user as any)?.roles)
    ? ((user as any).roles as string[])
    : ([user?.role].filter(Boolean) as string[]);
  const isHospitalScopedUser =
    userRoles.includes("HOSPITAL_ADMIN") && user?.email !== "armigo@gmail.com";
  const [scopedHospital, setScopedHospital] = useState<Hospital | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Physiotherapist | null>(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState<FormData>(initialForm);

  useEffect(() => {
    if (!isHospitalScopedUser) return;

    let mounted = true;

    const loadHospitalScope = async () => {
      try {
        const response = await ApiClient.get<any>("/users/profile");
        const payload = response?.data ?? response ?? {};
        const hospital = payload?.hospitalProfile?.hospital;
        if (!mounted || !hospital?.id) return;

        setScopedHospital({
          id: hospital.id,
          name: hospital.name || "Hospital",
        });
        setFormData((prev) => ({
          ...prev,
          hospitalId: hospital.id,
        }));
      } catch {
        // Keep UI usable even if profile fetch fails.
      }
    };

    loadHospitalScope();

    return () => {
      mounted = false;
    };
  }, [isHospitalScopedUser]);

  const scopedHospitalId = scopedHospital?.id || "";

  const {
    data: zones = [],
    isLoading: zonesLoading,
    isError: zonesError,
  } = useQuery({
    queryKey: ["physio-management", "zones"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/geography/zones");
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload?.zones || payload || [];
      return Array.isArray(list)
        ? list.filter((z: any) => z?.id && z?.name)
        : [];
    },
    enabled: !isHospitalScopedUser,
  });

  const { data: hospitals = [], isLoading: hospitalsLoading } = useQuery({
    queryKey: ["physio-management", "hospitals"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/hospitals");
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload?.hospitals || payload || [];
      return Array.isArray(list)
        ? list.filter((h: any) => h?.id && h?.name)
        : [];
    },
  });

  const { data: physiotherapists = [], isLoading: physioLoading } = useQuery({
    queryKey: ["physio-management", "physiotherapists", scopedHospitalId],
    queryFn: async () => {
      const response = await ApiClient.get<any>(
        "/patients/locations/physiotherapists",
        {
          params: {
            includeInactive: true,
            ...(isHospitalScopedUser && scopedHospitalId
              ? { hospitalId: scopedHospitalId }
              : {}),
          },
        }
      );
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload || [];
      return Array.isArray(list) ? list : [];
    },
    enabled: !isHospitalScopedUser || !!scopedHospitalId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      ApiClient.post("/patients/locations/physiotherapists", data),
    onSuccess: () => {
      toast.success("Physiotherapist added successfully");
      queryClient.invalidateQueries({ queryKey: ["physio-management"] });
      queryClient.invalidateQueries({
        queryKey: ["patients-management", "physiotherapists"],
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add physiotherapist");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ApiClient.put(`/patients/locations/physiotherapists/${id}`, data),
    onSuccess: () => {
      toast.success("Physiotherapist updated successfully");
      queryClient.invalidateQueries({ queryKey: ["physio-management"] });
      queryClient.invalidateQueries({
        queryKey: ["patients-management", "physiotherapists"],
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update physiotherapist");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, mode }: { id: string; mode: "inactive" | "permanent" }) =>
      ApiClient.delete(`/patients/locations/physiotherapists/${id}`, {
        params: { mode },
      }),
    onSuccess: () => {
      toast.success("Physiotherapist permanently deleted");
      queryClient.invalidateQueries({ queryKey: ["physio-management"] });
      queryClient.invalidateQueries({
        queryKey: ["patients-management", "physiotherapists"],
      });
      setDeleteDialogOpen(false);
      setSelected(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete physiotherapist");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      ApiClient.put(`/patients/locations/physiotherapists/${id}/status`, {
        isActive,
      }),
    onSuccess: (_response: any, variables) => {
      toast.success(
        variables.isActive
          ? "Physiotherapist marked as active"
          : "Physiotherapist marked as inactive"
      );
      queryClient.invalidateQueries({ queryKey: ["physio-management"] });
      queryClient.invalidateQueries({
        queryKey: ["patients-management", "physiotherapists"],
      });
      setDeleteDialogOpen(false);
      setSelected(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update physiotherapist status");
    },
  });

  const availableHospitals = useMemo(() => {
    if (!isHospitalScopedUser) return hospitals;
    if (!scopedHospitalId) return [];
    return hospitals.filter((hospital: Hospital) => hospital.id === scopedHospitalId);
  }, [hospitals, isHospitalScopedUser, scopedHospitalId]);

  const filteredHospitals = useMemo(() => {
    if (isHospitalScopedUser) return availableHospitals;
    if (!formData.zoneId) return [];
    return availableHospitals.filter((hospital: Hospital) => {
      const hospitalZoneId = hospital.zoneId || hospital.zone?.id;
      const isActiveHospital = hospital.status === "ACTIVE";
      const isCurrentSelection = hospital.id === formData.hospitalId;
      return hospitalZoneId === formData.zoneId && (isActiveHospital || isCurrentSelection);
    });
  }, [availableHospitals, formData.zoneId, formData.hospitalId, isHospitalScopedUser]);

  const filteredPhysiotherapists = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return physiotherapists;

    return physiotherapists.filter((item: Physiotherapist) =>
      [
        item.name,
        item.email,
        item.phone,
        item.specialization,
        item.hospital?.name,
        item.hospital?.zone?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [physiotherapists, search]);

  const physioStats = useMemo(() => {
    const total = physiotherapists.length;
    const active = physiotherapists.filter((p: Physiotherapist) => p.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [physiotherapists]);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelected(null);
    setFormData({
      ...initialForm,
      hospitalId: isHospitalScopedUser ? scopedHospitalId : "",
    });
  };

  const handleOpenAdd = () => {
    setSelected(null);
    setFormData({
      ...initialForm,
      hospitalId: isHospitalScopedUser ? scopedHospitalId : "",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: Physiotherapist) => {
    setSelected(item);
    const zoneId = item.hospital?.zone?.id || item.hospital?.zoneId || "";
    setFormData({
      name: item.name || "",
      email: item.email || "",
      phone: item.phone || "",
      specialization: item.specialization || "",
      zoneId,
      hospitalId: item.hospitalId || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.hospitalId ||
      (!isHospitalScopedUser && !formData.zoneId)
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    const resolvedHospitalId = isHospitalScopedUser
      ? scopedHospitalId || formData.hospitalId
      : formData.hospitalId;

    if (!resolvedHospitalId) {
      toast.error("Hospital is required");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim(),
      hospitalId: resolvedHospitalId,
      specialization: formData.specialization.trim() || undefined,
    };

    if (selected) {
      updateMutation.mutate({ id: selected.id, data: payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const handleMarkInactive = () => {
    if (!selected) return;
    updateStatusMutation.mutate({ id: selected.id, isActive: false });
  };

  const handleDeletePermanent = () => {
    if (!selected) return;
    deleteMutation.mutate({ id: selected.id, mode: "permanent" });
  };

  const tableColumnCount = isHospitalScopedUser ? 6 : 7;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Hospital Workforce</p>
            <h1 className="text-2xl font-semibold">Physiotherapy Management</h1>
          </div>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4 mr-2" /> Add Physiotherapist
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/40 dark:to-violet-900/20">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40">
                <Stethoscope className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Physiotherapists</p>
                <p className="text-2xl font-bold">{physioStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active</p>
                <p className="text-2xl font-bold text-emerald-600">{physioStats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/40 dark:to-rose-900/20">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40">
                <Users className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Inactive</p>
                <p className="text-2xl font-bold text-rose-600">{physioStats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Physiotherapists</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, hospital, phone..."
              className="pl-9"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Physiotherapist Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hospital</TableHead>
                  {!isHospitalScopedUser ? <TableHead>Zone</TableHead> : null}
                  <TableHead>Contact Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {physioLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={tableColumnCount}>
                        <div className="h-10 rounded-lg bg-muted animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredPhysiotherapists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableColumnCount}>
                      <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="p-3 rounded-full bg-muted">
                          <Stethoscope className="h-6 w-6" />
                        </div>
                        <p className="font-medium">No physiotherapists found</p>
                        <p className="text-xs">Add a physiotherapist or adjust your search</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPhysiotherapists.map((item: Physiotherapist) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? "default" : "secondary"}>
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.hospital?.name || "-"}</TableCell>
                      {!isHospitalScopedUser ? <TableCell>{item.hospital?.zone?.name || "-"}</TableCell> : null}
                      <TableCell>{item.phone || "-"}</TableCell>
                      <TableCell>{item.email || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 hover:bg-amber-500/10 hover:text-amber-600"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: item.id,
                                isActive: !item.isActive,
                              })
                            }
                            title={item.isActive ? "Mark inactive" : "Mark active"}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              setSelected(item);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl h-[90dvh] max-h-[90dvh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle>
              {selected ? "Update Physiotherapist" : "Add Physiotherapist"}
            </DialogTitle>
          </DialogHeader>

          <form
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 px-6 pb-6 pt-4"
            onSubmit={handleSubmit}
          >
            <div className="space-y-2">
              <Label htmlFor="physio-name">Physiotherapist Name</Label>
              <Input
                id="physio-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="physio-email">Email</Label>
              <Input
                id="physio-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Enter email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="physio-contact">Contact Number</Label>
              <Input
                id="physio-contact"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="Enter contact number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="physio-specialization">Specialization</Label>
              <Input
                id="physio-specialization"
                value={formData.specialization}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    specialization: e.target.value,
                  }))
                }
                placeholder="Optional"
              />
            </div>

            {!isHospitalScopedUser ? (
              <div className="space-y-2">
                <Label>Zone</Label>
                <Select
                  value={formData.zoneId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      zoneId: value,
                      hospitalId: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        zonesLoading
                          ? "Loading zones..."
                          : zonesError
                            ? "Failed to load zones"
                            : "Select zone"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {!zonesLoading && zones.length === 0 ? (
                      <SelectItem value="__NO_ZONES__" disabled>
                        No zones available
                      </SelectItem>
                    ) : null}
                    {zones.map((zone: Zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Hospital</Label>
              <Select
                value={formData.hospitalId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, hospitalId: value }))
                }
                disabled={isHospitalScopedUser || (!isHospitalScopedUser && !formData.zoneId)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isHospitalScopedUser
                        ? scopedHospital?.name || "Loading hospital..."
                        : !formData.zoneId
                          ? "Select zone first"
                          : hospitalsLoading
                            ? "Loading hospitals..."
                            : "Select hospital"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredHospitals.length === 0 && (isHospitalScopedUser || formData.zoneId) ? (
                    <SelectItem value="__NO_HOSPITALS__" disabled>
                      {isHospitalScopedUser
                        ? "No hospital available"
                        : "No hospitals available in this zone"}
                    </SelectItem>
                  ) : null}
                  {filteredHospitals.map((hospital: Hospital) => (
                    <SelectItem key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3 border-t bg-background">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {selected ? "Update Physiotherapist" : "Add Physiotherapist"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete physiotherapist</AlertDialogTitle>
            <AlertDialogDescription>
              Choose whether to mark this physiotherapist inactive or permanently
              delete the physiotherapist and related appointments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              onClick={handleMarkInactive}
              disabled={updateStatusMutation.isPending || deleteMutation.isPending}
            >
              Make Inactive
            </Button>
            <Button
              type="button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeletePermanent}
              disabled={updateStatusMutation.isPending || deleteMutation.isPending}
            >
              Delete Permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
