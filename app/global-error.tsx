"use client";

import { Button } from "@/components/ui/button";
import "./globals.css";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Something went wrong</h1>
          <p className="mt-4 max-w-md text-muted-foreground">A critical error occurred. Please try reloading the page.</p>
          <Button onClick={() => reset()} className="mt-8">Reload Page</Button>
        </main>
      </body>
    </html>
  );
}
