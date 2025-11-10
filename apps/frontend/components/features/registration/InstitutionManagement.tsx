"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiClient } from "@/lib/api/api-client";
import { createLogger } from "@/lib/utils/logger";
const logger = createLogger("InstitutionsComponent");
import { toast } from "sonner";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
  getErrorMessage,
} from "@/lib/error-handling";

interface Zone {
  id: string;
  name: string;
  code?: string;
  district?: {
    id: string;
    name: string;
    province?: {
      id: string;
      name: string;
    };
  };
}

interface Institution {
  id: string;
  name: string;
  code?: string;
  type: string;
  category?: string;
  zoneId?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  principal?: string;
  website?: string;
  studentCount?: number;
  teacherCount?: number;
  establishedYear?: number;
  isActive: boolean;
  zone?: Zone;
  _count?: {
    teachers: number;
  };
}

interface FormData {
  name: string;
  code: string;
  type: string;
  category: string;
  zoneId: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  principal: string;
  website: string;
  isActive: boolean;
}

const INSTITUTION_TYPES = [
  { value: "GOVERNMENT", label: "Government" },
  { value: "PRIVATE", label: "Private" },
  { value: "SEMI_GOVERNMENT", label: "Semi-Government" },
];

const INSTITUTION_CATEGORIES = [
  { value: "1AB", label: "Type 1AB" },
  { value: "1C", label: "Type 1C" },
  { value: "TYPE_2", label: "Type 2" },
  { value: "TYPE_3", label: "Type 3" },
];

function InstitutionManagement() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedInstitution, setSelectedInstitution] =
    useState<Institution | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    code: "",
    type: "GOVERNMENT",
    category: "",
    zoneId: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    email: "",
    principal: "",
    website: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    fetchInstitutions();
    fetchZones();
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<{
        total: number;
        institutions: Institution[];
      }>("/admin/institutions");
      setInstitutions(response.institutions);
    } catch (error) {
      logger.error("Failed to fetch institutions:", getErrorMessage(error));
      handleApiError(
        error,
        "InstitutionManagement.fetchInstitutions",
        "Failed to load institutions"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const response = await ApiClient.get<{ total: number; zones: Zone[] }>(
        "/admin/zones"
      );
      setZones(response.zones);
    } catch (error) {
      logger.error("Failed to fetch zones:", getErrorMessage(error));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.type) errors.type = "Type is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddInstitution = async (): Promise<void> => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      await ApiClient.post("/admin/institutions", formData);
      handleApiSuccess("Institution added successfully");
      resetForm();
      setShowAddModal(false);
      fetchInstitutions();
    } catch (error) {
      logger.error("Failed to add institution:", getErrorMessage(error));
      handleApiError(
        error,
        "InstitutionManagement.handleAddInstitution",
        "Failed to add institution"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditInstitution = async (): Promise<void> => {
    if (!validateForm() || !selectedInstitution) return;

    try {
      setSaving(true);
      await ApiClient.put(
        `/api/v1/admin/institutions/${selectedInstitution.id}`,
        formData
      );
      handleApiSuccess("Institution updated successfully");
      resetForm();
      setShowEditModal(false);
      fetchInstitutions();
    } catch (error) {
      logger.error("Failed to update institution:", getErrorMessage(error));
      handleApiError(
        error,
        "InstitutionManagement.handleEditInstitution",
        "Failed to update institution"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInstitution = async (): Promise<void> => {
    if (!selectedInstitution) return;

    try {
      setSaving(true);
      await ApiClient.delete(
        `/api/v1/admin/institutions/${selectedInstitution.id}`
      );
      handleApiSuccess("Institution deleted successfully");
      setShowDeleteModal(false);
      setSelectedInstitution(null);
      fetchInstitutions();
    } catch (error) {
      logger.error("Failed to delete institution:", getErrorMessage(error));
      handleApiError(
        error,
        "InstitutionManagement.handleDeleteInstitution",
        "Failed to delete institution"
      );
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      type: "GOVERNMENT",
      category: "",
      zoneId: "",
      address: "",
      city: "",
      postalCode: "",
      phone: "",
      email: "",
      principal: "",
      website: "",
      isActive: true,
    });
    setFormErrors({});
    setSelectedInstitution(null);
  };

  const openEditModal = (institution: Institution) => {
    setSelectedInstitution(institution);
    setFormData({
      name: institution.name,
      code: institution.code || "",
      type: institution.type,
      category: institution.category || "",
      zoneId: institution.zoneId || "",
      address: institution.address || "",
      city: institution.city || "",
      postalCode: institution.postalCode || "",
      phone: institution.phone || "",
      email: institution.email || "",
      principal: institution.principal || "",
      website: institution.website || "",
      isActive: institution.isActive,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (institution: Institution) => {
    setSelectedInstitution(institution);
    setShowDeleteModal(true);
  };

  const openDetailsModal = (institution: Institution) => {
    setSelectedInstitution(institution);
    setShowDetailsModal(true);
  };

  const filteredInstitutions = institutions.filter((institution) => {
    const matchesSearch =
      institution.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      institution.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      institution.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || institution.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Institutions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage educational institutions
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Institution
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search institutions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {INSTITUTION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Institutions List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredInstitutions.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No institutions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInstitutions.map((institution) => (
            <div
              key={institution.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => openDetailsModal(institution)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground">
                    {institution.name}
                  </h3>
                  {institution.code && (
                    <p className="text-sm text-muted-foreground">
                      Code: {institution.code}
                    </p>
                  )}
                </div>
                <Badge
                  variant={institution.isActive ? "default" : "secondary"}
                  className="ml-2"
                >
                  {institution.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {
                      INSTITUTION_TYPES.find(
                        (t) => t.value === institution.type
                      )?.label
                    }
                  </span>
                </div>

                {institution.zone && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {institution.zone.name}
                      {institution.zone.district &&
                        `, ${institution.zone.district.name}`}
                    </span>
                  </div>
                )}

                {institution.city && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{institution.city}</span>
                  </div>
                )}

                {institution._count && (
                  <div className="text-sm text-muted-foreground">
                    Teachers: {institution._count.teachers}
                  </div>
                )}
              </div>

              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(institution)}
                  className="flex-1"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openDeleteModal(institution)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog
        open={showAddModal || showEditModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddModal(false);
            setShowEditModal(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showAddModal ? "Add Institution" : "Edit Institution"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">
                Institution Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive mt-1">
                  {formErrors.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="code">Institution Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="type">
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger
                  className={formErrors.type ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {INSTITUTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.type && (
                <p className="text-sm text-destructive mt-1">
                  {formErrors.type}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {INSTITUTION_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="zoneId">Zone</Label>
              <Select
                value={formData.zoneId}
                onValueChange={(value) =>
                  setFormData({ ...formData, zoneId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {zones
                    .filter((zone) => zone.id)
                    .map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                        {zone.district && ` - ${zone.district.name}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
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
              />
            </div>

            <div>
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) =>
                  setFormData({ ...formData, postalCode: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="principal">Principal Name</Label>
              <Input
                id="principal"
                value={formData.principal}
                onChange={(e) =>
                  setFormData({ ...formData, principal: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={
                showAddModal ? handleAddInstitution : handleEditInstitution
              }
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {showAddModal ? "Add Institution" : "Update Institution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Institution</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete "{selectedInstitution?.name}"? This
            action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteInstitution}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedInstitution?.name}</DialogTitle>
          </DialogHeader>

          {selectedInstitution && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Code
                  </p>
                  <p className="text-sm">{selectedInstitution.code || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Type
                  </p>
                  <p className="text-sm">
                    {
                      INSTITUTION_TYPES.find(
                        (t) => t.value === selectedInstitution.type
                      )?.label
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Category
                  </p>
                  <p className="text-sm">
                    {selectedInstitution.category
                      ? INSTITUTION_CATEGORIES.find(
                          (c) => c.value === selectedInstitution.category
                        )?.label
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <Badge
                    variant={
                      selectedInstitution.isActive ? "default" : "secondary"
                    }
                  >
                    {selectedInstitution.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {selectedInstitution.zone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Location
                  </p>
                  <p className="text-sm">
                    Zone: {selectedInstitution.zone.name}
                  </p>
                  {selectedInstitution.zone.district && (
                    <p className="text-sm">
                      District: {selectedInstitution.zone.district.name}
                    </p>
                  )}
                  {selectedInstitution.zone.district?.province && (
                    <p className="text-sm">
                      Province:{" "}
                      {selectedInstitution.zone.district.province.name}
                    </p>
                  )}
                </div>
              )}

              {selectedInstitution.address && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Address
                  </p>
                  <p className="text-sm">{selectedInstitution.address}</p>
                  {selectedInstitution.city && (
                    <p className="text-sm">
                      {selectedInstitution.city}
                      {selectedInstitution.postalCode &&
                        ` - ${selectedInstitution.postalCode}`}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedInstitution.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      <Phone className="h-3 w-3 inline mr-1" />
                      Phone
                    </p>
                    <p className="text-sm">{selectedInstitution.phone}</p>
                  </div>
                )}
                {selectedInstitution.email && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      <Mail className="h-3 w-3 inline mr-1" />
                      Email
                    </p>
                    <p className="text-sm">{selectedInstitution.email}</p>
                  </div>
                )}
              </div>

              {selectedInstitution.principal && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    <User className="h-3 w-3 inline mr-1" />
                    Principal
                  </p>
                  <p className="text-sm">{selectedInstitution.principal}</p>
                </div>
              )}

              {selectedInstitution.website && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    <Globe className="h-3 w-3 inline mr-1" />
                    Website
                  </p>
                  <a
                    href={selectedInstitution.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {selectedInstitution.website}
                  </a>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InstitutionManagement;
