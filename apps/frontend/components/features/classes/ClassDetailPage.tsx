"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApiClient } from "@/lib/api/api-client";
import { classesApi } from "@/lib/api/endpoints/classes";
import { ClassSessionsPage } from "@/components/features/classes/ClassSessionsPage";
import { ClassEnrollmentsPage } from "@/components/features/classes/ClassEnrollmentsPage";
import { handleApiError } from "@/lib/error-handling";
import { format } from "date-fns";

const safeFormatDate = (value?: string | Date | null, fmt = "PP") => {
  if (!value) return "-";
  let d: Date;
  try {
    d = typeof value === "string" ? new Date(value) : (value as Date);
  } catch (e) {
    return "-";
  }
  if (!d || Number.isNaN(d.getTime())) return "-";
  try {
    return format(d, fmt);
  } catch (e) {
    return "-";
  }
};

export function ClassDetailPage({ classId }: { classId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("classes");
  const tc = useTranslations("common");
  const [classDetail, setClassDetail] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const pathname = usePathname();

  useEffect(() => {
    fetchClassDetail();
  }, [classId]);

  useEffect(() => {
    const subtabFromPath = pathname?.split("/")[4];
    if (
      subtabFromPath &&
      ["overview", "sessions", "enrollments"].includes(subtabFromPath)
    ) {
      setActiveTab(subtabFromPath);
      return;
    }
    const subtab = searchParams?.get("subtab");
    if (subtab && ["overview", "sessions", "enrollments"].includes(subtab)) {
      setActiveTab(subtab);
    }
  }, [searchParams, pathname]);

  useEffect(() => {
    // update path-based subtab when user switches tabs
    const newUrl =
      activeTab === "overview"
        ? `/admin/class-detail/${classId}`
        : `/admin/class-detail/${classId}/${activeTab}`;
    router.replace(newUrl);
  }, [activeTab, router]);

  const fetchClassDetail = async () => {
    try {
      const response = await classesApi.getById(classId);
      setClassDetail(response);
    } catch (err) {
      handleApiError(err, "ClassDetailPage", "Failed to fetch class detail");
    }
  };

  if (!classDetail) return <div className="py-8">{tc("loading")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">{classDetail.name}</h2>
          <p className="text-muted-foreground">
            {classDetail.subject?.name} - {classDetail.grade?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/admin/classes")}
          >
            {t("backToClasses")}
          </Button>
          <Button size="sm" onClick={() => setActiveTab("sessions")}>
            {t("openSessions")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("classOverview")}</CardTitle>
          <CardDescription>{t("classOverviewDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("teacher")}</p>
              <p className="font-medium">
                {classDetail.teacher?.firstName} {classDetail.teacher?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("startDate")}</p>
              <p className="font-medium">
                {safeFormatDate(classDetail.startDate, "PP")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("endDate")}</p>
              <p className="font-medium">
                {safeFormatDate(classDetail.endDate, "PP")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val)}>
        <TabsList>
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="sessions">{t("sessions")}</TabsTrigger>
          <TabsTrigger value="enrollments">{t("enrollments")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* We already displayed essential overview up top - add extra info here if needed */}
        </TabsContent>

        <TabsContent value="sessions">
          <ClassSessionsPage classId={classId} />
        </TabsContent>

        <TabsContent value="enrollments">
          <ClassEnrollmentsPage classId={classId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
