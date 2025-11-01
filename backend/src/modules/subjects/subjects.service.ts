import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateSubjectDto, UpdateSubjectDto } from "./dto/subject.dto";
import { UserRole } from "../../common/enums/user.enum";
import { RoleHelper } from "../../common/helpers/role.helper";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class SubjectsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService
  ) {}

  /**
   * Create a new subject
   */
  async create(createSubjectDto: CreateSubjectDto) {
    // Check if subject with same name already exists
    const existingSubject = await this.prisma.subject.findUnique({
      where: { name: createSubjectDto.name },
    });

    if (existingSubject) {
      throw new ConflictException("Subject with this name already exists");
    }

    // Check if code is provided and unique
    if (createSubjectDto.code) {
      const existingCode = await this.prisma.subject.findUnique({
        where: { code: createSubjectDto.code },
      });

      if (existingCode) {
        throw new ConflictException("Subject with this code already exists");
      }
    }

    // Validate teacherId if provided
    if (createSubjectDto.teacherId) {
      const teacher = await this.prisma.user.findUnique({
        where: { id: createSubjectDto.teacherId },
        include: { teacherProfile: true },
      });

      if (!teacher || !teacher.teacherProfile) {
        throw new NotFoundException("Valid teacher not found");
      }
    }

    return this.prisma.subject.create({
      data: createSubjectDto,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            teacherProfile: true,
          },
        },
      },
    });
  }

  /**
   * Upload subject image
   */
  async uploadImage(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string,
    userId: string,
    userRole: UserRole
  ) {
    // Upload to storage
    const result = await this.storageService.uploadFile(
      fileBuffer,
      filename,
      mimetype,
      "subjects"
    );

    return {
      url: result.url,
      key: result.key,
      bucket: result.bucket,
      filename,
      size: fileBuffer.length,
      mimetype,
    };
  }

  /**
   * Get all subjects with filtering based on user role
   * - Admins: See all subjects
   * - Teachers: See only subjects they teach
   * - Students: See all active subjects (for browsing and enrollment)
   */
  async findAll(includeInactive = false, userId?: string, userRole?: UserRole) {
    const where: any = includeInactive ? {} : { isActive: true };

    // Apply role-based filtering
    if (userId && userRole) {
      if (RoleHelper.isTeacher(userRole)) {
        // Teachers only see subjects they teach
        where.teacherId = userId;
      }
      // Students see all active subjects (can browse to enroll)
      // Admins see everything (no additional filter)
    }

    return this.prisma.subject.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            teacherProfile: true,
          },
        },
      },
    });
  }

  /**
   * Get subjects by category
   */
  async findByCategory(category: string) {
    return this.prisma.subject.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: { name: "asc" },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            teacherProfile: true,
          },
        },
      },
    });
  }

  /**
   * Get subject by ID with access control
   */
  async findOne(id: string, userId?: string, userRole?: UserRole) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            teacherProfile: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException("Subject not found");
    }

    // Check access based on role
    if (userId && userRole) {
      if (RoleHelper.isTeacher(userRole) && subject.teacherId !== userId) {
        throw new ForbiddenException("You can only view subjects you teach");
      }
      // Students can view all subjects (for browsing and enrollment)
      // Admins can view everything
    }

    return subject;
  }

  /**
   * Get subject by name
   */
  async findByName(name: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { name },
    });

    if (!subject) {
      throw new NotFoundException("Subject not found");
    }

    return subject;
  }

  /**
   * Get subject by code
   */
  async findByCode(code: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { code },
    });

    if (!subject) {
      throw new NotFoundException("Subject not found");
    }

    return subject;
  }

  /**
   * Update a subject with ownership check
   */
  async update(id: string, updateSubjectDto: UpdateSubjectDto, userId?: string, userRole?: UserRole) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      throw new NotFoundException("Subject not found");
    }

    // Check ownership - only teachers can update subjects they teach, or admins
    if (userId && userRole) {
      if (RoleHelper.isTeacher(userRole) && subject.teacherId !== userId) {
        throw new ForbiddenException("You can only update subjects you teach");
      }
    }

    // Check if new name conflicts with existing subject
    if (updateSubjectDto.name && updateSubjectDto.name !== subject.name) {
      const existingSubject = await this.prisma.subject.findUnique({
        where: { name: updateSubjectDto.name },
      });

      if (existingSubject) {
        throw new ConflictException("Subject with this name already exists");
      }
    }

    // Check if new code conflicts with existing subject
    if (updateSubjectDto.code && updateSubjectDto.code !== subject.code) {
      const existingCode = await this.prisma.subject.findUnique({
        where: { code: updateSubjectDto.code },
      });

      if (existingCode) {
        throw new ConflictException("Subject with this code already exists");
      }
    }

    // Validate teacherId if provided
    if (updateSubjectDto.teacherId) {
      const teacher = await this.prisma.user.findUnique({
        where: { id: updateSubjectDto.teacherId },
        include: { teacherProfile: true },
      });

      if (!teacher || !teacher.teacherProfile) {
        throw new NotFoundException("Valid teacher not found");
      }
    }

    // Delete old image if uploading a new one
    if (updateSubjectDto.imageUrl && subject.imageUrl && updateSubjectDto.imageUrl !== subject.imageUrl) {
      try {
        // Extract key from old URL if it's from our storage
        const urlParts = subject.imageUrl.split('/');
        const key = urlParts.slice(-2).join('/'); // Get "subjects/filename"
        await this.storageService.deleteFile(key);
      } catch (error) {
        // Continue with update even if old image deletion fails
        console.error('Failed to delete old subject image:', error);
      }
    }

    return this.prisma.subject.update({
      where: { id },
      data: updateSubjectDto,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            teacherProfile: true,
          },
        },
      },
    });
  }

  /**
   * Delete a subject
   * - Hard delete by default (permanent deletion)
   * - Soft delete option available (marks as inactive)
   */
  async remove(id: string, userId?: string, userRole?: UserRole, isSoftDelete = false) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      throw new NotFoundException("Subject not found");
    }

    // Check ownership - only teachers can delete subjects they teach, or admins
    if (userId && userRole) {
      if (RoleHelper.isTeacher(userRole) && subject.teacherId !== userId) {
        throw new ForbiddenException("You can only delete subjects you teach");
      }
    }

    if (isSoftDelete) {
      // Soft delete by marking as inactive
      return this.prisma.subject.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Hard delete - permanent removal
      // Delete associated image from storage if exists
      if (subject.imageUrl) {
        try {
          // Extract key from URL if it's from our storage
          const urlParts = subject.imageUrl.split('/');
          const key = urlParts.slice(-2).join('/'); // Get "subjects/filename"
          await this.storageService.deleteFile(key);
        } catch (error) {
          // Continue with deletion even if image deletion fails
          console.error('Failed to delete subject image:', error);
        }
      }

      return this.prisma.subject.delete({
        where: { id },
      });
    }
  }

  /**
   * Restore a soft-deleted subject
   */
  async restore(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      throw new NotFoundException("Subject not found");
    }

    return this.prisma.subject.update({
      where: { id },
      data: { isActive: true },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            teacherProfile: true,
          },
        },
      },
    });
  }

  /**
   * Get all categories
   */
  async getCategories() {
    const subjects = await this.prisma.subject.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
    });

    return subjects
      .filter((s) => s.category)
      .map((s) => s.category)
      .sort();
  }

  /**
   * Search subjects
   */
  async search(query: string) {
    return this.prisma.subject.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { code: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            teacherProfile: true,
          },
        },
      },
    });
  }
}
