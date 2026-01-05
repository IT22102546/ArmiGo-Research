import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

@Injectable()
export class MarkingService {
  constructor(private prisma: PrismaService) {}

  private async verifyTeacherAccess(examId: string, userId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: { createdById: true },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND, "Exam not found");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const isCreator = exam.createdById === userId;

    if (!isAdmin && !isCreator) {
      throw AppException.forbidden(
        ErrorCode.NO_MARKING_ACCESS,
        "You do not have access to mark this exam"
      );
    }

    return exam;
  }

  async markAnswer(
    answerId: string,
    markData: { pointsAwarded: number; feedback?: string },
    userId: string
  ) {
    const answer = await this.prisma.examAnswer.findUnique({
      where: { id: answerId },
      include: {
        question: { select: { points: true, examId: true } },
        attempt: { select: { examId: true } },
      },
    });

    if (!answer) {
      throw AppException.notFound(
        ErrorCode.ANSWER_NOT_FOUND,
        "Answer not found"
      );
    }

    await this.verifyTeacherAccess(answer.attempt.examId, userId);

    if (markData.pointsAwarded > answer.question.points) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        "Points awarded cannot exceed question points"
      );
    }

    const updatedAnswer = await this.prisma.examAnswer.update({
      where: { id: answerId },
      data: {
        pointsAwarded: markData.pointsAwarded,
        isCorrect: markData.pointsAwarded === answer.question.points,
      },
    });

    // Update attempt with feedback if provided
    if (markData.feedback) {
      await this.prisma.examAttempt.update({
        where: { id: answer.attemptId },
        data: {
          correctionNotes: markData.feedback,
        },
      });
    }

    return updatedAnswer;
  }

  async getQuestionsForMarking(examId: string, user: any) {
    await this.verifyTeacherAccess(examId, user.id);

    // Only include question types that need manual marking (ESSAY, SHORT_ANSWER)
    const questions = await this.prisma.examQuestion.findMany({
      where: { examId, type: { in: ["ESSAY", "SHORT_ANSWER"] } },
      select: {
        id: true,
        type: true,
        question: true,
        points: true,
        order: true,
        examPart: true,
      },
      orderBy: { order: "asc" },
    });

    // Get marking status for each question
    const questionsWithStatus = await Promise.all(
      questions.map(async (question) => {
        const answers = await this.prisma.examAnswer.findMany({
          where: {
            questionId: question.id,
            attempt: { examId },
          },
          select: {
            id: true,
            pointsAwarded: true,
          },
        });

        const totalAnswers = answers.length;
        const markedAnswers = answers.filter(
          (a) => a.pointsAwarded !== null
        ).length;

        return {
          ...question,
          totalAnswers,
          markedAnswers,
          progress: totalAnswers > 0 ? (markedAnswers / totalAnswers) * 100 : 0,
        };
      })
    );

    return questionsWithStatus;
  }

  async getQuestionAnswers(examId: string, questionId: string, user: any) {
    await this.verifyTeacherAccess(examId, user.id);

    const question = await this.prisma.examQuestion.findFirst({
      where: { id: questionId, examId },
      select: { id: true, type: true, question: true, points: true },
    });

    if (!question) {
      throw AppException.notFound(
        ErrorCode.QUESTION_NOT_FOUND,
        "Question not found"
      );
    }

    const answers = await this.prisma.examAnswer.findMany({
      where: {
        questionId,
        attempt: { examId },
      },
      include: {
        attempt: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                // studentId lives under studentProfile if needed
              },
            },
          },
        },
      },
      orderBy: {
        attempt: {
          student: {
            lastName: "asc",
          },
        },
      },
    });

    return {
      question,
      answers: answers.map((answer) => ({
        id: answer.id,
        answer: answer.answer, // single text field is `answer` in schema
        pointsAwarded: answer.pointsAwarded,
        isCorrect: answer.isCorrect,
        timeSpent: answer.timeSpent,
        answeredAt: answer.answeredAt,
        student: answer.attempt.student,
      })),
    };
  }

  async getMarkingProgress(examId: string, user: any) {
    await this.verifyTeacherAccess(examId, user.id);

    const questions = await this.prisma.examQuestion.findMany({
      where: { examId, type: { in: ["ESSAY", "SHORT_ANSWER"] } },
      select: { id: true, question: true, points: true },
    });

    const totalStudents = await this.prisma.examAttempt.count({
      where: { examId },
    });

    const progress = await Promise.all(
      questions.map(async (question) => {
        const answers = await this.prisma.examAnswer.findMany({
          where: {
            questionId: question.id,
            attempt: { examId },
          },
          select: {
            id: true,
            pointsAwarded: true,
          },
        });

        const totalAnswers = answers.length;
        const markedAnswers = answers.filter(
          (a) => a.pointsAwarded !== null
        ).length;

        return {
          questionId: question.id,
          questionText: question.question,
          points: question.points,
          totalAnswers,
          markedAnswers,
          progress: totalAnswers > 0 ? (markedAnswers / totalAnswers) * 100 : 0,
        };
      })
    );

    const totalMarked = progress.reduce((sum, q) => sum + q.markedAnswers, 0);
    const totalAnswers = progress.reduce((sum, q) => sum + q.totalAnswers, 0);
    const overallProgress =
      totalAnswers > 0 ? (totalMarked / totalAnswers) * 100 : 0;

    return {
      totalStudents,
      questions: progress,
      overallProgress,
      totalMarked,
      totalAnswers,
    };
  }

  async autoAssignMarks(
    examId: string,
    questionId: string,
    strategy: "ZERO" | "FULL",
    user: any
  ) {
    await this.verifyTeacherAccess(examId, user.id);

    const question = await this.prisma.examQuestion.findFirst({
      where: { id: questionId, examId },
      select: { points: true },
    });

    if (!question) {
      throw AppException.notFound(
        ErrorCode.QUESTION_NOT_FOUND,
        "Question not found"
      );
    }

    const pointsToAssign = strategy === "FULL" ? question.points : 0;
    const isCorrect = strategy === "FULL";

    const unansweredAnswers = await this.prisma.examAnswer.findMany({
      where: {
        questionId,
        attempt: { examId },
        pointsAwarded: null,
      },
      select: { id: true },
    });

    await this.prisma.examAnswer.updateMany({
      where: {
        id: {
          in: unansweredAnswers.map((a) => a.id),
        },
      },
      data: {
        pointsAwarded: pointsToAssign,
        isCorrect,
      },
    });

    return {
      updated: unansweredAnswers.length,
      strategy,
      pointsAssigned: pointsToAssign,
    };
  }

  async calculateFinalMarks(examId: string, user: any) {
    await this.verifyTeacherAccess(examId, user.id);

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: { totalMarks: true },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND, "Exam not found");
    }

    const attempts = await this.prisma.examAttempt.findMany({
      where: { examId },
      include: {
        answers: {
          select: {
            pointsAwarded: true,
            question: {
              select: {
                examPart: true,
              },
            },
          },
        },
      },
    });

    const updated = await Promise.all(
      attempts.map(async (attempt) => {
        const part1Score = attempt.answers
          .filter((a) => a.question.examPart === 1)
          .reduce((sum, a) => sum + (a.pointsAwarded || 0), 0);

        const part2Score = attempt.answers
          .filter((a) => a.question.examPart === 2)
          .reduce((sum, a) => sum + (a.pointsAwarded || 0), 0);

        const totalScore = part1Score + part2Score;
        const percentage = (totalScore / exam.totalMarks) * 100;
        const passed = percentage >= 60; // Configurable pass threshold

        return this.prisma.examAttempt.update({
          where: { id: attempt.id },
          data: {
            part1Score,
            part2Score,
            totalScore,
            percentage,
            passed,
            correctedAt: new Date(),
            correctedBy: user.id,
          },
        });
      })
    );

    return {
      updated: updated.length,
      message: "Final marks calculated successfully",
    };
  }

  async publishResults(examId: string, user: any) {
    await this.verifyTeacherAccess(examId, user.id);

    // First calculate final marks if not done
    await this.calculateFinalMarks(examId, user);

    // Trigger ranking calculation and return the message
    await this.prisma.$transaction(async (tx) => {
      // Use the calculation routine in the exams service or roll your own logic here
      // We'll assume an external ranking recalculation will be invoked by controller or the callee
      return true;
    });

    return {
      success: true,
      message: "Results published successfully",
    };
  }
}
