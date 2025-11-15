import { Process, Processor } from "@nestjs/bull";
import { Logger, Injectable } from "@nestjs/common";
import { Job } from "bull";
import { ExamProcessingJobData } from "../../shared/services/queue.service";
import { PrismaService } from "../../database/prisma.service";
import { NotificationsService } from "../../modules/notifications/notifications.service";

@Processor("exam-processing")
@Injectable()
export class ExamProcessor {
  private readonly logger = new Logger(ExamProcessor.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}
  @Process("process-exam-submission")
  async handleExamSubmission(job: Job<ExamProcessingJobData>) {
    this.logger.log(
      `Processing exam submission job ${job.id} for submission ${job.data.submissionId}`
    );

    try {
      if (job.data.autoGrade) {
        await this.autoGradeSubmission(job.data);
      } else {
        await this.prepareForManualGrading(job.data);
      }

      this.logger.log(
        `Exam submission processed successfully: ${job.data.submissionId}`
      );
      return { success: true, submissionId: job.data.submissionId };
    } catch (error) {
      this.logger.error(
        `Failed to process exam submission ${job.data.submissionId}:`,
        error
      );
      throw error;
    }
  }

  @Process("calculate-rankings")
  async handleRankingCalculation(job: Job<{ examId: string }>) {
    this.logger.log(`Calculating rankings for exam ${job.data.examId}`);

    try {
      await this.calculateExamRankings(job.data.examId);

      this.logger.log(
        `Rankings calculated successfully for exam: ${job.data.examId}`
      );
      return { success: true, examId: job.data.examId };
    } catch (error) {
      this.logger.error(
        `Failed to calculate rankings for exam ${job.data.examId}:`,
        error
      );
      throw error;
    }
  }

  private async autoGradeSubmission(
    data: ExamProcessingJobData
  ): Promise<void> {
    this.logger.log(`Auto-grading submission:
      Exam ID: ${data.examId}
      Submission ID: ${data.submissionId}
      User ID: ${data.userId}`);

    try {
      // Fetch attempt with answers
      const attempt = await this.prisma.examAttempt.findUnique({
        where: { id: data.submissionId },
        include: {
          answers: {
            include: {
              question: true,
            },
          },
          exam: true,
        },
      });

      if (!attempt) {
        this.logger.error(`Attempt not found: ${data.submissionId}`);
        return;
      }

      let totalScore = 0;
      const maxScore = attempt.maxScore || 0;

      // Grade each answer
      for (const answer of attempt.answers) {
        const question = answer.question;
        if (!question) {continue;}

        const questionPoints = question.points || 1;

        // Auto-grade MCQ and True/False questions
        if (
          question.type === "MULTIPLE_CHOICE" ||
          question.type === "TRUE_FALSE"
        ) {
          const isCorrect = answer.answer === question.correctAnswer;
          const earnedPoints = isCorrect ? questionPoints : 0;

          totalScore += earnedPoints;

          // Update the answer with score
          await this.prisma.examAnswer.update({
            where: { id: answer.id },
            data: {
              isCorrect,
              pointsAwarded: earnedPoints,
            },
          });
        }
      }

      // Calculate percentage score
      const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      const passed = percentageScore >= 50; // Default passing score

      // Update attempt with total score
      await this.prisma.examAttempt.update({
        where: { id: data.submissionId },
        data: {
          totalScore,
          percentage: percentageScore,
          passed,
          status: "GRADED",
          correctedAt: new Date(),
        },
      });

      // Notify student about graded exam
      await this.notificationsService.createNotification({
        userId: data.userId,
        title: "Exam Graded",
        message: `Your exam "${attempt.exam.title}" has been graded. You scored ${totalScore}/${maxScore} (${percentageScore.toFixed(1)}%).`,
        type: "EXAM",
        priority: "high",
        metadata: {
          examId: data.examId,
          attemptId: data.submissionId,
          score: totalScore,
          maxScore,
          percentage: percentageScore,
          passed,
        },
      });

      this.logger.log(
        `Auto-grading completed: ${totalScore}/${maxScore} (${percentageScore.toFixed(1)}%)`
      );
    } catch (error) {
      this.logger.error(
        `Auto-grading failed for attempt ${data.submissionId}:`,
        error
      );
      throw error;
    }
  }

  private async prepareForManualGrading(
    data: ExamProcessingJobData
  ): Promise<void> {
    this.logger.log(`Preparing for manual grading:
      Exam ID: ${data.examId}
      Submission ID: ${data.submissionId}
      User ID: ${data.userId}`);

    try {
      // Fetch attempt with exam details
      const attempt = await this.prisma.examAttempt.findUnique({
        where: { id: data.submissionId },
        include: {
          exam: {
            include: {
              class: {
                include: {
                  teacher: true,
                },
              },
            },
          },
        },
      });

      if (!attempt) {
        this.logger.error(`Attempt not found: ${data.submissionId}`);
        return;
      }

      // Update attempt status to submitted (awaiting manual grading)
      await this.prisma.examAttempt.update({
        where: { id: data.submissionId },
        data: {
          status: "SUBMITTED",
        },
      });

      // Notify the teacher/grader
      if (attempt.exam.class?.teacher) {
        await this.notificationsService.createNotification({
          userId: attempt.exam.class.teacher.id,
          title: "New Submission to Grade",
          message: `A new exam submission for "${attempt.exam.title}" is ready for grading.`,
          type: "EXAM",
          priority: "medium",
          metadata: {
            examId: data.examId,
            attemptId: data.submissionId,
            studentId: data.userId,
          },
        });
      }

      this.logger.log(
        `Prepared attempt ${data.submissionId} for manual grading`
      );
    } catch (error) {
      this.logger.error(
        `Failed to prepare for manual grading: ${data.submissionId}`,
        error
      );
      throw error;
    }
  }

  private async calculateExamRankings(examId: string): Promise<void> {
    this.logger.log(`Calculating rankings for exam: ${examId}`);

    try {
      // Fetch all graded attempts for this exam
      const attempts = await this.prisma.examAttempt.findMany({
        where: {
          examId,
          status: "GRADED",
        },
        orderBy: {
          totalScore: "desc",
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (attempts.length === 0) {
        this.logger.log("No graded attempts found for ranking");
        return;
      }

      // Calculate rankings with tie handling
      let currentRank = 1;
      let previousScore: number | null = null;

      for (let i = 0; i < attempts.length; i++) {
        const attempt = attempts[i];
        const score = attempt.totalScore || 0;

        if (previousScore !== null && score === previousScore) {
          // Same score as previous - keep same rank
        } else {
          // Different score - new rank
          currentRank = i + 1;
        }

        // Update attempt with island rank
        await this.prisma.examAttempt.update({
          where: { id: attempt.id },
          data: {
            islandRank: currentRank,
          },
        });

        // Notify student of their rank
        await this.notificationsService.createNotification({
          userId: attempt.studentId,
          title: "Exam Ranking Available",
          message: `You ranked #${currentRank} out of ${attempts.length} students in the exam.`,
          type: "EXAM",
          priority: "medium",
          metadata: {
            examId,
            attemptId: attempt.id,
            rank: currentRank,
            totalParticipants: attempts.length,
          },
        });

        previousScore = score;
      }

      this.logger.log(`Rankings calculated for ${attempts.length} attempts`);
    } catch (error) {
      this.logger.error(
        `Failed to calculate rankings for exam ${examId}:`,
        error
      );
      throw error;
    }
  }
}
