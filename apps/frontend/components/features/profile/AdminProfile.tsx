"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Upload,
  Camera,
  Lock,
  Shield,
  Briefcase,
  Building,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
const logger = createLogger("AdminProfilePage");
import { format } from "date-fns";
import { authApi } from "@/lib/api/endpoints";
import { adminApi } from "@/lib/api/endpoints/admin";
import { useAuthStore } from "@/stores/auth-store";
import Image from "next/image";

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  avatar?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  // district can exist as an id or an object with id/name depending on the API shape
  district?: string | { id: string; name: string };
  postalCode?: string;
  createdAt?: string;
}

export default function AdminProfilePage() {
  const { user: storeUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    createdAt: new Date().toISOString(),
  });
  const [editedProfile, setEditedProfile] = useState<Partial<ProfileData>>({});
  const [districts, setDistricts] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
    // Preload districts for enumeration dropdowns
    loadDistricts();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authApi.getProfile();
      // Backend returns { user: User }, so we need to extract the user
      const userData = response.user || response;
      setProfile(userData);
      // Ensure the edited profile holds district id (for select) if available
      const districtValue =
        typeof userData.district === "object" && userData.district
          ? userData.district.id
          : userData.district || "";
      setEditedProfile({
        ...userData,
        district: districtValue,
        dateOfBirth: userData.dateOfBirth
          ? format(new Date(userData.dateOfBirth), "yyyy-MM-dd")
          : "",
      });
    } catch (error) {
      logger.error("Failed to fetch profile:", error);
      const errorMessage =
        asApiError(error).response?.data?.message ||
        asApiError(error).message ||
        "Failed to load profile";
      setError(errorMessage);
      handleApiError(
        error,
        "AdminProfile.fetchProfile",
        "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedProfile) return;

    try {
      setSaving(true);
      // Extract district value - could be string ID or object with id
      const districtValue =
        typeof editedProfile.district === "object" && editedProfile.district
          ? editedProfile.district.id
          : editedProfile.district;
      const updateData = {
        // Phone is intentionally excluded - primary phone cannot be changed
        // Include firstName/lastName/dateOfBirth now that they're editable
        firstName: editedProfile.firstName,
        lastName: editedProfile.lastName,
        dateOfBirth: editedProfile.dateOfBirth,
        address: editedProfile.address,
        city: editedProfile.city,
        // district may be sent as id (string) or name by older clients; ensure we send a string
        district: districtValue,
        postalCode: editedProfile.postalCode,
      };

      const response = await authApi.updateProfile(updateData);
      toast.success("Profile updated successfully");
      setEditMode(false);
      // Backend returns { user: User }
      const userData = response.user || response;
      setProfile(userData);
      const updatedDistrictValue =
        typeof userData.district === "object" && userData.district
          ? userData.district.id
          : userData.district || "";
      setEditedProfile({
        ...userData,
        district: updatedDistrictValue,
        dateOfBirth: userData.dateOfBirth
          ? format(new Date(userData.dateOfBirth), "yyyy-MM-dd")
          : "",
      });
    } catch (error) {
      logger.error("Failed to update profile:", error);
      handleApiError(
        error,
        "AdminProfile.handleSaveProfile",
        "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const loadDistricts = async () => {
    try {
      setDistrictsLoading(true);
      const res = await adminApi.getDistricts();
      setDistricts(res.districts.map((d) => ({ id: d.id, name: d.name })));
    } catch (e) {
      // Fail silently; will show fallback options
      setDistricts([]);
    } finally {
      setDistrictsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      await authApi.uploadAvatar(file);
      toast.success("Avatar updated successfully");
      fetchProfile();
    } catch (error) {
      logger.error("Failed to upload avatar:", error);
      handleApiError(
        error,
        "AdminProfile.handleAvatarUpload",
        "Failed to upload avatar"
      );
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      await authApi.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      toast.success("Password changed successfully");
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      logger.error("Failed to change password:", error);
      handleApiError(
        error,
        "AdminProfile.handleChangePassword",
        "Failed to change password"
      );
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    if (!role) return "bg-muted text-foreground border-border";
    if (role === "SUPER_ADMIN")
      return "bg-purple-100 text-purple-800 border-purple-200";
    if (role === "ADMIN") return "bg-blue-100 text-blue-800 border-blue-200";
    if (role.includes("TEACHER"))
      return "bg-green-100 text-green-800 border-green-200";
    return "bg-muted text-foreground border-border";
  };

  const formatRole = (role?: string) => {
    if (!role) return "Guest";
    return role
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <User className="h-16 w-16 text-destructive opacity-50" />
        <h3 className="text-xl font-semibold text-destructive">
          Failed to Load Profile
        </h3>
        <p className="text-muted-foreground max-w-md text-center">{error}</p>
        <Button onClick={fetchProfile} variant="outline">
          <Loader2 className="mr-2 h-4 w-4" />
          Retry Loading
        </Button>
      </div>
    );
  }

  if (!profile || !profile.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <User className="h-16 w-16 text-muted-foreground opacity-50" />
        <h3 className="text-xl font-semibold">No Profile Data</h3>
        <p className="text-muted-foreground">
          Profile information is not available
        </p>
        <Button onClick={fetchProfile}>Reload Profile</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border shadow-xl bg-card">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-400">
                    <User className="h-16 w-16 text-white" />
                  </div>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-card rounded-full cursor-pointer hover:bg-primary/5"
              >
                <Camera className="h-5 w-5 text-muted-foreground" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  aria-label="Upload profile picture"
                />
              </label>
            </div>

            {/* Name and Role */}
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {profile.firstName && profile.lastName
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile.firstName || profile.lastName || "User"}
              </h1>
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-1 text-sm font-medium rounded-full border-2 ${getRoleBadgeColor(
                    profile.role
                  )}`}
                >
                  <Shield className="h-3 w-3 inline mr-1" />
                  {formatRole(profile.role)}
                </span>
                {profile.createdAt && (
                  <div className="flex items-center gap-2 text-white/90">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      Member since{" "}
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!editMode ? (
              <>
                <Button
                  onClick={() => setEditMode(true)}
                  className="bg-card text-blue-600 hover:bg-muted"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  onClick={() => setShowPasswordModal(true)}
                  variant="outline"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
                <Button
                  onClick={() => {
                    setEditMode(false);
                    const districtVal =
                      typeof profile.district === "object" && profile.district
                        ? profile.district.id
                        : profile.district || "";
                    setEditedProfile({
                      ...profile,
                      district: districtVal,
                    });
                  }}
                  variant="outline"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Personal Information
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="first-name"
                  className="block text-sm font-medium text-muted-foreground mb-2"
                >
                  First Name
                </label>
                {editMode ? (
                  <input
                    id="first-name"
                    type="text"
                    value={editedProfile.firstName || ""}
                    // First name now editable
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        firstName: e.target.value,
                      })
                    }
                    placeholder="Enter first name"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    // enable editing
                  />
                ) : (
                  <p className="text-foreground font-medium">
                    {profile.firstName || (
                      <span className="text-muted-foreground italic">
                        Not set
                      </span>
                    )}
                  </p>
                )}
                {/* Allow editing of first name */}
              </div>

              <div>
                <label
                  htmlFor="last-name"
                  className="block text-sm font-medium text-muted-foreground mb-2"
                >
                  Last Name
                </label>
                {editMode ? (
                  <input
                    id="last-name"
                    type="text"
                    value={editedProfile.lastName || ""}
                    // Last name now editable
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        lastName: e.target.value,
                      })
                    }
                    placeholder="Enter last name"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    // enable editing
                  />
                ) : (
                  <p className="text-foreground font-medium">
                    {profile.lastName || (
                      <span className="text-muted-foreground italic">
                        Not set
                      </span>
                    )}
                  </p>
                )}
                {/* Allow editing of last name */}
              </div>
            </div>

            <div>
              <label
                htmlFor="date-of-birth"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2"
              >
                <Calendar className="h-4 w-4" />
                Date of Birth
              </label>
              {editMode ? (
                <input
                  id="date-of-birth"
                  type="date"
                  value={editedProfile.dateOfBirth || ""}
                  // Date of birth now editable
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      dateOfBirth: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  // enable editing
                />
              ) : (
                <p className="text-foreground font-medium">
                  {profile.dateOfBirth
                    ? new Date(profile.dateOfBirth).toLocaleDateString()
                    : "Not set"}
                </p>
              )}
              {/* Allow editing of date of birth */}
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Contact Information
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="profile-email"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2"
              >
                <Mail className="h-4 w-4" />
                Email Address
              </label>
              <p id="profile-email" className="text-foreground font-medium">
                {profile.email || (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {profile.email
                  ? "Email cannot be changed"
                  : "No email registered"}
              </p>
            </div>

            <div>
              <label
                htmlFor="profile-phone"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2"
              >
                <Phone className="h-4 w-4" />
                Phone Number
              </label>
              <p id="profile-phone" className="text-foreground font-medium">
                {profile.phone || (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Primary phone number cannot be changed
              </p>
            </div>
          </div>
        </Card>

        {/* Address Information */}
        <Card className="p-6 md:col-span-2">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Address Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label
                htmlFor="profile-address"
                className="block text-sm font-medium text-muted-foreground mb-2"
              >
                Street Address
              </label>
              {editMode ? (
                <input
                  id="profile-address"
                  type="text"
                  value={editedProfile.address || ""}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      address: e.target.value,
                    })
                  }
                  placeholder="123 Main Street"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-foreground font-medium">
                  {[
                    profile.address,
                    profile.city,
                    typeof profile.district === "object" && profile.district
                      ? profile.district.name
                      : profile.district,
                    profile.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Not set"}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="profile-city"
                className="block text-sm font-medium text-muted-foreground mb-2"
              >
                City
              </label>
              {editMode ? (
                <input
                  id="profile-city"
                  type="text"
                  value={editedProfile.city || ""}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, city: e.target.value })
                  }
                  placeholder="Colombo"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-foreground font-medium">
                  {profile.city || "Not set"}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="profile-district"
                className="block text-sm font-medium text-muted-foreground mb-2"
              >
                District
              </label>
              {editMode ? (
                <select
                  id="profile-district"
                  value={
                    typeof editedProfile.district === "object" &&
                    editedProfile.district
                      ? editedProfile.district.id
                      : editedProfile.district || ""
                  }
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      district: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Select district"
                  disabled={districtsLoading}
                >
                  <option value="">
                    {districtsLoading
                      ? "Loading districts..."
                      : "Select District"}
                  </option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-foreground font-medium">
                  {typeof profile.district === "object" && profile.district
                    ? profile.district.name
                    : profile.district || "Not set"}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="profile-postal"
                className="block text-sm font-medium text-muted-foreground mb-2"
              >
                Postal Code
              </label>
              {editMode ? (
                <input
                  id="profile-postal"
                  type="text"
                  value={editedProfile.postalCode || ""}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      postalCode: e.target.value,
                    })
                  }
                  placeholder="10100"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-foreground font-medium">
                  {profile.postalCode || "Not set"}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                Change Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close password modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="current-password"
                  className="block text-sm font-medium text-muted-foreground mb-2"
                >
                  Current Password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-muted-foreground mb-2"
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-muted-foreground mb-2"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleChangePassword}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                >
                  Change Password
                </Button>
                <Button
                  onClick={() => setShowPasswordModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
