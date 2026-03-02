"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Power, Eye } from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  age?: number;
  diagnosis?: string;
  assignedDoctor?: string;
  hospitalId?: string | null;
  hospital?: { id: string; name: string } | null;
};

type Physiotherapist = {
  id: string;
  name: string;
  hospitalId?: string | null;
  isActive?: boolean;
  hospital?: { id: string; name: string } | null;
};

type Hospital = {
  id: string;
  name: string;
  status?: string;
};

type SessionRecord = {
  id: string;
  childId: string;
  physiotherapistId?: string | null;
  hospitalId?: string | null;
  admissionDate: string;
  startTime?: string | null;
  endTime?: string | null;
  status: string;
  notes?: string | null;
  clinic?: string | null;
  room?: string | null;
  child?: {
    id: string;
    firstName: string;
    lastName: string;
    diagnosis?: string;
    assignedDoctor?: string;
  };
  physiotherapist?: {
    id: string;
    name: string;
  } | null;
  hospital?: {
    id: string;
    name: string;
  } | null;
};

type SessionForm = {
  childId: string;
  physiotherapistId: string;
  hospitalId: string;
  admissionDate: string;
  startTime: string;
  endTime: string;
  status: string;
  clinic: string;
  room: string;
  notes: string;
};

const initialForm: SessionForm = {
  childId: "",
  physiotherapistId: "",
  hospitalId: "",
  admissionDate: new Date().toISOString().split("T")[0],
  startTime: "",
  endTime: "",
  status: "ACTIVE",
  clinic: "",
  room: "",
  notes: "",
};

export default function EnrollmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingSession, setViewingSession] = useState<SessionRecord | null>(null);
  const [selected, setSelected] = useState<SessionRecord | null>(null);
  const [formData, setFormData] = useState<SessionForm>(initialForm);

  const { data: children = [] } = useQuery({
    queryKey: ["session-scheduling", "children"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/patients", {
        params: { limit: 1000 },
      });
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload || [];
      return Array.isArray(list) ? list : [];
    },
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: ["session-scheduling", "hospitals"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/patients/locations/hospitals");
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload || [];
      return Array.isArray(list) ? list : [];
    },
  });

  const { data: physiotherapists = [] } = useQuery({
    queryKey: ["session-scheduling", "physiotherapists"],
    queryFn: async () => {
      const response = await ApiClient.get<any>(
        "/patients/locations/physiotherapists",
        { params: { includeInactive: true } }
      );
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload || [];
      return Array.isArray(list) ? list : [];
    },
  });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["session-scheduling", "records", search, statusFilter],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/patients/management/admissions", {
        params: {
          search: search || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        },
      });
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload || [];
      return Array.isArray(list) ? list : [];
    },
  });

  const filteredPhysiotherapists = useMemo(() => {
    if (!formData.hospitalId) return physiotherapists;
    return physiotherapists.filter(
      (item: Physiotherapist) => item.hospitalId === formData.hospitalId
    );
  }, [physiotherapists, formData.hospitalId]);

  const createMutation = useMutation({
    mutationFn: (payload: any) =>
      ApiClient.post("/patients/management/admissions", payload),
    onSuccess: () => {
      toast.success("Session added successfully");
      queryClient.invalidateQueries({ queryKey: ["session-scheduling"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add session");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      ApiClient.put(`/patients/management/admissions/${id}`, payload),
    onSuccess: () => {
      toast.success("Session updated successfully");
      queryClient.invalidateQueries({ queryKey: ["session-scheduling"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update session");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      ApiClient.delete(`/patients/management/admissions/${id}`),
    onSuccess: () => {
      toast.success("Session deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["session-scheduling"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete session");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ApiClient.put(`/patients/management/admissions/${id}/status`, { status }),
    onSuccess: () => {
      toast.success("Session status updated");
      queryClient.invalidateQueries({ queryKey: ["session-scheduling"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update session status");
    },
  });

  const handleOpenCreate = () => {
    setSelected(null);
    setFormData(initialForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (record: SessionRecord) => {
    setSelected(record);
    setFormData({
      childId: record.childId || "",
      physiotherapistId: record.physiotherapistId || "",
      hospitalId: record.hospitalId || "",
      admissionDate: record.admissionDate
        ? new Date(record.admissionDate).toISOString().split("T")[0]
        : initialForm.admissionDate,
      startTime: record.startTime || "",
      endTime: record.endTime || "",
      status: record.status || "ACTIVE",
      clinic: record.clinic || "",
      room: record.room || "",
      notes: record.notes || "",
    });
    setDialogOpen(true);
  };

  const handleOpenView = (record: SessionRecord) => {
    setViewingSession(record);
    setViewDialogOpen(true);
  };

  const handleCloseView = () => {
    setViewDialogOpen(false);
    setViewingSession(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelected(null);
    setFormData(initialForm);
  };

  const handleChildSelection = (childId: string) => {
    const selectedChild = children.find((child: Child) => child.id === childId);

    let matchedPhysiotherapistId = "";
    if (selectedChild?.assignedDoctor) {
      const matched = physiotherapists.find((physio: Physiotherapist) => {
        const sameName =
          physio.name?.trim().toLowerCase() ===
          selectedChild.assignedDoctor?.trim().toLowerCase();

        if (!sameName) return false;
        if (selectedChild.hospitalId && physio.hospitalId) {
          return physio.hospitalId === selectedChild.hospitalId;
        }
        return true;
      });

      matchedPhysiotherapistId = matched?.id || "";
    }

    setFormData((prev) => ({
      ...prev,
      childId,
      hospitalId: selectedChild?.hospitalId || prev.hospitalId,
      physiotherapistId: matchedPhysiotherapistId || prev.physiotherapistId,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !formData.childId ||
      !formData.hospitalId ||
      !formData.admissionDate ||
      !formData.startTime ||
      !formData.endTime
    ) {
      toast.error("Child, hospital, date, start time and end time are required");
      return;
    }

    const payload = {
      childId: formData.childId,
      hospitalId: formData.hospitalId,
      physiotherapistId: formData.physiotherapistId || undefined,
      admissionDate: formData.admissionDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      status: formData.status,
      clinic: formData.clinic || undefined,
      room: formData.room || undefined,
      notes: formData.notes || undefined,
      admissionType: "REHAB",
    };

    if (selected) {
      updateMutation.mutate({ id: selected.id, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Patients & Physiotherapy</p>
          <h1 className="text-2xl font-semibold">Session Scheduling</h1>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Session
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Child Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search child, hospital, physiotherapist..."
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="DISCHARGED">Discharged</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Child</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Physiotherapist</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Loading sessions...
                    </TableCell>
                  </TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No sessions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((record: SessionRecord) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.child
                          ? `${record.child.firstName} ${record.child.lastName}`
                          : "-"}
                      </TableCell>
                      <TableCell>{record.hospital?.name || "-"}</TableCell>
                      <TableCell>{record.physiotherapist?.name || "-"}</TableCell>
                      <TableCell>
                        {new Date(record.admissionDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{record.startTime || "-"}</TableCell>
                      <TableCell>{record.endTime || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === "ACTIVE"
                              ? "default"
                              : record.status === "PENDING"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenView(record)}
                            title="View session"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              statusMutation.mutate({
                                id: record.id,
                                status:
                                  record.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                              })
                            }
                            title={
                              record.status === "ACTIVE"
                                ? "Mark inactive"
                                : "Mark active"
                            }
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(record)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(record.id)}
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
        <DialogContent className="w-[95vw] sm:max-w-2xl h-[90dvh] max-h-[90dvh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle>{selected ? "Update Session" : "Add Session"}</DialogTitle>
          </DialogHeader>

          <form
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 px-6 pb-6 pt-4"
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Child</Label>
                <Select value={formData.childId} onValueChange={handleChildSelection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child: Child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.firstName} {child.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Hospital</Label>
                <Select
                  value={formData.hospitalId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      hospitalId: value === "__NONE__" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">None</SelectItem>
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
                    setFormData((prev) => ({
                      ...prev,
                      physiotherapistId: value === "__NONE__" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select physiotherapist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">None</SelectItem>
                    {filteredPhysiotherapists.map((physio: Physiotherapist) => (
                      <SelectItem key={physio.id} value={physio.id}>
                        {physio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.admissionDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, admissionDate: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="DISCHARGED">Discharged</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Clinic</Label>
                <Input
                  value={formData.clinic}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, clinic: e.target.value }))
                  }
                  placeholder="Clinic name"
                />
              </div>

              <div className="space-y-2">
                <Label>Room / Ward</Label>
                <Input
                  value={formData.room}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, room: e.target.value }))
                  }
                  placeholder="Room or ward"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Session notes"
                rows={4}
              />
            </div>

            <DialogFooter className="pt-3 border-t bg-background">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {selected ? "Update Session" : "Create Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl h-[85dvh] max-h-[85dvh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle>Session Details</DialogTitle>
          </DialogHeader>

          {viewingSession ? (
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 px-6 pb-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Child</Label>
                  <p className="text-sm">
                    {viewingSession.child
                      ? `${viewingSession.child.firstName} ${viewingSession.child.lastName}`
                      : "-"}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label>Status</Label>
                  <div>
                    <Badge
                      variant={
                        viewingSession.status === "ACTIVE"
                          ? "default"
                          : viewingSession.status === "PENDING"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {viewingSession.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Hospital</Label>
                  <p className="text-sm">{viewingSession.hospital?.name || "-"}</p>
                </div>

                <div className="space-y-1">
                  <Label>Physiotherapist</Label>
                  <p className="text-sm">
                    {viewingSession.physiotherapist?.name || "-"}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label>Date</Label>
                  <p className="text-sm">
                    {new Date(viewingSession.admissionDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label>Time</Label>
                  <p className="text-sm">
                    {viewingSession.startTime || "-"} - {viewingSession.endTime || "-"}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label>Clinic</Label>
                  <p className="text-sm">{viewingSession.clinic || "-"}</p>
                </div>

                <div className="space-y-1">
                  <Label>Room / Ward</Label>
                  <p className="text-sm">{viewingSession.room || "-"}</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Notes</Label>
                <p className="text-sm whitespace-pre-wrap">{viewingSession.notes || "-"}</p>
              </div>
            </div>
          ) : null}

          <DialogFooter className="px-6 py-3 border-t bg-background">
            <Button type="button" variant="outline" onClick={handleCloseView}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
