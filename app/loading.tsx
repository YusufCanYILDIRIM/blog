export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div
        role="status"
        aria-label="Yükleniyor"
        className="border-muted border-t-primary h-8 w-8 animate-spin rounded-full border-4"
      />
    </main>
  );
}
