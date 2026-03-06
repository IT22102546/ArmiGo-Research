import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { Roles } from "@common/decorators";
import { JwtAuthGuard, RolesGuard } from "@common/guards";
import { NotificationsService } from "./notifications.service";
import { UsersService } from "@modules/users/users.service";

@ApiTags("Notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService
  ) {}

  private async resolveScopedHospitalId(req: any): Promise<string | undefined> {
    const roles = Array.isArray(req?.user?.roles)
      ? req.user.roles
      : [req?.user?.role].filter(Boolean);
    const isHospitalScopedUser =
      roles.includes(UserRole.HOSPITAL_ADMIN) && req?.user?.email !== "armigo@gmail.com";

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
  @ApiOperation({ summary: "Get notifications for current user" })
  async getAll(
    @Request() req: any,
    @Query("isRead") isRead?: string,
    @Query("type") type?: string
  ) {
    const notifications = await this.notificationsService.getMyNotifications(
      req.user.id,
      {
        isRead: isRead !== undefined ? isRead === "true" : undefined,
        type,
      }
    );

    return {
      success: true,
      data: {
        notifications,
      },
    };
  }

  @Post("push-token")
  @ApiOperation({ summary: "Register push notification token" })
  async registerPushToken(
    @Request() req: any,
    @Body() body: { token: string; platform?: string }
  ) {
    await this.notificationsService.registerPushToken(
      req.user.id,
      body.token,
      body.platform || "expo"
    );
    return {
      success: true,
      message: "Push token registered successfully",
    };
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark notification as read" })
  async markAsRead(@Request() req: any, @Param("id") id: string) {
    const notification = await this.notificationsService.markAsRead(id, req.user.id);
    return {
      success: true,
      data: {
        notification,
      },
    };
  }

  @Patch("mark-all-read")
  @ApiOperation({ summary: "Mark all notifications as read" })
  async markAllAsRead(@Request() req: any) {
    const result = await this.notificationsService.markAllAsRead(req.user.id);
    return {
      success: true,
      ...result,
    };
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notifications count" })
  async getUnreadCount(@Request() req: any) {
    const result = await this.notificationsService.getUnreadCount(req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete notification" })
  async delete(@Request() req: any, @Param("id") id: string) {
    const result = await this.notificationsService.deleteNotification(id, req.user.id);
    return {
      success: true,
      ...result,
    };
  }

  @Get("preferences")
  @ApiOperation({ summary: "Get notification preferences" })
  async getPreferences() {
    return {
      success: true,
      data: {
        preferences: this.notificationsService.getPreferences(),
      },
    };
  }

  @Patch("preferences")
  @ApiOperation({ summary: "Update notification preferences" })
  async updatePreferences(@Body() body: Record<string, any>) {
    return {
      success: true,
      data: {
        preferences: this.notificationsService.updatePreferences(body),
      },
    };
  }

  @Get("admin/all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: "Get all notifications (admin)" })
  async getAdminAll(
    @Request() req: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("type") type?: string,
    @Query("status") status?: string,
    @Query("role") role?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("search") search?: string
  ) {
    const hospitalId = await this.resolveScopedHospitalId(req);
    const data = await this.notificationsService.getAdminAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      type,
      status,
      role,
      dateFrom,
      dateTo,
      search,
      hospitalId,
    });

    return {
      success: true,
      data,
    };
  }

  @Get("admin/stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: "Get notification stats (admin)" })
  async getAdminStats(@Request() req: any) {
    const hospitalId = await this.resolveScopedHospitalId(req);
    const data = await this.notificationsService.getAdminStats(hospitalId);
    return {
      success: true,
      data,
    };
  }

  @Get("admin/options")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: "Get notification recipient options (patients + hospitals)" })
  async getTargetOptions(@Request() req: any) {
    const hospitalId = await this.resolveScopedHospitalId(req);
    const data = await this.notificationsService.getNotificationTargetOptions(hospitalId);
    return {
      success: true,
      data,
    };
  }

  @Post("admin/send")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: "Send notification from super admin to selected patients' parents and hospitals",
  })
  async sendByTargets(
    @Request() req: any,
    @Body()
    body: {
      title: string;
      message: string;
      type?: string;
      patientIds?: string[];
      hospitalIds?: string[];
      hospitalAdminUserIds?: string[];
      audienceScope?: "DEFAULT" | "HOSPITAL_ONLY";
    }
  ) {
    const hospitalId = await this.resolveScopedHospitalId(req);
    const data = await this.notificationsService.sendByTargets({
      ...body,
      senderUserId: req?.user?.id,
      hospitalId,
    });
    return {
      success: true,
      data,
      message: data.message,
    };
  }

  @Put("admin/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: "Update notification (admin)" })
  async updateAdminNotification(
    @Request() req: any,
    @Param("id") id: string,
    @Body()
    body: {
      title?: string;
      message?: string;
      type?: string;
      status?: "UNREAD" | "READ" | "ARCHIVED";
      isRead?: boolean;
    }
  ) {
    const hospitalId = await this.resolveScopedHospitalId(req);
    if (hospitalId) {
      await this.notificationsService.getAdminDetail(id, hospitalId);
    }
    const data = await this.notificationsService.updateAdminNotification(id, body);
    return {
      success: true,
      data,
      message: "Notification updated successfully",
    };
  }

  @Delete("admin/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: "Delete notification (admin)" })
  async deleteAdminNotification(@Request() req: any, @Param("id") id: string) {
    const hospitalId = await this.resolveScopedHospitalId(req);
    if (hospitalId) {
      await this.notificationsService.getAdminDetail(id, hospitalId);
    }
    const result = await this.notificationsService.deleteAdminNotification(id);
    return {
      success: true,
      message: result.message,
    };
  }

  @Get("admin/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: "Get notification detail (admin)" })
  async getAdminDetail(@Request() req: any, @Param("id") id: string) {
    const hospitalId = await this.resolveScopedHospitalId(req);
    const data = await this.notificationsService.getAdminDetail(id, hospitalId);
    return {
      success: true,
      data,
    };
  }
}
