// components/dash-publications.tsx
import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Upload,
  FileText,
  Loader2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import {
  handleApiError,
  handleApiSuccess,
} from "@/lib/error-handling";
const logger = createLogger("PublicationManagement");
import { publicationsApi } from "@/lib/api/endpoints/publications";
import { CreatePublicationData, Publication } from "@/lib/api/types";
import { useWebSocket } from "@/hooks/use-websocket";

// Badge component with proper typing
interface BadgeProps {
  variant: "success" | "warning" | "secondary";
  className: string;
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ variant, className, children }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
};

function PublicationManagement() {
  // const { toast } = useToast();
  const { subscribe } = useWebSocket();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedPublication, setSelectedPublication] =
    useState<Publication | null>(null);
  const [formError, setFormError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form states for Add/Edit
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [shortDescription, setShortDescription] = useState<string>("");
  const [author, setAuthor] = useState<string>("");
  const [publisher, setPublisher] = useState<string>("");
  const [coverImage, setCoverImage] = useState<string>("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(
    "DRAFT"
  );
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [publications, setPublications] = useState<Publication[]>([]);

  // Load publications on component mount
  useEffect(() => {
    loadPublications();
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadPublications();
  }, [statusFilter]);

  // WebSocket real-time updates
  useEffect(() => {
    const unsubscribeCreated = subscribe("publicationCreated", (data) => {
      setPublications((prev) => [data.data, ...prev]);
      handleApiSuccess("New publication added");
    });

    const unsubscribeUpdated = subscribe("publicationUpdated", (data) => {
      setPublications((prev) =>
        prev.map((pub) =>
          pub.id === data.publicationId ? { ...pub, ...data.data } : pub
        )
      );
      toast.info("Publication updated");
    });

    const unsubscribeDeleted = subscribe("publicationDeleted", (data) => {
      setPublications((prev) =>
        prev.filter((pub) => pub.id !== data.publicationId)
      );
      toast.info("Publication deleted");
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [subscribe]);

  const loadPublications = async () => {
    console.log("🔄 Loading publications...");
    console.log("Current filters:", { statusFilter, searchQuery });

    setIsLoading(true);
    try {
      const response = await publicationsApi.getAll({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchQuery || undefined,
      });

      console.log("📥 Processed API Response:", {
        publicationsCount: response.publications?.length || 0,
        publications: response.publications,
        pagination: response.pagination,
      });

      // Safe assignment with fallback
      setPublications(response.publications || []);
    } catch (error) {
      logger.error("Failed to load publications:", error);
      handleApiError(
        error,
        "PublicationManagement.loadPublications",
        "Failed to load publications"
      );
    } finally {
      setIsLoading(false);
      console.log("🏁 Publications loading completed");
    }
  };

  const resetForm = (): void => {
    setTitle("");
    setDescription("");
    setShortDescription("");
    setAuthor("");
    setPublisher("");
    setCoverImage("");
    setStatus("DRAFT");
    setFile(null);
    setCoverFile(null);
    setFormError("");
  };

  const handleFileUpload = async (
    file: File,
    type: "publication" | "cover"
  ): Promise<string> => {
    try {
      console.log("Starting file upload:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadType: type,
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      // Use the publications API upload method
      const response = await publicationsApi.uploadFile(formData);
      const url =
        (response as any)?.url ||
        (response as any)?.data?.url ||
        (response as any)?.fileUrl ||
        "";

      if (!url || typeof url !== "string") {
        throw new Error("Upload succeeded but file URL was not returned");
      }

      return url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to upload ${type}: ${message}`);
    }
  };

  const handleAddPublication = async (): Promise<void> => {
    setFormError("");

    // Validation - Check if file is selected
    if (!title.trim() || !description.trim() || !file) {
      setFormError(
        "Please fill all required fields (Title, Description, and File)"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files first
      let uploadedFileUrl = "";
      let uploadedCoverImage = "";

      if (file) {
        uploadedFileUrl = await handleFileUpload(file, "publication");
        console.log("Uploaded file URL:", uploadedFileUrl); // Debug log
      }

      if (!uploadedFileUrl) {
        setFormError("Publication file upload failed. Please try again.");
        return;
      }

      if (coverFile) {
        uploadedCoverImage = await handleFileUpload(coverFile, "cover");
        console.log("Uploaded cover URL:", uploadedCoverImage); // Debug log
      }

      // Prepare publication data - MAKE SURE fileUrl IS INCLUDED
      const publicationData: CreatePublicationData = {
        title: title.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim() || undefined,
        price: 0,
        fileUrl: uploadedFileUrl, // THIS IS REQUIRED - make sure it's not empty
        coverImage: uploadedCoverImage || undefined,
        author: author.trim() || undefined,
        publisher: publisher.trim() || undefined,
        status: status,
      };

      console.log("Sending publication data:", publicationData); // Debug log

      // Create publication
      const newPublication = await publicationsApi.create(publicationData);

      // Refresh publications from server to ensure list matches backend
      await loadPublications();

      // Reset and close
      resetForm();
      setShowAddModal(false);

      toast.success("Publication created successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create publication";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPublication = async (): Promise<void> => {
    if (!selectedPublication) return;

    setFormError("");

    if (!title.trim() || !description.trim()) {
      setFormError("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedCoverImage = coverImage;

      // Upload new cover file if selected
      if (coverFile) {
        uploadedCoverImage = await handleFileUpload(coverFile, "cover");
      }

      const updateData: any = {
        title: title.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim() || undefined,
        price: 0,
        discountPrice: undefined,
        coverImage: uploadedCoverImage || undefined,
        author: author.trim() || undefined,
        publisher: publisher.trim() || undefined,
        status: status,
      };

      const updatedPublication = await publicationsApi.update(
        selectedPublication.id,
        updateData
      );

      // Refresh publications to reflect server-side changes
      await loadPublications();

      resetForm();
      setShowEditModal(false);
      setSelectedPublication(null);

      toast.success("Publication updated successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update publication";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePublication = async (): Promise<void> => {
    if (!selectedPublication) return;

    try {
      await publicationsApi.delete(selectedPublication.id);

      // Refresh list from server after deletion
      await loadPublications();

      setShowDeleteModal(false);
      setSelectedPublication(null);

      handleApiSuccess("Publication deleted successfully");
    } catch (error) {
      logger.error("Failed to delete publication:", error);
      handleApiError(
        error,
        "PublicationManagement.handleDeletePublication",
        "Failed to delete publication"
      );
    }
  };

  const openEditModal = (publication: Publication): void => {
    setSelectedPublication(publication);
    setTitle(publication.title);
    setDescription(publication.description);
    setShortDescription(publication.shortDescription || "");
    setAuthor(publication.author || "");
    setPublisher(publication.publisher || "");
    setCoverImage(publication.coverImage || "");
    setStatus(publication.status);
    setFormError("");
    setShowEditModal(true);
  };

  const openDeleteModal = (publication: Publication): void => {
    setSelectedPublication(publication);
    setShowDeleteModal(true);
  };

  const openAddModal = (): void => {
    resetForm();
    setShowAddModal(true);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "publication" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "publication") {
        const allowedPublicationTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!allowedPublicationTypes.includes(file.type)) {
          setFormError("Only PDF, DOC, and DOCX files are allowed for publication");
          return;
        }

        setFile(file);
      } else {
        setCoverFile(file);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <Badge
            variant="success"
            className="bg-success/10 text-success hover:bg-success/20"
          >
            Published
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge
            variant="warning"
            className="bg-warning/10 text-warning hover:bg-warning/20"
          >
            Draft
          </Badge>
        );
      case "ARCHIVED":
        return (
          <Badge
            variant="secondary"
            className="bg-muted text-muted-foreground hover:bg-muted/80"
          >
            Archived
          </Badge>
        );
      default:
        return null;
    }
  };

  const publishedCount = publications.filter(
    (publication) => publication.status === "PUBLISHED"
  ).length;
  const draftCount = publications.filter(
    (publication) => publication.status === "DRAFT"
  ).length;
  const archivedCount = publications.filter(
    (publication) => publication.status === "ARCHIVED"
  ).length;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button className="hover:text-foreground">Content</button>
          <span>/</span>
          <span className="text-foreground">Publications</span>
        </div>

        {/* Header */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">
                Publications
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage and publish professional documents for your ArmiGo users.
              </p>
            </div>
            <Button
              onClick={openAddModal}
              className="bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add Publication
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold text-foreground">{publications.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Published</p>
            <p className="text-2xl font-semibold text-foreground">{publishedCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Drafts</p>
            <p className="text-2xl font-semibold text-foreground">{draftCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Archived</p>
            <p className="text-2xl font-semibold text-foreground">{archivedCount}</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="rounded-lg border border-border bg-card p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search publications..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                onKeyPress={(e) => {
                  if (e.key === "Enter") loadPublications();
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setStatusFilter(e.target.value);
                }}
                className="h-10 px-4 border border-border rounded-md bg-background text-sm min-w-[160px]"
                aria-label="Filter publications by status"
              >
                <option value="all">All Status</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <Button variant="outline" onClick={loadPublications} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Loading publications...
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                      Publication
                    </th>
                    <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                      Author
                    </th>
                    <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                      Access
                    </th>
                    <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                      Downloads
                    </th>
                    <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right p-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {publications.map((publication) => (
                    <tr
                      key={publication.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-md bg-muted p-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground leading-5">
                              {publication.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {publication.shortDescription || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-foreground">
                        {publication.author || "Not specified"}
                      </td>
                      <td className="p-4 text-sm font-medium">Free</td>
                      <td className="p-4 text-sm text-foreground">
                        {publication.downloads}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(publication.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(publication.fileUrl, "_blank")}
                            disabled={isLoading || !publication.fileUrl}
                            aria-label={`View ${publication.title}`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(publication)}
                            disabled={isLoading}
                            aria-label={`Edit ${publication.title}`}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(publication)}
                            disabled={isLoading}
                            aria-label={`Delete ${publication.title}`}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {publications.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-12 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                          <p className="text-sm font-medium text-foreground">
                            No publications yet
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Create your first publication to get started.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Publication Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Add New Publication</DialogTitle>
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
                disabled={isSubmitting}
                aria-label="Close add publication dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Publication Details</h3>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter publication title"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTitle(e.target.value)
                  }
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Enter detailed description"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setDescription(e.target.value)
                  }
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  placeholder="Brief description (optional)"
                  value={shortDescription}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setShortDescription(e.target.value)
                  }
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    placeholder="Author name"
                    value={author}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAuthor(e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    placeholder="Publisher name"
                    value={publisher}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPublisher(e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              </div>

              {/* File Upload Section */}
              <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/20">
                <Label className="text-base font-medium">
                  Publication File *
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">
                    {file
                      ? file.name
                      : "Choose a publication file or drag & drop it here"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX formats, up to 50MB
                  </p>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(e, "publication")}
                    className="mt-3"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Cover Image Upload Section */}
              <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/20">
                <Label className="text-base font-medium">Cover Image</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">
                    {coverFile
                      ? coverFile.name
                      : "Choose a cover image or drag & drop it here"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG formats, up to 5MB
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "cover")}
                    className="mt-3"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setStatus(
                      e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED"
                    )
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  disabled={isSubmitting}
                  aria-label="Publication status"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              {formError && (
                <p className="text-xs text-destructive">{formError}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPublication}
                className="bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Save Publication"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Publication Modal */}

        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Update Publication</DialogTitle>
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
                disabled={isSubmitting}
                aria-label="Close edit publication dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Publication Details</h3>
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTitle(e.target.value)
                  }
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setDescription(e.target.value)
                  }
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-shortDescription">Short Description</Label>
                <Input
                  id="edit-shortDescription"
                  value={shortDescription}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setShortDescription(e.target.value)
                  }
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-author">Author</Label>
                  <Input
                    id="edit-author"
                    placeholder="Author name"
                    value={author}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAuthor(e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-publisher">Publisher</Label>
                  <Input
                    id="edit-publisher"
                    placeholder="Publisher name"
                    value={publisher}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPublisher(e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              </div>

              {/* Current File Display */}
              <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/20">
                <Label className="text-base font-medium">
                  Current Publication File
                </Label>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedPublication?.fileUrl
                        ? "File uploaded"
                        : "No file uploaded"}
                    </span>
                  </div>
                  {selectedPublication?.fileUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(selectedPublication.fileUrl, "_blank")
                      }
                      disabled={isSubmitting}
                    >
                      View File
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  To change the file, please contact support.
                </p>
              </div>

              {/* Cover Image Upload Section */}
              <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/20">
                <Label className="text-base font-medium">Cover Image</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">
                    {coverFile
                      ? coverFile.name
                      : "Choose a new cover image or drag & drop it here"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG formats, up to 5MB
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "cover")}
                    className="mt-3"
                    disabled={isSubmitting}
                  />
                </div>
                {selectedPublication?.coverImage && !coverFile && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Current cover image:
                    </p>
                    <img
                      src={selectedPublication.coverImage}
                      alt="Current cover"
                      className="h-20 w-auto object-cover rounded-md"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setStatus(
                      e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED"
                    )
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  disabled={isSubmitting}
                  aria-label="Publication status"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              {formError && (
                <p className="text-xs text-destructive">{formError}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditPublication}
                className="bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Publication"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-md">
            <div className="flex flex-col items-center text-center space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Are you sure?</h3>
                <p className="text-sm text-muted-foreground">
                  Do you really want to delete "{selectedPublication?.title}"?
                  <br />
                  This process cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeletePublication}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}

export default PublicationManagement;
