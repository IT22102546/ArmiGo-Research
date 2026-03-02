"use client";

import { useMemo, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Search, Plus, Pencil, Trash2, Eye, EyeOff, Power } from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";

type Hospital = {
  id: string;
  name: string;
};

type Physiotherapist = {
  id: string;
  name: string;
  specialization?: string | null;
  hospitalId: string;
};

type District = {
  id: string;
  name: string;
  code?: string;
  province?: {
    id: string;
    name: string;
    code?: string;
  };
};

type Zone = {
  id: string;
  name: string;
  code?: string;
  districtId?: string;
};

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  address?: string;
  dateOfBirth: string;
  age?: number;
  gender: string;
  diagnosis?: string;
  assignedDoctor?: string;
  hospitalId?: string;
  hospital?: {
    id: string;
    name: string;
  };
  district?: {
    id: string;
    name: string;
    code?: string;
  };
  zone?: {
    id: string;
    name: string;
    code?: string;
  };
  province?: {
    id: string;
    name: string;
    code?: string;
  };
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  parentCredentials?: {
    email: string;
    phone: string;
    password: string;
  };
  progressTracker?: {
    startProgress: number;
    currentProgress: number;
    playTimeMinutes: number;
    playedDays: number;
  };
  isActive: boolean;
};

type PatientForm = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  diagnosis: string;
  address: string;
  districtId: string;
  zoneId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  parentPassword: string;
  hospitalId: string;
  physiotherapistId: string;
};

const initialForm: PatientForm = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "Male",
  diagnosis: "",
  address: "",
  districtId: "",
  zoneId: "",
  parentName: "",
  parentEmail: "",
  parentPhone: "",
  parentPassword: "",
  hospitalId: "",
  physiotherapistId: "",
};

export default function StudentManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [parentCredentials, setParentCredentials] = useState<
    Patient["parentCredentials"] | null
  >(null);
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [formData, setFormData] = useState<PatientForm>(initialForm);

  const generatePassword = () => {
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const symbols = "@#$%&*!";
    const all = `${lower}${upper}${digits}${symbols}`;

    const values = [
      lower[Math.floor(Math.random() * lower.length)],
      upper[Math.floor(Math.random() * upper.length)],
      digits[Math.floor(Math.random() * digits.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];

    while (values.length < 12) {
      values.push(all[Math.floor(Math.random() * all.length)]);
    }

    return values.sort(() => Math.random() - 0.5).join("");
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ["patients-management", "patients"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/patients", {
        params: { limit: 1000 },
      });
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload || [];
      return Array.isArray(list) ? list : [];
    },
  });

  const { data: hospitals = [], isLoading: hospitalsLoading } = useQuery({
    queryKey: ["patients-management", "hospitals"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/patients/locations/hospitals");
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload || [];
      return Array.isArray(list)
        ? list.filter((item: any) => item?.id && item?.name)
        : [];
    },
  });

  const { data: physiotherapists = [], isLoading: physiotherapistsLoading } =
    useQuery({
      queryKey: ["patients-management", "physiotherapists"],
      queryFn: async () => {
        const response = await ApiClient.get<any>(
          "/patients/locations/physiotherapists"
        );
        const payload = response?.data ?? response ?? {};
        const list = payload?.data || payload || [];
        return Array.isArray(list)
          ? list.filter((item: any) => item?.id && item?.name)
          : [];
      },
    });

  const { data: districts = [], isLoading: districtsLoading } = useQuery({
    queryKey: ["patients-management", "districts"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/patients/locations/districts");
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload || [];
      return Array.isArray(list)
        ? list.filter((item: any) => item?.id && item?.name)
        : [];
    },
  });

  const { data: zones = [], isLoading: zonesLoading } = useQuery({
    queryKey: ["patients-management", "district-zones", formData.districtId],
    enabled: !!formData.districtId,
    queryFn: async () => {
      const response = await ApiClient.get<any>(
        `/patients/locations/districts/${formData.districtId}/zones`
      );
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload || [];
      return Array.isArray(list)
        ? list.filter((item: any) => item?.id && item?.name)
        : [];
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: (data: any) => ApiClient.post("/patients", data),
    onSuccess: (response: any) => {
      queryClient.setQueryData(
        ["patients-management", "patients"],
        (previous: Patient[] = []) => {
          if (!response?.id) return previous;
          const withoutDuplicate = previous.filter(
            (item) => item.id !== response.id
          );
          return [response, ...withoutDuplicate];
        }
      );
      toast.success("Child added successfully");
      queryClient.invalidateQueries({ queryKey: ["patients-management"] });
      if (response?.parentCredentials) {
        setParentCredentials(response.parentCredentials);
        setCredentialsDialogOpen(true);
      }
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add child");
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ApiClient.put(`/patients/${id}`, data),
    onSuccess: () => {
      toast.success("Child updated successfully");
      queryClient.invalidateQueries({ queryKey: ["patients-management"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update child");
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: (id: string) =>
      ApiClient.delete(`/patients/${id}`, {
        params: { mode: "permanent" },
      }),
    onSuccess: () => {
      toast.success("Child permanently deleted");
      queryClient.invalidateQueries({ queryKey: ["patients-management"] });
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete child");
    },
  });

  const updatePatientStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      ApiClient.put(`/patients/${id}/status`, { isActive }),
    onSuccess: (_response: any, variables) => {
      toast.success(
        variables.isActive
          ? "Child marked as active"
          : "Child marked as inactive"
      );
      queryClient.invalidateQueries({ queryKey: ["patients-management"] });
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update child status");
    },
  });

  const filteredPhysiotherapists = useMemo(() => {
    if (!formData.hospitalId) return [];
    return physiotherapists.filter(
      (item: Physiotherapist) => item.hospitalId === formData.hospitalId
    );
  }, [physiotherapists, formData.hospitalId]);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;

    return patients.filter((patient: Patient) =>
      [
        patient.firstName,
        patient.lastName,
        patient.parentName,
        patient.parentEmail,
        patient.parentPhone,
        patient.hospital?.name,
        patient.assignedDoctor,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [patients, search]);

  const stats = useMemo(() => {
    const total = patients.length;
    const active = patients.filter((patient: Patient) => patient.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [patients]);

  const handleOpenAddDialog = () => {
    setEditingPatient(null);
    setFormData(initialForm);
    setShowParentPassword(false);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (patient: Patient) => {
    const matchedPhysio = physiotherapists.find(
      (item: Physiotherapist) =>
        item.hospitalId === patient.hospitalId && item.name === patient.assignedDoctor
    );

    setEditingPatient(patient);
    setFormData({
      firstName: patient.firstName || "",
      lastName: patient.lastName || "",
      dateOfBirth: patient.dateOfBirth || "",
      gender: patient.gender || "Male",
      diagnosis: patient.diagnosis || "",
      address: patient.address || "",
      districtId: patient.district?.id || "",
      zoneId: patient.zone?.id || "",
      parentName: patient.parentName || "",
      parentEmail: patient.parentEmail || "",
      parentPhone: patient.parentPhone || "",
      parentPassword: "",
      hospitalId: patient.hospitalId || "",
      physiotherapistId: matchedPhysio?.id || "",
    });
    setShowParentPassword(false);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPatient(null);
    setFormData(initialForm);
    setShowParentPassword(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.dateOfBirth ||
      !formData.gender ||
      !formData.address.trim() ||
      !formData.districtId ||
      !formData.parentName.trim() ||
      !formData.parentEmail.trim() ||
      !formData.parentPhone.trim() ||
      (!editingPatient && !formData.parentPassword.trim()) ||
      !formData.hospitalId ||
      !formData.physiotherapistId
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    const selectedPhysio = physiotherapists.find(
      (item: Physiotherapist) => item.id === formData.physiotherapistId
    );

    if (!selectedPhysio) {
      toast.error("Please select a valid physiotherapist");
      return;
    }

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      diagnosis: formData.diagnosis.trim() || undefined,
      address: formData.address.trim(),
      districtId: formData.districtId,
      zoneId: formData.zoneId || undefined,
      parentName: formData.parentName.trim(),
      parentEmail: formData.parentEmail.trim(),
      parentPhone: formData.parentPhone.trim(),
      ...(formData.parentPassword.trim()
        ? { parentPassword: formData.parentPassword.trim() }
        : {}),
      hospitalId: formData.hospitalId,
      assignedDoctor: selectedPhysio.name,
    };

    if (editingPatient) {
      updatePatientMutation.mutate({ id: editingPatient.id, data: payload });
      return;
    }

    createPatientMutation.mutate(payload);
  };

  const handleDeleteConfirm = () => {
    if (!patientToDelete) return;
    deletePatientMutation.mutate(patientToDelete.id);
  };

  const handleMarkInactive = () => {
    if (!patientToDelete) return;
    updatePatientStatusMutation.mutate({
      id: patientToDelete.id,
      isActive: false,
    });
  };

  const selectedDistrict = districts.find(
    (item: District) => item.id === formData.districtId
  );

  const toProgressValue = (value?: number) => {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.min(100, parsed));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Children Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage children with parent details, hospital and physiotherapist
            assignment
          </p>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="h-4 w-4 mr-2" /> Add Child
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-rose-600">{stats.inactive}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Children List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by child, parent, hospital, physiotherapist..."
              className="pl-9"
            />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Child Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Parent Mobile</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Physiotherapist</TableHead>
                  <TableHead>Start Progress</TableHead>
                  <TableHead>Current Progress</TableHead>
                  <TableHead>Play Time</TableHead>
                  <TableHead>Played Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patientsLoading ? (
                  <TableRow>
                    <TableCell colSpan={16} className="py-8 text-center text-muted-foreground">
                      Loading children...
                    </TableCell>
                  </TableRow>
                ) : filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} className="py-8 text-center text-muted-foreground">
                      No children found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient: Patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        {patient.firstName} {patient.lastName}
                      </TableCell>
                      <TableCell>{patient.age ?? "-"}</TableCell>
                      <TableCell>{patient.parentName || "-"}</TableCell>
                      <TableCell>{patient.parentPhone || "-"}</TableCell>
                      <TableCell>{patient.hospital?.name || "-"}</TableCell>
                      <TableCell>{patient.address || "-"}</TableCell>
                      <TableCell>{patient.province?.name || "-"}</TableCell>
                      <TableCell>{patient.district?.name || "-"}</TableCell>
                      <TableCell>{patient.zone?.name || "-"}</TableCell>
                      <TableCell>{patient.assignedDoctor || "-"}</TableCell>
                      <TableCell className="min-w-[140px]">
                        <div className="space-y-1">
                          <Progress
                            value={toProgressValue(
                              patient.progressTracker?.startProgress
                            )}
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground">
                            {patient.progressTracker?.startProgress ?? 0}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[140px]">
                        <div className="space-y-1">
                          <Progress
                            value={toProgressValue(
                              patient.progressTracker?.currentProgress
                            )}
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground">
                            {patient.progressTracker?.currentProgress ?? 0}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {patient.progressTracker?.playTimeMinutes ?? 0} min
                      </TableCell>
                      <TableCell>{patient.progressTracker?.playedDays ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={patient.isActive ? "default" : "secondary"}>
                          {patient.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(patient)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              updatePatientStatusMutation.mutate({
                                id: patient.id,
                                isActive: !patient.isActive,
                              })
                            }
                            title={patient.isActive ? "Mark inactive" : "Mark active"}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setPatientToDelete(patient);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
        <DialogContent className="w-[95vw] sm:max-w-3xl h-[95dvh] max-h-[95dvh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle>{editingPatient ? "Update Child" : "Add Child"}</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain overflow-x-hidden space-y-4 px-6 pb-6 pt-4"
          >
            <div className="rounded-lg border p-4 space-y-4">
              <p className="text-sm font-medium">Child Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Child First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, firstName: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Child Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, lastName: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Birthday</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, dateOfBirth: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, gender: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Input
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, diagnosis: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Child Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, address: event.target.value }))
                  }
                  placeholder="Enter child home address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>District</Label>
                  <Select
                    value={formData.districtId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        districtId: value,
                        zoneId: "",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          districtsLoading ? "Loading districts..." : "Select district"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.length === 0 && !districtsLoading ? (
                        <SelectItem value="__NO_DISTRICTS__" disabled>
                          No districts available
                        </SelectItem>
                      ) : null}
                      {districts.map((district: District) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Province</Label>
                  <Input
                    value={selectedDistrict?.province?.name || ""}
                    placeholder="Auto from district"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label>Zone</Label>
                  <Select
                    value={formData.zoneId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, zoneId: value }))
                    }
                    disabled={!formData.districtId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !formData.districtId
                            ? "Select district first"
                            : zonesLoading
                              ? "Loading zones..."
                              : "Select zone"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.length === 0 && formData.districtId && !zonesLoading ? (
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
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-4">
              <p className="text-sm font-medium">Parent Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parentName">Parent Name</Label>
                  <Input
                    id="parentName"
                    value={formData.parentName}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, parentName: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentEmail">Parent Email</Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    value={formData.parentEmail}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, parentEmail: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentPhone">Parent Mobile Number</Label>
                <Input
                  id="parentPhone"
                  value={formData.parentPhone}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, parentPhone: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentPassword">
                  Parent Password {editingPatient ? "(Optional)" : ""}
                </Label>
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    id="parentPassword"
                    type={showParentPassword ? "text" : "password"}
                    value={formData.parentPassword}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        parentPassword: event.target.value,
                      }))
                    }
                    placeholder={
                      editingPatient
                        ? "Leave blank to keep current password"
                        : "Set parent account password"
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowParentPassword((prev) => !prev)}
                  >
                    {showParentPassword ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" /> Show
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        parentPassword: generatePassword(),
                      }));
                      setShowParentPassword(true);
                    }}
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-4">
              <p className="text-sm font-medium">Assignment</p>
              <div className="space-y-2">
                <Label>Hospital</Label>
                <Select
                  value={formData.hospitalId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      hospitalId: value,
                      physiotherapistId: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        hospitalsLoading ? "Loading hospitals..." : "Select hospital"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitals.length === 0 && !hospitalsLoading ? (
                      <SelectItem value="__NO_HOSPITALS__" disabled>
                        No hospitals available
                      </SelectItem>
                    ) : null}
                    {hospitals.map((hospital: Hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Physiotherapist</Label>
                <Select
                  value={formData.physiotherapistId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, physiotherapistId: value }))
                  }
                  disabled={!formData.hospitalId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !formData.hospitalId
                          ? "Select hospital first"
                          : physiotherapistsLoading
                            ? "Loading physiotherapists..."
                            : "Select physiotherapist"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPhysiotherapists.length === 0 && formData.hospitalId ? (
                      <SelectItem value="__NO_PHYSIO__" disabled>
                        No physiotherapists available for this hospital
                      </SelectItem>
                    ) : null}
                    {filteredPhysiotherapists.map((item: Physiotherapist) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                        {item.specialization ? ` - ${item.specialization}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t bg-background">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createPatientMutation.isPending || updatePatientMutation.isPending
                }
              >
                {editingPatient ? "Update Child" : "Add Child"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Parent Credentials</DialogTitle>
          </DialogHeader>

          {parentCredentials ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Email</Label>
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>{parentCredentials.email}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(parentCredentials.email, "Email")
                    }
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Mobile</Label>
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>{parentCredentials.phone}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(parentCredentials.phone, "Mobile")
                    }
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Password</Label>
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>{parentCredentials.password}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(parentCredentials.password, "Password")
                    }
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" onClick={() => setCredentialsDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete child</AlertDialogTitle>
            <AlertDialogDescription>
              Choose whether to mark this child inactive or permanently delete the
              child and related records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              onClick={handleMarkInactive}
              disabled={
                updatePatientStatusMutation.isPending ||
                deletePatientMutation.isPending
              }
            >
              Make Inactive
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={
                updatePatientStatusMutation.isPending ||
                deletePatientMutation.isPending
              }
            >
              Delete Permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
