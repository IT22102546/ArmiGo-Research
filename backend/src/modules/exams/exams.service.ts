import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RoleHelper } from "../../common/helpers/role.helper";
import {
  CreateExamDto,
  UpdateExamDto,
  CreateQuestionDto,
  StartExamDto,
  SubmitExamDto,
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
  constructor(private prisma: PrismaService) {}

  async create(createExamDto: CreateExamDto, teacherId: string): Promise<Exam> {
    // Verify the teacher exists and has permission
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }

    if (
      !RoleHelper.isTeacher(teacher.role) &&
      !RoleHelper.isAdmin(teacher.role)
    ) {
      throw new ForbiddenException("Only teachers and admins can create exams");
    }

    // Verify the class exists and teacher has access
    const classData = await this.prisma.class.findUnique({
      where: { id: createExamDto.classId },
    });

    if (!classData) {
      throw new NotFoundException("Class not found");
    }

    if (classData.teacherId !== teacherId && !RoleHelper.isAdmin(teacher.role)) {
      throw new ForbiddenException(
        "You can only create exams for your own classes"
      );
    }

    // Create the exam
    const exam = await this.prisma.exam.create({
      data: {
        ...createExamDto,
        startTime: new Date(createExamDto.startTime),
        endTime: new Date(createExamDto.endTime),
        status: ExamStatus.DRAFT,
        createdById: teacherId,
        subject: classData.subject, // Set subject from class
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

    return exam;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: ExamStatus,
    classId?: string
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

  async findOne(id: string): Promise<any> {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
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
        questions: {
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException("Exam not found");
    }

    // Parse JSON options for questions
    const questions = exam.questions.map(question => ({
      ...question,
      options: question.options ? JSON.parse(question.options) : null,
    }));

    return {
      ...exam,
      questions,
      questionCount: exam._count.questions,
      attemptCount: exam._count.attempts,
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
      include: {
        class: true,
      },
    });

    if (!existingExam) {
      throw new NotFoundException("Exam not found");
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException("User not found");
    }

    if (
      existingExam.class.teacherId !== userId &&
      !RoleHelper.isAdmin(currentUser.role)
    ) {
      throw new ForbiddenException(
        "Only the class teacher or admin can update this exam"
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
      include: {
        class: true,
      },
    });

    if (!existingExam) {
      throw new NotFoundException("Exam not found");
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException("User not found");
    }

    // Allow exam creator, class teacher, and admins to delete exams
    const isCreator = existingExam.createdById === userId;
    const isClassTeacher = existingExam.class.teacherId === userId;
    const isAdmin = RoleHelper.isAdmin(currentUser.role);
    const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

    if (!isCreator && !isClassTeacher && !isAdmin && !isSuperAdmin) {
      throw new ForbiddenException(
        `Only the exam creator, class teacher, or admin can delete this exam`
      );
    }

    // Check if exam has attempts
    const attemptCount = await this.prisma.examAttempt.count({
      where: { examId: id },
    });

    if (attemptCount > 0) {
      // Soft delete by updating status
      await this.prisma.exam.update({
        where: { id },
        data: {
          status: ExamStatus.CANCELLED,
        },
      });
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
      include: {
        class: true,
      },
    });

    if (!exam) {
      throw new NotFoundException("Exam not found");
    }

    // Check ownership
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException("User not found");
    }

    if (
      exam.class.teacherId !== userId &&
      !RoleHelper.isAdmin(currentUser.role)
    ) {
      throw new ForbiddenException(
        "Only the class teacher or admin can add questions to this exam"
      );
    }

    if (
      exam.status === ExamStatus.PUBLISHED ||
      exam.status === ExamStatus.CANCELLED
    ) {
      throw new BadRequestException(
        "Cannot add questions to published or cancelled exams"
      );
    }

    const question = await this.prisma.examQuestion.create({
      data: {
        ...createQuestionDto,
        examId,
        options: JSON.stringify(createQuestionDto.options),
      },
    });

    // Update exam total marks
    await this.prisma.exam.update({
      where: { id: examId },
      data: {
        totalMarks: {
          increment: createQuestionDto.points,
        },
      },
    });

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
          include: {
            class: true,
          },
        },
      },
    });

    if (!existingQuestion) {
      throw new NotFoundException("Question not found");
    }

    // Check ownership
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException("User not found");
    }

    if (
      existingQuestion.exam.class.teacherId !== userId &&
      !RoleHelper.isAdmin(currentUser.role)
    ) {
      throw new ForbiddenException(
        "Only the class teacher or admin can update this question"
      );
    }

    if (
      existingQuestion.exam.status === ExamStatus.PUBLISHED ||
      existingQuestion.exam.status === ExamStatus.CANCELLED
    ) {
      throw new BadRequestException(
        "Cannot update questions in published or cancelled exams"
      );
    }

    const updateQuestionData: any = { ...updateData };

    if (updateData.options) {
      updateQuestionData.options = JSON.stringify(updateData.options);
    }

    // Update exam total marks if points changed
    if (updateData.points && updateData.points !== existingQuestion.points) {
      const pointsDifference = updateData.points - existingQuestion.points;
      await this.prisma.exam.update({
        where: { id: existingQuestion.examId },
        data: {
          totalMarks: {
            increment: pointsDifference,
          },
        },
      });
    }

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
          include: {
            class: true,
          },
        },
      },
    });

    if (!existingQuestion) {
      throw new NotFoundException("Question not found");
    }

    // Check ownership
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException("User not found");
    }

    if (
      existingQuestion.exam.class.teacherId !== userId &&
      !RoleHelper.isAdmin(currentUser.role)
    ) {
      throw new ForbiddenException(
        "Only the class teacher or admin can remove this question"
      );
    }

    if (
      existingQuestion.exam.status === ExamStatus.PUBLISHED ||
      existingQuestion.exam.status === ExamStatus.CANCELLED
    ) {
      throw new BadRequestException(
        "Cannot remove questions from published or cancelled exams"
      );
    }

    // Update exam total marks
    await this.prisma.exam.update({
      where: { id: existingQuestion.examId },
      data: {
        totalMarks: {
          decrement: existingQuestion.points,
        },
      },
    });

    await this.prisma.examQuestion.delete({
      where: { id: questionId },
    });
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
      throw new NotFoundException("Exam not found");
    }

    if (exam.class.enrollments.length === 0) {
      throw new ForbiddenException("You are not enrolled in this class");
    }

    if (exam.status !== ExamStatus.PUBLISHED) {
      throw new BadRequestException("Exam is not available");
    }

    const now = new Date();
    if (now < exam.startTime || now > exam.endTime) {
      throw new BadRequestException("Exam is not currently active");
    }

    // Check existing attempts
    const existingAttempts = await this.prisma.examAttempt.count({
      where: {
        examId,
        studentId,
      },
    });

    if (existingAttempts >= exam.attemptsAllowed) {
      throw new BadRequestException("Maximum attempts exceeded");
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
        options: JSON.parse(q.options),
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
      throw new NotFoundException("Exam attempt not found");
    }

    // Verify ownership
    if (attempt.studentId !== userId) {
      throw new ForbiddenException("You can only submit your own exam attempts");
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException("Exam attempt is not in progress");
    }

    // Calculate score
    let totalScore = 0;
    const responses = [];

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
          answer: answer.selectedAnswer,
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

    return {
      attempt: updatedAttempt,
      score: totalScore,
      maxScore: attempt.maxScore,
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
        startTime: 'asc',
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
      include: {
        class: true,
      },
    });

    if (!exam) {
      throw new NotFoundException("Exam not found");
    }

    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (
      exam.class.teacherId !== teacherId &&
      teacher?.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException("Access denied");
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
      throw new NotFoundException("Exam not found");
    }

    // Check ownership
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException("User not found");
    }

    if (
      exam.class.teacherId !== userId &&
      !RoleHelper.isAdmin(currentUser.role)
    ) {
      throw new ForbiddenException(
        "Only the class teacher or admin can publish this exam"
      );
    }

    // Validate exam can be published
    if (exam.status === ExamStatus.PUBLISHED) {
      throw new BadRequestException("Exam is already published");
    }

    if (exam.status === ExamStatus.CANCELLED) {
      throw new BadRequestException("Cannot publish a cancelled exam");
    }

    if (exam._count.questions === 0) {
      throw new BadRequestException(
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

    return {
      ...publishedExam,
      questionCount: publishedExam._count.questions,
    };
  }

  async getExamAttempts(examId: string, userId: string): Promise<any[]> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        class: true,
      },
    });

    if (!exam) {
      throw new NotFoundException("Exam not found");
    }

    // Check ownership
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException("User not found");
    }

    if (
      exam.class.teacherId !== userId &&
      !RoleHelper.isAdmin(currentUser.role)
    ) {
      throw new ForbiddenException(
        "Only the class teacher or admin can view exam attempts"
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
      orderBy: [
        { submittedAt: "desc" },
        { startedAt: "desc" },
      ],
    });

    return attempts;
  }
}
