import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "select" | "number" | "date" | "textarea" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  dependsOn?: string; // Field name it depends on
  fetchOptions?: (dependencyValue?: string) => Promise<any[]>;
}

export interface CrudPageConfig {
  title: string;
  description: string;
  apiEndpoint: string;
  queryKey: string;
  columns: Column[];
  formFields: FormField[];
  defaultFormData: Record<string, any>;
  idField?: string;
  nameField?: string;
}

interface GenericCrudPageProps {
  config: CrudPageConfig;
}

export function GenericCrudPage({ config }: GenericCrudPageProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("common");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState(config.defaultFormData);

  const idField = config.idField || "id";
  const nameField = config.nameField || "name";

  // Fetch main data
  const { data: items, isLoading } = useQuery({
    queryKey: [config.queryKey],
    queryFn: async () => {
      const response = await ApiClient.get<any>(config.apiEndpoint);
      return response?.data || response || [];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => ApiClient.post(config.apiEndpoint, data),
    onSuccess: () => {
      toast.success(`${config.title.slice(0, -1)} created successfully`);
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          `Failed to create ${config.title.toLowerCase().slice(0, -1)}`
      );
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ApiClient.put(`${config.apiEndpoint}/${id}`, data),
    onSuccess: () => {
      toast.success(`${config.title.slice(0, -1)} updated successfully`);
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          `Failed to update ${config.title.toLowerCase().slice(0, -1)}`
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiClient.delete(`${config.apiEndpoint}/${id}`),
    onSuccess: () => {
      toast.success(`${config.title.slice(0, -1)} deleted successfully`);
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      setDeleteDialogOpen(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          `Failed to delete ${config.title.toLowerCase().slice(0, -1)}`
      );
    },
  });

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setSelectedItem(item);
      const formValues: Record<string, any> = {};
      config.formFields.forEach((field) => {
        formValues[field.name] = item[field.name];
      });
      setFormData(formValues);
    } else {
      setSelectedItem(null);
      setFormData(config.defaultFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedItem(null);
    setFormData(config.defaultFormData);
  };

  const handleSubmit = () => {
    if (selectedItem) {
      updateMutation.mutate({ id: selectedItem[idField], data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (selectedItem) {
      deleteMutation.mutate(selectedItem[idField]);
    }
  };

  const renderFormField = (field: FormField) => {
    switch (field.type) {
      case "select":
        return (
          <Select
            value={formData[field.name]}
            onValueChange={(value) =>
              setFormData({ ...formData, [field.name]: value })
            }
          >
            <SelectTrigger>
              <SelectValue
                placeholder={field.placeholder || `Select ${field.label}`}
              />
            </SelectTrigger>
            <SelectContent>
              {field.options
                ?.filter((option) => option.value)
                .map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        );

      case "textarea":
        return (
          <textarea
            id={field.name}
            value={formData[field.name]}
            onChange={(e) =>
              setFormData({ ...formData, [field.name]: e.target.value })
            }
            placeholder={field.placeholder}
            className="w-full min-h-[100px] px-3 py-2 border rounded-md"
          />
        );

      case "checkbox":
        return (
          <input
            type="checkbox"
            id={field.name}
            checked={formData[field.name]}
            onChange={(e) =>
              setFormData({ ...formData, [field.name]: e.target.checked })
            }
            className="h-4 w-4"
          />
        );

      default:
        return (
          <Input
            id={field.name}
            type={field.type}
            value={formData[field.name]}
            onChange={(e) =>
              setFormData({ ...formData, [field.name]: e.target.value })
            }
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{config.title}</h1>
          <p className="text-muted-foreground">{config.description}</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add {config.title.slice(0, -1)}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
          <CardDescription>
            View and manage all {config.title.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t("loading")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {config.columns.map((column) => (
                    <TableHead key={column.key}>{column.label}</TableHead>
                  ))}
                  <TableHead>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item: any) => (
                  <TableRow key={item[idField]}>
                    {config.columns.map((column) => (
                      <TableCell key={column.key}>
                        {column.render
                          ? column.render(item[column.key], item)
                          : item[column.key]}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
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
              {selectedItem
                ? `Edit ${config.title.slice(0, -1)}`
                : `Create ${config.title.slice(0, -1)}`}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? `Update ${config.title.toLowerCase().slice(0, -1)} information`
                : `Add a new ${config.title.toLowerCase().slice(0, -1)} to the system`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {config.formFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </Label>
                {renderFormField(field)}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit}>
              {selectedItem ? t("update") : t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {config.title.slice(0, -1)}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedItem?.[nameField]}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedItem(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
