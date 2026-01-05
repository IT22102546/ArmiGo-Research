import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { UserRole, EnrollmentStatus, Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";

/**
 * Optimized Incremental Seeding Service
 * Addresses seeding issues with batching, idempotency, and performance
 */
@Injectable()
export class IncrementalSeedService {
  private readonly logger = new Logger(IncrementalSeedService.name);
  private readonly BATCH_SIZE = 1000;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Seed enum tables (subjects, grades, mediums, etc.)
   * Only creates records that don't exist
   */
  async seedEnums(
    model: string,
    uniqueField: string,
    data: Array<Record<string, any>>
  ): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;
    const delegate = (this.prisma as any)[model];

    if (!delegate) {
      throw new Error(`Unknown Prisma model: ${model}`);
    }

    try {
      for (const item of data) {
        const exists = await delegate.findFirst({
          where: { [uniqueField]: item[uniqueField] },
        });

        if (!exists) {
          await delegate.create({ data: item });
          created++;
        } else {
          skipped++;
        }
      }

      this.logger.log(
        `Seeded ${model}: ${created} created, ${skipped} skipped`
      );
      return { created, skipped };
    } catch (error) {
      this.logger.error(`${model} seeding failed:`, error);
      throw error;
    }
  }

  /**
   * Batch create users with password hashing
   * More efficient than creating one by one
   */
  async batchCreateUsers(
    users: Array<{
      email: string;
      phone: string;
      firstName: string;
      lastName: string;
      password?: string;
      role: UserRole;
    }>
  ): Promise<{ created: number; duplicates: number }> {
    let created = 0;
    let duplicates = 0;
    const defaultPassword = process.env.SEED_PASSWORD || "LearnUp@2025";

    try {
      // Check existing users in batch
      const existingEmails = await this.prisma.user.findMany({
        where: {
          email: { in: users.map((u) => u.email) },
        },
        select: { email: true },
      });

      const existingEmailSet = new Set(existingEmails.map((u) => u.email));

      // Filter out duplicates
      const newUsers = users.filter((u) => !existingEmailSet.has(u.email));
      duplicates = users.length - newUsers.length;

      // Batch create in smaller chunks
      for (let i = 0; i < newUsers.length; i += this.BATCH_SIZE) {
        const chunk = newUsers.slice(i, i + this.BATCH_SIZE);

        const hashedUsers: Prisma.UserCreateManyInput[] = await Promise.all(
          chunk.map(async (user) => ({
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            password: await bcrypt.hash(user.password || defaultPassword, 10),
          }))
        );

        await this.prisma.user.createMany({
          data: hashedUsers,
          skipDuplicates: true,
        });

        created += hashedUsers.length;
        this.logger.debug(
          `Batch ${Math.floor(i / this.BATCH_SIZE) + 1} completed`
        );
      }

      this.logger.log(
        `Users seeded: ${created} created, ${duplicates} duplicates`
      );
      return { created, duplicates };
    } catch (error) {
      this.logger.error("User seeding failed:", error);
      throw error;
    }
  }

  /**
   * Incremental relationship creation
   * Handles foreign keys and prevents constraint violations
   */
  async incrementalCreateEnrollments(
    enrollments: Array<{
      classId: string;
      studentId: string;
      status?: EnrollmentStatus;
    }>
  ): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    try {
      // Pre-fetch existing relationships
      const existing = await this.prisma.enrollment.findMany({
        where: {
          OR: enrollments.map((e) => ({
            classId: e.classId,
            studentId: e.studentId,
          })),
        },
        select: { classId: true, studentId: true },
      });

      const existingSet = new Set(
        existing.map((e) => `${e.classId}:${e.studentId}`)
      );

      // Filter new enrollments
      const newEnrollments = enrollments.filter(
        (e) => !existingSet.has(`${e.classId}:${e.studentId}`)
      );

      skipped = enrollments.length - newEnrollments.length;

      // Batch create
      for (let i = 0; i < newEnrollments.length; i += this.BATCH_SIZE) {
        const chunk = newEnrollments.slice(i, i + this.BATCH_SIZE);

        const enrollmentData: Prisma.EnrollmentCreateManyInput[] = chunk.map(
          (e) => ({
            classId: e.classId,
            studentId: e.studentId,
            status: e.status || EnrollmentStatus.ACTIVE,
          })
        );

        await this.prisma.enrollment.createMany({
          data: enrollmentData,
          skipDuplicates: true,
        });

        created += chunk.length;
      }

      this.logger.log(
        `Enrollments seeded: ${created} created, ${skipped} skipped`
      );
      return { created, skipped };
    } catch (error) {
      this.logger.error("Enrollment seeding failed:", error);
      throw error;
    }
  }

  /**
   * Upsert-based seeding for configurable data
   * Updates existing records instead of skipping them
   */
  async upsertSubjects(
    subjects: Array<{
      code: string;
      name: string;
      description?: string;
      category?: string;
    }>
  ): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    try {
      for (const subject of subjects) {
        const result = await this.prisma.subject.upsert({
          where: { code: subject.code },
          update: {
            name: subject.name,
            description: subject.description,
            category: subject.category,
          },
          create: {
            code: subject.code,
            name: subject.name,
            description: subject.description,
            category: subject.category,
          },
        });

        if (result.createdAt === result.updatedAt) {
          created++;
        } else {
          updated++;
        }
      }

      this.logger.log(
        `Subjects upserted: ${created} created, ${updated} updated`
      );
      return { created, updated };
    } catch (error) {
      this.logger.error("Subject upsert failed:", error);
      throw error;
    }
  }

  /**
   * Create student profiles with proper registration numbers
   *
   * Registration Number Format: INSTITUTION_CODE/STUDENT_TYPE/AL_BATCH_YEAR/SEQUENCE
   * Example: PV/IN/2029/001
   *
   * @param profiles - Array of student profile data
   * @returns Stats on created and skipped profiles
   */
  async batchCreateStudentProfiles(
    profiles: Array<{
      userId: string;
      role: UserRole;
      gradeId?: string;
      mediumId?: string;
      batchId?: string;
      academicYear?: string;
      guardianName?: string;
      guardianPhone?: string;
      schoolName?: string;
      preferredSubjects?: string[];
    }>,
    generateRegistrationNumber: (role: UserRole, gradeLevel: number) => string
  ): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    try {
      // Get existing profiles
      const existingProfiles = await this.prisma.studentProfile.findMany({
        where: { userId: { in: profiles.map((p) => p.userId) } },
        select: { userId: true },
      });
      const existingUserIds = new Set(existingProfiles.map((p) => p.userId));

      // Filter out existing profiles
      const newProfiles = profiles.filter(
        (p) => !existingUserIds.has(p.userId)
      );
      skipped = profiles.length - newProfiles.length;

      for (const profile of newProfiles) {
        // Get grade level if gradeId is provided
        let gradeLevel = 10; // Default
        if (profile.gradeId) {
          const grade = await this.prisma.grade.findUnique({
            where: { id: profile.gradeId },
            select: { level: true, name: true },
          });
          if (grade?.level) {
            gradeLevel = grade.level;
          } else if (grade?.name) {
            const match = grade.name.match(/(\d+)/);
            if (match) {
              gradeLevel = parseInt(match[1], 10);
            }
          }
        }

        // Generate registration number
        const studentId = generateRegistrationNumber(profile.role, gradeLevel);

        await this.prisma.studentProfile.create({
          data: {
            userId: profile.userId,
            studentId,
            gradeId: profile.gradeId,
            mediumId: profile.mediumId,
            batchId: profile.batchId,
            academicYear:
              profile.academicYear || new Date().getFullYear().toString(),
            guardianName: profile.guardianName,
            guardianPhone: profile.guardianPhone,
            schoolName: profile.schoolName,
            preferredSubjects: profile.preferredSubjects || [],
          },
        });

        created++;
        this.logger.debug(`Created profile: ${studentId}`);
      }

      this.logger.log(
        `Student profiles seeded: ${created} created, ${skipped} skipped`
      );
      return { created, skipped };
    } catch (error) {
      this.logger.error("Student profile seeding failed:", error);
      throw error;
    }
  }

  /**
   * Transaction-based seeding for complex operations
   * Ensures all-or-nothing semantics
   */
  async seedWithTransaction<T>(
    callback: (prisma: PrismaService) => Promise<T>
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(
        async (prisma) => callback(prisma as any),
        {
          maxWait: 10000,
          timeout: 60000,
        }
      );
    } catch (error) {
      this.logger.error("Transactional seed failed, rolling back:", error);
      throw error;
    }
  }

  /**
   * Verify seed integrity
   * Checks that critical data was created correctly
   */
  async verifySeedIntegrity(): Promise<{
    valid: boolean;
    isHealthy: boolean;
    stats: Record<string, number>;
    issues: string[];
  }> {
    const stats: Record<string, number> = {};
    const issues: string[] = [];

    try {
      // Count key entities
      stats.users = await this.prisma.user.count();
      stats.subjects = await this.prisma.subject.count();
      stats.classes = await this.prisma.class.count();
      stats.enrollments = await this.prisma.enrollment.count();
      stats.exams = await this.prisma.exam.count();

      // Check for orphaned records
      const orphanedEnrollments = await this.prisma.enrollment.findFirst({
        where: {
          class: { deletedAt: { not: null } },
          deletedAt: null,
        },
      });

      if (orphanedEnrollments) {
        issues.push("Found orphaned enrollments");
      }

      // Validate key constraints
      if (stats.users < 1) {
        issues.push("No users created");
      }

      if (stats.subjects < 1) {
        issues.push("No subjects created");
      }

      const isHealthy = issues.length === 0;
      return {
        valid: isHealthy,
        isHealthy,
        stats,
        issues,
      };
    } catch (error) {
      this.logger.error("Seed integrity check failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        isHealthy: false,
        stats,
        issues: ["Integrity check failed: " + errorMessage],
      };
    }
  }

  /**
   * Clean seed (optionally delete and reseed)
   * Only use in development!
   */
  async cleanAndReseed(
    seedFn: (prisma: PrismaService) => Promise<void>,
    shouldClean: boolean = false
  ): Promise<void> {
    if (!shouldClean) {
      this.logger.warn("Reseed without clean - running incremental seed");
      await seedFn(this.prisma);
      return;
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error("Cannot clean seed in production!");
    }

    try {
      this.logger.warn("Starting clean seed - deleting existing data");

      // Delete in dependency order (reverse foreign key order)
      await this.prisma.$executeRawUnsafe(
        "TRUNCATE TABLE exam_answers CASCADE"
      );
      await this.prisma.$executeRawUnsafe(
        "TRUNCATE TABLE exam_attempts CASCADE"
      );
      await this.prisma.$executeRawUnsafe("TRUNCATE TABLE enrollments CASCADE");
      await this.prisma.$executeRawUnsafe(
        "TRUNCATE TABLE exam_questions CASCADE"
      );
      await this.prisma.$executeRawUnsafe("TRUNCATE TABLE exams CASCADE");
      await this.prisma.$executeRawUnsafe("TRUNCATE TABLE classes CASCADE");
      await this.prisma.$executeRawUnsafe("TRUNCATE TABLE users CASCADE");

      this.logger.log("Database cleaned, reseeding...");
      await seedFn(this.prisma);

      const integrity = await this.verifySeedIntegrity();
      if (!integrity.valid) {
        throw new Error(
          `Seed integrity issues: ${integrity.issues.join(", ")}`
        );
      }

      this.logger.log("Clean seed completed successfully");
    } catch (error) {
      this.logger.error("Clean seed failed:", error);
      throw error;
    }
  }
}
