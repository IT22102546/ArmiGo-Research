/** Query utilities exports. */

export { queryClient, queryKeys, invalidateQueries } from "./query-client";
export { QueryProvider } from "./query-provider";
export { useOptimisticUpdate } from "./optimistic-updates";

// Re-export commonly used TanStack Query hooks
export {
  useQuery,
  useMutation,
  useQueryClient,
  useIsFetching,
  useIsMutating,
} from "@tanstack/react-query";
