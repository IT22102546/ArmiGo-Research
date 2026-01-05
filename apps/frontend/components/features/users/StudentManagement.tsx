"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Download,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  Ban,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ShieldCheck,
  Mail,
  Phone,
  Shield,
  MoreVertical,
  ExternalLink,
  XCircle,
  MapPin,
  UserCheck,
  UserX,
  Key,
  Lock,
  Heart,
  Activity,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

// Dummy patient data
const dummyPatients = [
  {
    id: "pat-001",
    firstName: "Ranasinghe",
    lastName: "Silva",
    email: "ranasinghe.silva@hospital.lk",
    phone: "+94 701234567",
    patientId: "PAT-2024-001",
    status: "ACTIVE",
    bloodType: "O+",
    dateOfBirth: "1985-03-15",
    gender: "Male",
    ward: "General Ward",
    admissionDate: "2024-01-10",
    doctorAssigned: "Dr. Fernando",
    emergencyContact: "Kandy Silva",
    emergencyPhone: "+94 701234568",
    medicalHistory: "Hypertension, Diabetes",
    emailVerified: true,
    phoneVerified: true,
    twoFactorEnabled: true,
    createdAt: "2024-01-10",
  },
  {
    id: "pat-002",
    firstName: "Perera",
    lastName: "Kumari",
    email: "perera.kumari@hospital.lk",
    phone: "+94 702234567",
    patientId: "PAT-2024-002",
    status: "ACTIVE",
    bloodType: "A+",
    dateOfBirth: "1990-07-22",
    gender: "Female",
    ward: "ICU",
    admissionDate: "2024-02-15",
    doctorAssigned: "Dr. Perera",
    emergencyContact: "Suneth Kumari",
    emergencyPhone: "+94 702234568",
    medicalHistory: "Asthma",
    emailVerified: true,
    phoneVerified: false,
    twoFactorEnabled: false,
    createdAt: "2024-02-15",
  },
  {
    id: "pat-003",
    firstName: "Jayasinghe",
    lastName: "Mendis",
    email: "jayasinghe.mendis@hospital.lk",
    phone: "+94 703234567",
    patientId: "PAT-2024-003",
    status: "PENDING",
    bloodType: "B-",
    dateOfBirth: "1988-11-08",
    gender: "Male",
    ward: "Surgical Ward",
    admissionDate: "2024-03-05",
    doctorAssigned: "Dr. Silva",
    emergencyContact: "Nimal Mendis",
    emergencyPhone: "+94 703234568",
    medicalHistory: "None",
    emailVerified: false,
    phoneVerified: true,
    twoFactorEnabled: false,
    createdAt: "2024-03-05",
  },
];

// Dummy stats
const dummyStats = {
  totalUsers: 156,
  activeUsers: 128,
  pendingUsers: 18,
  suspendedUsers: 10,
  newUsersToday: 5,
  newUsersThisWeek: 23,
  verifiedUsers: 142,
  unverifiedUsers: 14,
};

// Extended User type with profile information
interface Patient {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  status?: string;
  patientId?: string;
  bloodType?: string;
  dateOfBirth?: string;
  gender?: string;
  ward?: string;
  admissionDate?: string;
  doctorAssigned?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalHistory?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  lastLoginAt?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
}

interface PatientStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  verifiedUsers: number;
  unverifiedUsers: number;
}

const PatientManagement: React.FC = () => {
  const t = useTranslations("users");
  const [activeTab, setActiveTab] = useState<string>("INPATIENT");
  const [patients, setPatients] = useState<Patient[]>(dummyPatients);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWard, setFilterWard] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewPatient, setQuickViewPatient] = useState<Patient | null>(
    null
  );
  const [loadingQuickView, setLoadingQuickView] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "Male",
    bloodType: "O+",
    ward: "General Ward",
    doctorAssigned: "Dr. Fernando",
    emergencyContact: "",
    emergencyPhone: "",
    medicalHistory: "",
  });
  const [stats, setStats] = useState<PatientStats>(dummyStats);

  // Load reference data on mount
  useEffect(() => {
    setStats(dummyStats);
  }, []);

  const handleAddPatient = () => {
    if (!newPatientForm.firstName || !newPatientForm.lastName) {
      toast.error("Please fill in first and last name");
      return;
    }

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      firstName: newPatientForm.firstName,
      lastName: newPatientForm.lastName,
      email: newPatientForm.email,
      phone: newPatientForm.phone,
      patientId: `PAT-2024-${String(patients.length + 1).padStart(3, "0")}`,
      status: "ACTIVE",
      bloodType: newPatientForm.bloodType,
      dateOfBirth: newPatientForm.dateOfBirth,
      gender: newPatientForm.gender,
      ward: newPatientForm.ward,
      admissionDate: new Date().toISOString().split("T")[0],
      doctorAssigned: newPatientForm.doctorAssigned,
      emergencyContact: newPatientForm.emergencyContact,
      emergencyPhone: newPatientForm.emergencyPhone,
      medicalHistory: newPatientForm.medicalHistory,
      emailVerified: false,
      phoneVerified: false,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setPatients([newPatient, ...patients]);
    toast.success("Patient added successfully");
    setAddPatientOpen(false);
    setNewPatientForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "Male",
      bloodType: "O+",
      ward: "General Ward",
      doctorAssigned: "Dr. Fernando",
      emergencyContact: "",
      emergencyPhone: "",
      medicalHistory: "",
    });
  };

  // Filter patients based on search and filters
  const filteredPatients = patients.filter((patient) => {
    if (activeTab === "INPATIENT" && patient.ward === "General Ward")
      return false;
    if (activeTab === "OUTPATIENT" && patient.ward !== "General Ward")
      return false;

    const matchesSearch =
      searchTerm === "" ||
      `${patient.firstName} ${patient.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesWard = filterWard === "all" || patient.ward === filterWard;

    const matchesStatus =
      filterStatus === "all" || patient.status === filterStatus;

    return matchesSearch && matchesWard && matchesStatus;
  });

  const handleDelete = async () => {
    if (!patientToDelete) return;

    setPatients(patients.filter((p) => p.id !== patientToDelete));
    toast.success("Patient deleted successfully");
    setDeleteDialogOpen(false);
    setPatientToDelete(null);
  };

  const fetchQuickViewData = async (patient: Patient) => {
    setLoadingQuickView(true);
    setQuickViewPatient(patient);
    setQuickViewOpen(true);
    setLoadingQuickView(false);
  };

  const openDeleteDialog = (patientId: string) => {
    setPatientToDelete(patientId);
    setDeleteDialogOpen(true);
  };

  const handleExport = () => {
    toast.success("Export started");
  };

  const handleRefresh = () => {
    toast.success("Data refreshed");
  };

  // Verification badges component
  const getVerificationBadges = (patient: Patient) => {
    const badges: React.ReactNode[] = [];

    if (patient.emailVerified) {
      badges.push(
        <TooltipProvider key="email">
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1"
              >
                <Mail className="h-3 w-3" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Email Verified</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (patient.phoneVerified) {
      badges.push(
        <TooltipProvider key="phone">
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1"
              >
                <Phone className="h-3 w-3" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Phone Verified</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (patient.twoFactorEnabled) {
      badges.push(
        <TooltipProvider key="2fa">
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-1"
              >
                <Shield className="h-3 w-3" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>2FA Enabled</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return badges.length > 0 ? (
      <div className="flex items-center gap-1">{badges}</div>
    ) : (
      <span className="text-xs text-muted-foreground">-</span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            Patient Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage patient records and admissions
          </p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh Data</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button size="sm" onClick={() => setAddPatientOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" />
            Add Patient
          </Button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Patients</p>
                <p className="text-xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-bold text-green-600">
                  {stats.activeUsers}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-yellow-600">
                  {stats.pendingUsers}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Discharged</p>
                <p className="text-xl font-bold text-red-600">
                  {stats.suspendedUsers}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Ban className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">New Today</p>
                <p className="text-xl font-bold">{stats.newUsersToday}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="text-xl font-bold">{stats.newUsersThisWeek}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Verified</p>
                <p className="text-xl font-bold text-green-600">
                  {stats.verifiedUsers}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Unverified</p>
                <p className="text-xl font-bold text-orange-600">
                  {stats.unverifiedUsers}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Inpatient/Outpatient */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="INPATIENT" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Inpatients
          </TabsTrigger>
          <TabsTrigger value="OUTPATIENT" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Outpatients
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {/* Filters */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or patient ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>

                <Select value={filterWard} onValueChange={setFilterWard}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Ward" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wards</SelectItem>
                    <SelectItem value="General Ward">General Ward</SelectItem>
                    <SelectItem value="ICU">ICU</SelectItem>
                    <SelectItem value="Surgical Ward">Surgical Ward</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>

                {/* Results count */}
                <div className="text-xs text-muted-foreground ml-auto">
                  Showing {filteredPatients.length} of {patients.length}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patients Table */}
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No patients found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Ward</TableHead>
                        <TableHead>Doctor Assigned</TableHead>
                        <TableHead>Blood Type</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell className="font-mono text-sm">
                            {patient.patientId || "-"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {patient.firstName} {patient.lastName}
                          </TableCell>
                          <TableCell className="text-sm">
                            {patient.email}
                          </TableCell>
                          <TableCell>{patient.phone || "-"}</TableCell>
                          <TableCell>{patient.ward || "-"}</TableCell>
                          <TableCell>{patient.doctorAssigned || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {patient.bloodType || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getVerificationBadges(patient)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                patient.status === "ACTIVE"
                                  ? "success"
                                  : "secondary"
                              }
                            >
                              {patient.status === "ACTIVE"
                                ? "Active"
                                : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        fetchQuickViewData(patient)
                                      }
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Quick View</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48"
                                >
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      console.log("View profile:", patient.id);
                                    }}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      console.log("Edit patient:", patient.id);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const newStatus =
                                        patient.status === "ACTIVE"
                                          ? "PENDING"
                                          : "ACTIVE";
                                      setPatients(
                                        patients.map((p) =>
                                          p.id === patient.id
                                            ? { ...p, status: newStatus }
                                            : p
                                        )
                                      );
                                      toast.success(
                                        "Status updated successfully"
                                      );
                                    }}
                                  >
                                    {patient.status === "ACTIVE" ? (
                                      <>
                                        <UserX className="h-4 w-4 mr-2" />
                                        Mark Pending
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        Mark Active
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openDeleteDialog(patient.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this patient? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick View Sheet */}
      <Sheet open={quickViewOpen} onOpenChange={setQuickViewOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              {quickViewPatient && (
                <>
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                      {quickViewPatient.firstName?.[0]}
                      {quickViewPatient.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {quickViewPatient.firstName} {quickViewPatient.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground font-normal">
                      {quickViewPatient.email}
                    </p>
                  </div>
                </>
              )}
            </SheetTitle>
            <SheetDescription>Patient Quick View</SheetDescription>
          </SheetHeader>

          {loadingQuickView ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            quickViewPatient && (
              <div className="mt-6 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      quickViewPatient.status === "ACTIVE"
                        ? "success"
                        : "secondary"
                    }
                  >
                    {quickViewPatient.status === "ACTIVE"
                      ? "Active"
                      : "Pending"}
                  </Badge>
                </div>

                <Separator />

                {/* Contact Information */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">
                        {quickViewPatient.phone || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium truncate">
                        {quickViewPatient.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Admission Date</p>
                      <p className="font-medium">
                        {quickViewPatient.admissionDate || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Patient ID</p>
                      <p className="font-medium font-mono text-xs">
                        {quickViewPatient.patientId || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Medical Information */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Medical Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Blood Type</p>
                      <p className="font-medium">
                        {quickViewPatient.bloodType || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">
                        {quickViewPatient.dateOfBirth || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ward</p>
                      <p className="font-medium">
                        {quickViewPatient.ward || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gender</p>
                      <p className="font-medium">
                        {quickViewPatient.gender || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Doctor & Emergency */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Healthcare Team
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Doctor Assigned</p>
                      <p className="font-medium">
                        {quickViewPatient.doctorAssigned || "-"}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Emergency Contact</p>
                      <p className="font-medium">
                        {quickViewPatient.emergencyContact || "-"}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Emergency Phone</p>
                      <p className="font-medium">
                        {quickViewPatient.emergencyPhone || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Medical History */}
                {quickViewPatient.medicalHistory && (
                  <>
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Medical History
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {quickViewPatient.medicalHistory}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Verification Status */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Verification Status
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Verified
                      </span>
                      {quickViewPatient.emailVerified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Verified
                      </span>
                      {quickViewPatient.phoneVerified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        2FA Enabled
                      </span>
                      {quickViewPatient.twoFactorEnabled ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </SheetContent>
      </Sheet>

      {/* Add Patient Dialog */}
      <Dialog open={addPatientOpen} onOpenChange={setAddPatientOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Patient
            </DialogTitle>
            <DialogDescription>
              Enter patient details to add them to the system
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name *</label>
              <Input
                placeholder="John"
                value={newPatientForm.firstName}
                onChange={(e) =>
                  setNewPatientForm({
                    ...newPatientForm,
                    firstName: e.target.value,
                  })
                }
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name *</label>
              <Input
                placeholder="Doe"
                value={newPatientForm.lastName}
                onChange={(e) =>
                  setNewPatientForm({
                    ...newPatientForm,
                    lastName: e.target.value,
                  })
                }
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={newPatientForm.email}
                onChange={(e) =>
                  setNewPatientForm({
                    ...newPatientForm,
                    email: e.target.value,
                  })
                }
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                placeholder="+94 70 123 4567"
                value={newPatientForm.phone}
                onChange={(e) =>
                  setNewPatientForm({
                    ...newPatientForm,
                    phone: e.target.value,
                  })
                }
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date of Birth</label>
              <Input
                type="date"
                value={newPatientForm.dateOfBirth}
                onChange={(e) =>
                  setNewPatientForm({
                    ...newPatientForm,
                    dateOfBirth: e.target.value,
                  })
                }
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <Select
                value={newPatientForm.gender}
                onValueChange={(value) =>
                  setNewPatientForm({
                    ...newPatientForm,
                    gender: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Blood Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Blood Type</label>
              <Select
                value={newPatientForm.bloodType}
                onValueChange={(value) =>
                  setNewPatientForm({
                    ...newPatientForm,
                    bloodType: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ward */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ward</label>
              <Select
                value={newPatientForm.ward}
                onValueChange={(value) =>
                  setNewPatientForm({
                    ...newPatientForm,
                    ward: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General Ward">General Ward</SelectItem>
                  <SelectItem value="ICU">ICU</SelectItem>
                  <SelectItem value="Surgical Ward">Surgical Ward</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Doctor Assigned */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Doctor Assigned</label>
              <Select
                value={newPatientForm.doctorAssigned}
                onValueChange={(value) =>
                  setNewPatientForm({
                    ...newPatientForm,
                    doctorAssigned: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dr. Fernando">Dr. Fernando</SelectItem>
                  <SelectItem value="Dr. Perera">Dr. Perera</SelectItem>
                  <SelectItem value="Dr. Silva">Dr. Silva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Emergency Contact</label>
              <Input
                placeholder="Family member name"
                value={newPatientForm.emergencyContact}
                onChange={(e) =>
                  setNewPatientForm({
                    ...newPatientForm,
                    emergencyContact: e.target.value,
                  })
                }
              />
            </div>

            {/* Emergency Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Emergency Phone</label>
              <Input
                placeholder="+94 70 987 6543"
                value={newPatientForm.emergencyPhone}
                onChange={(e) =>
                  setNewPatientForm({
                    ...newPatientForm,
                    emergencyPhone: e.target.value,
                  })
                }
              />
            </div>

            {/* Medical History */}
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Medical History</label>
              <Input
                placeholder="e.g., Hypertension, Diabetes"
                value={newPatientForm.medicalHistory}
                onChange={(e) =>
                  setNewPatientForm({
                    ...newPatientForm,
                    medicalHistory: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPatientOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPatient}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientManagement;
