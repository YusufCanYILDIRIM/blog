"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";

interface AppProvidersProps {
  readonly children: ReactNode;
}

/**
 * Root layout'un sardığı tüm client-side provider'ların tek birleşim noktası.
 * İleride eklenecek provider'lar (örn. SessionProvider, QueryClientProvider)
 * yalnızca bu dosyaya eklenir — `app/layout.tsx` değişmez.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
