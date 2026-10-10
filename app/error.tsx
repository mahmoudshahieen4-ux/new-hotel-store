"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-primary">Something went wrong</h1>
      <p className="mt-4 max-w-md text-muted-foreground">An error occurred while processing your request. Please try again or return home.</p>
      <div className="mt-8 flex gap-4">
        <Button onClick={() => reset()}>Try Again</Button>
        <Button variant="outline" asChild><Link href="/">Back to Home</Link></Button>
      </div>
    </main>
  );
}
