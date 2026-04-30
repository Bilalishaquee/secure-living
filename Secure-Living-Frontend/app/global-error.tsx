"use client";

import { useEffect } from "react";

/**
 * Renders outside the root layout when the root layout itself fails.
 * Must include html + body; keep styles self-contained (no layout CSS).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        {/* Root layout is not mounted; load Inter here for parity with the app. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body
        style={{
          fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "#f4faf8",
          color: "#0f1c1a",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.75rem" }}>
            Secure Living — error
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#5c726c", marginBottom: "1.25rem" }}>
            {error.message || "The app failed to load. Try refreshing or clearing the .next cache."}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#0f766e",
              color: "#fff",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
