// apps/frontend/lib/api/endpoints/search.ts
import { ApiClient } from "../api-client";

export type SearchEntity =
  | "users"
  | "classes"
  | "exams"
  | "subjects"
  | "batches"
  | "courses";

export interface SearchResult {
  id: string;
  type: SearchEntity;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface GlobalSearchResponse {
  query: string;
  results: {
    entity: SearchEntity;
    items: SearchResult[];
    total: number;
  }[];
  totalResults: number;
}

export const searchApi = {
  // Global search across multiple entities
  globalSearch: (
    query: string,
    options?: {
      entities?: SearchEntity[];
      limit?: number;
    }
  ) =>
    ApiClient.get<GlobalSearchResponse>("/search/global", {
      params: {
        q: query,
        entities: options?.entities?.join(","),
        limit: options?.limit,
      },
    }),
};
