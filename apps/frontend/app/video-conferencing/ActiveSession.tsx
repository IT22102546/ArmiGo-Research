import React, { useEffect, useState } from "react";
import { videoApi, Session } from "../../lib/api/endpoints/video-api";
import { createLogger } from "@/lib/utils/logger";
import { getErrorMessage } from "@/lib/error-handling";

const logger = createLogger("VideoActiveSessions");
import Link from "next/link";

export default function ActiveSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await videoApi.getActiveSessions();
        setSessions(data);
      } catch (err) {
        logger.error("Failed to fetch sessions", getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  if (loading) return <p>Loading sessions...</p>;

  return (
    <div>
      <h2>Active Sessions</h2>
      {sessions.length === 0 && <p>No active sessions</p>}
      <ul>
        {sessions.map((s) => (
          <li key={s.sessionId}>
            <strong>{s.title}</strong> by {s.teacherId} |{" "}
            <Link href={`/student-join/${s.sessionId}`}>Join</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
