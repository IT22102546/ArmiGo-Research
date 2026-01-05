"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { teacherTransferApi } from "@/lib/api/endpoints/teacher-transfers";
import type {
  TeacherTransferRequest,
  CreateTeacherTransferDto,
  TransferRequestStatus,
} from "@/lib/api/endpoints/teacher-transfers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { handleApiError } from "@/lib/error-handling/api-error-handler";
import { toast } from "sonner";

// Constants from TransferCreateForm
const ZONES = [
  { value: "colombo", label: "Colombo" },
  { value: "gampaha", label: "Gampaha" },
  { value: "kalutara", label: "Kalutara" },
  { value: "kandy", label: "Kandy" },
  { value: "matale", label: "Matale" },
  { value: "nuwara-eliya", label: "Nuwara Eliya" },
];

const DISTRICTS = [
  { value: "colombo", label: "Colombo" },
  { value: "gampaha", label: "Gampaha" },
  { value: "kalutara", label: "Kalutara" },
  { value: "kandy", label: "Kandy" },
  { value: "matale", label: "Matale" },
  { value: "nuwara-eliya", label: "Nuwara Eliya" },
  { value: "galle", label: "Galle" },
  { value: "matara", label: "Matara" },
  { value: "hambantota", label: "Hambantota" },
  { value: "jaffna", label: "Jaffna" },
  { value: "kilinochchi", label: "Kilinochchi" },
  { value: "mannar", label: "Mannar" },
  { value: "mullaitivu", label: "Mullaitivu" },
  { value: "vavuniya", label: "Vavuniya" },
];

const SCHOOL_TYPES = [
  { value: "1ab", label: "Type 1AB" },
  { value: "1c", label: "Type 1C" },
  { value: "2", label: "Type 2" },
  { value: "3", label: "Type 3" },
];

const SUBJECTS = [
  { value: "mathematics", label: "Mathematics" },
  { value: "science", label: "Science" },
  { value: "english", label: "English" },
  { value: "sinhala", label: "Sinhala" },
  { value: "tamil", label: "Tamil" },
  { value: "history", label: "History" },
  { value: "geography", label: "Geography" },
  { value: "ict", label: "ICT" },
  { value: "commerce", label: "Commerce" },
  { value: "accounting", label: "Accounting" },
  { value: "economics", label: "Economics" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "biology", label: "Biology" },
];

const MEDIUMS = [
  { value: "sinhala", label: "Sinhala" },
  { value: "tamil", label: "Tamil" },
  { value: "english", label: "English" },
];

const LEVELS = [
  { value: "ol", label: "O/L (Grades 6-11)" },
  { value: "al", label: "A/L (Grades 12-13)" },
];

const QUALIFICATIONS = [
  { value: "trained", label: "Trained Graduate" },
  { value: "untrained", label: "Untrained Graduate" },
  { value: "ncoe", label: "NCOE" },
  { value: "bed", label: "B.Ed" },
  { value: "masters", label: "Masters Degree" },
  { value: "phd", label: "PhD" },
  { value: "other", label: "Other" },
];

interface TeacherTransferProfileProps {
  mode?: "view" | "edit" | "register";
}

export function TeacherTransferProfile({
  mode: initialMode = "view",
}: TeacherTransferProfileProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit" | "register">(initialMode);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<TeacherTransferRequest | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form data
  const [formData, setFormData] = useState<Partial<CreateTeacherTransferDto>>({
    registrationId: "",
    currentSchool: "",
    currentSchoolType: "",
    currentDistrict: "",
    currentZone: "",
    fromZone: "",
    toZones: [],
    subject: "",
    medium: undefined,
    level: undefined,
    yearsOfService: 0,
    qualifications: [],
    isInternalTeacher: false,
    additionalRequirements: "",
    notes: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const requests = await teacherTransferApi.getMyRequests();
      if (requests && requests.length > 0) {
        const myProfile = requests[0];
        setProfile(myProfile);
        setFormData({
          registrationId: myProfile.registrationId || "",
          currentSchool: myProfile.currentSchool || "",
          currentSchoolType: myProfile.currentSchoolType || "",
          currentDistrict: myProfile.currentDistrict || "",
          currentZone: myProfile.currentZone || "",
          fromZone: myProfile.fromZone || "",
          toZones: myProfile.toZones || [],
          subject: myProfile.subject || "",
          medium: (myProfile.medium as any) || undefined,
          level: (myProfile.level as any) || undefined,
          yearsOfService: myProfile.yearsOfService || 0,
          qualifications: myProfile.qualifications || [],
          isInternalTeacher: myProfile.isInternalTeacher || false,
          additionalRequirements: myProfile.additionalRequirements || "",
          notes: myProfile.notes || "",
        });
        if (initialMode === "register") {
          setMode("view");
        }
      } else {
        setMode("register");
      }
    } catch (error) {
      handleApiError(error);
      if (initialMode === "view") {
        setMode("register");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validation
      if (
        !formData.registrationId ||
        !formData.currentSchool ||
        !formData.subject
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (mode === "edit" && profile) {
        await teacherTransferApi.update(
          profile.id,
          formData as CreateTeacherTransferDto
        );
        toast.success("Profile updated successfully");
      } else {
        await teacherTransferApi.create(formData as CreateTeacherTransferDto);
        toast.success("Registration submitted successfully");
      }

      await fetchProfile();
      setMode("view");
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      await teacherTransferApi.cancel(profile.id);
      toast.success("Transfer request cancelled successfully");
      router.push("/teacher/transfers");
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
      setShowDeleteDialog(false);
    }
  };

  const getStatusBadge = (status: TransferRequestStatus) => {
    const statusConfig = {
      PENDING: {
        icon: Clock,
        variant: "secondary" as const,
        label: "Pending Verification",
      },
      VERIFIED: {
        icon: CheckCircle,
        variant: "default" as const,
        label: "Verified",
      },
      ACCEPTED: {
        icon: CheckCircle,
        variant: "default" as const,
        label: "Accepted",
      },
      REJECTED: {
        icon: XCircle,
        variant: "destructive" as const,
        label: "Rejected",
      },
      COMPLETED: {
        icon: CheckCircle,
        variant: "outline" as const,
        label: "Completed",
      },
      CANCELLED: {
        icon: XCircle,
        variant: "secondary" as const,
        label: "Cancelled",
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {mode === "register"
                ? "Transfer Registration"
                : "Transfer Profile"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {mode === "register"
                ? "Register for mutual transfer program"
                : mode === "edit"
                  ? "Update your transfer information"
                  : "View and manage your transfer profile"}
            </p>
          </div>
        </div>

        {mode === "view" && profile && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMode("edit")}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={
                profile.status === "COMPLETED" || profile.status === "CANCELLED"
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Cancel Request
            </Button>
          </div>
        )}

        {(mode === "edit" || mode === "register") && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                mode === "edit" ? setMode("view") : router.back()
              }
              disabled={saving}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {mode === "register" ? "Submit Registration" : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Status Alert (View Mode) */}
      {mode === "view" && profile && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Registration Status: {getStatusBadge(profile.status)}</span>
            {profile.verifiedBy && (
              <span className="text-sm text-muted-foreground">
                Verified on {new Date(profile.verifiedAt!).toLocaleDateString()}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Form/View Content */}
      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Personal and registration details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationId">
                  Registration ID <span className="text-red-500">*</span>
                </Label>
                {mode === "view" ? (
                  <p className="text-sm py-2">
                    {profile?.registrationId || "N/A"}
                  </p>
                ) : (
                  <Input
                    id="registrationId"
                    value={formData.registrationId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationId: e.target.value,
                      })
                    }
                    placeholder="Enter registration ID"
                    disabled={mode === "edit"}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearsOfService">Years of Service</Label>
                {mode === "view" ? (
                  <p className="text-sm py-2">
                    {profile?.yearsOfService || 0} years
                  </p>
                ) : (
                  <Input
                    id="yearsOfService"
                    type="number"
                    value={formData.yearsOfService}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearsOfService: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Enter years of service"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current School Information */}
        <Card>
          <CardHeader>
            <CardTitle>Current School Information</CardTitle>
            <CardDescription>
              Details about your current placement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentSchool">
                Current School <span className="text-red-500">*</span>
              </Label>
              {mode === "view" ? (
                <p className="text-sm py-2">
                  {profile?.currentSchool || "N/A"}
                </p>
              ) : (
                <Input
                  id="currentSchool"
                  value={formData.currentSchool}
                  onChange={(e) =>
                    setFormData({ ...formData, currentSchool: e.target.value })
                  }
                  placeholder="Enter current school name"
                />
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentSchoolType">School Type</Label>
                {mode === "view" ? (
                  <p className="text-sm py-2">
                    {profile?.currentSchoolType || "N/A"}
                  </p>
                ) : (
                  <Select
                    value={formData.currentSchoolType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, currentSchoolType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHOOL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentDistrict">District</Label>
                {mode === "view" ? (
                  <p className="text-sm py-2">
                    {profile?.currentDistrict || "N/A"}
                  </p>
                ) : (
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
                        <SelectItem key={district.value} value={district.value}>
                          {district.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentZone">Zone</Label>
                {mode === "view" ? (
                  <p className="text-sm py-2">
                    {profile?.currentZone || "N/A"}
                  </p>
                ) : (
                  <Select
                    value={formData.currentZone}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        currentZone: value,
                        fromZone: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONES.map((zone) => (
                        <SelectItem key={zone.value} value={zone.value}>
                          {zone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desired Transfer Zones */}
        <Card>
          <CardHeader>
            <CardTitle>Desired Transfer Zones</CardTitle>
            <CardDescription>
              Select zones where you wish to transfer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "view" ? (
              <div className="flex flex-wrap gap-2">
                {profile?.toZones && profile.toZones.length > 0 ? (
                  profile.toZones.map((zone) => (
                    <Badge key={zone} variant="secondary">
                      {ZONES.find((z) => z.value === zone)?.label || zone}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No zones selected
                  </p>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {ZONES.map((zone) => (
                  <label
                    key={zone.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.toZones?.includes(zone.value)}
                      onChange={(e) => {
                        const currentZones = formData.toZones || [];
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            toZones: [...currentZones, zone.value],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            toZones: currentZones.filter(
                              (z) => z !== zone.value
                            ),
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{zone.label}</span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teaching Details */}
        <Card>
          <CardHeader>
            <CardTitle>Teaching Details</CardTitle>
            <CardDescription>
              Subject and qualification information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">
                  Teaching Subject <span className="text-red-500">*</span>
                </Label>
                {mode === "view" ? (
                  <p className="text-sm py-2">{profile?.subject || "N/A"}</p>
                ) : (
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
                        <SelectItem key={subject.value} value={subject.value}>
                          {subject.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="medium">Medium</Label>
                {mode === "view" ? (
                  <p className="text-sm py-2">{profile?.medium || "N/A"}</p>
                ) : (
                  <Select
                    value={formData.medium}
                    onValueChange={(value) =>
                      setFormData({ ...formData, medium: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select medium" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDIUMS.map((medium) => (
                        <SelectItem key={medium.value} value={medium.value}>
                          {medium.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                {mode === "view" ? (
                  <p className="text-sm py-2">{profile?.level || "N/A"}</p>
                ) : (
                  <Select
                    value={formData.level}
                    onValueChange={(value) =>
                      setFormData({ ...formData, level: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Qualifications</Label>
                {mode === "view" ? (
                  <div className="flex flex-wrap gap-2">
                    {profile?.qualifications &&
                    profile.qualifications.length > 0 ? (
                      profile.qualifications.map((qual) => (
                        <Badge key={qual} variant="secondary">
                          {QUALIFICATIONS.find((q) => q.value === qual)
                            ?.label || qual}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No qualifications listed
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-2">
                    {QUALIFICATIONS.map((qual) => (
                      <label
                        key={qual.value}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.qualifications?.includes(
                            qual.value
                          )}
                          onChange={(e) => {
                            const currentQuals = formData.qualifications || [];
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                qualifications: [...currentQuals, qual.value],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                qualifications: currentQuals.filter(
                                  (q) => q !== qual.value
                                ),
                              });
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{qual.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>
              Any additional requirements or notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="additionalRequirements">
                Additional Requirements
              </Label>
              {mode === "view" ? (
                <p className="text-sm py-2">
                  {profile?.additionalRequirements || "None"}
                </p>
              ) : (
                <Textarea
                  id="additionalRequirements"
                  value={formData.additionalRequirements}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additionalRequirements: e.target.value,
                    })
                  }
                  placeholder="Enter any additional requirements"
                  rows={3}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              {mode === "view" ? (
                <p className="text-sm py-2">{profile?.notes || "None"}</p>
              ) : (
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Enter any additional notes"
                  rows={3}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Transfer Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your transfer request will be
              permanently cancelled and removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Yes, cancel request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
