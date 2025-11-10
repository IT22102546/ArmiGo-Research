"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  User,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  GraduationCap,
} from "lucide-react";
import {
  enrollmentsApi,
  AvailableClass,
  AvailableStudent,
  EnrollmentStatus,
  AvailableClassesForStudentResponse,
} from "@/lib/api/endpoints/enrollments";
import { toast } from "sonner";

interface CreateEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateEnrollmentDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateEnrollmentDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"student" | "class" | "confirm">("student");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] =
    useState<AvailableStudent | null>(null);
  const [selectedClass, setSelectedClass] = useState<AvailableClass | null>(
    null
  );
  const [enrollmentStatus, setEnrollmentStatus] =
    useState<EnrollmentStatus>("ACTIVE");
  const [isPaid, setIsPaid] = useState(false);

  // Fetch available students
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["available-students", studentSearch],
    queryFn: () => enrollmentsApi.getAvailableStudents(studentSearch),
    enabled: open && step === "student",
  });

  // Fetch available classes for the selected student
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ["available-classes-for-student", selectedStudent?.id],
    queryFn: () =>
      enrollmentsApi.getAvailableClassesForStudent(selectedStudent!.id),
    enabled: open && step === "class" && !!selectedStudent,
  });

  // Create enrollment mutation
  const createMutation = useMutation({
    mutationFn: enrollmentsApi.create,
    onSuccess: () => {
      toast.success("Enrollment created successfully");
      queryClient.invalidateQueries({ queryKey: ["enrollments-grouped"] });
      queryClient.invalidateQueries({ queryKey: ["available-classes"] });
      onOpenChange(false);
      onSuccess?.();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create enrollment");
    },
  });

  const resetForm = () => {
    setStep("student");
    setStudentSearch("");
    setSelectedStudent(null);
    setSelectedClass(null);
    setEnrollmentStatus("ACTIVE");
    setIsPaid(false);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleNext = () => {
    if (step === "student" && selectedStudent) {
      setStep("class");
    } else if (step === "class" && selectedClass) {
      setStep("confirm");
    }
  };

  const handleBack = () => {
    if (step === "class") {
      setStep("student");
    } else if (step === "confirm") {
      setStep("class");
    }
  };

  const handleCreate = () => {
    if (!selectedStudent || !selectedClass) return;

    createMutation.mutate({
      studentId: selectedStudent.id,
      classId: selectedClass.id,
      status: enrollmentStatus,
      isPaid,
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Create New Enrollment
          </DialogTitle>
          <DialogDescription>
            {step === "student" && "Step 1: Select a student to enroll"}
            {step === "class" && "Step 2: Select a class for the student"}
            {step === "confirm" && "Step 3: Confirm enrollment details"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === "student"
                ? "bg-primary text-primary-foreground"
                : selectedStudent
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {selectedStudent ? <CheckCircle className="h-4 w-4" /> : "1"}
          </div>
          <div className="flex-1 h-1 bg-muted rounded">
            <div
              className={`h-full rounded transition-all ${
                step !== "student" ? "bg-primary w-full" : "w-0"
              }`}
            />
          </div>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === "class"
                ? "bg-primary text-primary-foreground"
                : selectedClass
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {selectedClass ? <CheckCircle className="h-4 w-4" /> : "2"}
          </div>
          <div className="flex-1 h-1 bg-muted rounded">
            <div
              className={`h-full rounded transition-all ${
                step === "confirm" ? "bg-primary w-full" : "w-0"
              }`}
            />
          </div>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === "confirm"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            3
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Step 1: Select Student */}
          {step === "student" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name or email..."
                  className="pl-10"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>

              <ScrollArea className="h-[300px] pr-4">
                {studentsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : !students || students.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mb-2" />
                    <p>No students found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(students as AvailableStudent[]).map((student) => (
                      <div
                        key={student.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedStudent?.id === student.id
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50 hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedStudent(student)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student.avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(student.firstName, student.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {student.email || "No email"}
                          </div>
                        </div>
                        {student.grade && (
                          <Badge variant="secondary" className="shrink-0">
                            {student.grade.name}
                          </Badge>
                        )}
                        {selectedStudent?.id === student.id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Step 2: Select Class */}
          {step === "class" && (
            <div className="space-y-4">
              {selectedStudent && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedStudent.avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(
                        selectedStudent.firstName,
                        selectedStudent.lastName
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedStudent.email}
                    </div>
                  </div>
                  {selectedStudent.grade ? (
                    <Badge variant="outline" className="shrink-0">
                      {selectedStudent.grade.name}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="shrink-0">
                      No Grade
                    </Badge>
                  )}
                </div>
              )}

              {classesData?.studentGrade && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-sm">
                  <GraduationCap className="h-4 w-4" />
                  <span>
                    Showing available classes for{" "}
                    <strong>{classesData.studentGrade.name}</strong>
                  </span>
                </div>
              )}

              {classesData?.message && !classesData?.studentGrade && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-sm border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{classesData.message}</span>
                </div>
              )}

              <ScrollArea className="h-[260px] pr-4">
                {classesLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : !classesData?.classes ||
                  classesData.classes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mb-2" />
                    {classesData?.message ? (
                      <>
                        <p className="font-medium text-center">
                          {classesData.message}
                        </p>
                      </>
                    ) : !classesData?.studentGrade ? (
                      <>
                        <p className="font-medium">No grade assigned</p>
                        <p className="text-sm text-center mt-1">
                          Please assign a grade to this student before enrolling
                          in classes.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">No available classes</p>
                        <p className="text-sm text-center mt-1">
                          No active classes for {classesData.studentGrade.name},
                          or student is already enrolled in all available
                          classes.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(classesData.classes as AvailableClass[]).map(
                      (classItem) => (
                        <div
                          key={classItem.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedClass?.id === classItem.id
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/50 hover:bg-muted/50"
                          }`}
                          onClick={() => setSelectedClass(classItem)}
                        >
                          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{classItem.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {classItem.subject?.name || "No subject"}
                            </div>
                            {classItem.teacher && (
                              <div className="text-xs text-muted-foreground">
                                Teacher: {classItem.teacher.firstName}{" "}
                                {classItem.teacher.lastName}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                classItem.availableSlots === null ||
                                classItem.availableSlots > 5
                                  ? "secondary"
                                  : classItem.availableSlots > 0
                                    ? "outline"
                                    : "destructive"
                              }
                            >
                              {classItem.availableSlots === null
                                ? "Unlimited"
                                : `${classItem.availableSlots} slots`}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {classItem.enrolledCount} enrolled
                            </div>
                          </div>
                          {selectedClass?.id === classItem.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && selectedStudent && selectedClass && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="p-4 rounded-lg border bg-muted/30">
                <h4 className="font-medium mb-3">Enrollment Summary</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedStudent.avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(
                          selectedStudent.firstName,
                          selectedStudent.lastName
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Student
                      </div>
                      <div className="font-medium">
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Class</div>
                      <div className="font-medium">{selectedClass.name}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Enrollment Status</Label>
                  <Select
                    value={enrollmentStatus}
                    onValueChange={(value) =>
                      setEnrollmentStatus(value as EnrollmentStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label>Mark as Paid</Label>
                    <div className="text-sm text-muted-foreground">
                      The enrollment fee has been paid
                    </div>
                  </div>
                  <Switch checked={isPaid} onCheckedChange={setIsPaid} />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step !== "student" && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          {step !== "confirm" ? (
            <Button
              onClick={handleNext}
              disabled={
                (step === "student" && !selectedStudent) ||
                (step === "class" && !selectedClass)
              }
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="gap-2"
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create Enrollment
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateEnrollmentDialog;
