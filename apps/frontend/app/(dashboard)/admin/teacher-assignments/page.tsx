"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  Download,
  FileText,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
  Building2,
  Stethoscope,
  User2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
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
import { ApiClient } from "@/lib/api/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Hospital {
  id: string;
  name: string;
}

interface Physiotherapist {
  id: string;
  name: string;
  role?: string;
  specialization?: string;
  hospitalId?: string;
  hospital?: Hospital | null;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  age?: number;
  diagnosis?: string;
  hospitalId?: string;
  hospital?: Hospital | null;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  assignmentPdf?: string;
  assignmentPdfName?: string;
  status: string;
  createdAt: string;
  hospital?: Hospital | null;
  physiotherapist?: Physiotherapist | null;
  child: Child;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
}

// ─── Default form ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  hospitalId: "",
  physiotherapistId: "",
  childId: "",
  title: "",
  description: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PhysiotherapyAssignmentsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // Role detection
  const userRoles = Array.isArray((user as any)?.roles)
    ? ((user as any).roles as string[])
    : ([user?.role].filter(Boolean) as string[]);
  const isHospitalScoped =
    userRoles.includes("HOSPITAL_ADMIN") && user?.email !== "armigo@gmail.com";

  // ── List filters ──
  const [search, setSearch] = useState("");
  const [filterHospitalId, setFilterHospitalId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // ── Dialog state ──
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);

  // ── Form state ──
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState("");
  const [uploadedPdfName, setUploadedPdfName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Queries ──────────────────────────────────────────────────────────────

  /**
   * Cascading options: hospitals → physiotherapists → children.
   * Backend scopes automatically for HOSPITAL_ADMIN users.
   */
  const { data: options } = useQuery({
    queryKey: [
      "physio-assignments",
      "options",
      form.hospitalId,
      form.physiotherapistId,
    ],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (form.hospitalId) params.hospitalId = form.hospitalId;
      if (form.physiotherapistId)
        params.physiotherapistId = form.physiotherapistId;
      const resp = await ApiClient.get<any>("/patients/assignments/options", {
        params,
      });
      const d = resp?.data ?? resp ?? {};
      return (d.data || d) as {
        hospitals: Hospital[];
        physiotherapists: Physiotherapist[];
        children: Child[];
      };
    },
    staleTime: 30_000,
    enabled: createOpen, // only fetch when dialog is open
  });

  const hospitals: Hospital[] = options?.hospitals ?? [];
  const physiotherapists: Physiotherapist[] = options?.physiotherapists ?? [];
  const children: Child[] = options?.children ?? [];

  /** Hospitals for the list-level filter bar (super admin only) */
  const { data: allHospitals = [] } = useQuery<Hospital[]>({
    queryKey: ["physio-assignments", "all-hospitals"],
    queryFn: async () => {
      const resp = await ApiClient.get<any>("/patients/locations/hospitals");
      const d = resp?.data ?? resp ?? {};
      return (d.data || d || []) as Hospital[];
    },
    enabled: !isHospitalScoped,
  });

  /** Existing assignment list */
  const { data: assignments = [], isLoading, isError: listError } = useQuery<Assignment[]>({
    queryKey: [
      "physio-assignments",
      "list",
      filterHospitalId,
      filterStatus,
      search,
    ],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filterHospitalId !== "all") params.hospitalId = filterHospitalId;
      if (filterStatus !== "all") params.status = filterStatus;
      if (search.trim()) params.search = search.trim();
      // ApiClient already unwraps { success, data } → returns the array directly
      const resp = await ApiClient.get<any>("/patients/assignments", { params });
      if (Array.isArray(resp)) return resp as Assignment[];
      return ((resp as any)?.data ?? []) as Assignment[];
    },
  });

  // ── Pre-fill hospital for hospital-admin as soon as options load ──
  useEffect(() => {
    if (createOpen && isHospitalScoped && hospitals.length === 1 && !form.hospitalId) {
      setForm((prev) => ({ ...prev, hospitalId: hospitals[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOpen, hospitals, isHospitalScoped]);

  // ── Cascade resets ──
  useEffect(() => {
    setForm((prev) => ({ ...prev, childId: "" }));
  }, [form.physiotherapistId]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, physiotherapistId: "", childId: "" }));
  }, [form.hospitalId]);

  // ─── PDF handlers ─────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error("File size must be under 50 MB");
      return;
    }
    setPdfFile(f);
    setUploadedPdfUrl("");
    setUploadedPdfName("");
  };

  const handleUploadPdf = async () => {
    if (!pdfFile) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", pdfFile);
      const resp = await ApiClient.uploadFile<any>(
        "/patients/assignments/upload",
        fd
      );
      const d = resp?.data ?? resp ?? {};
      const url = (d.data || d)?.url ?? d?.url ?? "";
      const name = (d.data || d)?.filename ?? pdfFile.name;
      setUploadedPdfUrl(url);
      setUploadedPdfName(name);
      toast.success("PDF uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Create mutation ──────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        childId: form.childId,
        title: form.title.trim(),
      };
      if (form.hospitalId) payload.hospitalId = form.hospitalId;
      if (form.physiotherapistId) payload.physiotherapistId = form.physiotherapistId;
      if (form.description.trim()) payload.description = form.description.trim();
      if (uploadedPdfUrl) {
        payload.assignmentPdf = uploadedPdfUrl;
        payload.assignmentPdfName = uploadedPdfName;
      }
      return ApiClient.post<any>("/patients/assignments", payload);
    },
    onSuccess: async () => {
      toast.success("Assignment created successfully");
      await queryClient.invalidateQueries({
        queryKey: ["physio-assignments", "list"],
      });
      handleCloseCreate();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create assignment");
    },
  });

  // ─── Delete mutation ──────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      ApiClient.delete<any>(`/patients/assignments/${id}`),
    onSuccess: async () => {
      toast.success("Assignment deleted");
      await queryClient.invalidateQueries({
        queryKey: ["physio-assignments", "list"],
      });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete assignment");
    },
  });

  // ─── Dialog helpers ───────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setForm({ ...EMPTY_FORM });
    setPdfFile(null);
    setUploadedPdfUrl("");
    setUploadedPdfName("");
    setCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setPdfFile(null);
    setUploadedPdfUrl("");
    setUploadedPdfName("");
    setForm({ ...EMPTY_FORM });
  };

  const canSubmit =
    !!form.childId &&
    !!form.title.trim() &&
    !createMutation.isPending &&
    !isUploading;

  const statusBadgeVariant = (s: string) => {
    if (s === "ACTIVE") return "default" as const;
    if (s === "COMPLETED") return "secondary" as const;
    return "outline" as const;
  };

  // ─── Stats ────────────────────────────────────────────────────────────────

  const stats = {
    total: assignments.length,
    active: assignments.filter((a) => a.status === "ACTIVE").length,
    completed: assignments.filter((a) => a.status === "COMPLETED").length,
    withPdf: assignments.filter((a) => !!a.assignmentPdf).length,
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Physiotherapy Assignments</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Assign exercise plans and PDF documents to children
            </p>
          </div>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(
          [
            { label: "Total", value: stats.total, color: "blue" },
            { label: "Active", value: stats.active, color: "green" },
            { label: "Completed", value: stats.completed, color: "purple" },
            { label: "With PDF", value: stats.withPdf, color: "orange" },
          ] as const
        ).map((s) => (
          <Card
            key={s.label}
            className={`border-0 shadow-sm ${CARD_COLORS[s.color].card}`}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${CARD_COLORS[s.color].icon}`}>
                <ClipboardList
                  className={`h-4 w-4 ${CARD_COLORS[s.color].text}`}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-semibold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, child or physiotherapist…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {!isHospitalScoped && (
              <Select
                value={filterHospitalId}
                onValueChange={setFilterHospitalId}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All hospitals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All hospitals</SelectItem>
                  {allHospitals.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {(search || filterHospitalId !== "all" || filterStatus !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setFilterHospitalId("all");
                  setFilterStatus("all");
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assignment list */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Assignments{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({assignments.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              Loading assignments…
            </div>
          ) : listError ? (
            <div className="py-16 text-center">
              <p className="text-sm text-destructive">Failed to load assignments. Check the browser console for details.</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="py-16 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-lg">No assignments yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create the first physiotherapy assignment
              </p>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-b-xl">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Title</TableHead>
                    <TableHead>Child</TableHead>
                    <TableHead>Physiotherapist</TableHead>
                    {!isHospitalScoped && <TableHead>Hospital</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>PDF</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium">{a.title}</div>
                        {a.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {a.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {a.child?.firstName} {a.child?.lastName}
                        </span>
                        {a.child?.diagnosis && (
                          <div className="text-xs text-muted-foreground">
                            {a.child.diagnosis}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {a.physiotherapist?.name ?? (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      {!isHospitalScoped && (
                        <TableCell>
                          {a.hospital?.name ?? (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant={statusBadgeVariant(a.status)}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {a.assignmentPdf ? (
                          <a
                            href={a.assignmentPdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <Download className="h-3.5 w-3.5" />
                            View PDF
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            No file
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(a)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create assignment dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => !v && handleCloseCreate()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              New Physiotherapy Assignment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Hospital selector — super admin only */}
            {!isHospitalScoped && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Hospital
                </Label>
                <Select
                  value={form.hospitalId}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, hospitalId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitals.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Hospital name badge when scoped */}
            {isHospitalScoped && form.hospitalId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Hospital:</span>
                <Badge variant="secondary">
                  {hospitals.find((h) => h.id === form.hospitalId)?.name ??
                    "Your Hospital"}
                </Badge>
              </div>
            )}

            {/* Physiotherapist selector */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                Physiotherapist
              </Label>
              <Select
                value={form.physiotherapistId}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, physiotherapistId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select physiotherapist" />
                </SelectTrigger>
                <SelectContent>
                  {physiotherapists.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      {form.hospitalId || isHospitalScoped
                        ? "No physiotherapists found"
                        : "Select a hospital first"}
                    </SelectItem>
                  ) : (
                    physiotherapists.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.specialization ? ` — ${p.specialization}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Child selector */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <User2 className="h-4 w-4 text-muted-foreground" />
                Child <span className="text-destructive ml-0.5">*</span>
              </Label>
              <Select
                value={form.childId}
                onValueChange={(v) => setForm((p) => ({ ...p, childId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  {children.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      {form.physiotherapistId
                        ? "No children found for this physiotherapist"
                        : form.hospitalId || isHospitalScoped
                        ? "Select a physiotherapist to filter children"
                        : "Select a hospital first"}
                    </SelectItem>
                  ) : (
                    children.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                        {c.age ? ` (${c.age}y)` : ""}
                        {c.diagnosis ? ` — ${c.diagnosis}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="a-title">
                Assignment Title{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="a-title"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="e.g., Week 4 Finger Extension Exercises"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="a-desc">Description</Label>
              <Textarea
                id="a-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Instructions, goals, frequency…"
                rows={3}
              />
            </div>

            {/* PDF upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Assignment PDF
              </Label>

              {uploadedPdfUrl ? (
                /* Uploaded successfully */
                <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 text-sm">
                  <FileText className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-green-700 dark:text-green-400 flex-1 truncate">
                    {uploadedPdfName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedPdfUrl("");
                      setUploadedPdfName("");
                      setPdfFile(null);
                    }}
                    className="ml-auto text-green-500 hover:text-green-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : pdfFile ? (
                /* File selected, pending upload */
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 p-2.5 rounded-lg border text-sm truncate">
                    {pdfFile.name}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleUploadPdf}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        Upload
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setPdfFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                /* Drop zone */
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 hover:border-primary/50 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Click to select PDF</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    PDF files only · max 50 MB
                  </span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseCreate}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!canSubmit}
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2" />
                  Saving…
                </>
              ) : (
                "Create Assignment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>&ldquo;{deleteTarget?.title}&rdquo;</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Color config ─────────────────────────────────────────────────────────────

const CARD_COLORS = {
  blue: {
    card: "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20",
    icon: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-600 dark:text-blue-400",
  },
  green: {
    card: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20",
    icon: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  purple: {
    card: "bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/40 dark:to-violet-900/20",
    icon: "bg-violet-100 dark:bg-violet-900/40",
    text: "text-violet-600 dark:text-violet-400",
  },
  orange: {
    card: "bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-orange-900/20",
    icon: "bg-orange-100 dark:bg-orange-900/40",
    text: "text-orange-600 dark:text-orange-400",
  },
} as const;
