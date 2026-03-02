// src/modules/users/users.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { StorageService } from "../../infrastructure/storage/storage.service";
import { NotificationsService } from "../notifications/notifications.service";
import { EmailService } from "../notifications/services/email.service";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";
import { User, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { AppException, ErrorCode } from "@common/errors";
import * as Papa from "papaparse";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private notificationsService: NotificationsService,
    private emailService: EmailService
  ) {}

  /**
   * Helper to extract error message
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }

  /**
   * Generate a secure random password
   */
  private generateSecurePassword(length: number = 12): string {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*";
    const allChars = uppercase + lowercase + numbers + special;

    let password = "";
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }

  async create(createUserDto: CreateUserDto): Promise<any> {
    // Check if user already exists by phone
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: createUserDto.phone },
    });

    if (existingUser) {
      throw new AppException(ErrorCode.USER_ALREADY_EXISTS, undefined, {
        phone: createUserDto.phone,
      });
    }

    // Check if email exists (if provided)
    if (createUserDto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });
      if (existingEmail) {
        throw new AppException(ErrorCode.USER_ALREADY_EXISTS, undefined, {
          email: createUserDto.email,
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    // Prepare user data
    const userData: any = {
      phone: createUserDto.phone,
      email: createUserDto.email || null,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      role: createUserDto.role,
      status: UserStatus.ACTIVE,
      address: createUserDto.address || null,
      city: createUserDto.city || null,
      districtId: createUserDto.districtId || null,
      zoneId: createUserDto.zoneId || null,
    };

    // Convert date string to Date if provided
    if (createUserDto.dateOfBirth) {
      const dateStr = createUserDto.dateOfBirth;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        userData.dateOfBirth = new Date(`${dateStr}T12:00:00.000Z`);
      } else {
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          userData.dateOfBirth = parsedDate;
        }
      }
    }

    // Create user
    const user = await this.prisma.user.create({
      data: userData,
    });

    // Create role-specific profiles
    if (user.role === UserRole.PARENT) {
      // Create parent profile
      await this.prisma.parentProfile.create({
        data: {
          userId: user.id,
          occupation: createUserDto.parentProfile?.occupation || null,
          preferredContact: createUserDto.parentProfile?.preferredContact || null,
        },
      });
    } else if (user.role === UserRole.HOSPITAL_ADMIN) {
      // Hospital admin is created separately via Hospital management
      // This is just the user account - hospital profile will be created when hospital is added
      this.logger.log(`Created hospital admin user: ${user.id}`);
    }

    // Remove password from response
    const { password, ...result } = user;

    this.logger.log(`User created: ${user.id} with role ${user.role}`);

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
    total: number;
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
    if (role && role !== "ALL") {
      if (Object.values(UserRole).includes(role as UserRole)) {
        where.role = role as UserRole;
      }
    }

    // Filter by status
    if (status && status !== "ALL") {
      if (Object.values(UserStatus).includes(status as UserStatus)) {
        where.status = status as UserStatus;
      }
    }

    // Search in name, email, phone
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await this.prisma.user.count({ where });
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: {
        parentProfile: {
          include: {
            children: true,
          },
        },
        hospitalProfile: {
          include: {
            hospital: true,
          },
        },
        district: true,
        zone: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data
    const transformedData = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      address: user.address,
      city: user.city,
      district: user.district,
      zone: user.zone,
      dateOfBirth: user.dateOfBirth,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      parentProfile: user.parentProfile,
      hospitalProfile: user.hospitalProfile,
      children: user.parentProfile?.children || [],
    }));

    return {
      data: transformedData,
      total,
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

  async exportUsers(
    role?: string,
    status?: string,
    search?: string
  ): Promise<string> {
    // Build the where clause
    const where: any = {};

    if (role && role !== "ALL") {
      if (Object.values(UserRole).includes(role as UserRole)) {
        where.role = role as UserRole;
      }
    }

    if (status && status !== "ALL") {
      if (Object.values(UserStatus).includes(status as UserStatus)) {
        where.status = status as UserStatus;
      }
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch all users matching the criteria
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Generate CSV
    const headers = [
      "ID",
      "Email",
      "Phone",
      "First Name",
      "Last Name",
      "Role",
      "Status",
      "Created At",
    ];
    const csvRows = [headers.join(",")];

    for (const user of users) {
      const row = [
        user.id,
        user.email || "",
        user.phone || "",
        user.firstName,
        user.lastName,
        user.role,
        user.status,
        user.createdAt.toISOString(),
      ];
      // Escape fields that might contain commas or quotes
      const escapedRow = row.map((field) => {
        const fieldStr = String(field);
        if (
          fieldStr.includes(",") ||
          fieldStr.includes('"') ||
          fieldStr.includes("\n")
        ) {
          return `"${fieldStr.replace(/"/g, '""')}"`;
        }
        return fieldStr;
      });
      csvRows.push(escapedRow.join(","));
    }

    return csvRows.join("\n");
  }

  /**
   * Get aggregated user statistics
   */
  async getUserStats(role?: string): Promise<any> {
    const where: any = {};

    if (role && role !== "ALL" && Object.values(UserRole).includes(role as UserRole)) {
      where.role = role as UserRole;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      newUsersToday,
      newUsersThisWeek,
      verifiedUsers,
    ] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.count({
        where: { ...where, status: UserStatus.ACTIVE },
      }),
      this.prisma.user.count({
        where: { ...where, status: UserStatus.PENDING },
      }),
      this.prisma.user.count({
        where: { ...where, status: UserStatus.SUSPENDED },
      }),
      this.prisma.user.count({
        where: { ...where, createdAt: { gte: today } },
      }),
      this.prisma.user.count({
        where: { ...where, createdAt: { gte: weekAgo } },
      }),
      this.prisma.user.count({
        where: { ...where, emailVerified: true },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      newUsersToday,
      newUsersThisWeek,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
    };
  }

  /**
   * Bulk update user status (activate/deactivate)
   */
  async bulkUpdateStatus(
    userIds: string[],
    action: "activate" | "deactivate"
  ): Promise<{ success: number; failed: number }> {
    const newStatus =
      action === "activate" ? UserStatus.ACTIVE : UserStatus.INACTIVE;

    const result = await this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { status: newStatus },
    });

    return {
      success: result.count,
      failed: userIds.length - result.count,
    };
  }

  /**
   * Bulk delete users
   */
  async bulkDelete(
    userIds: string[]
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        await this.prisma.user.delete({ where: { id: userId } });
        success++;
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Bulk reset passwords
   */
  async bulkResetPassword(
    userIds: string[]
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, firstName: true },
    });

    for (const user of users) {
      try {
        if (user.email) {
          // Generate a simple reset token
          const resetToken = crypto.randomBytes(32).toString("hex");
          
          // Send reset email (without storing in database)
          await this.emailService.sendPasswordResetEmail(
            user.email,
            user.firstName,
            resetToken
          );
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Bulk send notifications
   */
  async bulkSendNotification(
    userIds: string[],
    title?: string,
    message?: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        await this.notificationsService.createNotification({
          userId,
          title: title || "Important Update",
          message: message || "You have a new notification from the admin.",
          type: "GENERAL",
        });
        success++;
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  async validateBulkUpload(file: Express.Multer.File) {
    // Parse CSV
    const content = file.buffer.toString("utf-8");
    const parsed = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (parsed.errors.length > 0) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        `CSV parsing error: ${parsed.errors[0].message}`
      );
    }

    const rows = parsed.data;
    if (!rows || rows.length === 0) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        "CSV file is empty"
      );
    }

    const validRows = [];
    const errorRows = [];
    const warningRows = [];

    const requiredFields = ["firstName", "lastName", "phone", "role"];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because 1-indexed and header row
      const errors = [];
      const warnings = [];

      // Validate required fields
      const missingFields = requiredFields.filter(
        (field) => !row[field] || row[field].trim() === ""
      );
      if (missingFields.length > 0) {
        errors.push({
          field: missingFields.join(", "),
          message: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }

      // Validate role
      if (row.role && !Object.values(UserRole).includes(row.role as UserRole)) {
        errors.push({
          field: "role",
          message: `Invalid role: ${row.role}. Must be one of: ${Object.values(UserRole).join(", ")}`,
        });
      }

      // Validate email format if provided
      if (row.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          errors.push({
            field: "email",
            message: `Invalid email format: ${row.email}`,
          });
        } else {
          // Check if email already exists
          const existingUser = await this.prisma.user.findUnique({
            where: { email: row.email.trim().toLowerCase() },
          });
          if (existingUser) {
            errors.push({
              field: "email",
              message: `User with email ${row.email} already exists`,
            });
          }
        }
      }

      // Validate phone format (Sri Lankan)
      if (row.phone) {
        const phoneRegex = /^(0|\+94)[0-9]{9}$/;
        if (!phoneRegex.test(row.phone.replace(/\s/g, ""))) {
          warnings.push({
            field: "phone",
            message: "Phone number format may be invalid",
          });
        } else {
          // Check if phone already exists
          const existingUser = await this.prisma.user.findUnique({
            where: { phone: row.phone.trim() },
          });
          if (existingUser) {
            errors.push({
              field: "phone",
              message: `User with phone ${row.phone} already exists`,
            });
          }
        }
      }

      // Warn if no password provided (will be auto-generated)
      if (!row.password || row.password.trim() === "") {
        warnings.push({
          field: "password",
          message: "Password will be auto-generated",
        });
      }

      const rowData = {
        row: rowNumber,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email || "",
        phone: row.phone || "",
        role: row.role,
        password: row.password || "",
        errors,
        warnings,
        status:
          errors.length > 0
            ? "error"
            : warnings.length > 0
              ? "warning"
              : "valid",
      };

      if (errors.length > 0) {
        errorRows.push(rowData);
      } else if (warnings.length > 0) {
        warningRows.push(rowData);
        validRows.push(rowData);
      } else {
        validRows.push(rowData);
      }
    }

    return {
      totalRows: rows.length,
      validCount: validRows.length,
      errorCount: errorRows.length,
      warningCount: warningRows.length,
      rows: [...validRows, ...errorRows],
    };
  }

  async importBulkUsers(users: any[]) {
    const imported = [];
    const credentials = [];

    for (const userData of users) {
      try {
        // Generate password if not provided
        const password =
          userData.password || this.generateSecurePassword(8);
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await this.prisma.user.create({
          data: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email?.trim().toLowerCase() || null,
            phone: userData.phone?.trim() || null,
            password: hashedPassword,
            role: userData.role as UserRole,
            status: UserStatus.ACTIVE,
          },
        });

        // Create role-specific profiles
        if (user.role === UserRole.PARENT) {
          await this.prisma.parentProfile.create({
            data: {
              userId: user.id,
            },
          });
        }

        imported.push({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
        });

        credentials.push({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
          password: password,
        });
      } catch (error) {
        this.logger.error(
          `Failed to import user ${userData.email}: ${this.getErrorMessage(error)}`
        );
      }
    }

    return {
      imported: imported.length,
      users: imported,
      credentials,
    };
  }

  async findById(id: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        parentProfile: {
          include: {
            children: true,
          },
        },
        hospitalProfile: {
          include: {
            hospital: true,
          },
        },
        district: true,
        zone: true,
      },
    });
  }

async findByEmail(email: string): Promise<User | null> {
  console.log(`   📧 findByEmail: Searching for exact email: "${email}"`);
  
  if (!email) {
    console.log(`   ❌ Email is empty`);
    return null;
  }
  
  const user = await this.prisma.user.findFirst({
    where: { email: email }, // Exact match, no toLowerCase if email is already lowercase
  });
  
  if (user) {
    console.log(`   ✅ Found user: ${user.id} (${user.email})`);
  } else {
    console.log(`   ❌ No user found with email: ${email}`);
    
    // Try case-insensitive search as fallback
    console.log(`   🔍 Trying case-insensitive search...`);
    const caseInsensitiveUser = await this.prisma.user.findFirst({
      where: { 
        email: { 
          equals: email,
          mode: 'insensitive'
        } 
      },
    });
    
    if (caseInsensitiveUser) {
      console.log(`   ✅ Found with case-insensitive: ${caseInsensitiveUser.id} (${caseInsensitiveUser.email})`);
      return caseInsensitiveUser;
    }
  }
  
  return user;
}

  async findByPhone(phone: string): Promise<User | null> {
    // Clean the phone number - remove all non-digits
    const cleanPhone = phone.replace(/\D/g, "");

    this.logger.log(`🔍 findByPhone: Searching for phone=${phone}, cleanPhone=${cleanPhone}`);

    // Determine the format based on the input
    let last9Digits: string;

    if (cleanPhone.length >= 9) {
      last9Digits = cleanPhone.substring(cleanPhone.length - 9);
      this.logger.log(`🔍 Last 9 digits: ${last9Digits}`);
    } else {
      last9Digits = cleanPhone;
    }

    // Generate all possible Sri Lankan phone formats from the last 9 digits
    const phoneFormats = [
      `0${last9Digits}`, // 0770380981
      `94${last9Digits}`, // 94770380981
      `+94${last9Digits}`, // +94770380981
      last9Digits, // 770380981
    ];

    this.logger.log(`🔍 Phone formats to search:`, phoneFormats);

    // Search for user with any of these phone formats
    const user = await this.prisma.user.findFirst({
      where: {
        OR: phoneFormats.map((format) => ({ phone: format })),
      },
      include: {
        parentProfile: true,
        hospitalProfile: true,
      },
    });

    if (user) {
      this.logger.log(`✅ Found user: ${user.id} with phone: ${user.phone}`);
    } else {
      this.logger.log(`❌ No user found with any phone variations`);
    }

    return user;
  }

async findByPhoneOrEmail(identifier: string): Promise<User | null> {
  console.log(`\n🔍 findByPhoneOrEmail called with: "${identifier}"`);
  
  // Check if identifier contains @ (email)
  if (identifier.includes("@")) {
    console.log(`   Treating as email: ${identifier.toLowerCase()}`);
    return this.findByEmail(identifier.toLowerCase());
  }

  // Otherwise treat as phone
  console.log(`   Treating as phone: ${identifier}`);
  return this.findByPhone(identifier);
}

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, {
        userId: id,
      });
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    isAdmin: boolean = false
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        parentProfile: true,
        hospitalProfile: true,
      },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, {
        userId: id,
      });
    }

    const { parentProfile, hospitalProfile, ...userUpdateData } = updateUserDto as any;

    // SERVER-SIDE VALIDATION: Prevent editing critical immutable fields for non-admins
    const alwaysImmutableFields = ["password", "id"];
    const nonAdminImmutableFields = isAdmin
      ? alwaysImmutableFields
      : ["role", "status", "password", "id"];
    const attemptedImmutableChanges = nonAdminImmutableFields.filter((field) =>
      userUpdateData.hasOwnProperty(field)
    );

    if (attemptedImmutableChanges.length > 0) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_FAILED,
        `The following fields cannot be modified: ${attemptedImmutableChanges.join(", ")}`,
        {
          immutableFields: attemptedImmutableChanges,
        }
      );
    }

    // Handle district lookup if provided
    if (userUpdateData && typeof userUpdateData.district === "string") {
      try {
        const districtIdCandidate = userUpdateData.district;
        let resolvedDistrictId: string | null = null;

        const foundById = await this.prisma.district.findUnique({
          where: { id: districtIdCandidate },
        });

        if (foundById) {
          resolvedDistrictId = foundById.id;
        } else {
          const foundByName = await this.prisma.district.findFirst({
            where: {
              name: { equals: districtIdCandidate, mode: "insensitive" },
            },
          });
          if (foundByName) {
            resolvedDistrictId = foundByName.id;
          }
        }

        if (resolvedDistrictId) {
          userUpdateData.districtId = resolvedDistrictId;
        }
      } catch (err) {
        // If district lookup fails, remove the district key
      } finally {
        delete userUpdateData.district;
      }
    }

    // Convert date strings to Date objects if necessary
    if (userUpdateData && typeof userUpdateData.dateOfBirth === "string") {
      const dateStr = userUpdateData.dateOfBirth as string;
      if (dateStr.trim() === "") {
        userUpdateData.dateOfBirth = null;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        userUpdateData.dateOfBirth = new Date(`${dateStr}T12:00:00.000Z`);
      } else {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          userUpdateData.dateOfBirth = parsed;
        }
      }
    }

    // Update user data
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: userUpdateData,
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
        address: true,
        city: true,
        districtId: true,
        emailVerified: true,
        phoneVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Update parent profile if data provided
    if (parentProfile && user.parentProfile) {
      await this.prisma.parentProfile.update({
        where: { userId: id },
        data: parentProfile,
      });
    }

    this.logger.log(`User updated: ${id}`);

    return updatedUser;
  }

  async hardDelete(
    id: string,
    requesterId: string,
    requesterRole: string
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, {
        userId: id,
      });
    }

    // Prevent deleting super admin users unless you are a super admin
    if (
      user.role === UserRole.SUPER_ADMIN &&
      requesterRole !== UserRole.SUPER_ADMIN
    ) {
      throw AppException.forbidden("Cannot delete super admin user", {
        userId: id,
        role: user.role,
      });
    }

    // Prevent self-deletion
    if (id === requesterId) {
      throw AppException.forbidden("Cannot delete your own account", {
        userId: id,
        deletedBy: requesterId,
      });
    }

    // Check for related records
    const [childCount, hospitalCount] = await Promise.all([
      this.prisma.child.count({ where: { parentId: id } }),
      this.prisma.hospital.count({ where: { createdById: id } }),
    ]);

    const relatedRecords = [];

    if (childCount > 0) {
      relatedRecords.push(`${childCount} child(ren)`);
    }
    if (hospitalCount > 0) {
      relatedRecords.push(`${hospitalCount} hospital(s)`);
    }

    // If there are related records, throw an error
    if (relatedRecords.length > 0) {
      throw new AppException(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        `Cannot delete user because they have ${relatedRecords.join(", ")}. ` +
          `Please consider setting the user status to INACTIVE instead.`,
        { userId: id, relatedRecords }
      );
    }

    try {
      await this.prisma.user.delete({
        where: { id },
      });

      this.logger.log(`User deleted: ${id}`);
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === "P2003") {
        throw new AppException(
          ErrorCode.CONSTRAINT_VIOLATION,
          "Cannot delete user due to existing related records.",
          { userId: id, errorCode: err.code }
        );
      }
      throw error;
    }
  }

  /**
   * Deactivate a user (soft delete)
   */
  async deactivate(
    id: string,
    requesterId: string,
    requesterRole: string
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, {
        userId: id,
      });
    }

    // Prevent deactivating super admin users unless you are a super admin
    if (
      user.role === UserRole.SUPER_ADMIN &&
      requesterRole !== UserRole.SUPER_ADMIN
    ) {
      throw AppException.forbidden("Cannot deactivate super admin user", {
        userId: id,
        role: user.role,
      });
    }

    // Prevent self-deactivation
    if (id === requesterId) {
      throw AppException.forbidden("Cannot deactivate your own account", {
        userId: id,
        deactivatedBy: requesterId,
      });
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new AppException(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        "User is already inactive",
        { userId: id, currentStatus: user.status }
      );
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.INACTIVE,
      },
    });

    this.logger.log(`User deactivated: ${id}`);
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    // Validate file
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!file) {
      throw AppException.badRequest(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "No file uploaded",
        { userId }
      );
    }

    let buffer: Buffer;
    if ((file as any).buffer) {
      buffer = (file as any).buffer;
    } else if ((file as any).path) {
      try {
        const fs = await import("fs/promises");
        buffer = await fs.readFile((file as any).path);
      } catch (err) {
        throw AppException.internal(
          ErrorCode.FILE_NOT_FOUND,
          "Failed to read uploaded file",
          { userId }
        );
      }
    } else {
      throw AppException.badRequest(
        ErrorCode.INVALID_INPUT,
        "Invalid uploaded file",
        { userId }
      );
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw AppException.badRequest(
        ErrorCode.INVALID_INPUT,
        "Invalid file type",
        { userId, mimeType: file.mimetype }
      );
    }

    if (buffer.length > maxSize) {
      throw AppException.badRequest(
        ErrorCode.FILE_TOO_LARGE,
        `File exceeds maximum size of ${Math.round(maxSize / (1024 * 1024))}MB`,
        { userId }
      );
    }

    const uploadResult = await this.storageService.uploadFile(
      buffer,
      file.originalname,
      file.mimetype,
      "profile",
      {
        userId,
        allowedMimeTypes,
        maxSize,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: buffer.length,
        category: "profile",
      }
    );

    if (user.avatar) {
      try {
        await this.storageService.deleteFile(user.avatar);
      } catch (err) {
        // Log and continue
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: uploadResult.url },
      select: { avatar: true },
    });

    this.logger.log(`Avatar updated for user: ${userId}`);

    return { avatar: updatedUser.avatar };
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
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw new AppException(
        ErrorCode.INVALID_CREDENTIALS,
        "Current password is incorrect",
        { userId: userId }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      message: "Password changed successfully",
    };
  }

  /**
   * Update user status
   */
  async updateStatus(userId: string, status: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    if (!Object.values(UserStatus).includes(status as UserStatus)) {
      throw new AppException(ErrorCode.VALIDATION_FAILED, "Invalid status", {
        providedStatus: status,
      });
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: status as UserStatus },
    });

    this.logger.log(`User status updated: ${userId} -> ${status}`);

    return {
      success: true,
      message: `User status updated to ${status}`,
      data: updated,
    };
  }

  /**
   * Admin reset user password
   */
  async adminResetPassword(
    userId: string,
    newPassword: string,
    adminId: string,
    adminRole: UserRole,
    sendEmail: boolean = true
  ): Promise<{ message: string }> {
    // Check if admin has permission
    if (adminRole !== UserRole.SUPER_ADMIN && adminRole !== UserRole.HOSPITAL_ADMIN) {
      throw new AppException(
        ErrorCode.INSUFFICIENT_PERMISSIONS,
        "Only admins can reset user passwords",
        { adminId, adminRole }
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    if (
      user.role === UserRole.SUPER_ADMIN &&
      adminRole !== UserRole.SUPER_ADMIN
    ) {
      throw new AppException(
        ErrorCode.INSUFFICIENT_PERMISSIONS,
        "Only super admins can reset super admin passwords",
        { adminId, targetUserId: userId }
      );
    }

    if (newPassword.length < 8) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        "Password must be at least 8 characters long",
        { userId }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    if (sendEmail && user.email) {
      await this.emailService.sendEmail(
        user.email,
        "Your Password Has Been Reset",
        `Hello ${user.firstName},\n\nYour password has been reset by an administrator. Your new password is: ${newPassword}\n\nPlease change this password after logging in.\n\nArmiGo Team`
      );
    }

    return {
      message: "Password reset successfully",
    };
  }
}