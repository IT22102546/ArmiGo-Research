"use client";

import { useEffect, useState } from "react";

/**
 * Wrapper component that only renders children on the client side
 * Prevents SSR/static generation issues with client-side only features
 */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}
