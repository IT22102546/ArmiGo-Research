"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  BedSingle,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Filter,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  UserCircle,
  XCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type AssignmentStatus = "active" | "inactive";

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  phone: string;
  specialty: string;
  avatar?: string;
}

interface ServiceLine {
  id: string;
  name: string;
  focus: string;
}

interface Unit {
  id: string;
  name: string;
  location: string;
}

interface Shift {
  id: string;
  label: string;
  window: string;
}

interface Assignment {
  id: string;
  doctorId: string;
  serviceLineId: string;
  unitId: string;
  shiftId: string;
  maxDailyPatients: number;
  status: AssignmentStatus;
}

interface DoctorGroup {
  doctor: Doctor;
  assignments: Assignment[];
  activeCount: number;
  inactiveCount: number;
  serviceLines: Set<string>;
  units: Set<string>;
}

const doctors: Doctor[] = [
  {
    id: "doc-1",
    firstName: "Malithi",
    lastName: "Jayasinghe",
    employeeId: "EMP-2210",
    email: "malithi.j@cityhospital.lk",
    phone: "+94 77 123 4567",
    specialty: "Pediatric Neurology",
  },
  {
    id: "doc-2",
    firstName: "Nuwan",
    lastName: "Samarasinghe",
    employeeId: "EMP-1875",
    email: "nuwan.s@cityhospital.lk",
    phone: "+94 76 987 6543",
    specialty: "Orthopedic Surgery",
  },
  {
    id: "doc-3",
    firstName: "Ishara",
    lastName: "Peris",
    employeeId: "EMP-1992",
    email: "ishara.p@cityhospital.lk",
    phone: "+94 71 222 3344",
    specialty: "Emergency Medicine",
  },
];

const serviceLines: ServiceLine[] = [
  { id: "svc-1", name: "Neurology", focus: "Stroke and rehab" },
  { id: "svc-2", name: "Orthopedics", focus: "Trauma and joints" },
  { id: "svc-3", name: "Emergency", focus: "Acute care" },
];

const units: Unit[] = [
  { id: "unit-1", name: "Neuro Ward", location: "Level 5" },
  { id: "unit-2", name: "Ortho Ward", location: "Level 4" },
  { id: "unit-3", name: "Emergency Unit", location: "Ground" },
];

const shifts: Shift[] = [
  { id: "shift-1", label: "Morning", window: "07:00 - 13:00" },
  { id: "shift-2", label: "Evening", window: "13:00 - 19:00" },
  { id: "shift-3", label: "Night", window: "19:00 - 07:00" },
];

const initialAssignments: Assignment[] = [
  {
    id: "asg-1",
    doctorId: "doc-1",
    serviceLineId: "svc-1",
    unitId: "unit-1",
    shiftId: "shift-1",
    maxDailyPatients: 12,
    status: "active",
  },
  {
    id: "asg-2",
    doctorId: "doc-2",
    serviceLineId: "svc-2",
    unitId: "unit-2",
    shiftId: "shift-2",
    maxDailyPatients: 10,
    status: "active",
  },
  {
    id: "asg-3",
    doctorId: "doc-3",
    serviceLineId: "svc-3",
    unitId: "unit-3",
    shiftId: "shift-3",
    maxDailyPatients: 18,
    status: "inactive",
  },
];

export default function DoctorAssignmentsPage() {
  const [assignments, setAssignments] =
    useState<Assignment[]>(initialAssignments);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [expandedDoctors, setExpandedDoctors] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [shiftFilter, setShiftFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    doctorId: "",
    serviceLineId: "",
    unitId: "",
    shiftId: "",
    maxDailyPatients: 12,
    status: "active" as AssignmentStatus,
  });

  const isLoading = false;

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesStatus =
        statusFilter === "all" ? true : assignment.status === statusFilter;
      const matchesService =
        serviceFilter === "all"
          ? true
          : assignment.serviceLineId === serviceFilter;
      const matchesUnit =
        unitFilter === "all" ? true : assignment.unitId === unitFilter;
      const matchesShift =
        shiftFilter === "all" ? true : assignment.shiftId === shiftFilter;
      return matchesStatus && matchesService && matchesUnit && matchesShift;
    });
  }, [assignments, statusFilter, serviceFilter, unitFilter, shiftFilter]);

  const doctorGroups = useMemo(() => {
    const groups: Map<string, DoctorGroup> = new Map();

    filteredAssignments.forEach((assignment) => {
      const doctor = doctors.find((d) => d.id === assignment.doctorId);
      if (!doctor) return;

      if (!groups.has(doctor.id)) {
        groups.set(doctor.id, {
          doctor,
          assignments: [],
          activeCount: 0,
          inactiveCount: 0,
          serviceLines: new Set(),
          units: new Set(),
        });
      }

      const group = groups.get(doctor.id);
      if (!group) return;
      group.assignments.push(assignment);
      if (assignment.status === "active") group.activeCount += 1;
      else group.inactiveCount += 1;

      const service = serviceLines.find(
        (s) => s.id === assignment.serviceLineId
      );
      const unit = units.find((u) => u.id === assignment.unitId);
      if (service) group.serviceLines.add(service.name);
      if (unit) group.units.add(unit.name);
    });

    let result = Array.from(groups.values());

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((group) => {
        const name =
          `${group.doctor.firstName} ${group.doctor.lastName}`.toLowerCase();
        const employeeId = group.doctor.employeeId.toLowerCase();
        const email = group.doctor.email.toLowerCase();
        const phone = group.doctor.phone.toLowerCase();
        return (
          name.includes(query) ||
          employeeId.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          group.doctor.specialty.toLowerCase().includes(query)
        );
      });
    }

    return result.sort((a, b) => {
      const nameA = `${a.doctor.firstName} ${a.doctor.lastName}`.toLowerCase();
      const nameB = `${b.doctor.firstName} ${b.doctor.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [filteredAssignments, searchQuery]);

  const stats = useMemo(() => {
    const total = assignments.length;
    const active = assignments.filter((a) => a.status === "active").length;
    const inactive = assignments.filter((a) => a.status === "inactive").length;
    const uniqueDoctors = new Set(assignments.map((a) => a.doctorId)).size;
    return { total, active, inactive, doctors: uniqueDoctors };
  }, [assignments]);

  const toggleDoctor = (doctorId: string) => {
    setExpandedDoctors((prev) => {
      const next = new Set(prev);
      if (next.has(doctorId)) next.delete(doctorId);
      else next.add(doctorId);
      return next;
    });
  };

  const expandAll = () =>
    setExpandedDoctors(new Set(doctorGroups.map((g) => g.doctor.id)));
  const collapseAll = () => setExpandedDoctors(new Set());

  const handleOpenDialog = (assignment?: Assignment, doctorId?: string) => {
    if (assignment) {
      setSelectedAssignment(assignment);
      setFormData({
        doctorId: assignment.doctorId,
        serviceLineId: assignment.serviceLineId,
        unitId: assignment.unitId,
        shiftId: assignment.shiftId,
        maxDailyPatients: assignment.maxDailyPatients,
        status: assignment.status,
      });
    } else {
      setSelectedAssignment(null);
      setFormData({
        doctorId: doctorId || "",
        serviceLineId: "",
        unitId: "",
        shiftId: "",
        maxDailyPatients: 12,
        status: "active",
      });
    }
    setDialogOpen(true);
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setSelectedAssignment(null);
    setFormData({
      doctorId: "",
      serviceLineId: "",
      unitId: "",
      shiftId: "",
      maxDailyPatients: 12,
      status: "active",
    });
  };

  const handleSubmit = () => {
    if (
      !formData.doctorId ||
      !formData.serviceLineId ||
      !formData.unitId ||
      !formData.shiftId
    ) {
      return;
    }

    if (selectedAssignment) {
      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === selectedAssignment.id
            ? { ...assignment, ...formData }
            : assignment
        )
      );
    } else {
      setAssignments((prev) => [
        ...prev,
        {
          id: `asg-${Date.now()}`,
          ...formData,
        },
      ]);
    }

    resetDialog();
  };

  const handleDelete = () => {
    if (!selectedAssignment) return;
    setAssignments((prev) =>
      prev.filter((assignment) => assignment.id !== selectedAssignment.id)
    );
    setDeleteDialogOpen(false);
    setSelectedAssignment(null);
  };

  const duplicateAssignment = (assignment: Assignment) => {
    setSelectedAssignment(null);
    setFormData({
      doctorId: assignment.doctorId,
      serviceLineId: assignment.serviceLineId,
      unitId: assignment.unitId,
      shiftId: "",
      maxDailyPatients: assignment.maxDailyPatients,
      status: "active",
    });
    setDialogOpen(true);
  };

  const toggleStatus = (assignment: Assignment, status: AssignmentStatus) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignment.id ? { ...a, status } : a))
    );
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const findService = (id: string) => serviceLines.find((s) => s.id === id);
  const findUnit = (id: string) => units.find((u) => u.id === id);
  const findShift = (id: string) => shifts.find((s) => s.id === id);

  const handleCloseDialog = () => {
    resetDialog();
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              Doctor Assignments
            </h1>
            <p className="text-muted-foreground mt-1">
              Map doctors to service lines, wards, and shifts with capacity
              controls.
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create Assignment
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Assignments
                  </p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Assignments
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.active}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Inactive Assignments
                  </p>
                  <p className="text-3xl font-bold text-gray-500">
                    {stats.inactive}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Assigned Doctors
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.doctors}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 gap-4 w-full sm:w-auto">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search doctors by name, ID, specialty, email, or phone"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={expandAll}>
                    Expand All
                  </Button>
                  <Button variant="outline" size="sm" onClick={collapseAll}>
                    Collapse All
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Select
                  value={statusFilter}
                  onValueChange={(v) =>
                    setStatusFilter(v as "all" | "active" | "inactive")
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={serviceFilter}
                  onValueChange={(v) => setServiceFilter(v)}
                >
                  <SelectTrigger className="w-[160px]">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {serviceLines.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={unitFilter}
                  onValueChange={(v) => setUnitFilter(v)}
                >
                  <SelectTrigger className="w-[150px]">
                    <BedSingle className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Units</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={shiftFilter}
                  onValueChange={(v) => setShiftFilter(v)}
                >
                  <SelectTrigger className="w-[150px]">
                    <CalendarClock className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Shifts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shifts</SelectItem>
                    {shifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {shift.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(statusFilter !== "all" ||
                  serviceFilter !== "all" ||
                  unitFilter !== "all" ||
                  shiftFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("all");
                      setServiceFilter("all");
                      setUnitFilter("all");
                      setShiftFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teacher-wise Assignment List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Loading assignments...
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : doctorGroups.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Assignments Found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ||
                    statusFilter !== "all" ||
                    serviceFilter !== "all" ||
                    unitFilter !== "all" ||
                    shiftFilter !== "all"
                      ? "No assignments match your search criteria"
                      : "Get started by creating your first doctor assignment"}
                  </p>
                  {!searchQuery &&
                    statusFilter === "all" &&
                    serviceFilter === "all" &&
                    unitFilter === "all" &&
                    shiftFilter === "all" && (
                      <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Assignment
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          ) : (
            doctorGroups.map((group) => (
              <Collapsible
                key={group.doctor.id}
                open={expandedDoctors.has(group.doctor.id)}
                onOpenChange={() => toggleDoctor(group.doctor.id)}
              >
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {expandedDoctors.has(group.doctor.id) ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={group.doctor.avatar} />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {getInitials(
                                  group.doctor.firstName,
                                  group.doctor.lastName
                                )}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                              {group.doctor.firstName} {group.doctor.lastName}
                              {group.doctor.employeeId && (
                                <Badge
                                  variant="outline"
                                  className="font-mono text-xs"
                                >
                                  {group.doctor.employeeId}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                              {group.doctor.email && (
                                <span className="flex items-center gap-1 text-xs">
                                  <Mail className="h-3 w-3" />
                                  {group.doctor.email}
                                </span>
                              )}
                              {group.doctor.phone && (
                                <span className="flex items-center gap-1 text-xs">
                                  <Phone className="h-3 w-3" />
                                  {group.doctor.phone}
                                </span>
                              )}
                              {group.doctor.specialty && (
                                <Badge variant="secondary" className="text-xs">
                                  <Stethoscope className="h-3 w-3 mr-1" />
                                  {group.doctor.specialty}
                                </Badge>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden md:flex flex-wrap gap-1 max-w-xs">
                            {Array.from(group.serviceLines)
                              .slice(0, 3)
                              .map((service) => (
                                <Badge
                                  key={service}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {service}
                                </Badge>
                              ))}
                            {group.serviceLines.size > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{group.serviceLines.size - 3} more
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Badge
                              variant="default"
                              className="bg-green-100 text-green-700 hover:bg-green-100"
                            >
                              {group.activeCount} Active
                            </Badge>
                            {group.inactiveCount > 0 && (
                              <Badge variant="secondary">
                                {group.inactiveCount} Inactive
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(undefined, group.doctor.id);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Separator />
                    <CardContent className="pt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service Line</TableHead>
                            <TableHead>Unit / Ward</TableHead>
                            <TableHead>Shift</TableHead>
                            <TableHead>Max Daily Patients</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.assignments.map((assignment) => {
                            const service = findService(
                              assignment.serviceLineId
                            );
                            const unit = findUnit(assignment.unitId);
                            const shift = findShift(assignment.shiftId);
                            return (
                              <TableRow
                                key={assignment.id}
                                className={cn(
                                  assignment.status === "inactive" &&
                                    "opacity-60"
                                )}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium">
                                        {service?.name}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {service?.focus}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <BedSingle className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium">
                                        {unit?.name}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {unit?.location}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium">
                                        {shift?.label}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {shift?.window}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                                    {assignment.maxDailyPatients}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={assignment.status === "active"}
                                      onCheckedChange={(checked) =>
                                        toggleStatus(
                                          assignment,
                                          checked ? "active" : "inactive"
                                        )
                                      }
                                    />
                                    <span className="text-sm text-muted-foreground">
                                      {assignment.status === "active"
                                        ? "Active"
                                        : "Inactive"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleOpenDialog(assignment)
                                        }
                                      >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit Assignment
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          duplicateAssignment(assignment)
                                        }
                                      >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Duplicate for Another Unit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => {
                                          setSelectedAssignment(assignment);
                                          setDeleteDialogOpen(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                {selectedAssignment
                  ? "Edit Assignment"
                  : "Create New Assignment"}
              </DialogTitle>
              <DialogDescription>
                {selectedAssignment
                  ? "Update the assignment details below"
                  : "Assign a doctor to a service line, unit, and shift combination"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>
                  Doctor <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.doctorId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, doctorId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        <div className="flex items-center gap-2">
                          <span>
                            {doctor.firstName} {doctor.lastName}
                          </span>
                          {doctor.employeeId && (
                            <span className="text-muted-foreground text-xs">
                              ({doctor.employeeId})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Service Line <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.serviceLineId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, serviceLineId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service line" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceLines.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <div>
                            <div>{service.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {service.focus}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Unit/Ward <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.unitId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, unitId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          <div>
                            <div>{unit.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {unit.location}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Shift <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.shiftId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, shiftId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {shifts.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id}>
                          <div>
                            <div>{shift.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {shift.window}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Daily Patients</Label>
                  <Input
                    type="number"
                    value={formData.maxDailyPatients}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDailyPatients: parseInt(e.target.value) || 20,
                      })
                    }
                    placeholder="20"
                    min={1}
                    max={100}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                <div className="space-y-0.5">
                  <Label className="font-medium">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive assignments won't be available for patient
                    scheduling
                  </p>
                </div>
                <Switch
                  checked={formData.status === "active"}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      status: checked ? "active" : "inactive",
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {selectedAssignment ? "Update Assignment" : "Create Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Delete Assignment
              </DialogTitle>
              <DialogDescription className="pt-2">
                Are you sure you want to delete this assignment?
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
                  <p>
                    <strong>Doctor:</strong>{" "}
                    {
                      doctors.find((d) => d.id === selectedAssignment?.doctorId)
                        ?.firstName
                    }{" "}
                    {
                      doctors.find((d) => d.id === selectedAssignment?.doctorId)
                        ?.lastName
                    }
                  </p>
                  <p>
                    <strong>Service Line:</strong>{" "}
                    {
                      serviceLines.find(
                        (s) => s.id === selectedAssignment?.serviceLineId
                      )?.name
                    }
                  </p>
                  <p>
                    <strong>Unit/Ward:</strong>{" "}
                    {
                      units.find((u) => u.id === selectedAssignment?.unitId)
                        ?.name
                    }
                  </p>
                  <p>
                    <strong>Shift:</strong>{" "}
                    {
                      shifts.find((s) => s.id === selectedAssignment?.shiftId)
                        ?.label
                    }
                  </p>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  This action cannot be undone.
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSelectedAssignment(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
