/** Incremental DB seeding script with idempotent, batch, and integrity checks. Use `--reset` for full reseed. */

import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { IncrementalSeedService } from "../src/database/incremental-seed.service";
import { PrismaService } from "../src/database/prisma.service";
import { UserRole } from "@prisma/client";
import { sequenceTracker, SEED_CONSTANTS, log } from "./seed-utils";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(IncrementalSeedService);
  const prisma = app.get(PrismaService);

  const isReset = process.argv.includes("--reset");

  console.log("🌱 Starting incremental seed...\n");

  try {
    // If reset flag is provided, clean and reseed
    if (isReset) {
      console.log("⚠️  Reset mode enabled - this will clear existing data");
      await seedService.cleanAndReseed(async () => {
        await runSeeding(seedService, prisma);
      });
    } else {
      // Normal incremental seeding
      await runSeeding(seedService, prisma);
    }

    // Verify integrity after seeding
    console.log("\n🔍 Verifying seed integrity...");
    const integrity = await seedService.verifySeedIntegrity();

    if (integrity.isHealthy) {
      console.log("✅ Seed integrity verified - all references are valid\n");
    } else {
      console.warn("⚠️  Seed integrity issues found:");
      integrity.issues.forEach((issue) => console.warn(`   - ${issue}`));
      console.log("");
    }

    console.log("🎉 Incremental seed completed successfully!\n");
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

async function runSeeding(
  seedService: IncrementalSeedService,
  prisma: PrismaService
): Promise<void> {
  // Reset sequence tracker for consistent numbering on each run
  sequenceTracker.reset();

  // Step 1: Seed enum tables (Grades, Subjects, Zones, etc.)
  console.log("📊 Seeding enum tables...");
  await seedEnumTables(seedService);

  // Step 2: Seed users with batch operations
  console.log("👥 Seeding users...");
  await seedUsers(seedService);

  // Step 3: Seed student profiles with proper registration numbers
  console.log("🎓 Seeding student profiles...");
  await seedStudentProfiles(prisma);

  // Step 4: Seed classes
  console.log("📚 Seeding classes...");
  await seedClasses(prisma);

  // Step 5: Seed enrollments
  console.log("📝 Seeding enrollments...");
  await seedEnrollments(seedService, prisma);

  // Step 6: Seed exams
  console.log("📋 Seeding exams...");
  await seedExams(prisma);
}

async function seedEnumTables(
  seedService: IncrementalSeedService
): Promise<void> {
  // Grades
  await seedService.seedEnums("grade", "name", [
    {
      name: "Grade 1",
      description: "First grade level",
      order: 1,
      isActive: true,
    },
    {
      name: "Grade 2",
      description: "Second grade level",
      order: 2,
      isActive: true,
    },
    {
      name: "Grade 3",
      description: "Third grade level",
      order: 3,
      isActive: true,
    },
    {
      name: "Grade 4",
      description: "Fourth grade level",
      order: 4,
      isActive: true,
    },
    {
      name: "Grade 5",
      description: "Fifth grade level",
      order: 5,
      isActive: true,
    },
    {
      name: "Grade 6",
      description: "Sixth grade level",
      order: 6,
      isActive: true,
    },
    {
      name: "Grade 7",
      description: "Seventh grade level",
      order: 7,
      isActive: true,
    },
    {
      name: "Grade 8",
      description: "Eighth grade level",
      order: 8,
      isActive: true,
    },
    {
      name: "Grade 9",
      description: "Ninth grade level",
      order: 9,
      isActive: true,
    },
    {
      name: "Grade 10",
      description: "Tenth grade level",
      order: 10,
      isActive: true,
    },
    {
      name: "Grade 11",
      description: "Eleventh grade level",
      order: 11,
      isActive: true,
    },
  ]);

  // Subjects
  await seedService.seedEnums("subject", "name", [
    {
      name: "Mathematics",
      code: "MATH",
      description: "Mathematics curriculum",
      isActive: true,
    },
    {
      name: "Science",
      code: "SCI",
      description: "Science curriculum",
      isActive: true,
    },
    {
      name: "English",
      code: "ENG",
      description: "English language and literature",
      isActive: true,
    },
    {
      name: "Tamil",
      code: "TAM",
      description: "Tamil language and literature",
      isActive: true,
    },
    {
      name: "History",
      code: "HIST",
      description: "History curriculum",
      isActive: true,
    },
    {
      name: "Geography",
      code: "GEO",
      description: "Geography curriculum",
      isActive: true,
    },
    {
      name: "ICT",
      code: "ICT",
      description: "Information and Communication Technology",
      isActive: true,
    },
  ]);

  // Zones
  await seedService.seedEnums("zone", "name", [
    { name: "Colombo", code: "CMB" },
    { name: "Gampaha", code: "GMP" },
    { name: "Kandy", code: "KDY" },
    { name: "Jaffna", code: "JFN" },
    { name: "Galle", code: "GAL" },
  ]);

  // Districts
  await seedService.seedEnums("district", "name", [
    { name: "Colombo", code: "CMB" },
    { name: "Gampaha", code: "GMP" },
    { name: "Kandy", code: "KDY" },
    { name: "Jaffna", code: "JFN" },
    { name: "Galle", code: "GAL" },
  ]);

  console.log("   ✓ Enum tables seeded");
}

async function seedUsers(seedService: IncrementalSeedService): Promise<void> {
  // Get zone and district IDs
  const { prisma } = seedService as any;

  // Seed admin users
  const adminUsers = [
    {
      email: "superadmin@learnup.lk",
      firstName: "Super",
      lastName: "Admin",
      role: UserRole.SUPER_ADMIN,
      phone: "+94771234567",
    },
    {
      email: "admin@learnup.lk",
      firstName: "System",
      lastName: "Admin",
      role: UserRole.ADMIN,
      phone: "+94771234568",
    },
  ];

  await seedService.batchCreateUsers(adminUsers);

  // Seed teachers
  const teachers = [
    {
      email: "teacher1@learnup.lk",
      firstName: "John",
      lastName: "Smith",
      role: UserRole.INTERNAL_TEACHER,
      phone: "+94771234569",
    },
    {
      email: "teacher2@learnup.lk",
      firstName: "Mary",
      lastName: "Johnson",
      role: UserRole.INTERNAL_TEACHER,
      phone: "+94771234570",
    },
  ];

  await seedService.batchCreateUsers(teachers);

  // Seed students
  const students = [
    {
      email: "student1@learnup.lk",
      firstName: "Alice",
      lastName: "Brown",
      role: UserRole.INTERNAL_STUDENT,
      phone: "+94771234571",
    },
    {
      email: "student2@learnup.lk",
      firstName: "Bob",
      lastName: "Wilson",
      role: UserRole.INTERNAL_STUDENT,
      phone: "+94771234572",
    },
    {
      email: "student3@learnup.lk",
      firstName: "Charlie",
      lastName: "Davis",
      role: UserRole.INTERNAL_STUDENT,
      phone: "+94771234573",
    },
  ];

  await seedService.batchCreateUsers(students);

  console.log("   ✓ Users seeded");
}

/**
 * Seed student profiles with proper registration numbers
 *
 * Registration Number Format: INSTITUTION_CODE/STUDENT_TYPE/AL_BATCH_YEAR/SEQUENCE
 * Example: PV/IN/2029/001
 *
 * The registration number is generated using:
 * - INSTITUTION_CODE: "PV" (Pivithuru Viththakan)
 * - STUDENT_TYPE: "IN" (internal) or "EX" (external)
 * - AL_BATCH_YEAR: Calculated based on grade (Grade 10 → A/L in currentYear + 4)
 * - SEQUENCE: 3-digit unique number within batch
 */
async function seedStudentProfiles(prisma: PrismaService): Promise<void> {
  // Get required references
  const grade10 = await prisma.grade.findFirst({ where: { name: "Grade 10" } });
  const mediumSinhala = await prisma.medium.findFirst({
    where: { name: "Sinhala" },
  });
  const mediumTamil = await prisma.medium.findFirst({
    where: { name: "Tamil" },
  });
  const mediumEnglish = await prisma.medium.findFirst({
    where: { name: "English" },
  });

  if (!grade10) {
    console.log("   ⚠️  Skipping student profiles - Grade 10 not found");
    return;
  }

  // Get all student users that don't have profiles yet
  const studentsWithoutProfiles = await prisma.user.findMany({
    where: {
      role: { in: [UserRole.INTERNAL_STUDENT, UserRole.EXTERNAL_STUDENT] },
      studentProfile: null,
    },
    orderBy: { createdAt: "asc" },
  });

  if (studentsWithoutProfiles.length === 0) {
    console.log("   ✓ All students already have profiles");
    return;
  }

  let createdCount = 0;

  for (const student of studentsWithoutProfiles) {
    // Generate proper registration number using seed-utils
    const gradeLevel = 10; // Default to Grade 10
    const registrationNumber = sequenceTracker.getNextRegistrationNumber(
      student.role,
      gradeLevel,
      "PV" // Institution code
    );

    // Determine medium based on student order (for variety)
    const mediums = [mediumSinhala, mediumTamil, mediumEnglish].filter(Boolean);
    const medium = mediums[createdCount % mediums.length];

    try {
      await prisma.studentProfile.create({
        data: {
          userId: student.id,
          studentId: registrationNumber,
          gradeId: grade10.id,
          mediumId: medium?.id,
          academicYear: SEED_CONSTANTS.ACADEMIC_YEAR,
          guardianName: `Guardian of ${student.firstName}`,
          guardianPhone: `+9477${1000000 + createdCount}`,
          schoolName:
            student.role === UserRole.INTERNAL_STUDENT
              ? "Pivithuru Viththakan"
              : "External School",
          preferredSubjects: ["Mathematics", "Science"],
        },
      });

      createdCount++;
      log.info(`Created profile for ${student.email}: ${registrationNumber}`);
    } catch (error) {
      // Profile may already exist (unique constraint)
      console.log(`   ⚠️  Profile already exists for ${student.email}`);
    }
  }

  console.log(`   ✓ Student profiles seeded (${createdCount} created)`);
}

async function seedClasses(prisma: PrismaService): Promise<void> {
  // Get required IDs
  const grade = await prisma.grade.findFirst({ where: { name: "Grade 10" } });
  const subject = await prisma.subject.findFirst({
    where: { name: "Mathematics" },
  });
  const teacher = await prisma.user.findFirst({
    where: { email: "teacher1@learnup.lk" },
  });
  const medium = await prisma.medium.findFirst({ where: { name: "Sinhala" } });

  if (!grade || !subject || !teacher || !medium) {
    console.log("   ⚠️  Skipping classes - required references not found");
    return;
  }

  // Check if class exists
  const existingClass = await prisma.class.findFirst({
    where: { name: "Grade 10 Mathematics - Batch A" },
  });

  if (!existingClass) {
    await prisma.class.create({
      data: {
        name: "Grade 10 Mathematics - Batch A",
        description: "Advanced mathematics class for Grade 10 students",
        gradeId: grade.id,
        subjectId: subject.id,
        teacherId: teacher.id,
        mediumId: medium.id,
        maxStudents: 30,
        status: "ACTIVE",
        fees: 2500,
        startDate: new Date(),
        schedule: JSON.stringify({
          days: ["Monday", "Wednesday", "Friday"],
          time: "15:00-17:00",
        }),
      },
    });
  }

  console.log("   ✓ Classes seeded");
}

async function seedEnrollments(
  seedService: IncrementalSeedService,
  prisma: PrismaService
): Promise<void> {
  const classData = await prisma.class.findFirst({
    where: { name: "Grade 10 Mathematics - Batch A" },
  });

  const students = await prisma.user.findMany({
    where: { role: UserRole.INTERNAL_STUDENT },
    take: 3,
  });

  if (!classData || students.length === 0) {
    console.log("   ⚠️  Skipping enrollments - required references not found");
    return;
  }

  const enrollments = students.map((student) => ({
    studentId: student.id,
    classId: classData.id,
  }));

  await seedService.incrementalCreateEnrollments(enrollments);

  console.log("   ✓ Enrollments seeded");
}

async function seedExams(prisma: PrismaService): Promise<void> {
  const classData = await prisma.class.findFirst({
    where: { name: "Grade 10 Mathematics - Batch A" },
    include: { grade: true, subject: true, medium: true },
  });

  const teacher = await prisma.user.findFirst({
    where: { email: "teacher1@learnup.lk" },
  });

  if (!classData || !teacher) {
    console.log("   ⚠️  Skipping exams - required references not found");
    return;
  }

  // Check if exam exists
  const existingExam = await prisma.exam.findFirst({
    where: { title: "Mid-Term Mathematics Exam" },
  });

  if (!existingExam) {
    await prisma.exam.create({
      data: {
        title: "Mid-Term Mathematics Exam",
        description:
          "Comprehensive mid-term examination covering algebra and geometry",
        classId: classData.id,
        gradeId: classData.gradeId,
        subjectId: classData.subjectId,
        mediumId: classData.mediumId,
        createdById: teacher.id,
        type: "MULTIPLE_CHOICE",
        format: "FULL_ONLINE",
        status: "DRAFT",
        duration: 90,
        totalMarks: 100,
        passingMarks: 40,
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        endTime: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000
        ),
        attemptsAllowed: 1,
        approvalStatus: "PENDING",
      },
    });
  }

  console.log("   ✓ Exams seeded");
}

bootstrap();
