import { Test, TestingModule } from "@nestjs/testing";
import { ExamsService } from "./exams.service";
import { PrismaService } from "@database/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AppException } from "@common/errors/app-exception";
import { UserRole, ExamStatus, ExamType } from "@prisma/client";

describe("ExamsService", () => {
  let service: ExamsService;
  let prismaService: PrismaService;
  let notificationsService: NotificationsService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    class: {
      findUnique: jest.fn(),
    },
    exam: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    question: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    examAttempt: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    academicYear: {
      findFirst: jest.fn(),
    },
    teacherSubjectAssignment: {
      findFirst: jest.fn(),
    },
  };

  const mockNotificationsService = {
    notifyAboutExam: jest.fn(),
    sendBulkNotifications: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should throw AppException if teacher not found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create({} as any, "invalid-teacher")
      ).rejects.toThrow(AppException);
    });

    it("should throw AppException if user is not a teacher or admin", async () => {
      const mockStudent = {
        id: "user-123",
        role: UserRole.INTERNAL_STUDENT,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockStudent);

      await expect(service.create({} as any, "user-123")).rejects.toThrow(
        AppException
      );
    });

    it("should throw AppException if class not found when classId is provided", async () => {
      const mockTeacher = {
        id: "teacher-123",
        role: UserRole.INTERNAL_TEACHER,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockTeacher);
      mockPrismaService.class.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ classId: "invalid-class" } as any, "teacher-123")
      ).rejects.toThrow(AppException);
    });
  });

  describe("approveExam", () => {
    it("should approve exam and send notification", async () => {
      const examId = "exam-123";
      const adminId = "admin-123";

      const mockExam = {
        id: examId,
        title: "Math Final",
        approvalStatus: "PENDING",
        createdById: "teacher-123",
        class: { id: "class-1", name: "Math 101" },
      };

      const mockUpdatedExam = {
        ...mockExam,
        approvalStatus: "APPROVED",
        status: ExamStatus.APPROVED,
        approvedById: adminId,
        approvedAt: new Date(),
        class: {
          id: "class-1",
          name: "Math 101",
          subject: { name: "Math" },
        },
        _count: { questions: 10 },
      };

      mockPrismaService.exam.findUnique.mockResolvedValue(mockExam);
      mockPrismaService.exam.update.mockResolvedValue(mockUpdatedExam);
      mockNotificationsService.notifyAboutExam.mockResolvedValue(undefined);

      const result = await service.approveExam(examId, adminId, {} as any);

      expect(result.approvalStatus).toBe("APPROVED");
      expect(mockNotificationsService.notifyAboutExam).toHaveBeenCalledWith(
        "teacher-123",
        "approved",
        "Math Final",
        expect.any(String)
      );
    });

    it("should throw AppException if exam not found", async () => {
      mockPrismaService.exam.findUnique.mockResolvedValue(null);

      await expect(
        service.approveExam("invalid-exam", "admin-123", {} as any)
      ).rejects.toThrow(AppException);
    });

    it("should throw AppException if exam is not pending approval", async () => {
      const mockExam = {
        id: "exam-123",
        title: "Math Final",
        approvalStatus: "APPROVED", // Already approved
        createdById: "teacher-123",
      };

      mockPrismaService.exam.findUnique.mockResolvedValue(mockExam);

      await expect(
        service.approveExam("exam-123", "admin-123", {} as any)
      ).rejects.toThrow(AppException);
    });
  });

  describe("rejectExam", () => {
    it("should reject exam and send notification with reason", async () => {
      const examId = "exam-123";
      const adminId = "admin-123";
      const rejectDto = {
        reason: "Contains errors in questions",
        feedback: "Please review question 5",
        requestChanges: true,
      };

      const mockExam = {
        id: examId,
        title: "Math Final",
        approvalStatus: "PENDING",
        createdById: "teacher-123",
        class: { id: "class-1", name: "Math 101" },
      };

      const mockUpdatedExam = {
        ...mockExam,
        approvalStatus: "REJECTED",
        status: ExamStatus.CANCELLED,
        rejectionReason: rejectDto.reason,
        class: {
          id: "class-1",
          name: "Math 101",
          subject: { name: "Math" },
        },
        creator: {
          id: "teacher-123",
          firstName: "John",
          lastName: "Doe",
          email: "teacher@test.com",
        },
        _count: { questions: 10 },
      };

      mockPrismaService.exam.findUnique.mockResolvedValue(mockExam);
      mockPrismaService.exam.update.mockResolvedValue(mockUpdatedExam);
      mockNotificationsService.notifyAboutExam.mockResolvedValue(undefined);

      const result = await service.rejectExam(
        examId,
        adminId,
        rejectDto as any
      );

      expect(result.approvalStatus).toBe("REJECTED");
      expect(mockNotificationsService.notifyAboutExam).toHaveBeenCalledWith(
        "teacher-123",
        "rejected",
        "Math Final",
        rejectDto.reason
      );
    });

    it("should throw AppException if exam not in pending status", async () => {
      const mockExam = {
        id: "exam-123",
        title: "Math Final",
        approvalStatus: "APPROVED", // Not pending
        createdById: "teacher-123",
      };

      mockPrismaService.exam.findUnique.mockResolvedValue(mockExam);

      await expect(
        service.rejectExam("exam-123", "admin-123", { reason: "Test" } as any)
      ).rejects.toThrow(AppException);
    });
  });

  describe("findAll", () => {
    it("should return list of exams with pagination", async () => {
      const mockExams = [
        {
          id: "exam-1",
          title: "Exam 1",
          status: ExamStatus.PUBLISHED,
          _count: { questions: 5, attempts: 10 },
        },
        {
          id: "exam-2",
          title: "Exam 2",
          status: ExamStatus.DRAFT,
          _count: { questions: 3, attempts: 0 },
        },
      ];

      mockPrismaService.exam.findMany.mockResolvedValue(mockExams);
      mockPrismaService.exam.count.mockResolvedValue(2);

      // findAll takes individual params: page, limit, status, classId, teacherId
      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(mockPrismaService.exam.findMany).toHaveBeenCalled();
    });

    it("should filter exams by status when provided", async () => {
      mockPrismaService.exam.findMany.mockResolvedValue([]);
      mockPrismaService.exam.count.mockResolvedValue(0);

      // findAll signature: (page, limit, status, classId, teacherId)
      await service.findAll(1, 10, ExamStatus.PUBLISHED);

      expect(mockPrismaService.exam.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ExamStatus.PUBLISHED,
          }),
        })
      );
    });
  });

  describe("findOne", () => {
    it("should return exam by id with full details", async () => {
      const examId = "exam-123";
      const mockExam = {
        id: examId,
        title: "Math Final",
        description: "Final exam",
        status: ExamStatus.PUBLISHED,
        questions: [
          { id: "q1", text: "Question 1" },
          { id: "q2", text: "Question 2" },
        ],
        _count: {
          questions: 2,
          attempts: 0,
        },
      };

      mockPrismaService.exam.findUnique.mockResolvedValue(mockExam);

      const result = await service.findOne(examId);

      expect(result.id).toEqual(examId);
      expect(mockPrismaService.exam.findUnique).toHaveBeenCalledWith({
        where: { id: examId },
        include: expect.any(Object),
      });
    });

    it("should throw AppException if exam not found", async () => {
      mockPrismaService.exam.findUnique.mockResolvedValue(null);

      await expect(service.findOne("invalid-exam")).rejects.toThrow(
        AppException
      );
    });
  });

  describe("delete", () => {
    it("should delete exam if user is creator", async () => {
      const examId = "exam-123";
      const userId = "teacher-123";

      const mockExam = {
        id: examId,
        createdById: userId,
        status: ExamStatus.DRAFT,
      };

      mockPrismaService.exam.findUnique.mockResolvedValue(mockExam);
      mockPrismaService.examAttempt.count.mockResolvedValue(0);
      mockPrismaService.exam.delete.mockResolvedValue(mockExam);

      await service.remove(examId, userId);

      expect(mockPrismaService.exam.delete).toHaveBeenCalledWith({
        where: { id: examId },
      });
    });

    it("should throw AppException if user is not creator", async () => {
      const mockExam = {
        id: "exam-123",
        createdById: "teacher-123",
        status: ExamStatus.DRAFT,
      };

      mockPrismaService.exam.findUnique.mockResolvedValue(mockExam);

      await expect(service.remove("exam-123", "other-teacher")).rejects.toThrow(
        AppException
      );
    });

    it("should allow admin to delete any exam", async () => {
      const mockExam = {
        id: "exam-123",
        createdById: "teacher-123",
        status: ExamStatus.DRAFT,
      };

      const mockAdmin = {
        id: "admin-123",
        role: UserRole.ADMIN,
      };

      mockPrismaService.exam.findUnique.mockResolvedValue(mockExam);
      mockPrismaService.user.findUnique.mockResolvedValue(mockAdmin);
      mockPrismaService.examAttempt.count.mockResolvedValue(0);
      mockPrismaService.exam.delete.mockResolvedValue(mockExam);

      // Admin should be able to delete any exam
      await service.remove("exam-123", "admin-123");

      expect(mockPrismaService.exam.delete).toHaveBeenCalled();
    });
  });
});
