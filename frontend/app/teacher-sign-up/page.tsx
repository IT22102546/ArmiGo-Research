'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Mail, Lock, User } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export default function TeacherSignUp() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "INTERNAL_TEACHER" as "INTERNAL_TEACHER" | "EXTERNAL_TEACHER",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { register, user, checkAuth, isLoading } = useAuthStore();
  const router = useRouter();

  // Check authentication and redirect if already logged in
  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        await checkAuth();
      } catch (error) {
        // User is not authenticated, stay on sign-up page
      }
    };

    checkAndRedirect();
  }, [checkAuth]);

  // Redirect if user becomes available (after auth check)
  useEffect(() => {
    if (user) {
      if (['INTERNAL_TEACHER', 'EXTERNAL_TEACHER'].includes(user.role)) {
        router.push("/dashboard");
      } else {
        router.push("/sign-in");
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(formData);
      // register function will handle redirect automatically
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Failed to create account. Please try again.");
      }
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full md:w-5/12 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-primary">Create Teacher Account</h1>
            <p className="text-muted-foreground">Register as a teacher</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter Your First Name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="pl-10 h-12 rounded-lg"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter Your Last Name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="pl-10 h-12 rounded-lg"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter Your Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="pl-10 h-12 rounded-lg"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter Your Password (min 8 characters)"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10 h-12 rounded-lg"
                  required
                  minLength={8}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Teacher Type</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "INTERNAL_TEACHER" | "EXTERNAL_TEACHER") =>
                  setFormData({ ...formData, role: value })
                }
                disabled={loading}
              >
                <SelectTrigger className="h-12 rounded-lg">
                  <SelectValue placeholder="Select teacher type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL_TEACHER">Internal Teacher</SelectItem>
                  <SelectItem value="EXTERNAL_TEACHER">External Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already Have An Account?{" "}
              <a
                href="/sign-in"
                className="text-primary font-medium hover:underline"
              >
                Sign In
              </a>
            </p>
          </form>
        </div>
      </div>

      <div
        className="hidden md:flex md:w-7/12 items-center justify-center relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, hsl(220 90% 50%), hsl(220 85% 55%))",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative z-10 text-center px-12">
          <h2 className="text-4xl font-bold text-white mb-2">
            Join{" "}
            <span className="block">Mutual Teachers&apos; Portal</span>
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Connecting Teachers, Building Futures
          </p>

          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-2xl h-auto rounded-lg shadow-2xl bg-white/10 p-8">
              <p className="text-white text-lg">
                Register and start connecting with fellow teachers
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
