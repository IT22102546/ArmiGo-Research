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
  Query,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto, EnrollStudentDto, ClassResponseDto } from './dto/class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClassStatus } from '@prisma/client';

@ApiTags("Classes")
@Controller("classes")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @ApiOperation({
    summary: "Create a new class",
    description: "Creates a new class. Only teachers can create classes.",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Class created successfully",
    type: ClassResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Only teachers can create classes",
  })
  async create(
    @Body() createClassDto: CreateClassDto,
    @Request() req
  ): Promise<any> {
    return this.classesService.create(createClassDto, req.user.id);
  }

  @Get()
  @ApiOperation({
    summary: "Get all classes",
    description:
      "Retrieves a paginated list of classes with optional filtering",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Items per page",
    example: 10,
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ClassStatus,
    description: "Filter by class status",
  })
  @ApiQuery({
    name: "subject",
    required: false,
    description: "Filter by subject",
    example: "Mathematics",
  })
  @ApiQuery({
    name: "grade",
    required: false,
    description: "Filter by grade",
    example: "12",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Classes retrieved successfully",
  })
  async findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: ClassStatus,
    @Query("subject") subject?: string,
    @Query("grade") grade?: string
  ): Promise<any> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.classesService.findAll(
      pageNum,
      limitNum,
      status,
      subject,
      grade
    );
  }

  @Get("my-classes")
  @ApiOperation({
    summary: "Get current user classes",
    description:
      "Retrieves classes based on user role (teacher classes or student enrollments)",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User classes retrieved successfully",
  })
  async getMyClasses(@Request() req): Promise<any> {
    const user = req.user;

    if (user.role === "TEACHER" || user.role === "EXTERNAL_TEACHER") {
      return this.classesService.getTeacherClasses(user.id);
    } else if (user.role === "STUDENT" || user.role === "EXTERNAL_STUDENT") {
      return this.classesService.getStudentEnrollments(user.id);
    } else {
      // Admin can see all classes
      return this.classesService.findAll(1, 100);
    }
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get class by ID",
    description: "Retrieves detailed information about a specific class",
  })
  @ApiParam({
    name: "id",
    description: "Class unique identifier",
    example: "class_1234567890",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Class retrieved successfully",
    type: ClassResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Class not found",
  })
  async findOne(@Param("id") id: string): Promise<any> {
    return this.classesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update class",
    description:
      "Updates class information. Only the class teacher or admin can update.",
  })
  @ApiParam({
    name: "id",
    description: "Class unique identifier",
    example: "class_1234567890",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Class updated successfully",
    type: ClassResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Class not found",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Insufficient permissions",
  })
  async update(
    @Param("id") id: string,
    @Body() updateClassDto: UpdateClassDto,
    @Request() req
  ): Promise<any> {
    return this.classesService.update(id, updateClassDto, req.user.id);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete class",
    description:
      "Soft deletes a class by setting status to cancelled. Only the class teacher or admin can delete.",
  })
  @ApiParam({
    name: "id",
    description: "Class unique identifier",
    example: "class_1234567890",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Class deleted successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Class not found",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Insufficient permissions",
  })
  async remove(
    @Param("id") id: string,
    @Request() req
  ): Promise<{ message: string }> {
    await this.classesService.remove(id, req.user.id);
    return { message: "Class deleted successfully" };
  }

  @Post(":id/enroll")
  @ApiOperation({
    summary: "Enroll student in class",
    description: "Enrolls a student in the specified class",
  })
  @ApiParam({
    name: "id",
    description: "Class unique identifier",
    example: "class_1234567890",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Student enrolled successfully",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      "Invalid enrollment request (class full, already enrolled, etc.)",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Class or student not found",
  })
  async enrollStudent(
    @Param("id") classId: string,
    @Body() enrollStudentDto: EnrollStudentDto
  ): Promise<any> {
    return this.classesService.enrollStudent(classId, enrollStudentDto);
  }

  @Delete(":id/enroll/:studentId")
  @ApiOperation({
    summary: "Unenroll student from class",
    description: "Removes a student enrollment from the specified class",
  })
  @ApiParam({
    name: "id",
    description: "Class unique identifier",
    example: "class_1234567890",
  })
  @ApiParam({
    name: "studentId",
    description: "Student user identifier",
    example: "user_student123",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Student unenrolled successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Enrollment not found",
  })
  async unenrollStudent(
    @Param("id") classId: string,
    @Param("studentId") studentId: string
  ): Promise<{ message: string }> {
    await this.classesService.unenrollStudent(classId, studentId);
    return { message: "Student unenrolled successfully" };
  }

  @Get("teachers/list")
  @ApiOperation({
    summary: "Get list of teachers",
    description: "Retrieves a list of all teachers for class assignment",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Teachers list retrieved successfully",
  })
  async getTeachersList(): Promise<any> {
    return this.classesService.getTeachersList();
  }

  @Get("students/list")
  @ApiOperation({
    summary: "Get list of students",
    description: "Retrieves a list of all students for class enrollment",
  })
  @ApiQuery({
    name: "grade",
    required: false,
    description: "Filter students by grade",
    example: "10",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Students list retrieved successfully",
  })
  async getStudentsList(@Query("grade") grade?: string): Promise<any> {
    return this.classesService.getStudentsList(grade);
  }

  @Post(":id/start")
  @ApiOperation({
    summary: "Start a class",
    description:
      "Marks a class as live so students can join. Only the assigned teacher can start the class.",
  })
  @ApiParam({
    name: "id",
    description: "Class unique identifier",
    example: "class_1234567890",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Class started successfully",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Only the assigned teacher can start the class",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Class not found",
  })
  async startClass(@Param("id") id: string, @Request() req): Promise<any> {
    return this.classesService.startClass(id, req.user.id);
  }

  @Post(":id/stop")
  @ApiOperation({
    summary: "Stop a class",
    description:
      "Marks a class as no longer live. Only the assigned teacher can stop the class.",
  })
  @ApiParam({
    name: "id",
    description: "Class unique identifier",
    example: "class_1234567890",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Class stopped successfully",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Only the assigned teacher can stop the class",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Class not found",
  })
  async stopClass(@Param("id") id: string, @Request() req): Promise<any> {
    return this.classesService.stopClass(id, req.user.id);
  }

  @Get("today")
  @ApiOperation({
    summary: "Get today's classes",
    description:
      "Retrieves all classes scheduled for today that the user has access to",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Today's classes retrieved successfully",
  })
  async getTodaysClasses(@Request() req): Promise<any> {
    return this.classesService.getTodaysClasses(req.user.id);
  }

  @Get(":id/enrolled-students")
  @ApiOperation({
    summary: "Get enrolled students",
    description: "Retrieves the list of students enrolled in a specific class",
  })
  @ApiParam({
    name: "id",
    description: "Class unique identifier",
    example: "class_1234567890",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Enrolled students retrieved successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Class not found",
  })
  async getEnrolledStudents(@Param("id") id: string): Promise<any> {
    return this.classesService.getEnrolledStudents(id);
  }
}