import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-2xl font-semibold">{siteConfig.name}</h1>
      <p className="text-muted-foreground max-w-md text-sm">{siteConfig.description}</p>
    </main>
  );
}
