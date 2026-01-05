"use client";

import { useEffect, useState, Component, ReactNode } from "react";
import { asApiError } from "@/lib/error-handling";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApiClient } from "@/lib/api/api-client";
import { getDisplayName } from "@/lib/utils/display";
import { createLogger } from "@/lib/utils/logger";
import {
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  UserCheck,
  MapPin,
  Calendar,
  DollarSign,
  Target,
  Activity,
  UserPlus,
  Award,
} from "lucide-react";
import { BarChart } from "@/components/ui/chart/BarChart";
import { LineChart } from "@/components/ui/chart/LineChart";
import { DoughnutChart } from "@/components/ui/chart/DoughnutChart";

const logger = createLogger("EnrollmentManagement");

// Error Boundary to catch any rendering errors
class EnrollmentErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error("EnrollmentErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-800">Component Error</h3>
              <p className="text-red-600">
                An unexpected error occurred while rendering enrollment data.
                {this.state.error?.message && (
                  <span className="block mt-1 text-sm">
                    {this.state.error.message}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface EnrollmentStage {
  stage: string;
  count: number;
  percentage?: number;
  conversionRate?: number;
}

interface EnrollmentCohort {
  month: string;
  enrollments: number;
  retained: number;
  retentionRate: number;
  revenue: number;
}

interface CapacityPlanning {
  totalCapacity: number;
  currentEnrollment: number;
  utilization: number;
  availableSlots: number;
  projectedGrowth: number;
  recommendations: string[];
}

interface GeographicDistribution {
  province: string;
  districts: number;
  students: number;
  revenue: number;
}

interface DemographicBreakdown {
  category: string;
  label: string;
  count: number;
  percentage: number;
  revenue?: number;
}

interface PredictiveEnrollment {
  month: string;
  predicted: number;
  confidence: number;
}

interface EnrollmentAlert {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  count?: number;
}

interface PaymentEnrollment {
  totalRevenue: number;
  pendingAmount: number;
  successRate: number;
  averagePerStudent: number;
}

interface GradeStat {
  grade: string;
  enrolled: number;
  completed: number;
  retention?: number;
  attendance?: number;
}

interface EnrollmentStats {
  overview: {
    totalEnrolled: number;
    activeEnrollments: number;
    completedEnrollments: number;
    averageCompletionRate: number;
    monthOverMonthGrowth: number;
    yearOverYearGrowth: number;
  };
  funnel: EnrollmentStage[];
  cohorts: EnrollmentCohort[];
  capacityPlanning: CapacityPlanning[];
  healthMetrics: Array<{
    grade: string;
    totalStudents: number;
    avgAttendance?: number;
    examParticipation?: number;
    engagementScore?: number;
  }>;
  geographicDistribution: GeographicDistribution[];
  demographics: {
    byMedium: DemographicBreakdown[];
    byStudentType: DemographicBreakdown[];
    byAgeGroup: DemographicBreakdown[];
  };
  predictions: PredictiveEnrollment[];
  alerts: EnrollmentAlert[];
  paymentAnalytics: PaymentEnrollment;
  byGrade: GradeStat[];
  recentEnrollments: Array<{
    id: string;
    studentId: string;
    subjectId: string;
    createdAt: string;
    student: {
      name: string;
      email: string;
    };
    subject: {
      name: string;
      grade: number;
    };
  }>;
}

// Empty state constant to prevent null/undefined issues
const EMPTY_ENROLLMENT_STATS: EnrollmentStats = {
  overview: {
    totalEnrolled: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    averageCompletionRate: 0,
    monthOverMonthGrowth: 0,
    yearOverYearGrowth: 0,
  },
  funnel: [],
  cohorts: [],
  capacityPlanning: [],
  healthMetrics: [],
  geographicDistribution: [],
  demographics: {
    byMedium: [],
    byStudentType: [],
    byAgeGroup: [],
  },
  predictions: [],
  alerts: [],
  paymentAnalytics: {
    totalRevenue: 0,
    pendingAmount: 0,
    successRate: 0,
    averagePerStudent: 0,
  },
  byGrade: [],
  recentEnrollments: [],
};

function EnrollmentContent() {
  const [data, setData] = useState<EnrollmentStats>(EMPTY_ENROLLMENT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollmentData = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<EnrollmentStats>(
        "/admin/enrollment-stats/enhanced"
      );
      logger.debug("Enrollment data received:", response);
      setData(response);
      setError(null);
    } catch (err) {
      logger.error("Failed to fetch enrollment data:", err);
      logger.error("Error details:", {
        message: asApiError(err)?.message,
        response: asApiError(err)?.response?.data,
        status: asApiError(err)?.response?.status,
      });

      // Handle 404 as empty data instead of error to prevent NotFoundErrorBoundary
      if (
        asApiError(err)?.response?.status === 404 ||
        asApiError(err)?.message?.includes("not found")
      ) {
        logger.warn(
          "Enrollment endpoint returned 404, treating as empty dataset"
        );
        setData(EMPTY_ENROLLMENT_STATS);
        setError(null);
      } else {
        setError(
          `Failed to load enrollment analytics: ${asApiError(err)?.response?.data?.message || asApiError(err)?.message || "Unknown error"}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollmentData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchEnrollmentData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading enrollment analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <div>
            <h3 className="font-semibold text-red-800">Error Loading Data</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state message if no data but no error
  if (!data || data === EMPTY_ENROLLMENT_STATS) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-blue-500" />
          <div>
            <h3 className="font-semibold text-blue-800">No Data Available</h3>
            <p className="text-blue-600">
              No enrollment data found. This could mean no students have
              enrolled yet, or the data is still being processed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const {
    overview,
    funnel = [],
    cohorts = [],
    capacityPlanning = [],
    healthMetrics = [],
    geographicDistribution = [],
    demographics,
    predictions = [],
    alerts = [],
    paymentAnalytics,
    byGrade = [],
  } = data;

  // Funnel Chart Data
  const funnelChartData = {
    labels: funnel.map((stage: EnrollmentStage) => stage.stage),
    datasets: [
      {
        label: "Students",
        data: funnel.map((stage: EnrollmentStage) => stage.count),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(236, 72, 153, 0.8)",
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(16, 185, 129)",
          "rgb(245, 158, 11)",
          "rgb(139, 92, 246)",
          "rgb(236, 72, 153)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // Cohort Trend Data
  const cohortChartData = {
    labels: cohorts.map((c: EnrollmentCohort) => c.month),
    datasets: [
      {
        label: "Enrollments",
        data: cohorts.map((c: EnrollmentCohort) => c.enrollments),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
      {
        label: "Retained",
        data: cohorts.map((c: EnrollmentCohort) => c.retained),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
      },
    ],
  };

  // Predictive Enrollments Chart
  const predictiveChartData = {
    labels: predictions.map((p: PredictiveEnrollment) => p.month),
    datasets: [
      {
        label: "Predicted Enrollments",
        data: predictions.map((p: PredictiveEnrollment) => p.predicted),
        borderColor: "rgb(139, 92, 246)",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        borderDash: [5, 5],
        tension: 0.4,
      },
    ],
  };

  // Geographic Distribution Chart
  const geoChartData = {
    labels: geographicDistribution.slice(0, 8).map((g) => g.province),
    datasets: [
      {
        label: "Students by Province",
        data: geographicDistribution.slice(0, 8).map((g) => g.students),
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 2,
      },
    ],
  };

  // Demographics Doughnut (Student Type)
  const studentTypeDemographic = demographics?.byStudentType || [];
  const studentTypeChartData =
    studentTypeDemographic.length > 0
      ? {
          labels: studentTypeDemographic.map(
            (s: DemographicBreakdown) => s.label
          ),
          datasets: [
            {
              data: studentTypeDemographic.map(
                (s: DemographicBreakdown) => s.count
              ),
              backgroundColor: [
                "rgba(59, 130, 246, 0.8)",
                "rgba(16, 185, 129, 0.8)",
                "rgba(245, 158, 11, 0.8)",
              ],
              borderWidth: 2,
            },
          ],
        }
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">
          Student Enrollment Analytics
        </h1>
        <p className="text-blue-100">
          Comprehensive enrollment insights, funnel analysis, and predictive
          planning
        </p>
      </div>

      {/* Enrollment Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert: EnrollmentAlert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${
                alert.type === "critical"
                  ? "bg-red-50 border-red-200"
                  : alert.type === "warning"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  className={`h-5 w-5 mt-0.5 ${
                    alert.type === "critical"
                      ? "text-red-500"
                      : alert.type === "warning"
                        ? "text-yellow-500"
                        : "text-blue-500"
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{alert.title}</h3>
                    {alert.count && (
                      <Badge
                        variant={
                          alert.type === "critical"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {alert.count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {alert.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Enrollments
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overview?.totalEnrolled?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {overview?.activeEnrollments || 0} currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completion Rate
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overview?.averageCompletionRate?.toFixed(1) || 0}%
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Students completing programs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              MoM Growth
            </CardTitle>
            <UserCheck className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overview?.monthOverMonthGrowth?.toFixed(1) || 0}%
            </div>
            <p className="text-sm text-gray-500 mt-1">Month over month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              LKR {paymentAnalytics?.totalRevenue?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              LKR {paymentAnalytics?.pendingAmount?.toLocaleString() || 0}{" "}
              pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Funnel */}
      {funnel.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Enrollment Funnel
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Track student journey from registration to active learner
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <BarChart data={funnelChartData} height={300} />
              </div>
              <div className="space-y-3">
                {funnel.map((stage: EnrollmentStage, idx: number) => (
                  <div key={stage.stage} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{stage.stage}</h4>
                      <Badge variant="secondary">{stage.count}</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Stage %</span>
                        <span className="font-medium">
                          {(stage.percentage || 0).toFixed(1)}%
                        </span>
                      </div>
                      {idx > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Conversion</span>
                          <span
                            className={`font-medium ${
                              (stage.conversionRate || 0) >= 70
                                ? "text-green-600"
                                : (stage.conversionRate || 0) >= 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {(stage.conversionRate || 0).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capacity Planning */}
      {capacityPlanning && capacityPlanning.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              Capacity Planning & Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Capacity</p>
                  <p className="text-2xl font-bold">
                    {capacityPlanning[0]?.totalCapacity || 0}
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Current Enrollment
                  </p>
                  <p className="text-2xl font-bold">
                    {capacityPlanning[0]?.currentEnrollment || 0}
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Available Slots</p>
                  <p className="text-2xl font-bold text-green-600">
                    {capacityPlanning[0]?.availableSlots || 0}
                  </p>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="border rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium">Utilization Rate</p>
                    <Badge
                      variant={
                        (capacityPlanning[0]?.utilization || 0) >= 85
                          ? "destructive"
                          : (capacityPlanning[0]?.utilization || 0) >= 70
                            ? "secondary"
                            : "default"
                      }
                    >
                      {capacityPlanning[0]?.utilization?.toFixed(1) || 0}%
                    </Badge>
                  </div>
                  <div className="w-full bg-muted/80 rounded-full h-4 overflow-hidden">
                    {/* eslint-disable-next-line react/forbid-dom-props */}
                    <div
                      className={`h-full ${
                        (capacityPlanning[0]?.utilization || 0) >= 85
                          ? "bg-red-500"
                          : (capacityPlanning[0]?.utilization || 0) >= 70
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{
                        width: `${capacityPlanning[0]?.utilization || 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="border rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Projected Growth (3 months)
                  </p>
                  <p className="text-xl font-bold text-blue-600">
                    +{capacityPlanning[0]?.projectedGrowth || 0} students
                  </p>
                </div>
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {(capacityPlanning[0]?.recommendations || []).map(
                      (rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cohort Analysis & Predictive Enrollments */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Enrollment Cohorts
            </CardTitle>
            <p className="text-sm text-gray-500">
              Month-by-month retention tracking
            </p>
          </CardHeader>
          <CardContent>
            {cohorts && cohorts.length > 0 ? (
              <>
                <LineChart data={cohortChartData} height={250} />
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {cohorts.map((cohort: EnrollmentCohort, idx: number) => (
                    <div
                      key={cohort.month || idx}
                      className="flex justify-between text-sm border-b pb-2"
                    >
                      <span className="font-medium">{cohort.month}</span>
                      <div className="flex gap-4">
                        <span className="text-gray-600">
                          {cohort.enrollments} enrolled
                        </span>
                        <span className="text-green-600">
                          {cohort.retentionRate?.toFixed(1) || 0}% retained
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No cohort data available
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Predictive Enrollments
            </CardTitle>
            <p className="text-sm text-gray-500">Next 3 months forecast</p>
          </CardHeader>
          <CardContent>
            {predictions && predictions.length > 0 ? (
              <>
                <LineChart data={predictiveChartData} height={250} />
                <div className="mt-4 space-y-2">
                  {predictions.map(
                    (pred: PredictiveEnrollment, idx: number) => (
                      <div
                        key={pred.month || idx}
                        className="flex justify-between text-sm border-b pb-2"
                      >
                        <span className="font-medium">{pred.month}</span>
                        <div className="flex gap-4">
                          <span className="text-purple-600">
                            {pred.predicted} predicted
                          </span>
                          <Badge variant="outline">
                            {pred.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No predictive data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution & Demographics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              Geographic Distribution
            </CardTitle>
            <p className="text-sm text-gray-500">
              Top 8 provinces by enrollment
            </p>
          </CardHeader>
          <CardContent>
            {geographicDistribution.length > 0 ? (
              <>
                <BarChart data={geoChartData} height={250} />
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {geographicDistribution.map((geo) => (
                    <div
                      key={geo.province}
                      className="flex justify-between text-sm border-b pb-2"
                    >
                      <span className="font-medium">{geo.province}</span>
                      <div className="flex gap-4">
                        <span className="text-gray-600">
                          {geo.students} students
                        </span>
                        <span className="text-green-600">
                          LKR {geo.revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No geographic data available
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-500" />
              Student Demographics
            </CardTitle>
            <p className="text-sm text-gray-500">Student type distribution</p>
          </CardHeader>
          <CardContent>
            {studentTypeChartData && (
              <div className="flex justify-center mb-4">
                <DoughnutChart data={studentTypeChartData} height={250} />
              </div>
            )}
            <div className="space-y-3">
              {demographics?.byMedium && demographics.byMedium.length > 0 && (
                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold mb-2">By Medium</h4>
                  <div className="space-y-1">
                    {demographics.byMedium.map(
                      (demo: DemographicBreakdown, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">{demo.label}</span>
                          <div className="flex gap-3">
                            <span className="font-medium">{demo.count}</span>
                            <span className="text-gray-500">
                              {demo.percentage?.toFixed(1) || 0}%
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
              {demographics?.byStudentType &&
                demographics.byStudentType.length > 0 && (
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2">By Student Type</h4>
                    <div className="space-y-1">
                      {demographics.byStudentType.map(
                        (demo: DemographicBreakdown, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-600">{demo.label}</span>
                            <div className="flex gap-3">
                              <span className="font-medium">{demo.count}</span>
                              <span className="text-gray-500">
                                {demo.percentage?.toFixed(1) || 0}%
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              {demographics?.byAgeGroup &&
                demographics.byAgeGroup.length > 0 && (
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2">By Age Group</h4>
                    <div className="space-y-1">
                      {demographics.byAgeGroup.map(
                        (demo: DemographicBreakdown, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-600">{demo.label}</span>
                            <div className="flex gap-3">
                              <span className="font-medium">{demo.count}</span>
                              <span className="text-gray-500">
                                {demo.percentage?.toFixed(1) || 0}%
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade-wise Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Grade-wise Enrollment Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] table-fixed">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 w-[25%]">Grade</th>
                  <th className="text-right py-3 px-4 w-[18%]">Enrolled</th>
                  <th className="text-right py-3 px-4 w-[18%]">Completed</th>
                  <th className="text-right py-3 px-4 w-[18%]">Retention</th>
                  <th className="text-right py-3 px-4 w-[21%]">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {byGrade &&
                  byGrade.map((grade: GradeStat, idx: number) => (
                    <tr
                      key={grade.grade || idx}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="py-3 px-4 font-medium">
                        {getDisplayName(grade.grade)}
                      </td>
                      <td className="text-right py-3 px-4">{grade.enrolled}</td>
                      <td className="text-right py-3 px-4">
                        {grade.completed}
                      </td>
                      <td className="text-right py-3 px-4">
                        <Badge
                          variant={
                            (grade.retention || 0) >= 80
                              ? "default"
                              : (grade.retention || 0) >= 60
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {(grade.retention || 0).toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-4">
                        <Badge
                          variant={
                            (grade.attendance || 0) >= 75
                              ? "default"
                              : (grade.attendance || 0) >= 60
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {(grade.attendance || 0).toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Payment & Revenue Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                LKR {paymentAnalytics?.totalRevenue?.toLocaleString() || 0}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
              <p className="text-2xl font-bold text-yellow-600">
                LKR {paymentAnalytics?.pendingAmount?.toLocaleString() || 0}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {paymentAnalytics?.successRate?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Avg per Student</p>
              <p className="text-2xl font-bold">
                LKR {paymentAnalytics?.averagePerStudent?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollment Health Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            Enrollment Health Metrics by Grade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] table-fixed">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 w-[20%]">Grade</th>
                  <th className="text-right py-3 px-4 w-[15%]">Students</th>
                  <th className="text-right py-3 px-4 w-[20%]">
                    Avg Attendance
                  </th>
                  <th className="text-right py-3 px-4 w-[22%]">
                    Exam Participation
                  </th>
                  <th className="text-right py-3 px-4 w-[23%]">
                    Engagement Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {healthMetrics &&
                  healthMetrics.map((metric, idx: number) => (
                    <tr
                      key={metric.grade || idx}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="py-3 px-4 font-medium">
                        {getDisplayName(metric.grade)}
                      </td>
                      <td className="text-right py-3 px-4">
                        {metric.totalStudents}
                      </td>
                      <td className="text-right py-3 px-4">
                        <Badge
                          variant={
                            (metric.avgAttendance || 0) >= 75
                              ? "default"
                              : (metric.avgAttendance || 0) >= 60
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {metric.avgAttendance?.toFixed(1) || 0}%
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-4">
                        <Badge
                          variant={
                            (metric.examParticipation || 0) >= 80
                              ? "default"
                              : (metric.examParticipation || 0) >= 60
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {metric.examParticipation?.toFixed(1) || 0}%
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-4">
                        <Badge
                          variant={
                            (metric.engagementScore || 0) >= 75
                              ? "default"
                              : (metric.engagementScore || 0) >= 60
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {(metric.engagementScore || 0).toFixed(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export with error boundary wrapper
export default function EnrollmentManagement() {
  return (
    <EnrollmentErrorBoundary>
      <EnrollmentContent />
    </EnrollmentErrorBoundary>
  );
}
