"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Eye, EyeOff } from "lucide-react";
import { systemSettingsApi } from "@/lib/api/endpoints";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: "STRING" | "NUMBER" | "BOOLEAN" | "JSON" | "DATE";
  category: string;
  description: string | null;
  isPublic: boolean;
  isEditable: boolean;
  updatedAt: string;
}

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<Record<string, SystemSetting>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await systemSettingsApi.getAll();
      const respAny: any = response;
      const settingsArray = Array.isArray(respAny)
        ? respAny
        : respAny.data
          ? respAny.data
          : [];
      const settingsMap: Record<string, SystemSetting> = {};
      const initialFormData: Record<string, any> = {};

      settingsArray.forEach((setting: SystemSetting) => {
        settingsMap[setting.key] = setting;
        initialFormData[setting.key] = parseSettingValue(
          setting.value,
          setting.type
        );
      });

      setSettings(settingsMap);
      setFormData(initialFormData);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const parseSettingValue = (value: string, type: string) => {
    switch (type) {
      case "BOOLEAN":
        return value === "true";
      case "NUMBER":
        return parseFloat(value);
      case "JSON":
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  };

  const handleSaveTab = async (category: string) => {
    try {
      setLoading(true);
      const categorySettings = Object.entries(settings).filter(
        ([_, setting]) =>
          setting.category.toLowerCase() === category.toLowerCase()
      );

      const updates = categorySettings.map(([key, setting]) => ({
        key,
        value: stringifySettingValue(formData[key], setting.type),
      }));

      await systemSettingsApi.updateMultiple(updates);
      handleApiSuccess("Settings updated successfully");
      fetchSettings();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const stringifySettingValue = (value: any, type: string) => {
    switch (type) {
      case "BOOLEAN":
        return value ? "true" : "false";
      case "NUMBER":
        return value.toString();
      case "JSON":
        return typeof value === "string" ? value : JSON.stringify(value);
      default:
        return value.toString();
    }
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const isSecret =
      setting.key.includes("password") ||
      setting.key.includes("secret") ||
      setting.key.includes("key") ||
      setting.key.includes("token");
    const showSecret = showSecrets[setting.key];

    if (!setting.isEditable) {
      return (
        <Input
          value={formData[setting.key] || ""}
          disabled
          className="bg-muted"
        />
      );
    }

    switch (setting.type) {
      case "BOOLEAN":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={setting.key}
              checked={formData[setting.key] || false}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, [setting.key]: checked })
              }
            />
            <Label htmlFor={setting.key} className="text-sm font-normal">
              {setting.description || "Enable"}
            </Label>
          </div>
        );

      case "NUMBER":
        return (
          <Input
            type="number"
            value={formData[setting.key] || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                [setting.key]: parseFloat(e.target.value),
              })
            }
            placeholder={setting.description || ""}
          />
        );

      case "JSON":
        return (
          <Textarea
            value={
              typeof formData[setting.key] === "string"
                ? formData[setting.key]
                : JSON.stringify(formData[setting.key], null, 2)
            }
            onChange={(e) =>
              setFormData({ ...formData, [setting.key]: e.target.value })
            }
            rows={4}
            placeholder={setting.description || "{}"}
          />
        );

      case "DATE":
        return (
          <Input
            type="date"
            value={formData[setting.key] || ""}
            onChange={(e) =>
              setFormData({ ...formData, [setting.key]: e.target.value })
            }
          />
        );

      case "STRING":
      default:
        if (isSecret) {
          return (
            <div className="relative">
              <Input
                type={showSecret ? "text" : "password"}
                value={formData[setting.key] || ""}
                onChange={(e) =>
                  setFormData({ ...formData, [setting.key]: e.target.value })
                }
                placeholder={setting.description || ""}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() =>
                  setShowSecrets({
                    ...showSecrets,
                    [setting.key]: !showSecret,
                  })
                }
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          );
        }
        return (
          <Input
            value={formData[setting.key] || ""}
            onChange={(e) =>
              setFormData({ ...formData, [setting.key]: e.target.value })
            }
            placeholder={setting.description || ""}
          />
        );
    }
  };

  const getSettingsByCategory = (category: string) => {
    return Object.entries(settings).filter(
      ([_, setting]) =>
        setting.category.toLowerCase() === category.toLowerCase()
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings & Configuration</CardTitle>
        <CardDescription>
          Manage system-wide settings and configurations (Super Admin Only)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General System Settings</CardTitle>
                <CardDescription>
                  Configure basic system information and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory("GENERAL").map(([key, setting]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>
                      {setting.description || key}
                      {!setting.isEditable && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Read-only)
                        </span>
                      )}
                    </Label>
                    {renderSettingInput(setting)}
                  </div>
                ))}
                <Button
                  onClick={() => handleSaveTab("GENERAL")}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save General Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exam & AI Settings Tab */}
          <TabsContent value="exam_ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exam & AI Monitoring Settings</CardTitle>
                <CardDescription>
                  Configure exam defaults and AI monitoring thresholds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory("EXAM").map(([key, setting]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>
                      {setting.description || key}
                      {!setting.isEditable && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Read-only)
                        </span>
                      )}
                    </Label>
                    {renderSettingInput(setting)}
                  </div>
                ))}
                {getSettingsByCategory("AI").map(([key, setting]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>
                      {setting.description || key}
                      {!setting.isEditable && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Read-only)
                        </span>
                      )}
                    </Label>
                    {renderSettingInput(setting)}
                  </div>
                ))}
                <Button
                  onClick={() => handleSaveTab("EXAM")}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Exam & AI Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings Tab */}
          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>
                  Configure payment provider credentials and bank slip settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory("PAYMENT").map(([key, setting]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>
                      {setting.description || key}
                      {!setting.isEditable && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Read-only)
                        </span>
                      )}
                    </Label>
                    {renderSettingInput(setting)}
                  </div>
                ))}
                <Button
                  onClick={() => handleSaveTab("PAYMENT")}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Payment Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure FCM, SMS, and email notification providers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory("NOTIFICATION").map(([key, setting]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>
                      {setting.description || key}
                      {!setting.isEditable && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Read-only)
                        </span>
                      )}
                    </Label>
                    {renderSettingInput(setting)}
                  </div>
                ))}
                <Button
                  onClick={() => handleSaveTab("NOTIFICATION")}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure password policy, 2FA requirements, and session
                  timeouts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory("SECURITY").map(([key, setting]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>
                      {setting.description || key}
                      {!setting.isEditable && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Read-only)
                        </span>
                      )}
                    </Label>
                    {renderSettingInput(setting)}
                  </div>
                ))}
                <Button
                  onClick={() => handleSaveTab("SECURITY")}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
