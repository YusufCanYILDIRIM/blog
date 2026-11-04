"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  // Next.js 16: Client Component'te fırlatılan değer `Error` olmayabilir.
  readonly error: unknown;
  readonly retry: () => void;
}

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Bir şeyler ters gitti</h1>
      <p className="text-muted-foreground text-sm">Lütfen tekrar deneyin.</p>
      <Button onClick={() => retry()}>Tekrar dene</Button>
    </main>
  );
}
