import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { StorageService } from "../storage/storage.service";
import { RoleHelper } from "../../common/helpers/role.helper";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";
import { User, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { AdminGateway } from "../../websocket/admin.gateway";

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private adminGateway: AdminGateway
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, "password">> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
      },
    });

    // Create role-specific profiles
    if (RoleHelper.isTeacher(createUserDto.role)) {
      await this.prisma.teacherProfile.create({
        data: {
          userId: user.id,
          isExternal: RoleHelper.isExternal(createUserDto.role),
        },
      });
    } else if (RoleHelper.isStudent(createUserDto.role)) {
      await this.prisma.studentProfile.create({
        data: {
          userId: user.id,
          studentId: `STU${Date.now()}`, // Generate temporary student ID
          academicYear: new Date().getFullYear().toString(),
        },
      });
    }

    // Remove password from response
    const { password, ...result } = user;

    // Emit real-time event
    this.adminGateway.server.emit('userCreated', {
      userId: user.id,
      data: result,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    role?: string,
    status?: string,
    search?: string
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

    // Filter by role
    if (role) {
      where.role = role;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Search in name and email
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.user.count({ where });
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatar: true,
        phone: true,
        dateOfBirth: true,
        bio: true,
        emailVerified: true,
        lastLoginAt: true,
        lastLogoutAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      data: users,
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

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        teacherProfile: true,
        studentProfile: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        teacherProfile: true,
        studentProfile: true,
      },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async updateLastLogout(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        lastLogoutAt: new Date(),
      },
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatar: true,
        phone: true,
        dateOfBirth: true,
        bio: true,
        emailVerified: true,
        lastLoginAt: true,
        lastLogoutAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Emit real-time event
    this.adminGateway.server.emit('userUpdated', {
      userId: id,
      data: updatedUser,
      timestamp: new Date().toISOString(),
    });

    return updatedUser;
  }

  async remove(id: string, requesterId: string, requesterRole: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Prevent deleting super admin users unless you are a super admin
    if (user.role === UserRole.SUPER_ADMIN && requesterRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Cannot delete super admin user");
    }

    // Prevent self-deletion
    if (id === requesterId) {
      throw new ForbiddenException("Cannot delete your own account");
    }

    // Hard delete - permanently remove user from database
    await this.prisma.user.delete({
      where: { id },
    });

    // Emit real-time event
    this.adminGateway.server.emit('userDeleted', {
      userId: id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Delete old avatar if exists
    if (user.avatar) {
      try {
        await this.storageService.deleteFile(user.avatar);
      } catch (error) {
        // Silently handle avatar deletion errors
      }
    }

    // Upload new avatar
    const uploadResult = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      "avatars"
    );

    // Update user record
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: uploadResult.url },
    });

    return {
      message: "Avatar updated successfully",
      avatar: uploadResult.url,
    };
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw new BadRequestException("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      message: "Password changed successfully",
    };
  }
}
