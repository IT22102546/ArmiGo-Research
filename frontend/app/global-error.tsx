'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>Error</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; }
          .container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #f9fafb; }
          .content { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
          h1 { font-size: 3.75rem; font-weight: bold; color: #111827; }
          h2 { margin-top: 1.5rem; font-size: 1.875rem; font-weight: 800; color: #111827; }
          p { margin-top: 0.5rem; font-size: 0.875rem; color: #4b5563; }
          .actions { margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem; align-items: center; }
          .button { display: inline-flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; cursor: pointer; }
          .button-primary { color: white; background-color: #2563eb; border: none; }
          .button-primary:hover { background-color: #1d4ed8; }
          .button-secondary { color: #374151; background-color: white; border: 1px solid #d1d5db; text-decoration: none; }
          .button-secondary:hover { background-color: #f9fafb; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="content">
            <h1>Error</h1>
            <h2>Something went wrong!</h2>
            <p>An unexpected error has occurred.</p>
            <div className="actions">
              <button onClick={() => reset()} className="button button-primary">
                Try again
              </button>
              <a href="/" className="button button-secondary">
                Go back home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}