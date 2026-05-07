import { ApiClient } from "../api-client";

export interface GameResult {
  id: number;
  childId: string;
  playerId: string;
  exerciseType: string;
  sessionId: string;
  finalScore: number;
  repsCompleted: number;
  duration: number;
  timestamp: string;
  maxAngle?: number;
  averageAngle?: number;
  maxThumb?: number;
  maxIndex?: number;
  maxMiddle?: number;
  maxRing?: number;
  maxPinky?: number;
  avgThumb?: number;
  avgIndex?: number;
  avgMiddle?: number;
  avgRing?: number;
  avgPinky?: number;
  createdAt: string;
}

export interface GameSummary {
  totalSessions: number;
  totalReps: number;
  avgScore: number;
  totalGameResults: number;
  byExerciseType: Record<
    string,
    { sessions: number; avgScore: number; totalReps: number }
  >;
  recentResults: GameResult[];
}

export const gameApi = {
  getPatientSummaryByChildId: async (childId: string): Promise<GameSummary> => {
    const response = await ApiClient.get<any>(
      `/game/patient/by-child/${childId}/summary`
    );
    const payload = response?.data ?? response ?? {};
    return payload?.data ?? payload;
  },

  getPatientResultsByChildId: async (
    childId: string,
    limit = 20
  ): Promise<GameResult[]> => {
    const response = await ApiClient.get<any>(
      `/game/patient/by-child/${childId}/results`,
      { params: { limit } }
    );
    const payload = response?.data ?? response ?? {};
    return payload?.data ?? payload ?? [];
  },
};
