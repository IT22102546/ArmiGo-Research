"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  ArrowLeft,
  Eye,
  Save,
} from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";

interface ValidationError {
  row: number;
  field: string;
  message: string;
  severity: "error" | "warning";
}

interface UserRow {
  row: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  grade?: string;
  medium?: string;
  zone?: string;
  password?: string;
  status: "pending" | "valid" | "error" | "warning";
  errors: ValidationError[];
}

interface UploadResult {
  success: boolean;
  validRows: UserRow[];
  invalidRows: UserRow[];
  totalRows: number;
  validCount: number;
  errorCount: number;
  warningCount: number;
}

export default function BulkUserUploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Validate file mutation
  const validateMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await ApiClient.post<UploadResult>(
        "/users/bulk-upload/validate",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response;
    },
    onSuccess: (data) => {
      setUploadResult(data);
      setShowPreview(true);
      toast({
        title: "Validation Complete",
        description: `${data.validCount} valid rows, ${data.errorCount} errors, ${data.warningCount} warnings`,
        status: "info",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Validation Failed",
        description: error.response?.data?.message || "Failed to validate file",
        status: "error",
      });
    },
  });

  // Import users mutation
  const importMutation = useMutation({
    mutationFn: async (rows: UserRow[]) => {
      const response = await ApiClient.post<{
        imported: number;
        credentials?: any[];
      }>("/users/bulk-upload/import", {
        users: rows.map((row) => ({
          name: row.name,
          email: row.email,
          phone: row.phone,
          role: row.role,
          grade: row.grade,
          medium: row.medium,
          zone: row.zone,
          password: row.password,
        })),
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Import Successful",
        description: `${data.imported} users created successfully`,
        status: "success",
      });
      setShowPreview(false);
      setFile(null);
      setUploadResult(null);
      setImportProgress(0);

      // Optionally redirect or show credentials download
      if (data.credentials && data.credentials.length > 0) {
        downloadCredentials(data.credentials);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.response?.data?.message || "Failed to import users",
        status: "error",
      });
      setImportProgress(0);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(fileExtension || "")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file",
        status: "error",
      });
      return;
    }

    setFile(selectedFile);
    validateMutation.mutate(selectedFile);
  };

  const downloadTemplate = () => {
    const csvContent = [
      ["name", "email", "phone", "role", "grade", "medium", "zone"].join(","),
      [
        "John Doe",
        "john@example.com",
        "0771234567",
        "STUDENT",
        "10",
        "Sinhala",
        "Colombo",
      ].join(","),
      [
        "Jane Smith",
        "jane@example.com",
        "0777654321",
        "TEACHER",
        "",
        "English",
        "Colombo",
      ].join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-user-upload-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Fill in the template and upload it",
      status: "info",
    });
  };

  const downloadCredentials = (credentials: any[]) => {
    const csvContent = [
      ["Name", "Email", "Password", "Role"].join(","),
      ...credentials.map((cred) =>
        [cred.name, cred.email, cred.password, cred.role].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-credentials-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Credentials Downloaded",
      description: "User credentials have been saved to your device",
      status: "success",
    });
  };

  const handleImport = () => {
    if (!uploadResult || uploadResult.validCount === 0) {
      toast({
        title: "No Valid Rows",
        description: "Please fix all errors before importing",
        status: "error",
      });
      return;
    }

    importMutation.mutate(uploadResult.validRows);
  };

  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to User Management
        </Button>
        <h1 className="text-3xl font-bold mb-2">Bulk User Upload</h1>
        <p className="text-muted-foreground">
          Upload a CSV or Excel file to create multiple users at once
        </p>
      </div>

      <div className="grid gap-6">
        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Instructions</CardTitle>
            <CardDescription>
              Follow these steps to upload users in bulk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>Download the template file by clicking the button below</li>
              <li>
                Fill in the template with user information (one user per row)
              </li>
              <li>Save the file as CSV or Excel format</li>
              <li>Upload the file using the upload area below</li>
              <li>Review the validation results and fix any errors</li>
              <li>Confirm and import the users</li>
            </ol>

            <div className="mt-6">
              <Button onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Template Fields Info */}
        <Card>
          <CardHeader>
            <CardTitle>Template Fields</CardTitle>
            <CardDescription>
              Required and optional fields in the template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  Required Fields
                  <Badge variant="destructive">Required</Badge>
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">name</code> -
                    Full name
                  </li>
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">email</code> -
                    Valid email address
                  </li>
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">role</code> -
                    STUDENT, TEACHER, or ADMIN
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  Optional Fields
                  <Badge variant="outline">Optional</Badge>
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">phone</code> -
                    Phone number
                  </li>
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">grade</code> -
                    Grade level (for students)
                  </li>
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">medium</code> -
                    Sinhala, English, Tamil
                  </li>
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">zone</code> -
                    Geographic zone
                  </li>
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">password</code>{" "}
                    - Leave empty for auto-generation
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Upload your CSV or Excel file to begin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload CSV or Excel file for bulk user import"
              title="Select a CSV or Excel file to upload"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {file ? file.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-sm text-muted-foreground">
                CSV or Excel files (max 10MB)
              </p>
            </div>

            {validateMutation.isPending && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Validating file...
                </p>
                <Progress value={50} className="h-2" />
              </div>
            )}

            {importMutation.isPending && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Importing users... {importProgress}%
                </p>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Summary */}
        {uploadResult && (
          <Card>
            <CardHeader>
              <CardTitle>Validation Results</CardTitle>
              <CardDescription>
                Review the validation results before importing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Total Rows
                    </span>
                  </div>
                  <div className="text-2xl font-bold">
                    {uploadResult.totalRows}
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">Valid</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {uploadResult.validCount}
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-muted-foreground">
                      Errors
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {uploadResult.errorCount}
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-muted-foreground">
                      Warnings
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {uploadResult.warningCount}
                  </div>
                </div>
              </div>

              {uploadResult.errorCount > 0 && (
                <Alert variant="destructive" className="mb-4">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    There are {uploadResult.errorCount} rows with errors that
                    must be fixed before importing.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setShowPreview(true)} variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview All Rows
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={
                    uploadResult.validCount === 0 || importMutation.isPending
                  }
                >
                  <Save className="mr-2 h-4 w-4" />
                  Import {uploadResult.validCount} Users
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Preview Upload Data</DialogTitle>
            <DialogDescription>
              Review all rows before importing (showing first 100 rows)
            </DialogDescription>
          </DialogHeader>

          {uploadResult && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...uploadResult.validRows, ...uploadResult.invalidRows]
                    .slice(0, 100)
                    .map((row) => (
                      <TableRow key={row.row}>
                        <TableCell>{row.row}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>
                          <Badge>{row.role}</Badge>
                        </TableCell>
                        <TableCell>{row.grade || "-"}</TableCell>
                        <TableCell>
                          {row.status === "valid" && (
                            <Badge variant="outline" className="bg-green-50">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Valid
                            </Badge>
                          )}
                          {row.status === "error" && (
                            <Badge variant="destructive">
                              <XCircle className="mr-1 h-3 w-3" />
                              Error
                            </Badge>
                          )}
                          {row.status === "warning" && (
                            <Badge variant="outline" className="bg-orange-50">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Warning
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
