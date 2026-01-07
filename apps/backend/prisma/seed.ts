import {
  PrismaClient,
  UserRole,
  UserStatus,
  ClassStatus,
  ExamType,
  ExamFormat,
  ExamStatus,
  ApprovalStatus,
  RankingLevel,
  PaymentStatus,
  PaymentMethod,
  PublicationStatus,
  SeminarStatus,
  SessionStatus,
  TransactionType,
  SettingType,
  ChatMessageType,
  MessageApprovalStatus,
  NotificationType,
  NotificationStatus,
  AttendanceType,
  EnrollmentStatus,
  QuestionType,
  AnnouncementType,
  AnnouncementPriority,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { SEED_CONSTANTS, sequenceTracker, log } from "./seed-utils";

const prisma = new PrismaClient();

// SECURITY: Use environment variable for seed password
// Password must meet: 8+ chars, 1 lowercase, 1 uppercase, 1 digit, 1 special char from @$!%*?&
const DEFAULT_SEED_PASSWORD = SEED_CONSTANTS.DEFAULT_PASSWORD;
const SEED_PASSWORD = process.env.SEED_PASSWORD || DEFAULT_SEED_PASSWORD;

function logPasswordInfo(): void {
  if (!process.env.SEED_PASSWORD) {
    console.log("\n⚠️  SEED_PASSWORD environment variable not set.");
    console.log(`📝 Using default seed password: ${DEFAULT_SEED_PASSWORD}`);
    console.log("   Set SEED_PASSWORD env var for custom password.\n");
  }
}

async function main() {
  logPasswordInfo();
  console.log("🧹 Cleaning up existing seed data...");

  // Delete in reverse dependency order to avoid foreign key violations
  // These are records created with .create() that need cleanup before re-seeding
  await prisma.feedback.deleteMany({});
  await prisma.systemErrorLog.deleteMany({});
  await prisma.passwordReset.deleteMany({});
  await prisma.csrfToken.deleteMany({});
  await prisma.loginAttempt.deleteMany({});
  await prisma.accessTokenBlacklist.deleteMany({});
  await prisma.deviceToken.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.authSession.deleteMany({});
  await prisma.trustedIp.deleteMany({});
  await prisma.securityAuditLog.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.analyticsEvent.deleteMany({});
  await prisma.backgroundJob.deleteMany({});
  await prisma.temporaryAccess.deleteMany({});
  // await prisma.examException.deleteMany({}); // Model removed
  await prisma.classRescheduling.deleteMany({});
  await prisma.teacherAvailability.deleteMany({});
  // await prisma.studentPromotion.deleteMany({}); // Model removed
  await prisma.attendanceSummary.deleteMany({});
  await prisma.studentProgress.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.announcementRead.deleteMany({});
  await prisma.announcementGrade.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.seminarRegistration.deleteMany({});
  await prisma.seminar.deleteMany({});
  await prisma.publicationReview.deleteMany({});
  await prisma.publicationPurchase.deleteMany({});
  await prisma.publicationMedium.deleteMany({});
  await prisma.publicationSubject.deleteMany({});
  await prisma.publicationGrade.deleteMany({});
  await prisma.publication.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.paymentReconciliation.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.walletTransaction.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.transferMessage.deleteMany({});
  await prisma.transferRequestDesiredZone.deleteMany({});
  await prisma.transferRequest.deleteMany({});
  await prisma.examAnswer.deleteMany({});
  await prisma.examAttempt.deleteMany({});
  await prisma.examRanking.deleteMany({});
  await prisma.examQuestion.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.sessionParticipant.deleteMany({});
  await prisma.classSession.deleteMany({});
  await prisma.videoSession.deleteMany({});
  await prisma.timetable.deleteMany({});
  await prisma.class.deleteMany({});

  // Delete user-related data
  await prisma.faceRecognition.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.teacherProfile.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✅ Cleanup completed");

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // ------------------------------------------------
  // 1. CORE MASTER DATA
  // ------------------------------------------------
  const academicYear2025 = await prisma.academicYear.upsert({
    where: { year: "2025" },
    update: {},
    create: {
      year: "2025",
      startDate: new Date("2025-01-01T00:00:00Z"),
      endDate: new Date("2025-12-31T23:59:59Z"),
      isCurrent: true,
      isActive: true,
    },
  });

  const [mediumTA, mediumSI, mediumEN] = await Promise.all([
    prisma.medium.upsert({
      where: { name: "Tamil" },
      update: {},
      create: {
        name: "Tamil",
        code: "TA",
        description: "Tamil Medium",
        sortOrder: 1,
      },
    }),
    prisma.medium.upsert({
      where: { name: "Sinhala" },
      update: {},
      create: {
        name: "Sinhala",
        code: "SI",
        description: "Sinhala Medium",
        sortOrder: 2,
      },
    }),
    prisma.medium.upsert({
      where: { name: "English" },
      update: {},
      create: {
        name: "English",
        code: "EN",
        description: "English Medium",
        sortOrder: 3,
      },
    }),
  ]);

  const grades = await Promise.all(
    Array.from({ length: 11 }, (_, i) => {
      const level = i + 1;
      return prisma.grade.upsert({
        where: { level },
        update: {},
        create: {
          name: `Grade ${level}`,
          code: `G${level}`,
          level,
          sortOrder: level,
          description: `Grade ${level}`,
          isActive: true,
        },
      });
    })
  );
  const grade10 = grades.find((g) => g.level === 10)!;
  const grade11 = grades.find((g) => g.level === 11)!;

  const batch10_01 = await prisma.batch.upsert({
    where: { gradeId_code: { gradeId: grade10.id, code: "BATCH-01" } },
    update: {},
    create: {
      name: "Batch 01",
      code: "BATCH-01",
      gradeId: grade10.id,
      description: "Grade 10 - Batch 01",
      isActive: true,
    },
  });

  const batch11_01 = await prisma.batch.upsert({
    where: { gradeId_code: { gradeId: grade11.id, code: "BATCH-01" } },
    update: {},
    create: {
      name: "Batch 01",
      code: "BATCH-01",
      gradeId: grade11.id,
      description: "Grade 11 - Batch 01",
      isActive: true,
    },
  });

  // Subjects (CODE in CAPS)
  const [subjectMaths, subjectScience, subjectTamil] = await Promise.all([
    prisma.subject.upsert({
      where: { name: "Mathematics" },
      update: {},
      create: {
        name: "Mathematics",
        code: "MATHS",
        description: "Mathematics for Grade 6–11",
        category: "Core",
        isActive: true,
      },
    }),
    prisma.subject.upsert({
      where: { name: "Science" },
      update: {},
      create: {
        name: "Science",
        code: "SCIENCE",
        description: "Science for Grade 6–11",
        category: "Core",
        isActive: true,
      },
    }),
    prisma.subject.upsert({
      where: { name: "Tamil Language" },
      update: {},
      create: {
        name: "Tamil Language",
        code: "TAMIL",
        description: "Tamil Language subject",
        category: "Language",
        isActive: true,
      },
    }),
  ]);

  // GradeSubject links
  await Promise.all([
    prisma.gradeSubject.upsert({
      where: {
        gradeId_subjectId: { gradeId: grade10.id, subjectId: subjectMaths.id },
      },
      update: {},
      create: { gradeId: grade10.id, subjectId: subjectMaths.id },
    }),
    prisma.gradeSubject.upsert({
      where: {
        gradeId_subjectId: {
          gradeId: grade10.id,
          subjectId: subjectScience.id,
        },
      },
      update: {},
      create: { gradeId: grade10.id, subjectId: subjectScience.id },
    }),
    prisma.gradeSubject.upsert({
      where: {
        gradeId_subjectId: { gradeId: grade11.id, subjectId: subjectMaths.id },
      },
      update: {},
      create: { gradeId: grade11.id, subjectId: subjectMaths.id },
    }),
  ]);

  // SubjectMedium links
  await Promise.all([
    prisma.subjectMedium.upsert({
      where: {
        subjectId_mediumId: {
          subjectId: subjectMaths.id,
          mediumId: mediumTA.id,
        },
      },
      update: {},
      create: { subjectId: subjectMaths.id, mediumId: mediumTA.id },
    }),
    prisma.subjectMedium.upsert({
      where: {
        subjectId_mediumId: {
          subjectId: subjectMaths.id,
          mediumId: mediumEN.id,
        },
      },
      update: {},
      create: { subjectId: subjectMaths.id, mediumId: mediumEN.id },
    }),
    prisma.subjectMedium.upsert({
      where: {
        subjectId_mediumId: {
          subjectId: subjectScience.id,
          mediumId: mediumTA.id,
        },
      },
      update: {},
      create: { subjectId: subjectScience.id, mediumId: mediumTA.id },
    }),
  ]);

  // ------------------------------------------------
  // 2. LOCATION & INSTITUTION (kept minimal for transfer portal)
  // ------------------------------------------------
  const provinceNorth = await prisma.province.upsert({
    where: { name: "Northern Province" },
    update: {},
    create: { name: "Northern Province", code: "NP" },
  });

  const districtJaffna = await prisma.district.upsert({
    where: { name: "Jaffna" },
    update: {},
    create: {
      name: "Jaffna",
      code: "JAFFNA",
      provinceId: provinceNorth.id,
    },
  });

  const zoneJaffna = await prisma.zone.upsert({
    where: { name: "Jaffna Zone" },
    update: {},
    create: {
      name: "Jaffna Zone",
      code: "JFNZ",
      districtId: districtJaffna.id,
    },
  });

  const institutionPulamai = await prisma.institution.upsert({
    where: { code: "PULAMAI" },
    update: {},
    create: {
      name: "Pulamai Viththakan",
      code: "PULAMAI",
      type: "PRIVATE_TUTOR",
      zoneId: zoneJaffna.id,
      isActive: true,
    },
  });

  // ------------------------------------------------
  // 3. USERS
  // ------------------------------------------------
  const superAdmin = await prisma.user.upsert({
    where: { phone: "+94770000001" },
    update: {},
    create: {
      phone: "+94770000001",
      email: "superadmin@armigo.lk",
      password: passwordHash,
      firstName: "Super",
      lastName: "Admin",
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      twoFactorEnabled: false,
      twoFactorBackupCodes: [],
      passwordHistory: [],
    },
  });

  const admin = await prisma.user.upsert({
    where: { phone: "+94770000002" },
    update: {},
    create: {
      phone: "+94770000002",
      email: "admin@armigo.lk",
      password: passwordHash,
      firstName: "Main",
      lastName: "Admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      districtId: districtJaffna.id,
      twoFactorEnabled: false,
      twoFactorBackupCodes: [],
      passwordHistory: [],
    },
  });

  const internalTeacherMath = await prisma.user.upsert({
    where: { phone: "+94770000003" },
    update: {},
    create: {
      phone: "+94770000003",
      email: "teacher.maths@armigo.lk",
      password: passwordHash,
      firstName: "Manoj",
      lastName: "Maths",
      role: UserRole.INTERNAL_TEACHER,
      status: UserStatus.ACTIVE,
      districtId: districtJaffna.id,
      twoFactorEnabled: false,
      twoFactorBackupCodes: [],
      passwordHistory: [],
    },
  });

  const internalTeacherScience = await prisma.user.upsert({
    where: { phone: "+94770000007" },
    update: {},
    create: {
      phone: "+94770000007",
      email: "doctor@armigo.lk",
      password: passwordHash,
      firstName: "Kavitha",
      lastName: "Science",
      role: UserRole.INTERNAL_TEACHER,
      status: UserStatus.ACTIVE,
      districtId: districtJaffna.id,
      twoFactorEnabled: false,
      twoFactorBackupCodes: [],
      passwordHistory: [],
    },
  });

  const externalTeacher = await prisma.user.upsert({
    where: { phone: "+94770000004" },
    update: {},
    create: {
      phone: "+94770000004",
      email: "external.teacher@armigo.lk",
      password: passwordHash,
      firstName: "Kumar",
      lastName: "Transfer",
      role: UserRole.EXTERNAL_TEACHER,
      status: UserStatus.ACTIVE,
      districtId: districtJaffna.id,
      twoFactorEnabled: false,
      twoFactorBackupCodes: [],
      passwordHistory: [],
    },
  });

  const internalStudent = await prisma.user.upsert({
    where: { phone: "+94770000005" },
    update: {},
    create: {
      phone: "+94770000005",
      email: "student.internal10@armigo.lk",
      password: passwordHash,
      firstName: "Nimal",
      lastName: "Internal",
      role: UserRole.INTERNAL_STUDENT,
      status: UserStatus.ACTIVE,
      districtId: districtJaffna.id,
      twoFactorEnabled: false,
      twoFactorBackupCodes: [],
      passwordHistory: [],
    },
  });

  const externalStudent = await prisma.user.upsert({
    where: { phone: "+94770000006" },
    update: {},
    create: {
      phone: "+94770000006",
      email: "student.external@armigo.lk",
      password: passwordHash,
      firstName: "Suresh",
      lastName: "External",
      role: UserRole.EXTERNAL_STUDENT,
      status: UserStatus.ACTIVE,
      districtId: districtJaffna.id,
      twoFactorEnabled: false,
      twoFactorBackupCodes: [],
      passwordHistory: [],
    },
  });

  const internalStudent11 = await prisma.user.upsert({
    where: { phone: "+94770000008" },
    update: {},
    create: {
      phone: "+94770000008",
      email: "student.internal11@armigo.lk",
      password: passwordHash,
      firstName: "Deepa",
      lastName: "Internal",
      role: UserRole.INTERNAL_STUDENT,
      status: UserStatus.ACTIVE,
      districtId: districtJaffna.id,
      twoFactorEnabled: false,
      twoFactorBackupCodes: [],
      passwordHistory: [],
    },
  });

  // ------------------------------------------------
  // 4. PROFILES
  // ------------------------------------------------
  const teacherProfileInternalMath = await prisma.teacherProfile.upsert({
    where: { userId: internalTeacherMath.id },
    update: {},
    create: {
      userId: internalTeacherMath.id,
      employeeId: "TCH-MATH-001",
      department: "Mathematics",
      specialization: "O/L & A/L Maths",
      experience: 8,
      qualifications: ["B.Ed (Maths)", "PGDE"],
      canCreateExams: true,
      canMonitorExams: true,
      canManageClasses: true,
      maxClassesPerWeek: 20,
      institutionId: institutionPulamai.id,
      certifications: [],
    },
  });

  const teacherProfileInternalScience = await prisma.teacherProfile.upsert({
    where: { userId: internalTeacherScience.id },
    update: {},
    create: {
      userId: internalTeacherScience.id,
      employeeId: "TCH-SCI-001",
      department: "Science",
      specialization: "O/L Science",
      experience: 5,
      qualifications: ["B.Ed (Science)"],
      canCreateExams: true,
      canMonitorExams: true,
      canManageClasses: true,
      maxClassesPerWeek: 18,
      institutionId: institutionPulamai.id,
      certifications: [],
    },
  });

  const teacherProfileExternal = await prisma.teacherProfile.upsert({
    where: { userId: externalTeacher.id },
    update: {},
    create: {
      userId: externalTeacher.id,
      employeeId: "EXT-TEACH-001",
      department: "Government School",
      specialization: "Combined Maths",
      experience: 10,
      qualifications: ["BSc (Physical Science)"],
      canCreateExams: false,
      canMonitorExams: false,
      canManageClasses: false,
      maxClassesPerWeek: 0,
      sourceInstitution: "Govt. School - Jaffna",
      certifications: [],
      isExternalTransferOnly: true,
    },
  });

  const internalStudentProfile = await prisma.studentProfile.upsert({
    where: { userId: internalStudent.id },
    update: {},
    create: {
      userId: internalStudent.id,
      // Generate proper registration number: INSTITUTION/TYPE/AL_BATCH_YEAR/SEQUENCE
      // Grade 10 in 2025: A/L batch year = 2025 + (13 - 10) + 1 = 2029
      studentId: sequenceTracker.getNextRegistrationNumber(
        UserRole.INTERNAL_STUDENT,
        10, // Grade 10
        "PV"
      ),
      gradeId: grade10.id,
      mediumId: mediumTA.id,
      batchId: batch10_01.id,
      academicYear: academicYear2025.year,
      guardianName: "Mr. Internal Father",
      guardianPhone: "+94770000010",
      schoolName: "Pulamai Viththakan",
      preferredSubjects: [subjectMaths.name, subjectScience.name],
    },
  });

  const externalStudentProfile = await prisma.studentProfile.upsert({
    where: { userId: externalStudent.id },
    update: {},
    create: {
      userId: externalStudent.id,
      // External student gets "EX" in registration number
      studentId: sequenceTracker.getNextRegistrationNumber(
        UserRole.EXTERNAL_STUDENT,
        10, // Grade 10
        "PV"
      ),
      gradeId: grade10.id,
      mediumId: mediumEN.id,
      academicYear: academicYear2025.year,
      guardianName: "Mr. External Father",
      guardianPhone: "+94770000011",
      schoolName: "External School A",
      preferredSubjects: [subjectMaths.name],
    },
  });

  const internalStudentProfile11 = await prisma.studentProfile.upsert({
    where: { userId: internalStudent11.id },
    update: {},
    create: {
      userId: internalStudent11.id,
      // Grade 11 in 2025: A/L batch year = 2025 + (13 - 11) + 1 = 2028
      studentId: sequenceTracker.getNextRegistrationNumber(
        UserRole.INTERNAL_STUDENT,
        11, // Grade 11
        "PV"
      ),
      gradeId: grade11.id,
      mediumId: mediumEN.id,
      batchId: batch11_01.id,
      academicYear: academicYear2025.year,
      guardianName: "Mr. Internal Father 11",
      guardianPhone: "+94770000012",
      schoolName: "Pulamai Viththakan",
      preferredSubjects: [subjectMaths.name],
    },
  });

  // StudentSubject links
  await Promise.all([
    prisma.studentSubject.upsert({
      where: {
        studentProfileId_subjectId_academicYearId: {
          studentProfileId: internalStudentProfile.id,
          subjectId: subjectMaths.id,
          academicYearId: academicYear2025.id,
        },
      },
      update: {},
      create: {
        studentProfileId: internalStudentProfile.id,
        subjectId: subjectMaths.id,
        academicYearId: academicYear2025.id,
        isActive: true,
      },
    }),
    prisma.studentSubject.upsert({
      where: {
        studentProfileId_subjectId_academicYearId: {
          studentProfileId: internalStudentProfile.id,
          subjectId: subjectScience.id,
          academicYearId: academicYear2025.id,
        },
      },
      update: {},
      create: {
        studentProfileId: internalStudentProfile.id,
        subjectId: subjectScience.id,
        academicYearId: academicYear2025.id,
        isActive: true,
      },
    }),
    prisma.studentSubject.upsert({
      where: {
        studentProfileId_subjectId_academicYearId: {
          studentProfileId: internalStudentProfile11.id,
          subjectId: subjectMaths.id,
          academicYearId: academicYear2025.id,
        },
      },
      update: {},
      create: {
        studentProfileId: internalStudentProfile11.id,
        subjectId: subjectMaths.id,
        academicYearId: academicYear2025.id,
        isActive: true,
      },
    }),
  ]);

  // ------------------------------------------------
  // 5. TEACHER ASSIGNMENTS
  // ------------------------------------------------
  const teacherMathAssignment = await prisma.teacherSubjectAssignment.upsert({
    where: {
      teacherProfileId_subjectId_gradeId_mediumId_academicYearId: {
        teacherProfileId: teacherProfileInternalMath.id,
        subjectId: subjectMaths.id,
        gradeId: grade10.id,
        mediumId: mediumTA.id,
        academicYearId: academicYear2025.id,
      },
    },
    update: {},
    create: {
      teacherProfileId: teacherProfileInternalMath.id,
      subjectId: subjectMaths.id,
      gradeId: grade10.id,
      mediumId: mediumTA.id,
      academicYearId: academicYear2025.id,
      isActive: true,
      canCreateExams: true,
      maxStudents: 200,
    },
  });

  const teacherScienceAssignment = await prisma.teacherSubjectAssignment.upsert(
    {
      where: {
        teacherProfileId_subjectId_gradeId_mediumId_academicYearId: {
          teacherProfileId: teacherProfileInternalScience.id,
          subjectId: subjectScience.id,
          gradeId: grade10.id,
          mediumId: mediumTA.id,
          academicYearId: academicYear2025.id,
        },
      },
      update: {},
      create: {
        teacherProfileId: teacherProfileInternalScience.id,
        subjectId: subjectScience.id,
        gradeId: grade10.id,
        mediumId: mediumTA.id,
        academicYearId: academicYear2025.id,
        isActive: true,
        canCreateExams: true,
        maxStudents: 150,
      },
    }
  );

  // ------------------------------------------------
  // 6. CLASS, TIMETABLE, SESSION, VIDEO
  // ------------------------------------------------
  const mathClass10 = await prisma.class.create({
    data: {
      name: "Grade 10 Mathematics - Batch 01",
      description: "Online class for Grade 10 Mathematics (Batch 01)",
      batchId: batch10_01.id,
      status: ClassStatus.ACTIVE,
      maxStudents: 200,
      isPublic: true,
      requiresApproval: true,
      isLive: false,
      teacherId: internalTeacherMath.id,
      subjectId: subjectMaths.id,
      gradeId: grade10.id,
      mediumId: mediumTA.id,
      teacherAssignmentId: teacherMathAssignment.id,
    },
  });

  const scienceClass10 = await prisma.class.create({
    data: {
      name: "Grade 10 Science - Batch 01",
      description: "Online class for Grade 10 Science (Batch 01)",
      batchId: batch10_01.id,
      status: ClassStatus.DRAFT,
      maxStudents: 150,
      isPublic: false,
      requiresApproval: true,
      isLive: false,
      teacherId: internalTeacherScience.id,
      subjectId: subjectScience.id,
      gradeId: grade10.id,
      mediumId: mediumTA.id,
      teacherAssignmentId: teacherScienceAssignment.id,
    },
  });

  const mathTimetable = await prisma.timetable.create({
    data: {
      teacherId: internalTeacherMath.id,
      subjectId: subjectMaths.id,
      gradeId: grade10.id,
      mediumId: mediumTA.id,
      teacherAssignmentId: teacherMathAssignment.id,
      classLink: `https://${process.env.JITSI_DOMAIN || "localhost:8443"}/grade10-maths`,
      classId: mathClass10.id,
      dayOfWeek: 6,
      startTime: "10:00",
      endTime: "12:00",
      validFrom: new Date("2025-01-05T00:00:00Z"),
      validUntil: new Date("2025-12-31T23:59:59Z"),
      recurring: true,
      active: true,
      academicYearId: academicYear2025.id,
      term: 1,
      batchId: batch10_01.id,
      createdBy: admin.id,
    },
  });

  const scienceTimetable = await prisma.timetable.create({
    data: {
      teacherId: internalTeacherScience.id,
      subjectId: subjectScience.id,
      gradeId: grade10.id,
      mediumId: mediumTA.id,
      teacherAssignmentId: teacherScienceAssignment.id,
      classLink: `https://${process.env.JITSI_DOMAIN || "localhost:8443"}/grade10-science`,
      classId: scienceClass10.id,
      dayOfWeek: 0, // Sunday
      startTime: "08:00",
      endTime: "10:00",
      validFrom: new Date("2025-01-05T00:00:00Z"),
      validUntil: new Date("2025-12-31T23:59:59Z"),
      recurring: true,
      active: true,
      academicYearId: academicYear2025.id,
      term: 1,
      batchId: batch10_01.id,
      createdBy: admin.id,
    },
  });

  const sessionDate = new Date("2025-02-01T10:00:00Z");
  const classSession = await prisma.classSession.create({
    data: {
      classId: mathClass10.id,
      timetableId: mathTimetable.id,
      date: sessionDate,
      startTime: sessionDate,
      endTime: new Date("2025-02-01T12:00:00Z"),
      status: SessionStatus.SCHEDULED,
    },
  });

  const videoSession = await prisma.videoSession.create({
    data: {
      classId: mathClass10.id,
      hostId: internalTeacherMath.id,
      title: "Grade 10 Maths - Live Class",
      description: "Algebra and basic functions",
      status: SessionStatus.SCHEDULED,
      scheduledStartTime: sessionDate,
      durationMinutes: 120,
      jitsiRoomName: "grade10-maths-2025-02-01",
      jitsiDomain: process.env.JITSI_DOMAIN || "localhost:8443",
      maxParticipants: 200,
      createdById: internalTeacherMath.id,
    },
  });

  await prisma.classSession.update({
    where: { id: classSession.id },
    data: { videoSessionId: videoSession.id },
  });

  const mathEnrollment = await prisma.enrollment.create({
    data: {
      classId: mathClass10.id,
      studentId: internalStudent.id,
      status: EnrollmentStatus.ACTIVE,
      progress: 0,
      isPaid: true,
    },
  });

  const scienceEnrollment = await prisma.enrollment.create({
    data: {
      classId: scienceClass10.id,
      studentId: internalStudent.id,
      status: EnrollmentStatus.PENDING,
      progress: 0,
      isPaid: false,
    },
  });

  // sample attendance for class
  await prisma.attendance.create({
    data: {
      userId: internalStudent.id,
      date: sessionDate,
      type: AttendanceType.CLASS,
      classId: mathClass10.id,
      classSessionId: classSession.id,
      videoSessionId: videoSession.id,
      present: true,
      joinTime: sessionDate,
      leaveTime: new Date("2025-02-01T12:00:00Z"),
      duration: 120,
    },
  });

  // ------------------------------------------------
  // 7. EXAM + QUESTION + ATTEMPT
  // ------------------------------------------------
  const mathExam = await prisma.exam.create({
    data: {
      title: "Grade 10 Maths - Algebra Test",
      description: "Test on basic algebra",
      type: ExamType.MIXED,
      format: ExamFormat.FULL_ONLINE,
      status: ExamStatus.PENDING_APPROVAL,
      approvalStatus: ApprovalStatus.PENDING,
      duration: 60,
      totalMarks: 100,
      passingMarks: 40,
      attemptsAllowed: 1,
      part1Marks: 100,
      allowFileUpload: false,
      allowedFileTypes: [],
      enableRanking: true,
      rankingLevels: [
        RankingLevel.NATIONAL,
        RankingLevel.DISTRICT,
        RankingLevel.ZONAL,
      ],
      aiMonitoringEnabled: true,
      faceVerificationRequired: true,
      browseLockEnabled: true,
      startTime: new Date("2025-02-10T09:00:00Z"),
      endTime: new Date("2025-02-10T10:00:00Z"),
      timeZone: "Asia/Colombo",
      classId: mathClass10.id,
      createdById: internalTeacherMath.id,
      subjectId: subjectMaths.id,
      gradeId: grade10.id,
      mediumId: mediumTA.id,
      academicYearId: academicYear2025.id,
      instructions: "Please sit in a quiet room. Camera must be on.",
      allowedResources: "Pen, paper, calculator (non-programmable)",
    },
  });

  const scienceExam = await prisma.exam.create({
    data: {
      title: "Grade 10 Science - Biology Basics",
      description: "Short test on cells & tissues",
      type: ExamType.MULTIPLE_CHOICE,
      format: ExamFormat.FULL_ONLINE,
      status: ExamStatus.DRAFT,
      approvalStatus: ApprovalStatus.PENDING,
      duration: 45,
      totalMarks: 50,
      passingMarks: 20,
      attemptsAllowed: 2,
      allowFileUpload: false,
      allowedFileTypes: [],
      enableRanking: false,
      aiMonitoringEnabled: false,
      faceVerificationRequired: false,
      browseLockEnabled: false,
      startTime: new Date("2025-02-15T09:00:00Z"),
      endTime: new Date("2025-02-15T09:45:00Z"),
      timeZone: "Asia/Colombo",
      classId: scienceClass10.id,
      createdById: internalTeacherScience.id,
      subjectId: subjectScience.id,
      gradeId: grade10.id,
      mediumId: mediumTA.id,
      academicYearId: academicYear2025.id,
      instructions: "Read each MCQ carefully.",
      allowedResources: "Pen and rough paper only",
    },
  });

  const examQuestion1 = await prisma.examQuestion.create({
    data: {
      examId: mathExam.id,
      type: QuestionType.MULTIPLE_CHOICE,
      question: "What is 2 + 3?",
      options: JSON.stringify(["3", "4", "5", "6"]),
      correctAnswer: "5",
      points: 5,
      order: 1,
      examPart: 1,
      section: "PART_I",
    },
  });

  const mathExamAttempt = await prisma.examAttempt.create({
    data: {
      examId: mathExam.id,
      studentId: internalStudent.id,
      status: "GRADED",
      attemptNumber: 1,
      startedAt: new Date("2025-02-10T09:05:00Z"),
      submittedAt: new Date("2025-02-10T09:30:00Z"),
      maxScore: 100,
      totalScore: 5,
      part1Score: 5,
      percentage: 5,
      passed: false,
      uploadedFiles: [],
      suspiciousActivityCount: 0,
    },
  });

  await prisma.examAnswer.create({
    data: {
      attemptId: mathExamAttempt.id,
      questionId: examQuestion1.id,
      answer: "5",
      isCorrect: true,
      pointsAwarded: 5,
      timeSpent: 30,
    },
  });

  // Ranking for that exam
  await prisma.examRanking.upsert({
    where: {
      examId_studentId: {
        examId: mathExam.id,
        studentId: internalStudent.id,
      },
    },
    update: {},
    create: {
      examId: mathExam.id,
      studentId: internalStudent.id,
      studentType: "INTERNAL",
      score: 5,
      percentage: 5,
      district: "Jaffna",
      zone: "Jaffna Zone",
      islandRank: 1200,
      districtRank: 50,
      zoneRank: 10,
      totalIsland: 5000,
      totalDistrict: 500,
      totalZone: 120,
    },
  });

  // ------------------------------------------------
  // 9. WALLET, TRANSACTIONS, PAYMENTS
  // ------------------------------------------------
  const walletExternalStudent = await prisma.wallet.upsert({
    where: { userId: externalStudent.id },
    update: {},
    create: {
      userId: externalStudent.id,
      balance: 1000,
      totalCredits: 1000,
      totalDebits: 0,
      minBalance: 0,
    },
  });

  const walletTopupTx = await prisma.walletTransaction.create({
    data: {
      walletId: walletExternalStudent.id,
      amount: 1000,
      type: TransactionType.CREDIT,
      balanceBefore: 0,
      balanceAfter: 1000,
      description: "Initial top-up (10 exams bundle)",
      reference: "TOPUP-001",
      referenceType: "WALLET_TOPUP",
    },
  });

  const paymentExternalExam = await prisma.payment.create({
    data: {
      userId: externalStudent.id,
      amount: 1000,
      currency: "LKR",
      status: PaymentStatus.COMPLETED,
      method: PaymentMethod.WALLET_CREDITS,
      description: "Bundle of 10 exam credits",
      referenceType: "EXAM_BUNDLE",
      referenceId: "BUNDLE-EXAM-10",
      processedAt: new Date(),
    },
  });

  const paymentInternalMonthly = await prisma.payment.create({
    data: {
      userId: internalStudent.id,
      amount: 2500,
      currency: "LKR",
      status: PaymentStatus.PROCESSING,
      method: PaymentMethod.BANK_SLIP,
      description: "Monthly fee - February 2025",
      referenceType: "MONTHLY_FEE",
      referenceId: "MF-2025-02",
      bankSlipUrl: "https://files.learnapp.local/slips/internal-stu-feb.png",
    },
  });

  // Match payment with TrackerPlus-like reconciliation
  await prisma.paymentReconciliation.create({
    data: {
      paymentId: paymentInternalMonthly.id,
      trackerPlusRefId: "TP-2025-0001",
      trackerPlusAmount: 2500,
      trackerPlusDate: new Date("2025-02-05T00:00:00Z"),
      trackerPlusStudentId: internalStudentProfile.studentId,
      trackerPlusStudentName: `${internalStudent.firstName} ${internalStudent.lastName}`,
      trackerPlusDescription: "Monthly fee - February 2025",
      trackerPlusMetadata: JSON.stringify({ month: "2025-02" }),
      internalAmount: 2500,
      internalDate: new Date("2025-02-06T00:00:00Z"),
      status: "MATCHED",
      type: "AUTO_MATCHED",
      discrepancyAmount: 0,
      matchedBy: admin.id,
      matchedAt: new Date(),
    },
  });

  // Invoice linked to payment
  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2025-0001",
      studentId: internalStudent.id,
      type: "MONTHLY_FEE",
      status: "PAID",
      items: {
        lineItems: [
          {
            description: "Grade 10 Monthly Fee - February 2025",
            quantity: 1,
            unitPrice: 2500,
            total: 2500,
          },
        ],
      },
      subtotal: 2500,
      tax: 0,
      discount: 0,
      total: 2500,
      dueDate: new Date("2025-02-10T00:00:00Z"),
      issuedDate: new Date("2025-02-01T00:00:00Z"),
      paidAt: new Date("2025-02-05T00:00:00Z"),
      paymentId: paymentInternalMonthly.id,
      notes: "Paid via bank slip (TrackerPlus ref TP-2025-0001).",
      metadata: {
        month: "2025-02",
      },
      createdById: admin.id,
    },
  });

  // ------------------------------------------------
  // 10. PUBLICATIONS & SEMINAR
  // ------------------------------------------------
  const mathsPublication = await prisma.publication.create({
    data: {
      title: "Grade 10 Maths Revision Book",
      description: "Comprehensive revision book for Grade 10 Mathematics.",
      shortDescription: "G10 Maths revision",
      coverImage: "https://files.learnapp.local/covers/g10-maths.png",
      price: 1500,
      fileUrl: "https://files.learnapp.local/publications/g10-maths.pdf",
      fileSize: 2_000_000,
      fileType: "application/pdf",
      author: "Pulamai Viththakan",
      publisher: "Pulamai Viththakan",
      isbn: "978-624-0000001",
      status: PublicationStatus.PUBLISHED,
      publishedAt: new Date("2025-01-20T00:00:00Z"),
      createdById: admin.id,
    },
  });

  await prisma.publicationGrade.create({
    data: { publicationId: mathsPublication.id, gradeId: grade10.id },
  });
  await prisma.publicationSubject.create({
    data: { publicationId: mathsPublication.id, subjectId: subjectMaths.id },
  });
  await prisma.publicationMedium.create({
    data: { publicationId: mathsPublication.id, mediumId: mediumTA.id },
  });

  // Student buys the publication
  await prisma.publicationPurchase.upsert({
    where: {
      publicationId_userId: {
        publicationId: mathsPublication.id,
        userId: internalStudent.id,
      },
    },
    update: {},
    create: {
      publicationId: mathsPublication.id,
      userId: internalStudent.id,
      amount: 1500,
      maxDownloads: 5,
      accessExpiry: new Date("2026-01-20T00:00:00Z"),
    },
  });

  // Student review
  await prisma.publicationReview.upsert({
    where: {
      publicationId_userId: {
        publicationId: mathsPublication.id,
        userId: internalStudent.id,
      },
    },
    update: {
      rating: 5,
      comment: "Very helpful book for revision.",
    },
    create: {
      publicationId: mathsPublication.id,
      userId: internalStudent.id,
      rating: 5,
      comment: "Very helpful book for revision.",
    },
  });

  const seminarMaths = await prisma.seminar.create({
    data: {
      title: "Maths Exam Tips Seminar",
      description: "Online seminar to guide students on exam techniques.",
      speakerName: "Manoj Maths",
      speakerBio: "O/L & A/L Maths specialist",
      topic: "Exam Techniques",
      targetAudience: ["Grade 10", "Grade 11"],
      scheduledAt: new Date("2025-03-01T09:00:00Z"),
      duration: 90,
      meetingLink: `https://${process.env.JITSI_DOMAIN || "localhost:8443"}/maths-seminar-2025-03-01`,
      isPublic: true,
      requiresSignup: false,
      status: SeminarStatus.SCHEDULED,
      createdById: admin.id,
    },
  });

  // Seminar registration
  await prisma.seminarRegistration.create({
    data: {
      seminarId: seminarMaths.id,
      userId: internalStudent.id,
      name: `${internalStudent.firstName} ${internalStudent.lastName}`,
      email: internalStudent.email ?? "internal.student@example.com",
      phone: internalStudent.phone,
      attended: false,
    },
  });

  // ------------------------------------------------
  // 11. MUTUAL TRANSFER SAMPLE
  // ------------------------------------------------
  const transferRequest = await prisma.transferRequest.create({
    data: {
      uniqueId: "TRF-2025-0001",
      requesterId: externalTeacher.id,
      fromZoneId: zoneJaffna.id,
      subjectId: subjectMaths.id,
      mediumId: mediumEN.id,
      level: "O/L",
      currentSchool: "Govt. School A",
      currentSchoolType: "1AB",
      currentDistrictId: districtJaffna.id,
      yearsOfService: 8,
      qualifications: ["BSc (Maths)", "PGDE"],
      isInternalTeacher: false,
      preferredSchoolTypes: ["1AB", "1C"],
      status: "PENDING",
      verified: false,
      attachments: [],
    },
  });

  await prisma.transferRequestDesiredZone.create({
    data: {
      transferRequestId: transferRequest.id,
      zoneId: zoneJaffna.id,
      priority: 1,
    },
  });

  // Simple message on the transfer thread
  await prisma.transferMessage.create({
    data: {
      transferRequestId: transferRequest.id,
      senderId: externalTeacher.id,
      content: "Looking for mutual transfer within Jaffna Zone.",
    },
  });

  // ------------------------------------------------
  // 12. SETTINGS, FEATURE FLAGS, ANNOUNCEMENT, NOTIF, CHAT
  // ------------------------------------------------
  await prisma.systemSettings.upsert({
    where: { key: "exam.aiMonitoring.defaultEnabled" },
    update: { value: "true" },
    create: {
      key: "exam.aiMonitoring.defaultEnabled",
      value: "true",
      type: SettingType.BOOLEAN,
      category: "exam",
      description: "Default enable AI monitoring for new exams",
      isPublic: false,
      isEditable: true,
      updatedBy: superAdmin.id,
    },
  });

  await prisma.systemSettings.upsert({
    where: { key: "recording.autoDeleteDays" },
    update: { value: "30" },
    create: {
      key: "recording.autoDeleteDays",
      value: "30",
      type: SettingType.NUMBER,
      category: "recording",
      description: "Number of days to keep recordings",
      isPublic: false,
      isEditable: true,
      updatedBy: superAdmin.id,
    },
  });

  await prisma.featureFlag.upsert({
    where: { key: "ai-proctoring" },
    update: { enabled: true },
    create: {
      name: "AI Proctoring",
      key: "ai-proctoring",
      enabled: true,
      description: "Enable AI-based exam monitoring",
      rolloutPercentage: 100,
      targetRoles: [
        UserRole.INTERNAL_TEACHER,
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
      ],
      targetUsers: [],
      metadata: {},
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id,
    },
  });

  const welcomeAnnouncement = await prisma.announcement.create({
    data: {
      title: "Welcome to Learn App",
      content: "Classes and exams for 2025 are now available.",
      type: AnnouncementType.GENERAL,
      priority: AnnouncementPriority.NORMAL,
      targetRoles: [
        UserRole.INTERNAL_STUDENT,
        UserRole.EXTERNAL_STUDENT,
        UserRole.INTERNAL_TEACHER,
      ],
      isActive: true,
      createdById: admin.id,
      attachments: [],
    },
  });

  await prisma.announcementGrade.create({
    data: {
      announcementId: welcomeAnnouncement.id,
      gradeId: grade10.id,
    },
  });

  await prisma.announcementRead.create({
    data: {
      announcementId: welcomeAnnouncement.id,
      userId: internalStudent.id,
      readAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: internalStudent.id,
      type: NotificationType.EXAM_REMINDER,
      status: NotificationStatus.UNREAD,
      title: "Upcoming Algebra Test",
      message:
        "Your Grade 10 Maths Algebra Test is scheduled on 10 Feb 2025 at 9:00 AM.",
      sentAt: new Date(),
    },
  });

  await prisma.chatMessage.create({
    data: {
      fromId: internalStudent.id,
      toId: internalTeacherMath.id,
      messageType: ChatMessageType.DIRECT,
      content: "Sir, can you send today’s notes?",
      attachments: [],
      approvalStatus: MessageApprovalStatus.PENDING,
      metadata: {},
    },
  });

  // FaceRecognition pending (for admin verification queue)
  await prisma.faceRecognition.upsert({
    where: { userId: internalStudent.id },
    update: {},
    create: {
      userId: internalStudent.id,
      faceEncodingData: "PENDING_ENCODING",
      verificationVideo:
        "https://files.learnapp.local/face/internalStudent.mp4",
      verified: false,
    },
  });

  // Permissions minimal for admin/teacher UI
  const [permManageUsers, permManageExams] = await Promise.all([
    prisma.permission.upsert({
      where: { key: "users.manage" },
      update: {},
      create: {
        key: "users.manage",
        name: "Manage Users",
        category: "users",
        description: "Create/edit/disable users",
      },
    }),
    prisma.permission.upsert({
      where: { key: "exams.manage" },
      update: {},
      create: {
        key: "exams.manage",
        name: "Manage Exams",
        category: "exams",
        description: "Create/approve/publish exams",
      },
    }),
  ]);

  await prisma.rolePermission.upsert({
    where: {
      role_permissionId: {
        role: UserRole.ADMIN,
        permissionId: permManageUsers.id,
      },
    },
    update: {},
    create: { role: UserRole.ADMIN, permissionId: permManageUsers.id },
  });
  await prisma.rolePermission.upsert({
    where: {
      role_permissionId: {
        role: UserRole.INTERNAL_TEACHER,
        permissionId: permManageExams.id,
      },
    },
    update: {},
    create: {
      role: UserRole.INTERNAL_TEACHER,
      permissionId: permManageExams.id,
    },
  });

  // ------------------------------------------------
  // 13. LEAVE, RESCHEDULING, EXCEPTIONS, TEMP ACCESS
  // ------------------------------------------------
  const teacherLeave = await prisma.teacherAvailability.create({
    data: {
      teacherId: internalTeacherMath.id,
      leaveType: "SICK_LEAVE",
      startDate: new Date("2025-02-08T00:00:00Z"),
      endDate: new Date("2025-02-08T23:59:59Z"),
      reason: "Fever and rest recommended by doctor",
      status: "APPROVED",
      replacementTeacherId: null,
      replacementApproved: false,
      affectedClassIds: [mathClass10.id],
      autoRescheduled: true,
      requestedBy: internalTeacherMath.id,
      approvedBy: admin.id,
      approvedAt: new Date("2025-02-07T10:00:00Z"),
    },
  });

  await prisma.classRescheduling.create({
    data: {
      originalClassId: mathClass10.id,
      originalDate: new Date("2025-02-08T10:00:00Z"),
      originalStartTime: new Date("2025-02-08T10:00:00Z"),
      originalEndTime: new Date("2025-02-08T12:00:00Z"),
      newDate: new Date("2025-02-09T10:00:00Z"),
      newStartTime: new Date("2025-02-09T10:00:00Z"),
      newEndTime: new Date("2025-02-09T12:00:00Z"),
      teacherId: internalTeacherMath.id,
      reason: "TEACHER_LEAVE",
      reasonDetails: "Rescheduled due to approved sick leave.",
      status: "APPROVED",
      studentsNotified: true,
      notificationSentAt: new Date("2025-02-07T12:00:00Z"),
      hasConflicts: false,
      affectedStudentIds: [internalStudent.id],
      requestedBy: internalTeacherMath.id,
      approvedBy: admin.id,
      approvedAt: new Date("2025-02-07T11:00:00Z"),
    },
  });

  /* Model removed - examException
  await prisma.examException.create({
    data: {
      examId: mathExam.id,
      studentId: internalStudent.id,
      exceptionType: "TIME_EXTENSION",
      reason: "Internet connectivity issues; needs extra 15 minutes.",
      timeExtension: 15,
      status: "APPROVED",
      requestedBy: internalTeacherMath.id,
      approvedBy: admin.id,
      approvedAt: new Date("2025-02-09T10:00:00Z"),
      appliedAt: new Date("2025-02-10T09:00:00Z"),
    },
  });
  */

  await prisma.temporaryAccess.create({
    data: {
      userId: externalStudent.id,
      grantedBy: admin.id,
      resourceType: "EXAM",
      resourceId: mathExam.id,
      startDate: new Date("2025-02-09T00:00:00Z"),
      expiresAt: new Date("2025-02-11T00:00:00Z"),
      reason: "Pilot access for external student",
      active: true,
    },
  });

  // ------------------------------------------------
  // 14. STUDENT PROGRESS, PROMOTION, ATTENDANCE SUMMARY
  // ------------------------------------------------
  await prisma.studentProgress.upsert({
    where: { studentId: internalStudent.id },
    update: {},
    create: {
      studentId: internalStudent.id,
      currentGPA: 3.8,
      cumulativeGPA: 3.8,
      totalCredits: 8,
      completedCourses: 2,
      ongoingCourses: 3,
      attendanceRate: 0.95,
      rank: 5,
      totalStudents: 120,
      academicYear: academicYear2025.year,
    },
  });

  await prisma.attendanceSummary.upsert({
    where: {
      userId_month_year: {
        userId: internalStudent.id,
        month: 2,
        year: 2025,
      },
    },
    update: {},
    create: {
      userId: internalStudent.id,
      month: 2,
      year: 2025,
      totalClasses: 4,
      attended: 4,
      percentage: 100,
      classesTotal: 4,
      classesAttended: 4,
      examsTotal: 1,
      examsAttended: 1,
    },
  });

  /* Model removed - studentPromotion
  await prisma.studentPromotion.create({
    data: {
      studentId: internalStudent.id,
      fromGradeId: grade10.id,
      toGradeId: grade11.id,
      fromBatch: "BATCH-01",
      toBatch: "BATCH-01",
      academicYear: academicYear2025.year,
      promotionDate: new Date("2025-12-20T00:00:00Z"),
      status: "APPROVED",
      promotionType: "STANDARD",
      performanceScore: 82,
      remarks: "Promoted based on exam performance and attendance.",
      approvedBy: superAdmin.id,
      approvedAt: new Date("2025-12-21T00:00:00Z"),
      createdBy: admin.id,
    },
  });
  */

  // ------------------------------------------------
  // 15. SYSTEM SETTINGS, BACKGROUND JOB, ANALYTICS, SECURITY
  // ------------------------------------------------
  await prisma.systemSettings.upsert({
    where: { key: "app.mode" },
    update: {},
    create: {
      key: "app.mode",
      value: "development",
      description: "Current application mode",
      type: "STRING",
      category: "system",
      isPublic: false,
      isEditable: true,
    },
  });

  await prisma.backgroundJob.create({
    data: {
      type: "recording_cleanup",
      status: "PENDING",
      priority: 1,
      payload: {
        autoDeleteAfterDays: 30,
      },
      scheduledFor: new Date("2025-03-01T00:00:00Z"),
    },
  });

  await prisma.analyticsEvent.create({
    data: {
      userId: internalStudent.id,
      event: "class_join",
      properties: {
        classId: mathClass10.id,
        via: "web",
      },
      ipAddress: "127.0.0.1",
      userAgent: "seed-script",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "CREATE",
      resource: "CLASS",
      resourceId: mathClass10.id,
      ipAddress: "127.0.0.1",
      userAgent: "seed-script",
      endpoint: "/api/admin/classes",
      httpMethod: "POST",
      newValues: JSON.stringify({ id: mathClass10.id, name: mathClass10.name }),
    },
  });

  await prisma.securityAuditLog.create({
    data: {
      userId: admin.id,
      action: "LOGIN_SUCCESS",
      resource: "AUTH",
      resourceId: "seed-login",
      ipAddress: "127.0.0.1",
      userAgent: "seed-script",
      deviceId: "seed-device",
      fingerprint: "seed-fp",
      success: true,
    },
  });

  await prisma.trustedIp.create({
    data: {
      userId: admin.id,
      ipAddress: "127.0.0.1",
      description: "Local development machine",
      addedBy: admin.id,
      isActive: true,
    },
  });

  const authSession = await prisma.authSession.create({
    data: {
      userId: internalStudent.id,
      fingerprint: "seed-fingerprint-1",
      deviceId: "device-1",
      deviceName: "Seed Laptop",
      deviceType: "desktop",
      browser: "Chrome",
      os: "Windows",
      ipAddress: "127.0.0.1",
      userAgent: "seed-script",
      isTrusted: false,
      expiresAt: new Date("2025-12-31T23:59:59Z"),
    },
  });

  await prisma.refreshToken.create({
    data: {
      token: "seed-refresh-token-1",
      userId: internalStudent.id,
      sessionId: authSession.id,
      expiresAt: new Date("2025-12-31T23:59:59Z"),
      deviceId: "device-1",
      ipAddress: "127.0.0.1",
      userAgent: "seed-script",
    },
  });

  await prisma.deviceToken.create({
    data: {
      userId: internalStudent.id,
      token: "seed-fcm-token-1",
      platform: "web",
    },
  });

  await prisma.accessTokenBlacklist.create({
    data: {
      token: "revoked-access-token-example",
      userId: internalStudent.id,
      reason: "Seed example of revoked token",
      expiresAt: new Date("2025-12-31T23:59:59Z"),
    },
  });

  await prisma.loginAttempt.create({
    data: {
      userId: internalStudent.id,
      identifier: internalStudent.email ?? internalStudent.phone,
      ipAddress: "127.0.0.1",
      userAgent: "seed-script",
      success: true,
      country: "Sri Lanka",
      city: "Jaffna",
    },
  });

  await prisma.csrfToken.create({
    data: {
      token: "seed-csrf-token",
      userId: internalStudent.id,
      sessionId: authSession.id,
      expiresAt: new Date("2025-12-31T23:59:59Z"),
    },
  });

  await prisma.passwordReset.create({
    data: {
      userId: internalStudent.id,
      token: "seed-password-reset-token",
      expiresAt: new Date("2025-12-31T23:59:59Z"),
      ipAddress: "127.0.0.1",
      userAgent: "seed-script",
    },
  });

  await prisma.systemErrorLog.create({
    data: {
      level: "ERROR",
      message: "Sample error logged from seed",
      route: "/api/sample",
      method: "GET",
      statusCode: 500,
      userId: internalStudent.id,
      errorCode: "SEED_ERROR",
      occurrences: 1,
    },
  });

  await prisma.feedback.create({
    data: {
      userId: internalStudent.id,
      type: "PLATFORM",
      rating: 5,
      comment: "App is very helpful.",
      status: "PENDING",
    },
  });

  // ------------------------------------------------
  // MARKING QUEUE TEST DATA
  // ------------------------------------------------
  console.log("🎯 Creating marking queue test data...");

  // Create an exam with essay and short answer questions
  const markingTestExam = await prisma.exam.create({
    data: {
      title: "Advanced Science Essay Exam",
      description: "Exam with essay questions for marking testing",
      type: ExamType.MIXED,
      format: ExamFormat.FULL_ONLINE,
      status: ExamStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED,
      duration: 120,
      totalMarks: 100,
      passingMarks: 50,
      part1Marks: 40,
      part2Marks: 60,
      startTime: new Date("2025-01-15T09:00:00Z"),
      endTime: new Date("2025-01-15T11:00:00Z"),
      classId: mathClass10.id,
      createdById: internalTeacherMath.id,
      subjectId: subjectScience.id,
      gradeId: grade10.id,
      mediumId: mediumTA.id,
      academicYearId: academicYear2025.id,
      instructions: "Answer all questions with detailed explanations.",
      showResults: false,
      useHierarchicalStructure: false,
    },
  });

  // Create ESSAY questions (Part 2 - Manual marking)
  const essayQuestion1 = await prisma.examQuestion.create({
    data: {
      examId: markingTestExam.id,
      type: QuestionType.ESSAY,
      question:
        "Explain the process of photosynthesis in detail. Include the light-dependent and light-independent reactions.",
      correctAnswer:
        "Photosynthesis involves light-dependent reactions in thylakoids producing ATP and NADPH, and light-independent Calvin cycle in stroma fixing CO2 into glucose.",
      points: 20,
      order: 1,
      examPart: 2,
      section: "PART_II",
    },
  });

  const essayQuestion2 = await prisma.examQuestion.create({
    data: {
      examId: markingTestExam.id,
      type: QuestionType.ESSAY,
      question:
        "Discuss the causes and effects of global warming. Suggest possible solutions.",
      correctAnswer:
        "Global warming is caused by greenhouse gas emissions, deforestation, and industrial activities. Effects include rising sea levels, extreme weather, and ecosystem damage. Solutions include renewable energy, reforestation, and carbon reduction policies.",
      points: 20,
      order: 2,
      examPart: 2,
      section: "PART_II",
    },
  });

  // Create SHORT_ANSWER questions (Part 2 - Manual marking)
  const shortAnswerQ1 = await prisma.examQuestion.create({
    data: {
      examId: markingTestExam.id,
      type: QuestionType.SHORT_ANSWER,
      question: "Define Newton's First Law of Motion and give one example.",
      correctAnswer:
        "An object at rest stays at rest and an object in motion stays in motion unless acted upon by an external force. Example: A ball rolling on the ground stops due to friction.",
      points: 10,
      order: 3,
      examPart: 2,
      section: "PART_II",
    },
  });

  const shortAnswerQ2 = await prisma.examQuestion.create({
    data: {
      examId: markingTestExam.id,
      type: QuestionType.SHORT_ANSWER,
      question: "What is the difference between mitosis and meiosis?",
      correctAnswer:
        "Mitosis produces 2 identical diploid cells for growth/repair. Meiosis produces 4 non-identical haploid cells for sexual reproduction.",
      points: 10,
      order: 4,
      examPart: 2,
      section: "PART_II",
    },
  });

  // Create multiple choice questions (Part 1 - Auto marked)
  const mcqQuestion1 = await prisma.examQuestion.create({
    data: {
      examId: markingTestExam.id,
      type: QuestionType.MULTIPLE_CHOICE,
      question: "What is the powerhouse of the cell?",
      options: JSON.stringify([
        "Nucleus",
        "Mitochondria",
        "Ribosome",
        "Golgi Apparatus",
      ]),
      correctAnswer: "Mitochondria",
      points: 5,
      order: 5,
      examPart: 1,
      section: "PART_I",
    },
  });

  const mcqQuestion2 = await prisma.examQuestion.create({
    data: {
      examId: markingTestExam.id,
      type: QuestionType.MULTIPLE_CHOICE,
      question: "What is the chemical symbol for water?",
      options: JSON.stringify(["H2O", "CO2", "O2", "NaCl"]),
      correctAnswer: "H2O",
      points: 5,
      order: 6,
      examPart: 1,
      section: "PART_I",
    },
  });

  // Create 5 student attempts with various answers
  const students = [internalStudent, externalStudent, internalStudent11];

  // Add 2 more dummy students for testing
  const student4 = await prisma.user.create({
    data: {
      firstName: "Emma",
      lastName: "Wilson",
      email: "emma.wilson@example.com",
      phone: "+94771234567",
      role: UserRole.INTERNAL_STUDENT,
      status: UserStatus.ACTIVE,
      password: await bcrypt.hash(SEED_PASSWORD, 10),
    },
  });

  const student5 = await prisma.user.create({
    data: {
      firstName: "Oliver",
      lastName: "Brown",
      email: "oliver.brown@example.com",
      phone: "+94771234568",
      role: UserRole.INTERNAL_STUDENT,
      status: UserStatus.ACTIVE,
      password: await bcrypt.hash(SEED_PASSWORD, 10),
    },
  });

  const allStudents = [...students, student4, student5];

  const sampleAnswers = {
    essay1: [
      "Photosynthesis is a process where plants convert light energy into chemical energy. It happens in two stages: the light-dependent reactions occur in the thylakoid membranes where water is split and ATP/NADPH are produced. The Calvin cycle (light-independent) occurs in the stroma where CO2 is fixed into glucose using the ATP and NADPH.",
      "Photosynthesis is when plants make food from sunlight. It involves chlorophyll capturing light and producing oxygen and glucose. The process has two parts but I'm not sure about the details.",
      "Plants use sunlight to create energy through photosynthesis. This process converts carbon dioxide and water into glucose and oxygen. It occurs in chloroplasts and involves complex chemical reactions including light reactions and dark reactions.",
      "Photosynthesis converts light into food for plants. The light reactions produce energy molecules and the Calvin cycle makes sugar. Chloroplasts contain thylakoids where light is captured and stroma where CO2 is processed.",
      "In photosynthesis, plants absorb sunlight using chlorophyll in chloroplasts. Light-dependent reactions split water molecules to produce ATP, NADPH and O2. Light-independent reactions (Calvin cycle) use these products to fix CO2 into glucose through a series of enzymatic reactions.",
    ],
    essay2: [
      "Global warming is caused by excessive greenhouse gases like CO2 from burning fossil fuels, deforestation reducing CO2 absorption, and industrial emissions. Effects include melting ice caps, rising sea levels threatening coastal cities, extreme weather events, droughts, and biodiversity loss. Solutions include transitioning to renewable energy (solar, wind), reforestation programs, carbon taxes, energy efficiency improvements, and international agreements like the Paris Accord.",
      "Global warming happens because of pollution and cutting trees. It makes the earth hotter and ice melts. We should use less cars and plant more trees.",
      "The main causes of global warming are human activities releasing greenhouse gases. This leads to temperature increases, weather changes, and environmental damage. We can solve it by using clean energy and protecting forests.",
      "Climate change is caused by burning coal and oil which releases CO2, methane from agriculture, and deforestation. Effects are sea level rise, species extinction, crop failures, and natural disasters. Solutions require global cooperation: renewable energy investment, carbon capture technology, sustainable agriculture, and policy changes.",
      "Global warming results from anthropogenic greenhouse gas emissions, primarily CO2 from fossil fuel combustion. Additional factors include methane from livestock and industrial processes. Consequences encompass thermal expansion of oceans, glacial retreat, altered precipitation patterns, and ecosystem disruption. Mitigation strategies include carbon pricing, renewable energy transition, afforestation, and carbon sequestration technologies.",
    ],
    short1: [
      "Newton's First Law states that an object remains at rest or in uniform motion unless acted upon by an external force. Example: A hockey puck sliding on ice continues moving until friction stops it.",
      "Things stay still or keep moving unless something pushes them. Like a car needs brakes to stop.",
      "An object at rest stays at rest and an object in motion stays in motion with constant velocity unless a net external force acts on it. Example: Seat belt prevents you from continuing forward when car brakes suddenly.",
      "Newton's First Law is about inertia - objects resist changes in motion. Example: A book on a table stays there unless someone moves it.",
      "The law of inertia: objects maintain their state of motion unless external force applied. Example: A ball rolling on grass slows down due to friction force.",
    ],
    short2: [
      "Mitosis creates 2 identical diploid daughter cells with same chromosome number as parent, used for growth and repair. Meiosis creates 4 genetically different haploid cells with half the chromosomes, used for gamete production in sexual reproduction.",
      "Mitosis is for body cells and meiosis is for sex cells. Mitosis makes 2 cells and meiosis makes 4 cells.",
      "Mitosis produces identical cells for growth. Meiosis produces sex cells with genetic variation through crossing over and has two divisions instead of one.",
      "Mitosis: 1 division, 2 diploid cells, no genetic variation. Meiosis: 2 divisions, 4 haploid cells, genetic variation via recombination.",
      "Mitosis maintains chromosome number (2n→2n) for somatic cell division. Meiosis reduces chromosome number (2n→n) for gametogenesis, includes crossing over for genetic diversity.",
    ],
  };

  for (let i = 0; i < allStudents.length; i++) {
    const student = allStudents[i];

    const attempt = await prisma.examAttempt.create({
      data: {
        examId: markingTestExam.id,
        studentId: student.id,
        status: "SUBMITTED",
        attemptNumber: 1,
        startedAt: new Date(
          `2025-01-15T09:${i.toString().padStart(2, "0")}:00Z`
        ),
        submittedAt: new Date(
          `2025-01-15T10:${(30 + i * 5).toString().padStart(2, "0")}:00Z`
        ),
        maxScore: 100,
        part1Score: 8 + i, // Auto-marked MCQ scores
        totalScore: null, // Will be calculated after marking
        percentage: null,
        passed: null,
        uploadedFiles: [],
        suspiciousActivityCount: 0,
      },
    });

    // MCQ answers (auto-marked)
    await prisma.examAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: mcqQuestion1.id,
        answer: "Mitochondria",
        isCorrect: true,
        pointsAwarded: 5,
        timeSpent: 15,
      },
    });

    await prisma.examAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: mcqQuestion2.id,
        answer: i % 2 === 0 ? "H2O" : "CO2", // Some correct, some wrong
        isCorrect: i % 2 === 0,
        pointsAwarded: i % 2 === 0 ? 5 : 0,
        timeSpent: 12,
      },
    });

    // Essay answers (need manual marking)
    await prisma.examAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: essayQuestion1.id,
        answer: sampleAnswers.essay1[i],
        isCorrect: null,
        pointsAwarded: null, // To be marked
        timeSpent: 900,
      },
    });

    await prisma.examAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: essayQuestion2.id,
        answer: sampleAnswers.essay2[i],
        isCorrect: null,
        pointsAwarded: null, // To be marked
        timeSpent: 850,
      },
    });

    // Short answer questions (need manual marking)
    await prisma.examAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: shortAnswerQ1.id,
        answer: sampleAnswers.short1[i],
        isCorrect: null,
        pointsAwarded: null, // To be marked
        timeSpent: 180,
      },
    });

    await prisma.examAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: shortAnswerQ2.id,
        answer: sampleAnswers.short2[i],
        isCorrect: null,
        pointsAwarded: null, // To be marked
        timeSpent: 200,
      },
    });
  }

  console.log("✅ Created marking test exam with 5 student attempts");
  console.log(`   Exam ID: ${markingTestExam.id}`);
  console.log("   - 2 Essay questions (20 marks each)");
  console.log("   - 2 Short answer questions (10 marks each)");
  console.log("   - 2 MCQ questions (5 marks each - auto-marked)");
  console.log("   - 5 students with submitted answers needing manual marking");

  console.log("Seed completed successfully ✅");
}

main()
  .catch((e) => {
    console.error("Seed error ❌", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
