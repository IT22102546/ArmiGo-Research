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
  return <AnalyticsDashboard />;
}
