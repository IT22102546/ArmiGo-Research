"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Pencil, Trash2, Calendar, Video } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ApiClient } from "@/lib/api/api-client";
import { format } from "date-fns";
import { toast } from "sonner";

export default function SeminarPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSeminar, setSelectedSeminar] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    description: "",
    speakerName: "",
    speakerBio: "",
    scheduledAt: "",
    duration: 60,
    meetingLink: "",
    status: "SCHEDULED",
  });

  const { data: seminars, isLoading } = useQuery({
    queryKey: ["seminars"],
    queryFn: async () => {
      const response = await ApiClient.request<any>("/admin/seminars");
      return response?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => ApiClient.post("/admin/seminars", data),
    onSuccess: () => {
      toast.success("Seminar created successfully");
      queryClient.invalidateQueries({ queryKey: ["seminars"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create seminar");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ApiClient.put(`/admin/seminars/${id}`, data),
    onSuccess: () => {
      toast.success("Seminar updated successfully");
      queryClient.invalidateQueries({ queryKey: ["seminars"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update seminar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiClient.delete(`/admin/seminars/${id}`),
    onSuccess: () => {
      toast.success("Seminar deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["seminars"] });
      setDeleteDialogOpen(false);
      setSelectedSeminar(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete seminar");
    },
  });

  const handleOpenDialog = (seminar?: any) => {
    if (seminar) {
      setSelectedSeminar(seminar);
      setFormData({
        title: seminar.title,
        topic: seminar.topic,
        description: seminar.description || "",
        speakerName: seminar.speakerName,
        speakerBio: seminar.speakerBio || "",
        scheduledAt: seminar.scheduledAt
          ? new Date(seminar.scheduledAt).toISOString().slice(0, 16)
          : "",
        duration: seminar.duration || 60,
        meetingLink: seminar.meetingLink || "",
        status: seminar.status || "SCHEDULED",
      });
    } else {
      setSelectedSeminar(null);
      setFormData({
        title: "",
        topic: "",
        description: "",
        speakerName: "",
        speakerBio: "",
        scheduledAt: "",
        duration: 60,
        meetingLink: "",
        status: "SCHEDULED",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSeminar(null);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.speakerName || !formData.scheduledAt) {
      toast.error("Please fill in all required fields");
      return;
    }

    const submitData = {
      ...formData,
      scheduledAt: new Date(formData.scheduledAt).toISOString(),
    };

    if (selectedSeminar) {
      updateMutation.mutate({ id: selectedSeminar.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = () => {
    if (selectedSeminar) {
      deleteMutation.mutate(selectedSeminar.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "default";
      case "IN_PROGRESS":
        return "secondary";
      case "COMPLETED":
        return "outline";
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Seminar Management</h1>
          <p className="text-muted-foreground">Manage seminars and webinars</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Create Seminar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Seminars
          </CardTitle>
          <CardDescription>
            View and manage all seminars and webinars
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading seminars...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Speaker</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attendees</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seminars?.map((seminar: any) => (
                  <TableRow key={seminar.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{seminar.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {seminar.topic}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{seminar.speakerName}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {seminar.speakerBio}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(seminar.scheduledAt), "PPp")}
                      </div>
                    </TableCell>
                    <TableCell>{seminar.duration} mins</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(seminar.status)}>
                        {seminar.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{seminar._count?.participants || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {seminar.meetingLink && (
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={seminar.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Join Meeting"
                            >
                              <Video className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(seminar)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSeminar(seminar);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSeminar ? "Edit Seminar" : "Create Seminar"}
            </DialogTitle>
            <DialogDescription>
              {selectedSeminar
                ? "Update seminar information"
                : "Add a new seminar to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter seminar title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                placeholder="Enter topic"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="speakerName">Speaker Name *</Label>
                <Input
                  id="speakerName"
                  value={formData.speakerName}
                  onChange={(e) =>
                    setFormData({ ...formData, speakerName: e.target.value })
                  }
                  placeholder="Enter speaker name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value) || 60,
                    })
                  }
                  placeholder="60"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="speakerBio">Speaker Bio</Label>
              <Textarea
                id="speakerBio"
                value={formData.speakerBio}
                onChange={(e) =>
                  setFormData({ ...formData, speakerBio: e.target.value })
                }
                placeholder="Enter speaker biography"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Scheduled Date & Time *</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledAt: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meetingLink">Meeting Link</Label>
              <Input
                id="meetingLink"
                value={formData.meetingLink}
                onChange={(e) =>
                  setFormData({ ...formData, meetingLink: e.target.value })
                }
                placeholder="Enter meeting link (Zoom, Meet, etc.)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {selectedSeminar ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Seminar</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedSeminar?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedSeminar(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
