"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff, Key, DollarSign, BookOpen } from "lucide-react";
import { useCreateUser, type CreateUserPayload } from "@/hooks/use-users";
import { useAuth } from "@/hooks/use-auth";
import { createLogger } from "@/lib/utils/logger";
import { getErrorMessage } from "@/lib/types/api.types";

const logger = createLogger("CreateUserModal");
import { toast } from "sonner";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CreateUserFormData extends CreateUserPayload {
  // Teacher specific fields
  paymentPerClass?: number;
  paymentMethod?: string;
  autoApproveExams?: boolean;
  department?: string;
  specialization?: string;
}

export function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const { createUser, isLoading, error } = useCreateUser();

  const [formData, setFormData] = useState<CreateUserFormData>({
    phone: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "INTERNAL_STUDENT",
    dateOfBirth: "",
    bio: "",
    paymentPerClass: 0,
    paymentMethod: "PER_CLASS",
    autoApproveExams: true,
    department: "",
    specialization: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong"
  >("weak");
  const [showTeacherFields, setShowTeacherFields] = useState(false);

  // Update teacher fields visibility when role changes
  useEffect(() => {
    const isTeacher =
      formData.role === "INTERNAL_TEACHER" ||
      formData.role === "EXTERNAL_TEACHER";
    setShowTeacherFields(isTeacher);
  }, [formData.role]);

  // Generate random password
  const generatePassword = () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password });
    checkPasswordStrength(password);
  };

  // Check password strength
  const checkPasswordStrength = (password: string) => {
    if (password.length < 6) {
      setPasswordStrength("weak");
    } else if (
      password.length < 10 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setPasswordStrength("medium");
    } else {
      setPasswordStrength("strong");
    }
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    checkPasswordStrength(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (
      !formData.phone ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.password
    ) {
      toast.error(t("modals.createUser.fillRequired"));
      return;
    }

    // Validate phone format
    if (!/^\+\d{10,15}$/.test(formData.phone)) {
      toast.error(t("modals.createUser.phoneFormat2"));
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      toast.error(t("modals.createUser.passwordMinLength"));
      return;
    }

    try {
      // Prepare data for API
      const submitData: any = {
        phone: formData.phone,
        email: formData.email || undefined,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        dateOfBirth: formData.dateOfBirth || undefined,
        bio: formData.bio || undefined,
      };

      // Add teacher profile data if it's a teacher
      if (showTeacherFields) {
        submitData.teacherProfile = {
          department: formData.department || undefined,
          specialization: formData.specialization || undefined,
          isExternal: formData.role === "EXTERNAL_TEACHER",
          // Payment fields
          paymentPerClass: formData.paymentPerClass || 0,
          paymentMethod: formData.paymentMethod || "PER_CLASS",
          autoApproveExams: formData.autoApproveExams !== false,
        };
      }

      await createUser(submitData);

      handleApiSuccess(t("modals.createUser.userCreated"));
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        phone: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "INTERNAL_STUDENT",
        dateOfBirth: "",
        bio: "",
        paymentPerClass: 0,
        paymentMethod: "PER_CLASS",
        autoApproveExams: true,
        department: "",
        specialization: "",
      });
    } catch (err) {
      logger.error("Failed to create user:", { message: getErrorMessage(err) });
      handleApiError(
        err,
        "CreateUserModal.handleSubmit",
        t("modals.createUser.createFailed")
      );
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {t("modals.createUser.title")}
          </DialogTitle>
          <DialogDescription>
            {t("modals.createUser.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {t("modals.createUser.personalInfo")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  {t("modals.createUser.firstName")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="John"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {t("modals.createUser.lastName")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">
                {t("modals.createUser.dateOfBirth")}
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t("modals.createUser.bio")}</Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder={t("modals.createUser.bioPlaceholder")}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {t("modals.createUser.contactInfo")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  {t("modals.createUser.phoneNumber")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+94712345678"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t("modals.createUser.phoneFormat")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  {t("modals.createUser.emailOptional")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="user@example.com"
                />
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {t("modals.createUser.roleAndAccess")}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="role">
                {t("modals.createUser.userRole")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("modals.createUser.selectRole")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {isSuperAdmin && (
                    <>
                      <SelectItem value="SUPER_ADMIN">
                        {t("modals.createUser.superAdmin")}
                      </SelectItem>
                      <SelectItem value="ADMIN">
                        {t("modals.createUser.admin")}
                      </SelectItem>
                    </>
                  )}
                  <SelectItem value="INTERNAL_TEACHER">
                    {t("modals.createUser.internalTeacher")}
                  </SelectItem>
                  <SelectItem value="EXTERNAL_TEACHER">
                    {t("modals.createUser.externalTeacher")}
                  </SelectItem>
                  <SelectItem value="INTERNAL_STUDENT">
                    {t("modals.createUser.internalStudent")}
                  </SelectItem>
                  <SelectItem value="EXTERNAL_STUDENT">
                    {t("modals.createUser.externalStudent")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Teacher Specific Fields */}
          {showTeacherFields && (
            <>
              {/* Teacher Information */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Teacher Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      placeholder="e.g., Mathematics, Science"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specialization: e.target.value,
                        })
                      }
                      placeholder="e.g., Physics, Calculus"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Settings */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Payment Settings
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentPerClass">
                      Payment Per Class (LKR)
                    </Label>
                    <Input
                      id="paymentPerClass"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.paymentPerClass}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentPerClass: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500">
                      Amount paid per class conducted
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) =>
                        setFormData({ ...formData, paymentMethod: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PER_CLASS">Per Class</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="PER_SESSION">Per Session</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoApproveExams"
                      checked={formData.autoApproveExams}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          autoApproveExams: !!checked,
                        })
                      }
                    />
                    <Label
                      htmlFor="autoApproveExams"
                      className="cursor-pointer"
                    >
                      Auto-approve exams without admin approval
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    When enabled, this teacher can launch exams without waiting
                    for admin approval
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Password */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {t("modals.createUser.security")}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="password">
                {t("modals.createUser.password")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder={t("modals.createUser.enterPassword")}
                  required
                  className="pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title={
                      showPassword
                        ? t("modals.createUser.hidePassword")
                        : t("modals.createUser.showPassword")
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                    title={t("modals.createUser.generatePassword")}
                  >
                    <Key className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {formData.password && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrengthColor()} ${
                          passwordStrength === "weak"
                            ? "w-[33%]"
                            : passwordStrength === "medium"
                              ? "w-[66%]"
                              : "w-full"
                        }`}
                      />
                    </div>
                    <span className="text-xs font-medium capitalize">
                      {t(`modals.createUser.${passwordStrength}`)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("modals.createUser.passwordRequirements")}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("modals.addUser.createUser")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateUserModal;
