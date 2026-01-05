import { Injectable } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { RoleHelper } from "../../shared/helpers/role.helper";
import { AppException } from "@/common/errors/app-exception";
import { ErrorCode } from "@/common/errors/error-codes.enum";
import {
  CreateClassDto,
  UpdateClassDto,
  EnrollStudentDto,
} from "./dto/class.dto";
import { Class, ClassStatus, EnrollmentStatus, UserRole } from "@prisma/client";

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createClassDto: CreateClassDto,
    currentUserId: string
  ): Promise<Class> {
    // Get current user to check role
    const teacher = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      include: { teacherProfile: true },
    });

    if (!teacher) {
      throw AppException.notFound(
        ErrorCode.TEACHER_NOT_FOUND,
        "Teacher not found"
      );
    }

    if (!RoleHelper.isTeacher(teacher.role)) {
      throw AppException.forbidden("Only teachers can create classes");
    }

    // Store the teacher ID
    const teacherId = teacher.id;

    // Validate required fields
    if (!createClassDto.gradeId) {
      throw AppException.badRequest(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Grade ID is required"
      );
    }

    if (!createClassDto.mediumId) {
      throw AppException.badRequest(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Medium ID is required"
      );
    }

    // Validate that the teacher has an active assignment for this subject/grade/medium and the current academic year
    const currentAcademicYear = await this.prisma.academicYear.findFirst({
      where: { isCurrent: true },
    });
    if (!currentAcademicYear) {
      throw AppException.badRequest(ErrorCode.NO_CURRENT_ACADEMIC_YEAR);
    }

    const teacherAssignment =
      await this.prisma.teacherSubjectAssignment.findFirst({
        where: {
          teacherProfileId: teacher.teacherProfile?.id,
          subjectId: createClassDto.subjectId,
          gradeId: createClassDto.gradeId,
          mediumId: createClassDto.mediumId,
          academicYear: {
            year: currentAcademicYear.year,
          },
          isActive: true,
        },
      });

    if (!teacherAssignment) {
      throw AppException.badRequest(
        ErrorCode.TEACHER_NO_ACTIVE_ASSIGNMENT,
        "Teacher does not have an active assignment for the provided subject/grade/medium for the current academic year"
      );
    }

    if (teacher.teacherProfile?.isExternalTransferOnly) {
      throw AppException.forbidden(
        "External teachers are not allowed to create classes"
      );
    }

    // Create the class
    const classData = await this.prisma.class.create({
      data: {
        name: createClassDto.name,
        description: createClassDto.description,
        subjectId: createClassDto.subjectId,
        gradeId: createClassDto.gradeId,
        mediumId: createClassDto.mediumId,
        batchId: createClassDto.batchId,
        maxStudents: createClassDto.maxStudents,
        materials: createClassDto.materials,
        fees: createClassDto.fees || 0,
        teacherId: teacherId, //  Use determined teacher ID
        teacherAssignmentId: teacherAssignment.id,
        status: ClassStatus.ACTIVE,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        grade: {
          select: {
            id: true,
            name: true,
            code: true,
            level: true,
          },
        },
        medium: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    console.log("Class created successfully:", classData);
    return classData;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: ClassStatus,
    subject?: string,
    grade?: string,
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

    if (subject) {
      // Try to find subject by ID first, fallback to name search
      const subjectRecord = await this.prisma.subject.findFirst({
        where: {
          OR: [
            { id: subject },
            { name: { contains: subject, mode: "insensitive" } },
            { code: { contains: subject, mode: "insensitive" } },
          ],
        },
      });
      if (subjectRecord) {
        where.subjectId = subjectRecord.id;
      }
    }

    if (grade) {
      // Try to find grade by ID first, fallback to name search
      const gradeRecord = await this.prisma.grade.findFirst({
        where: {
          OR: [{ id: grade }, { name: grade }, { code: grade }],
        },
      });
      if (gradeRecord) {
        where.gradeId = gradeRecord.id;
      }
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    const total = await this.prisma.class.count({ where });
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const classes = await this.prisma.class.findMany({
      where,
      skip,
      take: limit,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
            code: true,
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
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const data = classes.map((classItem) => ({
      ...classItem,
      currentEnrollment: classItem._count.enrollments,
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
    const classData = await this.prisma.class.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            imageUrl: true,
          },
        },
        grade: {
          select: {
            id: true,
            name: true,
            code: true,
            level: true,
          },
        },
        medium: {
          select: {
            id: true,
            name: true,
          },
        },
        enrollments: {
          where: {
            status: EnrollmentStatus.ACTIVE,
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
          },
        },
        exams: {
          select: {
            id: true,
            title: true,
            status: true,
            startTime: true,
            endTime: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!classData) {
      throw AppException.notFound(ErrorCode.CLASS_NOT_FOUND);
    }

    return {
      ...classData,
      currentEnrollment: classData._count.enrollments,
    };
  }

  async update(
    id: string,
    updateClassDto: UpdateClassDto,
    teacherId: string
  ): Promise<Class> {
    // Check if class exists and user has permission
    const existingClass = await this.prisma.class.findUnique({
      where: { id },
      include: { teacher: true },
    });

    if (!existingClass) {
      throw AppException.notFound(ErrorCode.CLASS_NOT_FOUND);
    }

    // Check if the current user is the teacher or an admin
    const currentUser = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!currentUser) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND);
    }

    if (
      existingClass.teacherId !== teacherId &&
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw AppException.forbidden(ErrorCode.ONLY_CLASS_TEACHER_CAN_MODIFY);
    }

    // Prepare update data
    const updateData: any = { ...updateClassDto };

    // If subject/grade/medium are being updated, ensure the teacher has an active assignment
    if (
      (updateClassDto.subjectId ||
        updateClassDto.subject ||
        updateClassDto.gradeId ||
        updateClassDto.grade ||
        updateClassDto.mediumId) &&
      RoleHelper.isTeacher(currentUser.role)
    ) {
      const currentAcademicYear = await this.prisma.academicYear.findFirst({
        where: { isCurrent: true },
      });
      if (!currentAcademicYear)
        {throw AppException.badRequest(ErrorCode.NO_CURRENT_ACADEMIC_YEAR);}

      const newSubjectId =
        updateClassDto.subjectId ||
        updateClassDto.subject ||
        existingClass.subjectId;
      const newGradeId =
        updateClassDto.gradeId || updateClassDto.grade || existingClass.gradeId;
      const newMediumId = updateClassDto.mediumId || existingClass.mediumId;
      if (!newMediumId) {
        throw AppException.badRequest(ErrorCode.MEDIUM_REQUIRED);
      }

      const teacherProfile = await this.prisma.teacherProfile.findFirst({
        where: { userId: teacherId },
      });
      const teacherAssignment =
        await this.prisma.teacherSubjectAssignment.findFirst({
          where: {
            teacherProfileId: teacherProfile?.id,
            subjectId: newSubjectId,
            gradeId: newGradeId,
            mediumId: newMediumId,
            academicYear: {
              year: currentAcademicYear.year,
            },
            isActive: true,
          },
        });

      if (!teacherAssignment) {
        throw AppException.badRequest(ErrorCode.TEACHER_NO_ACTIVE_ASSIGNMENT);
      }

      updateData.teacherAssignmentId = teacherAssignment.id;
    }

    const updatedClass = await this.prisma.class.update({
      where: { id },
      data: updateData,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    return updatedClass;
  }

  async remove(id: string, teacherId: string): Promise<void> {
    // Check if class exists and user has permission
    const existingClass = await this.prisma.class.findUnique({
      where: { id },
    });

    if (!existingClass) {
      throw AppException.notFound(ErrorCode.CLASS_NOT_FOUND);
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!currentUser) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND);
    }

    if (
      existingClass.teacherId !== teacherId &&
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw AppException.forbidden(ErrorCode.ONLY_CLASS_TEACHER_CAN_MODIFY);
    }

    // Soft delete by updating status
    await this.prisma.class.update({
      where: { id },
      data: {
        status: ClassStatus.CANCELLED,
      },
    });
  }

  async enrollStudent(
    classId: string,
    enrollStudentDto: EnrollStudentDto
  ): Promise<any> {
    // Check if class exists and is active
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!classData) {
      throw AppException.notFound(ErrorCode.CLASS_NOT_FOUND);
    }

    if (classData.status !== ClassStatus.ACTIVE) {
      throw AppException.badRequest(ErrorCode.CLASS_NOT_ACTIVE);
    }

    // Check if class is full
    if (
      classData.maxStudents &&
      classData._count.enrollments >= classData.maxStudents
    ) {
      throw AppException.badRequest(
        ErrorCode.CLASS_CAPACITY_FULL,
        `Class is full. Maximum capacity of ${classData.maxStudents} students reached.`
      );
    }

    // Check if student exists
    const student = await this.prisma.user.findUnique({
      where: { id: enrollStudentDto.studentId },
    });

    if (!student) {
      throw AppException.notFound(ErrorCode.STUDENT_NOT_FOUND);
    }

    if (!RoleHelper.isStudent(student.role)) {
      throw AppException.badRequest(ErrorCode.ONLY_STUDENTS_CAN_ENROLL);
    }

    // Check if already enrolled
    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        classId_studentId: {
          classId,
          studentId: enrollStudentDto.studentId,
        },
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === EnrollmentStatus.ACTIVE) {
        throw AppException.badRequest(ErrorCode.STUDENT_ALREADY_ENROLLED);
      } else {
        // Reactivate enrollment
        return this.prisma.enrollment.update({
          where: {
            classId_studentId: {
              classId,
              studentId: enrollStudentDto.studentId,
            },
          },
          data: {
            status: EnrollmentStatus.ACTIVE,
            isPaid: enrollStudentDto.isPaid || false,
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
            class: {
              select: {
                id: true,
                name: true,
                subject: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        });
      }
    }

    // Create new enrollment
    const enrollment = await this.prisma.enrollment.create({
      data: {
        classId,
        studentId: enrollStudentDto.studentId,
        status: EnrollmentStatus.ACTIVE,
        isPaid: enrollStudentDto.isPaid || false,
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
        class: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return enrollment;
  }

  async unenrollStudent(classId: string, studentId: string): Promise<void> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        classId_studentId: {
          classId,
          studentId,
        },
      },
    });

    if (!enrollment) {
      throw AppException.notFound(ErrorCode.ENROLLMENT_NOT_FOUND);
    }

    // Soft delete by updating status
    await this.prisma.enrollment.update({
      where: {
        classId_studentId: {
          classId,
          studentId,
        },
      },
      data: {
        status: EnrollmentStatus.CANCELLED,
      },
    });
  }

  async getStudentEnrollments(studentId: string): Promise<any[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId,
        status: EnrollmentStatus.ACTIVE,
      },
      include: {
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: "desc",
      },
    });

    return enrollments.map((enrollment) => ({
      ...enrollment,
      class: {
        ...enrollment.class,
        currentEnrollment: enrollment.class._count.enrollments,
      },
    }));
  }

  async getTeacherClasses(teacherId: string): Promise<any[]> {
    const classes = await this.prisma.class.findMany({
      where: {
        teacherId,
        status: {
          not: ClassStatus.CANCELLED,
        },
      },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return classes.map((classItem) => ({
      ...classItem,
      currentEnrollment: classItem._count.enrollments,
    }));
  }

  async getTeachersList(): Promise<any[]> {
    const teachers = await this.prisma.user.findMany({
      where: {
        OR: [
          { role: UserRole.INTERNAL_TEACHER },
          { role: UserRole.EXTERNAL_TEACHER },
        ],
        status: {
          not: "SUSPENDED" as any,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        teacherProfile: {
          select: {
            department: true,
            specialization: true,
            experience: true,
          },
        },
      },
      orderBy: {
        firstName: "asc",
      },
    });

    return teachers.map((teacher) => ({
      id: teacher.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      fullName: `${teacher.firstName} ${teacher.lastName}`,
      email: teacher.email,
      role: teacher.role,
      department: teacher.teacherProfile?.department,
      specialization: teacher.teacherProfile?.specialization,
      experience: teacher.teacherProfile?.experience,
    }));
  }

  async getStudentsList(grade?: string): Promise<any[]> {
    const where: any = {
      OR: [
        { role: UserRole.INTERNAL_STUDENT },
        { role: UserRole.EXTERNAL_STUDENT },
      ],
      status: {
        not: "SUSPENDED" as any,
      },
    };

    if (grade) {
      where.studentProfile = {
        gradeId: grade,
      };
    }

    const students = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        studentProfile: {
          select: {
            gradeId: true,
            academicYear: true,
            grade: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        firstName: "asc",
      },
    });

    return students.map((student) => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: `${student.firstName} ${student.lastName}`,
      email: student.email,
      role: student.role,
      grade: student.studentProfile?.grade?.name,
      gradeId: student.studentProfile?.gradeId,
      academicYear: student.studentProfile?.academicYear,
    }));
  }

  // Start a class (teacher only)
  async startClass(classId: string, userId: string): Promise<any> {
    const classItem = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { teacher: true },
    });

    if (!classItem) {
      throw AppException.notFound(ErrorCode.CLASS_NOT_FOUND);
    }

    // Only the assigned teacher can start the class
    if (classItem.teacherId !== userId) {
      throw AppException.forbidden(ErrorCode.ONLY_ASSIGNED_TEACHER_CAN_START);
    }

    if (classItem.isLive) {
      throw AppException.badRequest(ErrorCode.CLASS_ALREADY_LIVE);
    }

    const updatedClass = await this.prisma.class.update({
      where: { id: classId },
      data: {
        isLive: true,
        startedAt: new Date(),
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      message: "Class started successfully",
      class: updatedClass,
    };
  }

  // Stop a class (teacher only)
  async stopClass(classId: string, userId: string): Promise<any> {
    const classItem = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { teacher: true },
    });

    if (!classItem) {
      throw AppException.notFound(ErrorCode.CLASS_NOT_FOUND);
    }

    // Only the assigned teacher can stop the class
    if (classItem.teacherId !== userId) {
      throw AppException.forbidden(ErrorCode.ONLY_ASSIGNED_TEACHER_CAN_STOP);
    }

    if (!classItem.isLive) {
      throw AppException.badRequest(ErrorCode.CLASS_NOT_LIVE);
    }

    const updatedClass = await this.prisma.class.update({
      where: { id: classId },
      data: {
        isLive: false,
        endedAt: new Date(),
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      message: "Class stopped successfully",
      class: updatedClass,
    };
  }

  // Get today's classes for a user
  async getTodaysClasses(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND);
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get active classes where user is teacher
    const teacherclasses = await this.prisma.class.findMany({
      where: {
        teacherId: userId,
        status: ClassStatus.ACTIVE,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get classes where user is enrolled as student
    const studentEnrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: userId,
        status: {
          in: [EnrollmentStatus.APPROVED, EnrollmentStatus.ACTIVE],
        },
        class: {
          status: ClassStatus.ACTIVE,
        },
      },
      include: {
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const studentClasses = studentEnrollments.map(
      (enrollment) => enrollment.class
    );

    return {
      teacherclasses,
      studentClasses,
      total: teacherclasses.length + studentClasses.length,
    };
  }

  // Get enrolled students for a class
  async getEnrolledStudents(classId: string): Promise<any> {
    const classItem = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classItem) {
      throw AppException.notFound(ErrorCode.CLASS_NOT_FOUND);
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        classId,
        status: {
          in: [EnrollmentStatus.APPROVED, EnrollmentStatus.ACTIVE],
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            studentProfile: {
              select: {
                grade: true,
                academicYear: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const students = enrollments.map((enrollment) => ({
      enrollmentId: enrollment.id,
      enrollmentStatus: enrollment.status,
      enrolledAt: enrollment.createdAt,
      isPaid: enrollment.isPaid,
      ...enrollment.student,
      fullName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
    }));

    return {
      classId,
      className: classItem.name,
      totalEnrolled: students.length,
      maxStudents: classItem.maxStudents,
      availableSlots: classItem.maxStudents
        ? classItem.maxStudents - students.length
        : null,
      students,
    };
  }
}
