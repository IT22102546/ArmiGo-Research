"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Users,
  BookOpen,
  FileText,
  Calendar,
  DollarSign,
  Book,
  Search,
  Loader2,
  ArrowRight,
  Clock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface SearchResult {
  entity: string;
  results: SearchItem[];
  total: number;
}

interface SearchItem {
  id: string;
  name?: string;
  title?: string;
  email?: string;
  role?: string;
  subject?: string | { name: string };
  grade?: string | { name: string };
  batch?: string | { name: string; code?: string };
  _count?: Record<string, number>;
  startTime?: string;
  endTime?: string;
  totalMarks?: number;
  dayOfWeek?: number;
  teacher?: { firstName: string; lastName: string };
  currency?: string;
  amount?: number;
  status?: string;
  method?: string;
  user?: { firstName: string; lastName: string; email: string };
  author?: string;
  price?: number;
  downloads?: number;
  code?: string;
}

const entityIcons: Record<string, typeof Users> = {
  users: Users,
  classes: BookOpen,
  exams: FileText,
  timetables: Calendar,
  payments: DollarSign,
  publications: Book,
  subjects: BookOpen,
};

const entityRoutes: Record<string, (item: SearchItem) => string> = {
  users: (item) => `/admin/users/${item.id}`,
  classes: (item) => `/teacher/classes/${item.id}`,
  exams: (item) => `/teacher/exams/${item.id}`,
  timetables: () => `/student/timetable`,
  payments: (item) => `/admin/payments/${item.id}`,
  publications: (item) => `/student/publications/${item.id}`,
  subjects: (item) => `/admin/subjects/${item.id}`,
};

const RECENT_SEARCHES_KEY = "learnup_recent_searches";
const MAX_RECENT_SEARCHES = 5;

export function GlobalSearch() {
  const t = useTranslations("shared.globalSearch");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== searchQuery);
      const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }

      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!open) {
      setQuery("");
      setSelectedIndex(-1);
    }
  }, [open]);

  const { data: searchResults, isLoading } = useQuery<SearchResult[]>({
    queryKey: ["global-search", debouncedQuery],
    queryFn: () =>
      ApiClient.get("/search/global", {
        params: {
          q: debouncedQuery,
          limit: 5,
        },
      }),
    enabled: debouncedQuery.length >= 2,
  });

  // Flatten results for keyboard navigation
  const flatResults =
    searchResults?.flatMap((result) =>
      result.results.map((item) => ({ entity: result.entity, item }))
    ) || [];

  // Keyboard navigation within dialog
  useEffect(() => {
    if (!open) return;

    const handleNav = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const selected = flatResults[selectedIndex];
        if (selected) {
          handleSelect(selected.entity, selected.item);
        }
      }
    };

    document.addEventListener("keydown", handleNav);
    return () => document.removeEventListener("keydown", handleNav);
  }, [open, selectedIndex, flatResults]);

  const handleSelect = (entity: string, item: SearchItem) => {
    const route = entityRoutes[entity]?.(item);
    if (route) {
      saveRecentSearch(query);
      router.push(route);
      setOpen(false);
      setQuery("");
    }
  };

  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  const totalResults = searchResults?.reduce((sum, r) => sum + r.total, 0) || 0;

  // Entity labels with translations
  const getEntityLabel = (entity: string): string => {
    const labels: Record<string, string> = {
      users: t("entities.users"),
      classes: t("entities.classes"),
      exams: t("entities.exams"),
      timetables: t("entities.timetables"),
      payments: t("entities.payments"),
      publications: t("entities.publications"),
      subjects: t("entities.subjects"),
    };
    return labels[entity] || entity;
  };

  return (
    <>
      {/* Search Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="relative w-full md:w-64 justify-start gap-2 text-muted-foreground"
        aria-label={t("openSearch")}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="flex-1 text-left">{t("searchPlaceholder")}</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-muted border rounded font-mono">
          <span>⌘</span>
          <span>K</span>
        </kbd>
      </Button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="text-lg">{t("title")}</DialogTitle>
            <DialogDescription className="text-sm">
              {t("description")}
            </DialogDescription>
          </DialogHeader>

          <div className="px-4 pb-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                ref={inputRef}
                placeholder={t("typeToSearch")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10"
                aria-label={t("searchQuery")}
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setQuery("")}
                  aria-label={t("clearSearch")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              {isLoading && (
                <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          <div
            ref={resultsRef}
            className="max-h-[400px] overflow-y-auto border-t"
          >
            {/* Recent Searches */}
            {query.length === 0 && recentSearches.length > 0 && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    <span>{t("recentSearches")}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={clearRecentSearches}
                  >
                    {t("clear")}
                  </Button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors flex items-center gap-2"
                    >
                      <Search className="h-3 w-3 text-muted-foreground" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.length >= 2 && (
              <>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : totalResults === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">
                      {t("noResultsFor", { query })}
                    </p>
                    <p className="text-sm text-muted-foreground/80 mt-1">
                      {t("tryDifferentKeywords")}
                    </p>
                  </div>
                ) : (
                  <div className="py-2">
                    {searchResults?.map((result) => {
                      if (result.results.length === 0) return null;

                      const Icon = entityIcons[result.entity] || Search;

                      return (
                        <div key={result.entity} className="px-2 mb-3">
                          <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                            <Icon
                              className="h-4 w-4 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <span className="text-sm font-medium text-foreground">
                              {getEntityLabel(result.entity)}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {result.total}
                            </Badge>
                          </div>

                          <div className="space-y-0.5">
                            {result.results.map((item) => {
                              const flatIndex = flatResults.findIndex(
                                (r) =>
                                  r.entity === result.entity && r.item === item
                              );
                              const isSelected = flatIndex === selectedIndex;

                              return (
                                <button
                                  key={item.id}
                                  onClick={() =>
                                    handleSelect(result.entity, item)
                                  }
                                  className={cn(
                                    "w-full text-left px-3 py-2.5 rounded-md transition-colors group flex items-center justify-between",
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "hover:bg-muted"
                                  )}
                                >
                                  <div className="flex-1 min-w-0">
                                    {renderResultItem(
                                      result.entity,
                                      item,
                                      isSelected
                                    )}
                                  </div>
                                  <ArrowRight
                                    className={cn(
                                      "h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                                      isSelected
                                        ? "text-primary-foreground opacity-100"
                                        : "text-muted-foreground"
                                    )}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {query.length > 0 && query.length < 2 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Search className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                {t("typeMinCharacters")}
              </div>
            )}
          </div>

          {/* Footer with keyboard hints */}
          <div className="border-t px-4 py-2 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded">
                  ↑↓
                </kbd>
                {t("navigate")}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded">
                  ↵
                </kbd>
                {t("select")}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded">
                  esc
                </kbd>
                {t("close")}
              </span>
            </div>
            {totalResults > 0 && (
              <span>{t("resultsCount", { count: totalResults })}</span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function renderResultItem(
  entity: string,
  item: SearchItem,
  isSelected: boolean
) {
  const mutedClass = isSelected
    ? "text-primary-foreground/80"
    : "text-muted-foreground";
  const badgeVariant = isSelected ? "outline" : "secondary";

  // Helper to safely get subject name
  const getSubjectName = (
    subject: string | { name: string } | undefined
  ): string | null => {
    if (!subject) return null;
    if (typeof subject === "string") return subject;
    if (
      typeof subject === "object" &&
      "name" in subject &&
      typeof subject.name === "string"
    ) {
      return subject.name;
    }
    return null;
  };

  // Helper to safely get grade name
  const getGradeName = (
    grade: string | { name: string } | undefined
  ): string | null => {
    if (!grade) return null;
    if (typeof grade === "string") return grade;
    if (
      typeof grade === "object" &&
      "name" in grade &&
      typeof grade.name === "string"
    ) {
      return grade.name;
    }
    return null;
  };

  // Helper to safely get batch name
  const getBatchName = (
    batch: string | { name: string; code?: string } | undefined
  ): string | null => {
    if (!batch) return null;
    if (typeof batch === "string") return batch;
    if (
      typeof batch === "object" &&
      "name" in batch &&
      typeof batch.name === "string"
    ) {
      return batch.name;
    }
    return null;
  };

  const subjectName = getSubjectName(item.subject);
  const gradeName = getGradeName(item.grade);
  const batchName = getBatchName(item.batch);

  switch (entity) {
    case "users":
      return (
        <div>
          <p className="font-medium truncate">{item.name}</p>
          <p className={cn("text-sm truncate", mutedClass)}>{item.email}</p>
          {item.role && (
            <Badge variant={badgeVariant} className="text-xs mt-1">
              {item.role}
            </Badge>
          )}
        </div>
      );

    case "classes":
      return (
        <div>
          <p className="font-medium truncate">{item.name}</p>
          {subjectName && (
            <p className={cn("text-sm truncate", mutedClass)}>{subjectName}</p>
          )}
          <div className="flex gap-2 mt-1 flex-wrap">
            {gradeName && (
              <Badge variant={badgeVariant} className="text-xs">
                {gradeName}
              </Badge>
            )}
            {batchName && (
              <Badge variant={badgeVariant} className="text-xs">
                {batchName}
              </Badge>
            )}
            {item._count?.enrollments !== undefined && (
              <span className={cn("text-xs", mutedClass)}>
                {item._count.enrollments} students
              </span>
            )}
          </div>
        </div>
      );

    case "exams":
      return (
        <div>
          <p className="font-medium truncate">{item.title}</p>
          {subjectName && (
            <p className={cn("text-sm truncate", mutedClass)}>{subjectName}</p>
          )}
          <div className="flex gap-2 mt-1 flex-wrap">
            {item.startTime && (
              <span className={cn("text-xs", mutedClass)}>
                {new Date(item.startTime).toLocaleDateString()}
              </span>
            )}
            {item.totalMarks && (
              <Badge variant={badgeVariant} className="text-xs">
                {item.totalMarks} marks
              </Badge>
            )}
          </div>
        </div>
      );

    case "timetables":
      return (
        <div>
          <p className="font-medium truncate">{subjectName || "Class"}</p>
          <p className={cn("text-sm", mutedClass)}>
            Day {item.dayOfWeek} • {item.startTime} - {item.endTime}
          </p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {gradeName && (
              <Badge variant={badgeVariant} className="text-xs">
                {gradeName}
              </Badge>
            )}
            {item.teacher && (
              <span className={cn("text-xs", mutedClass)}>
                {item.teacher?.firstName || ""}{" "}
                {item.teacher?.lastName || "Unknown"}
              </span>
            )}
          </div>
        </div>
      );

    case "payments":
      return (
        <div>
          <p className="font-medium">
            {item.currency} {item.amount?.toFixed(2)}
          </p>
          {item.user && (
            <p className={cn("text-sm truncate", mutedClass)}>
              {item.user.firstName} {item.user.lastName} - {item.user.email}
            </p>
          )}
          <div className="flex gap-2 mt-1 flex-wrap">
            <Badge
              variant={
                item.status === "COMPLETED"
                  ? "default"
                  : item.status === "FAILED"
                    ? "destructive"
                    : "secondary"
              }
              className="text-xs"
            >
              {item.status}
            </Badge>
            <Badge variant={badgeVariant} className="text-xs">
              {item.method}
            </Badge>
          </div>
        </div>
      );

    case "publications":
      return (
        <div>
          <p className="font-medium truncate">{item.title}</p>
          {item.author && (
            <p className={cn("text-sm", mutedClass)}>by {item.author}</p>
          )}
          <div className="flex gap-2 mt-1 flex-wrap">
            {item.price && (
              <span
                className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-primary-foreground" : "text-green-600"
                )}
              >
                LKR {item.price.toFixed(2)}
              </span>
            )}
            {item.downloads !== undefined && item.downloads > 0 && (
              <span className={cn("text-xs", mutedClass)}>
                {item.downloads} downloads
              </span>
            )}
          </div>
        </div>
      );

    case "subjects":
      return (
        <div>
          <p className="font-medium truncate">{item.name}</p>
          {item.code && (
            <p className={cn("text-sm", mutedClass)}>Code: {item.code}</p>
          )}
          {item._count?.classes !== undefined && item._count.classes > 0 && (
            <span className={cn("text-xs", mutedClass)}>
              {item._count.classes} classes
            </span>
          )}
        </div>
      );

    default:
      return <p className="font-medium truncate">{item.name || item.title}</p>;
  }
}
