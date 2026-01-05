"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLogger } from "@/lib/utils/logger";
import { getErrorMessage } from "@/lib/error-handling";
const logger = createLogger("ExternalTeacherSignUp");
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  Lock,
  User,
  Mail,
  BookOpen,
  School,
  MapPin,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useRegisterMutation } from "@/lib/hooks/queries/useAuth";
import { authApi } from "@/lib/api/endpoints/auth";

interface RegistrationOptions {
  zones: string[];
  districts: string[];
  subjects: string[];
  mediums: string[];
  levels: string[];
}

const STEPS = [
  { id: 1, title: "Personal Details", icon: User },
  { id: 2, title: "Professional Info", icon: School },
  { id: 3, title: "Transfer Preferences", icon: MapPin },
  { id: 4, title: "Review & Submit", icon: Check },
];

export default function ExternalTeacherSignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic user info
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "EXTERNAL_TEACHER" as const,

    // Teacher specific fields
    registrationId: "",
    currentSchool: "",
    currentZone: "",
    currentDistrict: "",
    desiredZones: [] as string[],
    subject: "",
    medium: "",
    level: "",
    acceptTerms: false,
  });

  const [error, setError] = useState("");
  const [options, setOptions] = useState<RegistrationOptions>({
    zones: [],
    districts: [],
    subjects: [],
    mediums: [],
    levels: [],
  });
  const [optionsLoading, setOptionsLoading] = useState(true);

  const user = useAuthStore((state) => state.user);
  const { mutate: register, isPending } = useRegisterMutation();
  const router = useRouter();

  // Fetch registration options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const data = await authApi.getRegistrationOptions();
        setOptions(data);
      } catch (error) {
        logger.error(
          "Failed to fetch registration options:",
          getErrorMessage(error)
        );
        // Fallback to mock data if API fails
        setOptions({
          zones: ["Colombo", "Gampaha", "Kalutara", "Kandy", "Galle", "Matara"],
          districts: [
            "Colombo",
            "Gampaha",
            "Kalutara",
            "Kandy",
            "Galle",
            "Matara",
            "Ratnapura",
          ],
          subjects: [
            "Mathematics",
            "Science",
            "English",
            "Sinhala",
            "History",
            "Geography",
            "ICT",
          ],
          mediums: ["Sinhala", "English", "Tamil"],
          levels: [
            "Primary (Grade 1-5)",
            "Junior Secondary (Grade 6-9)",
            "O/L (Grade 10-11)",
            "A/L (Grade 12-13)",
          ],
        });
      } finally {
        setOptionsLoading(false);
      }
    };

    fetchOptions();
  }, []);

  // Redirect if user becomes available (already logged in)
  useEffect(() => {
    if (user) {
      router.push("/teacher");
    }
  }, [user, router]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(""); // Clear error when user types
  };

  const handleZoneSelect = (zone: string) => {
    setFormData((prev) => {
      const currentZones = prev.desiredZones;
      const updatedZones = currentZones.includes(zone)
        ? currentZones.filter((z) => z !== zone)
        : [...currentZones, zone];

      return { ...prev, desiredZones: updatedZones };
    });
  };

  const validateStep = (step: number): boolean => {
    setError("");

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) {
          setError("First name is required");
          return false;
        }
        if (!formData.lastName.trim()) {
          setError("Last name is required");
          return false;
        }
        if (!formData.phone.trim()) {
          setError("Phone number is required");
          return false;
        }
        if (!formData.password) {
          setError("Password is required");
          return false;
        }
        if (formData.password.length < 8) {
          setError("Password must be at least 8 characters");
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return false;
        }
        return true;

      case 2:
        if (!formData.registrationId.trim()) {
          setError("Teacher registration ID is required");
          return false;
        }
        if (!formData.currentSchool.trim()) {
          setError("Current school is required");
          return false;
        }
        if (!formData.currentZone) {
          setError("Current zone is required");
          return false;
        }
        if (!formData.currentDistrict) {
          setError("Current district is required");
          return false;
        }
        if (!formData.subject) {
          setError("Teaching subject is required");
          return false;
        }
        if (!formData.medium) {
          setError("Teaching medium is required");
          return false;
        }
        if (!formData.level) {
          setError("Teaching level is required");
          return false;
        }
        return true;

      case 3:
        if (formData.desiredZones.length === 0) {
          setError("Please select at least one preferred transfer zone");
          return false;
        }
        return true;

      case 4:
        if (!formData.acceptTerms) {
          setError("You must accept the terms and conditions to proceed");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(4)) {
      return;
    }

    try {
      register(formData, {
        onSuccess: () => {
          // Redirect will happen automatically via useEffect in sign-in page
          router.push("/teacher");
        },
        onError: (err: unknown) => {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to create teacher account. Please try again.";
          setError(message);
        },
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      setError(message);
    }
  };

  // Show loading state while loading options
  if (optionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Loading registration form...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Side - Form */}
      <div className="flex w-full lg:w-7/12 items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              External Teacher Registration
            </h1>
            <p className="text-gray-600 mt-2">
              Register for Mutual Transfer Program
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? "bg-green-500 text-white"
                            : isCurrent
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="text-xs mt-2 text-center hidden sm:block">
                        <p
                          className={`font-medium ${
                            isCurrent ? "text-blue-600" : "text-gray-500"
                          }`}
                        >
                          {step.title}
                        </p>
                      </div>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`h-1 flex-1 mx-2 ${
                          isCompleted ? "bg-green-500" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-lg shadow-md p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Step 1: Personal Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Personal Details
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Please provide your basic information
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="Enter your first name"
                          value={formData.firstName}
                          onChange={(e) =>
                            handleInputChange("firstName", e.target.value)
                          }
                          className="pl-10"
                          disabled={isPending}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Enter your last name"
                          value={formData.lastName}
                          onChange={(e) =>
                            handleInputChange("lastName", e.target.value)
                          }
                          className="pl-10"
                          disabled={isPending}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Mobile Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+94712345678"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className="pl-10"
                        disabled={isPending}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      This will be your username for login
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="pl-10"
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Create Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Minimum 8 characters"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        className="pl-10"
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        className="pl-10"
                        disabled={isPending}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Professional Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Professional Information
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Tell us about your current teaching position
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationId">
                      Teacher Registration ID{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <ClipboardCheck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="registrationId"
                        type="text"
                        placeholder="e.g., TR20240001"
                        value={formData.registrationId}
                        onChange={(e) =>
                          handleInputChange("registrationId", e.target.value)
                        }
                        className="pl-10"
                        disabled={isPending}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Your official teacher registration number
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentSchool">
                      Current School <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <School className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="currentSchool"
                        type="text"
                        placeholder="e.g., Ananda College, Colombo"
                        value={formData.currentSchool}
                        onChange={(e) =>
                          handleInputChange("currentSchool", e.target.value)
                        }
                        className="pl-10"
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentZone">
                        Current Zone <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.currentZone}
                        onValueChange={(value) =>
                          handleInputChange("currentZone", value)
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.zones.map((zone) => (
                            <SelectItem key={zone} value={zone}>
                              {zone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentDistrict">
                        Current District <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.currentDistrict}
                        onValueChange={(value) =>
                          handleInputChange("currentDistrict", value)
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your district" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.districts.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">
                      Teaching Subject <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) =>
                        handleInputChange("subject", value)
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="medium">
                        Teaching Medium <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.medium}
                        onValueChange={(value) =>
                          handleInputChange("medium", value)
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select medium" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.mediums.map((medium) => (
                            <SelectItem key={medium} value={medium}>
                              {medium}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="level">
                        Teaching Level <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.level}
                        onValueChange={(value) =>
                          handleInputChange("level", value)
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.levels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Transfer Preferences */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Transfer Preferences
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Select zones where you would like to be transferred
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>
                      Preferred Transfer Zones{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border rounded-lg bg-muted max-h-96 overflow-y-auto">
                      {options.zones.map((zone) => (
                        <div
                          key={zone}
                          className="flex items-start space-x-3 p-3 bg-card rounded border hover:border-blue-300 transition-colors"
                        >
                          <Checkbox
                            id={`zone-${zone}`}
                            checked={formData.desiredZones.includes(zone)}
                            onCheckedChange={() => handleZoneSelect(zone)}
                            disabled={isPending}
                            className="mt-1"
                          />
                          <Label
                            htmlFor={`zone-${zone}`}
                            className="font-normal cursor-pointer flex-1"
                          >
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              {zone}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Select all zones you are interested in. You can choose
                      multiple zones.
                    </p>
                    {formData.desiredZones.length > 0 && (
                      <p className="text-sm text-blue-600 font-medium">
                        {formData.desiredZones.length} zone(s) selected
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Review & Submit */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Review Your Information
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Please verify all details before submitting
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Personal Details Summary */}
                    <div className="border rounded-lg p-4 bg-muted">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Personal Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-gray-600">Name:</span>{" "}
                          <span className="font-medium">
                            {formData.firstName} {formData.lastName}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-600">Mobile:</span>{" "}
                          <span className="font-medium">{formData.phone}</span>
                        </p>
                        {formData.email && (
                          <p>
                            <span className="text-gray-600">Email:</span>{" "}
                            <span className="font-medium">
                              {formData.email}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Professional Details Summary */}
                    <div className="border rounded-lg p-4 bg-muted">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <School className="h-4 w-4 mr-2" />
                        Professional Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-gray-600">
                            Registration ID:
                          </span>{" "}
                          <span className="font-medium">
                            {formData.registrationId}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-600">Current School:</span>{" "}
                          <span className="font-medium">
                            {formData.currentSchool}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-600">Zone:</span>{" "}
                          <span className="font-medium">
                            {formData.currentZone}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-600">District:</span>{" "}
                          <span className="font-medium">
                            {formData.currentDistrict}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-600">Subject:</span>{" "}
                          <span className="font-medium">
                            {formData.subject}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-600">Medium:</span>{" "}
                          <span className="font-medium">{formData.medium}</span>
                        </p>
                        <p>
                          <span className="text-gray-600">Level:</span>{" "}
                          <span className="font-medium">{formData.level}</span>
                        </p>
                      </div>
                    </div>

                    {/* Transfer Preferences Summary */}
                    <div className="border rounded-lg p-4 bg-muted">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Transfer Preferences
                      </h3>
                      <div className="text-sm">
                        <p className="text-gray-600 mb-2">
                          Preferred Zones ({formData.desiredZones.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {formData.desiredZones.map((zone) => (
                            <span
                              key={zone}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                            >
                              {zone}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) =>
                          handleInputChange("acceptTerms", checked === true)
                        }
                        disabled={isPending}
                        className="mt-1"
                      />
                      <Label
                        htmlFor="terms"
                        className="text-sm leading-relaxed cursor-pointer"
                      >
                        I confirm that all the information provided above is
                        accurate and complete. I understand that this
                        registration is for the Mutual Transfer Program and
                        agree to the{" "}
                        <a href="#" className="text-blue-600 underline">
                          terms and conditions
                        </a>{" "}
                        of the platform.
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={isPending}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isPending}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isPending || !formData.acceptTerms}
                  >
                    {isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Registering...
                      </>
                    ) : (
                      <>
                        Complete Registration
                        <Check className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>

            {/* Additional Links */}
            <div className="mt-6 pt-6 border-t text-center space-y-2">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <a
                  href="/sign-in"
                  className="text-blue-600 font-medium hover:underline"
                >
                  Sign In
                </a>
              </p>
              <p className="text-sm text-gray-600">
                Administrator?{" "}
                <a
                  href="/admin/sign-in"
                  className="text-blue-600 font-medium hover:underline"
                >
                  Admin Login
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Info Banner */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-12">
        <div className="text-white space-y-8">
          <div>
            <BookOpen className="h-16 w-16 mb-6" />
            <h2 className="text-4xl font-bold mb-4">
              Join Our Teaching Community
            </h2>
            <p className="text-blue-100 text-lg">
              Streamline your transfer process and connect with opportunities
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-500 rounded-full p-2 mt-1">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Easy Registration</h3>
                <p className="text-blue-100 text-sm">
                  Simple step-by-step process to create your profile
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-500 rounded-full p-2 mt-1">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Find Mutual Transfers</h3>
                <p className="text-blue-100 text-sm">
                  Connect with teachers looking for transfers in your preferred
                  zones
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-500 rounded-full p-2 mt-1">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Secure Platform</h3>
                <p className="text-blue-100 text-sm">
                  Your data is protected with industry-standard security
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-700/50 rounded-lg p-6">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-blue-100 text-sm mb-3">
              Our support team is here to assist you with the registration
              process
            </p>
            <a
              href="#"
              className="text-white underline text-sm hover:text-blue-200"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
