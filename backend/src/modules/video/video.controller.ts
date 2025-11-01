import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { VideoService } from "./video.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../../common/enums/user.enum";
import {
  CreateRoomDto,
  JoinSessionDto,
  TeacherControlDto,
  UpdateSessionDto,
  SessionQueryDto,
  RecordingActionDto,
  SessionMetricsDto,
} from "./dto/video.dto";

@Controller("video")
@UseGuards(JwtAuthGuard, RolesGuard)
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * Create a new video session (room)
   * Only teachers can create sessions for their classes
   */
  @Post("create-room")
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @HttpCode(HttpStatus.CREATED)
  async createRoom(@Body() createRoomDto: CreateRoomDto, @Req() req: any) {
    return this.videoService.createRoom(createRoomDto, req.user.sub);
  }

  /**
   * Start a scheduled video session
   * Only the class teacher can start the session
   */
  @Post("start/:sessionId")
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  async startSession(@Param("sessionId") sessionId: string, @Req() req: any) {
    return this.videoService.startSession(sessionId, req.user.sub);
  }

  /**
   * End an active video session
   * Only the class teacher can end the session
   */
  @Post("end/:sessionId")
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  async endSession(@Param("sessionId") sessionId: string, @Req() req: any) {
    return this.videoService.endSession(sessionId, req.user.sub);
  }

  /**
   * Get join token for a student or admin to join the session
   * Returns Jitsi JWT and room details
   */
  @Post("join/:sessionId")
  async getJoinToken(
    @Param("sessionId") sessionId: string,
    @Body() joinDto: JoinSessionDto,
    @Req() req: any
  ) {
    return this.videoService.getJoinToken(
      sessionId,
      req.user.sub,
      joinDto.displayName
    );
  }

  /**
   * Apply teacher controls (mute all, disable video, lock room)
   * Only the class teacher can apply controls
   */
  @Post("controls")
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  async applyTeacherControls(
    @Body() controlDto: TeacherControlDto,
    @Req() req: any
  ) {
    return this.videoService.applyTeacherControls(controlDto, req.user.sub);
  }

  /**
   * Get session details
   * Accessible to enrolled students, teacher, and admins
   */
  @Get(":sessionId")
  async getSessionDetails(
    @Param("sessionId") sessionId: string,
    @Req() req: any
  ) {
    return this.videoService.getSessionDetails(sessionId, req.user.sub);
  }

  /**
   * List video sessions with filters and pagination
   * Students see only their enrolled classes
   * Teachers see only their classes
   * Admins see all sessions
   */
  @Get()
  async listSessions(@Query() queryDto: SessionQueryDto, @Req() req: any) {
    return this.videoService.listSessions(
      queryDto,
      req.user.sub,
      req.user.role
    );
  }

  /**
   * Update session details (before it starts)
   * Only the class teacher can update
   */
  @Put(":sessionId")
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  async updateSession(
    @Param("sessionId") sessionId: string,
    @Body() updateDto: UpdateSessionDto,
    @Req() req: any
  ) {
    return this.videoService.updateSession(sessionId, updateDto, req.user.sub);
  }

  /**
   * Get recording URL for a completed session
   * Accessible to enrolled students, teacher, and admins
   */
  @Get(":sessionId/recording")
  async getRecordingUrl(
    @Param("sessionId") sessionId: string,
    @Req() req: any
  ) {
    return this.videoService.getRecordingUrl(sessionId, req.user.sub);
  }

  /**
   * Get session metrics (participation, duration, etc.)
   * Only teacher and admins can view metrics
   */
  @Get(":sessionId/metrics")
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  async getSessionMetrics(
    @Param("sessionId") sessionId: string,
    @Req() req: any
  ) {
    return this.videoService.getSessionMetrics(sessionId, req.user.sub);
  }

  /**
   * Record when a participant leaves the session
   * Called via webhook or manually
   */
  @Post(":sessionId/participant-left/:userId")
  @Roles(UserRole.ADMIN) // Only admin or system can call this
  async recordParticipantLeft(
    @Param("sessionId") sessionId: string,
    @Param("userId") userId: string
  ) {
    return this.videoService.recordParticipantLeft(sessionId, userId);
  }

  /**
   * Admin endpoint: Get all sessions with detailed filters
   */
  @Get("admin/all-sessions")
  @Roles(UserRole.ADMIN)
  async getAllSessions(@Query() queryDto: SessionQueryDto, @Req() req: any) {
    return this.videoService.listSessions(
      queryDto,
      req.user.sub,
      UserRole.ADMIN
    );
  }

  /**
   * Delete a video session
   * Only the session creator, class teacher, or admin can delete
   */
  @Delete(":sessionId")
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @HttpCode(HttpStatus.OK)
  async deleteSession(@Param("sessionId") sessionId: string, @Req() req: any) {
    return this.videoService.deleteSession(sessionId, req.user);
  }
}

