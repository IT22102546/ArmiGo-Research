// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Loader2 } from "lucide-react";
// import { useUpdateUser, type UpdateUserPayload } from "@/hooks/use-users";
// import { useAuth } from "@/hooks/use-auth";

// interface User {
//   id: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   role: string;
//   status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
//   avatar?: string;
//   phone: string;
//   dateOfBirth?: string;
//   bio?: string;
//   emailVerified: boolean;
//   lastLoginAt?: string;
//   lastLogoutAt?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// interface EditUserModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   user: User | null;
// }

// export function EditUserModal({
//   isOpen,
//   onClose,
//   onSuccess,
//   user,
// }: EditUserModalProps) {
//   const { user: currentUser } = useAuth();
//   const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

//   const { updateUser, isLoading, error } = useUpdateUser();

//   const [formData, setFormData] = useState<UpdateUserPayload>({
//     firstName: "",
//     lastName: "",
//     email: "",
//     phone: "",
//     status: "ACTIVE",
//     bio: "",
//     dateOfBirth: "",
//   });

//   // Populate form when user data changes
//   useEffect(() => {
//     if (user) {
//       setFormData({
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email || "",
//         phone: user.phone,
//         status: user.status,
//         bio: user.bio || "",
//         dateOfBirth: user.dateOfBirth
//           ? new Date(user.dateOfBirth).toISOString().split("T")[0]
//           : "",
//       });
//     }
//   }, [user]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!user) return;

//     try {
//       await updateUser(user.id, formData);
//       onSuccess();
//       onClose();
//     } catch (err) {
//       console.error("Failed to update user:", err);
//     }
//   };

//   const canEditRole = () => {
//     if (!user) return false;
//     // Super admin can edit any role
//     if (isSuperAdmin) return true;
//     // Admin cannot edit admin or super admin roles
//     if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") return false;
//     return true;
//   };

//   const getRoleBadgeColor = (role: string) => {
//     switch (role) {
//       case "SUPER_ADMIN":
//         return "bg-red-100 text-red-800";
//       case "ADMIN":
//         return "bg-purple-100 text-purple-800";
//       case "INTERNAL_TEACHER":
//         return "bg-blue-100 text-blue-800";
//       case "EXTERNAL_TEACHER":
//         return "bg-cyan-100 text-cyan-800";
//       case "INTERNAL_STUDENT":
//         return "bg-green-100 text-green-800";
//       case "EXTERNAL_STUDENT":
//         return "bg-yellow-100 text-yellow-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   const formatRoleName = (role: string) => {
//     return role
//       .replace(/_/g, " ")
//       .replace(/\b\w/g, (char) => char.toUpperCase());
//   };

//   if (!user) return null;

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-2xl">Edit User</DialogTitle>
//           <DialogDescription>
//             Update user information. Changes will be saved immediately.
//           </DialogDescription>
//         </DialogHeader>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* User Info Header */}
//           <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
//             {user.avatar ? (
//               <img
//                 src={user.avatar}
//                 alt={`${user.firstName} ${user.lastName}`}
//                 className="h-16 w-16 rounded-full object-cover"
//               />
//             ) : (
//               <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
//                 <span className="text-blue-700 font-bold text-xl">
//                   {user.firstName[0]}
//                   {user.lastName[0]}
//                 </span>
//               </div>
//             )}
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900">
//                 {user.firstName} {user.lastName}
//               </h3>
//               <span
//                 className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}
//               >
//                 {formatRoleName(user.role)}
//               </span>
//             </div>
//           </div>

//           {/* Personal Information */}
//           <div className="space-y-4">
//             <h3 className="text-lg font-semibold text-gray-900">
//               Personal Information
//             </h3>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="edit-firstName">
//                   First Name <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="edit-firstName"
//                   value={formData.firstName}
//                   onChange={(e) =>
//                     setFormData({ ...formData, firstName: e.target.value })
//                   }
//                   placeholder="John"
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="edit-lastName">
//                   Last Name <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="edit-lastName"
//                   value={formData.lastName}
//                   onChange={(e) =>
//                     setFormData({ ...formData, lastName: e.target.value })
//                   }
//                   placeholder="Doe"
//                   required
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
//               <Input
//                 id="edit-dateOfBirth"
//                 type="date"
//                 value={formData.dateOfBirth}
//                 onChange={(e) =>
//                   setFormData({ ...formData, dateOfBirth: e.target.value })
//                 }
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="edit-bio">Bio / Description</Label>
//               <textarea
//                 id="edit-bio"
//                 value={formData.bio}
//                 onChange={(e) =>
//                   setFormData({ ...formData, bio: e.target.value })
//                 }
//                 placeholder="Brief description about the user..."
//                 className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
//               />
//             </div>
//           </div>

//           {/* Contact Information */}
//           <div className="space-y-4">
//             <h3 className="text-lg font-semibold text-gray-900">
//               Contact Information
//             </h3>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="edit-phone">
//                   Phone Number <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="edit-phone"
//                   value={formData.phone}
//                   disabled
//                   placeholder="+94712345678"
//                   className="bg-gray-50 cursor-not-allowed"
//                 />
//                 <p className="text-xs text-gray-500">
//                   Phone number cannot be changed
//                 </p>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="edit-email">Email</Label>
//                 <Input
//                   id="edit-email"
//                   type="email"
//                   value={formData.email}
//                   disabled
//                   placeholder="user@example.com"
//                   className="bg-gray-50 cursor-not-allowed"
//                 />
//                 <p className="text-xs text-gray-500">Email cannot be changed</p>
//               </div>
//             </div>
//           </div>

//           {/* Status */}
//           {canEditRole() && (
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold text-gray-900">
//                 Status & Access
//               </h3>

//               <div className="space-y-2">
//                 <Label htmlFor="edit-status">
//                   Account Status <span className="text-red-500">*</span>
//                 </Label>
//                 <Select
//                   value={formData.status}
//                   onValueChange={(value: any) =>
//                     setFormData({ ...formData, status: value })
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="ACTIVE">Active</SelectItem>
//                     <SelectItem value="INACTIVE">Inactive</SelectItem>
//                     <SelectItem value="SUSPENDED">Suspended</SelectItem>
//                   </SelectContent>
//                 </Select>
//                 <p className="text-xs text-gray-500">
//                   {formData.status === "ACTIVE" &&
//                     "User can access the system normally"}
//                   {formData.status === "INACTIVE" &&
//                     "User account is inactive but not suspended"}
//                   {formData.status === "SUSPENDED" &&
//                     "User is temporarily suspended from the system"}
//                 </p>
//               </div>
//             </div>
//           )}

//           {/* Account Info */}
//           <div className="p-4 bg-gray-50 rounded-lg space-y-2">
//             <h4 className="text-sm font-semibold text-gray-700">
//               Account Information
//             </h4>
//             <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
//               <div>
//                 <span className="font-medium">Created:</span>{" "}
//                 {new Date(user.createdAt).toLocaleDateString()}
//               </div>
//               <div>
//                 <span className="font-medium">Updated:</span>{" "}
//                 {new Date(user.updatedAt).toLocaleDateString()}
//               </div>
//               {user.lastLoginAt && (
//                 <div>
//                   <span className="font-medium">Last Login:</span>{" "}
//                   {new Date(user.lastLoginAt).toLocaleDateString()}
//                 </div>
//               )}
//               <div>
//                 <span className="font-medium">Email Verified:</span>{" "}
//                 {user.emailVerified ? "Yes" : "No"}
//               </div>
//             </div>
//           </div>

//           {error && (
//             <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//               <p className="text-sm text-red-600">{error.message}</p>
//             </div>
//           )}

//           <DialogFooter>
//             <Button
//               type="button"
//               variant="outline"
//               onClick={onClose}
//               disabled={isLoading}
//             >
//               Cancel
//             </Button>
//             <Button type="submit" disabled={isLoading}>
//               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//               Save Changes
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  GraduationCap,
  Briefcase,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { GradeSelect, BatchSelect } from "@/components/shared/selects";
import { ApiClient } from "@/lib/api/api-client";
import { usersApi } from "@/lib/api/endpoints/users";
import { createLogger } from "@/lib/utils/logger";
const logger = createLogger("EditUserModal");
import { toast } from "sonner";
import { useEnums } from "@/lib/hooks/use-enums";
import ResetPasswordModal from "./ResetPasswordModal";
import { handleApiError, handleApiSuccess } from "@/lib/error-handling";
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

interface Subject {
  id: string;
  name: string;
  medium?: string;
}

interface District {
  id: string;
  name: string;
}

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  medium?: string;
  institution?: string;
  dateOfBirth?: string;
  bio?: string;
  address?: string;
  city?: string;
  districtId?: string;
  postalCode?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  studentProfile?: {
    grade?: string | { id: string; name: string };
    batch?: string | { id: string; name: string };
  };
  teacherProfile?: {
    specialization?: string;
    experience?: number;
  };
  teachingSubjects?: Subject[];
}

interface EditUserModalProps {
  open: boolean;
  user: UserData | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  dateOfBirth: string;
  bio: string;
  address: string;
  city: string;
  districtId?: string;
  postalCode: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  grade?: string;
  batch?: string;
  specialization?: string;
  experience?: string;
}

const USER_ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin", color: "bg-red-500" },
  { value: "ADMIN", label: "Admin", color: "bg-orange-500" },
  {
    value: "INTERNAL_TEACHER",
    label: "Internal Teacher",
    color: "bg-blue-500",
  },
  {
    value: "EXTERNAL_TEACHER",
    label: "External Teacher",
    color: "bg-cyan-500",
  },
  {
    value: "INTERNAL_STUDENT",
    label: "Internal Student",
    color: "bg-green-500",
  },
  {
    value: "EXTERNAL_STUDENT",
    label: "External Student",
    color: "bg-emerald-500",
  },
];

const USER_STATUSES = [
  { value: "ACTIVE", label: "Active", color: "bg-green-500" },
  { value: "INACTIVE", label: "Inactive", color: "bg-gray-500" },
  { value: "PENDING", label: "Pending", color: "bg-yellow-500" },
  { value: "SUSPENDED", label: "Suspended", color: "bg-red-500" },
];

const EditUserModal: React.FC<EditUserModalProps> = ({
  open,
  user,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const [formData, setFormData] = useState<UserFormData | null>(null);
  const [originalData, setOriginalData] = useState<UserFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showRoleChangeConfirm, setShowRoleChangeConfirm] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("basic");

  const { grades, mediums, loading: enumsLoading } = useEnums();

  const isStudent = user?.role.includes("STUDENT");
  const isTeacher = user?.role.includes("TEACHER");

  useEffect(() => {
    if (open && user) {
      const initialData: UserFormData = {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "",
        status: user.status || "ACTIVE",
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
        bio: user.bio || "",
        address: user.address || "",
        city: user.city || "",
        districtId: user.districtId || "",
        postalCode: user.postalCode || "",
        phoneVerified: user.phoneVerified || false,
        emailVerified: user.emailVerified || false,
        twoFactorEnabled: user.twoFactorEnabled || false,
        grade:
          typeof user.studentProfile?.grade === "object" &&
          user.studentProfile?.grade
            ? user.studentProfile.grade.id
            : (user.studentProfile?.grade as string | undefined) || "",
        batch:
          typeof user.studentProfile?.batch === "object" &&
          user.studentProfile?.batch
            ? user.studentProfile.batch.id
            : (user.studentProfile?.batch as string | undefined) || "",
        specialization: user.teacherProfile?.specialization || "",
        experience: user.teacherProfile?.experience?.toString() || "",
      };
      setFormData(initialData);
      setOriginalData(initialData);
      setActiveTab("basic");

      fetchDistricts();
      if (isTeacher) {
        fetchSubjects();
      }
    }
  }, [open, user, isTeacher]);

  const fetchSubjects = async () => {
    try {
      const response = await ApiClient.get<Subject[]>("/subjects");
      setSubjects(Array.isArray(response) ? response : []);
    } catch (error) {
      handleApiError(error, "EditUserModal.fetchSubjects");
    }
  };

  const fetchDistricts = async () => {
    try {
      const response = await ApiClient.get<District[]>("/admin/districts");
      setDistricts(Array.isArray(response) ? response : []);
    } catch (error) {
      // Silently fail - districts are optional
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleRoleChange = (newRole: string) => {
    if (newRole !== formData?.role) {
      setPendingRoleChange(newRole);
      setShowRoleChangeConfirm(true);
    }
  };

  const confirmRoleChange = () => {
    if (pendingRoleChange) {
      handleInputChange("role", pendingRoleChange);
    }
    setShowRoleChangeConfirm(false);
    setPendingRoleChange(null);
  };

  const hasChanges = (): boolean => {
    if (!formData || !originalData) return false;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  const validateForm = (): boolean => {
    if (!formData) return false;

    if (!formData.firstName.trim()) {
      toast.error(t("modals.editUser.validation.firstNameRequired"));
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error(t("modals.editUser.validation.lastNameRequired"));
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error(t("modals.editUser.validation.phoneRequired"));
      return false;
    }
    // Email validation if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error(t("modals.editUser.validation.invalidEmail"));
      return false;
    }
    // Phone validation
    if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ""))) {
      toast.error(t("modals.editUser.validation.invalidPhone"));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user || !formData || !validateForm()) return;

    setLoading(true);
    try {
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        role: formData.role,
        status: formData.status,
        dateOfBirth: formData.dateOfBirth || undefined,
        bio: formData.bio.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        districtId:
          formData.districtId === "__none__"
            ? null
            : formData.districtId || undefined,
        postalCode: formData.postalCode.trim() || undefined,
        phoneVerified: formData.phoneVerified,
        emailVerified: formData.emailVerified,
        twoFactorEnabled: formData.twoFactorEnabled,
      };

      // Add role-specific profile data
      if (formData.role.includes("STUDENT")) {
        payload.studentProfile = {
          grade: formData.grade || undefined,
          batch: formData.batch || undefined,
        };
      }

      if (formData.role.includes("TEACHER")) {
        payload.teacherProfile = {
          specialization: formData.specialization || undefined,
          experience: formData.experience
            ? parseInt(formData.experience)
            : undefined,
        };
      }

      if (!user.id) {
        toast.error("User ID is missing. Cannot update user.");
        return;
      }

      await usersApi.update(user.id, payload);

      handleApiSuccess(t("modals.editUser.userUpdated"));
      onSuccess();
      onClose();
    } catch (error) {
      handleApiError(error, "EditUserModal", t("modals.editUser.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData(null);
      setOriginalData(null);
      onClose();
    }
  };

  if (!user || !formData) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">
                  {t("modals.editUser.title")}
                </DialogTitle>
                <DialogDescription>
                  {t("modals.editUser.description", {
                    name: `${user.firstName} ${user.lastName}`,
                  })}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetPasswordModal(true)}
                  disabled={loading}
                  className="gap-2"
                >
                  <KeyRound className="h-4 w-4" />
                  {t("modals.editUser.resetPassword")}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1"
          >
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="gap-2">
                  <User className="h-4 w-4" />
                  {t("modals.editUser.tabs.basicInfo")}
                </TabsTrigger>
                <TabsTrigger value="contact" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  {t("modals.editUser.tabs.contact")}
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Shield className="h-4 w-4" />
                  {t("modals.editUser.tabs.security")}
                </TabsTrigger>
                <TabsTrigger value="profile" className="gap-2">
                  {isStudent ? (
                    <GraduationCap className="h-4 w-4" />
                  ) : (
                    <Briefcase className="h-4 w-4" />
                  )}
                  {t("modals.editUser.tabs.profile")}
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[calc(95vh-220px)] px-6 py-4">
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {t("modals.editUser.personalInfo")}
                    </CardTitle>
                    <CardDescription>
                      {t("modals.editUser.personalInfoDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">
                          <User className="h-4 w-4 inline mr-2" />
                          {t("modals.editUser.firstName")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) =>
                            handleInputChange("firstName", e.target.value)
                          }
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">
                          {t("modals.editUser.lastName")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) =>
                            handleInputChange("lastName", e.target.value)
                          }
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          <Mail className="h-4 w-4 inline mr-2" />
                          {t("modals.editUser.emailAddress")}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          placeholder="john.doe@example.com"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("modals.editUser.emailChangeNote")}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          <Phone className="h-4 w-4 inline mr-2" />
                          {t("modals.editUser.phoneNumber")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          placeholder="+94712345678"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("modals.editUser.phoneChangeNote")}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">
                          <Calendar className="h-4 w-4 inline mr-2" />
                          {t("modals.editUser.dateOfBirth")}
                        </Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) =>
                            handleInputChange("dateOfBirth", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("modals.editUser.createdAt")}</Label>
                        <Input
                          value={
                            user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString()
                              : "N/A"
                          }
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">{t("modals.editUser.bio")}</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) =>
                          handleInputChange("bio", e.target.value)
                        }
                        placeholder={t("modals.editUser.bioPlaceholder")}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {t("modals.editUser.roleAndStatus")}
                    </CardTitle>
                    <CardDescription>
                      {t("modals.editUser.roleAndStatusDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("modals.editUser.userRole")}</Label>
                        <Select
                          value={formData.role}
                          onValueChange={handleRoleChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {USER_ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${role.color}`}
                                  />
                                  {role.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {t("modals.editUser.roleChangeWarning")}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("modals.editUser.accountStatus")}</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(v) => handleInputChange("status", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {USER_STATUSES.map((status) => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${status.color}`}
                                  />
                                  {status.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value="contact" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {t("modals.editUser.addressInfo")}
                    </CardTitle>
                    <CardDescription>
                      {t("modals.editUser.addressInfoDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">
                        {t("modals.editUser.streetAddress")}
                      </Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">
                          {t("modals.editUser.city")}
                        </Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) =>
                            handleInputChange("city", e.target.value)
                          }
                          placeholder="Colombo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("modals.editUser.district")}</Label>
                        <Select
                          value={formData.districtId}
                          onValueChange={(v) =>
                            handleInputChange(
                              "districtId",
                              v === "__none__" ? "__none__" : v
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("modals.editUser.selectDistrict")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              {tCommon("none")}
                            </SelectItem>
                            {districts
                              .filter((district) => district.id)
                              .map((district) => (
                                <SelectItem
                                  key={district.id}
                                  value={district.id}
                                >
                                  {district.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">
                          {t("modals.editUser.postalCode")}
                        </Label>
                        <Input
                          id="postalCode"
                          value={formData.postalCode}
                          onChange={(e) =>
                            handleInputChange("postalCode", e.target.value)
                          }
                          placeholder="10100"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {t("modals.editUser.verificationStatus")}
                    </CardTitle>
                    <CardDescription>
                      {t("modals.editUser.verificationStatusDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${formData.phoneVerified ? "bg-green-100" : "bg-gray-100"}`}
                        >
                          <Phone
                            className={`h-5 w-5 ${formData.phoneVerified ? "text-green-600" : "text-gray-400"}`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">
                            {t("modals.editUser.phoneVerified")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("modals.editUser.phoneVerifiedDesc")}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.phoneVerified}
                        onCheckedChange={(v) =>
                          handleInputChange("phoneVerified", v)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${formData.emailVerified ? "bg-green-100" : "bg-gray-100"}`}
                        >
                          <Mail
                            className={`h-5 w-5 ${formData.emailVerified ? "text-green-600" : "text-gray-400"}`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">
                            {t("modals.editUser.emailVerified")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("modals.editUser.emailVerifiedDesc")}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.emailVerified}
                        onCheckedChange={(v) =>
                          handleInputChange("emailVerified", v)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${formData.twoFactorEnabled ? "bg-green-100" : "bg-gray-100"}`}
                        >
                          <Shield
                            className={`h-5 w-5 ${formData.twoFactorEnabled ? "text-green-600" : "text-gray-400"}`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">
                            {t("modals.editUser.twoFactorAuth")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("modals.editUser.twoFactorAuthDesc")}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.twoFactorEnabled}
                        onCheckedChange={(v) =>
                          handleInputChange("twoFactorEnabled", v)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {t("modals.editUser.accountActions")}
                    </CardTitle>
                    <CardDescription>
                      {t("modals.editUser.accountActionsDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {t("modals.editUser.resetPassword")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("modals.editUser.resetPasswordDesc")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowResetPasswordModal(true)}
                        className="gap-2"
                      >
                        <KeyRound className="h-4 w-4" />
                        {t("modals.editUser.reset")}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200">
                          {t("modals.editUser.lastLogin")}
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleString()
                            : t("modals.editUser.neverLoggedIn")}
                        </p>
                      </div>
                      <Info className="h-5 w-5 text-amber-600" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-0 space-y-4">
                {formData.role.includes("STUDENT") && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        {t("modals.editUser.studentInfo")}
                      </CardTitle>
                      <CardDescription>
                        {t("modals.editUser.studentInfoDesc")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>
                            {t("modals.editUser.grade")}{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <GradeSelect
                            value={formData.grade}
                            onValueChange={(v) => {
                              handleInputChange("grade", v);
                              handleInputChange("batch", "");
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("modals.editUser.batch")}</Label>
                          <BatchSelect
                            gradeId={formData.grade}
                            value={formData.batch}
                            onValueChange={(v) => handleInputChange("batch", v)}
                            disabled={!formData.grade}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {t("modals.editUser.mediumNote")}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {formData.role.includes("TEACHER") && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        {t("modals.editUser.teacherInfo")}
                      </CardTitle>
                      <CardDescription>
                        {t("modals.editUser.teacherInfoDesc")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="specialization">
                            {t("modals.editUser.specialization")}
                          </Label>
                          <Input
                            id="specialization"
                            value={formData.specialization}
                            onChange={(e) =>
                              handleInputChange(
                                "specialization",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Mathematics, Physics"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="experience">
                            {t("modals.editUser.yearsExperience")}
                          </Label>
                          <Input
                            id="experience"
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
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                          <Info className="h-4 w-4 flex-shrink-0" />
                          <span>
                            {t("modals.editUser.subjectAssignmentNote")}
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!formData.role.includes("STUDENT") &&
                  !formData.role.includes("TEACHER") && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {t("modals.editUser.adminProfile")}
                        </CardTitle>
                        <CardDescription>
                          {t("modals.editUser.adminProfileDesc")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                          <Shield className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {t("modals.editUser.adminAccount")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {t("modals.editUser.adminAccountDesc")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <Separator />

          <DialogFooter className="px-6 py-4">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                {hasChanges() && (
                  <span className="text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {t("modals.editUser.unsavedChanges")}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !hasChanges()}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {tCommon("saveChanges")}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Confirmation */}
      <AlertDialog
        open={showRoleChangeConfirm}
        onOpenChange={setShowRoleChangeConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("modals.editUser.roleChangeTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("modals.editUser.roleChangeDesc", {
                currentRole: formData.role.replace(/_/g, " "),
                newRole: pendingRoleChange?.replace(/_/g, " ") ?? "",
              })}
              <br />
              <br />
              {t("modals.editUser.roleChangeEffects")}
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{t("modals.editUser.roleChangeEffect1")}</li>
                <li>{t("modals.editUser.roleChangeEffect2")}</li>
                <li>{t("modals.editUser.roleChangeEffect3")}</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingRoleChange(null)}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              {t("modals.editUser.confirmChange")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Modal */}
      <ResetPasswordModal
        open={showResetPasswordModal}
        userId={user.id}
        userName={`${user.firstName} ${user.lastName}`}
        onClose={() => setShowResetPasswordModal(false)}
        onSuccess={() => {
          toast.success(
            `Password reset for ${user.firstName} ${user.lastName}`
          );
        }}
      />
    </>
  );
};

export default EditUserModal;
