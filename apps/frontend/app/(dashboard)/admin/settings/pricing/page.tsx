"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ApiClient } from "@/lib/api/api-client";
import { DollarSign, Save, RotateCcw, History } from "lucide-react";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  category?: string;
  description?: string;
  isPublic: boolean;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

interface PriceSettings {
  // Exam fees
  examCreationFee: string;
  examAttemptFee: string;
  examResultFee: string;

  // Monthly fees by grade
  monthlyFeeGrade1to5: string;
  monthlyFeeGrade6to9: string;
  monthlyFeeGrade10to11: string;
  monthlyFeeGrade12to13: string;

  // Enrollment fees
  enrollmentFeeBase: string;
  enrollmentFeeAdvanced: string;

  // Publication prices
  publicationBasePriceDigital: string;
  publicationBasePricePhysical: string;

  // Wallet bundle prices
  walletBundle100: string;
  walletBundle500: string;
  walletBundle1000: string;
  walletBundle5000: string;

  // Discount rules
  discountEarlyBird: string;
  discountBulkEnrollment: string;
  discountReferral: string;
}

export default function PricingSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("exams");
  const [settings, setSettings] = useState<PriceSettings>({
    examCreationFee: "0",
    examAttemptFee: "0",
    examResultFee: "0",
    monthlyFeeGrade1to5: "2000",
    monthlyFeeGrade6to9: "2500",
    monthlyFeeGrade10to11: "3000",
    monthlyFeeGrade12to13: "3500",
    enrollmentFeeBase: "1000",
    enrollmentFeeAdvanced: "1500",
    publicationBasePriceDigital: "500",
    publicationBasePricePhysical: "800",
    walletBundle100: "100",
    walletBundle500: "500",
    walletBundle1000: "1000",
    walletBundle5000: "5000",
    discountEarlyBird: "10",
    discountBulkEnrollment: "15",
    discountReferral: "5",
  });

  // Queries
  const {
    data: systemSettings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["system-settings", "pricing"],
    queryFn: async () => {
      const response: any = await ApiClient.get(
        "/system-settings/settings?category=pricing"
      );
      return response as SystemSetting[];
    },
  });

  // Load settings from system settings
  useState(() => {
    if (systemSettings && systemSettings.length > 0) {
      const newSettings: any = { ...settings };
      systemSettings.forEach((setting: SystemSetting) => {
        const key = setting.key.replace("pricing.", "");
        if (key in newSettings) {
          newSettings[key] = setting.value;
        }
      });
      setSettings(newSettings);
    }
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async (data: {
      key: string;
      value: string;
      description?: string;
    }) => {
      const response: any = await ApiClient.put(
        `/system-settings/settings/${data.key}`,
        {
          value: data.value,
          description: data.description,
        }
      );
      return response;
    },
    onSuccess: () => {
      toast.success("Pricing settings updated successfully");
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update pricing settings"
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      key: string;
      value: string;
      description?: string;
      category: string;
    }) => {
      const response: any = await ApiClient.post("/system-settings/settings", {
        key: data.key,
        value: data.value,
        description: data.description,
        category: data.category,
        type: "NUMBER",
        isPublic: false,
        isEditable: true,
      });
      return response;
    },
    onSuccess: () => {
      toast.success("Pricing setting created successfully");
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create pricing setting"
      );
    },
  });

  const handleSave = async () => {
    const updates = Object.entries(settings).map(([key, value]) => {
      const settingKey = `pricing.${key}`;
      const existing = systemSettings?.find(
        (s: SystemSetting) => s.key === settingKey
      );

      if (existing) {
        return updateMutation.mutateAsync({
          key: settingKey,
          value,
          description: getDescription(key),
        });
      } else {
        return createMutation.mutateAsync({
          key: settingKey,
          value,
          description: getDescription(key),
          category: "pricing",
        });
      }
    });

    try {
      await Promise.all(updates);
      toast.success("All pricing settings saved successfully");
    } catch (error) {
      toast.error("Some settings failed to save");
    }
  };

  const handleReset = () => {
    if (systemSettings && systemSettings.length > 0) {
      const newSettings: any = {};
      systemSettings.forEach((setting: SystemSetting) => {
        const key = setting.key.replace("pricing.", "");
        newSettings[key] = setting.value;
      });
      setSettings({ ...settings, ...newSettings });
      toast.info("Settings reset to saved values");
    }
  };

  const getDescription = (key: string): string => {
    const descriptions: { [key: string]: string } = {
      examCreationFee: "Fee charged to create an exam",
      examAttemptFee: "Fee charged per exam attempt",
      examResultFee: "Fee to view exam results",
      monthlyFeeGrade1to5: "Monthly fee for grades 1-5",
      monthlyFeeGrade6to9: "Monthly fee for grades 6-9",
      monthlyFeeGrade10to11: "Monthly fee for grades 10-11",
      monthlyFeeGrade12to13: "Monthly fee for grades 12-13",
      enrollmentFeeBase: "Base enrollment fee",
      enrollmentFeeAdvanced: "Advanced course enrollment fee",
      publicationBasePriceDigital: "Base price for digital publications",
      publicationBasePricePhysical: "Base price for physical publications",
      walletBundle100: "Price for LKR 100 wallet bundle",
      walletBundle500: "Price for LKR 500 wallet bundle",
      walletBundle1000: "Price for LKR 1000 wallet bundle",
      walletBundle5000: "Price for LKR 5000 wallet bundle",
      discountEarlyBird: "Early bird discount percentage",
      discountBulkEnrollment: "Bulk enrollment discount percentage",
      discountReferral: "Referral discount percentage",
    };
    return descriptions[key] || "";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-red-600">
            Error loading pricing settings. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pricing Settings</h1>
          <p className="text-muted-foreground">
            Configure pricing for all services
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || createMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="exams">Exam Fees</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Fees</TabsTrigger>
          <TabsTrigger value="publications">Publications</TabsTrigger>
          <TabsTrigger value="wallet">Wallet Bundles</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
        </TabsList>

        <TabsContent value="exams">
          <Card>
            <CardHeader>
              <CardTitle>Exam Fee Configuration</CardTitle>
              <CardDescription>
                Set fees for exam-related services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Exam Creation Fee (LKR)</Label>
                <Input
                  type="number"
                  value={settings.examCreationFee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      examCreationFee: e.target.value,
                    })
                  }
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Fee charged to teachers for creating an exam
                </p>
              </div>
              <div>
                <Label>Exam Attempt Fee (LKR)</Label>
                <Input
                  type="number"
                  value={settings.examAttemptFee}
                  onChange={(e) =>
                    setSettings({ ...settings, examAttemptFee: e.target.value })
                  }
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Fee charged to students per exam attempt
                </p>
              </div>
              <div>
                <Label>Exam Result Fee (LKR)</Label>
                <Input
                  type="number"
                  value={settings.examResultFee}
                  onChange={(e) =>
                    setSettings({ ...settings, examResultFee: e.target.value })
                  }
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Fee to view detailed exam results
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Fee by Grade</CardTitle>
              <CardDescription>
                Set monthly fees based on grade levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Grades 1-5 (LKR)</Label>
                  <Input
                    type="number"
                    value={settings.monthlyFeeGrade1to5}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        monthlyFeeGrade1to5: e.target.value,
                      })
                    }
                    placeholder="2000"
                  />
                </div>
                <div>
                  <Label>Grades 6-9 (LKR)</Label>
                  <Input
                    type="number"
                    value={settings.monthlyFeeGrade6to9}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        monthlyFeeGrade6to9: e.target.value,
                      })
                    }
                    placeholder="2500"
                  />
                </div>
                <div>
                  <Label>Grades 10-11 (LKR)</Label>
                  <Input
                    type="number"
                    value={settings.monthlyFeeGrade10to11}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        monthlyFeeGrade10to11: e.target.value,
                      })
                    }
                    placeholder="3000"
                  />
                </div>
                <div>
                  <Label>Grades 12-13 (LKR)</Label>
                  <Input
                    type="number"
                    value={settings.monthlyFeeGrade12to13}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        monthlyFeeGrade12to13: e.target.value,
                      })
                    }
                    placeholder="3500"
                  />
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-2">Enrollment Fees</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Base Enrollment (LKR)</Label>
                    <Input
                      type="number"
                      value={settings.enrollmentFeeBase}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          enrollmentFeeBase: e.target.value,
                        })
                      }
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <Label>Advanced Enrollment (LKR)</Label>
                    <Input
                      type="number"
                      value={settings.enrollmentFeeAdvanced}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          enrollmentFeeAdvanced: e.target.value,
                        })
                      }
                      placeholder="1500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publications">
          <Card>
            <CardHeader>
              <CardTitle>Publication Prices</CardTitle>
              <CardDescription>
                Set base prices for publications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Digital Publication Base Price (LKR)</Label>
                <Input
                  type="number"
                  value={settings.publicationBasePriceDigital}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      publicationBasePriceDigital: e.target.value,
                    })
                  }
                  placeholder="500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Default price for digital publications
                </p>
              </div>
              <div>
                <Label>Physical Publication Base Price (LKR)</Label>
                <Input
                  type="number"
                  value={settings.publicationBasePricePhysical}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      publicationBasePricePhysical: e.target.value,
                    })
                  }
                  placeholder="800"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Default price for physical publications
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Bundle Prices</CardTitle>
              <CardDescription>
                Configure wallet recharge bundle prices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>LKR 100 Bundle</Label>
                  <Input
                    type="number"
                    value={settings.walletBundle100}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        walletBundle100: e.target.value,
                      })
                    }
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label>LKR 500 Bundle</Label>
                  <Input
                    type="number"
                    value={settings.walletBundle500}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        walletBundle500: e.target.value,
                      })
                    }
                    placeholder="500"
                  />
                </div>
                <div>
                  <Label>LKR 1,000 Bundle</Label>
                  <Input
                    type="number"
                    value={settings.walletBundle1000}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        walletBundle1000: e.target.value,
                      })
                    }
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label>LKR 5,000 Bundle</Label>
                  <Input
                    type="number"
                    value={settings.walletBundle5000}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        walletBundle5000: e.target.value,
                      })
                    }
                    placeholder="5000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts">
          <Card>
            <CardHeader>
              <CardTitle>Discount Rules</CardTitle>
              <CardDescription>
                Configure discount percentages for various promotions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Early Bird Discount (%)</Label>
                <Input
                  type="number"
                  value={settings.discountEarlyBird}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      discountEarlyBird: e.target.value,
                    })
                  }
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Discount for early enrollment
                </p>
              </div>
              <div>
                <Label>Bulk Enrollment Discount (%)</Label>
                <Input
                  type="number"
                  value={settings.discountBulkEnrollment}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      discountBulkEnrollment: e.target.value,
                    })
                  }
                  placeholder="15"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Discount for enrolling in multiple classes
                </p>
              </div>
              <div>
                <Label>Referral Discount (%)</Label>
                <Input
                  type="number"
                  value={settings.discountReferral}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      discountReferral: e.target.value,
                    })
                  }
                  placeholder="5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Discount for referring new students
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All price changes are saved immediately to the system settings.
            These prices will be used as defaults throughout the platform for
            invoice generation, payment processing, and other financial
            operations. Changes will take effect immediately after saving.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
