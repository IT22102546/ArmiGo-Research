"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Users,
  BedSingle,
  Stethoscope,
  Activity,
  GroupIcon,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  MonitorSmartphone,
} from "lucide-react";
import { toast } from "sonner";

type AdmissionType = "all" | "inpatient" | "outpatient" | "rehab";

interface Admission {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  diagnosis: string;
  admissionType: "inpatient" | "outpatient" | "rehab";
  clinic: string;
  doctor: string;
  room?: string;
  admissionDate: string;
  status: "active" | "pending" | "discharged";
  devicesConnected: number;
  lastUpdate: string;
  notes?: string;
}

// Dummy data
const dummyAdmissions: Admission[] = [
  {
    id: "ADM-001",
    patientId: "P-001",
    patientName: "Lihini Perera",
    age: 8,
    diagnosis: "Left Hemiplegia",
    admissionType: "rehab",
    clinic: "Pediatric Neuro Rehab",
    doctor: "Dr. Nimal Silva",
    admissionDate: "2024-03-15",
    status: "active",
    devicesConnected: 2,
    lastUpdate: "2024-03-20T10:30:00",
    notes: "Regular therapy sessions, good progress with upper limb exercises",
  },
  {
    id: "ADM-002",
    patientId: "P-002",
    patientName: "Kavin Jayasekara",
    age: 10,
    diagnosis: "Right Hemiplegia",
    admissionType: "inpatient",
    clinic: "Gait & Balance Lab",
    doctor: "Dr. Priya Fernando",
    room: "Ward-A, Bed 12",
    admissionDate: "2024-03-18",
    status: "active",
    devicesConnected: 3,
    lastUpdate: "2024-03-20T14:15:00",
    notes: "Post-surgery rehabilitation, requires intensive monitoring",
  },
  {
    id: "ADM-003",
    patientId: "P-003",
    patientName: "Anya de Silva",
    age: 7,
    diagnosis: "Bilateral Motor Delay",
    admissionType: "outpatient",
    clinic: "Assistive Play Clinic",
    doctor: "Dr. Sunil Wijesinghe",
    admissionDate: "2024-03-10",
    status: "active",
    devicesConnected: 1,
    lastUpdate: "2024-03-20T09:00:00",
    notes: "Weekly sessions, showing improvement in fine motor skills",
  },
  {
    id: "ADM-004",
    patientId: "P-004",
    patientName: "Dineth Bandara",
    age: 9,
    diagnosis: "Cerebral Palsy - Spastic Hemiplegia",
    admissionType: "inpatient",
    clinic: "Pediatric Neuro Rehab",
    doctor: "Dr. Nimal Silva",
    room: "Ward-B, Bed 5",
    admissionDate: "2024-03-12",
    status: "active",
    devicesConnected: 2,
    lastUpdate: "2024-03-20T11:45:00",
    notes: "Intensive therapy program, good response to gamified exercises",
  },
  {
    id: "ADM-005",
    patientId: "P-005",
    patientName: "Sithumi Rajapaksa",
    age: 6,
    diagnosis: "Left Hemiplegia - Stroke Recovery",
    admissionType: "outpatient",
    clinic: "Gait & Balance Lab",
    doctor: "Dr. Priya Fernando",
    admissionDate: "2024-02-28",
    status: "active",
    devicesConnected: 1,
    lastUpdate: "2024-03-20T08:30:00",
    notes: "Bi-weekly sessions, significant progress in gait training",
  },
  {
    id: "ADM-006",
    patientId: "P-006",
    patientName: "Ravindu Dissanayake",
    age: 11,
    diagnosis: "Right Hemiplegia",
    admissionType: "rehab",
    clinic: "Assistive Play Clinic",
    doctor: "Dr. Sunil Wijesinghe",
    admissionDate: "2024-03-05",
    status: "pending",
    devicesConnected: 0,
    lastUpdate: "2024-03-19T16:00:00",
    notes: "Waiting for device calibration",
  },
];

const clinics = [
  "Pediatric Neuro Rehab",
  "Gait & Balance Lab",
  "Assistive Play Clinic",
  "Upper Limb Therapy Center",
  "Motor Skills Development Unit",
];

const doctors = [
  "Dr. Nimal Silva",
  "Dr. Priya Fernando",
  "Dr. Sunil Wijesinghe",
  "Dr. Chamari Perera",
  "Dr. Rohan Gunasekara",
];

const availablePatients = [
  { id: "P-007", name: "Nethmi Kumari", age: 8, diagnosis: "Left Hemiplegia" },
  {
    id: "P-008",
    name: "Dasun Liyanage",
    age: 9,
    diagnosis: "Right Hemiplegia",
  },
  { id: "P-009", name: "Ishara Mendis", age: 7, diagnosis: "Cerebral Palsy" },
];

export default function EnrollmentsPage() {
  const [activeTab, setActiveTab] = useState<AdmissionType>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clinicFilter, setClinicFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    patientId: "",
    admissionType: "",
    clinic: "",
    doctor: "",
    room: "",
    admissionDate: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  // Filter admissions
  const filteredAdmissions = dummyAdmissions.filter((admission) => {
    const matchesTab =
      activeTab === "all" || admission.admissionType === activeTab;
    const matchesSearch =
      admission.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admission.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admission.doctor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || admission.status === statusFilter;
    const matchesClinic =
      clinicFilter === "all" || admission.clinic === clinicFilter;

    return matchesTab && matchesSearch && matchesStatus && matchesClinic;
  });

  // Calculate stats
  const stats = {
    totalAdmissions: dummyAdmissions.length,
    inpatientCount: dummyAdmissions.filter(
      (a) => a.admissionType === "inpatient"
    ).length,
    outpatientCount: dummyAdmissions.filter(
      (a) => a.admissionType === "outpatient"
    ).length,
    rehabCount: dummyAdmissions.filter((a) => a.admissionType === "rehab")
      .length,
  };

  // Pagination
  const totalPages = Math.ceil(filteredAdmissions.length / itemsPerPage);
  const paginatedAdmissions = filteredAdmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value as AdmissionType);
    setCurrentPage(1);
  };

  const handleCreateAdmission = () => {
    if (
      !formData.patientId ||
      !formData.admissionType ||
      !formData.clinic ||
      !formData.doctor
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    toast.success("Admission created successfully!");
    setIsCreateDialogOpen(false);
    setFormData({
      patientId: "",
      admissionType: "",
      clinic: "",
      doctor: "",
      room: "",
      admissionDate: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      pending: "secondary",
      discharged: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setClinicFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 p-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GroupIcon className="h-8 w-8" />
            Patient Admission Management
          </h1>
          <p className="text-muted-foreground">
            Manage patient admissions and clinic assignments for pediatric
            hemiplegia rehabilitation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Refreshed")}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Admission
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className={`cursor-pointer transition-all ${
            activeTab === "all" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => handleTabChange("all")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Admissions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdmissions}</div>
            <p className="text-xs text-muted-foreground">All admission types</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            activeTab === "inpatient" ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() => handleTabChange("inpatient")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inpatient</CardTitle>
            <BedSingle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.inpatientCount}
            </div>
            <p className="text-xs text-muted-foreground">Admitted patients</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            activeTab === "outpatient" ? "ring-2 ring-purple-500" : ""
          }`}
          onClick={() => handleTabChange("outpatient")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outpatient</CardTitle>
            <Stethoscope className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.outpatientCount}
            </div>
            <p className="text-xs text-muted-foreground">Regular visits</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            activeTab === "rehab" ? "ring-2 ring-orange-500" : ""
          }`}
          onClick={() => handleTabChange("rehab")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rehabilitation
            </CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.rehabCount}
            </div>
            <p className="text-xs text-muted-foreground">Therapy programs</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation & Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Admissions
            </CardTitle>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="all" className="gap-2">
                  <Users className="h-4 w-4" />
                  All
                </TabsTrigger>
                <TabsTrigger value="inpatient" className="gap-2">
                  <BedSingle className="h-4 w-4" />
                  Inpatient
                </TabsTrigger>
                <TabsTrigger value="outpatient" className="gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Outpatient
                </TabsTrigger>
                <TabsTrigger value="rehab" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Rehab
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient, diagnosis, or doctor..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="discharged">Discharged</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={clinicFilter}
              onValueChange={(value) => {
                setClinicFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Clinics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clinics</SelectItem>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic} value={clinic}>
                    {clinic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Admissions</CardTitle>
          <CardDescription>
            {filteredAdmissions.length} admission(s) found • Showing page{" "}
            {currentPage} of {totalPages || 1}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Admission Type</TableHead>
                <TableHead>Clinic</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Room/Bed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Devices</TableHead>
                <TableHead>Last Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAdmissions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No admissions found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAdmissions.map((admission) => (
                  <TableRow key={admission.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {admission.patientName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Age {admission.age} • {admission.diagnosis}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="capitalize">
                        {admission.admissionType}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(
                          new Date(admission.admissionDate),
                          "MMM dd, yyyy"
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{admission.clinic}</TableCell>
                    <TableCell>{admission.doctor}</TableCell>
                    <TableCell>
                      {admission.room || (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(admission.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MonitorSmartphone className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">
                          {admission.devicesConnected}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(admission.lastUpdate), "MMM dd, HH:mm")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredAdmissions.length
                )}{" "}
                of {filteredAdmissions.length} admissions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Admission Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GroupIcon className="h-5 w-5" />
              Create New Admission
            </DialogTitle>
            <DialogDescription>
              Add a patient to a clinic and assign monitoring devices for
              rehabilitation therapy
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="patient">
                Patient <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.patientId}
                onValueChange={(value) =>
                  setFormData({ ...formData, patientId: value })
                }
              >
                <SelectTrigger id="patient">
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {availablePatients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} - Age {patient.age} ({patient.diagnosis})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="admissionType">
                  Admission Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.admissionType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, admissionType: value })
                  }
                >
                  <SelectTrigger id="admissionType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inpatient">Inpatient</SelectItem>
                    <SelectItem value="outpatient">Outpatient</SelectItem>
                    <SelectItem value="rehab">Rehabilitation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="admissionDate">
                  Admission Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="admissionDate"
                  type="date"
                  value={formData.admissionDate}
                  onChange={(e) =>
                    setFormData({ ...formData, admissionDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="clinic">
                Clinic Assignment <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.clinic}
                onValueChange={(value) =>
                  setFormData({ ...formData, clinic: value })
                }
              >
                <SelectTrigger id="clinic">
                  <SelectValue placeholder="Select a clinic" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic} value={clinic}>
                      {clinic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="doctor">
                  Assigned Doctor <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.doctor}
                  onValueChange={(value) =>
                    setFormData({ ...formData, doctor: value })
                  }
                >
                  <SelectTrigger id="doctor">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor} value={doctor}>
                        {doctor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="room">Room/Bed Number</Label>
                <Input
                  id="room"
                  placeholder="e.g., Ward-A, Bed 12"
                  value={formData.room}
                  onChange={(e) =>
                    setFormData({ ...formData, room: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Initial Assessment Notes</Label>
              <textarea
                id="notes"
                placeholder="Enter initial assessment, therapy goals, or special requirements..."
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAdmission}>
              <Plus className="h-4 w-4 mr-2" />
              Create Admission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
