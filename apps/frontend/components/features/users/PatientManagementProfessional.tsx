"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Users,
  UserPlus,
  Search,
  Trash2,
  Eye,
  Edit2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Heart,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  useGetPatients,
  useGetPatientStats,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
} from "@/lib/hooks/queries/usePatients";
import { Patient } from "@/lib/api/endpoints/patients";
import { Skeleton } from "@/components/ui/skeleton";

export function PatientManagementProfessional() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState<string>("all");
  const [filterDiagnosis, setFilterDiagnosis] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // API calls
  const {
    data: patientsData,
    isLoading: patientLoading,
    error: patientError,
  } = useGetPatients({
    search: searchTerm,
    gender: filterGender !== "all" ? filterGender : undefined,
    diagnosis: filterDiagnosis !== "all" ? filterDiagnosis : undefined,
    page: currentPage,
    limit: pageSize,
  });

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useGetPatientStats();

  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();
  const deleteMutation = useDeletePatient();

  // Dialog states
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewPatient, setQuickViewPatient] = useState<Patient | null>(null);
  const [editPatientOpen, setEditPatientOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "Male",
    bloodType: "O+",
    ward: "General Ward",
    diagnosis: "Not Specified",
    assignedDoctor: "Dr. Fernando",
    emergencyContact: "",
    emergencyPhone: "",
    medicalHistory: "",
  });

  const stats = statsData?.data;
  const patients = patientsData?.data || [];
  const pagination = patientsData?.pagination;

  const handleAddPatient = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error("Please fill in required fields (First Name, Last Name, Phone)");
      return;
    }

    await createMutation.mutateAsync({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      bloodType: formData.bloodType,
      ward: formData.ward,
      diagnosis: formData.diagnosis,
      assignedDoctor: formData.assignedDoctor,
      emergencyContact: formData.emergencyContact,
      emergencyPhone: formData.emergencyPhone,
      medicalHistory: formData.medicalHistory,
    });

    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "Male",
      bloodType: "O+",
      ward: "General Ward",
      diagnosis: "Not Specified",
      assignedDoctor: "Dr. Fernando",
      emergencyContact: "",
      emergencyPhone: "",
      medicalHistory: "",
    });
    setAddPatientOpen(false);
  };

  const handleEditPatient = async () => {
    if (!editingPatient) return;

    await updateMutation.mutateAsync({
      id: editingPatient.id,
      data: formData as Partial<Patient>,
    });

    setEditPatientOpen(false);
    setEditingPatient(null);
  };

  const handleDeleteClick = (id: string) => {
    setPatientToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    await deleteMutation.mutateAsync(patientToDelete);
    setDeleteDialogOpen(false);
    setPatientToDelete(null);
  };

  const handleQuickView = (patient: Patient) => {
    setQuickViewPatient(patient);
    setQuickViewOpen(true);
  };

  const handleEditClick = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email || "",
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      bloodType: patient.bloodType || "O+",
      ward: patient.ward || "General Ward",
      diagnosis: patient.diagnosis || "Not Specified",
      assignedDoctor: patient.assignedDoctor || "Dr. Fernando",
      emergencyContact: patient.emergencyContact || "",
      emergencyPhone: patient.emergencyPhone || "",
      medicalHistory: patient.medicalHistory || "",
    });
    setEditPatientOpen(true);
  };

  // Get unique values for filters
  const genderOptions = useMemo(() => {
    const genders = new Set(patients.map((p) => p.gender));
    return Array.from(genders);
  }, [patients]);

  const diagnosisOptions = useMemo(() => {
    const diagnoses = new Set(
      patients.filter((p) => p.diagnosis).map((p) => p.diagnosis)
    );
    return Array.from(diagnoses);
  }, [patients]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalPatients || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-green-600">
                  {stats?.activePatients || 0}
                </div>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.newPatientsThisMonth || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Age
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.averageAge || 0} yrs</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Management</CardTitle>
          <CardDescription>Manage all patients in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              {/* Gender Filter */}
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  {genderOptions.map((gender) => (
                    <SelectItem key={gender} value={gender}>
                      {gender}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Diagnosis Filter */}
              <Select value={filterDiagnosis} onValueChange={setFilterDiagnosis}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Diagnosis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Diagnoses</SelectItem>
                  {diagnosisOptions.slice(0, 5).map((diagnosis) => (
                    <SelectItem key={diagnosis} value={diagnosis as string}>
                      {diagnosis}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Add Button */}
              <Button onClick={() => setAddPatientOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Patient
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patients List</CardTitle>
        </CardHeader>
        <CardContent>
          {patientError && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>Error loading patients. Please try again.</div>
            </div>
          )}

          {patientLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No patients found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {patient.firstName[0]}
                                {patient.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{`${patient.firstName} ${patient.lastName}`}</div>
                              <div className="text-xs text-muted-foreground">
                                {patient.phone}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{patient.age} yrs</TableCell>
                        <TableCell>{patient.gender}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {patient.diagnosis || "N/A"}
                        </TableCell>
                        <TableCell>{patient.assignedDoctor || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={patient.isActive ? "default" : "secondary"}>
                            {patient.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickView(patient)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(patient)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(patient.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages} (Total:{" "}
                    {pagination.total})
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === pagination.pages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name *</label>
              <Input
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder="Enter first name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name *</label>
              <Input
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="Enter last name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone *</label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date of Birth</label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <Select value={formData.gender} onValueChange={(value) =>
                setFormData({ ...formData, gender: value })
              }>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Blood Type</label>
              <Select value={formData.bloodType} onValueChange={(value) =>
                setFormData({ ...formData, bloodType: value })
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ward</label>
              <Input
                value={formData.ward}
                onChange={(e) =>
                  setFormData({ ...formData, ward: e.target.value })
                }
                placeholder="Enter ward"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Diagnosis</label>
              <Input
                value={formData.diagnosis}
                onChange={(e) =>
                  setFormData({ ...formData, diagnosis: e.target.value })
                }
                placeholder="Enter diagnosis"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Assigned Doctor</label>
              <Input
                value={formData.assignedDoctor}
                onChange={(e) =>
                  setFormData({ ...formData, assignedDoctor: e.target.value })
                }
                placeholder="Enter doctor name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Emergency Contact</label>
              <Input
                value={formData.emergencyContact}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContact: e.target.value })
                }
                placeholder="Enter contact name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Emergency Phone</label>
              <Input
                value={formData.emergencyPhone}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyPhone: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Medical History</label>
              <Input
                value={formData.medicalHistory}
                onChange={(e) =>
                  setFormData({ ...formData, medicalHistory: e.target.value })
                }
                placeholder="Enter medical history"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => setAddPatientOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPatient}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Patient"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={editPatientOpen} onOpenChange={setEditPatientOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Edit Patient
            </DialogTitle>
            <DialogDescription>
              Update patient details
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name</label>
              <Input
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder="Enter first name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name</label>
              <Input
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="Enter last name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date of Birth</label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <Select value={formData.gender} onValueChange={(value) =>
                setFormData({ ...formData, gender: value })
              }>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Blood Type</label>
              <Input
                value={formData.bloodType}
                onChange={(e) =>
                  setFormData({ ...formData, bloodType: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ward</label>
              <Input
                value={formData.ward}
                onChange={(e) =>
                  setFormData({ ...formData, ward: e.target.value })
                }
                placeholder="Enter ward"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Diagnosis</label>
              <Input
                value={formData.diagnosis}
                onChange={(e) =>
                  setFormData({ ...formData, diagnosis: e.target.value })
                }
                placeholder="Enter diagnosis"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Assigned Doctor</label>
              <Input
                value={formData.assignedDoctor}
                onChange={(e) =>
                  setFormData({ ...formData, assignedDoctor: e.target.value })
                }
                placeholder="Enter doctor name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Emergency Contact</label>
              <Input
                value={formData.emergencyContact}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContact: e.target.value })
                }
                placeholder="Enter contact name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Emergency Phone</label>
              <Input
                value={formData.emergencyPhone}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyPhone: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Medical History</label>
              <Input
                value={formData.medicalHistory}
                onChange={(e) =>
                  setFormData({ ...formData, medicalHistory: e.target.value })
                }
                placeholder="Enter medical history"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => setEditPatientOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditPatient}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Patient"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                    <p className="text-xs font-normal text-muted-foreground">
                      {quickViewPatient.diagnosis || "No diagnosis"} 
                    </p>
                  </div>
                </>
              )}
            </SheetTitle>
            <SheetDescription>Patient details and information</SheetDescription>
          </SheetHeader>

          {quickViewPatient && (
            <div className="space-y-6 mt-6">
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Age</p>
                    <p className="font-medium">{quickViewPatient.age} years</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gender</p>
                    <p className="font-medium">{quickViewPatient.gender}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Blood Type</p>
                    <p className="font-medium">{quickViewPatient.bloodType || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">DOB</p>
                    <p className="font-medium">{quickViewPatient.dateOfBirth}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{quickViewPatient.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium text-xs truncate">
                      {quickViewPatient.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Heart className="h-4 w-4" />
                  Medical Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Diagnosis</p>
                    <p className="font-medium">{quickViewPatient.diagnosis || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Assigned Doctor</p>
                    <p className="font-medium">{quickViewPatient.assignedDoctor || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ward</p>
                    <p className="font-medium">{quickViewPatient.ward || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Medical History</p>
                    <p className="font-medium">{quickViewPatient.medicalHistory || "None"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4" />
                  Enrollment Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Enrolled Date</p>
                    <p className="font-medium">
                      {format(
                        new Date(quickViewPatient.enrolledAt),
                        "MMM dd, yyyy"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={quickViewPatient.isActive ? "default" : "secondary"}>
                      {quickViewPatient.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this patient? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
