"use client";

import { useParams, notFound } from "next/navigation";
import { useEffect } from "react";

export default function AdminTabPage() {
  const params = useParams();
  const tab = params?.tab as string;

  // This catch-all should not be reached for valid routes since they have their own pages
  // If we reach here, it means the route doesn't exist - show 404
  useEffect(() => {
    console.warn(`Unknown admin route: /admin/${tab}`);
  }, [tab]);

  notFound();
}
