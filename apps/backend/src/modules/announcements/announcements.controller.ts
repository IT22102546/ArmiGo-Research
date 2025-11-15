import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { AnnouncementsService } from "./announcements.service";
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  AnnouncementFiltersDto,
} from "./dto";

@ApiTags("Announcements")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("announcements")
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: "Create new announcement" })
  @ApiResponse({
    status: 201,
    description: "Announcement created successfully",
  })
  async create(@Body() dto: CreateAnnouncementDto, @Request() req: any) {
    return this.announcementsService.create(dto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: "Get all announcements with filters" })
  @ApiResponse({ status: 200, description: "Returns paginated announcements" })
  async getAll(@Query() filters: AnnouncementFiltersDto) {
    return this.announcementsService.getAll(filters);
  }

  @Get("me")
  @ApiOperation({ summary: "Get announcements for current user" })
  @ApiResponse({ status: 200, description: "Returns user announcements" })
  async getUserAnnouncements(
    @Request() req: any,
    @Query() filters: AnnouncementFiltersDto
  ) {
    return this.announcementsService.getUserAnnouncements(
      req.user.userId,
      req.user.role,
      filters
    );
  }

  @Get("unread/count")
  @ApiOperation({ summary: "Get unread announcements count for current user" })
  @ApiResponse({ status: 200, description: "Returns unread count" })
  async getUnreadCount(@Request() req: any) {
    return this.announcementsService.getUnreadCount(req.user.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get announcement detail" })
  @ApiResponse({ status: 200, description: "Returns announcement detail" })
  async getDetail(@Param("id") id: string) {
    return this.announcementsService.getDetail(id);
  }

  @Get(":id/statistics")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: "Get announcement read statistics" })
  @ApiResponse({ status: 200, description: "Returns announcement statistics" })
  async getStatistics(@Param("id") id: string) {
    return this.announcementsService.getStatistics(id);
  }

  @Post(":id/read")
  @ApiOperation({ summary: "Mark announcement as read" })
  @ApiResponse({ status: 200, description: "Announcement marked as read" })
  async markAsRead(@Param("id") id: string, @Request() req: any) {
    return this.announcementsService.markAsRead(id, req.user.userId);
  }

  @Patch(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: "Update announcement" })
  @ApiResponse({
    status: 200,
    description: "Announcement updated successfully",
  })
  async update(@Param("id") id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.announcementsService.update(id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: "Delete announcement" })
  @ApiResponse({
    status: 200,
    description: "Announcement deleted successfully",
  })
  async delete(@Param("id") id: string) {
    return this.announcementsService.delete(id);
  }

  @Patch(":id/deactivate")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: "Deactivate announcement" })
  @ApiResponse({
    status: 200,
    description: "Announcement deactivated successfully",
  })
  async deactivate(@Param("id") id: string) {
    return this.announcementsService.deactivate(id);
  }

  @Patch(":id/extend-expiry")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: "Extend announcement expiry" })
  @ApiResponse({ status: 200, description: "Expiry extended successfully" })
  async extendExpiry(
    @Param("id") id: string,
    @Body() dto: { expiresAt: Date }
  ) {
    return this.announcementsService.extendExpiry(id, dto.expiresAt);
  }
}
