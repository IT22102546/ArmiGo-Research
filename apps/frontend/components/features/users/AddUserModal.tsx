"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  Building2,
  Globe,
} from "lucide-react";
import { GradeSelect, BatchSelect } from "@/components/shared/selects";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { useEnums } from "@/lib/hooks/use-enums";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";

interface Subject {
  id: string;
  name: string;
  medium?: string;
}

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: string;
  status: string;
  medium: string;
  institution: string;
  // Student specific
  grade?: string;
  batch?: string;
  // Teacher specific
  subjectIds?: string[];
  specialization?: string;
  experience?: string;
}

const INITIAL_FORM_DATA: UserFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "INTERNAL_STUDENT",
  status: "ACTIVE",
  medium: "",
  institution: "",
  grade: "",
  batch: "",
  subjectIds: [],
  specialization: "",
  experience: "",
};

const AddUserModal: React.FC<AddUserModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const [formData, setFormData] = useState<UserFormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const { grades, mediums, loading: enumsLoading } = useEnums();

  const isStudent = formData.role.includes("STUDENT");
  const isTeacher = formData.role.includes("TEACHER");

  useEffect(() => {
    if (open && isTeacher) {
      fetchSubjects();
    }
  }, [open, isTeacher]);

  const fetchSubjects = async () => {
    try {
      const response = await ApiClient.get<Subject[]>("/subjects");
      setSubjects(Array.isArray(response) ? response : []);
    } catch (error) {
      handleApiError(error, "AddUserModal.fetchSubjects");
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSubject = (subjectId: string) => {
    setFormData((prev) => {
      const currentSubjects = prev.subjectIds || [];
      const newSubjects = currentSubjects.includes(subjectId)
        ? currentSubjects.filter((id) => id !== subjectId)
        : [...currentSubjects, subjectId];
      return { ...prev, subjectIds: newSubjects };
    });
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      toast.error(t("modals.validation.firstNameRequired"));
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error(t("modals.validation.lastNameRequired"));
      return false;
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error(t("modals.validation.validEmailRequired"));
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error(t("modals.validation.phoneRequired"));
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error(t("modals.validation.passwordMinLength"));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error(t("modals.validation.passwordsDoNotMatch"));
      return false;
    }
    if (isStudent && !formData.grade) {
      toast.error(t("modals.validation.gradeRequired"));
      return false;
    }
    if (
      isTeacher &&
      (!formData.subjectIds || formData.subjectIds.length === 0)
    ) {
      toast.error(t("modals.validation.subjectRequired"));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
      };

      if (isStudent) {
        payload.studentProfile = {
          grade: formData.grade,
          batch: formData.batch || undefined,
          medium: formData.medium || undefined,
        };
      }

      if (isTeacher) {
        payload.teacherProfile = {
          subjectIds: formData.subjectIds,
          specialization: formData.specialization || undefined,
          experience: formData.experience
            ? parseInt(formData.experience)
            : undefined,
        };
      }

      await ApiClient.post("/users", payload);
      handleApiSuccess("User created successfully");
      setFormData(INITIAL_FORM_DATA);
      onSuccess();
      onClose();
    } catch (error) {
      handleApiError(
        error,
        "AddUserModal.handleSubmit",
        "Failed to create user"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData(INITIAL_FORM_DATA);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("modals.addUser.title")}</DialogTitle>
          <DialogDescription>
            {t("modals.addUser.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Role Selection */}
          <div>
            <Label>{t("modals.addUser.userRole")} *</Label>
            <Select
              value={formData.role}
              onValueChange={(v) => handleInputChange("role", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INTERNAL_STUDENT">
                  {t("tabs.internalStudents")}
                </SelectItem>
                <SelectItem value="EXTERNAL_STUDENT">
                  {t("tabs.externalStudents")}
                </SelectItem>
                <SelectItem value="INTERNAL_TEACHER">
                  {t("tabs.internalTeachers")}
                </SelectItem>
                <SelectItem value="EXTERNAL_TEACHER">
                  {t("tabs.externalTeachers")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                <User className="h-4 w-4 inline mr-2" />
                {t("modals.addUser.firstName")} *
              </Label>
              <Input
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="John"
              />
            </div>
            <div>
              <Label>{t("modals.addUser.lastName")} *</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                <Mail className="h-4 w-4 inline mr-2" />
                {t("modals.addUser.email")} *
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="john.doe@example.com"
              />
            </div>
            <div>
              <Label>
                <Phone className="h-4 w-4 inline mr-2" />
                {t("modals.addUser.phone")} *
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+1234567890"
              />
            </div>
          </div>

          {/* Password */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                <Lock className="h-4 w-4 inline mr-2" />
                {t("modals.addUser.password")} *
              </Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder={t("modals.addUser.passwordPlaceholder")}
              />
            </div>
            <div>
              <Label>{t("modals.addUser.confirmPassword")} *</Label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                placeholder={t("modals.addUser.reenterPassword")}
              />
            </div>
          </div>

          {/* Student-specific fields */}
          {isStudent && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">
                {t("modals.addUser.studentInfo")}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("modals.addUser.grade")} *</Label>
                  <GradeSelect
                    value={formData.grade}
                    onValueChange={(v) => {
                      handleInputChange("grade", v);
                      handleInputChange("batch", "");
                    }}
                  />
                </div>
                <div>
                  <Label>{t("modals.addUser.batch")}</Label>
                  <BatchSelect
                    gradeId={formData.grade}
                    value={formData.batch}
                    onValueChange={(v) => handleInputChange("batch", v)}
                    disabled={!formData.grade}
                  />
                </div>
                <div>
                  <Label>
                    <Globe className="h-4 w-4 inline mr-2" />
                    {t("modals.addUser.medium")}
                  </Label>
                  <Select
                    value={formData.medium || undefined}
                    onValueChange={(v) => handleInputChange("medium", v)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("modals.addUser.selectMedium")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {mediums
                        .filter((m) => m.name)
                        .map((m) => (
                          <SelectItem key={m.id} value={m.name}>
                            {m.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Teacher-specific fields */}
          {isTeacher && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">
                {t("modals.addUser.teacherInfo")}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("modals.addUser.specialization")}</Label>
                  <Input
                    value={formData.specialization}
                    onChange={(e) =>
                      handleInputChange("specialization", e.target.value)
                    }
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <Label>{t("modals.addUser.yearsExperience")}</Label>
                  <Input
                    type="number"
                    value={formData.experience}
                    onChange={(e) =>
                      handleInputChange("experience", e.target.value)
                    }
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <Label>{t("modals.addUser.teachingSubjects")} *</Label>
                <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                  {subjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("modals.addUser.noSubjectsAvailable")}
                    </p>
                  ) : (
                    subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`subject-${subject.id}`}
                          checked={formData.subjectIds?.includes(subject.id)}
                          onCheckedChange={() => toggleSubject(subject.id)}
                        />
                        <label
                          htmlFor={`subject-${subject.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {subject.name}
                          {subject.medium && (
                            <span className="text-muted-foreground ml-2">
                              ({subject.medium})
                            </span>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {formData.subjectIds && formData.subjectIds.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("modals.addUser.subjectsSelected", {
                      count: formData.subjectIds.length,
                    })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("modals.addUser.createUser")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
