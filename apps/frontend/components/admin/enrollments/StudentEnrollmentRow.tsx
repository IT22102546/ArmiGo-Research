"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  User,
  BookOpen,
  Video,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Award,
  TrendingUp,
} from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StudentEnrollmentSummary,
  ClassEnrollmentDetail,
  SeminarRegistrationDetail,
  ExamAttemptDetail,
  EnrollmentStatus,
  SeminarStatus,
  ExamAttemptStatus,
} from "@/lib/api/endpoints/enrollments";

interface StudentEnrollmentRowProps {
  data: StudentEnrollmentSummary;
  activeTab: "all" | "class" | "seminar" | "exam";
}

// Status badge styles
const getEnrollmentStatusBadge = (status: EnrollmentStatus) => {
  const styles: Record<EnrollmentStatus, string> = {
    ACTIVE: "bg-green-100 text-green-800 border-green-200",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    SUSPENDED: "bg-gray-100 text-gray-800 border-gray-200",
    WITHDRAWN: "bg-orange-100 text-orange-800 border-orange-200",
  };
  return (
    <Badge variant="outline" className={styles[status] || "bg-gray-100"}>
      {status}
    </Badge>
  );
};

const getSeminarStatusBadge = (status: SeminarStatus, attended: boolean) => {
  if (attended) {
    return (
      <Badge
        variant="outline"
        className="bg-green-100 text-green-800 border-green-200"
      >
        ATTENDED
      </Badge>
    );
  }
  const styles: Record<SeminarStatus, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200",
    LIVE: "bg-purple-100 text-purple-800 border-purple-200",
    COMPLETED: "bg-gray-100 text-gray-800 border-gray-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <Badge variant="outline" className={styles[status] || "bg-gray-100"}>
      {status}
    </Badge>
  );
};

const getExamStatusBadge = (status: ExamAttemptStatus, passed?: boolean) => {
  if (status === "GRADED" && passed !== undefined) {
    return (
      <Badge
        variant="outline"
        className={
          passed
            ? "bg-green-100 text-green-800 border-green-200"
            : "bg-red-100 text-red-800 border-red-200"
        }
      >
        {passed ? "PASSED" : "FAILED"}
      </Badge>
    );
  }
  const styles: Record<ExamAttemptStatus, string> = {
    STARTED: "bg-blue-100 text-blue-800 border-blue-200",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800 border-yellow-200",
    SUBMITTED: "bg-purple-100 text-purple-800 border-purple-200",
    GRADED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <Badge variant="outline" className={styles[status] || "bg-gray-100"}>
      {status}
    </Badge>
  );
};

// Class Enrollment Card
const ClassEnrollmentCard = ({
  enrollment,
}: {
  enrollment: ClassEnrollmentDetail;
}) => (
  <Card className="mb-2">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{enrollment.className}</div>
            <div className="text-sm text-muted-foreground">
              {enrollment.subjectName} • {enrollment.gradeName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-medium">Progress</div>
            <div className="flex items-center gap-2">
              <Progress value={enrollment.progress} className="w-20 h-2" />
              <span className="text-sm text-muted-foreground">
                {enrollment.progress}%
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {getEnrollmentStatusBadge(enrollment.status)}
            <Badge
              variant={enrollment.isPaid ? "default" : "destructive"}
              className="text-xs"
            >
              {enrollment.isPaid ? "Paid" : "Unpaid"}
            </Badge>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex gap-4">
        <span>Enrolled: {format(new Date(enrollment.enrolledAt), "PPp")}</span>
        {enrollment.completedAt && (
          <span>
            Completed: {format(new Date(enrollment.completedAt), "PPp")}
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);

// Seminar Registration Card
const SeminarRegistrationCard = ({
  registration,
}: {
  registration: SeminarRegistrationDetail;
}) => (
  <Card className="mb-2">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Video className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <div className="font-medium">{registration.seminarTitle}</div>
            <div className="text-sm text-muted-foreground">
              Scheduled: {format(new Date(registration.scheduledAt), "PPp")}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getSeminarStatusBadge(registration.status, registration.attended)}
        </div>
      </div>
      {registration.attended &&
        (registration.joinedAt || registration.leftAt) && (
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex gap-4">
            {registration.joinedAt && (
              <span>
                Joined: {format(new Date(registration.joinedAt), "p")}
              </span>
            )}
            {registration.leftAt && (
              <span>Left: {format(new Date(registration.leftAt), "p")}</span>
            )}
          </div>
        )}
    </CardContent>
  </Card>
);

// Exam Attempt Card
const ExamAttemptCard = ({ attempt }: { attempt: ExamAttemptDetail }) => (
  <Card className="mb-2">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <div className="font-medium">{attempt.examTitle}</div>
            <div className="text-sm text-muted-foreground">
              Attempt #{attempt.attemptNumber} • Started:{" "}
              {format(new Date(attempt.startedAt), "PPp")}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {attempt.totalScore !== undefined && (
            <div className="text-right">
              <div className="text-lg font-bold">
                {attempt.totalScore}/{attempt.maxScore}
              </div>
              <div className="text-sm text-muted-foreground">
                {attempt.percentage?.toFixed(1)}%
              </div>
            </div>
          )}
          {getExamStatusBadge(attempt.status, attempt.passed)}
        </div>
      </div>
      {(attempt.islandRank || attempt.districtRank || attempt.zoneRank) && (
        <div className="mt-3 pt-3 border-t flex gap-4">
          {attempt.islandRank && (
            <div className="flex items-center gap-1 text-sm">
              <Award className="h-4 w-4 text-yellow-500" />
              <span className="text-muted-foreground">Island:</span>
              <span className="font-medium">#{attempt.islandRank}</span>
            </div>
          )}
          {attempt.districtRank && (
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">District:</span>
              <span className="font-medium">#{attempt.districtRank}</span>
            </div>
          )}
          {attempt.zoneRank && (
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Zone:</span>
              <span className="font-medium">#{attempt.zoneRank}</span>
            </div>
          )}
        </div>
      )}
    </CardContent>
  </Card>
);

export function StudentEnrollmentRow({
  data,
  activeTab,
}: StudentEnrollmentRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    student,
    classEnrollments,
    seminarRegistrations,
    examAttempts,
    stats,
  } = data;

  // Calculate what to show based on active tab
  const showClasses = activeTab === "all" || activeTab === "class";
  const showSeminars = activeTab === "all" || activeTab === "seminar";
  const showExams = activeTab === "all" || activeTab === "exam";

  // Get count based on tab
  const getEnrollmentCount = () => {
    if (activeTab === "class") return stats.totalClassEnrollments;
    if (activeTab === "seminar") return stats.totalSeminarRegistrations;
    if (activeTab === "exam") return stats.totalExamAttempts;
    return (
      stats.totalClassEnrollments +
      stats.totalSeminarRegistrations +
      stats.totalExamAttempts
    );
  };

  // Get initials for avatar
  const initials =
    `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <TableRow className="hover:bg-muted/50 cursor-pointer">
        <TableCell className="w-[50px]">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={student.avatar}
                alt={`${student.firstName} ${student.lastName}`}
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {student.firstName} {student.lastName}
              </div>
              <div className="text-sm text-muted-foreground">
                {student.email}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <span>{stats.totalClassEnrollments}</span>
            <span className="text-xs text-muted-foreground">
              ({stats.activeClassEnrollments} active)
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-purple-500" />
            <span>{stats.totalSeminarRegistrations}</span>
            <span className="text-xs text-muted-foreground">
              ({stats.attendedSeminars} attended)
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-500" />
            <span>{stats.totalExamAttempts}</span>
            <span className="text-xs text-muted-foreground">
              ({stats.passedExams} passed)
            </span>
          </div>
        </TableCell>
        <TableCell className="text-right">
          <Badge variant="secondary" className="font-medium">
            {getEnrollmentCount()} Total
          </Badge>
        </TableCell>
      </TableRow>

      <CollapsibleContent asChild>
        <TableRow>
          <TableCell colSpan={6} className="p-0">
            <div className="bg-muted/30 p-4 border-b">
              {activeTab === "all" ? (
                <Tabs defaultValue="classes" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="classes" className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      Classes ({stats.totalClassEnrollments})
                    </TabsTrigger>
                    <TabsTrigger value="seminars" className="gap-2">
                      <Video className="h-4 w-4" />
                      Seminars ({stats.totalSeminarRegistrations})
                    </TabsTrigger>
                    <TabsTrigger value="exams" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Exams ({stats.totalExamAttempts})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="classes" className="mt-0">
                    {classEnrollments.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No class enrollments
                      </div>
                    ) : (
                      classEnrollments.map((enrollment) => (
                        <ClassEnrollmentCard
                          key={enrollment.id}
                          enrollment={enrollment}
                        />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="seminars" className="mt-0">
                    {seminarRegistrations.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No seminar registrations
                      </div>
                    ) : (
                      seminarRegistrations.map((registration) => (
                        <SeminarRegistrationCard
                          key={registration.id}
                          registration={registration}
                        />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="exams" className="mt-0">
                    {examAttempts.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No exam attempts
                      </div>
                    ) : (
                      examAttempts.map((attempt) => (
                        <ExamAttemptCard key={attempt.id} attempt={attempt} />
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div>
                  {activeTab === "class" && (
                    <>
                      {classEnrollments.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No class enrollments
                        </div>
                      ) : (
                        classEnrollments.map((enrollment) => (
                          <ClassEnrollmentCard
                            key={enrollment.id}
                            enrollment={enrollment}
                          />
                        ))
                      )}
                    </>
                  )}
                  {activeTab === "seminar" && (
                    <>
                      {seminarRegistrations.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No seminar registrations
                        </div>
                      ) : (
                        seminarRegistrations.map((registration) => (
                          <SeminarRegistrationCard
                            key={registration.id}
                            registration={registration}
                          />
                        ))
                      )}
                    </>
                  )}
                  {activeTab === "exam" && (
                    <>
                      {examAttempts.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No exam attempts
                        </div>
                      ) : (
                        examAttempts.map((attempt) => (
                          <ExamAttemptCard key={attempt.id} attempt={attempt} />
                        ))
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default StudentEnrollmentRow;
