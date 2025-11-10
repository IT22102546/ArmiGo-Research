"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Award,
  Download,
  RefreshCw,
  Filter,
  Search,
  Loader2,
  Eye,
  EyeOff,
  Trophy,
  Medal,
} from "lucide-react";
import { examsApi } from "@/lib/api/endpoints/exams";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
import { useAuthStore } from "@/stores/auth-store";

type RankingScope = "OVERALL" | "ISLAND" | "DISTRICT" | "ZONE";
type StudentType = "ALL" | "INTERNAL" | "EXTERNAL";

interface RankingEntry {
  rank: number;
  studentId: string;
  studentName: string;
  maskedName?: string;
  score: number;
  percentage: number;
  district?: string;
  zone?: string;
  island?: string;
  studentType: "INTERNAL" | "EXTERNAL";
  grade?: string;
}

export function RankingViewPage() {
  const searchParams = useSearchParams();
  const examId = searchParams?.get("examId");
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [exam, setExam] = useState<any>(null);

  // Filters
  const [scope, setScope] = useState<RankingScope>("OVERALL");
  const [studentType, setStudentType] = useState<StudentType>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Visibility
  const [rankingsVisible, setRankingsVisible] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (examId) {
      fetchRankingData();
    }
  }, [examId, scope, studentType]);

  const fetchRankingData = async () => {
    if (!examId) return;

    try {
      setLoading(true);

      const [examData, rankingsData, visibilityData] = await Promise.all([
        examsApi.getById(examId),
        examsApi.getRankings(examId, {
          level: scope === "OVERALL" ? undefined : scope,
          studentType: studentType === "ALL" ? undefined : studentType,
        }),
        examsApi.getRankingVisibility(examId),
      ]);

      setExam(examData);
      setRankings(rankingsData);
      setRankingsVisible(visibilityData.visible);
    } catch (error) {
      handleApiError(error, "Failed to fetch ranking data");
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!examId || !isAdmin) return;

    try {
      setRecalculating(true);
      await examsApi.recalculateRankings(examId);
      handleApiSuccess("Rankings recalculated successfully");
      await fetchRankingData();
    } catch (error) {
      handleApiError(error, "Failed to recalculate rankings");
    } finally {
      setRecalculating(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!examId) return;

    try {
      await examsApi.updateRankingVisibility(examId, !rankingsVisible);
      handleApiSuccess(
        `Rankings ${!rankingsVisible ? "shown" : "hidden"} to students`
      );
      setRankingsVisible(!rankingsVisible);
    } catch (error) {
      handleApiError(error, "Failed to update ranking visibility");
    }
  };

  const handleExport = async (format: "csv" | "pdf") => {
    if (!examId) return;

    try {
      setExporting(true);
      const blob = await examsApi.exportRankings(examId, {
        format,
        scope,
        studentType: studentType === "ALL" ? undefined : studentType,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rankings-${exam?.title}-${scope}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      handleApiSuccess(`Rankings exported as ${format.toUpperCase()}`);
    } catch (error) {
      handleApiError(error, "Failed to export rankings");
    } finally {
      setExporting(false);
    }
  };

  const filteredRankings = rankings.filter((entry) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        entry.studentName.toLowerCase().includes(searchLower) ||
        entry.maskedName?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <Badge className="bg-yellow-500 text-white">
          <Trophy className="h-3 w-3 mr-1" />
          1st
        </Badge>
      );
    } else if (rank === 2) {
      return (
        <Badge className="bg-gray-400 text-white">
          <Medal className="h-3 w-3 mr-1" />
          2nd
        </Badge>
      );
    } else if (rank === 3) {
      return (
        <Badge className="bg-orange-500 text-white">
          <Medal className="h-3 w-3 mr-1" />
          3rd
        </Badge>
      );
    } else {
      return <Badge variant="outline">{rank}</Badge>;
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!examId || !exam) {
    return (
      <div className="text-center py-12">
        <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">
          No exam selected for ranking view
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exam Rankings</h1>
          <p className="text-muted-foreground mt-1">{exam.title}</p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={handleRecalculate}
              disabled={recalculating}
            >
              {recalculating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Recalculate
            </Button>
          )}
          <Button
            variant={rankingsVisible ? "default" : "outline"}
            onClick={handleToggleVisibility}
          >
            {rankingsVisible ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Visible to Students
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hidden from Students
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rankings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Internal Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rankings.filter((r) => r.studentType === "INTERNAL").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              External Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rankings.filter((r) => r.studentType === "EXTERNAL").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rankings.length > 0
                ? (
                    rankings.reduce((sum, r) => sum + r.percentage, 0) /
                    rankings.length
                  ).toFixed(1)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Scope Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Ranking Scope
              </label>
              <Select
                value={scope}
                onValueChange={(val) => setScope(val as RankingScope)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OVERALL">Overall</SelectItem>
                  <SelectItem value="ISLAND">Island-wise</SelectItem>
                  <SelectItem value="DISTRICT">District-wise</SelectItem>
                  <SelectItem value="ZONE">Zone-wise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Student Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Student Type
              </label>
              <Select
                value={studentType}
                onValueChange={(val) => setStudentType(val as StudentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Students</SelectItem>
                  <SelectItem value="INTERNAL">Internal Only</SelectItem>
                  <SelectItem value="EXTERNAL">External Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Export */}
            <div>
              <label className="text-sm font-medium mb-2 block">Export</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleExport("csv")}
                  disabled={exporting}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport("pdf")}
                  disabled={exporting}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rankings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rankings Table</CardTitle>
          <CardDescription>
            {scope} rankings - {filteredRankings.length} students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Rank</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Percentage</TableHead>
                {scope !== "OVERALL" && <TableHead>District</TableHead>}
                {scope === "ZONE" && <TableHead>Zone</TableHead>}
                {scope === "ISLAND" && <TableHead>Island</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRankings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={scope === "ZONE" ? 7 : scope === "ISLAND" ? 7 : 6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No rankings available
                  </TableCell>
                </TableRow>
              ) : (
                filteredRankings.map((entry) => (
                  <TableRow key={entry.studentId}>
                    <TableCell>{getRankBadge(entry.rank)}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {entry.studentType === "EXTERNAL" && entry.maskedName
                          ? entry.maskedName
                          : entry.studentName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.studentType === "INTERNAL"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {entry.studentType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{entry.score}</TableCell>
                    <TableCell>
                      <span
                        className={`font-bold ${getPercentageColor(entry.percentage)}`}
                      >
                        {entry.percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                    {scope !== "OVERALL" && (
                      <TableCell>{entry.district || "-"}</TableCell>
                    )}
                    {scope === "ZONE" && (
                      <TableCell>{entry.zone || "-"}</TableCell>
                    )}
                    {scope === "ISLAND" && (
                      <TableCell>{entry.island || "-"}</TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
