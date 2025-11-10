import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { DatabaseUtilsService } from "@database/database-utils.service";
import { AppException } from "@/common/errors/app-exception";
import { ErrorCode } from "@/common/errors/error-codes.enum";
import { RoleHelper } from "../../shared/helpers/role.helper";
import { NotificationsService } from "../notifications/notifications.service";
import { ExamNotificationService } from "./exam-notification.service";
import {
  CreateExamDto,
  UpdateExamDto,
  CreateQuestionDto,
  StartExamDto,
  SubmitExamDto,
  ApproveExamDto,
  RejectExamDto,
  ExamPreviewDto,
  ExamSectionDto,
  QuestionGroupDto,
} from "./dto/exam.dto";
import {
  Exam,
  ExamStatus,
  ExamType,
  UserRole,
  AttemptStatus,
  EnrollmentStatus,
} from "@prisma/client";

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    private prisma: PrismaService,
    private dbUtils: DatabaseUtilsService,
    private notificationsService: NotificationsService,
    private examNotificationService: ExamNotificationService
  ) {}

  async create(createExamDto: CreateExamDto, teacherId: string): Promise<Exam> {
    // Verify the teacher exists and has permission
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw AppException.notFound(ErrorCode.TEACHER_NOT_FOUND);
    }

    if (
      !RoleHelper.isTeacher(teacher.role) &&
      !RoleHelper.isAdmin(teacher.role)
    ) {
      throw AppException.forbidden(ErrorCode.ONLY_TEACHERS_ADMINS_CAN_CREATE);
    }

    // Verify the class exists and teacher has access (if classId is provided)
    if (createExamDto.classId) {
      const classData = await this.prisma.class.findUnique({
        where: { id: createExamDto.classId },
      });

      if (!classData) {
        throw AppException.notFound(ErrorCode.CLASS_NOT_FOUND);
      }

      if (
        classData.teacherId !== teacherId &&
        !RoleHelper.isAdmin(teacher.role)
      ) {
        throw AppException.forbidden(ErrorCode.ONLY_OWN_CLASS_EXAMS);
      }
    }

    // FIX: Determine initial status based on user role
    // SECURITY: External teachers (contract/visiting) should have MORE restrictions, not less
    // Only admins can auto-approve exams. All teachers need approval.
    const initialStatus = ExamStatus.DRAFT;

    const initialApprovalStatus =
      teacher.role === UserRole.ADMIN || teacher.role === UserRole.SUPER_ADMIN
        ? "APPROVED"
        : "PENDING";

    // FIX: Validate exam time windows
    this.validateExamTiming(createExamDto);

    // Get subject, grade and medium from class if classId is provided
    const subject = "General";
    let subjectId: string | undefined;
    let gradeId: string | undefined;
    let mediumId: string | undefined;

    if (createExamDto.classId) {
      const classData = await this.prisma.class.findUnique({
        where: { id: createExamDto.classId },
        select: { subjectId: true, gradeId: true, mediumId: true },
      });
      if (classData) {
        // Use class's subjectId and gradeId if not provided in DTO
        subjectId = classData.subjectId || createExamDto.subjectId;
        gradeId = classData.gradeId || createExamDto.gradeId;
        mediumId = classData.mediumId || createExamDto.mediumId;
      }
    } else {
      // Use explicitly provided FK IDs
      subjectId = createExamDto.subjectId;
      gradeId = createExamDto.gradeId;
      mediumId = createExamDto.mediumId;
    }

    // Validate teacher's eligibility to create exams for this subject/grade/medium in the current academic year (teacher-only)
    if (
      RoleHelper.isTeacher(teacher.role) &&
      !RoleHelper.isAdmin(teacher.role)
    ) {
      // Need teacher profile for assignments
      const teacherWithProfile = await this.prisma.user.findUnique({
        where: { id: teacherId },
        include: { teacherProfile: true },
      });
      if (!teacherWithProfile?.teacherProfile) {
        throw AppException.badRequest(ErrorCode.TEACHER_PROFILE_NOT_FOUND);
      }

      if (teacherWithProfile.teacherProfile.isExternalTransferOnly) {
        throw AppException.forbidden(ErrorCode.EXTERNAL_TEACHER_RESTRICTION);
      }

      const currentAcademicYear = await this.prisma.academicYear.findFirst({
        where: { isCurrent: true },
      });
      const academicYearValue = currentAcademicYear?.year;
      if (!academicYearValue) {
        throw AppException.badRequest(ErrorCode.NO_CURRENT_ACADEMIC_YEAR);
      }

      const teacherAssignment =
        await this.prisma.teacherSubjectAssignment.findFirst({
          where: {
            teacherProfileId: teacherWithProfile.teacherProfile.id,
            subjectId: subjectId,
            gradeId: gradeId,
            mediumId: mediumId,
            academicYear: {
              year: academicYearValue,
            },
            isActive: true,
          },
        });

      if (!teacherAssignment) {
        throw AppException.forbidden(ErrorCode.TEACHER_NO_ACTIVE_ASSIGNMENT);
      }

      if (!teacherAssignment.canCreateExams) {
        throw AppException.forbidden(
          ErrorCode.FORBIDDEN,
          "Teacher is not authorized to create exams for this assignment"
        );
      }
    }

    // Create the exam
    const { grade, sections, rankingLevels, ...examDataWithoutGrade } =
      createExamDto;

    // Validate required FKs
    if (!subjectId) {
      throw AppException.badRequest(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Subject ID is required"
      );
    }
    if (!gradeId) {
      throw AppException.badRequest(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Grade ID is required"
      );
    }
    if (!mediumId) {
      throw AppException.badRequest(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Medium ID is required"
      );
    }

    const examData = {
      ...examDataWithoutGrade,
      classId: createExamDto.classId || null,
      startTime: new Date(createExamDto.startTime),
      endTime: new Date(createExamDto.endTime),
      status: initialStatus,
      approvalStatus: initialApprovalStatus as any,
      createdById: teacherId,
      subjectId: subjectId,
      gradeId: gradeId,
      mediumId: mediumId,
      // NOTE: rankingLevels is a relation and cannot be set during create()
      // It must be created separately after the exam is created
      useHierarchicalStructure: createExamDto.useHierarchicalStructure || false,
    };

    const exam = await this.prisma.exam.create({
      data: examData,
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        grade: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        medium: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    // Create sections if hierarchical structure is enabled
    if (
      createExamDto.useHierarchicalStructure &&
      createExamDto.sections &&
      createExamDto.sections.length > 0
    ) {
      await this.createExamSections(exam.id, createExamDto.sections);
    }

    return exam;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: ExamStatus,
    classId?: string,
    teacherId?: string
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (classId) {
      where.classId = classId;
    }
    if (teacherId) {
      // filter by class.teacherId via relation
      where.class = { teacherId };
    }

    const total = await this.prisma.exam.count({ where });
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const exams = await this.prisma.exam.findMany({
      where,
      skip,
      take: limit,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const data = exams.map((exam) => ({
      ...exam,
      questionCount: exam._count.questions,
      attemptCount: exam._count.attempts,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get all currently live exams (in progress)
   * An exam is considered "live" if:
   * - Status is ACTIVE or PUBLISHED
   * - Current time is between startTime and endTime
   */
  async getLiveExams(): Promise<any[]> {
    const now = new Date();

    const liveExams = await this.prisma.exam.findMany({
      where: {
        status: {
          in: [ExamStatus.ACTIVE, ExamStatus.PUBLISHED],
        },
        startTime: {
          lte: now,
        },
        endTime: {
          gte: now,
        },
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        grade: {
          select: {
            id: true,
            name: true,
          },
        },
        medium: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Get alert counts for each exam (from exam attempts with suspicious activity)
    const examsWithAlerts = await Promise.all(
      liveExams.map(async (exam) => {
        const alertCount = await this.prisma.examAttempt.count({
          where: {
            examId: exam.id,
            suspiciousActivityCount: {
              gt: 0,
            },
          },
        });

        return {
          ...exam,
          alertCount,
        };
      })
    );

    return examsWithAlerts;
  }

  async findOne(id: string): Promise<any> {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        grade: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        medium: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        sections: {
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            examPart: true,
            _count: {
              select: {
                questions: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
        questions: {
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
            sections: true,
          },
        },
      },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    // Options are already JSON type, no need to parse
    const questions = exam.questions.map((question) => ({
      ...question,
      options: question.options ?? null,
    }));

    return {
      ...exam,
      questions,
      questionCount: exam._count.questions,
      attemptCount: exam._count.attempts,
      sectionCount: exam._count.sections,
      creator: exam.creator,
    };
  }

  async update(
    id: string,
    updateExamDto: UpdateExamDto,
    userId: string
  ): Promise<Exam> {
    // Check if exam exists and user has permission
    const existingExam = await this.prisma.exam.findUnique({
      where: { id },
      include: { class: true },
    });

    if (!existingExam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND);
    }

    const isCreator = existingExam.createdById === userId;
    const isAdmin =
      RoleHelper.isAdmin(currentUser.role) ||
      currentUser.role === UserRole.SUPER_ADMIN;
    if (!isCreator && !isAdmin) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        "Only the exam creator or admin can update this exam"
      );
    }

    // Prepare update data
    const updateData: any = { ...updateExamDto };

    if (updateExamDto.startTime) {
      updateData.startTime = new Date(updateExamDto.startTime);
    }

    if (updateExamDto.endTime) {
      updateData.endTime = new Date(updateExamDto.endTime);
    }

    const updatedExam = await this.prisma.exam.update({
      where: { id },
      data: updateData,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    return updatedExam;
  }

  async remove(id: string, userId: string): Promise<void> {
    // Check if exam exists and user has permission
    const existingExam = await this.prisma.exam.findUnique({
      where: { id },
      include: { class: true },
    });

    if (!existingExam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND);
    }

    // Allow exam creator and admins to delete exams
    const isCreator = existingExam.createdById === userId;
    const isAdmin = RoleHelper.isAdmin(currentUser.role);
    const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

    if (!isCreator && !isAdmin && !isSuperAdmin) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        "Only the exam creator or admin can delete this exam"
      );
    }

    // Check if exam has attempts
    const attemptCount = await this.prisma.examAttempt.count({
      where: { examId: id },
    });

    if (attemptCount > 0) {
      // Soft delete using DatabaseUtilsService when exam has attempts
      await this.dbUtils.softDelete("Exam", id, userId);
    } else {
      // Hard delete if no attempts
      await this.prisma.exam.delete({
        where: { id },
      });
    }
  }

  async addQuestion(
    examId: string,
    createQuestionDto: CreateQuestionDto,
    userId: string
  ): Promise<any> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { class: true },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    // Check ownership
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND);
    }

    const isCreator = exam.createdById === userId;
    const isAdmin = RoleHelper.isAdmin(currentUser.role);
    const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

    if (!isCreator && !isAdmin && !isSuperAdmin) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        "Only the exam creator or admin can add questions to this exam"
      );
    }

    if (
      exam.status === ExamStatus.PUBLISHED ||
      exam.status === ExamStatus.CANCELLED
    ) {
      throw AppException.badRequest(
        ErrorCode.INVALID_EXAM_STATE,
        "Cannot add questions to published or cancelled exams"
      );
    }

    // Create question and update total marks in a transaction
    const [question] = await this.prisma.$transaction([
      this.prisma.examQuestion.create({
        data: {
          ...createQuestionDto,
          examId,
          options: JSON.stringify(createQuestionDto.options),
        },
      }),
      this.prisma.exam.update({
        where: { id: examId },
        data: {
          totalMarks: {
            increment: createQuestionDto.points,
          },
        },
      }),
    ]);

    return question;
  }

  async updateQuestion(
    questionId: string,
    updateData: Partial<CreateQuestionDto>,
    userId: string
  ): Promise<any> {
    const existingQuestion = await this.prisma.examQuestion.findUnique({
      where: { id: questionId },
      include: {
        exam: {
          include: { class: true },
        },
      },
    });

    if (!existingQuestion) {
      throw AppException.notFound(ErrorCode.QUESTION_NOT_FOUND);
    }

    // Check ownership
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND);
    }

    const isCreatorQuestion = existingQuestion.exam.createdById === userId;
    const isAdminQuestion =
      RoleHelper.isAdmin(currentUser.role) ||
      currentUser.role === UserRole.SUPER_ADMIN;
    if (!isCreatorQuestion && !isAdminQuestion) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        "Only the exam creator or admin can update this question"
      );
    }

    if (
      existingQuestion.exam.status === ExamStatus.PUBLISHED ||
      existingQuestion.exam.status === ExamStatus.CANCELLED
    ) {
      throw AppException.badRequest(
        ErrorCode.INVALID_EXAM_STATE,
        "Cannot update questions in published or cancelled exams"
      );
    }

    const updateQuestionData: any = { ...updateData };

    if (updateData.options) {
      updateQuestionData.options = JSON.stringify(updateData.options);
    }

    // Update question and adjust total marks if points changed - in a transaction
    if (updateData.points && updateData.points !== existingQuestion.points) {
      const pointsDifference = updateData.points - existingQuestion.points;

      const [updatedQuestion] = await this.prisma.$transaction([
        this.prisma.examQuestion.update({
          where: { id: questionId },
          data: updateQuestionData,
        }),
        this.prisma.exam.update({
          where: { id: existingQuestion.examId },
          data: {
            totalMarks: {
              increment: pointsDifference,
            },
          },
        }),
      ]);

      return updatedQuestion;
    }

    // No points change, simple update
    return this.prisma.examQuestion.update({
      where: { id: questionId },
      data: updateQuestionData,
    });
  }

  async removeQuestion(questionId: string, userId: string): Promise<void> {
    const existingQuestion = await this.prisma.examQuestion.findUnique({
      where: { id: questionId },
      include: {
        exam: {
          include: { class: true },
        },
      },
    });

    if (!existingQuestion) {
      throw AppException.notFound(ErrorCode.QUESTION_NOT_FOUND);
    }

    // Check ownership
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND);
    }

    const isCreatorRemove = existingQuestion.exam.createdById === userId;
    const isAdminRemove =
      RoleHelper.isAdmin(currentUser.role) ||
      currentUser.role === UserRole.SUPER_ADMIN;
    if (!isCreatorRemove && !isAdminRemove) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        "Only the exam creator or admin can remove this question"
      );
    }

    if (
      existingQuestion.exam.status === ExamStatus.PUBLISHED ||
      existingQuestion.exam.status === ExamStatus.CANCELLED
    ) {
      throw AppException.badRequest(
        ErrorCode.INVALID_EXAM_STATE,
        "Cannot remove questions from published or cancelled exams"
      );
    }

    // Delete question and update total marks in a transaction
    await this.prisma.$transaction([
      this.prisma.exam.update({
        where: { id: existingQuestion.examId },
        data: {
          totalMarks: {
            decrement: existingQuestion.points,
          },
        },
      }),
      this.prisma.examQuestion.delete({
        where: { id: questionId },
      }),
    ]);
  }

  async bulkAddQuestions(
    examId: string,
    questions: any[],
    userId: string
  ): Promise<any[]> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { class: true },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    // Check ownership
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND);
    }

    const isCreatorAdd = exam.createdById === userId;
    const isAdminAdd =
      RoleHelper.isAdmin(currentUser.role) ||
      currentUser.role === UserRole.SUPER_ADMIN;
    if (!isCreatorAdd && !isAdminAdd) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        "Only the exam creator or admin can add questions to this exam"
      );
    }

    if (
      exam.status === ExamStatus.PUBLISHED ||
      exam.status === ExamStatus.CANCELLED
    ) {
      throw AppException.badRequest(
        ErrorCode.INVALID_EXAM_STATE,
        "Cannot add questions to published or cancelled exams"
      );
    }

    // Calculate total points before transaction
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    // Create all questions AND update exam total marks in a single transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const createdQuestions = await Promise.all(
        questions.map(async (q) => {
          // Prepare question data based on type
          const questionData: any = {
            examId,
            type: q.type,
            question: q.question,
            order: q.order,
            points: q.points,
            examPart: q.examPart || 1,
            section: q.section,
            imageUrl: q.imageUrl,
            videoUrl: q.videoUrl,
            attachmentUrl: q.attachmentUrl,
            // Hierarchical properties
            sectionId: q.sectionId,
            groupId: q.groupId,
            showNumber: q.showNumber !== undefined ? q.showNumber : true,
            numbering: q.numbering,
          };

          // Store options as JSON (for backward compatibility)
          // and also create separate option records
          let optionsToCreate = [];
          if (q.options && Array.isArray(q.options)) {
            // Debug log to see what we're receiving
            this.logger.debug(
              `Received options for question: ${JSON.stringify(q.options)}`
            );

            questionData.options = JSON.stringify(q.options);
            const correctOption = q.options.find((opt: any) => opt.isCorrect);
            questionData.correctAnswer = correctOption?.text;

            // Prepare options for separate table
            optionsToCreate = q.options
              .map((opt: any, idx: number) => {
                // Handle both string and object formats
                const optionText =
                  typeof opt === "string"
                    ? opt
                    : opt.text || opt.optionText || "";

                // Skip if no text
                if (!optionText) {
                  this.logger.warn(
                    `Skipping option with no text at index ${idx}, received: ${JSON.stringify(opt)}`
                  );
                  return null;
                }

                const optionData: any = {
                  optionText,
                  isCorrect:
                    typeof opt === "object" ? opt.isCorrect || false : false,
                  order: idx,
                };

                // Only add imageUrl if it exists
                if (typeof opt === "object" && opt.imageUrl) {
                  optionData.imageUrl = opt.imageUrl;
                }

                return optionData;
              })
              .filter((opt: any) => opt !== null); // Remove null entries
          }

          // Handle option images
          if (q.optionImages && Array.isArray(q.optionImages)) {
            questionData.optionImages = JSON.stringify(q.optionImages);
          }

          // Handle matching pairs
          if (q.matchingPairs) {
            questionData.matchingPairs = JSON.stringify(q.matchingPairs);
          }

          // Handle question parts
          if (q.parts && Array.isArray(q.parts)) {
            questionData.parts = JSON.stringify(q.parts);
          }

          // Handle sub-questions
          if (q.subQuestions && Array.isArray(q.subQuestions)) {
            questionData.subQuestions = JSON.stringify(q.subQuestions);
          }

          // Handle fill-in-blank
          if (q.fillInBlankText) {
            questionData.question = q.fillInBlankText;
            questionData.correctAnswer = JSON.stringify(
              q.fillInBlankAnswers || []
            );
          }

          // Handle simple correct answer
          if (q.correctAnswer && !q.fillInBlankText) {
            questionData.correctAnswer = q.correctAnswer;
          }

          // Store options as JSON in the question itself
          if (optionsToCreate.length > 0) {
            questionData.options = optionsToCreate;
          }

          // Create the question
          const createdQuestion = await tx.examQuestion.create({
            data: questionData,
          });

          return createdQuestion;
        })
      );

      // Update exam total marks within the same transaction
      await tx.exam.update({
        where: { id: examId },
        data: {
          totalMarks: {
            increment: totalPoints,
          },
        },
      });

      return createdQuestions;
    });

    return result;
  }

  async reorderQuestions(
    examId: string,
    questionOrders: {
      questionId: string;
      newOrder: number;
      sectionId?: string;
      groupId?: string;
    }[],
    userId: string
  ): Promise<void> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { class: true },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    // Check ownership
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND);
    }

    const isCreatorReorder = exam.createdById === userId;
    const isAdminReorder =
      RoleHelper.isAdmin(currentUser.role) ||
      currentUser.role === UserRole.SUPER_ADMIN;
    if (!isCreatorReorder && !isAdminReorder) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        "Only the exam creator or admin can reorder questions"
      );
    }

    // Update all question orders in a transaction
    await this.prisma.$transaction(
      questionOrders.map(({ questionId, newOrder, sectionId, groupId }) =>
        this.prisma.examQuestion.update({
          where: { id: questionId },
          data: {
            order: newOrder,
            ...(sectionId && { sectionId }),
            ...(groupId && { groupId }),
          },
        })
      )
    );
  }

  async getQuestionsByPart(examId: string): Promise<any> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    const questions = await this.prisma.examQuestion.findMany({
      where: { examId },
      orderBy: { order: "asc" },
    });

    const part1 = questions.filter((q) => q.examPart === 1);
    const part2 = questions.filter((q) => q.examPart === 2);

    return {
      part1,
      part2,
      summary: {
        part1Count: part1.length,
        part2Count: part2.length,
        part1Points: part1.reduce((sum, q) => sum + Number(q.points), 0),
        part2Points: part2.reduce((sum, q) => sum + Number(q.points), 0),
      },
    };
  }

  async getQuestions(examId: string): Promise<any> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        title: true,
        useHierarchicalStructure: true,
        questions: {
          include: {
            examSection: {
              select: {
                id: true,
                title: true,
                order: true,
                examPart: true,
              },
            },
            questionGroup: {
              select: {
                id: true,
                title: true,
                order: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    if (!exam.useHierarchicalStructure) {
      // For non-hierarchical exams, return flat list
      return {
        examId: exam.id,
        examTitle: exam.title,
        useHierarchicalStructure: false,
        questions: exam.questions,
        totalCount: exam.questions.length,
      };
    }

    // For hierarchical exams, organize by section and group
    const groupedQuestions: any = {};

    exam.questions.forEach((question) => {
      const sectionId = question.sectionId || "no-section";
      const groupId = question.groupId || "no-group";

      if (!groupedQuestions[sectionId]) {
        groupedQuestions[sectionId] = {
          section: question.examSection,
          groups: {},
        };
      }

      if (!groupedQuestions[sectionId].groups[groupId]) {
        groupedQuestions[sectionId].groups[groupId] = {
          group: question.questionGroup,
          questions: [],
        };
      }

      groupedQuestions[sectionId].groups[groupId].questions.push(question);
    });

    return {
      examId: exam.id,
      examTitle: exam.title,
      useHierarchicalStructure: true,
      hierarchy: groupedQuestions,
      totalCount: exam.questions.length,
    };
  }

  async getQuestionsByPartHierarchical(examId: string): Promise<any> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        title: true,
        useHierarchicalStructure: true,
        questions: {
          include: {
            examSection: {
              select: {
                id: true,
                title: true,
                order: true,
                examPart: true,
              },
            },
            questionGroup: {
              select: {
                id: true,
                title: true,
                order: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    if (!exam.useHierarchicalStructure) {
      // For non-hierarchical exams, use old logic
      const part1 = exam.questions.filter((q) => q.examPart === 1);
      const part2 = exam.questions.filter((q) => q.examPart === 2);

      return {
        useHierarchicalStructure: false,
        part1,
        part2,
        summary: {
          part1Count: part1.length,
          part2Count: part2.length,
          part1Points: part1.reduce((sum, q) => sum + Number(q.points), 0),
          part2Points: part2.reduce((sum, q) => sum + Number(q.points), 0),
        },
      };
    }

    // For hierarchical exams, group by part then by section/group
    const result: any = {
      useHierarchicalStructure: true,
      examId: exam.id,
      examTitle: exam.title,
      parts: {},
      summary: {
        part1Count: 0,
        part2Count: 0,
        part1Points: 0,
        part2Points: 0,
      },
    };

    exam.questions.forEach((question) => {
      const part = question.examPart || 1;
      const partKey = `part${part}`;
      const sectionId = question.sectionId || "no-section";
      const groupId = question.groupId || "no-group";

      if (!result.parts[partKey]) {
        result.parts[partKey] = {
          sections: {},
        };
      }

      if (!result.parts[partKey].sections[sectionId]) {
        result.parts[partKey].sections[sectionId] = {
          section: question.examSection,
          groups: {},
        };
      }

      if (!result.parts[partKey].sections[sectionId].groups[groupId]) {
        result.parts[partKey].sections[sectionId].groups[groupId] = {
          group: question.questionGroup,
          questions: [],
        };
      }

      result.parts[partKey].sections[sectionId].groups[groupId].questions.push(
        question
      );

      // Update summary
      if (part === 1) {
        result.summary.part1Count++;
        result.summary.part1Points += Number(question.points);
      } else {
        result.summary.part2Count++;
        result.summary.part2Points += Number(question.points);
      }
    });

    return result;
  }

  async startExam(
    examId: string,
    studentId: string,
    startExamDto: StartExamDto
  ): Promise<any> {
    // Verify student is enrolled in the class
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        class: {
          include: {
            enrollments: {
              where: {
                studentId,
                status: EnrollmentStatus.ACTIVE,
              },
            },
          },
        },
        questions: {
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            type: true,
            question: true,
            options: true,
            points: true,
            order: true,
          },
        },
      },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    if (exam.class?.enrollments.length === 0) {
      throw AppException.forbidden(ErrorCode.NOT_ENROLLED_IN_CLASS);
    }

    if (exam.status !== ExamStatus.PUBLISHED) {
      throw AppException.badRequest(ErrorCode.EXAM_NOT_AVAILABLE);
    }

    const now = new Date();
    if (now < exam.startTime || now > exam.endTime) {
      throw AppException.badRequest(ErrorCode.EXAM_NOT_ACTIVE);
    }

    // Check existing attempts
    const existingAttempts = await this.prisma.examAttempt.count({
      where: {
        examId,
        studentId,
      },
    });

    if (existingAttempts >= exam.attemptsAllowed) {
      throw AppException.badRequest(ErrorCode.MAX_ATTEMPTS_EXCEEDED);
    }

    // Create new attempt
    const attempt = await this.prisma.examAttempt.create({
      data: {
        examId,
        studentId,
        attemptNumber: existingAttempts + 1,
        maxScore: exam.totalMarks,
        browserInfo: startExamDto.browserInfo,
        faceVerificationScore: startExamDto.faceVerificationData ? 1.0 : null,
        status: AttemptStatus.IN_PROGRESS,
      },
    });

    return {
      attempt,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        instructions: exam.instructions,
        aiMonitoringEnabled: exam.aiMonitoringEnabled,
        faceVerificationRequired: exam.faceVerificationRequired,
      },
      questions: exam.questions.map((q) => ({
        ...q,
        options: q.options ?? [],
      })),
    };
  }

  async submitExam(
    attemptId: string,
    submitExamDto: SubmitExamDto,
    userId: string
  ): Promise<any> {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      throw AppException.notFound(ErrorCode.EXAM_ATTEMPT_NOT_FOUND);
    }

    // Verify ownership
    if (attempt.studentId !== userId) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        "You can only submit your own exam attempts"
      );
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw AppException.badRequest(ErrorCode.EXAM_ATTEMPT_NOT_IN_PROGRESS);
    }

    // Calculate score
    let totalScore = 0;
    const responses: Array<{
      attemptId: string;
      questionId: string;
      answer: string;
      isCorrect: boolean;
      pointsAwarded: number;
      timeSpent: number;
    }> = [];

    for (const answer of submitExamDto.answers) {
      const question = attempt.exam.questions.find(
        (q) => q.id === answer.questionId
      );
      if (question) {
        const isCorrect = answer.selectedAnswer === question.correctAnswer;
        const score = isCorrect ? question.points : 0;
        totalScore += score;

        responses.push({
          attemptId,
          questionId: answer.questionId,
          answer: answer.selectedAnswer ?? "",
          isCorrect,
          pointsAwarded: score,
          timeSpent: answer.timeSpent,
        });
      }
    }

    // Use transaction to ensure atomicity: create answers + update attempt
    const percentage = (totalScore / attempt.maxScore) * 100;
    const passed = totalScore >= attempt.exam.passingMarks;

    const updatedAttempt = await this.prisma.$transaction(async (tx) => {
      // Create all answers
      await tx.examAnswer.createMany({
        data: responses,
      });

      // Update attempt with final score and status
      return await tx.examAttempt.update({
        where: { id: attemptId },
        data: {
          submittedAt: new Date(),
          timeSpent: submitExamDto.timeSpent,
          totalScore,
          percentage,
          passed,
          status: AttemptStatus.SUBMITTED,
          monitoringData: submitExamDto.monitoringEvents
            ? JSON.stringify(submitExamDto.monitoringEvents)
            : null,
        },
      });
    });

    // Auto-calculate rankings if enabled (async, don't wait)
    if (attempt?.exam?.enableRanking) {
      this.calculateRankings(attempt.examId).catch((error) => {
        this.logger.error("Failed to calculate rankings:", error);
      });
    }

    return {
      attempt: updatedAttempt,
      score: totalScore,
      maxScore: attempt?.maxScore ?? 0,
      percentage,
      passed,
    };
  }

  async getStudentExams(studentId: string): Promise<any[]> {
    // Optimized query: Get all published exams for student's enrolled classes in one query
    const exams = await this.prisma.exam.findMany({
      where: {
        status: ExamStatus.PUBLISHED,
        class: {
          enrollments: {
            some: {
              studentId,
              status: EnrollmentStatus.ACTIVE,
            },
          },
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
        attempts: {
          where: {
            studentId,
          },
          select: {
            id: true,
            attemptNumber: true,
            status: true,
            totalScore: true,
            maxScore: true,
            percentage: true,
            passed: true,
            startedAt: true,
            submittedAt: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return exams.map((exam) => ({
      ...exam,
      questionCount: exam._count.questions,
      attemptsUsed: exam.attempts.length,
    }));
  }

  async getExamResults(examId: string, teacherId: string): Promise<any> {
    // Verify teacher has access to this exam
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { class: true },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (
      exam.class?.teacherId !== teacherId &&
      teacher?.role !== UserRole.ADMIN
    ) {
      throw AppException.forbidden(ErrorCode.ACCESS_DENIED);
    }

    // Get all attempts for this exam
    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        examId,
        status: AttemptStatus.SUBMITTED,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        answers: {
          include: {
            question: {
              select: {
                question: true,
                correctAnswer: true,
                points: true,
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return {
      exam: {
        id: exam.id,
        title: exam.title,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
      },
      attempts,
      statistics: {
        totalAttempts: attempts.length,
        averageScore:
          attempts.length > 0
            ? attempts.reduce((sum, a) => sum + (a.totalScore || 0), 0) /
              attempts.length
            : 0,
        passRate:
          attempts.length > 0
            ? (attempts.filter((a) => a.passed).length / attempts.length) * 100
            : 0,
        highestScore:
          attempts.length > 0
            ? Math.max(...attempts.map((a) => a.totalScore || 0))
            : 0,
        lowestScore:
          attempts.length > 0
            ? Math.min(...attempts.map((a) => a.totalScore || 0))
            : 0,
      },
    };
  }

  async getTeacherExams(teacherId: string): Promise<any[]> {
    // Get all classes taught by this teacher
    const classes = await this.prisma.class.findMany({
      where: { teacherId },
      select: { id: true },
    });

    const classIds = classes.map((c) => c.id);

    // Get all exams for these classes
    const exams = await this.prisma.exam.findMany({
      where: {
        classId: {
          in: classIds,
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            grade: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return exams.map((exam) => ({
      ...exam,
      questionCount: exam._count.questions,
      attemptCount: exam._count.attempts,
    }));
  }

  async getGradesWithExamsForMarking(
    userId: string,
    userRole?: string
  ): Promise<any[]> {
    // If user is admin or super admin, get all exams with attempts
    if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
      const exams = await this.prisma.exam.findMany({
        where: {
          attempts: { some: {} }, // Has at least one attempt
        },
        include: {
          class: {
            select: {
              grade: { select: { id: true, name: true } },
            },
          },
          _count: {
            select: { attempts: true },
          },
        },
      });

      // Group by grade
      const gradesMap = new Map<string, any>();

      exams.forEach((exam) => {
        const gradeId = exam.class?.grade?.id;
        const gradeName = exam.class?.grade?.name;

        if (gradeId && gradeName) {
          if (!gradesMap.has(gradeId)) {
            gradesMap.set(gradeId, {
              id: gradeId,
              name: gradeName,
              exams: [],
            });
          }

          const grade = gradesMap.get(gradeId);
          grade.exams.push({
            id: exam.id,
            title: exam.title,
            totalMarks: exam.totalMarks,
            attemptCount: exam._count.attempts,
          });
        }
      });

      return Array.from(gradesMap.values()).filter(
        (grade) => grade.exams.length > 0
      );
    }

    // For teachers: get all classes taught by this teacher
    const classes = await this.prisma.class.findMany({
      where: { teacherId: userId },
      select: {
        id: true,
        gradeId: true,
        grade: { select: { id: true, name: true } },
      },
    });

    const classIds = classes.map((c) => c.id);

    if (classIds.length === 0) {
      return [];
    }

    // Get all exams for these classes that have attempts
    const exams = await this.prisma.exam.findMany({
      where: {
        classId: { in: classIds },
        attempts: { some: {} }, // Has at least one attempt
      },
      include: {
        class: {
          select: {
            grade: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { attempts: true },
        },
      },
    });

    // Group by grade
    const gradesMap = new Map<string, any>();

    classes.forEach((cls) => {
      if (!gradesMap.has(cls.gradeId)) {
        gradesMap.set(cls.gradeId, {
          id: cls.gradeId,
          name: cls.grade.name,
          exams: [],
        });
      }
    });

    // Add exams to their respective grades
    exams.forEach((exam) => {
      const gradeId = exam.class?.grade?.id;
      if (gradeId && gradesMap.has(gradeId)) {
        const grade = gradesMap.get(gradeId);
        grade.exams.push({
          id: exam.id,
          title: exam.title,
          totalMarks: exam.totalMarks,
          attemptCount: exam._count.attempts,
        });
      }
    });

    return Array.from(gradesMap.values()).filter(
      (grade) => grade.exams.length > 0
    );
  }

  async getExamsByGradeForMarking(
    gradeId: string,
    teacherId: string
  ): Promise<any[]> {
    // Get all classes for this grade taught by this teacher
    const classes = await this.prisma.class.findMany({
      where: {
        gradeId,
        teacherId,
      },
      select: { id: true },
    });

    const classIds = classes.map((c) => c.id);

    if (classIds.length === 0) {
      return [];
    }

    // Get exams for these classes with attempt counts
    const exams = await this.prisma.exam.findMany({
      where: {
        classId: { in: classIds },
      },
      include: {
        _count: {
          select: {
            attempts: true,
            questions: true,
          },
        },
        attempts: {
          select: { id: true, status: true },
          where: { status: "SUBMITTED" },
        },
      },
      orderBy: { startTime: "desc" },
    });

    return exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      duration: exam.duration,
      totalAttempts: exam._count.attempts,
      submittedAttempts: exam.attempts.length,
      questionCount: exam._count.questions,
      startTime: exam.startTime,
      endTime: exam.endTime,
    }));
  }

  async getStudentsForExamMarking(
    examId: string,
    teacherId: string
  ): Promise<any[]> {
    // Verify teacher owns this exam
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: {
        createdById: true,
        class: {
          select: {
            teacherId: true,
          },
        },
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    const isCreator = exam.createdById === teacherId;
    const isTeacher = exam.class?.teacherId === teacherId;

    if (!isCreator && !isTeacher) {
      throw AppException.forbidden(ErrorCode.ACCESS_DENIED);
    }

    // Get all student attempts for this exam
    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        examId,
        status: { in: ["SUBMITTED", "GRADED"] },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            studentProfile: {
              select: {
                grade: { select: { id: true, name: true } },
              },
            },
          },
        },
        answers: {
          select: { id: true },
          where: { pointsAwarded: { not: null } },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    const totalQuestions = exam._count.questions;

    return attempts.map((attempt) => ({
      id: attempt.id,
      studentId: attempt.studentId,
      student: {
        id: attempt.student.id,
        name: `${attempt.student.firstName} ${attempt.student.lastName}`,
        firstName: attempt.student.firstName,
        lastName: attempt.student.lastName,
        email: attempt.student.email,
        grade: attempt.student.studentProfile?.grade,
      },
      status: attempt.status,
      submittedAt: attempt.submittedAt,
      totalScore: attempt.totalScore,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      markedQuestions: attempt.answers.length,
      totalQuestions,
      markingProgress:
        totalQuestions > 0
          ? Math.round((attempt.answers.length / totalQuestions) * 100)
          : 0,
      passed: attempt.passed,
    }));
  }

  async publishExam(examId: string, userId: string): Promise<any> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        class: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    // Check ownership
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND);
    }

    const isCreatorPublish = exam.createdById === userId;
    const isAdminPublish =
      RoleHelper.isAdmin(currentUser.role) ||
      currentUser.role === UserRole.SUPER_ADMIN;
    if (!isCreatorPublish && !isAdminPublish) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        "Only the exam creator or admin can publish this exam"
      );
    }

    // Validate exam can be published
    if (exam.status === ExamStatus.PUBLISHED) {
      throw AppException.badRequest(
        ErrorCode.EXAM_ALREADY_SUBMITTED,
        "Exam is already published"
      );
    }

    if (exam.status === ExamStatus.CANCELLED) {
      throw AppException.badRequest(
        ErrorCode.INVALID_EXAM_STATE,
        "Cannot publish a cancelled exam"
      );
    }

    if (exam._count.questions === 0) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        "Cannot publish exam without questions. Please add at least one question."
      );
    }

    // Publish the exam
    const publishedExam = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        status: ExamStatus.PUBLISHED,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    // Schedule push notification reminders for enrolled students
    // Reminders will be sent at 5min, 15min, 30min, and 1hr before exam starts
    try {
      await this.examNotificationService.scheduleExamReminders(
        publishedExam.id,
        publishedExam.title,
        publishedExam.startTime,
        publishedExam.classId
      );
      this.logger.log(
        `📅 Scheduled exam reminders for exam: ${publishedExam.id}`
      );
    } catch (error) {
      // Don't fail the publish if notification scheduling fails
      this.logger.error(`Failed to schedule exam reminders: ${error}`);
    }

    return {
      ...publishedExam,
      questionCount: publishedExam._count.questions,
    };
  }

  async getExamAttempts(examId: string, userId: string): Promise<any[]> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { class: true },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    // Check ownership
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND);
    }

    const isCreatorViewAttempts = exam.createdById === userId;
    const isAdminViewAttempts =
      RoleHelper.isAdmin(currentUser.role) ||
      currentUser.role === UserRole.SUPER_ADMIN;
    if (!isCreatorViewAttempts && !isAdminViewAttempts) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        "Only the exam creator or admin can view exam attempts"
      );
    }

    // Get all attempts for this exam
    const attempts = await this.prisma.examAttempt.findMany({
      where: { examId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            studentProfile: {
              select: {
                grade: true,
                studentId: true,
              },
            },
          },
        },
        answers: {
          select: {
            id: true,
            answer: true,
            isCorrect: true,
            pointsAwarded: true,
            questionId: true,
          },
        },
      },
      orderBy: [{ submittedAt: "desc" }, { startedAt: "desc" }],
    });

    return attempts;
  }

  async getExamAttemptsWithFilters(
    examId: string,
    userId: string,
    filters: {
      grade?: string;
      status?: string;
      studentType?: string;
    }
  ): Promise<any[]> {
    const attempts = await this.getExamAttempts(examId, userId);

    return attempts.filter((attempt) => {
      if (filters.grade && attempt.student?.grade !== filters.grade) {
        return false;
      }
      if (filters.status && attempt.status !== filters.status) {
        return false;
      }
      if (
        filters.studentType &&
        attempt.student?.type !== filters.studentType
      ) {
        return false;
      }
      return true;
    });
  }

  async getAttemptById(attemptId: string, userId: string): Promise<any> {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!attempt) {
      throw AppException.notFound(ErrorCode.EXAM_ATTEMPT_NOT_FOUND);
    }

    // Check if user has access to view this attempt
    const exam = await this.prisma.exam.findUnique({
      where: { id: attempt.examId },
      select: { createdById: true },
    });

    if (exam?.createdById !== userId) {
      throw AppException.forbidden(ErrorCode.ACCESS_DENIED);
    }

    return attempt;
  }

  async getAttemptAnswers(attemptId: string, userId: string): Promise<any[]> {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      select: { examId: true },
    });

    if (!attempt) {
      throw AppException.notFound(ErrorCode.EXAM_ATTEMPT_NOT_FOUND);
    }

    // Check if user has access to view this attempt's answers
    const exam = await this.prisma.exam.findUnique({
      where: { id: attempt.examId },
      select: { createdById: true },
    });

    if (exam?.createdById !== userId) {
      throw AppException.forbidden(ErrorCode.ACCESS_DENIED);
    }

    const answers = await this.prisma.examAnswer.findMany({
      where: { attemptId },
      include: {
        question: true,
      },
    });

    return answers;
  }

  async getExamRankings(
    userId: string,
    userRole: UserRole,
    options: {
      subjectId?: string;
      limit?: number;
      page?: number;
      pageSize?: number;
      sortBy?: string;
      order?: "asc" | "desc";
    }
  ) {
    const {
      subjectId,
      limit = 100,
      page = 1,
      pageSize = 10,
      sortBy = "totalScore",
      order = "desc",
    } = options;

    // Map sortBy field names to actual database field names
    const sortFieldMap: { [key: string]: string } = {
      score: "totalScore",
      totalScore: "totalScore",
      percentage: "percentage",
      submittedAt: "submittedAt",
    };

    const actualSortBy = sortFieldMap[sortBy] || sortBy;

    // Check if user is admin or teacher
    const isAdmin = RoleHelper.isAdmin(userRole);
    const isTeacher = RoleHelper.isTeacher(userRole);

    if (!isAdmin && !isTeacher) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        "Only admins and teachers can view rankings"
      );
    }

    // Get teacher's subjects if teacher (classes they teach)
    let teacherclasses: string[] = [];
    let teacherStudentIds: string[] = [];
    if (isTeacher && !isAdmin) {
      const classes = await this.prisma.class.findMany({
        where: { teacherId: userId },
        select: { id: true, subject: true },
      });
      teacherclasses = classes.map((c) => c.id);

      // If teacher has no classes, return empty rankings
      if (teacherclasses.length === 0) {
        return {
          totalSubjects: 0,
          rankings: [],
          page,
          pageSize,
        };
      }

      // Get all students enrolled in teacher's classes
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          classId: { in: teacherclasses },
          status: { in: ["APPROVED", "ACTIVE"] },
        },
        select: { studentId: true },
      });
      teacherStudentIds = [...new Set(enrollments.map((e) => e.studentId))];
    }

    // Build where clause
    const whereClause: any = {
      status: {
        in: [AttemptStatus.SUBMITTED, AttemptStatus.GRADED],
      },
    };

    // Filter by subject if provided
    if (subjectId) {
      whereClause.exam = {
        class: {
          subject: subjectId,
        },
      };
    }

    // If teacher (not admin), filter by their classes
    if (isTeacher && !isAdmin && teacherclasses.length > 0) {
      // Teachers can see rankings for students in their classes
      whereClause.exam = {
        ...whereClause.exam,
        classId: {
          in: teacherclasses,
        },
      };
      // Additionally filter by students enrolled in their classes
      if (teacherStudentIds.length > 0) {
        whereClause.studentId = {
          in: teacherStudentIds,
        };
      }
    }

    // Get all completed exam attempts with student and class info
    const attempts = await this.prisma.examAttempt.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
            subject: true,
            classId: true,
          },
        },
      },
      orderBy: {
        [actualSortBy]: order,
      },
    });

    // Group by subject and calculate rankings
    const subjectRankings = new Map<string, any>();

    for (const attempt of attempts) {
      const subject = attempt.exam.subject;
      if (!subject) {
        continue;
      }

      const subjectName = subject.name || "General";

      if (!subjectRankings.has(subjectName)) {
        subjectRankings.set(subjectName, {
          subject: {
            name: subject.name,
            code: subject.code || subject.name,
          },
          rankings: [],
        });
      }

      const subjectData = subjectRankings.get(subjectName);

      // Check if student already exists in rankings
      const existingStudent = subjectData.rankings.find(
        (r: any) => r.student.id === attempt.studentId
      );

      // Only add if student doesn't exist or this score is better
      if (
        !existingStudent ||
        (attempt.totalScore && attempt.totalScore > existingStudent.totalScore)
      ) {
        if (existingStudent) {
          // Update existing with better score
          existingStudent.totalScore = attempt.totalScore;
          existingStudent.maxScore = attempt.maxScore;
          existingStudent.percentage = attempt.percentage;
          existingStudent.examId = attempt.examId;
          existingStudent.attemptId = attempt.id;
          existingStudent.submittedAt = attempt.submittedAt;
          existingStudent.islandRank = attempt.islandRank;
          existingStudent.districtRank = attempt.districtRank;
          existingStudent.zoneRank = attempt.zoneRank;
        } else {
          // Add new student
          subjectData.rankings.push({
            student: {
              id: attempt.student.id,
              firstName: attempt.student.firstName,
              lastName: attempt.student.lastName,
              avatar: attempt.student.avatar,
            },
            totalScore: attempt.totalScore,
            maxScore: attempt.maxScore,
            percentage: attempt.percentage,
            examId: attempt.examId,
            attemptId: attempt.id,
            submittedAt: attempt.submittedAt,
            islandRank: attempt.islandRank,
            districtRank: attempt.districtRank,
            zoneRank: attempt.zoneRank,
          });
        }
      }
    }

    // Sort rankings within each subject and limit
    const result = Array.from(subjectRankings.values()).map((data) => {
      // Sort by total score descending
      data.rankings.sort((a: any, b: any) => {
        const scoreA = a.totalScore || 0;
        const scoreB = b.totalScore || 0;
        if (order === "asc") {
          return scoreA - scoreB;
        }
        return scoreB - scoreA;
      });

      // Store total count before pagination
      const totalRankings = data.rankings.length;

      // Add rank numbers to all items first
      data.rankings = data.rankings.map((r: any, index: number) => ({
        ...r,
        rank: index + 1,
      }));

      // Apply limit if specified (for top N students)
      if (limit && limit < data.rankings.length) {
        data.rankings = data.rankings.slice(0, limit);
      }

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedRankings = data.rankings.slice(startIndex, endIndex);

      return {
        ...data,
        rankings: paginatedRankings,
        totalRankings,
        currentPage: page,
        pageSize,
        totalPages: Math.ceil(
          Math.min(limit || totalRankings, totalRankings) / pageSize
        ),
      };
    });

    return {
      totalSubjects: result.length,
      rankings: result,
      page,
      pageSize,
    };
  }

  async getPendingExams(): Promise<any[]> {
    const exams = await this.prisma.exam.findMany({
      where: {
        approvalStatus: "PENDING",
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return exams.map((exam) => ({
      ...exam,
      questionCount: exam._count.questions,
    }));
  }

  async approveExam(
    examId: string,
    adminId: string,
    dto?: ApproveExamDto
  ): Promise<any> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { class: true },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    if (exam.approvalStatus !== "PENDING") {
      throw AppException.badRequest(ErrorCode.EXAM_PENDING_APPROVAL);
    }

    // Update exam to approved status
    const updatedExam = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        approvalStatus: "APPROVED",
        status: ExamStatus.APPROVED,
        approvedById: adminId,
        approvedAt: new Date(),
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    // Send notification to teacher about approval
    if (exam.createdById) {
      await this.notificationsService.notifyAboutExam(
        exam.createdById,
        "approved",
        exam.title,
        "Your exam has been approved and will be published at the scheduled time"
      );
    }

    return {
      ...updatedExam,
      questionCount: updatedExam._count.questions,
      message:
        "Exam approved successfully. It will be automatically published at the scheduled start time.",
    };
  }

  async rejectExam(
    examId: string,
    adminId: string,
    dto: RejectExamDto
  ): Promise<any> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { class: true },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    if (exam.approvalStatus !== "PENDING") {
      throw AppException.badRequest(ErrorCode.EXAM_PENDING_APPROVAL);
    }

    // Update exam to rejected status
    const updatedExam = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        approvalStatus: "REJECTED",
        status: ExamStatus.CANCELLED,
        rejectionReason:
          dto.reason + (dto.feedback ? `\n\nFeedback: ${dto.feedback}` : ""),
        approvedById: adminId,
        approvedAt: new Date(),
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    // Send notification to the teacher about rejection with feedback
    if (exam.createdById) {
      await this.notificationsService.notifyAboutExam(
        exam.createdById,
        "rejected",
        exam.title,
        dto.reason
      );
    }

    return {
      ...updatedExam,
      questionCount: updatedExam._count.questions,
      message: `Exam rejected: ${dto.reason}`,
      feedback: dto.feedback,
      requestedChanges: dto.requestChanges,
    };
  }

  async getPendingApprovals(
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const [exams, total] = await Promise.all([
      this.prisma.exam.findMany({
        where: {
          approvalStatus: "PENDING",
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              subject: true,
            },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              questions: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      this.prisma.exam.count({
        where: {
          approvalStatus: "PENDING",
        },
      }),
    ]);

    return {
      exams: exams.map((exam) => ({
        ...exam,
        questionCount: exam._count.questions,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getExamPreview(examId: string): Promise<ExamPreviewDto> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        questions: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    const part1Questions = exam.questions.filter((q) => q.examPart === 1);
    const part2Questions = exam.questions.filter((q) => q.examPart === 2);

    return {
      exam,
      questions: exam.questions,
      questionCount: exam.questions.length,
      part1QuestionCount: part1Questions.length,
      part2QuestionCount: part2Questions.length,
      estimatedDuration: exam.duration,
    };
  }

  // ============================================
  // Ranking System
  // ============================================

  async calculateRankingsForExam(examId: string): Promise<void> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    if (!exam.enableRanking) {
      throw AppException.badRequest(ErrorCode.RANKING_NOT_ENABLED);
    }

    // Get all graded exam attempts with student information
    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        examId,
        status: AttemptStatus.GRADED,
      },
      include: {
        student: {
          include: {
            studentProfile: true,
          },
        },
      },
      orderBy: {
        totalScore: "desc",
      },
    });

    if (attempts.length === 0) {
      return; // No attempts to rank
    }

    // Calculate Island-level rankings (all students)
    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      const studentType =
        attempt.student.role === "INTERNAL_STUDENT" ? "INTERNAL" : "EXTERNAL";
      const district = attempt.student.districtId || null;
      const zone = null; // Zone not available in current schema

      await this.prisma.examRanking.upsert({
        where: {
          examId_studentId: {
            examId,
            studentId: attempt.studentId,
          },
        },
        create: {
          examId,
          studentId: attempt.studentId,
          score: attempt.totalScore ?? 0,
          percentage: attempt.percentage ?? 0,
          studentType,
          district,
          zone,
          islandRank: i + 1,
          totalIsland: attempts.length,
          calculatedAt: new Date(),
        },
        update: {
          score: attempt.totalScore ?? 0,
          percentage: attempt.percentage ?? 0,
          studentType,
          district,
          zone,
          islandRank: i + 1,
          totalIsland: attempts.length,
          calculatedAt: new Date(),
        },
      });
    }

    // Calculate District-level rankings
    const districts = [
      ...new Set(attempts.map((a) => a.student.districtId).filter(Boolean)),
    ];

    for (const district of districts) {
      const districtAttempts = attempts.filter(
        (a) => a.student.districtId === district
      );

      for (let i = 0; i < districtAttempts.length; i++) {
        await this.prisma.examRanking.update({
          where: {
            examId_studentId: {
              examId,
              studentId: districtAttempts[i].studentId,
            },
          },
          data: {
            districtRank: i + 1,
            totalDistrict: districtAttempts.length,
          },
        });
      }
    }

    // Zone-level rankings not yet implemented (requires zone data)
    await this.prisma.examRanking.updateMany({
      where: { examId },
      data: {
        zoneRank: null,
        totalZone: null,
      },
    });
  }

  async getRankings(
    examId: string,
    filters: {
      level?: "ISLAND" | "DISTRICT" | "ZONE";
      studentType?: "INTERNAL" | "EXTERNAL";
      district?: string;
      zone?: string;
    }
  ): Promise<any> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    if (!exam.enableRanking) {
      throw AppException.badRequest(ErrorCode.RANKING_NOT_ENABLED);
    }

    const where: any = { examId };

    if (filters.studentType) {
      where.studentType = filters.studentType;
    }

    if (filters.district) {
      where.district = filters.district;
    }

    if (filters.zone) {
      where.zone = filters.zone;
    }

    const rankings = await this.prisma.examRanking.findMany({
      where,
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            totalMarks: true,
          },
        },
      },
      orderBy:
        filters.level === "DISTRICT"
          ? { districtRank: "asc" }
          : filters.level === "ZONE"
            ? { zoneRank: "asc" }
            : { islandRank: "asc" },
    });

    // Fetch student details for each ranking
    const rankingsWithStudents = await Promise.all(
      rankings.map(async (ranking) => {
        const student = await this.prisma.user.findUnique({
          where: { id: ranking.studentId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentProfile: {
              select: {
                studentId: true,
                grade: true,
              },
            },
          },
        });

        return {
          ...ranking,
          student,
        };
      })
    );

    return {
      rankings: rankingsWithStudents,
      filters,
      summary: {
        totalRanked: rankings.length,
        level: filters.level || "ISLAND",
      },
    };
  }

  // Ranking visibility management (stored in allowedResources JSON string)
  async getRankingVisibility(examId: string): Promise<{ visible: boolean }> {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    let visible = false;
    try {
      if (exam.allowedResources) {
        const settings = JSON.parse(exam.allowedResources);
        visible = !!settings.rankingsVisible;
      }
    } catch (e) {
      visible = false;
    }

    return { visible };
  }

  async updateRankingVisibility(
    examId: string,
    visible: boolean,
    adminId: string
  ) {
    // Only admins can change ranking visibility
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin) {
      throw AppException.forbidden(
        ErrorCode.ONLY_ADMINS_CAN_PERFORM,
        "Only admins can update ranking visibility"
      );
    }

    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    let settings: any = {};
    try {
      if (exam.allowedResources) {
        settings = JSON.parse(exam.allowedResources);
      }
    } catch (e) {
      settings = {};
    }

    settings.rankingsVisible = !!visible;

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: { allowedResources: JSON.stringify(settings) },
    });

    return { success: true, exam: updated };
  }

  async exportRankings(
    examId: string,
    opts: { format?: "csv" | "pdf"; level?: string; studentType?: string }
  ) {
    const { level, studentType } = opts;
    const data = await this.getRankings(examId, {
      level: level as any,
      studentType: studentType as any,
    });

    if (!data.rankings || data.rankings.length === 0) {
      return { data: "", type: "text/csv" };
    }

    // Build CSV
    const headers = [
      "Rank",
      "StudentId",
      "StudentName",
      "Score",
      "Percentage",
      "District",
      "Zone",
      "StudentType",
    ];
    const rows = data.rankings.map((r: any) => {
      const student = r.student || {};
      const name =
        `${student.firstName || ""} ${student.lastName || ""}`.trim();
      return [
        r.islandRank || r.rank,
        r.studentId,
        name,
        r.score,
        r.percentage,
        r.district || "",
        r.zone || "",
        r.studentType,
      ];
    });

    const csv = [
      headers.join(","),
      ...rows.map((r: any) =>
        r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return { data: csv, type: "text/csv" };
  }

  async duplicateExam(examId: string, adminId: string): Promise<Exam> {
    // Verify admin permissions
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || !RoleHelper.isAdmin(admin.role)) {
      throw AppException.forbidden(
        ErrorCode.ONLY_ADMINS_CAN_PERFORM,
        "Only admins can duplicate exams"
      );
    }

    // Fetch the original exam with all questions
    const originalExam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: true,
      },
    });

    if (!originalExam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    // Create duplicated exam
    const duplicatedExam = await this.prisma.exam.create({
      data: {
        title: `${originalExam.title} (Copy)`,
        description: originalExam.description,
        type: originalExam.type,
        status: ExamStatus.DRAFT,
        approvalStatus: "PENDING",
        duration: originalExam.duration,
        totalMarks: originalExam.totalMarks,
        passingMarks: originalExam.passingMarks,
        attemptsAllowed: originalExam.attemptsAllowed,
        startTime: originalExam.startTime,
        endTime: originalExam.endTime,
        windowStart: originalExam.windowStart,
        windowEnd: originalExam.windowEnd,
        aiMonitoringEnabled: originalExam.aiMonitoringEnabled,
        faceVerificationRequired: originalExam.faceVerificationRequired,
        browseLockEnabled: originalExam.browseLockEnabled,
        classId: originalExam.classId,
        subjectId: originalExam.subjectId,
        gradeId: originalExam.gradeId,
        mediumId: originalExam.mediumId,
        createdById: adminId,
        questions: {
          create: originalExam.questions.map((q: any) => ({
            question: q.question,
            type: q.type,
            points: q.points,
            examPart: q.examPart,
            order: q.order,
            options: q.options,
            correctAnswer: q.correctAnswer,
            section: q.section,
          })),
        },
      },
      include: {
        questions: true,
        grade: true,
        subject: true,
        medium: true,
        class: true,
        creator: true,
      },
    });

    return duplicatedExam;
  }

  async updateVisibility(
    examId: string,
    visibility: string,
    adminId: string
  ): Promise<Exam> {
    // Verify admin permissions
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || !RoleHelper.isAdmin(admin.role)) {
      throw AppException.forbidden(
        ErrorCode.ONLY_ADMINS_CAN_PERFORM,
        "Only admins can update exam visibility"
      );
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    // Update visibility (stored in a custom field or metadata)
    // Since visibility is not in the current schema, we'll store it in description or a JSON field
    // For now, we'll just return the exam - you may need to add a visibility field to schema
    const updatedExam = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        // visibility: visibility, // Add this field to schema if needed
        updatedAt: new Date(),
      },
      include: {
        grade: true,
        subject: true,
        medium: true,
        class: true,
        creator: true,
      },
    });

    return updatedExam;
  }

  async forceCloseExam(
    examId: string,
    adminId: string,
    reason?: string
  ): Promise<Exam> {
    // Verify admin permissions
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || !RoleHelper.isAdmin(admin.role)) {
      throw AppException.forbidden(
        ErrorCode.ONLY_ADMINS_CAN_PERFORM,
        "Only admins can force close exams"
      );
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    if (exam.status !== ExamStatus.ACTIVE) {
      throw AppException.badRequest(
        ErrorCode.INVALID_EXAM_STATE,
        "Only active exams can be force closed"
      );
    }

    // End all ongoing attempts
    await this.prisma.examAttempt.updateMany({
      where: {
        examId: examId,
        status: AttemptStatus.IN_PROGRESS,
      },
      data: {
        status: AttemptStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });

    // Update exam status to completed
    const updatedExam = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        status: ExamStatus.COMPLETED,
        updatedAt: new Date(),
      },
      include: {
        grade: true,
        subject: true,
        medium: true,
        class: true,
        creator: true,
      },
    });

    // Calculate rankings if not already done
    await this.calculateRankings(examId);

    return updatedExam;
  }

  /**
   * Validates exam timing to prevent conflicting configurations
   * CRITICAL: Ensures that windowed exams and strict-time exams are mutually exclusive
   */
  private validateExamTiming(examDto: CreateExamDto | UpdateExamDto): void {
    // Only validate if both required fields are present
    if (!examDto.startTime || !examDto.endTime) {
      return; // Skip validation for partial updates
    }

    const startTime = new Date(examDto.startTime);
    const endTime = new Date(examDto.endTime);

    // Basic time validation
    if (endTime <= startTime) {
      throw AppException.badRequest(ErrorCode.EXAM_END_BEFORE_START);
    }

    // Check if this is a windowed exam or strict-time exam
    const windowStart = (examDto as any).windowStart;
    const windowEnd = (examDto as any).windowEnd;
    const isWindowedExam = windowStart && windowEnd;
    const isStrictTimeExam = !windowStart && !windowEnd;

    if (isWindowedExam) {
      // WINDOWED EXAM: Flexible timing within a window
      const windowStartDate = new Date(windowStart);
      const windowEndDate = new Date(windowEnd);

      // Validate window times
      if (windowEndDate <= windowStartDate) {
        throw AppException.badRequest(ErrorCode.WINDOW_END_BEFORE_START);
      }

      if (windowStartDate < startTime) {
        throw AppException.badRequest(ErrorCode.WINDOW_START_BEFORE_EXAM);
      }

      if (windowEndDate > endTime) {
        throw AppException.badRequest(ErrorCode.WINDOW_END_AFTER_EXAM);
      }

      // CRITICAL: For windowed exams, ensure duration fits within any point in the window
      if (examDto.duration) {
        const examDurationMs = examDto.duration * 60 * 1000;
        const windowDurationMs =
          windowEndDate.getTime() - windowStartDate.getTime();

        if (examDurationMs > windowDurationMs) {
          throw AppException.badRequest(
            ErrorCode.EXAM_DURATION_EXCEEDS_WINDOW,
            `Exam duration (${examDto.duration} minutes) exceeds the flexible window duration`
          );
        }
      }
    } else if (isStrictTimeExam) {
      // STRICT TIME EXAM: Fixed start and end time
      // Validate that exam duration fits within the time window
      if (examDto.duration) {
        const examDurationMs = examDto.duration * 60 * 1000;
        const availableTimeMs = endTime.getTime() - startTime.getTime();

        if (examDurationMs > availableTimeMs) {
          throw AppException.badRequest(
            ErrorCode.EXAM_DURATION_EXCEEDS_TIME,
            `Exam duration (${examDto.duration} minutes) exceeds available time window`
          );
        }
      }
    } else {
      // Partial window configuration is not allowed
      if (windowStart || windowEnd) {
        throw AppException.badRequest(ErrorCode.INVALID_WINDOW_CONFIG);
      }
    }
  }

  /**
   * Validates Class-TeacherAssignment consistency
   * CRITICAL: Ensures class.teacherId matches teacherAssignment's teacher
   * and that subject/grade/medium are aligned
   */
  private async validateClassTeacherAssignment(
    classId: string,
    teacherId: string
  ): Promise<void> {
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacherAssignment: {
          include: {
            teacherProfile: true,
          },
        },
      },
    });

    if (!classData) {
      throw AppException.notFound(ErrorCode.CLASS_NOT_FOUND);
    }

    // Verify teacherId matches
    if (classData.teacherId !== teacherId) {
      throw AppException.forbidden(ErrorCode.CLASS_TEACHER_MISMATCH);
    }

    // Verify TeacherAssignment consistency
    if (classData.teacherAssignmentId && classData.teacherAssignment) {
      const assignment = classData.teacherAssignment;

      // Check if the assignment's teacher matches the class teacher
      const teacherProfile = await this.prisma.teacherProfile.findFirst({
        where: {
          userId: teacherId,
        },
      });

      if (!teacherProfile) {
        throw AppException.badRequest(ErrorCode.TEACHER_PROFILE_NOT_FOUND);
      }

      if (assignment.teacherProfileId !== teacherProfile.id) {
        throw AppException.badRequest(ErrorCode.ASSIGNMENT_TEACHER_MISMATCH);
      }

      // Verify subject/grade/medium alignment
      if (assignment.subjectId !== classData.subjectId) {
        throw AppException.badRequest(ErrorCode.ASSIGNMENT_SUBJECT_MISMATCH);
      }

      if (assignment.gradeId !== classData.gradeId) {
        throw AppException.badRequest(ErrorCode.ASSIGNMENT_GRADE_MISMATCH);
      }

      if (assignment.mediumId !== classData.mediumId) {
        throw AppException.badRequest(ErrorCode.ASSIGNMENT_MEDIUM_MISMATCH);
      }
    }
  }

  /**
   * Creates exam sections for hierarchical exam structure
   * @param examId The exam ID
   * @param sections Array of section data
   */
  public async createExamSections(
    examId: string,
    sections: ExamSectionDto[]
  ): Promise<any> {
    // Sort sections by order
    const sortedSections = sections.sort((a, b) => a.order - b.order);
    const createdSections = [];

    for (const sectionData of sortedSections) {
      const section = await this.prisma.examSection.create({
        data: {
          examId,
          title: sectionData.title,
          description: sectionData.description,
          order: sectionData.order,
          examPart: sectionData.examPart || 1,
          defaultQuestionType: sectionData.defaultQuestionType,
        },
      });

      createdSections.push(section);
      // Create question groups within this section if provided
      // Groups can be added later through separate API calls
    }

    return {
      success: true,
      message: `${createdSections.length} sections created successfully`,
      data: createdSections,
    };
  }

  /**
   * Creates question groups within a section
   * @param sectionId The section ID
   * @param groups Array of group data
   */
  private async createQuestionGroups(
    sectionId: string,
    groups: QuestionGroupDto[]
  ): Promise<void> {
    // Sort groups by order
    const sortedGroups = groups.sort((a, b) => a.order - b.order);

    for (const groupData of sortedGroups) {
      await this.prisma.questionGroup.create({
        data: {
          sectionId,
          title: groupData.title || "",
          instruction: groupData.instruction,
          order: groupData.order,
        },
      });
    }
  }

  // ============= SECTION MANAGEMENT METHODS =============

  async bulkCreateSections(
    examId: string,
    sections: ExamSectionDto[],
    userId: string
  ) {
    // Verify exam exists and user has permission
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: { createdById: true },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    // Authorization check
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAuthorized =
      exam.createdById === userId ||
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.SUPER_ADMIN;

    if (!isAuthorized) {
      throw new ForbiddenException(
        "You do not have permission to modify this exam"
      );
    }

    // Create sections with proper ordering
    const createdSections = [];

    for (const sectionData of sections) {
      const section = await this.prisma.examSection.create({
        data: {
          examId,
          title: sectionData.title,
          description: sectionData.description,
          order: sectionData.order,
          examPart: sectionData.examPart,
          defaultQuestionType: sectionData.defaultQuestionType,
        },
      });
      createdSections.push(section);
    }

    return {
      message: `${createdSections.length} sections created successfully`,
      sections: createdSections,
    };
  }

  async getSectionsWithGroups(examId: string, userId: string) {
    // Verify exam exists
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: { createdById: true },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    // Authorization check
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAuthorized =
      exam.createdById === userId ||
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.SUPER_ADMIN;

    if (!isAuthorized) {
      throw new ForbiddenException(
        "You do not have permission to view this exam"
      );
    }

    // Get sections
    const sections = await this.prisma.examSection.findMany({
      where: { examId },
      orderBy: { order: "asc" },
    });

    return {
      examId,
      sectionCount: sections.length,
      sections,
    };
  }

  async updateSection(
    examId: string,
    sectionId: string,
    updates: Partial<ExamSectionDto>,
    userId: string
  ) {
    // Verify exam exists
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: { createdById: true },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    // Verify section exists and belongs to exam
    const section = await this.prisma.examSection.findUnique({
      where: { id: sectionId },
      select: { examId: true },
    });

    if (!section || section.examId !== examId) {
      throw new NotFoundException(
        `Section with ID ${sectionId} not found in exam ${examId}`
      );
    }

    // Authorization check
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAuthorized =
      exam.createdById === userId ||
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.SUPER_ADMIN;

    if (!isAuthorized) {
      throw new ForbiddenException(
        "You do not have permission to modify this exam"
      );
    }

    // Update section
    const updatedSection = await this.prisma.examSection.update({
      where: { id: sectionId },
      data: {
        ...(updates.title && { title: updates.title }),
        ...(updates.description && { description: updates.description }),
        ...(updates.order !== undefined && { order: updates.order }),
        ...(updates.examPart !== undefined && { examPart: updates.examPart }),
        ...(updates.defaultQuestionType && {
          defaultQuestionType: updates.defaultQuestionType,
        }),
      },
      include: {
        groups: true,
      },
    });

    return {
      message: "Section updated successfully",
      section: updatedSection,
    };
  }

  async deleteSection(examId: string, sectionId: string, userId: string) {
    // Verify exam exists
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: { createdById: true },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    // Verify section exists and belongs to exam
    const section = await this.prisma.examSection.findUnique({
      where: { id: sectionId },
      select: { examId: true },
    });

    if (!section || section.examId !== examId) {
      throw new NotFoundException(
        `Section with ID ${sectionId} not found in exam ${examId}`
      );
    }

    // Authorization check
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAuthorized =
      exam.createdById === userId ||
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.SUPER_ADMIN;

    if (!isAuthorized) {
      throw new ForbiddenException(
        "You do not have permission to modify this exam"
      );
    }

    // Delete section (cascade will handle groups and questions)
    await this.prisma.examSection.delete({
      where: { id: sectionId },
    });

    return {
      message: "Section deleted successfully",
      sectionId,
    };
  }

  async bulkCreateGroups(
    examId: string,
    sectionId: string,
    groups: QuestionGroupDto[],
    userId: string
  ) {
    // Verify exam exists
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: { createdById: true },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    // Verify section exists and belongs to exam
    const section = await this.prisma.examSection.findUnique({
      where: { id: sectionId },
      select: { examId: true },
    });

    if (!section || section.examId !== examId) {
      throw new NotFoundException(
        `Section with ID ${sectionId} not found in exam ${examId}`
      );
    }

    // Authorization check
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAuthorized =
      exam.createdById === userId ||
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.SUPER_ADMIN;

    if (!isAuthorized) {
      throw new ForbiddenException(
        "You do not have permission to modify this exam"
      );
    }

    // Create groups with proper ordering
    const createdGroups = [];

    for (const groupData of groups) {
      const group = await this.prisma.questionGroup.create({
        data: {
          sectionId,
          title: groupData.title || "",
          instruction: groupData.instruction,
          order: groupData.order,
        },
      });
      createdGroups.push(group);
    }

    return {
      message: `${createdGroups.length} question groups created successfully`,
      groups: createdGroups,
    };
  }

  // =============== MARKING METHODS ===============

  async getQuestionAnswers(examId: string, questionId: string, userId: string) {
    // Verify exam exists and user has permission
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        class: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAuthorized =
      exam.createdById === userId ||
      exam.class?.teacherId === userId ||
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.SUPER_ADMIN;

    if (!isAuthorized) {
      throw AppException.forbidden(ErrorCode.ACCESS_DENIED);
    }

    // Verify question exists
    const question = await this.prisma.examQuestion.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        question: true,
        type: true,
        points: true,
        correctAnswer: true,
        examPart: true,
      },
    });

    if (!question || question.id !== questionId) {
      throw AppException.notFound(ErrorCode.QUESTION_NOT_FOUND);
    }

    // Get all answers for this question
    const answers = await this.prisma.examAnswer.findMany({
      where: {
        questionId,
        attempt: {
          examId,
          status: {
            in: ["SUBMITTED", "GRADED"],
          },
        },
      },
      include: {
        attempt: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          select: {
            id: true,
            uploadedFiles: true,
            submittedAt: true,
            student: true,
          },
        },
      },
      orderBy: {
        attempt: {
          submittedAt: "asc",
        },
      },
    });

    return {
      question,
      answers: answers.map((answer) => ({
        id: answer.id,
        attemptId: answer.attemptId,
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect: answer.isCorrect,
        pointsAwarded: answer.pointsAwarded,
        timeSpent: answer.timeSpent,
        answeredAt: answer.answeredAt,
        student: answer.attempt.student,
        attempt: {
          id: answer.attempt.id,
          uploadedFiles: answer.attempt.uploadedFiles,
          submittedAt: answer.attempt.submittedAt,
        },
      })),
      stats: {
        total: answers.length,
        marked: answers.filter((a) => a.pointsAwarded !== null).length,
        unmarked: answers.filter((a) => a.pointsAwarded === null).length,
      },
    };
  }

  async gradeAnswer(
    answerId: string,
    gradeData: { pointsAwarded: number; comments?: string },
    userId: string
  ) {
    // Verify answer exists
    const answer = await this.prisma.examAnswer.findUnique({
      where: { id: answerId },
      include: {
        question: {
          select: {
            points: true,
          },
        },
        attempt: {
          include: {
            exam: {
              select: {
                id: true,
                createdById: true,
                class: {
                  select: {
                    teacherId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!answer) {
      throw AppException.notFound(ErrorCode.ANSWER_NOT_FOUND);
    }

    // Verify user has permission
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const exam = answer.attempt.exam;
    const isAuthorized =
      exam.createdById === userId ||
      exam.class?.teacherId === userId ||
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.SUPER_ADMIN;

    if (!isAuthorized) {
      throw AppException.forbidden(ErrorCode.ACCESS_DENIED);
    }

    // Validate points don't exceed question maximum
    if (gradeData.pointsAwarded > answer.question.points) {
      throw AppException.badRequest(
        ErrorCode.INVALID_INPUT,
        `Points awarded (${gradeData.pointsAwarded}) cannot exceed maximum points (${answer.question.points})`
      );
    }

    // Update answer with marks
    const updatedAnswer = await this.prisma.examAnswer.update({
      where: { id: answerId },
      data: {
        pointsAwarded: gradeData.pointsAwarded,
        isCorrect: gradeData.pointsAwarded === answer.question.points,
      },
    });

    // Recalculate attempt total score
    await this.recalculateAttemptScore(answer.attemptId);

    return {
      message: "Answer graded successfully",
      answer: updatedAnswer,
    };
  }

  async autoAssignMarks(
    examId: string,
    questionId: string,
    autoAssignData: { points: number; applyToUnanswered?: boolean },
    userId: string
  ) {
    // Verify permissions
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        class: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAuthorized =
      exam.createdById === userId ||
      exam.class?.teacherId === userId ||
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.SUPER_ADMIN;

    if (!isAuthorized) {
      throw AppException.forbidden(ErrorCode.ACCESS_DENIED);
    }

    // Get question to validate points
    const question = await this.prisma.examQuestion.findUnique({
      where: { id: questionId },
      select: { points: true },
    });

    if (!question) {
      throw AppException.notFound(ErrorCode.QUESTION_NOT_FOUND);
    }

    if (autoAssignData.points > question.points) {
      throw AppException.badRequest(
        ErrorCode.INVALID_INPUT,
        `Points (${autoAssignData.points}) cannot exceed maximum (${question.points})`
      );
    }

    // Build where clause
    const whereClause: any = {
      questionId,
      attempt: {
        examId,
        status: {
          in: ["SUBMITTED", "GRADED"],
        },
      },
    };

    if (autoAssignData.applyToUnanswered) {
      whereClause.pointsAwarded = null;
    }

    // Update all matching answers
    const result = await this.prisma.examAnswer.updateMany({
      where: whereClause,
      data: {
        pointsAwarded: autoAssignData.points,
        isCorrect: autoAssignData.points === question.points,
      },
    });

    // Recalculate scores for all affected attempts
    const affectedAnswers = await this.prisma.examAnswer.findMany({
      where: whereClause,
      select: { attemptId: true },
      distinct: ["attemptId"],
    });

    for (const answer of affectedAnswers) {
      await this.recalculateAttemptScore(answer.attemptId);
    }

    return {
      message: `Auto-assigned marks to ${result.count} answers`,
      count: result.count,
    };
  }

  async publishResults(examId: string, userId: string) {
    // Verify exam and permissions
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        class: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAuthorized =
      exam.createdById === userId ||
      exam.class?.teacherId === userId ||
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.SUPER_ADMIN;

    if (!isAuthorized) {
      throw AppException.forbidden(ErrorCode.ACCESS_DENIED);
    }

    // Update exam to show results
    await this.prisma.exam.update({
      where: { id: examId },
      data: {
        showResults: true,
        status: ExamStatus.COMPLETED,
      },
    });

    // Calculate rankings
    await this.calculateRankings(examId);

    // Send notifications to students
    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        examId,
        status: "GRADED",
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
          },
        },
      },
    });

    for (const attempt of attempts) {
      await this.notificationsService.createNotification({
        userId: attempt.studentId,
        title: "Exam Results Published",
        message: `Results for ${exam.title} are now available.`,
        type: "EXAM_RESULT",
        metadata: {
          examId,
          examTitle: exam.title,
        },
      });
    }

    return {
      message: "Results published and rankings calculated successfully",
      studentsNotified: attempts.length,
    };
  }

  private async recalculateAttemptScore(attemptId: string) {
    // Get all answers for this attempt
    const answers = await this.prisma.examAnswer.findMany({
      where: { attemptId },
      include: {
        question: {
          select: {
            examPart: true,
          },
        },
      },
    });

    // Calculate part scores
    let part1Score = 0;
    let part2Score = 0;

    for (const answer of answers) {
      const points = answer.pointsAwarded ?? 0;
      if (answer.question.examPart === 1) {
        part1Score += points;
      } else if (answer.question.examPart === 2) {
        part2Score += points;
      }
    }

    const totalScore = part1Score + part2Score;

    // Get attempt with exam info
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          select: {
            totalMarks: true,
            passingMarks: true,
          },
        },
      },
    });

    if (!attempt) return;

    const percentage = (totalScore / attempt.exam.totalMarks) * 100;
    const passed = totalScore >= attempt.exam.passingMarks;

    // Check if all answers are graded
    const allGraded = answers.every((a) => a.pointsAwarded !== null);

    // Update attempt
    await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        totalScore,
        part1Score,
        part2Score,
        percentage,
        passed,
        status: allGraded ? "GRADED" : "SUBMITTED",
      },
    });
  }

  private async calculateRankings(examId: string) {
    // Get all graded attempts
    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        examId,
        status: AttemptStatus.GRADED,
      },
      include: {
        student: {
          select: {
            id: true,
            role: true,
            districtId: true,
          },
        },
      },
      orderBy: {
        totalScore: "desc",
      },
    });

    // Calculate island-wide rankings
    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      const studentType =
        attempt.student.role === "INTERNAL_STUDENT" ? "INTERNAL" : "EXTERNAL";

      await this.prisma.examRanking.upsert({
        where: {
          examId_studentId: {
            examId,
            studentId: attempt.studentId,
          },
        },
        create: {
          examId,
          studentId: attempt.studentId,
          studentType,
          score: attempt.totalScore ?? 0,
          percentage: attempt.percentage ?? 0,
          district: attempt.student.districtId,
          zone: null,
          islandRank: i + 1,
          totalIsland: attempts.length,
        },
        update: {
          score: attempt.totalScore ?? 0,
          percentage: attempt.percentage ?? 0,
          islandRank: i + 1,
          totalIsland: attempts.length,
        },
      });
    }

    return {
      totalRanked: attempts.length,
    };
  }
}
