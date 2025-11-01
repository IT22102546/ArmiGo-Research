import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RoleHelper } from "../../common/helpers/role.helper";
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
    teacherId: string
  ): Promise<Class> {
    // Verify the teacher exists and has permission
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      include: { teacherProfile: true },
    });

    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }

    if (!RoleHelper.isTeacher(teacher.role)) {
      throw new ForbiddenException("Only teachers can create classes");
    }

    // Create the class
    const classData = await this.prisma.class.create({
      data: {
        ...createClassDto,
        startDate: new Date(createClassDto.startDate),
        endDate: new Date(createClassDto.endDate),
        teacherId,
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
            enrollments: {
              where: {
                status: EnrollmentStatus.ACTIVE,
              },
            },
          },
        },
      },
    });

    return classData;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: ClassStatus,
    subject?: string,
    grade?: string
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
      where.subject = {
        contains: subject,
        mode: "insensitive",
      };
    }

    if (grade) {
      where.grade = grade;
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
        _count: {
          select: {
            enrollments: {
              where: {
                status: EnrollmentStatus.ACTIVE,
              },
            },
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
            enrollments: {
              where: {
                status: EnrollmentStatus.ACTIVE,
              },
            },
          },
        },
      },
    });

    if (!classData) {
      throw new NotFoundException("Class not found");
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
      include: {
        teacher: true,
      },
    });

    if (!existingClass) {
      throw new NotFoundException("Class not found");
    }

    // Check if the current user is the teacher or an admin
    const currentUser = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!currentUser) {
      throw new NotFoundException("User not found");
    }

    if (
      existingClass.teacherId !== teacherId &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        "Only the class teacher or admin can update this class"
      );
    }

    // Prepare update data
    const updateData: any = { ...updateClassDto };

    if (updateClassDto.startDate) {
      updateData.startDate = new Date(updateClassDto.startDate);
    }

    if (updateClassDto.endDate) {
      updateData.endDate = new Date(updateClassDto.endDate);
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
            enrollments: {
              where: {
                status: EnrollmentStatus.ACTIVE,
              },
            },
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
      throw new NotFoundException("Class not found");
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!currentUser) {
      throw new NotFoundException("User not found");
    }

    if (
      existingClass.teacherId !== teacherId &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        "Only the class teacher or admin can delete this class"
      );
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
            enrollments: {
              where: {
                status: EnrollmentStatus.ACTIVE,
              },
            },
          },
        },
      },
    });

    if (!classData) {
      throw new NotFoundException("Class not found");
    }

    if (classData.status !== ClassStatus.ACTIVE) {
      throw new BadRequestException("Cannot enroll in inactive class");
    }

    // Check if class is full
    if (
      classData.maxStudents &&
      classData._count.enrollments >= classData.maxStudents
    ) {
      throw new BadRequestException(
        `Class is full. Maximum capacity of ${classData.maxStudents} students reached.`
      );
    }

    // Check if student exists
    const student = await this.prisma.user.findUnique({
      where: { id: enrollStudentDto.studentId },
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    if (!RoleHelper.isStudent(student.role)) {
      throw new BadRequestException("Only students can be enrolled in classes");
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
        throw new BadRequestException(
          "Student is already enrolled in this class"
        );
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
                subject: true,
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
            subject: true,
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
      throw new NotFoundException("Enrollment not found");
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
                enrollments: {
                  where: {
                    status: EnrollmentStatus.ACTIVE,
                  },
                },
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
            enrollments: {
              where: {
                status: EnrollmentStatus.ACTIVE,
              },
            },
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
          not: 'SUSPENDED' as any,
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
        firstName: 'asc',
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
        not: 'SUSPENDED' as any,
      },
    };

    if (grade) {
      where.studentProfile = {
        grade,
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
            grade: true,
            academicYear: true,
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    return students.map((student) => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: `${student.firstName} ${student.lastName}`,
      email: student.email,
      role: student.role,
      grade: student.studentProfile?.grade,
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
      throw new NotFoundException('Class not found');
    }

    // Only the assigned teacher can start the class
    if (classItem.teacherId !== userId) {
      throw new ForbiddenException('Only the assigned teacher can start this class');
    }

    if (classItem.isLive) {
      throw new BadRequestException('Class is already live');
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
      message: 'Class started successfully',
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
      throw new NotFoundException('Class not found');
    }

    // Only the assigned teacher can stop the class
    if (classItem.teacherId !== userId) {
      throw new ForbiddenException('Only the assigned teacher can stop this class');
    }

    if (!classItem.isLive) {
      throw new BadRequestException('Class is not currently live');
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
      message: 'Class stopped successfully',
      class: updatedClass,
    };
  }

  // Get today's classes for a user
  async getTodaysClasses(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get classes where user is teacher
    const teacherClasses = await this.prisma.class.findMany({
      where: {
        teacherId: userId,
        startDate: {
          lte: endOfDay,
        },
        endDate: {
          gte: startOfDay,
        },
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
        startDate: 'asc',
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
          startDate: {
            lte: endOfDay,
          },
          endDate: {
            gte: startOfDay,
          },
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
        class: {
          startDate: 'asc',
        },
      },
    });

    const studentClasses = studentEnrollments.map((enrollment) => enrollment.class);

    return {
      teacherClasses,
      studentClasses,
      total: teacherClasses.length + studentClasses.length,
    };
  }

  // Get enrolled students for a class
  async getEnrolledStudents(classId: string): Promise<any> {
    const classItem = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classItem) {
      throw new NotFoundException('Class not found');
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
        createdAt: 'asc',
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
      availableSlots: classItem.maxStudents ? classItem.maxStudents - students.length : null,
      students,
    };
  }
}