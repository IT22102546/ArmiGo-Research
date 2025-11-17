"use client";

import React, { useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
  Users,
  UserCog,
  CheckCircle2,
  Clock,
  Ban,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Mail,
  Phone,
  Shield,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";

type Doctor = {
  id: string;
  doctorId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  experienceYears: number;
  shift: "Day" | "Night" | "Rotational";
  type: "INTERNAL" | "VISITING";
  status: "ACTIVE" | "PENDING";
  languages: string[];
  joinedDate: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
};

type DoctorStats = {
  total: number;
  active: number;
  pending: number;
  offDuty: number;
  newToday: number;
  newThisWeek: number;
  verified: number;
  unverified: number;
};

const dummyDoctors: Doctor[] = [
  {
    id: "doc-001",
    doctorId: "DOC-2024-001",
    firstName: "Malith",
    lastName: "Fernando",
    email: "malith.fernando@hospital.lk",
    phone: "+94 71 123 4567",
    specialization: "Cardiology",
    department: "Cardiac Care",
    licenseNumber: "SLMC-10231",
    experienceYears: 12,
    shift: "Day",
    type: "INTERNAL",
    status: "ACTIVE",
    languages: ["English", "Sinhala"],
    joinedDate: "2022-04-10",
    emailVerified: true,
    phoneVerified: true,
    twoFactorEnabled: true,
  },
  {
    id: "doc-002",
    doctorId: "DOC-2024-002",
    firstName: "Ishara",
    lastName: "Perera",
    email: "ishara.perera@hospital.lk",
    phone: "+94 76 555 7788",
    specialization: "Neurology",
    department: "Neuro",
    licenseNumber: "SLMC-20456",
    experienceYears: 9,
    shift: "Rotational",
    type: "VISITING",
    status: "ACTIVE",
    languages: ["English", "Sinhala", "Tamil"],
    joinedDate: "2023-01-18",
    emailVerified: true,
    phoneVerified: false,
    twoFactorEnabled: false,
  },
  {
    id: "doc-003",
    doctorId: "DOC-2024-003",
    firstName: "Nipun",
    lastName: "Jayasinghe",
    email: "nipun.j@hospital.lk",
    phone: "+94 77 999 1122",
    specialization: "Pediatrics",
    department: "Pediatrics",
    licenseNumber: "SLMC-33421",
    experienceYears: 5,
    shift: "Night",
    type: "INTERNAL",
    status: "PENDING",
    languages: ["English", "Sinhala"],
    joinedDate: "2024-03-02",
    emailVerified: false,
    phoneVerified: false,
    twoFactorEnabled: false,
  },
];

const dummyStats: DoctorStats = {
  total: 84,
  active: 68,
  pending: 10,
  offDuty: 6,
  newToday: 3,
  newThisWeek: 11,
  verified: 72,
  unverified: 12,
};

const DoctorManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"INTERNAL" | "VISITING">(
    "INTERNAL"
  );
  const [doctors, setDoctors] = useState<Doctor[]>(dummyDoctors);
  const [stats] = useState<DoctorStats>(dummyStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<string | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewDoctor, setQuickViewDoctor] = useState<Doctor | null>(null);
  const [loadingQuickView, setLoadingQuickView] = useState(false);
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [newDoctorForm, setNewDoctorForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialization: "General Medicine",
    department: "General",
    licenseNumber: "",
    experienceYears: 1,
    shift: "Day" as Doctor["shift"],
    type: "INTERNAL" as Doctor["type"],
    languages: "English,Sinhala",
  });

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesTab = doctor.type === activeTab;
    const matchesStatus =
      filterStatus === "all" || doctor.status === filterStatus.toUpperCase();
    const matchesDepartment =
      filterDepartment === "all" || doctor.department === filterDepartment;
    const matchesSearch =
      `${doctor.firstName} ${doctor.lastName} ${doctor.email}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesTab && matchesStatus && matchesDepartment && matchesSearch;
  });

  const openQuickView = (doctor: Doctor) => {
    setLoadingQuickView(true);
    setQuickViewDoctor(doctor);
    setQuickViewOpen(true);
    setTimeout(() => setLoadingQuickView(false), 300);
  };

  const confirmDelete = (doctorId: string) => {
    setDoctorToDelete(doctorId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!doctorToDelete) return;
    setDoctors((prev) => prev.filter((doc) => doc.id !== doctorToDelete));
    setDeleteDialogOpen(false);
    toast.success("Doctor removed");
  };

  const handleAddDoctor = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newDoctor: Doctor = {
      id: `doc-${Date.now()}`,
      doctorId: `DOC-${Date.now()}`,
      firstName: newDoctorForm.firstName || "New",
      lastName: newDoctorForm.lastName || "Doctor",
      email: newDoctorForm.email || "new.doctor@hospital.lk",
      phone: newDoctorForm.phone || "N/A",
      specialization: newDoctorForm.specialization,
      department: newDoctorForm.department,
      licenseNumber: newDoctorForm.licenseNumber || "Pending",
      experienceYears: Number(newDoctorForm.experienceYears) || 0,
      shift: newDoctorForm.shift,
      type: newDoctorForm.type,
      status: "ACTIVE",
      languages: newDoctorForm.languages
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
      joinedDate: new Date().toISOString().split("T")[0],
      emailVerified: true,
      phoneVerified: false,
      twoFactorEnabled: false,
    };

    setDoctors((prev) => [newDoctor, ...prev]);
    setAddDoctorOpen(false);
    toast.success("Doctor added");
  };

  const statusBadge = (status: Doctor["status"]) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 mr-1" /> Active
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
            <Clock className="h-4 w-4 mr-1" /> Pending
          </Badge>
        );
    }
  };

  const verificationBadges = (doctor: Doctor) => (
    <div className="flex gap-2">
      {doctor.emailVerified ? (
        <Badge
          variant="outline"
          className="border-emerald-200 text-emerald-700"
        >
          <Mail className="h-3.5 w-3.5 mr-1" /> Email
        </Badge>
      ) : (
        <Badge variant="outline" className="border-amber-200 text-amber-700">
          <Mail className="h-3.5 w-3.5 mr-1" /> Email
        </Badge>
      )}
      {doctor.phoneVerified ? (
        <Badge
          variant="outline"
          className="border-emerald-200 text-emerald-700"
        >
          <Phone className="h-3.5 w-3.5 mr-1" /> Phone
        </Badge>
      ) : (
        <Badge variant="outline" className="border-amber-200 text-amber-700">
          <Phone className="h-3.5 w-3.5 mr-1" /> Phone
        </Badge>
      )}
      {doctor.twoFactorEnabled ? (
        <Badge variant="outline" className="border-sky-200 text-sky-700">
          <Shield className="h-3.5 w-3.5 mr-1" /> 2FA
        </Badge>
      ) : null}
    </div>
  );

  const departmentOptions = Array.from(
    new Set(doctors.map((doc) => doc.department))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hospital Workforce</p>
          <h1 className="text-2xl font-semibold">Doctor Management</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Data refreshed (demo)")}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setAddDoctorOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Add Doctor
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Doctors</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
              <div className="flex items-center gap-1 text-xs text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" /> +{stats.newThisWeek} this
                week
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">On Duty</p>
              <p className="text-2xl font-semibold">{stats.active}</p>
              <div className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified:{" "}
                {stats.verified}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
              <UserCog className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold">{stats.pending}</p>
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <Clock className="h-3.5 w-3.5" /> {stats.newToday} new today
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Off Duty</p>
              <p className="text-2xl font-semibold">{stats.offDuty}</p>
              <div className="flex items-center gap-1 text-xs text-rose-600">
                <Ban className="h-3.5 w-3.5" /> Unverified: {stats.unverified}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-4">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "INTERNAL" | "VISITING")}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <TabsList className="w-full md:w-auto">
                  <TabsTrigger value="INTERNAL" className="w-full md:w-auto">
                    Internal Doctors
                  </TabsTrigger>
                  <TabsTrigger value="VISITING" className="w-full md:w-auto">
                    Visiting Doctors
                  </TabsTrigger>
                </TabsList>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search doctors"
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterDepartment}
                    onValueChange={setFilterDepartment}
                  >
                    <SelectTrigger className="w-full md:w-44">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {departmentOptions.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="w-full md:w-auto"
                    onClick={() => setAddDoctorOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" /> Add Doctor
                  </Button>
                </div>
              </div>

              <TabsContent value="INTERNAL" className="mt-0">
                <DoctorTable
                  doctors={filteredDoctors.filter((d) => d.type === "INTERNAL")}
                  onQuickView={openQuickView}
                  onDelete={confirmDelete}
                />
              </TabsContent>
              <TabsContent value="VISITING" className="mt-0">
                <DoctorTable
                  doctors={filteredDoctors.filter((d) => d.type === "VISITING")}
                  onQuickView={openQuickView}
                  onDelete={confirmDelete}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <Sheet open={quickViewOpen} onOpenChange={setQuickViewOpen}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Doctor quick view</SheetTitle>
            <SheetDescription>
              Profile, contact, and verification
            </SheetDescription>
          </SheetHeader>
          {loadingQuickView || !quickViewDoctor ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {quickViewDoctor.firstName.charAt(0)}
                    {quickViewDoctor.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">
                      {quickViewDoctor.firstName} {quickViewDoctor.lastName}
                    </p>
                    {statusBadge(quickViewDoctor.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {quickViewDoctor.specialization} �{" "}
                    {quickViewDoctor.department}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    License {quickViewDoctor.licenseNumber}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Doctor ID</p>
                  <p className="font-medium">{quickViewDoctor.doctorId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Shift</p>
                  <p className="font-medium">{quickViewDoctor.shift}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Experience</p>
                  <p className="font-medium">
                    {quickViewDoctor.experienceYears} years
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Languages</p>
                  <p className="font-medium">
                    {quickViewDoctor.languages.join(", ")}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{quickViewDoctor.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{quickViewDoctor.phone}</span>
                </div>
              </div>

              <div>{verificationBadges(quickViewDoctor)}</div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove doctor</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The doctor will be removed from the
              roster.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={addDoctorOpen} onOpenChange={setAddDoctorOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Doctor</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleAddDoctor}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="First name"
                value={newDoctorForm.firstName}
                onChange={(e) =>
                  setNewDoctorForm({
                    ...newDoctorForm,
                    firstName: e.target.value,
                  })
                }
                required
              />
              <Input
                placeholder="Last name"
                value={newDoctorForm.lastName}
                onChange={(e) =>
                  setNewDoctorForm({
                    ...newDoctorForm,
                    lastName: e.target.value,
                  })
                }
                required
              />
              <Input
                placeholder="Email"
                type="email"
                value={newDoctorForm.email}
                onChange={(e) =>
                  setNewDoctorForm({ ...newDoctorForm, email: e.target.value })
                }
                required
              />
              <Input
                placeholder="Phone"
                value={newDoctorForm.phone}
                onChange={(e) =>
                  setNewDoctorForm({ ...newDoctorForm, phone: e.target.value })
                }
              />
              <Input
                placeholder="Specialization"
                value={newDoctorForm.specialization}
                onChange={(e) =>
                  setNewDoctorForm({
                    ...newDoctorForm,
                    specialization: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Department"
                value={newDoctorForm.department}
                onChange={(e) =>
                  setNewDoctorForm({
                    ...newDoctorForm,
                    department: e.target.value,
                  })
                }
              />
              <Input
                placeholder="License number"
                value={newDoctorForm.licenseNumber}
                onChange={(e) =>
                  setNewDoctorForm({
                    ...newDoctorForm,
                    licenseNumber: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Experience (years)"
                type="number"
                min={0}
                value={newDoctorForm.experienceYears}
                onChange={(e) =>
                  setNewDoctorForm({
                    ...newDoctorForm,
                    experienceYears: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                value={newDoctorForm.shift}
                onValueChange={(v) =>
                  setNewDoctorForm({
                    ...newDoctorForm,
                    shift: v as Doctor["shift"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Day">Day</SelectItem>
                  <SelectItem value="Night">Night</SelectItem>
                  <SelectItem value="Rotational">Rotational</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={newDoctorForm.type}
                onValueChange={(v) =>
                  setNewDoctorForm({
                    ...newDoctorForm,
                    type: v as Doctor["type"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL">Internal</SelectItem>
                  <SelectItem value="VISITING">Visiting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Languages (comma separated)"
              value={newDoctorForm.languages}
              onChange={(e) =>
                setNewDoctorForm({
                  ...newDoctorForm,
                  languages: e.target.value,
                })
              }
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDoctorOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const DoctorTable: React.FC<{
  doctors: Doctor[];
  onQuickView: (doctor: Doctor) => void;
  onDelete: (id: string) => void;
}> = ({ doctors, onQuickView, onDelete }) => {
  return (
    <div className="overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Specialization</TableHead>
            <TableHead>Doctor ID</TableHead>
            <TableHead>Shift</TableHead>
            <TableHead>Verification</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-14 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {doctors.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="text-center text-muted-foreground"
              >
                No doctors found
              </TableCell>
            </TableRow>
          ) : (
            doctors.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>
                        {doctor.firstName.charAt(0)}
                        {doctor.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {doctor.firstName} {doctor.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doctor.type}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{doctor.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{doctor.phone}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{doctor.department}</TableCell>
                <TableCell>{doctor.specialization}</TableCell>
                <TableCell>{doctor.doctorId}</TableCell>
                <TableCell>{doctor.shift}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap text-xs">
                    {doctor.emailVerified ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 text-emerald-700"
                      >
                        <Mail className="h-3 w-3 mr-1" /> Email
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-200 text-amber-700"
                      >
                        <Mail className="h-3 w-3 mr-1" /> Email
                      </Badge>
                    )}
                    {doctor.phoneVerified ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 text-emerald-700"
                      >
                        <Phone className="h-3 w-3 mr-1" /> Phone
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-200 text-amber-700"
                      >
                        <Phone className="h-3 w-3 mr-1" /> Phone
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {doctor.status === "ACTIVE" ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onQuickView(doctor)}>
                        <Eye className="h-4 w-4 mr-2" /> Quick view
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(doctor.id)}
                        className="text-rose-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DoctorManagement;
