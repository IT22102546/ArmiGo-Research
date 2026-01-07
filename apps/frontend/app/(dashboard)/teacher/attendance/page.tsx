import { Suspense } from "react";
import AttendanceTracking from "@/components/features/attendance/AttendanceTracking";

export default function AttendancePage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<div>Loading...</div>}>
        <AttendanceTracking />
      </Suspense>
    </div>
  );
}

export const metadata = {
  title: "Attendance - LearnApp Platform",
  description: "Track and manage student attendance records",
};
