"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  videoApi,
  JoinSessionResponse,
} from "./../../../lib/api/endpoints/video-api";
import { createLogger } from "@/lib/utils/logger";
import { getErrorMessage } from "@/lib/error-handling";
import dynamic from "next/dynamic";

const logger = createLogger("StudentJoinPage");

// Dynamic import because Jitsi needs window
const JitsiMeetFrame = dynamic(
  () => import("../JitsiMeetFrame").then((mod) => mod.default),
  {
    ssr: false,
  }
);

export default function StudentJoin() {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const [sessionInfo, setSessionInfo] = useState<JoinSessionResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const join = async () => {
      try {
        const info = await videoApi.joinSession(sessionId);
        setSessionInfo(info);
      } catch (err) {
        logger.error("Failed to join session", getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    join();
  }, [sessionId]);

  if (loading) return <p>Joining session...</p>;
  if (!sessionInfo) return <p>Session not found</p>;

  return <JitsiMeetFrame sessionInfo={sessionInfo} />;
}
