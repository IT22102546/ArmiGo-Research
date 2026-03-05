import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UsersService } from "@modules/users/users.service";
import { StorageService } from "@infrastructure/storage/storage.service";
import { PublicationsService } from "./publications.service";
import { CreatePublicationDto, UpdatePublicationDto } from "./dtos/publication.dto";

@ApiTags("Publications")
@Controller("publications")
@ApiBearerAuth()
export class PublicationsController {
  constructor(
    private readonly publicationsService: PublicationsService,
    private readonly usersService: UsersService,
    private readonly storageService: StorageService
  ) {}

  private async resolveScopedHospitalId(req: any): Promise<string | undefined> {
    const roles = Array.isArray(req?.user?.roles)
      ? req.user.roles
      : [req?.user?.role].filter(Boolean);

    const isHospitalScopedUser =
      roles.includes("HOSPITAL_ADMIN") && req?.user?.email !== "armigo@gmail.com";

    if (!isHospitalScopedUser) {
      return undefined;
    }

    const userId = req?.user?.id || req?.user?.sub;
    if (!userId) {
      return undefined;
    }

    const user = await this.usersService.findById(userId);
    return user?.hospitalProfile?.hospitalId || undefined;
  }

  @Get()
  @ApiOperation({ summary: "Get publications" })
  async getAll(
    @Request() req: any,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    const data = await this.publicationsService.getAll({
      userId: req?.user?.id,
      role: req?.user?.role,
      scopedHospitalId,
      search,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return {
      success: true,
      data,
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get publication by id" })
  async getById(@Request() req: any, @Param("id") id: string) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    const data = await this.publicationsService.getById(id, {
      userId: req?.user?.id,
      role: req?.user?.role,
      scopedHospitalId,
    });

    return {
      success: true,
      data,
    };
  }

  @Post()
  @ApiOperation({ summary: "Create publication" })
  async create(@Request() req: any, @Body() body: CreatePublicationDto) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    const data = await this.publicationsService.create(body, {
      userId: req?.user?.id,
      scopedHospitalId,
    });

    return {
      success: true,
      data,
      message: "Publication created successfully",
    };
  }

  @Put(":id")
  @ApiOperation({ summary: "Update publication" })
  async update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() body: UpdatePublicationDto
  ) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    const data = await this.publicationsService.update(id, body, {
      userId: req?.user?.id,
      role: req?.user?.role,
      scopedHospitalId,
    });

    return {
      success: true,
      data,
      message: "Publication updated successfully",
    };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete publication" })
  async delete(@Request() req: any, @Param("id") id: string) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    const result = await this.publicationsService.delete(id, {
      userId: req?.user?.id,
      role: req?.user?.role,
      scopedHospitalId,
    });

    return {
      success: true,
      message: result.message,
    };
  }

  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
        type: {
          type: "string",
          enum: ["publication", "cover"],
          default: "publication",
        },
      },
      required: ["file"],
    },
  })
  @ApiOperation({ summary: "Upload publication file" })
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body("type") type?: "publication" | "cover"
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const uploadType = type === "cover" ? "cover" : "publication";

    const allowedPublicationTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const allowedCoverTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (
      uploadType === "publication" &&
      !allowedPublicationTypes.includes(file.mimetype)
    ) {
      throw new BadRequestException("Only PDF, DOC, and DOCX files are allowed");
    }

    if (uploadType === "cover" && !allowedCoverTypes.includes(file.mimetype)) {
      throw new BadRequestException("Only image files are allowed for cover");
    }

    const uploaded = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      "publication",
      {
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        userId: req?.user?.id,
        category: "publication",
        maxSize: 50 * 1024 * 1024,
        allowedMimeTypes:
          uploadType === "publication" ? allowedPublicationTypes : allowedCoverTypes,
      }
    );

    return {
      success: true,
      data: {
        url: uploaded.url,
        key: uploaded.key,
        bucket: uploaded.bucket,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      },
    };
  }
}
