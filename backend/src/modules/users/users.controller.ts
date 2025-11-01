import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
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
import { CreateUserDto, UpdateUserDto, UserResponseDto } from "./dto/user.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: "Create a new user",
    description: "Creates a new user account with the provided information",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "User created successfully",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data",
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Email already exists",
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all users",
    description: "Retrieves a paginated list of all users with optional filtering (Admin only)",
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 20,
  })
  @ApiQuery({
    name: 'role',
    required: false,
    description: 'Filter by role',
    example: 'STUDENT',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
    example: 'ACTIVE',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in name and email',
    example: 'john',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Users retrieved successfully with pagination",
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserResponseDto' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            pages: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Insufficient permissions",
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<any> {
    return this.usersService.findAll(
      page ? +page : 1,
      limit ? +limit : 20,
      role,
      status,
      search,
    );
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current user profile",
    description: "Retrieves the profile of the currently authenticated user",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Profile retrieved successfully",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async getProfile(@Request() req): Promise<UserResponseDto> {
    return this.usersService.findById(req.user.id);
  }

  @Put("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update current user profile",
    description: "Updates the profile of the currently authenticated user",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Profile updated successfully",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async updateProfile(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Put("profile/avatar")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor("avatar"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Upload profile avatar",
    description:
      "Uploads a new profile picture for the currently authenticated user",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        avatar: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Avatar uploaded successfully",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid file format",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    return this.usersService.updateAvatar(req.user.id, file);
  }

  @Put("profile/password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Change password",
    description: "Changes the password for the currently authenticated user",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["currentPassword", "newPassword"],
      properties: {
        currentPassword: {
          type: "string",
          example: "currentPassword123",
        },
        newPassword: {
          type: "string",
          example: "newPassword123",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Password changed successfully",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid current password",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async changePassword(
    @Request() req,
    @Body() passwordDto: { currentPassword: string; newPassword: string }
  ) {
    return this.usersService.changePassword(
      req.user.id,
      passwordDto.currentPassword,
      passwordDto.newPassword
    );
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user by ID",
    description: "Retrieves a specific user by their ID",
  })
  @ApiParam({
    name: "id",
    description: "User unique identifier",
    example: "uuid-string",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User retrieved successfully",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "User not found",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async findOne(@Param("id") id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update user",
    description: "Updates user information",
  })
  @ApiParam({
    name: "id",
    description: "User unique identifier",
    example: "uuid-string",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User updated successfully",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "User not found",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async update(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Delete user",
    description: "Permanently deletes a user from the system. Super admin users can only be deleted by other super admins.",
  })
  @ApiParam({
    name: "id",
    description: "User unique identifier",
    example: "uuid-string",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User deleted successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "User not found",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async remove(@Param("id") id: string, @Request() req): Promise<{ message: string }> {
    await this.usersService.remove(id, req.user.id, req.user.role);
    return { message: "User deleted successfully" };
  }
}
