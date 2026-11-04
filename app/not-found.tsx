import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Sayfa bulunamadı</h1>
      <p className="text-muted-foreground text-sm">Aradığınız sayfa mevcut değil.</p>
      <Link href="/" className="text-primary text-sm underline underline-offset-4">
        Ana sayfaya dön
      </Link>
    </main>
  );
}
