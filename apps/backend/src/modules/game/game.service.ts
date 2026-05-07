import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  SaveShoulderElbowSensorDto,
  SaveFingerSensorDto,
  SaveGameResultDto,
} from './dtos/game.dto';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async resolveChildByPlayerId(playerId: string): Promise<string> {
    const child = await this.prisma.child.findUnique({
      where: { displayId: playerId },
      select: { id: true },
    });
    if (!child) {
      throw new NotFoundException(`No patient found with player ID: ${playerId}`);
    }
    return child.id;
  }

  async saveShoulderElbowSensor(dto: SaveShoulderElbowSensorDto) {
    const childId = await this.resolveChildByPlayerId(dto.player_id);
    return this.prisma.shoulderElbowSensorData.create({
      data: {
        childId,
        playerId: dto.player_id,
        exerciseType: dto.exercise_type,
        sessionId: dto.session_id,
        timestamp: new Date(dto.timestamp),
        sensorName: dto.sensor_name,
        qx: dto.qx,
        qy: dto.qy,
        qz: dto.qz,
        qw: dto.qw,
        armAngle: dto.arm_angle,
        repCount: dto.rep_count,
      },
    });
  }

  async saveFingerSensor(dto: SaveFingerSensorDto) {
    const childId = await this.resolveChildByPlayerId(dto.player_id);
    return this.prisma.fingerSensorData.create({
      data: {
        childId,
        playerId: dto.player_id,
        exerciseType: dto.exercise_type,
        sessionId: dto.session_id,
        timestamp: new Date(dto.timestamp),
        thumbValue: dto.thumb_value,
        indexValue: dto.index_value,
        middleValue: dto.middle_value,
        ringValue: dto.ring_value,
        pinkyValue: dto.pinky_value,
        thumbYaw: dto.thumb_yaw,
        thumbPitch: dto.thumb_pitch,
        thumbRoll: dto.thumb_roll,
        thumbFlexPct: dto.thumb_flex_pct,
        indexFlexPct: dto.index_flex_pct,
        middleFlexPct: dto.middle_flex_pct,
        ringFlexPct: dto.ring_flex_pct,
        pinkyFlexPct: dto.pinky_flex_pct,
        repCount: dto.rep_count,
        exerciseState: dto.exercise_state,
      },
    });
  }

  async saveGameResult(dto: SaveGameResultDto) {
    const childId = await this.resolveChildByPlayerId(dto.player_id);
    return this.prisma.gameResult.create({
      data: {
        childId,
        playerId: dto.player_id,
        exerciseType: dto.exercise_type,
        sessionId: dto.session_id,
        finalScore: dto.final_score,
        repsCompleted: dto.reps_completed,
        duration: dto.duration,
        timestamp: new Date(dto.timestamp),
        maxAngle: dto.max_angle ?? null,
        averageAngle: dto.average_angle ?? null,
        maxThumb: dto.max_thumb ?? null,
        maxIndex: dto.max_index ?? null,
        maxMiddle: dto.max_middle ?? null,
        maxRing: dto.max_ring ?? null,
        maxPinky: dto.max_pinky ?? null,
        avgThumb: dto.avg_thumb ?? null,
        avgIndex: dto.avg_index ?? null,
        avgMiddle: dto.avg_middle ?? null,
        avgRing: dto.avg_ring ?? null,
        avgPinky: dto.avg_pinky ?? null,
      },
    });
  }

  async getPatientGameResults(playerId: string, limit = 50) {
    const childId = await this.resolveChildByPlayerId(playerId);
    return this.getPatientGameResultsByChildId(childId, limit);
  }

  async getPatientGameSummary(playerId: string) {
    const childId = await this.resolveChildByPlayerId(playerId);
    return this.getPatientGameSummaryByChildId(childId);
  }

  async getPatientGameResultsByChildId(childId: string, limit = 50) {
    return this.prisma.gameResult.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getPatientGameSummaryByChildId(childId: string) {
    const results = await this.prisma.gameResult.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
    });

    const totalSessions = new Set(results.map((r) => r.sessionId)).size;
    const totalScore = results.reduce((s, r) => s + r.finalScore, 0);
    const totalReps = results.reduce((s, r) => s + r.repsCompleted, 0);
    const avgScore =
      results.length > 0 ? Math.round(totalScore / results.length) : 0;

    const byExerciseType: Record<
      string,
      { sessions: number; avgScore: number; totalReps: number }
    > = {};
    const scoreSums: Record<string, { sum: number; count: number }> = {};

    results.forEach((r) => {
      const key = r.exerciseType;
      if (!byExerciseType[key]) {
        byExerciseType[key] = { sessions: 0, avgScore: 0, totalReps: 0 };
      }
      byExerciseType[key].sessions += 1;
      byExerciseType[key].totalReps += r.repsCompleted;

      if (!scoreSums[key]) scoreSums[key] = { sum: 0, count: 0 };
      scoreSums[key].sum += r.finalScore;
      scoreSums[key].count += 1;
    });

    Object.keys(byExerciseType).forEach((key) => {
      byExerciseType[key].avgScore = scoreSums[key]
        ? Math.round(scoreSums[key].sum / scoreSums[key].count)
        : 0;
    });

    return {
      totalSessions,
      totalReps,
      avgScore,
      totalGameResults: results.length,
      byExerciseType,
      recentResults: results.slice(0, 10),
    };
  }
}
