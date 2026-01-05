import { useQueryClient, QueryKey } from "@tanstack/react-query";
import { useCallback } from "react";

interface OptimisticUpdateOptions<TData, TVariables> {
  queryKey: QueryKey;
  updater: (oldData: TData | undefined, variables: TVariables) => TData;
  onError?: (error: Error, variables: TVariables, context: any) => void;
}

export function useOptimisticUpdate<TData = unknown, TVariables = unknown>(
  options: OptimisticUpdateOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();

  const mutate = useCallback(
    async (variables: TVariables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: options.queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(options.queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData<TData>(options.queryKey, (old) =>
        options.updater(old, variables)
      );

      // Return context object with snapshotted value
      return { previousData };
    },
    [queryClient, options]
  );

  const rollback = useCallback(
    (context?: { previousData?: TData }) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(options.queryKey, context.previousData);
      }
    },
    [queryClient, options.queryKey]
  );

  return { mutate, rollback };
}

/**
 * Common optimistic update patterns
 */

// Add item to list
export function optimisticAdd<T>(list: T[] | undefined, item: T): T[] {
  return [...(list || []), item];
}

// Update item in list
export function optimisticUpdate<T extends { id: string | number }>(
  list: T[] | undefined,
  id: string | number,
  updates: Partial<T>
): T[] {
  if (!list) return [];
  return list.map((item) => (item.id === id ? { ...item, ...updates } : item));
}

// Remove item from list
export function optimisticRemove<T extends { id: string | number }>(
  list: T[] | undefined,
  id: string | number
): T[] {
  if (!list) return [];
  return list.filter((item) => item.id !== id);
}

// Toggle boolean property
export function optimisticToggle<T extends { id: string | number }>(
  list: T[] | undefined,
  id: string | number,
  property: keyof T
): T[] {
  if (!list) return [];
  return list.map((item) =>
    item.id === id ? { ...item, [property]: !item[property] } : item
  );
}

// Increment/decrement number property
export function optimisticIncrement<T extends { id: string | number }>(
  list: T[] | undefined,
  id: string | number,
  property: keyof T,
  amount: number = 1
): T[] {
  if (!list) return [];
  return list.map((item) =>
    item.id === id
      ? { ...item, [property]: (item[property] as number) + amount }
      : item
  );
}
