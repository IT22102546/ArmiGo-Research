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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Pencil, Trash2, Eye, EyeOff, Power, Users, Activity, Hand, CircleDot, Copy, UserPlus, UserCheck } from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

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
  displayId?: string;
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
  exerciseFingers?: boolean;
  exerciseWrist?: boolean;
  exerciseElbow?: boolean;
  exerciseShoulder?: boolean;
  progressTracker?: {
    startProgress: number;
    currentProgress: number;
    playTimeMinutes: number;
    playedDays: number;
    fingerProgress?: number;
    wristProgress?: number;
    elbowProgress?: number;
    shoulderProgress?: number;
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
  exerciseFingers: boolean;
  exerciseWrist: boolean;
  exerciseElbow: boolean;
  exerciseShoulder: boolean;
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
  exerciseFingers: false,
  exerciseWrist: false,
  exerciseElbow: false,
  exerciseShoulder: false,
};

export default function StudentManagement() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const userRoles = Array.isArray((user as any)?.roles)
    ? ((user as any).roles as string[])
    : ([user?.role].filter(Boolean) as string[]);
  const isHospitalScopedUser =
    userRoles.includes("HOSPITAL_ADMIN") && user?.email !== "armigo@gmail.com";
  const [scopedHospital, setScopedHospital] = useState<Hospital | null>(null);
  const [search, setSearch] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const [physiotherapistFilter, setPhysiotherapistFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [parentCredentials, setParentCredentials] = useState<
    Patient["parentCredentials"] | null
  >(null);
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [formData, setFormData] = useState<PatientForm>(initialForm);
  const [parentMode, setParentMode] = useState<"new" | "existing">("new");
  const [selectedParentId, setSelectedParentId] = useState("");
  const [parentSearch, setParentSearch] = useState("");

  useEffect(() => {
    if (!isHospitalScopedUser) return;

    let mounted = true;

    const loadHospitalScope = async () => {
      try {
        const response = await ApiClient.get<any>("/users/profile");
        const payload = response?.data ?? response ?? {};
        const hospital = payload?.hospitalProfile?.hospital;
        if (!mounted || !hospital?.id) return;

        const resolvedHospital = {
          id: hospital.id,
          name: hospital.name || "Hospital",
        };

        setScopedHospital(resolvedHospital);
        setHospitalFilter(hospital.id);
        setFormData((prev) => ({
          ...prev,
          hospitalId: hospital.id,
          physiotherapistId: "",
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
    queryKey: ["patients-management", "patients", scopedHospitalId],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/patients", {
        params: {
          limit: 1000,
          ...(isHospitalScopedUser && scopedHospitalId
            ? { hospitalId: scopedHospitalId }
            : {}),
        },
      });
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload || [];
      return Array.isArray(list) ? list : [];
    },
    enabled: !isHospitalScopedUser || !!scopedHospitalId,
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
      queryKey: ["patients-management", "physiotherapists", scopedHospitalId],
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      queryFn: async () => {
        const response = await ApiClient.get<any>(
          "/patients/locations/physiotherapists",
          {
            params: {
              ...(isHospitalScopedUser && scopedHospitalId
                ? { hospitalId: scopedHospitalId }
                : {}),
            },
          }
        );
        const payload = response?.data ?? response ?? {};
        const list = payload?.data || payload || [];
        return Array.isArray(list)
          ? list.filter((item: any) => item?.id && item?.name)
          : [];
      },
      enabled: !isHospitalScopedUser || !!scopedHospitalId,
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

  const { data: parentUsers = [] } = useQuery({
    queryKey: ["patients-management", "parent-users"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/users", {
        params: { role: "PARENT", limit: 10000 },
      });
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload || [];
      return Array.isArray(list)
        ? list.filter((item: any) => item?.id && item?.firstName)
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

  const availableHospitals = useMemo(() => {
    if (!isHospitalScopedUser) return hospitals;
    if (!scopedHospitalId) return [];
    return hospitals.filter((hospital: Hospital) => hospital.id === scopedHospitalId);
  }, [hospitals, isHospitalScopedUser, scopedHospitalId]);

  const filteredPhysiotherapists = useMemo(() => {
    if (!formData.hospitalId) return [];
    return physiotherapists.filter(
      (item: Physiotherapist) => item.hospitalId === formData.hospitalId
    );
  }, [physiotherapists, formData.hospitalId]);

  const physiotherapistFilterOptions = useMemo(() => {
    if (hospitalFilter === "all") {
      return physiotherapists;
    }
    return physiotherapists.filter(
      (item: Physiotherapist) => item.hospitalId === hospitalFilter
    );
  }, [physiotherapists, hospitalFilter]);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = patients;

    if (hospitalFilter !== "all") {
      list = list.filter((patient: Patient) => patient.hospitalId === hospitalFilter);
    }

    if (physiotherapistFilter !== "all") {
      const selectedPhysio = physiotherapists.find(
        (item: Physiotherapist) => item.id === physiotherapistFilter
      );

      if (selectedPhysio) {
        list = list.filter(
          (patient: Patient) => patient.assignedDoctor === selectedPhysio.name
        );
      }
    }

    if (!term) return list;

    return list.filter((patient: Patient) =>
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
  }, [patients, search, hospitalFilter, physiotherapistFilter, physiotherapists]);

  const stats = useMemo(() => {
    const total = patients.length;
    const active = patients.filter((patient: Patient) => patient.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [patients]);

  const handleOpenAddDialog = () => {
    setEditingPatient(null);
    setFormData({
      ...initialForm,
      hospitalId: isHospitalScopedUser ? scopedHospitalId : "",
    });
    setShowParentPassword(false);
    setDialogOpen(true);
  };

  const handleOpenViewDialog = (patient: Patient) => {
    setViewingPatient(patient);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setViewingPatient(null);
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
      exerciseFingers: patient.exerciseFingers ?? false,
      exerciseWrist: patient.exerciseWrist ?? false,
      exerciseElbow: patient.exerciseElbow ?? false,
      exerciseShoulder: patient.exerciseShoulder ?? false,
    });
    setShowParentPassword(false);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPatient(null);
    setFormData(initialForm);
    setShowParentPassword(false);
    setParentMode("new");
    setSelectedParentId("");
    setParentSearch("");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Birthdate future validation
    if (formData.dateOfBirth) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(formData.dateOfBirth) > today) {
        toast.error("Date of birth cannot be in the future");
        return;
      }
    }

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.dateOfBirth ||
      !formData.gender ||
      !formData.address.trim() ||
      (!isHospitalScopedUser && !formData.districtId) ||
      !formData.hospitalId ||
      !formData.physiotherapistId
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (parentMode === "existing") {
      if (!selectedParentId) {
        toast.error("Please select an existing parent");
        return;
      }
    } else {
      if (
        !formData.parentName.trim() ||
        !formData.parentEmail.trim() ||
        !formData.parentPhone.trim() ||
        (!editingPatient && !formData.parentPassword.trim())
      ) {
        toast.error("Please fill all parent fields");
        return;
      }

      const slPhoneRegex = /^07[0-24-8]\d{7}$/;
      if (!slPhoneRegex.test(formData.parentPhone.trim())) {
        toast.error("Invalid mobile number. Must be 10 digits starting with 070/071/072/074/075/076/077/078");
        return;
      }
    }

    const selectedPhysio = physiotherapists.find(
      (item: Physiotherapist) => item.id === formData.physiotherapistId
    );

    if (!selectedPhysio) {
      toast.error("Please select a valid physiotherapist");
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
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      diagnosis: formData.diagnosis.trim() || undefined,
      address: formData.address.trim(),
      ...(isHospitalScopedUser
        ? {}
        : {
            districtId: formData.districtId,
            zoneId: formData.zoneId || undefined,
          }),
      ...(parentMode === "existing"
        ? { parentId: selectedParentId }
        : {
            parentName: formData.parentName.trim(),
            parentEmail: formData.parentEmail.trim(),
            parentPhone: formData.parentPhone.trim(),
            ...(formData.parentPassword.trim()
              ? { parentPassword: formData.parentPassword.trim() }
              : {}),
          }),
      hospitalId: resolvedHospitalId,
      assignedDoctor: selectedPhysio.name,
      exerciseFingers: formData.exerciseFingers,
      exerciseWrist: formData.exerciseWrist,
      exerciseElbow: formData.exerciseElbow,
      exerciseShoulder: formData.exerciseShoulder,
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
  const tableColumnCount = isHospitalScopedUser ? 14 : 17;

  const toProgressValue = (value?: number) => {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.min(100, parsed));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Children Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage children with parent details, hospital and physiotherapist
              assignment
            </p>
          </div>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="h-4 w-4 mr-2" /> Add Child
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Children</p>
                <p className="text-2xl font-bold">{stats.total}</p>
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
                <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
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
                <p className="text-2xl font-bold text-rose-600">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Children List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by child, parent, hospital, physiotherapist..."
                className="pl-9"
              />
            </div>

            {!isHospitalScopedUser ? (
              <Select
                value={hospitalFilter}
                onValueChange={(value) => {
                  setHospitalFilter(value);
                  setPhysiotherapistFilter("all");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by hospital" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hospitals</SelectItem>
                  {hospitals.map((hospital: Hospital) => (
                    <SelectItem key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            <Select
              value={physiotherapistFilter}
              onValueChange={setPhysiotherapistFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by physiotherapist" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Physiotherapists</SelectItem>
                {physiotherapistFilterOptions.map((item: Physiotherapist) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Child Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Parent Mobile</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Address</TableHead>
                  {!isHospitalScopedUser ? <TableHead>Province</TableHead> : null}
                  {!isHospitalScopedUser ? <TableHead>District</TableHead> : null}
                  {!isHospitalScopedUser ? <TableHead>Zone</TableHead> : null}
                  <TableHead>Physiotherapist</TableHead>
                  <TableHead>Exercises</TableHead>
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
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={tableColumnCount}>
                        <div className="h-10 rounded-lg bg-muted animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableColumnCount}>
                      <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="p-3 rounded-full bg-muted">
                          <Users className="h-6 w-6" />
                        </div>
                        <p className="font-medium">No children found</p>
                        <p className="text-xs">Add a child or adjust your search/filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient: Patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <button
                          onClick={() => patient.displayId && copyToClipboard(patient.displayId, "ID")}
                          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20 font-mono tracking-wide whitespace-nowrap hover:bg-indigo-100 transition-colors cursor-pointer"
                          title="Click to copy"
                        >
                          {patient.displayId || "-"}
                          {patient.displayId && <Copy className="h-3 w-3 text-indigo-400" />}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {patient.firstName} {patient.lastName}
                      </TableCell>
                      <TableCell>{patient.age ?? "-"}</TableCell>
                      <TableCell>{patient.parentName || "-"}</TableCell>
                      <TableCell>{patient.parentPhone || "-"}</TableCell>
                      <TableCell>{patient.hospital?.name || "-"}</TableCell>
                      <TableCell>{patient.address || "-"}</TableCell>
                      {!isHospitalScopedUser ? <TableCell>{patient.province?.name || "-"}</TableCell> : null}
                      {!isHospitalScopedUser ? <TableCell>{patient.district?.name || "-"}</TableCell> : null}
                      {!isHospitalScopedUser ? <TableCell>{patient.zone?.name || "-"}</TableCell> : null}
                      <TableCell>{patient.assignedDoctor || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {patient.exerciseFingers && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-300 text-blue-600">
                              Fingers
                            </Badge>
                          )}
                          {patient.exerciseWrist && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-300 text-emerald-600">
                              Wrist
                            </Badge>
                          )}
                          {patient.exerciseElbow && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600">
                              Elbow
                            </Badge>
                          )}
                          {patient.exerciseShoulder && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-300 text-purple-600">
                              Shoulder
                            </Badge>
                          )}
                          {!patient.exerciseFingers && !patient.exerciseWrist && !patient.exerciseElbow && !patient.exerciseShoulder && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
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
                            className="h-8 w-8 p-0 hover:bg-sky-500/10 hover:text-sky-600"
                            onClick={() => handleOpenViewDialog(patient)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleOpenEditDialog(patient)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 hover:bg-amber-500/10 hover:text-amber-600"
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
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              setPatientToDelete(patient);
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
                    max={new Date().toISOString().split("T")[0]}
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

              {!isHospitalScopedUser ? (
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
              ) : null}
            </div>

            <div className="rounded-lg border p-4 space-y-4">
              <p className="text-sm font-medium">Exercise Types</p>
              <p className="text-xs text-muted-foreground">Select the exercises this child will perform</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                  <Checkbox
                    checked={formData.exerciseFingers}
                    onCheckedChange={(checked: boolean) =>
                      setFormData((prev) => ({ ...prev, exerciseFingers: !!checked }))
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Hand className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Fingers</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                  <Checkbox
                    checked={formData.exerciseWrist}
                    onCheckedChange={(checked: boolean) =>
                      setFormData((prev) => ({ ...prev, exerciseWrist: !!checked }))
                    }
                  />
                  <div className="flex items-center gap-2">
                    <CircleDot className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">Wrist</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                  <Checkbox
                    checked={formData.exerciseElbow}
                    onCheckedChange={(checked: boolean) =>
                      setFormData((prev) => ({ ...prev, exerciseElbow: !!checked }))
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Elbow</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                  <Checkbox
                    checked={formData.exerciseShoulder}
                    onCheckedChange={(checked: boolean) =>
                      setFormData((prev) => ({ ...prev, exerciseShoulder: !!checked }))
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Shoulder</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Parent Details</p>
                {!editingPatient && (
                  <div className="flex items-center gap-1 rounded-lg border p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setParentMode("new");
                        setSelectedParentId("");
                        setParentSearch("");
                      }}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        parentMode === "new"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      New Parent
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setParentMode("existing");
                        setFormData((prev) => ({
                          ...prev,
                          parentName: "",
                          parentEmail: "",
                          parentPhone: "",
                          parentPassword: "",
                        }));
                      }}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        parentMode === "existing"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Existing Parent
                    </button>
                  </div>
                )}
              </div>

              {parentMode === "existing" && !editingPatient ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Search & Select Parent</Label>
                    <Input
                      placeholder="Search by name, email, or phone..."
                      value={parentSearch}
                      onChange={(e) => setParentSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-md border">
                    {parentUsers
                      .filter((p: any) => {
                        if (!parentSearch.trim()) return true;
                        const term = parentSearch.toLowerCase();
                        return (
                          `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
                          (p.email || "").toLowerCase().includes(term) ||
                          (p.phone || "").includes(term)
                        );
                      })
                      .map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedParentId(p.id)}
                          className={`w-full text-left px-3 py-2.5 text-sm border-b last:border-b-0 transition-colors ${
                            selectedParentId === p.id
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-accent/50"
                          }`}
                        >
                          <div className="font-medium">
                            {p.firstName} {p.lastName}
                            {p.displayId && (
                              <span className="ml-2 text-xs text-muted-foreground font-mono">
                                {p.displayId}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {p.email || "No email"} • {p.phone || "No phone"}
                          </div>
                        </button>
                      ))}
                    {parentUsers.filter((p: any) => {
                      if (!parentSearch.trim()) return true;
                      const term = parentSearch.toLowerCase();
                      return (
                        `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
                        (p.email || "").toLowerCase().includes(term) ||
                        (p.phone || "").includes(term)
                      );
                    }).length === 0 && (
                      <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                        No parents found
                      </div>
                    )}
                  </div>
                  {selectedParentId && (() => {
                    const selected = parentUsers.find((p: any) => p.id === selectedParentId);
                    return selected ? (
                      <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm">
                        <p className="font-medium text-green-800">
                          Selected: {selected.firstName} {selected.lastName}
                        </p>
                        <p className="text-green-600 text-xs">
                          {selected.email} • {selected.phone}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>
              ) : (
                <>
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
                  placeholder="07XXXXXXXX"
                  maxLength={10}
                  value={formData.parentPhone}
                  onChange={(event) => {
                    const val = event.target.value.replace(/\D/g, "").slice(0, 10);
                    setFormData((prev) => ({ ...prev, parentPhone: val }));
                  }}
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
                </>
              )}
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
                  disabled={isHospitalScopedUser}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isHospitalScopedUser
                          ? scopedHospital?.name || "Loading hospital..."
                          : hospitalsLoading
                            ? "Loading hospitals..."
                            : "Select hospital"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableHospitals.length === 0 && !hospitalsLoading ? (
                      <SelectItem value="__NO_HOSPITALS__" disabled>
                        No hospitals available
                      </SelectItem>
                    ) : null}
                    {availableHospitals.map((hospital: Hospital) => (
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

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-3xl h-[90dvh] max-h-[90dvh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle>Child Details</DialogTitle>
          </DialogHeader>

          {viewingPatient ? (
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain overflow-x-hidden space-y-4 px-6 pb-6 pt-4">
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">
                        {viewingPatient.firstName} {viewingPatient.lastName}
                      </h3>
                      <button
                        onClick={() => viewingPatient.displayId && copyToClipboard(viewingPatient.displayId, "ID")}
                        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20 font-mono tracking-wide whitespace-nowrap hover:bg-indigo-100 transition-colors cursor-pointer"
                        title="Click to copy"
                      >
                        {viewingPatient.displayId || "-"}
                        {viewingPatient.displayId && <Copy className="h-3 w-3 text-indigo-400" />}
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Age: {viewingPatient.age ?? "-"} • Gender: {viewingPatient.gender}
                    </p>
                  </div>
                  <Badge variant={viewingPatient.isActive ? "default" : "secondary"}>
                    {viewingPatient.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Parent</p>
                    <p className="font-medium">{viewingPatient.parentName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Parent Mobile</p>
                    <p className="font-medium">{viewingPatient.parentPhone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Hospital</p>
                    <p className="font-medium">{viewingPatient.hospital?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Physiotherapist</p>
                    <p className="font-medium">{viewingPatient.assignedDoctor || "-"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium">{viewingPatient.address || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <h4 className="text-sm font-medium">Exercise Types</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingPatient.exerciseFingers && (
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      <Hand className="h-3 w-3 mr-1" /> Fingers
                    </Badge>
                  )}
                  {viewingPatient.exerciseWrist && (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <CircleDot className="h-3 w-3 mr-1" /> Wrist
                    </Badge>
                  )}
                  {viewingPatient.exerciseElbow && (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      <Activity className="h-3 w-3 mr-1" /> Elbow
                    </Badge>
                  )}
                  {viewingPatient.exerciseShoulder && (
                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                      <Users className="h-3 w-3 mr-1" /> Shoulder
                    </Badge>
                  )}
                  {!viewingPatient.exerciseFingers && !viewingPatient.exerciseWrist && !viewingPatient.exerciseElbow && !viewingPatient.exerciseShoulder && (
                    <span className="text-xs text-muted-foreground">No exercise types selected</span>
                  )}
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <h4 className="text-sm font-medium">Overall Progress</h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Start Progress</span>
                    <span className="font-medium">
                      {viewingPatient.progressTracker?.startProgress ?? 0}%
                    </span>
                  </div>
                  <Progress
                    value={toProgressValue(viewingPatient.progressTracker?.startProgress)}
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current Progress</span>
                    <span className="font-medium">
                      {viewingPatient.progressTracker?.currentProgress ?? 0}%
                    </span>
                  </div>
                  <Progress
                    value={toProgressValue(viewingPatient.progressTracker?.currentProgress)}
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Play Time</p>
                    <p className="font-semibold">
                      {viewingPatient.progressTracker?.playTimeMinutes ?? 0} min
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Played Days</p>
                    <p className="font-semibold">
                      {viewingPatient.progressTracker?.playedDays ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              {(viewingPatient.exerciseFingers || viewingPatient.exerciseWrist || viewingPatient.exerciseElbow || viewingPatient.exerciseShoulder) && (
                <div className="rounded-lg border p-4 space-y-4">
                  <h4 className="text-sm font-medium">Per-Exercise Progress</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingPatient.exerciseFingers && (
                      <div className="rounded-lg border border-blue-200 dark:border-blue-800 p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Hand className="h-4 w-4 text-blue-500" />
                          <span>Fingers</span>
                          <span className="ml-auto text-blue-600 dark:text-blue-400">
                            {viewingPatient.progressTracker?.fingerProgress ?? 0}%
                          </span>
                        </div>
                        <Progress
                          value={toProgressValue(viewingPatient.progressTracker?.fingerProgress)}
                          className="h-2 [&>div]:bg-blue-500"
                        />
                      </div>
                    )}
                    {viewingPatient.exerciseWrist && (
                      <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CircleDot className="h-4 w-4 text-emerald-500" />
                          <span>Wrist</span>
                          <span className="ml-auto text-emerald-600 dark:text-emerald-400">
                            {viewingPatient.progressTracker?.wristProgress ?? 0}%
                          </span>
                        </div>
                        <Progress
                          value={toProgressValue(viewingPatient.progressTracker?.wristProgress)}
                          className="h-2 [&>div]:bg-emerald-500"
                        />
                      </div>
                    )}
                    {viewingPatient.exerciseElbow && (
                      <div className="rounded-lg border border-amber-200 dark:border-amber-800 p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Activity className="h-4 w-4 text-amber-500" />
                          <span>Elbow</span>
                          <span className="ml-auto text-amber-600 dark:text-amber-400">
                            {viewingPatient.progressTracker?.elbowProgress ?? 0}%
                          </span>
                        </div>
                        <Progress
                          value={toProgressValue(viewingPatient.progressTracker?.elbowProgress)}
                          className="h-2 [&>div]:bg-amber-500"
                        />
                      </div>
                    )}
                    {viewingPatient.exerciseShoulder && (
                      <div className="rounded-lg border border-purple-200 dark:border-purple-800 p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Users className="h-4 w-4 text-purple-500" />
                          <span>Shoulder</span>
                          <span className="ml-auto text-purple-600 dark:text-purple-400">
                            {viewingPatient.progressTracker?.shoulderProgress ?? 0}%
                          </span>
                        </div>
                        <Progress
                          value={toProgressValue(viewingPatient.progressTracker?.shoulderProgress)}
                          className="h-2 [&>div]:bg-purple-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter className="px-6 py-3 border-t bg-background">
            <Button type="button" variant="outline" onClick={handleCloseViewDialog}>
              Close
            </Button>
          </DialogFooter>
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
