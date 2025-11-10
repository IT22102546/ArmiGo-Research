"use client";

// Utilities for deduplicating or suppressing frequent toasts/logs

const lastNotified = new Map<string, number>();

export function shouldShowNotification(key: string, windowMs = 30_000) {
  const now = Date.now();
  const last = lastNotified.get(key) ?? 0;
  if (now - last > windowMs) {
    lastNotified.set(key, now);
    return true;
  }
  return false;
}

export function clearSuppression(key: string) {
  lastNotified.delete(key);
}
