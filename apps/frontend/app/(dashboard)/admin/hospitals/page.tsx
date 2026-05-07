"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff, Copy, Power, Building2, Search, Activity, BedDouble, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const HOSPITAL_TYPES = [
  { value: "GOVERNMENT", label: "Government" },
  { value: "PRIVATE", label: "Private" },
  { value: "SPECIALIZED_CHILDREN", label: "Specialized Children's" },
  { value: "REHABILITATION_CENTER", label: "Rehabilitation Center" },
  { value: "CLINIC", label: "Clinic" },
];

const NO_ZONE_VALUE = "__NO_ZONE__";

export default function HospitalsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    registrationNo: "",
    type: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    provinceId: "",
    districtId: "",
    zoneId: "",
    bedCapacity: "",
    totalStaff: "",
    isMainHospital: false,
    adminPassword: "",
  });

  // Query for provinces
  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/geography/provinces");
      const resp = response?.data ?? response ?? {};
      return resp.data || resp || [];
    },
  });

  // Query for districts based on selected province
  const { data: districts = [] } = useQuery({
    queryKey: ["districts", formData.provinceId],
    queryFn: async () => {
      if (!formData.provinceId) return [];
      const response = await ApiClient.get<any>(
        `/geography/provinces/${formData.provinceId}/districts`
      );
      const resp = response?.data ?? response ?? {};
      return resp.data || resp || [];
    },
    enabled: !!formData.provinceId,
  });

  // Query for zones based on selected district
  const { data: zones = [] } = useQuery({
    queryKey: ["zones", formData.districtId],
    queryFn: async () => {
      if (!formData.districtId) return [];
      const response = await ApiClient.get<any>(
        `/geography/districts/${formData.districtId}/zones`
      );
      const resp = response?.data ?? response ?? {};
      return resp.data || resp || [];
    },
    enabled: !!formData.districtId,
  });

  // Query for hospitals
  const { data: hospitals, isLoading, isFetching } = useQuery({
    queryKey: ["hospitals"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/hospitals");
      const resp = response?.data ?? response ?? {};
      return resp.data || resp || [];
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const [search, setSearch] = useState("");
  const [sortedHospitals, setSortedHospitals] = useState<any[]>([]);
  useEffect(() => {
    if (hospitals && hospitals.length > 0) setSortedHospitals(hospitals);
  }, [hospitals]);

  const hospitalStats = useMemo(() => {
    const list = sortedHospitals;
    const total = list.length;
    const active = list.filter((h: any) => h.status === "ACTIVE").length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [sortedHospitals]);

  const filteredHospitals = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sortedHospitals;
    return sortedHospitals.filter((h: any) =>
      [h.name, h.registrationNo, h.type, h.phone, h.email, h.district?.name, h.zone?.name, h.city]
        .filter(Boolean).join(" ").toLowerCase().includes(term)
    );
  }, [sortedHospitals, search]);

  const createMutation = useMutation({
    mutationFn: (data: any) => ApiClient.post("/hospitals", data),
    onSuccess: (response: any) => {
      toast.success("Hospital created successfully");
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      if (response?.adminPassword) {
        setSelectedHospital(response);
        handleCloseDialog();
        setCredentialsDialogOpen(true);
      } else {
        handleCloseDialog();
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create hospital"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ApiClient.put(`/hospitals/${id}`, data),
    onSuccess: () => {
      toast.success("Hospital updated successfully");
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update hospital"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiClient.delete(`/hospitals/${id}`),
    onSuccess: () => {
      toast.success("Hospital deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete hospital"
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" }) =>
      ApiClient.put(`/hospitals/${id}`, { status }),
    onSuccess: (_response: any, variables) => {
      toast.success(
        variables.status === "ACTIVE"
          ? "Hospital marked as active"
          : "Hospital marked as inactive"
      );
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update hospital status"
      );
    },
  });

  const handleOpenDialog = (hospital?: any) => {
    if (hospital) {
      setSelectedHospital(hospital);
      setFormData({
        name: hospital.name || "",
        registrationNo: hospital.registrationNo || "",
        type: hospital.type || "",
        email: hospital.email || "",
        phone: hospital.phone || "",
        address: hospital.address || "",
        city: hospital.city || "",
        provinceId: hospital.district?.provinceId || "",
        districtId: hospital.districtId || "",
        zoneId: hospital.zoneId || "",
        bedCapacity: hospital.bedCapacity?.toString() || "",
        totalStaff: hospital.totalStaff?.toString() || "",
        isMainHospital: hospital.isMainHospital === true,
        adminPassword: "",
      });
    } else {
      setSelectedHospital(null);
      setFormData({
        name: "",
        registrationNo: "",
        type: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        provinceId: "",
        districtId: "",
        zoneId: "",
        bedCapacity: "",
        totalStaff: "",
        isMainHospital: false,
        adminPassword: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedHospital(null);
    setFormData({
      name: "",
      registrationNo: "",
      type: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      provinceId: "",
      districtId: "",
      zoneId: "",
      bedCapacity: "",
      totalStaff: "",
      isMainHospital: false,
      adminPassword: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.registrationNo ||
      !formData.type ||
      !formData.email ||
      !formData.phone ||
      !formData.districtId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedHospital) {
      updateMutation.mutate({
        id: selectedHospital.id,
        data: {
          name: formData.name,
          registrationNo: formData.registrationNo,
          type: formData.type,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          districtId: formData.districtId,
          zoneId: formData.zoneId || null,
          bedCapacity: parseInt(formData.bedCapacity) || 0,
          totalStaff: parseInt(formData.totalStaff) || 0,
          isMainHospital: formData.isMainHospital,
          ...(formData.adminPassword
            ? { adminPassword: formData.adminPassword }
            : {}),
        },
      });
    } else {
      if (!formData.adminPassword) {
        toast.error("Please set a password for the hospital admin");
        return;
      }

      createMutation.mutate({
        name: formData.name,
        registrationNo: formData.registrationNo,
        type: formData.type,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        districtId: formData.districtId,
        zoneId: formData.zoneId || null,
        bedCapacity: parseInt(formData.bedCapacity) || 0,
        totalStaff: parseInt(formData.totalStaff) || 0,
        isMainHospital: formData.isMainHospital,
        adminPassword: formData.adminPassword,
      });
    }
  };

  const handleDeleteClick = (hospital: any) => {
    setSelectedHospital(hospital);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedHospital) {
      deleteMutation.mutate(selectedHospital.id);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${field} copied to clipboard`);
  };

  const tableColumns = [
    {
      key: "name",
      label: "Hospital Name",
      render: (h: any) => <span className="font-medium">{h.name}</span>,
    },
    { key: "registrationNo", label: "Registration No" },
    {
      key: "type",
      label: "Type",
      render: (h: any) => (
        <Badge
          variant={
            h.type === "GOVERNMENT"
              ? "default"
              : h.type === "PRIVATE"
                ? "secondary"
                : "outline"
          }
        >
          {HOSPITAL_TYPES.find((t) => t.value === h.type)?.label || h.type}
        </Badge>
      ),
    },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    {
      key: "district",
      label: "District",
      render: (h: any) => h.district?.name || "-",
    },
    {
      key: "zone",
      label: "Zone",
      render: (h: any) => h.zone?.name || "-",
    },
    {
      key: "bedCapacity",
      label: "Beds",
      render: (h: any) => h.bedCapacity || "-",
    },
    {
      key: "totalStaff",
      label: "Staff",
      render: (h: any) => h.totalStaff || "-",
    },
    {
      key: "mainHospital",
      label: "Main Hospital",
      render: (h: any) =>
        h.isMainHospital ? <Badge>Yes</Badge> : <Badge variant="outline">No</Badge>,
    },
    {
      key: "status",
      label: "Status",
      render: (h: any) => (
        <Badge variant={h.status === "ACTIVE" ? "default" : "secondary"}>
          {h.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (h: any) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            onClick={() => handleOpenDialog(h)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 hover:bg-amber-500/10 hover:text-amber-600"
            onClick={() =>
              statusMutation.mutate({
                id: h.id,
                status: h.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
              })
            }
            title={h.status === "ACTIVE" ? "Mark inactive" : "Mark active"}
            disabled={statusMutation.isPending}
          >
            <Power className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => handleDeleteClick(h)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Hospital Management</h1>
            <p className="text-sm text-muted-foreground">Manage hospitals and their details</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Hospital
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Hospitals</p>
                <p className="text-2xl font-bold">{hospitalStats.total}</p>
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
                <p className="text-2xl font-bold text-emerald-600">{hospitalStats.active}</p>
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
                <p className="text-2xl font-bold text-rose-600">{hospitalStats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5 space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hospitals..."
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pl-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          {isLoading || (isFetching && sortedHospitals.length === 0) ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredHospitals.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
              <div className="p-3 rounded-full bg-muted">
                <Building2 className="h-6 w-6" />
              </div>
              <p className="font-medium">No hospitals found</p>
              <p className="text-xs">{search ? "Try a different search term" : "Add your first hospital to get started"}</p>
            </div>
          ) : (
            <SortableTable
              columns={tableColumns}
              data={filteredHospitals}
              onReorder={setSortedHospitals}
              getItemId={(h: any) => h.id}
            />
          )}
        </CardContent>
      </Card>

      {/* Hospital Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              {selectedHospital ? "Edit Hospital" : "Create New Hospital"}
            </DialogTitle>
            <DialogDescription>
              {selectedHospital
                ? "Update hospital information"
                : "Add a new hospital to the system"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className="font-semibold">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Hospital Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter hospital name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="registrationNo">Registration No *</Label>
                  <Input
                    id="registrationNo"
                    value={formData.registrationNo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationNo: e.target.value,
                      })
                    }
                    placeholder="Enter registration number"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Hospital Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hospital type" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOSPITAL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="email">Hospital Login Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="hospital@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="font-semibold">Contact Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Enter city"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Enter full address"
                  />
                </div>
              </div>
            </div>

            {/* Geographic Location */}
            <div className="space-y-3">
              <h3 className="font-semibold">Geographic Location</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="province">Province</Label>
                  <Select
                    value={formData.provinceId}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        provinceId: value,
                        districtId: "",
                        zoneId: "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces
                        .filter(
                          (province: any) =>
                            province?.id && String(province.id).trim() !== ""
                        )
                        .map((province: any) => (
                        <SelectItem key={province.id} value={province.id}>
                          {province.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="district">District *</Label>
                  <Select
                    value={formData.districtId}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        districtId: value,
                        zoneId: "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts
                        .filter(
                          (district: any) =>
                            district?.id && String(district.id).trim() !== ""
                        )
                        .map((district: any) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="zone">Zone</Label>
                  <Select
                    value={formData.zoneId || NO_ZONE_VALUE}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        zoneId: value === NO_ZONE_VALUE ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_ZONE_VALUE}>None</SelectItem>
                      {zones
                        .filter(
                          (zone: any) =>
                            zone?.id && String(zone.id).trim() !== ""
                        )
                        .map((zone: any) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Capacity Information */}
            <div className="space-y-3">
              <h3 className="font-semibold">Capacity</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedCapacity">Bed Capacity</Label>
                  <Input
                    id="bedCapacity"
                    type="number"
                    value={formData.bedCapacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bedCapacity: e.target.value,
                      })
                    }
                    placeholder="Number of beds"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="totalStaff">Total Staff</Label>
                  <Input
                    id="totalStaff"
                    type="number"
                    value={formData.totalStaff}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalStaff: e.target.value,
                      })
                    }
                    placeholder="Number of staff"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Main Hospital</h3>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Set as Main Hospital</p>
                  <p className="text-xs text-muted-foreground">
                    Only one main hospital can exist at a time. Enabling this will unset the previous main hospital.
                  </p>
                </div>
                <Switch
                  checked={formData.isMainHospital}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isMainHospital: checked })
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Admin Credentials</h3>

              <div>
                <Label htmlFor="adminPassword">
                  Admin Password (for hospital admin account){selectedHospital ? "" : " *"}
                </Label>
                <div className="relative">
                  <Input
                    id="adminPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.adminPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        adminPassword: e.target.value,
                      })
                    }
                    placeholder={
                      selectedHospital
                        ? "Leave blank to keep current password"
                        : "Set a strong password"
                    }
                    required={!selectedHospital}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedHospital
                    ? "Set a new password only if you want to change it"
                    : "This exact email will be used for hospital admin sign-in"}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {selectedHospital ? "Update Hospital" : "Create Hospital"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      {selectedHospital && (
        <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hospital Admin Credentials</DialogTitle>
              <DialogDescription>
                Save these credentials securely. They will not be shown again.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div>
                  <Label className="text-sm font-semibold">Hospital Admin Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={selectedHospital.adminEmail || ""}
                      readOnly
                      className="bg-white"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        copyToClipboard(
                          selectedHospital.adminEmail || "",
                          "Email"
                        )
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Admin Password</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="password"
                      value={selectedHospital.adminPassword || ""}
                      readOnly
                      className="bg-white"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        copyToClipboard(
                          selectedHospital.adminPassword || "",
                          "Password"
                        )
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
                  ⚠️ Share these credentials securely with the hospital admin. Store them in a safe location.
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setCredentialsDialogOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedHospital?.name}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!selectedHospital?.id) return;
                statusMutation.mutate({
                  id: selectedHospital.id,
                  status: "INACTIVE",
                });
                setDeleteDialogOpen(false);
              }}
              disabled={statusMutation.isPending || deleteMutation.isPending}
            >
              Make Inactive
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={statusMutation.isPending || deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
