"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * `next-themes` etrafında ince bir sarmalayıcı. Dark mode tercihi burada
 * merkezi olarak yönetilir; renk token'ları `app/globals.css` içindeki
 * `.dark` bloğundan gelir (bkz. proje kuralları §17.3).
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
