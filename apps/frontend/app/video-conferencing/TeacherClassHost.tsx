import { useEffect, useState } from "react";
import { videoApi, Session } from "../../lib/api/endpoints/video-api";
import { createLogger } from "@/lib/utils/logger";
import { getErrorMessage } from "@/lib/error-handling";

const logger = createLogger("VideoTeacherHost");

export default function TeacherDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    try {
      const data = await videoApi.getActiveSessions();
      setSessions(data);
    } catch (err) {
      logger.error("Failed to fetch video sessions:", getErrorMessage(err));
    }
  };

  const startSession = async () => {
    if (!title) return;
    setLoading(true);
    try {
      const session = await videoApi.startSession({
        title,
        teacherId: "teacher123",
      });
      setSessions((prev) => [...prev, session]);
      setTitle("");
    } catch (err) {
      logger.error("Failed to start a session:", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      await videoApi.endSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (err) {
      logger.error("Failed to end session:", getErrorMessage(err));
    }
  };

  const muteAll = async (sessionId: string) => {
    try {
      await videoApi.muteAll(sessionId);
      alert("All participants muted!");
    } catch (err) {
      logger.error("Failed to mute all participants:", getErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div>
      <h1>Teacher Dashboard</h1>

      <div>
        <input
          type="text"
          placeholder="Session title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button onClick={startSession} disabled={loading}>
          Start Session
        </button>
      </div>

      <h2>Active Sessions</h2>
      <ul>
        {sessions.map((s) => (
          <li key={s.sessionId}>
            <strong>{s.title}</strong> |{" "}
            <button onClick={() => muteAll(s.sessionId)}>Mute All</button>{" "}
            <button onClick={() => endSession(s.sessionId)}>End</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
