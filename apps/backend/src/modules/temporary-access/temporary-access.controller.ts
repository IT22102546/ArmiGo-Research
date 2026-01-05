import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  TemporaryAccessService,
  CreateTemporaryAccessDto,
  TemporaryAccessFilterDto,
  RevokeAccessDto,
} from "./temporary-access.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole, TemporaryAccessResource } from "@prisma/client";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: UserRole;
  };
}

@Controller("temporary-access")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TemporaryAccessController {
  constructor(
    private readonly temporaryAccessService: TemporaryAccessService
  ) {}

  @Post()
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async createAccess(
    @Body()
    body: {
      userId: string;
      resourceType: TemporaryAccessResource;
      resourceId: string;
      startDate: string;
      expiresAt: string;
      reason?: string;
    },
    @Request() req: AuthenticatedRequest
  ) {
    const createDto: CreateTemporaryAccessDto = {
      userId: body.userId,
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      startDate: new Date(body.startDate),
      expiresAt: new Date(body.expiresAt),
      reason: body.reason,
      grantedBy: req.user.id,
    };

    return this.temporaryAccessService.createAccess(createDto);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getAccessList(
    @Query("userId") userId?: string,
    @Query("resourceType") resourceType?: TemporaryAccessResource,
    @Query("active") active?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const filters: TemporaryAccessFilterDto = {
      userId,
      resourceType,
      active: active ? active === "true" : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    };

    return this.temporaryAccessService.getAccessList(filters);
  }

  @Get("statistics")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStatistics() {
    return this.temporaryAccessService.getAccessStatistics();
  }

  @Get("user/:userId")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getAccessByUser(@Param("userId") userId: string) {
    return this.temporaryAccessService.getAccessByUser(userId);
  }

  @Get("check")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.INTERNAL_STUDENT,
    UserRole.EXTERNAL_STUDENT
  )
  async checkAccess(
    @Query("userId") userId: string,
    @Query("resourceType") resourceType: TemporaryAccessResource,
    @Query("resourceId") resourceId: string
  ) {
    const hasAccess = await this.temporaryAccessService.checkAccess(
      userId,
      resourceType,
      resourceId
    );

    return { hasAccess };
  }

  @Get(":id")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getAccessById(@Param("id") id: string) {
    return this.temporaryAccessService.getAccessById(id);
  }

  @Patch(":id/revoke")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async revokeAccess(
    @Param("id") id: string,
    @Body() body: { revocationNote?: string },
    @Request() req: AuthenticatedRequest
  ) {
    const revokeDto: RevokeAccessDto = {
      revokedBy: req.user.id,
      revocationNote: body.revocationNote,
    };

    return this.temporaryAccessService.revokeAccess(id, revokeDto);
  }

  @Post("cleanup")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async cleanupExpired() {
    return this.temporaryAccessService.cleanupExpiredAccess();
  }
}
