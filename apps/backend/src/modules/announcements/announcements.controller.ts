import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import {
  AnnouncementListQueryDto,
  CreateAnnouncementDto,
  ExtendAnnouncementExpiryDto,
  ToggleAnnouncementStatusDto,
  UpdateAnnouncementDto,
} from './dtos/announcement.dto';

@ApiTags('Announcements')
@Controller('announcements')
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get announcements with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Announcements retrieved successfully' })
  async getAnnouncements(@Query() query: AnnouncementListQueryDto) {
    const data = await this.announcementsService.getAnnouncements(query);
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get announcement by id' })
  @ApiResponse({ status: 200, description: 'Announcement retrieved successfully' })
  async getAnnouncementById(@Param('id') id: string) {
    const data = await this.announcementsService.getAnnouncementById(id);
    return {
      success: true,
      data,
    };
  }

  @Get(':id/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get announcement read statistics' })
  @ApiResponse({ status: 200, description: 'Announcement stats retrieved successfully' })
  async getAnnouncementStats(@Param('id') id: string) {
    const data = await this.announcementsService.getAnnouncementStats(id);
    return {
      success: true,
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create announcement' })
  @ApiResponse({ status: 201, description: 'Announcement created successfully' })
  async createAnnouncement(@Body() body: CreateAnnouncementDto) {
    const data = await this.announcementsService.createAnnouncement(body);
    return {
      success: true,
      data,
      message: 'Announcement created successfully',
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update announcement' })
  @ApiResponse({ status: 200, description: 'Announcement updated successfully' })
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() body: UpdateAnnouncementDto
  ) {
    const data = await this.announcementsService.updateAnnouncement(id, body);
    return {
      success: true,
      data,
      message: 'Announcement updated successfully',
    };
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update announcement active status' })
  @ApiResponse({ status: 200, description: 'Announcement status updated successfully' })
  async updateAnnouncementStatus(
    @Param('id') id: string,
    @Body() body: ToggleAnnouncementStatusDto
  ) {
    const data = await this.announcementsService.updateAnnouncementStatus(
      id,
      body.isActive
    );
    return {
      success: true,
      data,
      message: 'Announcement status updated successfully',
    };
  }

  @Put(':id/extend-expiry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extend announcement expiry' })
  @ApiResponse({ status: 200, description: 'Announcement expiry updated successfully' })
  async extendAnnouncementExpiry(
    @Param('id') id: string,
    @Body() body: ExtendAnnouncementExpiryDto
  ) {
    const data = await this.announcementsService.extendAnnouncementExpiry(
      id,
      body?.days || 30
    );
    return {
      success: true,
      data,
      message: 'Announcement expiry updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete announcement' })
  @ApiResponse({ status: 200, description: 'Announcement deleted successfully' })
  async deleteAnnouncement(@Param('id') id: string) {
    const result = await this.announcementsService.deleteAnnouncement(id);
    return {
      success: true,
      message: result.message,
    };
  }
}
