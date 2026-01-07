import { Suspense } from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AnalyticsDashboard = dynamic(
  () =>
    import("@/components/features/analytics/AnalyticsDashboard").then(
      (mod) => mod.default
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    ),
    ssr: false,
  }
);

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<LoadingSpinner />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  );
}

export const metadata = {
  title: "Analytics - LearnApp Platform",
  description:
    "analytics and reporting dashboard for administrators and teachers",
};
