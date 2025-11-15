import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <title>404 - Page Not Found</title>
      </head>
      <body
        style={{ margin: 0, padding: 0, fontFamily: "system-ui, sans-serif" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "1rem",
            backgroundColor: "#fafafa",
          }}
        >
          {/* Animated 404 */}
          <div style={{ position: "relative", marginBottom: "2rem" }}>
            <h1
              style={{
                fontSize: "150px",
                fontWeight: "bold",
                color: "rgba(0,0,0,0.1)",
                userSelect: "none",
                margin: 0,
              }}
            >
              404
            </h1>
          </div>

          {/* Content */}
          <div style={{ textAlign: "center", maxWidth: "28rem" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                marginBottom: "1rem",
              }}
            >
              Page Not Found
            </h2>
            <p style={{ color: "#666", marginBottom: "2rem" }}>
              The page you are looking for doesn&apos;t exist or has been moved.
            </p>
          </div>

          {/* Actions */}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#0070f3",
              color: "white",
              borderRadius: "0.375rem",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            <Home style={{ width: "1rem", height: "1rem" }} />
            Back to Home
          </Link>

          {/* Decorative elements */}
          <div
            style={{
              position: "absolute",
              bottom: "2rem",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "#999",
            }}
          >
            <p>Need help? Contact support.</p>
          </div>
        </div>
      </body>
    </html>
  );
}
