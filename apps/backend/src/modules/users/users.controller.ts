import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Query,
  Res,
  BadRequestException,
  Put, 
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import * as multer from "multer";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { UserManagementService } from "./user-management.service";
import { CreateUserDto, UpdateUserDto, UserResponseDto } from "./dto/user.dto";
import { AppException } from "@common/errors/app-exception";
import { ErrorCode } from "@common/errors/error-codes.enum";
import { JwtAuthGuard } from "@common/guards";
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "@prisma/client";
import { mapPrismaError } from "@common/errors/prisma-error-mapper";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userManagementService: UserManagementService
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "User created successfully",
    type: UserResponseDto,
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      return await this.usersService.create(createUserDto);
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all users with pagination" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  @ApiQuery({ name: "role", required: false, example: "PARENT" })
  @ApiQuery({ name: "status", required: false, example: "ACTIVE" })
  @ApiQuery({ name: "search", required: false, example: "john" })
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("role") role?: string,
    @Query("status") status?: string,
    @Query("search") search?: string
  ): Promise<any> {
    return this.usersService.findAll(
      page ? +page : 1,
      limit ? +limit : 20,
      role,
      status,
      search
    );
  }

  @Get("my-children")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all children for the authenticated parent, with hospital and physio data" })
  async getMyChildren(@Request() req: { user: { id: string } }): Promise<any> {
    const children = await this.usersService.findChildrenForParent(req.user.id);
    return { success: true, data: children };
  }

  @Get("mobile/profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Mobile parent profile payload: parent + children (hospital + physio)" })
  async getMobileProfile(@Request() req: { user: { id: string } }): Promise<any> {
    const payload = await this.usersService.getMobileParentProfile(req.user.id);
    if (!payload) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    return { success: true, data: payload };
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  async getProfile(@Request() req: { user: { id: string } }): Promise<any> {
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    // Wrap in { success, data } so mobile and web clients both work
    return { success: true, data: user };
  }

  @Put("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user profile" })
  async updateProfile(
    @Request() req: { user: { id: string } },
    @Body() updateUserDto: UpdateUserDto
  ): Promise<any> {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Put("profile/avatar")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor("avatar", {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException("Invalid file type"), false);
        }
        cb(null, true);
      },
    })
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload profile avatar" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        avatar: { type: "string", format: "binary" },
      },
    },
  })
  async uploadAvatar(
    @Request() req: { user: { id: string } },
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw AppException.badRequest(ErrorCode.UPLOAD_FAILED, "No file uploaded");
    }
    return this.usersService.updateAvatar(req.user.id, file);
  }

  @Put("profile/password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change password" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["currentPassword", "newPassword"],
      properties: {
        currentPassword: { type: "string" },
        newPassword: { type: "string" },
      },
    },
  })
  async changePassword(
    @Request() req: { user: { id: string } },
    @Body() passwordDto: { currentPassword: string; newPassword: string }
  ) {
    return this.usersService.changePassword(
      req.user.id,
      passwordDto.currentPassword,
      passwordDto.newPassword
    );
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user statistics (Super Admin only)" })
  async getUserStats(): Promise<any> {
    return this.userManagementService.getDashboardStats();
  }

  @Get("hospitals")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all hospitals (Super Admin only)" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "search", required: false })
  async getHospitals(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("status") status?: string,
    @Query("search") search?: string
  ) {
    return this.userManagementService.getHospitals(
      page ? +page : 1,
      limit ? +limit : 20,
      status,
      search
    );
  }

  @Get("children")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all children" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  @ApiQuery({ name: "hospitalId", required: false })
  @ApiQuery({ name: "search", required: false })
  async getChildren(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("hospitalId") hospitalId?: string,
    @Query("search") search?: string
  ) {
    return this.userManagementService.getChildren(
      page ? +page : 1,
      limit ? +limit : 20,
      hospitalId,
      search
    );
  }

  @Get("devices")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get device inventory" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  @ApiQuery({ name: "hospitalId", required: false })
  @ApiQuery({ name: "deviceType", required: false })
  async getDevices(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("hospitalId") hospitalId?: string,
    @Query("deviceType") deviceType?: string
  ) {
    return this.userManagementService.getDevices(
      page ? +page : 1,
      limit ? +limit : 20,
      hospitalId,
      deviceType
    );
  }

  @Get("children/:id/progress")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get child progress records" })
  @ApiParam({ name: "id", description: "Child ID" })
  async getChildProgress(@Param("id") id: string) {
    return this.userManagementService.getChildProgress(id);
  }

  @Get("children/:id/therapy-sessions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get child therapy sessions" })
  @ApiParam({ name: "id", description: "Child ID" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  async getChildTherapySessions(
    @Param("id") id: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.userManagementService.getChildTherapySessions(
      id,
      page ? +page : 1,
      limit ? +limit : 20
    );
  }

  @Get("hospitals/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get hospital details" })
  @ApiParam({ name: "id", description: "Hospital ID" })
  async getHospitalDetails(@Param("id") id: string) {
    return this.userManagementService.getHospitalDetails(id);
  }

  @Get("children/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get child details" })
  @ApiParam({ name: "id", description: "Child ID" })
  async getChildDetails(@Param("id") id: string) {
    return this.userManagementService.getChildDetails(id);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user by ID" })
  @ApiParam({ name: "id", description: "User ID" })
  async findOne(@Param("id") id: string): Promise<any> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    return user;
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user (Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  async update(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any
  ): Promise<any> {
    const isAdmin = req?.user?.role === UserRole.SUPER_ADMIN;
    return this.usersService.update(id, updateUserDto, isAdmin);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user status (Super Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"],
        },
      },
    },
  })
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status: string }
  ): Promise<any> {
    return this.usersService.updateStatus(id, body.status);
  }

  @Post(":id/reset-password")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin reset user password (Super Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        newPassword: { type: "string", minLength: 8 },
        sendEmail: { type: "boolean", default: true },
      },
    },
  })
  async adminResetPassword(
    @Param("id") id: string,
    @Body() body: { newPassword: string; sendEmail?: boolean },
    @Request() req: any
  ): Promise<{ message: string }> {
    return this.usersService.adminResetPassword(
      id,
      body.newPassword,
      req.user.id,
      req.user.role,
      body.sendEmail
    );
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete user (Super Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  async remove(
    @Param("id") id: string,
    @Request() req: any
  ): Promise<{ message: string }> {
    await this.usersService.hardDelete(id, req.user.id, req.user.role);
    return { message: "User deleted successfully" };
  }

  @Post("bulk-upload/validate")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor("file", {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === "text/csv") {
          cb(null, true);
        } else {
          cb(new BadRequestException("Only CSV files are allowed"), false);
        }
      },
    })
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Validate bulk user upload CSV (Super Admin only)" })
  async validateBulkUpload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw AppException.badRequest(ErrorCode.UPLOAD_FAILED, "No file uploaded");
    }
    return await this.usersService.validateBulkUpload(file);
  }

  @Post("bulk-upload/import")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Import validated users (Super Admin only)" })
  async importBulkUsers(@Body() data: { users: any[] }) {
    return await this.usersService.importBulkUsers(data.users);
  }

  @Get("bulk-upload/template")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Download bulk upload CSV template (Super Admin only)" })
  async downloadBulkUploadTemplate(@Res() res: any) {
    const template = `firstName,lastName,email,phone,role,password
John,Doe,john.doe@example.com,0771234567,PARENT,
Jane,Smith,jane.smith@example.com,0771234568,PARENT,
City,Hospital,admin@cityhospital.com,0112345678,HOSPITAL_ADMIN,`;

    const filename = `user_bulk_upload_template_${new Date().toISOString().split("T")[0]}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(template);
  }
}