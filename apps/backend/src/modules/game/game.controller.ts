import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { GameService } from './game.service';
import {
  SaveShoulderElbowSensorDto,
  SaveFingerSensorDto,
  SaveGameResultDto,
} from './dtos/game.dto';

@ApiTags('Game')
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  // ── Public endpoints called by Unreal Engine ───────────────────────────────

  @Post('shoulder-elbow-sensor')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save shoulder/elbow sensor data from Unreal Engine' })
  async saveShoulderElbowSensor(@Body() dto: SaveShoulderElbowSensorDto) {
    const data = await this.gameService.saveShoulderElbowSensor(dto);
    return { success: true, data };
  }

  @Post('finger-sensor')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save finger sensor data from Unreal Engine' })
  async saveFingerSensor(@Body() dto: SaveFingerSensorDto) {
    const data = await this.gameService.saveFingerSensor(dto);
    return { success: true, data };
  }

  @Post('results')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save game result from Unreal Engine' })
  async saveGameResult(@Body() dto: SaveGameResultDto) {
    const data = await this.gameService.saveGameResult(dto);
    return { success: true, data };
  }

  // ── Authenticated endpoints used by the dashboard ──────────────────────────

  @Get('patient/by-child/:childId/summary')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get game summary for a patient by child database ID' })
  async getPatientSummaryByChildId(@Param('childId') childId: string) {
    const data = await this.gameService.getPatientGameSummaryByChildId(childId);
    return { success: true, data };
  }

  @Get('patient/by-child/:childId/results')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get game results for a patient by child database ID' })
  async getPatientResultsByChildId(
    @Param('childId') childId: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.gameService.getPatientGameResultsByChildId(
      childId,
      limit ? parseInt(limit, 10) : 50,
    );
    return { success: true, data };
  }

  @Get('patient/:playerId/summary')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get game summary for a patient by player ID (displayId)' })
  async getPatientSummary(@Param('playerId') playerId: string) {
    const data = await this.gameService.getPatientGameSummary(playerId);
    return { success: true, data };
  }

  @Get('patient/:playerId/results')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get game results for a patient by player ID (displayId)' })
  async getPatientResults(
    @Param('playerId') playerId: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.gameService.getPatientGameResults(
      playerId,
      limit ? parseInt(limit, 10) : 50,
    );
    return { success: true, data };
  }
}
