"use client";

import React, { useState, useEffect } from "react";
import { asApiError } from "@/lib/error-handling";
import { ApiClient } from "@/lib/api/api-client";
import {
  teacherTransferApi,
  CreateTeacherTransferDto,
} from "@/lib/api/endpoints/teacher-transfers";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  X,
  Plus,
  MapPin,
  BookOpen,
  Globe,
  GraduationCap,
} from "lucide-react";

/**
 * Helper type for teacher user with extended profile fields.
 * Used to safely access teacher-specific properties from auth store.
 */
interface TeacherProfile {
  registrationId?: string;
  school?: string;
  zone?: string;
  subject?: string;
  medium?: string;
  level?: string;
  district?: string | { id: string; name: string };
}

/**
 * Extracts the district name from a district field that can be either a string or an object.
 */
function getDistrictName(
  district: string | { id: string; name: string } | undefined
): string {
  if (!district) return "";
  if (typeof district === "string") return district;
  return district.name;
}

// Available options (these should come from API endpoints in production)
const ZONES = [
  "Negombo Zone",
  "Colombo Zone",
  "Jaffna Zone",
  "Kandy Zone",
  "Galle Zone",
  "Matara Zone",
];

const DISTRICTS = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
];

const SCHOOL_TYPES = ["1AB", "1C", "Type 2", "Type 3"];

const SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Sinhala",
  "Tamil",
  "History",
  "Geography",
  "Civics",
  "Health Science",
  "ICT",
  "Art",
  "Music",
  "Dancing",
  "Drama",
];

const MEDIUMS = ["Sinhala", "Tamil", "English"];
const LEVELS = ["O/L", "A/L"];

const QUALIFICATIONS = [
  "B.Ed",
  "PGDE",
  "M.Ed",
  "M.A",
  "M.Sc",
  "Diploma in Education",
  "Teacher Training Certificate",
];

interface TransferCreateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function TransferCreateForm({
  open,
  onOpenChange,
  onSuccess,
}: TransferCreateFormProps) {
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTeacherTransferDto>({
    registrationId: "",
    currentSchool: "",
    currentSchoolType: undefined,
    currentDistrict: "",
    currentZone: "",
    fromZone: "",
    toZones: [],
    subject: "",
    medium: "Sinhala",
    level: "O/L",
    isInternalTeacher: true,
    yearsOfService: undefined,
    qualifications: [],
    preferredSchoolTypes: [],
    additionalRequirements: "",
    notes: "",
    attachments: [],
  });

  const [selectedToZone, setSelectedToZone] = useState("");
  const [selectedQualification, setSelectedQualification] = useState("");
  const [selectedPreferredSchoolType, setSelectedPreferredSchoolType] =
    useState("");

  // Load user profile data when dialog opens
  useEffect(() => {
    if (open && user) {
      // Cast user to TeacherProfile to access teacher-specific fields
      // These fields are populated when user is INTERNAL_TEACHER or EXTERNAL_TEACHER
      const teacherProfile = user as TeacherProfile;

      setFormData((prev) => ({
        ...prev,
        registrationId: teacherProfile.registrationId || "",
        currentSchool: teacherProfile.school || "Current School",
        currentDistrict:
          getDistrictName(teacherProfile.district) || "Current District",
        currentZone: teacherProfile.zone || "Current Zone",
        fromZone: teacherProfile.zone || "Current Zone",
        subject: teacherProfile.subject || "",
        medium:
          (teacherProfile.medium as "Sinhala" | "Tamil" | "English") ||
          "Sinhala",
        level: (teacherProfile.level as "A/L" | "O/L") || "O/L",
      }));
    }
  }, [open, user]);

  const handleAddToZone = () => {
    if (selectedToZone && !formData.toZones.includes(selectedToZone)) {
      setFormData((prev) => ({
        ...prev,
        toZones: [...prev.toZones, selectedToZone],
      }));
      setSelectedToZone("");
    }
  };

  const handleRemoveToZone = (zone: string) => {
    setFormData((prev) => ({
      ...prev,
      toZones: prev.toZones.filter((z) => z !== zone),
    }));
  };

  const handleAddQualification = () => {
    if (
      selectedQualification &&
      !formData.qualifications?.includes(selectedQualification)
    ) {
      setFormData((prev) => ({
        ...prev,
        qualifications: [...(prev.qualifications || []), selectedQualification],
      }));
      setSelectedQualification("");
    }
  };

  const handleRemoveQualification = (qual: string) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: (prev.qualifications || []).filter((q) => q !== qual),
    }));
  };

  const handleAddPreferredSchoolType = () => {
    if (
      selectedPreferredSchoolType &&
      !formData.preferredSchoolTypes?.includes(selectedPreferredSchoolType)
    ) {
      setFormData((prev) => ({
        ...prev,
        preferredSchoolTypes: [
          ...(prev.preferredSchoolTypes || []),
          selectedPreferredSchoolType,
        ],
      }));
      setSelectedPreferredSchoolType("");
    }
  };

  const handleRemovePreferredSchoolType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredSchoolTypes: (prev.preferredSchoolTypes || []).filter(
        (t) => t !== type
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.fromZone ||
      formData.toZones.length === 0 ||
      !formData.subject
    ) {
      toast.error(
        "Please fill in all required fields and select at least one desired zone."
      );
      return;
    }

    setLoading(true);
    try {
      await teacherTransferApi.create(formData);

      toast.success(
        "Your mutual transfer request has been created successfully!"
      );

      // Reset form with teacher profile data
      const teacherProfile = user as TeacherProfile | undefined;
      setFormData({
        registrationId: teacherProfile?.registrationId || "",
        currentSchool: teacherProfile?.school || "",
        currentDistrict: getDistrictName(teacherProfile?.district) || "",
        currentZone: teacherProfile?.zone || "",
        fromZone: teacherProfile?.zone || "",
        toZones: [],
        subject: teacherProfile?.subject || "",
        medium: "Sinhala",
        level: "O/L",
        notes: "",
        attachments: [],
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        asApiError(error).message ||
          "Failed to create transfer request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Mutual Transfer Request
          </DialogTitle>
          <DialogDescription>
            Submit a request to find teachers willing to swap positions with
            you. The system will automatically match you with compatible
            requests.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Current Position
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentSchool">Current School</Label>
                  <Input
                    id="currentSchool"
                    value={formData.currentSchool}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentSchool: e.target.value,
                      })
                    }
                    placeholder="Enter your current school"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currentSchoolType">Current School Type</Label>
                  <Select
                    value={formData.currentSchoolType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, currentSchoolType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select school type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHOOL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentDistrict">Current District</Label>
                  <Select
                    value={formData.currentDistrict}
                    onValueChange={(value) =>
                      setFormData({ ...formData, currentDistrict: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTRICTS.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="yearsOfService">Years of Service</Label>
                  <Input
                    id="yearsOfService"
                    type="number"
                    min="0"
                    value={formData.yearsOfService || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearsOfService: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="Total years of teaching"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fromZone">Current Zone *</Label>
                <Select
                  value={formData.fromZone}
                  onValueChange={(value) =>
                    setFormData({ ...formData, fromZone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your current zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {ZONES.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Teacher Type</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="teacherType"
                      checked={formData.isInternalTeacher === true}
                      onChange={() =>
                        setFormData({ ...formData, isInternalTeacher: true })
                      }
                    />
                    <span>Internal Teacher</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="teacherType"
                      checked={formData.isInternalTeacher === false}
                      onChange={() =>
                        setFormData({ ...formData, isInternalTeacher: false })
                      }
                    />
                    <span>External Teacher</span>
                  </label>
                </div>
              </div>

              <div>
                <Label>Qualifications</Label>
                <div className="flex gap-2 mb-2">
                  <Select
                    value={selectedQualification}
                    onValueChange={setSelectedQualification}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select qualification" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUALIFICATIONS.map((qual) => (
                        <SelectItem key={qual} value={qual}>
                          {qual}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddQualification}
                    disabled={!selectedQualification}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {(formData.qualifications?.length || 0) > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.qualifications?.map((qual) => (
                      <Badge
                        key={qual}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {qual}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => handleRemoveQualification(qual)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Preferred School Types for Transfer</Label>
                <div className="flex gap-2 mb-2">
                  <Select
                    value={selectedPreferredSchoolType}
                    onValueChange={setSelectedPreferredSchoolType}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select preferred school type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHOOL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPreferredSchoolType}
                    disabled={!selectedPreferredSchoolType}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {(formData.preferredSchoolTypes?.length || 0) > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.preferredSchoolTypes?.map((type) => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {type}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => handleRemovePreferredSchoolType(type)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Desired Positions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Desired Positions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Desired Zones *</Label>
                <div className="flex gap-2 mb-2">
                  <Select
                    value={selectedToZone}
                    onValueChange={setSelectedToZone}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select desired zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONES.filter((zone) => zone !== formData.fromZone).map(
                        (zone) => (
                          <SelectItem key={zone} value={zone}>
                            {zone}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddToZone}
                    disabled={!selectedToZone}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.toZones.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.toZones.map((zone) => (
                      <Badge
                        key={zone}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {zone}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => handleRemoveToZone(zone)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subject & Teaching Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Teaching Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) =>
                      setFormData({ ...formData, subject: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="medium">Medium *</Label>
                  <Select
                    value={formData.medium}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, medium: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDIUMS.map((medium) => (
                        <SelectItem key={medium} value={medium}>
                          {medium}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="level">Level *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, level: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="additionalRequirements">
                  Special Requirements
                </Label>
                <Textarea
                  id="additionalRequirements"
                  value={formData.additionalRequirements}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additionalRequirements: e.target.value,
                    })
                  }
                  placeholder="Any specific requirements for the transfer (e.g., accommodation needs, family circumstances)"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any additional information that might help with matching (e.g., special circumstances, preferences, etc.)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Transfer Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
