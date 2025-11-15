import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const TimetableManagement = dynamic(
  () =>
    import("@/components/features/timetable/TimetableManagement").then(
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

export default function Timetable() {
  return <TimetableManagement />;
}
