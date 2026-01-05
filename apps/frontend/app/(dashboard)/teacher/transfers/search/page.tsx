"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { teacherTransferApi } from "@/lib/api/endpoints/teacher-transfers";
import type {
  TeacherTransferMatch,
  TeacherTransferRequest,
} from "@/lib/api/endpoints/teacher-transfers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  ArrowRight,
  Loader2,
  Filter,
  Grid3x3,
  List,
  Send,
} from "lucide-react";
import { handleApiError } from "@/lib/error-handling/api-error-handler";
import { toast } from "sonner";

const ZONES = [
  { value: "all", label: "All Zones" },
  { value: "colombo", label: "Colombo" },
  { value: "gampaha", label: "Gampaha" },
  { value: "kalutara", label: "Kalutara" },
  { value: "kandy", label: "Kandy" },
  { value: "matale", label: "Matale" },
  { value: "nuwara-eliya", label: "Nuwara Eliya" },
];

const SUBJECTS = [
  { value: "all", label: "All Subjects" },
  { value: "mathematics", label: "Mathematics" },
  { value: "science", label: "Science" },
  { value: "english", label: "English" },
  { value: "sinhala", label: "Sinhala" },
  { value: "tamil", label: "Tamil" },
  { value: "history", label: "History" },
  { value: "geography", label: "Geography" },
  { value: "ict", label: "ICT" },
  { value: "commerce", label: "Commerce" },
  { value: "accounting", label: "Accounting" },
];

const MEDIUMS = [
  { value: "all", label: "All Mediums" },
  { value: "sinhala", label: "Sinhala" },
  { value: "tamil", label: "Tamil" },
  { value: "english", label: "English" },
];

const LEVELS = [
  { value: "all", label: "All Levels" },
  { value: "ol", label: "O/L" },
  { value: "al", label: "A/L" },
];

const SCHOOL_TYPES = [
  { value: "all", label: "All Types" },
  { value: "1ab", label: "Type 1AB" },
  { value: "1c", label: "Type 1C" },
  { value: "2", label: "Type 2" },
  { value: "3", label: "Type 3" },
];

export default function TransferSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<TeacherTransferMatch[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<
    TeacherTransferMatch[]
  >([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMatches, setShowMatches] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    fromZone: "all",
    toZone: "all",
    subject: "all",
    medium: "all",
    level: "all",
    schoolType: "all",
    minYearsOfService: "",
    maxYearsOfService: "",
    searchTerm: "",
  });

  const [sortBy, setSortBy] = useState<
    "matchScore" | "yearsOfService" | "datePosted"
  >("matchScore");

  useEffect(() => {
    fetchMatches();
  }, [showMatches]);

  useEffect(() => {
    applyFilters();
  }, [matches, filters, sortBy]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const data = showMatches
        ? await teacherTransferApi.findMatches()
        : await teacherTransferApi.getAll();

      setMatches(Array.isArray(data) ? (data as any) : []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...matches];

    // Apply zone filters
    if (filters.fromZone !== "all") {
      filtered = filtered.filter(
        (m: any) =>
          m.fromZone === filters.fromZone || m.currentZone === filters.fromZone
      );
    }
    if (filters.toZone !== "all") {
      filtered = filtered.filter((m: any) => {
        const zones = m.toZones || m.desiredZones || [];
        return zones.includes(filters.toZone);
      });
    }

    // Apply subject filter
    if (filters.subject !== "all") {
      filtered = filtered.filter((m: any) => m.subject === filters.subject);
    }

    // Apply medium filter
    if (filters.medium !== "all") {
      filtered = filtered.filter((m) => m.medium === filters.medium);
    }

    // Apply level filter
    if (filters.level !== "all") {
      filtered = filtered.filter((m) => m.level === filters.level);
    }

    // Apply school type filter
    if (filters.schoolType !== "all") {
      filtered = filtered.filter(
        (m) => m.currentSchoolType === filters.schoolType
      );
    }

    // Apply years of service filters
    if (filters.minYearsOfService) {
      const min = parseInt(filters.minYearsOfService);
      filtered = filtered.filter((m) => (m.yearsOfService || 0) >= min);
    }
    if (filters.maxYearsOfService) {
      const max = parseInt(filters.maxYearsOfService);
      filtered = filtered.filter((m: any) => (m.yearsOfService || 0) <= max);
    }

    // Apply search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m: any) =>
          m.subject?.toLowerCase().includes(term) ||
          m.currentSchool?.toLowerCase().includes(term) ||
          m.fromZone?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case "matchScore":
          return (b.matchScore || 0) - (a.matchScore || 0);
        case "yearsOfService":
          return (b.yearsOfService || 0) - (a.yearsOfService || 0);
        case "datePosted":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredMatches(filtered);
  };

  const handleResetFilters = () => {
    setFilters({
      fromZone: "all",
      toZone: "all",
      subject: "all",
      medium: "all",
      level: "all",
      schoolType: "all",
      minYearsOfService: "",
      maxYearsOfService: "",
      searchTerm: "",
    });
  };

  const handleSendRequest = (matchId: string) => {
    toast.success("Request sent successfully!");
    // In real implementation, this would call an API
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-blue-600 bg-blue-50";
    if (score >= 40) return "text-yellow-600 bg-yellow-50";
    return "text-gray-600 bg-gray-50";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Search & Matches</h1>
            <p className="text-muted-foreground mt-1">
              Find compatible transfer opportunities
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={showMatches ? "default" : "outline"}
            onClick={() => setShowMatches(true)}
          >
            My Matches
          </Button>
          <Button
            variant={!showMatches ? "default" : "outline"}
            onClick={() => setShowMatches(false)}
          >
            Browse All
          </Button>
          <Button variant="outline" onClick={fetchMatches}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              <CardDescription>Refine your search criteria</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="searchTerm">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="searchTerm"
                placeholder="Search by subject, school, or zone..."
                value={filters.searchTerm}
                onChange={(e) =>
                  setFilters({ ...filters, searchTerm: e.target.value })
                }
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromZone">From Zone</Label>
              <Select
                value={filters.fromZone}
                onValueChange={(value) =>
                  setFilters({ ...filters, fromZone: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZONES.map((zone) => (
                    <SelectItem key={zone.value} value={zone.value}>
                      {zone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toZone">To Zone</Label>
              <Select
                value={filters.toZone}
                onValueChange={(value) =>
                  setFilters({ ...filters, toZone: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZONES.map((zone) => (
                    <SelectItem key={zone.value} value={zone.value}>
                      {zone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={filters.subject}
                onValueChange={(value) =>
                  setFilters({ ...filters, subject: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medium">Medium</Label>
              <Select
                value={filters.medium}
                onValueChange={(value) =>
                  setFilters({ ...filters, medium: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEDIUMS.map((medium) => (
                    <SelectItem key={medium.value} value={medium.value}>
                      {medium.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select
                value={filters.level}
                onValueChange={(value) =>
                  setFilters({ ...filters, level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolType">School Type</Label>
              <Select
                value={filters.schoolType}
                onValueChange={(value) =>
                  setFilters({ ...filters, schoolType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHOOL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Years of Service Range */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minYears">Min Years of Service</Label>
              <Input
                id="minYears"
                type="number"
                placeholder="Min years"
                value={filters.minYearsOfService}
                onChange={(e) =>
                  setFilters({ ...filters, minYearsOfService: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxYears">Max Years of Service</Label>
              <Input
                id="maxYears"
                type="number"
                placeholder="Max years"
                value={filters.maxYearsOfService}
                onChange={(e) =>
                  setFilters({ ...filters, maxYearsOfService: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredMatches.length} result
            {filteredMatches.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Label htmlFor="sortBy" className="text-sm">
              Sort by:
            </Label>
            <Select
              value={sortBy}
              onValueChange={(value: any) => setSortBy(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="matchScore">Match Score</SelectItem>
                <SelectItem value="yearsOfService">Years of Service</SelectItem>
                <SelectItem value="datePosted">Date Posted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredMatches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No matches found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your filters or browse all requests
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
          }
        >
          {filteredMatches.map((match: any) => (
            <Card
              key={match.id}
              className={`${
                highlightId === match.id ? "border-primary shadow-lg" : ""
              } hover:shadow-md transition-shadow`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{match.subject}</CardTitle>
                    <CardDescription className="mt-1">
                      {match.currentSchool || "School Name"}
                    </CardDescription>
                  </div>
                  {showMatches && match.matchScore !== undefined && (
                    <Badge
                      className={getMatchScoreColor(match.matchScore)}
                      variant="secondary"
                    >
                      {match.matchScore}% Match
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <span className="font-medium mr-2">From:</span>
                  <Badge variant="outline">
                    {match.fromZone || match.currentZone}
                  </Badge>
                </div>
                <div className="flex items-center text-sm">
                  <span className="font-medium mr-2">To:</span>
                  <div className="flex flex-wrap gap-1">
                    {(
                      (match as any).toZones ||
                      (match as any).desiredZones ||
                      []
                    ).map((zone: string) => (
                      <Badge key={zone} variant="secondary">
                        {zone}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>
                    <span className="font-medium">Medium:</span> {match.medium}
                  </span>
                  <span>
                    <span className="font-medium">Level:</span>{" "}
                    {match.level?.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Experience:</span>{" "}
                  {match.yearsOfService || 0} years
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      router.push(
                        `/teacher/transfers/requests?view=${match.id}`
                      )
                    }
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleSendRequest(match.id)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
