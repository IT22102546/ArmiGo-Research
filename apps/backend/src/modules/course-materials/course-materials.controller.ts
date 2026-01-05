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
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { AppException } from "@common/errors/app-exception";
import { ErrorCode } from "@common/errors/error-codes.enum";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { CourseMaterialsService } from "./course-materials.service";
import { StorageService } from "../../infrastructure/storage/storage.service";
import {
  CreateCourseMaterialDto,
  UpdateCourseMaterialDto,
  CourseMaterialQueryDto,
  CourseMaterialResponseDto,
} from "./dto";
import { JwtAuthGuard, RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "@prisma/client";

@ApiTags("Course Materials")
@Controller("course-materials")
export class CourseMaterialsController {
  constructor(
    private readonly courseMaterialsService: CourseMaterialsService,
    private readonly storageService: StorageService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Upload a new course material",
    description: "Teachers and admins can upload course materials",
  })
  @ApiResponse({
    status: 201,
    description: "Material uploaded successfully",
    type: CourseMaterialResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Only teachers and admins can upload materials",
  })
  async create(
    @Body() createDto: CreateCourseMaterialDto,
    @Request() req: any
  ) {
    return this.courseMaterialsService.create(createDto, req.user.id);
  }

  @Post("upload")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Upload a file and create course material",
    description: "Upload file and automatically create course material record",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
        title: { type: "string" },
        description: { type: "string" },
        grade: { type: "array", items: { type: "string" } },
        subject: { type: "string" },
        type: {
          enum: [
            "NOTES",
            "SLIDES",
            "VIDEO",
            "ASSIGNMENT",
            "REFERENCE",
            "OTHER",
          ],
        },
        classId: { type: "string" },
        isPublic: { type: "boolean" },
      },
      required: ["file", "title", "grade", "type"],
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: CreateCourseMaterialDto & {
      grade: string | string[];
      isPublic?: string | boolean;
    },
    @Request() req: { user: { id: string } }
  ) {
    if (!file) {
      throw AppException.badRequest(
        ErrorCode.UPLOAD_FAILED,
        "File is required"
      );
    }

    // Upload file to storage service (S3, etc.)
    const uploadResult = await this.storageService.uploadFile(
      file.buffer,
      `course-materials/${Date.now()}-${file.originalname}`,
      file.mimetype
    );

    const createDto: CreateCourseMaterialDto = {
      title: body.title,
      description: body.description,
      grade: Array.isArray(body.grade) ? body.grade : [body.grade],
      subject: body.subject,
      type: body.type,
      classId: body.classId,
      fileUrl: uploadResult.url,
      fileSize: file.size,
      fileType: file.mimetype,
      isPublic: String(body.isPublic) === "true" || body.isPublic === true,
    };

    return this.courseMaterialsService.create(createDto, req.user.id);
  }

  @Get()
  @ApiOperation({
    summary: "Get all course materials",
    description: "Retrieve course materials with pagination and filtering",
  })
  @ApiResponse({
    status: 200,
    description: "Materials retrieved successfully",
  })
  async findAll(
    @Query() query: CourseMaterialQueryDto,
    @Request() req?: { user?: { id: string } }
  ) {
    const userId = req?.user?.id;
    return this.courseMaterialsService.findAll(query, userId);
  }

  @Get("my-materials")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get my uploaded materials",
    description: "Get materials uploaded by the current user",
  })
  async getMyMaterials(
    @Query() query: CourseMaterialQueryDto,
    @Request() req: any
  ) {
    return this.courseMaterialsService.getMyMaterials(req.user.id, query);
  }

  @Get("class/:classId")
  @ApiOperation({
    summary: "Get materials for a specific class",
    description: "Retrieve all materials associated with a class",
  })
  @ApiParam({
    name: "classId",
    description: "Class ID",
    example: "clp1234567890abcdef",
  })
  async getByClass(@Param("classId") classId: string, @Request() req?: any) {
    const userId = req?.user?.id;
    return this.courseMaterialsService.getByClass(classId, userId);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a course material by ID",
    description: "Retrieve a specific course material",
  })
  @ApiParam({
    name: "id",
    description: "Material ID",
    example: "clp1234567890abcdef",
  })
  async findOne(@Param("id") id: string, @Request() req?: any) {
    const userId = req?.user?.id;
    return this.courseMaterialsService.findOne(id, userId);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update a course material",
    description: "Update material details (only by owner or admin)",
  })
  @ApiParam({
    name: "id",
    description: "Material ID",
    example: "clp1234567890abcdef",
  })
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateCourseMaterialDto,
    @Request() req: any
  ) {
    return this.courseMaterialsService.update(id, updateDto, req.user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Delete a course material",
    description: "Delete material (only by owner or admin)",
  })
  @ApiParam({
    name: "id",
    description: "Material ID",
    example: "clp1234567890abcdef",
  })
  async remove(@Param("id") id: string, @Request() req: any) {
    return this.courseMaterialsService.remove(id, req.user.id);
  }

  @Post(":id/download")
  @ApiOperation({
    summary: "Track download of a material",
    description: "Increment download counter for analytics",
  })
  @ApiParam({
    name: "id",
    description: "Material ID",
    example: "clp1234567890abcdef",
  })
  async trackDownload(@Param("id") id: string) {
    await this.courseMaterialsService.incrementDownload(id);
    return { message: "Download tracked" };
  }
}
