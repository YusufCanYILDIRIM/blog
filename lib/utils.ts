import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * shadcn/ui'nin standart class-name birleştirme yardımcısı.
 * `components.json` bu dosyayı `@/lib/utils` olarak referans alır — konumu değiştirilmez.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
