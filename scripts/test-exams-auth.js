// Test script: Logs in and fetches exams using access token
// Usage: node scripts/test-exams-auth.js

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:5000";
const EMAIL = process.env.TEST_EMAIL || "external.teacher@learnapp.lk";
const PASSWORD = process.env.TEST_PASSWORD || "LearnUp@2025";

(async () => {
  try {
    if (typeof fetch === "undefined") {
      const { default: fetch } = await import("node-fetch");
      global.fetch = fetch;
    }
  } catch (err) {}

  try {
    const loginUrl = `${API_URL}/api/v1/auth/login`;
    console.log(`Logging in: ${EMAIL}`);
    const loginRes = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-return-tokens": "true",
      },
      body: JSON.stringify({ identifier: EMAIL, password: PASSWORD }),
    });

    if (!loginRes.ok) {
      console.error(`Login failed: HTTP ${loginRes.status}`);
      console.error(await loginRes.text());
      process.exit(1);
    }

    const loginJson = await loginRes.json();
    const token =
      loginJson.accessToken || loginJson.access_token || loginJson.token;
    if (!token) {
      console.error("Login did not return an access token");
      console.log(JSON.stringify(loginJson, null, 2));
      process.exit(1);
    }

    const url = `${API_URL}/api/v1/exams?page=1&limit=10`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok) {
      console.error(`Failed to fetch exams: HTTP ${res.status}`);
      if (contentType.includes("application/json"))
        console.error(await res.json());
      else console.error(await res.text());
      process.exit(1);
    }
    if (contentType.includes("application/json")) {
      const data = await res.json();
      console.log("Exams response:", JSON.stringify(data, null, 2));

      // Map missing subjects/grades/mediums/class by calling public endpoints
      const exams = Array.isArray(data) ? data : data.data || data.exams || [];
      const gradeIds = new Set();
      const subjectIds = new Set();
      const mediumIds = new Set();
      const classIds = new Set();
      const creatorIds = new Set();

      exams.forEach((e) => {
        if (!e.grade && e.gradeId) gradeIds.add(e.gradeId);
        if (!e.subject && e.subjectId) subjectIds.add(e.subjectId);
        if (!e.medium && e.mediumId) mediumIds.add(e.mediumId);
        if (!e.class && e.classId) classIds.add(e.classId);
        if (!e.creator && e.createdById) creatorIds.add(e.createdById);
      });

      const fetchItems = async (ids, path) => {
        const results = {};
        await Promise.all(
          [...ids].map(async (id) => {
            try {
              const r = await fetch(`${API_URL}/api/v1${path}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (r.ok) {
                const j = await r.json();
                // Unwrap
                results[id] = j?.data || j;
              }
            } catch (err) {}
          })
        );
        return results;
      };

      const [gradeMap, subjectMap, mediumMap, classMap, userMap] =
        await Promise.all([
          fetchItems(gradeIds, "/grades"),
          fetchItems(subjectIds, "/subjects"),
          fetchItems(mediumIds, "/mediums"),
          fetchItems(classIds, "/classes"),
          fetchItems(creatorIds, "/users"),
        ]);

      const mapped = exams.map((e) => ({
        ...e,
        grade: e.grade || gradeMap[e.gradeId],
        subject: e.subject || subjectMap[e.subjectId],
        medium: e.medium || mediumMap[e.mediumId],
        class: e.class || classMap[e.classId],
        creator:
          e.creator ||
          (userMap[e.createdById] && userMap[e.createdById].user) ||
          undefined,
      }));
      console.log("Mapped exams:", JSON.stringify(mapped, null, 2));
    } else {
      console.log(await res.text());
    }
  } catch (err) {
    console.error("Error:", err.message || err);
    process.exit(1);
  }
})();
