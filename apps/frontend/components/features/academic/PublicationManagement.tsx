// components/dash-publications.tsx
import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  X,
  Upload,
  FileText,
  Loader2,
  Users,
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
  asApiError,
} from "@/lib/error-handling";
const logger = createLogger("PublicationManagement");
import { publicationsApi } from "@/lib/api/endpoints/publications";
import { useAuthStore } from "@/stores/auth-store";
import { CreatePublicationData, Publication } from "@/lib/api/types";
import { useWebSocket } from "@/hooks/use-websocket";
import { GradeSelect } from "@/components/shared/selects/GradeSelect";
import { SubjectSelect } from "@/components/shared/selects/SubjectSelect";
import { MediumSelect } from "@/components/shared/selects/MediumSelect";

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
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showPurchasersModal, setShowPurchasersModal] =
    useState<boolean>(false);
  const [selectedPublication, setSelectedPublication] =
    useState<Publication | null>(null);
  const [purchasers, setPurchasers] = useState<any[]>([]);
  const [loadingPurchasers, setLoadingPurchasers] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form states for Add/Edit
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [shortDescription, setShortDescription] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [discountPrice, setDiscountPrice] = useState<string>("");
  const [gradeId, setGradeId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [mediumId, setMediumId] = useState<string>("");
  const [author, setAuthor] = useState<string>("");
  const [publisher, setPublisher] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");
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
    setPrice("");
    setDiscountPrice("");
    setGradeId("");
    setSubjectId("");
    setMediumId("");
    setAuthor("");
    setPublisher("");
    setFileUrl("");
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
      return response.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to upload ${type}: ${message}`);
    }
  };

  const handleAddPublication = async (): Promise<void> => {
    setFormError("");

    // Validation - Check if file is selected
    if (!title.trim() || !description.trim() || !price || !file) {
      setFormError(
        "Please fill all required fields (Title, Description, Price, and File)"
      );
      return;
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setFormError("Price must be a valid positive number");
      return;
    }

    if (
      discountPrice &&
      (isNaN(parseFloat(discountPrice)) || parseFloat(discountPrice) <= 0)
    ) {
      setFormError("Discount price must be a valid positive number");
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

      if (coverFile) {
        uploadedCoverImage = await handleFileUpload(coverFile, "cover");
        console.log("Uploaded cover URL:", uploadedCoverImage); // Debug log
      }

      // Prepare publication data - MAKE SURE fileUrl IS INCLUDED
      const publicationData: CreatePublicationData = {
        title: title.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim() || undefined,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
        fileUrl: uploadedFileUrl, // THIS IS REQUIRED - make sure it's not empty
        coverImage: uploadedCoverImage || undefined,
        gradeId: gradeId || undefined,
        subjectId: subjectId || undefined,
        mediumId: mediumId || undefined,
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

    if (!title.trim() || !description.trim() || !price) {
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
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
        coverImage: uploadedCoverImage || undefined,
        gradeId: gradeId || undefined,
        subjectId: subjectId || undefined,
        mediumId: mediumId || undefined,
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

  const handleViewPurchasers = async (
    publication: Publication
  ): Promise<void> => {
    setSelectedPublication(publication);
    setShowPurchasersModal(true);
    setLoadingPurchasers(true);
    try {
      const response = await publicationsApi.getPublicationPurchasers(
        publication.id
      );
      setPurchasers(response.purchasers || []);
    } catch (error) {
      logger.error("Failed to load purchasers:", error);
      handleApiError(
        error,
        "PublicationManagement.handleViewPurchasers",
        "Failed to load purchasers"
      );
      setPurchasers([]);
    } finally {
      setLoadingPurchasers(false);
    }
  };

  const openEditModal = (publication: Publication): void => {
    setSelectedPublication(publication);
    setTitle(publication.title);
    setDescription(publication.description);
    setShortDescription(publication.shortDescription || "");
    setPrice(publication.price.toString());
    setDiscountPrice(publication.discountPrice?.toString() || "");
    setGradeId((publication as any).gradeId || "");
    setSubjectId((publication as any).subjectId || "");
    setMediumId((publication as any).mediumId || "");
    setAuthor(publication.author || "");
    setPublisher(publication.publisher || "");
    setFileUrl(publication.fileUrl);
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

  const formatPrice = (price: number, discountPrice?: number) => {
    if (discountPrice) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium line-through text-muted-foreground">
            LKR {price.toFixed(2)}
          </span>
          <span className="text-sm font-bold text-foreground">
            LKR {discountPrice.toFixed(2)}
          </span>
        </div>
      );
    }
    return <span className="text-sm font-medium">LKR {price.toFixed(2)}</span>;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <button className="hover:text-foreground">Content</button>
          <span>/</span>
          <span className="text-foreground">Publications</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Publications
          </h1>
          <p className="text-muted-foreground">
            Manage your publications and digital content
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
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
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setStatusFilter(e.target.value);
              }}
              className="px-4 py-2 border border-border rounded-md bg-background text-sm"
              aria-label="Filter publications by status"
            >
              <option value="all">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
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
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-semibold text-sm">Title</th>
                  <th className="text-left p-4 font-semibold text-sm">
                    Author
                  </th>
                  <th className="text-left p-4 font-semibold text-sm">Price</th>
                  <th className="text-left p-4 font-semibold text-sm">
                    Downloads
                  </th>
                  <th className="text-left p-4 font-semibold text-sm">
                    Status
                  </th>
                  <th className="text-left p-4 font-semibold text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {publications.map((publication) => (
                  <tr
                    key={publication.id}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium">
                          {publication.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {publication.shortDescription || "No description"}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {publication.author || "Unknown"}
                    </td>
                    <td className="p-4">
                      {formatPrice(
                        publication.price,
                        publication.discountPrice
                      )}
                    </td>
                    <td className="p-4 text-sm">{publication.downloads}</td>
                    <td className="p-4">
                      {getStatusBadge(publication.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewPurchasers(publication)}
                          className="p-2 hover:bg-primary/10 rounded transition-colors"
                          disabled={isLoading}
                          aria-label={`View purchasers of ${publication.title}`}
                          title="View Purchasers"
                        >
                          <Users className="w-4 h-4 text-primary" />
                        </button>
                        <button
                          onClick={() => openEditModal(publication)}
                          className="p-2 hover:bg-warning/10 rounded transition-colors"
                          disabled={isLoading}
                          aria-label={`Edit ${publication.title}`}
                        >
                          <Edit2 className="w-4 h-4 text-warning" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(publication)}
                          className="p-2 hover:bg-destructive/10 rounded transition-colors"
                          disabled={isLoading}
                          aria-label={`Delete ${publication.title}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {publications.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No publications found. Create your first publication to
                      get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Publication Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Publication</DialogTitle>
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
                  <Label htmlFor="price">Price (LKR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPrice(e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPrice">Discount Price (LKR)</Label>
                  <Input
                    id="discountPrice"
                    type="number"
                    placeholder="0.00"
                    value={discountPrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setDiscountPrice(e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <GradeSelect
                    value={gradeId}
                    onValueChange={setGradeId}
                    placeholder="Select grade"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <SubjectSelect
                    value={subjectId}
                    onValueChange={setSubjectId}
                    placeholder="Select subject"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medium">Medium</Label>
                  <MediumSelect
                    value={mediumId}
                    onValueChange={setMediumId}
                    placeholder="Select medium"
                    disabled={isSubmitting}
                  />
                </div>
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

              {/* File Upload Section */}
              <div className="space-y-4 border border-border rounded-lg p-4">
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
                    PDF, EPUB formats, up to 50MB
                  </p>
                  <Input
                    type="file"
                    accept=".pdf,.epub"
                    onChange={(e) => handleFileChange(e, "publication")}
                    className="mt-3"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Cover Image Upload Section */}
              <div className="space-y-4 border border-border rounded-lg p-4">
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
              <DialogTitle>Update Publication</DialogTitle>
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
                  <Label htmlFor="edit-price">Price (LKR) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPrice(e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-discountPrice">
                    Discount Price (LKR)
                  </Label>
                  <Input
                    id="edit-discountPrice"
                    type="number"
                    value={discountPrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setDiscountPrice(e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-grade">Grade</Label>
                  <GradeSelect
                    value={gradeId}
                    onValueChange={setGradeId}
                    placeholder="Select grade"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-subject">Subject</Label>
                  <SubjectSelect
                    value={subjectId}
                    onValueChange={setSubjectId}
                    placeholder="Select subject"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-medium">Medium</Label>
                  <MediumSelect
                    value={mediumId}
                    onValueChange={setMediumId}
                    placeholder="Select medium"
                    disabled={isSubmitting}
                  />
                </div>
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

              {/* Current File Display */}
              <div className="space-y-4 border border-border rounded-lg p-4">
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
              <div className="space-y-4 border border-border rounded-lg p-4">
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

        {/* Purchasers Modal */}
        <Dialog
          open={showPurchasersModal}
          onOpenChange={setShowPurchasersModal}
        >
          <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Purchasers of "{selectedPublication?.title}"
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {loadingPurchasers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">
                    Loading purchasers...
                  </span>
                </div>
              ) : purchasers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No purchases yet for this publication</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="p-3 text-left text-sm font-semibold">
                          Name
                        </th>
                        <th className="p-3 text-left text-sm font-semibold">
                          Email
                        </th>
                        <th className="p-3 text-left text-sm font-semibold">
                          Phone
                        </th>
                        <th className="p-3 text-left text-sm font-semibold">
                          Role
                        </th>
                        <th className="p-3 text-left text-sm font-semibold">
                          Purchased At
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchasers.map((purchase) => (
                        <tr
                          key={purchase.id}
                          className="border-b border-border hover:bg-muted/20"
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {purchase.user.avatar ? (
                                <img
                                  src={purchase.user.avatar}
                                  alt={`${purchase.user.firstName} ${purchase.user.lastName}`}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-medium text-primary">
                                    {purchase.user.firstName[0]}
                                    {purchase.user.lastName[0]}
                                  </span>
                                </div>
                              )}
                              <span className="text-sm font-medium">
                                {purchase.user.firstName}{" "}
                                {purchase.user.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-sm">{purchase.user.email}</td>
                          <td className="p-3 text-sm">
                            {purchase.user.phone || "N/A"}
                          </td>
                          <td className="p-3 text-sm">
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                              {purchase.user.role.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="p-3 text-sm">
                            {new Date(purchase.purchasedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPurchasersModal(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default PublicationManagement;
