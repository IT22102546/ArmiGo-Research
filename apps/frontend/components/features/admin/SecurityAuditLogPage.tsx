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
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Eye,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import { securityAuditApi } from "@/lib/api/endpoints";
import { handleApiError } from "@/lib/error-handling";

interface SecurityAuditLog {
  id: string;
  userId: string | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  deviceId: string | null;
  fingerprint: string | null;
  success: boolean;
  errorMessage: string | null;
  errorCode: string | null;
  riskScore: number | null;
  metadata: Record<string, any> | null;
  country: string | null;
  city: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export default function SecurityAuditLogPage() {
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [successFilter, setSuccessFilter] = useState("ALL");
  const [riskScoreMin, setRiskScoreMin] = useState("");
  const [riskScoreMax, setRiskScoreMax] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [resource, setResource] = useState("");

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SecurityAuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [
    pagination.page,
    actionFilter,
    successFilter,
    riskScoreMin,
    riskScoreMax,
    dateFrom,
    dateTo,
    searchTerm,
    ipAddress,
    resource,
  ]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await securityAuditApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        success:
          successFilter !== "ALL" ? successFilter === "SUCCESS" : undefined,
        riskScoreMin: riskScoreMin ? parseInt(riskScoreMin) : undefined,
        riskScoreMax: riskScoreMax ? parseInt(riskScoreMax) : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: searchTerm || undefined,
        ipAddress: ipAddress || undefined,
        resource: resource || undefined,
      });

      const logsArr = Array.isArray(response)
        ? response
        : (response.data ?? []);
      setLogs(logsArr);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total ?? 0,
        pages:
          response.pagination?.pages ??
          Math.ceil((response.pagination?.total ?? 0) / pagination.limit),
      }));
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (log: SecurityAuditLog) => {
    setSelectedLog(log);
    setViewDialogOpen(true);
  };

  const getRiskScoreColor = (score: number | null) => {
    if (score === null) return "secondary";
    if (score <= 30) return "green";
    if (score <= 70) return "yellow";
    return "red";
  };

  const getRiskScoreBadgeVariant = (score: number | null): BadgeVariant => {
    if (score === null) return "secondary";
    if (score <= 30) return "default";
    if (score <= 70) return "outline";
    return "destructive";
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActionFilter("ALL");
    setSuccessFilter("ALL");
    setRiskScoreMin("");
    setRiskScoreMax("");
    setDateFrom("");
    setDateTo("");
    setIpAddress("");
    setResource("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Audit Log
            </CardTitle>
            <CardDescription>
              Monitor security events and track suspicious activities
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, resource..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                <SelectItem value="LOGIN_SUCCESS">Login Success</SelectItem>
                <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                <SelectItem value="LOGIN_BLOCKED">Login Blocked</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="SESSION_EXPIRED">Session Expired</SelectItem>
                <SelectItem value="PASSWORD_CHANGE">Password Change</SelectItem>
                <SelectItem value="TWO_FACTOR_ENABLED">2FA Enabled</SelectItem>
                <SelectItem value="TWO_FACTOR_FAILED">2FA Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={successFilter} onValueChange={setSuccessFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Success" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="riskMin" className="text-sm">
                Risk Score Min
              </Label>
              <Input
                id="riskMin"
                type="number"
                min="0"
                max="100"
                value={riskScoreMin}
                onChange={(e) => setRiskScoreMin(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="riskMax" className="text-sm">
                Risk Score Max
              </Label>
              <Input
                id="riskMax"
                type="number"
                min="0"
                max="100"
                value={riskScoreMax}
                onChange={(e) => setRiskScoreMax(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="ipAddress" className="text-sm">
                IP Address
              </Label>
              <Input
                id="ipAddress"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="192.168.1.1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="resource" className="text-sm">
                Resource
              </Label>
              <Input
                id="resource"
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                placeholder="exam, user, etc."
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="dateFrom" className="text-sm">
                From Date
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="dateTo" className="text-sm">
                To Date
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Success</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No security audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewDetail(log)}
                >
                  <TableCell>
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <div>
                        <div className="font-medium">
                          {log.user.firstName} {log.user.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.user.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {log.action.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.resource || "-"}</TableCell>
                  <TableCell>
                    {log.success ? (
                      <Badge
                        variant="default"
                        className="flex items-center gap-1 w-fit"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Success
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="flex items-center gap-1 w-fit"
                      >
                        <XCircle className="h-3 w-3" />
                        Failed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.riskScore !== null ? (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getRiskScoreBadgeVariant(log.riskScore)}
                        >
                          {log.riskScore}
                        </Badge>
                        {log.riskScore > 70 && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{log.ipAddress || "-"}</code>
                  </TableCell>
                  <TableCell>
                    {log.city && log.country
                      ? `${log.city}, ${log.country}`
                      : log.country || "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetail(log);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {logs.length} of {pagination.total} logs
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      {/* View Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Security Audit Log Detail</DialogTitle>
            <DialogDescription>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">
                  {selectedLog?.action.replace(/_/g, " ")}
                </Badge>
                {selectedLog?.success ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Success
                  </Badge>
                ) : (
                  <Badge
                    variant="destructive"
                    className="flex items-center gap-1"
                  >
                    <XCircle className="h-3 w-3" />
                    Failed
                  </Badge>
                )}
                {selectedLog?.riskScore !== null &&
                  selectedLog?.riskScore !== undefined && (
                    <Badge
                      variant={getRiskScoreBadgeVariant(selectedLog.riskScore!)}
                    >
                      Risk: {selectedLog.riskScore}
                    </Badge>
                  )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-1">Timestamp</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedLog?.createdAt
                    ? new Date(selectedLog.createdAt).toLocaleString()
                    : "-"}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">User</h4>
                {selectedLog?.user ? (
                  <div>
                    <p className="text-sm font-medium">
                      {selectedLog.user.firstName} {selectedLog.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedLog.user.email}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {selectedLog.user.role}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unknown</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-1">Resource</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedLog?.resource || "N/A"}
                </p>
                {selectedLog?.resourceId && (
                  <code className="text-xs text-muted-foreground">
                    ID: {selectedLog.resourceId}
                  </code>
                )}
              </div>
              <div>
                <h4 className="font-semibold mb-1">IP Address</h4>
                <code className="text-sm">{selectedLog?.ipAddress || "-"}</code>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-1">Location</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedLog?.city && selectedLog?.country
                    ? `${selectedLog.city}, ${selectedLog.country}`
                    : selectedLog?.country || "Unknown"}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Device ID</h4>
                <code className="text-xs text-muted-foreground">
                  {selectedLog?.deviceId || "-"}
                </code>
              </div>
            </div>
            {selectedLog?.userAgent && (
              <div>
                <h4 className="font-semibold mb-1">User Agent</h4>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {selectedLog.userAgent}
                </p>
              </div>
            )}
            {selectedLog?.fingerprint && (
              <div>
                <h4 className="font-semibold mb-1">Fingerprint</h4>
                <code className="text-xs text-muted-foreground">
                  {selectedLog.fingerprint}
                </code>
              </div>
            )}
            {!selectedLog?.success && selectedLog?.errorMessage && (
              <div>
                <h4 className="font-semibold mb-1">Error</h4>
                <div className="bg-destructive/10 p-3 rounded-md">
                  <p className="text-sm text-destructive">
                    {selectedLog.errorMessage}
                  </p>
                  {selectedLog.errorCode && (
                    <code className="text-xs text-muted-foreground">
                      Code: {selectedLog.errorCode}
                    </code>
                  )}
                </div>
              </div>
            )}
            {selectedLog?.metadata && (
              <div>
                <h4 className="font-semibold mb-1">Metadata</h4>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
