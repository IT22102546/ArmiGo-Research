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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Flag } from "lucide-react";
import { featureFlagsApi } from "@/lib/api/endpoints";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  description: string | null;
  rolloutPercentage: number;
  targetRoles: string[];
  targetUsers: string[];
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    description: "",
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: [] as string[],
    targetUsers: [] as string[],
    metadata: "{}",
  });

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const response = await featureFlagsApi.getAll();
      // featureFlagsApi returns an array (server returns raw array)
      const respAny: any = response;
      const flagsData = Array.isArray(respAny)
        ? respAny
        : respAny.data
          ? respAny.data
          : [];
      setFlags(flagsData as any);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.key) {
      handleApiError(new Error("Name and key are required"));
      return;
    }

    try {
      setLoading(true);
      let metadata = null;
      try {
        metadata = formData.metadata ? JSON.parse(formData.metadata) : null;
      } catch {
        handleApiError(new Error("Invalid JSON in metadata"));
        return;
      }

      await featureFlagsApi.create({
        ...formData,
        metadata,
      });
      handleApiSuccess("Feature flag created successfully");
      setCreateDialogOpen(false);
      resetForm();
      fetchFlags();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedFlag) return;

    try {
      setLoading(true);
      let metadata = null;
      try {
        metadata = formData.metadata ? JSON.parse(formData.metadata) : null;
      } catch {
        handleApiError(new Error("Invalid JSON in metadata"));
        return;
      }

      await featureFlagsApi.update(selectedFlag.id, {
        ...formData,
        metadata,
      });
      handleApiSuccess("Feature flag updated successfully");
      setEditDialogOpen(false);
      resetForm();
      fetchFlags();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFlag) return;

    try {
      setLoading(true);
      await featureFlagsApi.delete(selectedFlag.id);
      handleApiSuccess("Feature flag deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedFlag(null);
      fetchFlags();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (flag: FeatureFlag) => {
    try {
      setLoading(true);
      await featureFlagsApi.toggleEnabled(flag.id);
      handleApiSuccess(
        `Feature flag ${flag.enabled ? "disabled" : "enabled"} successfully`
      );
      fetchFlags();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (flag: FeatureFlag) => {
    setSelectedFlag(flag);
    setFormData({
      name: flag.name,
      key: flag.key,
      description: flag.description || "",
      enabled: flag.enabled,
      rolloutPercentage: flag.rolloutPercentage,
      targetRoles: flag.targetRoles,
      targetUsers: flag.targetUsers,
      metadata: flag.metadata ? JSON.stringify(flag.metadata, null, 2) : "{}",
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      key: "",
      description: "",
      enabled: true,
      rolloutPercentage: 100,
      targetRoles: [],
      targetUsers: [],
      metadata: "{}",
    });
    setSelectedFlag(null);
  };

  const getRolloutColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Feature Flags Management
            </CardTitle>
            <CardDescription>
              Manage feature toggles and gradual rollouts
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Feature Flag
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead>Rollout</TableHead>
              <TableHead>Target Roles</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : flags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No feature flags found
                </TableCell>
              </TableRow>
            ) : (
              flags.map((flag) => (
                <TableRow key={flag.id}>
                  <TableCell className="font-medium">{flag.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {flag.key}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={() => handleToggleEnabled(flag)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={flag.rolloutPercentage}
                          className="w-20 h-2"
                        />
                        <span className="text-xs text-muted-foreground">
                          {flag.rolloutPercentage}%
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {Array.isArray(flag.targetRoles) &&
                      flag.targetRoles.length > 0 ? (
                        (flag.targetRoles || []).map((role) => (
                          <Badge
                            key={role}
                            variant="outline"
                            className="text-xs"
                          >
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          All
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {flag.description || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(flag)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFlag(flag);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Feature Flag</DialogTitle>
            <DialogDescription>
              Define a new feature flag for gradual rollouts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="My Feature"
                />
              </div>
              <div>
                <Label htmlFor="key">Key *</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  placeholder="my_feature"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe this feature..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enabled: checked })
                }
              />
              <Label htmlFor="enabled">Enabled</Label>
            </div>
            <div>
              <Label htmlFor="rollout">
                Rollout Percentage: {formData.rolloutPercentage}%
              </Label>
              <Input
                id="rollout"
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.rolloutPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rolloutPercentage: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label>Target Roles</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  "INTERNAL_STUDENT",
                  "EXTERNAL_STUDENT",
                  "INTERNAL_TEACHER",
                  "EXTERNAL_TEACHER",
                  "ADMIN",
                  "SUPER_ADMIN",
                ].map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={formData.targetRoles.includes(role)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            targetRoles: [...formData.targetRoles, role],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            targetRoles: formData.targetRoles.filter(
                              (r) => r !== role
                            ),
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`role-${role}`} className="text-sm">
                      {role.replace("_", " ")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="metadata">Metadata (JSON)</Label>
              <Textarea
                id="metadata"
                value={formData.metadata}
                onChange={(e) =>
                  setFormData({ ...formData, metadata: e.target.value })
                }
                rows={4}
                placeholder="{}"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              Create Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Feature Flag</DialogTitle>
            <DialogDescription>Update feature flag settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Same form fields as Create Dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-key">Key *</Label>
                <Input
                  id="edit-key"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enabled: checked })
                }
              />
              <Label htmlFor="edit-enabled">Enabled</Label>
            </div>
            <div>
              <Label htmlFor="edit-rollout">
                Rollout Percentage: {formData.rolloutPercentage}%
              </Label>
              <Input
                id="edit-rollout"
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.rolloutPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rolloutPercentage: parseInt(e.target.value),
                  })
                }
              />
            </div>
            {/* ... other fields similar to create dialog ... */}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              Update Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Feature Flag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedFlag?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
