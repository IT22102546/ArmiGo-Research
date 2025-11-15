import { Injectable } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { CreateSubjectDto, UpdateSubjectDto } from "./dto/subject.dto";
import { UserRole } from "@prisma/client";
import { RoleHelper } from "../../shared/helpers/role.helper";
import { StorageService } from "../../infrastructure/storage/storage.service";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

@Injectable()
export class SubjectsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService
  ) {}

  /**
   * Auto-generate subject code from name
   */
  private generateSubjectCode(name: string): string {
    // Remove special characters and split into words
    const words = name
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim()
      .split(/\s+/);

    if (words.length === 1) {
      // Single word: take first 4 characters
      return words[0].substring(0, 4).toUpperCase();
    } else {
      // Multiple words: take first letter of each word (max 4)
      return words
        .slice(0, 4)
        .map((word) => word[0])
        .join("")
        .toUpperCase();
    }
  }

  /**
   * Create a new subject
   */
  // async create(createSubjectDto: CreateSubjectDto) {
  //   // Check if subject with same name already exists
  //   const existingSubject = await this.prisma.subject.findUnique({
  //     where: { name: createSubjectDto.name },
  //   });

  //   if (existingSubject) {
  //     throw new ConflictException("Subject with this name already exists");
  //   }

  //   // Auto-generate code if not provided
  //   if (!createSubjectDto.code) {
  //     let generatedCode = this.generateSubjectCode(createSubjectDto.name);
  //     let codeExists = await this.prisma.subject.findUnique({
  //       where: { code: generatedCode },
  //     });

  //     // If code exists, append a number
  //     let counter = 1;
  //     while (codeExists) {
  //       generatedCode = `${this.generateSubjectCode(createSubjectDto.name)}${counter}`;
  //       codeExists = await this.prisma.subject.findUnique({
  //         where: { code: generatedCode },
  //       });
  //       counter++;
  //     }

  //     createSubjectDto.code = generatedCode;
  //   } else {
  //     // Check if provided code is unique
  //     const existingCode = await this.prisma.subject.findUnique({
  //       where: { code: createSubjectDto.code },
  //     });

  //     if (existingCode) {
  //       throw new ConflictException("Subject with this code already exists");
  //     }
  //   }

  //   return this.prisma.subject.create({
  //     data: createSubjectDto,
  //   });
  // }

  // In your subjects.service.ts
  async create(createSubjectDto: CreateSubjectDto) {
    // Check if subject with same name already exists
    const existingSubject = await this.prisma.subject.findUnique({
      where: { name: createSubjectDto.name },
    });

    if (existingSubject) {
      throw AppException.conflict(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        "Subject with this name already exists"
      );
    }

    // Auto-generate code if not provided
    if (!createSubjectDto.code) {
      let generatedCode = this.generateSubjectCode(createSubjectDto.name);
      let codeExists = await this.prisma.subject.findUnique({
        where: { code: generatedCode },
      });

      // If code exists, append a number
      let counter = 1;
      while (codeExists) {
        generatedCode = `${this.generateSubjectCode(createSubjectDto.name)}${counter}`;
        codeExists = await this.prisma.subject.findUnique({
          where: { code: generatedCode },
        });
        counter++;
      }

      createSubjectDto.code = generatedCode;
    } else {
      // Check if provided code is unique
      const existingCode = await this.prisma.subject.findUnique({
        where: { code: createSubjectDto.code },
      });

      if (existingCode) {
        throw AppException.conflict(
          ErrorCode.BUSINESS_RULE_VIOLATION,
          "Subject with this code already exists"
        );
      }
    }

    return this.prisma.subject.create({
      data: createSubjectDto,
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
   * - Teachers: See all subjects (assignments managed via TeacherSubjectAssignment)
   * - Students: See all active subjects (for browsing and enrollment)
   */
  async findAll(includeInactive = false, userId?: string, userRole?: UserRole) {
    const where: any = includeInactive ? {} : { isActive: true };

    // All users see subjects based on isActive flag only
    // Teacher-subject relationships are now managed via TeacherSubjectAssignment table

    return this.prisma.subject.findMany({
      where,
      orderBy: { name: "asc" },
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
    });
  }

  /**
   * Get subject by ID with access control
   */
  async findOne(id: string, userId?: string, userRole?: UserRole) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      throw AppException.notFound(
        ErrorCode.SUBJECT_NOT_FOUND,
        "Subject not found"
      );
    }

    // All users can view subjects
    // Access control for teaching is managed via TeacherSubjectAssignment

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
      throw AppException.notFound(
        ErrorCode.SUBJECT_NOT_FOUND,
        "Subject not found"
      );
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
      throw AppException.notFound(
        ErrorCode.SUBJECT_NOT_FOUND,
        "Subject not found"
      );
    }

    return subject;
  }

  /**
   * Update a subject with ownership check
   */
  // async update(
  //   id: string,
  //   updateSubjectDto: UpdateSubjectDto,
  //   userId?: string,
  //   userRole?: UserRole
  // ) {
  //   const subject = await this.prisma.subject.findUnique({
  //     where: { id },
  //   });

  //   if (!subject) {
  //     throw new NotFoundException("Subject not found");
  //   }

  //   // Only admins can update subjects
  //   // Teacher assignments are managed via TeacherSubjectAssignment table
  //   if (userId && userRole && RoleHelper.isTeacher(userRole)) {
  //     throw new ForbiddenException("Only admins can update subjects");
  //   }

  //   // Check if new name conflicts with existing subject
  //   if (updateSubjectDto.name && updateSubjectDto.name !== subject.name) {
  //     const existingSubject = await this.prisma.subject.findUnique({
  //       where: { name: updateSubjectDto.name },
  //     });

  //     if (existingSubject) {
  //       throw new ConflictException("Subject with this name already exists");
  //     }
  //   }

  //   // Check if new code conflicts with existing subject
  //   if (updateSubjectDto.code && updateSubjectDto.code !== subject.code) {
  //     const existingCode = await this.prisma.subject.findUnique({
  //       where: { code: updateSubjectDto.code },
  //     });

  //     if (existingCode) {
  //       throw new ConflictException("Subject with this code already exists");
  //     }
  //   }

  //   // Delete old image if uploading a new one
  //   if (
  //     updateSubjectDto.imageUrl &&
  //     subject.imageUrl &&
  //     updateSubjectDto.imageUrl !== subject.imageUrl
  //   ) {
  //     try {
  //       // Extract key from old URL if it's from our storage
  //       const urlParts = subject.imageUrl.split("/");
  //       const key = urlParts.slice(-2).join("/"); // Get "subjects/filename"
  //       await this.storageService.deleteFile(key);
  //     } catch (error) {
  //       // Continue with update even if old image deletion fails
  //     }
  //   }

  //   return this.prisma.subject.update({
  //     where: { id },
  //     data: updateSubjectDto,
  //   });
  // }
  async update(
    id: string,
    updateSubjectDto: UpdateSubjectDto,
    userId?: string,
    userRole?: UserRole
  ) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        gradeSubjects: true, // Include existing grade assignments
      },
    });

    if (!subject) {
      throw AppException.notFound(
        ErrorCode.SUBJECT_NOT_FOUND,
        "Subject not found"
      );
    }

    // Only admins can update subjects
    if (userId && userRole && RoleHelper.isTeacher(userRole)) {
      throw AppException.forbidden(
        ErrorCode.ACCESS_DENIED,
        "Only admins can update subjects"
      );
    }

    // Check if new name conflicts with existing subject
    if (updateSubjectDto.name && updateSubjectDto.name !== subject.name) {
      const existingSubject = await this.prisma.subject.findUnique({
        where: { name: updateSubjectDto.name },
      });

      if (existingSubject) {
        throw AppException.conflict(
          ErrorCode.BUSINESS_RULE_VIOLATION,
          "Subject with this name already exists"
        );
      }
    }

    // Check if new code conflicts with existing subject
    if (updateSubjectDto.code && updateSubjectDto.code !== subject.code) {
      const existingCode = await this.prisma.subject.findUnique({
        where: { code: updateSubjectDto.code },
      });

      if (existingCode) {
        throw AppException.conflict(
          ErrorCode.BUSINESS_RULE_VIOLATION,
          "Subject with this code already exists"
        );
      }
    }

    // Delete old image if uploading a new one
    if (
      updateSubjectDto.imageUrl &&
      subject.imageUrl &&
      updateSubjectDto.imageUrl !== subject.imageUrl
    ) {
      try {
        // Extract key from old URL if it's from our storage
        const urlParts = subject.imageUrl.split("/");
        const key = urlParts.slice(-2).join("/"); // Get "subjects/filename"
        await this.storageService.deleteFile(key);
      } catch (error) {
        // Continue with update even if old image deletion fails
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update the subject basic info
      const updatedSubject = await tx.subject.update({
        where: { id },
        data: {
          name: updateSubjectDto.name,
          code: updateSubjectDto.code,
          description: updateSubjectDto.description,
          category: updateSubjectDto.category,
          isActive: updateSubjectDto.isActive,
          imageUrl: updateSubjectDto.imageUrl,
        },
      });

      // 2. Handle grade assignments if provided
      if (updateSubjectDto.gradeAssignments !== undefined) {
        // Delete existing grade assignments
        await tx.gradeSubject.deleteMany({
          where: { subjectId: id },
        });

        // Create new grade assignments
        if (updateSubjectDto.gradeAssignments.length > 0) {
          await tx.gradeSubject.createMany({
            data: updateSubjectDto.gradeAssignments.map((assignment) => ({
              gradeId: assignment.gradeId,
              subjectId: id,
              isActive: assignment.isActive !== false, // Default to true
            })),
            skipDuplicates: true,
          });
        }
      }

      // 3. Return the updated subject with grade assignments
      return await tx.subject.findUnique({
        where: { id },
        include: {
          gradeSubjects: {
            include: {
              grade: true,
            },
            where: {
              isActive: true,
            },
          },
        },
      });
    });
  }

  /**
   * Delete a subject
   * - Hard delete by default (permanent deletion)
   * - Soft delete option available (marks as inactive)
   */
  async remove(
    id: string,
    userId?: string,
    userRole?: UserRole,
    isSoftDelete = false
  ) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      throw AppException.notFound(
        ErrorCode.SUBJECT_NOT_FOUND,
        "Subject not found"
      );
    }

    // Only admins can delete subjects
    if (userId && userRole && RoleHelper.isTeacher(userRole)) {
      throw AppException.forbidden(
        ErrorCode.ACCESS_DENIED,
        "Only admins can delete subjects"
      );
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
          const urlParts = subject.imageUrl.split("/");
          const key = urlParts.slice(-2).join("/"); // Get "subjects/filename"
          await this.storageService.deleteFile(key);
        } catch (error) {
          // Continue with deletion even if image deletion fails
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
      throw AppException.notFound(
        ErrorCode.SUBJECT_NOT_FOUND,
        "Subject not found"
      );
    }

    return this.prisma.subject.update({
      where: { id },
      data: { isActive: true },
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
    });
  }
}
