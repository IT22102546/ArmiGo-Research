import { Injectable } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { UserRole, MaterialType } from "@prisma/client";
import {
  CreateCourseMaterialDto,
  UpdateCourseMaterialDto,
  CourseMaterialQueryDto,
} from "./dto";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

@Injectable()
export class CourseMaterialsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCourseMaterialDto, uploadedById: string) {
    // Verify the uploader exists and has permission
    const uploader = await this.prisma.user.findUnique({
      where: { id: uploadedById },
      include: { teacherProfile: true },
    });

    if (!uploader) {
      throw AppException.notFound(
        ErrorCode.USER_NOT_FOUND,
        "Uploader not found"
      );
    }

    // Check if user can upload materials (teachers and admins)
    const canUpload =
      uploader.role === UserRole.INTERNAL_TEACHER ||
      uploader.role === UserRole.EXTERNAL_TEACHER ||
      uploader.role === UserRole.ADMIN ||
      uploader.role === UserRole.SUPER_ADMIN;

    if (!canUpload) {
      throw AppException.forbidden(
        ErrorCode.ONLY_TEACHERS_ADMINS_CAN_CREATE,
        "Only teachers and admins can upload materials"
      );
    }

    // If classId is provided, verify the class exists and user has access
    if (dto.classId) {
      const classItem = await this.prisma.class.findUnique({
        where: { id: dto.classId },
        include: { teacher: true },
      });

      if (!classItem) {
        throw AppException.notFound(
          ErrorCode.CLASS_NOT_FOUND,
          "Class not found"
        );
      }

      // Check if user is the class owner (teacher) or an admin
      const isTeacherOfClass = classItem.teacherId === uploadedById;
      const isAdmin =
        uploader.role === UserRole.ADMIN ||
        uploader.role === UserRole.SUPER_ADMIN;

      if (!isTeacherOfClass && !isAdmin) {
        throw AppException.forbidden(
          ErrorCode.CAN_ONLY_UPDATE_OWN_MATERIALS,
          "You can only upload materials for your own classes"
        );
      }
    }

    return this.prisma.courseMaterial.create({
      data: {
        classId: dto.classId,
        subjectId: dto.subjectId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize,
        fileType: dto.fileType,
        thumbnailUrl: dto.thumbnailUrl,
        isPublic: dto.isPublic || false,
        uploadedById,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        metadata: dto.metadata,
      },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
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
            description: true,
          },
        },
      },
    });
  }

  async findAll(query: CourseMaterialQueryDto, userId?: string) {
    const {
      page = 1,
      limit = 10,
      grade,
      subject,
      type,
      isPublic,
      search,
      classId,
    } = query;

    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // If user is not admin, only show public materials or their own uploads
    let user: any = null;
    if (userId) {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
    }

    const isAdmin =
      user &&
      (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN);
    const isTeacher =
      user &&
      (user.role === UserRole.INTERNAL_TEACHER ||
        user.role === UserRole.EXTERNAL_TEACHER);

    if (!isAdmin) {
      if (userId) {
        // Authenticated user: show public materials + their own uploads
        where.OR = [{ isPublic: true }, { uploadedById: userId }];
      } else {
        // Unauthenticated: only public materials
        where.isPublic = true;
      }
    }

    // Apply filters
    if (grade) {
      where.grades = {
        some: {
          gradeId: grade,
        },
      };
    }

    if (subject) {
      // Support both subject string search and subjectId lookup
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

    if (type) {
      where.type = type;
    }

    if (isPublic !== undefined) {
      // Override the isPublic filter for admins
      if (isAdmin) {
        where.isPublic = isPublic;
      }
    }

    if (classId) {
      where.classId = classId;
    }

    if (search) {
      where.OR = [
        ...(where.OR || []),
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await this.prisma.courseMaterial.count({ where });

    // Get materials
    const materials = await this.prisma.courseMaterial.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
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

    return {
      data: materials,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string) {
    const material = await this.prisma.courseMaterial.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
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
              },
            },
          },
        },
      },
    });

    if (!material) {
      throw AppException.notFound(
        ErrorCode.MATERIAL_NOT_FOUND,
        "Material not found"
      );
    }

    // Check access permissions
    let user: any = null;
    if (userId) {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
    }

    const isAdmin =
      user &&
      (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN);
    const isOwner = userId === material.uploadedById;
    const isPublic = material.isPublic;

    if (!isPublic && !isOwner && !isAdmin) {
      throw AppException.forbidden(
        ErrorCode.ACCESS_DENIED,
        "You do not have access to this material"
      );
    }

    // Increment view count
    await this.prisma.courseMaterial.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return material;
  }

  async update(id: string, dto: UpdateCourseMaterialDto, userId: string) {
    const material = await this.prisma.courseMaterial.findUnique({
      where: { id },
      include: { uploader: true },
    });

    if (!material) {
      throw AppException.notFound(
        ErrorCode.MATERIAL_NOT_FOUND,
        "Material not found"
      );
    }

    // Check permissions
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    const isAdmin =
      user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
    const isOwner = userId === material.uploadedById;

    if (!isOwner && !isAdmin) {
      throw AppException.forbidden(
        ErrorCode.CAN_ONLY_UPDATE_OWN_MATERIALS,
        "You can only update your own materials"
      );
    }

    return this.prisma.courseMaterial.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        isPublic: dto.isPublic,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        metadata: dto.metadata,
      },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
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

  async remove(id: string, userId: string) {
    const material = await this.prisma.courseMaterial.findUnique({
      where: { id },
    });

    if (!material) {
      throw AppException.notFound(
        ErrorCode.MATERIAL_NOT_FOUND,
        "Material not found"
      );
    }

    // Check permissions
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    const isAdmin =
      user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
    const isOwner = userId === material.uploadedById;

    if (!isOwner && !isAdmin) {
      throw AppException.forbidden(
        ErrorCode.CAN_ONLY_UPDATE_OWN_MATERIALS,
        "You can only delete your own materials"
      );
    }

    await this.prisma.courseMaterial.delete({
      where: { id },
    });

    return { message: "Material deleted successfully" };
  }

  async incrementDownload(id: string) {
    await this.prisma.courseMaterial.update({
      where: { id },
      data: { downloads: { increment: 1 } },
    });
  }

  async getByClass(classId: string, userId?: string) {
    // Verify class exists
    const classItem = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { teacher: true },
    });

    if (!classItem) {
      throw AppException.notFound(ErrorCode.CLASS_NOT_FOUND, "Class not found");
    }

    // Check if user has access to this class
    let hasAccess = classItem.isPublic;

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (user) {
        const isAdmin =
          user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
        const isTeacher = classItem.teacherId === userId;
        const isEnrolled = await this.prisma.enrollment.findFirst({
          where: {
            classId,
            studentId: userId,
            status: "ACTIVE",
          },
        });

        hasAccess = isAdmin || isTeacher || !!isEnrolled || classItem.isPublic;
      }
    }

    if (!hasAccess) {
      throw AppException.forbidden(
        ErrorCode.ACCESS_DENIED,
        "You do not have access to this class materials"
      );
    }

    return this.prisma.courseMaterial.findMany({
      where: {
        classId,
        OR: [{ isPublic: true }, ...(userId ? [{ uploadedById: userId }] : [])],
      },
      orderBy: { createdAt: "desc" },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async getMyMaterials(userId: string, query: CourseMaterialQueryDto) {
    const { page = 1, limit = 10, type, search, classId } = query;
    const offset = (page - 1) * limit;

    const where: any = {
      uploadedById: userId,
    };

    if (type) {
      where.type = type;
    }

    if (classId) {
      where.classId = classId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await this.prisma.courseMaterial.count({ where });

    const materials = await this.prisma.courseMaterial.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
    });

    return {
      data: materials,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
