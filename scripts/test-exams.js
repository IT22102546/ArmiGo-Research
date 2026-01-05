// Simple script to test GET /api/v1/exams
// Usage: node scripts/test-exams.js

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:5000";

(async () => {
  // If runtime doesn't have global fetch (older Node), try to load node-fetch
  try {
    if (typeof fetch === "undefined") {
      const { default: fetch } = await import("node-fetch");
      global.fetch = fetch;
    }
  } catch (err) {
    // Not fatal; we'll still try native fetch
  }

  try {
    const url = `${API_URL}/api/v1/exams?page=1&limit=10`;
    console.log(`Fetching: ${url}`);

    const res = await fetch(url, { method: "GET" });
    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
      console.error(`HTTP ${res.status}: ${res.statusText}`);
      if (contentType.includes("application/json")) {
        console.error(await res.json());
      } else {
        console.error(await res.text());
      }
      process.exit(1);
    }

    if (contentType.includes("application/json")) {
      const data = await res.json();
      console.log("Response:", JSON.stringify(data, null, 2));
    } else {
      const text = await res.text();
      console.log(text);
    }
  } catch (err) {
    console.error("Failed to fetch exams:", err.message || err);
    process.exit(1);
  }
})();
