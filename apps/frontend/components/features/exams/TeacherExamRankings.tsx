"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  User,
  Loader2,
  MapPin,
  Filter,
  Download,
  Users,
} from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import Image from "next/image";

// Types
interface StudentRanking {
  rank: number;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  totalScore: number;
  maxScore: number;
  percentage: number;
  examId: string;
  attemptId: string;
  submittedAt: string;
  nationalRank?: number;
  provincialRank?: number;
  districtRank?: number;
  zonalRank?: number;
  schoolRank?: number;
}

interface SubjectRanking {
  subject: {
    name: string;
    code: string;
  };
  rankings: StudentRanking[];
  totalRankings?: number;
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
}

interface RankingsResponse {
  totalSubjects: number;
  rankings: SubjectRanking[];
}

interface Grade {
  id: string;
  gradeLevel: number;
  description: string;
}

interface Zone {
  id: string;
  zoneName: string;
}

interface District {
  id: string;
  districtName: string;
  zoneId: string;
}

type RankingLevel = "NATIONAL" | "PROVINCIAL" | "DISTRICT" | "ZONAL" | "SCHOOL";
type StudentType = "ALL" | "INTERNAL" | "EXTERNAL";

export default function TeacherExamRankings() {
  const [loading, setLoading] = useState(true);
  const [rankingsData, setRankingsData] = useState<RankingsResponse | null>(
    null
  );
  const [rankingLevel, setRankingLevel] = useState<RankingLevel>("NATIONAL");
  const [studentTypeFilter, setStudentTypeFilter] =
    useState<StudentType>("ALL");
  const [selectedGrade, setSelectedGrade] = useState<string>("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedZone, setSelectedZone] = useState<string>("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter options from API
  const [grades, setGrades] = useState<Grade[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    fetchFilterOptions();
    fetchExamRankings();
  }, []);

  // Refetch rankings when filters change
  useEffect(() => {
    if (!loading) {
      setCurrentPage(1); // Reset to first page when filters change
      fetchExamRankings();
    }
  }, [selectedGrade, selectedDistrict, selectedZone, studentTypeFilter]);

  // Refetch when pagination changes
  useEffect(() => {
    if (!loading) {
      fetchExamRankings();
    }
  }, [currentPage, pageSize]);

  const fetchFilterOptions = async () => {
    try {
      // Fetch grades
      const gradesResponse = await ApiClient.get<any>("/admin/grades");
      setGrades(
        Array.isArray(gradesResponse)
          ? gradesResponse
          : gradesResponse?.grades || []
      );

      // Fetch zones
      const zonesResponse = await ApiClient.get<any>("/admin/zones");
      setZones(
        Array.isArray(zonesResponse)
          ? zonesResponse
          : zonesResponse?.zones || []
      );

      // Fetch districts
      const districtsResponse = await ApiClient.get<any>("/admin/districts");
      setDistricts(
        Array.isArray(districtsResponse)
          ? districtsResponse
          : districtsResponse?.districts || []
      );
    } catch (error) {
      console.error("Failed to fetch filter options:", error);
      toast.error("Failed to load filter options");
    }
  };

  const fetchExamRankings = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams();
      params.append("limit", "100");
      params.append("page", currentPage.toString());
      params.append("pageSize", pageSize.toString());

      if (selectedGrade !== "ALL") {
        params.append("grade", selectedGrade);
      }
      if (selectedDistrict !== "ALL") {
        params.append("districtId", selectedDistrict);
      }
      if (selectedZone !== "ALL") {
        params.append("zoneId", selectedZone);
      }
      if (studentTypeFilter !== "ALL") {
        params.append(
          "studentType",
          studentTypeFilter === "INTERNAL" ? "internal" : "external"
        );
      }

      const response = await ApiClient.get<RankingsResponse>(
        `/api/v1/exams/rankings?${params.toString()}`
      );
      setRankingsData(response);
    } catch (error) {
      console.error("Failed to fetch exam rankings:", error);
      toast.error("Failed to load exam rankings");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return (
      <span className="text-sm font-medium text-muted-foreground">#{rank}</span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Exam Rankings
            </h2>
            <p className="text-muted-foreground">
              View student performance rankings at national, provincial,
              district, zonal, and school levels
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ranking Level */}
          <div>
            <label
              htmlFor="teacher-ranking-level"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Ranking Level
            </label>
            <select
              id="teacher-ranking-level"
              value={rankingLevel}
              onChange={(e) => setRankingLevel(e.target.value as RankingLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="NATIONAL">National Level</option>
              <option value="PROVINCIAL">Provincial Level</option>
              <option value="DISTRICT">District Level</option>
              <option value="ZONAL">Zonal Level</option>
              <option value="SCHOOL">School Level</option>
            </select>
          </div>

          {/* Student Type */}
          <div>
            <label
              htmlFor="teacher-student-type"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Student Type
            </label>
            <select
              id="teacher-student-type"
              value={studentTypeFilter}
              onChange={(e) =>
                setStudentTypeFilter(e.target.value as StudentType)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">All Students</option>
              <option value="INTERNAL">Internal Only</option>
              <option value="EXTERNAL">External Only</option>
            </select>
          </div>

          {/* District Filter */}
          <div>
            <label
              htmlFor="teacher-district-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              District
            </label>
            <select
              id="teacher-district-filter"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">All Districts</option>
              <option value="Colombo">Colombo</option>
              <option value="Gampaha">Gampaha</option>
              <option value="Kandy">Kandy</option>
            </select>
          </div>

          {/* Zone Filter */}
          <div>
            <label
              htmlFor="teacher-zone-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Zone
            </label>
            <select
              id="teacher-zone-filter"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">All Zones</option>
              <option value="Zone A">Zone A</option>
              <option value="Zone B">Zone B</option>
              <option value="Zone C">Zone C</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subject Rankings */}
      <div className="grid gap-6">
        {rankingsData &&
          rankingsData.rankings.map((subjectRanking, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    {subjectRanking.subject?.name || "Unknown"}
                    {subjectRanking.subject?.code && (
                      <Badge variant="outline" className="ml-2">
                        {subjectRanking.subject.code}
                      </Badge>
                    )}
                  </span>
                  <span className="text-sm font-normal text-gray-500">
                    Top {subjectRanking.rankings.length} Students
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Percentage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rankings
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {subjectRanking.rankings.map((student) => (
                        <tr
                          key={student.attemptId}
                          className={`hover:bg-muted/50 transition-colors ${
                            student.rank <= 3 ? "bg-yellow-50/30" : ""
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getRankIcon(student.rank)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-400">
                                {student.student.avatar ? (
                                  <Image
                                    src={student.student.avatar}
                                    alt={`${student.student.firstName} ${student.student.lastName}`}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-white" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {student.student.firstName}{" "}
                                  {student.student.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ID: {student.student.id.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <span className="font-bold text-blue-600">
                                {student.totalScore}
                              </span>
                              <span className="text-gray-500">
                                {" "}
                                / {student.maxScore}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              className={`${
                                student.percentage >= 75
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : student.percentage >= 50
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                    : "bg-red-100 text-red-800 border-red-200"
                              }`}
                            >
                              {student.percentage.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2 flex-wrap">
                              {student.nationalRank && (
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  National: #{student.nationalRank}
                                </Badge>
                              )}
                              {student.provincialRank && (
                                <Badge variant="outline" className="text-xs">
                                  Provincial: #{student.provincialRank}
                                </Badge>
                              )}
                              {student.districtRank && (
                                <Badge variant="outline" className="text-xs">
                                  District: #{student.districtRank}
                                </Badge>
                              )}
                              {student.zonalRank && (
                                <Badge variant="outline" className="text-xs">
                                  Zonal: #{student.zonalRank}
                                </Badge>
                              )}
                              {student.schoolRank && (
                                <Badge variant="outline" className="text-xs">
                                  School: #{student.schoolRank}
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {subjectRanking.totalPages && subjectRanking.totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <div className="text-sm text-gray-600">
                      Showing{" "}
                      {((subjectRanking.currentPage || 1) - 1) *
                        (subjectRanking.pageSize || 10) +
                        1}{" "}
                      to{" "}
                      {Math.min(
                        (subjectRanking.currentPage || 1) *
                          (subjectRanking.pageSize || 10),
                        subjectRanking.totalRankings || 0
                      )}{" "}
                      of {subjectRanking.totalRankings} results
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border rounded hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <div className="flex gap-1">
                        {Array.from(
                          { length: subjectRanking.totalPages },
                          (_, i) => i + 1
                        )
                          .filter((page) => {
                            // Show first, last, current, and pages around current
                            return (
                              page === 1 ||
                              page === subjectRanking.totalPages ||
                              Math.abs(page - currentPage) <= 1
                            );
                          })
                          .map((page, idx, arr) => {
                            // Add ellipsis
                            if (idx > 0 && page - arr[idx - 1] > 1) {
                              return [
                                <span
                                  key={`ellipsis-${page}`}
                                  className="px-2 py-1"
                                >
                                  ...
                                </span>,
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-3 py-1 text-sm border rounded ${
                                    currentPage === page
                                      ? "bg-blue-600 text-white"
                                      : "hover:bg-muted/50"
                                  }`}
                                >
                                  {page}
                                </button>,
                              ];
                            }
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 text-sm border rounded ${
                                  currentPage === page
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-muted/50"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                      </div>
                      <button
                        onClick={() =>
                          setCurrentPage(
                            Math.min(
                              subjectRanking.totalPages || 1,
                              currentPage + 1
                            )
                          )
                        }
                        disabled={currentPage === subjectRanking.totalPages}
                        className="px-3 py-1 text-sm border rounded hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
