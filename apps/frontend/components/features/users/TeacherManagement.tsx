"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Search } from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";

type Zone = {
  id: string;
  name: string;
};

type Hospital = {
  id: string;
  name: string;
  zoneId?: string | null;
  zone?: {
    id: string;
    name: string;
  } | null;
};

type Physiotherapist = {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  zoneId: string;
  zoneName: string;
  hospitalId: string;
  hospitalName: string;
};

export default function TeacherManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [physiotherapists, setPhysiotherapists] = useState<Physiotherapist[]>(
    []
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    zoneId: "",
    hospitalId: "",
  });

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
  });

  const { data: hospitals = [], isLoading: hospitalsLoading } = useQuery({
    queryKey: ["physio-management", "hospitals"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/hospitals");
      const payload = response?.data ?? response ?? {};
      const list = payload?.data || payload?.hospitals || payload || [];
      if (!Array.isArray(list)) return [];

      return list.filter((h: any) => {
        const hospitalId = h?.id;
        const hospitalName = h?.name;
        const zoneId = h?.zoneId || h?.zone?.id;
        return hospitalId && hospitalName && zoneId;
      });
    },
  });

  const filteredHospitals = useMemo(() => {
    if (!formData.zoneId) return [];
    return hospitals.filter((hospital: Hospital) => {
      const hospitalZoneId = hospital.zoneId || hospital.zone?.id;
      return hospitalZoneId === formData.zoneId;
    });
  }, [hospitals, formData.zoneId]);

  const filteredPhysiotherapists = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return physiotherapists;

    return physiotherapists.filter((item) =>
      [item.name, item.email, item.contactNumber, item.hospitalName, item.zoneName]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [physiotherapists, search]);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      contactNumber: "",
      zoneId: "",
      hospitalId: "",
    });
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleAddPhysiotherapist = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.contactNumber.trim() ||
      !formData.zoneId ||
      !formData.hospitalId
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    const selectedZone = zones.find((zone: Zone) => zone.id === formData.zoneId);
    const selectedHospital = filteredHospitals.find(
      (hospital: Hospital) => hospital.id === formData.hospitalId
    );

    if (!selectedZone || !selectedHospital) {
      toast.error("Please select a valid zone and hospital");
      return;
    }

    const newPhysiotherapist: Physiotherapist = {
      id: `physio-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim(),
      contactNumber: formData.contactNumber.trim(),
      zoneId: selectedZone.id,
      zoneName: selectedZone.name,
      hospitalId: selectedHospital.id,
      hospitalName: selectedHospital.name,
    };

    setPhysiotherapists((prev) => [newPhysiotherapist, ...prev]);
    setDialogOpen(false);
    resetForm();
    toast.success("Physiotherapist added successfully");
  };

  const handleDelete = (id: string) => {
    setPhysiotherapists((prev) => prev.filter((item) => item.id !== id));
    toast.success("Physiotherapist removed");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hospital Workforce</p>
          <h1 className="text-2xl font-semibold">Physiotherapy Management</h1>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="h-4 w-4 mr-2" /> Add Physiotherapist
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Physiotherapists</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, hospital, email..."
              className="pl-9"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Physiotherapist Name</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Contact Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPhysiotherapists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No physiotherapists added yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPhysiotherapists.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.hospitalName}</TableCell>
                      <TableCell>{item.zoneName}</TableCell>
                      <TableCell>{item.contactNumber}</TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Physiotherapist</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleAddPhysiotherapist}>
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
                value={formData.contactNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactNumber: e.target.value,
                  }))
                }
                placeholder="Enter contact number"
              />
            </div>

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

            <div className="space-y-2">
              <Label>Hospital</Label>
              <Select
                value={formData.hospitalId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, hospitalId: value }))
                }
                disabled={!formData.zoneId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !formData.zoneId
                        ? "Select zone first"
                        : hospitalsLoading
                          ? "Loading hospitals..."
                          : "Select hospital"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredHospitals.map((hospital: Hospital) => (
                    <SelectItem key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Physiotherapist</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
