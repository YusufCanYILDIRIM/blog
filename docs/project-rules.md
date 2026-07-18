# Proje Geliştirme Kuralları (Project Rules)

> **Versiyon:** 1.0.0
> **Durum:** Bağlayıcı (Binding) — Bu belge, projede üretilecek tüm kodlar için referans standarttır.
> **Kapsam:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Prisma ORM, PostgreSQL, Auth.js v5, Zod, React Hook Form, TanStack Table, Lucide Icons

---

## Önsöz: Bu Belge Nasıl Kullanılır?

Bu doküman, projeye yeni katılan bir yazılımcının hiçbir ek açıklamaya ihtiyaç duymadan üretim yapabilmesi için tasarlanmıştır. Kod üreten her mühendis (insan ya da yapay zeka asistanı), bir özellik geliştirmeden, bir PR açmadan veya bir refactor yapmadan önce ilgili bölümü okumalıdır.

Kurallar üç kategoriye ayrılır:

- **ZORUNLU** — İstisnasız uygulanır. Code review'da bu kurallara aykırılık, PR'ın reddedilme sebebidir.
- **ÖNERİLEN** — Best practice niteliğindedir, gerekçeli istisnalar mümkündür ancak PR açıklamasında gerekçelendirilmelidir.
- **YASAK** — Projede kesinlikle görülmemesi gereken pattern'lerdir.

Her bölümde **Neden?** açıklaması, **Doğru/Yanlış** kod örnekleri ve **Anti-Pattern** uyarıları bulunur.

---

## 1. Proje Felsefesi

Bu proje, kısa vadeli hız için uzun vadeli sürdürülebilirliği feda etmez. Aşağıdaki ilkeler, her mimari kararın arkasındaki gerekçedir.

### 1.1. Clean Architecture

Kod, iş mantığını (business logic) framework detaylarından (Next.js, Prisma, HTTP) izole eder. Bir domain kuralı (örneğin "bir kullanıcı aynı anda en fazla 3 aktif projeye sahip olabilir") bir React component'i içine veya bir API route handler'ının içine gömülmez; bağımsız test edilebilir bir servis/use-case katmanında yaşar.

**Katman sırası (dıştan içe bağımlılık yasak, içten dışa serbest):**

```
Presentation (UI, Route Handlers)
        ↓ bağımlı olur
Application (Use Cases / Services)
        ↓ bağımlı olur
Domain (Entities, Business Rules)
        ↑ Infrastructure buna bağımlıdır, tersi değil
Infrastructure (Prisma, Auth.js, external APIs)
```

**Neden?** Prisma'dan başka bir ORM'e geçilmesi gerektiğinde, ya da Auth.js yerine başka bir auth çözümü kullanılacağında, domain ve application katmanlarının hiç dokunulmadan kalması gerekir. Bu ayrım olmadan, framework migration'ları tüm codebase'i yeniden yazmak anlamına gelir.

**Doğru:**

```typescript
// features/projects/services/project.service.ts
export async function createProject(input: CreateProjectInput, userId: string) {
  const activeCount = await projectRepository.countActiveByUser(userId);
  if (activeCount >= MAX_ACTIVE_PROJECTS) {
    throw new BusinessRuleViolationError("MAX_ACTIVE_PROJECTS_EXCEEDED");
  }
  return projectRepository.create({ ...input, ownerId: userId });
}
```

**Yanlış (iş kuralı route handler'da gömülü):**

```typescript
// app/api/projects/route.ts
export async function POST(req: Request) {
  const count = await prisma.project.count({ where: { ownerId, status: "ACTIVE" } });
  if (count >= 3) return Response.json({ error: "..." }, { status: 400 }); // ❌ kural burada yaşamamalı
}
```

### 1.2. SOLID

- **S — Single Responsibility:** Bir modül, bir sınıf, bir fonksiyon tek bir değişme sebebine sahip olmalı. `UserService` hem kullanıcı oluşturma hem de e-posta gönderme sorumluluğunu taşımaz; ikinci sorumluluk `NotificationService`'e devredilir.
- **O — Open/Closed:** Yeni bir ödeme sağlayıcısı eklemek, mevcut `PaymentProcessor` kodunu değiştirmeyi değil, yeni bir implementasyon eklemeyi gerektirmeli (strategy pattern, interface üzerinden).
- **L — Liskov Substitution:** Bir interface'i implemente eden her sınıf, o interface'in beklediği davranışı bozmadan yerine geçebilmeli.
- **I — Interface Segregation:** Dev, "her şeyi yapan" interface'ler yerine küçük, amaca özel interface'ler tercih edilir (`Readable`, `Writable` ayrı ayrı; hepsi bir arada `DataHandler` değil).
- **D — Dependency Inversion:** Application katmanı, somut `PrismaClient`'a değil, soyut bir repository interface'ine bağımlı olur. Bu, unit testlerde mock'lamayı mümkün kılar.

### 1.3. DRY (Don't Repeat Yourself)

Aynı iş kuralı, aynı validation şeması veya aynı UI deseni üç farklı yerde elle tekrar yazılmaz. Ancak DRY, **erken soyutlama** için bahane değildir (bkz. 1.4). İki kod parçası şu anda benzer görünüyor ama farklı sebeplerle değişecekse, bunları birleştirmek yanlıştır ("accidental duplication" vs "essential duplication" ayrımı yapılmalı).

**Kural:** Aynı mantık üçüncü kez yazılacaksa (Rule of Three), o zaman ortak bir fonksiyona/hook'a/komponente çıkarılır.

### 1.4. KISS (Keep It Simple, Stupid)

En basit çözüm, ispatlanana kadar en doğru çözümdür. Gereksiz design pattern, gereksiz generic'leştirme, "ileride lazım olur" diye eklenen konfigürasyon parametreleri yasaktır.

**Anti-Pattern:** Tek bir e-posta sağlayıcısı kullanılırken, henüz ihtiyaç olmadan "değiştirilebilir provider" mimarisi kurmak. İhtiyaç doğduğunda refactor edilir; spekülatif genellik (speculative generality) teknik borçtur.

### 1.5. Separation of Concerns

UI, veri erişimi, iş mantığı ve validasyon birbirinden ayrı yaşar:

- **UI (component):** Sadece render ve kullanıcı etkileşimi.
- **Validation (Zod schema):** Veri şeklinin doğruluğu.
- **Business Logic (service):** Kuralların uygulanması.
- **Data Access (repository/Prisma):** Veritabanı ile konuşma.

### 1.6. Composition over Inheritance

React'ta class inheritance zaten yok, ama "composition over inheritance" ilkesi component tasarımında da geçerlidir: Büyük, her şeyi yapan bir component yerine, küçük component'lerin `children` ve prop'lar aracılığıyla birleştirilmesi tercih edilir.

**Doğru:**

```tsx
<Card>
  <CardHeader title="Proje Detayı" />
  <CardBody><ProjectSummary project={project} /></CardBody>
</Card>
```

**Yanlış:**

```tsx
<Card showHeader showTitle title="..." showBody bodyVariant="summary" ... /> // ❌ prop patlaması
```

### 1.7. Server First Yaklaşımı

Next.js 15 App Router'ın gücü sunucu tarafında yatar. Varsayılan davranış **Server Component**'tir; bir component yalnızca gerçek bir istemci ihtiyacı (etkileşim, tarayıcı API'si, state) olduğunda `"use client"` alır.

**Neden?** Server-first yaklaşım; daha küçük JS bundle, daha hızlı ilk yükleme (TTFB/FCP), doğrudan veritabanı erişimi (API katmanı olmadan) ve daha güvenli veri işleme (secrets client'a sızmaz) sağlar. Detaylar için bkz. Bölüm 5 ve 6.

---

## 2. Klasör Yapısı Kuralları

Proje **feature-based (özellik bazlı) + katmanlı** hibrit bir yapı kullanır. Next.js'in `app/` dizini yalnızca routing içindir; iş mantığı `features/` altında yaşar.

```
project-root/
├── app/                        # Next.js App Router — YALNIZCA routing, layout, page composition
│   ├── (auth)/                 # Route group: auth sayfaları (login, register)
│   │   └── login/page.tsx
│   ├── (dashboard)/            # Route group: giriş gerektiren sayfalar
│   │   └── projects/
│   │       ├── page.tsx
│   │       ├── [projectId]/page.tsx
│   │       └── loading.tsx
│   ├── api/                    # Route Handlers (yalnızca dış entegrasyon/webhook için; iç CRUD Server Actions ile yapılır)
│   │   └── webhooks/stripe/route.ts
│   ├── layout.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   └── globals.css
│
├── features/                   # Özellik bazlı modüller — projenin kalbi
│   └── projects/
│       ├── components/         # Bu özelliğe özel UI component'leri
│       │   ├── project-card.tsx
│       │   └── project-form.tsx
│       ├── actions/             # Server Actions (mutation giriş noktaları)
│       │   └── create-project.action.ts
│       ├── services/            # İş mantığı (Clean Architecture "Application" katmanı)
│       │   └── project.service.ts
│       ├── repositories/        # Prisma erişimi bu katmanda soyutlanır
│       │   └── project.repository.ts
│       ├── schemas/             # Zod şemaları (bu özelliğe özel)
│       │   └── project.schema.ts
│       ├── hooks/               # Bu özelliğe özel client hook'lar
│       │   └── use-project-filters.ts
│       └── types/               # Bu özelliğe özel type tanımları
│           └── project.types.ts
│
├── shared/                     # Birden fazla feature tarafından paylaşılan, iş mantığı İÇERMEYEN kod
│   ├── components/              # Genel amaçlı UI (Button wrapper'ları, EmptyState, PageHeader...)
│   ├── hooks/                   # useDebounce, useMediaQuery gibi domain'den bağımsız hook'lar
│   ├── utils/                    # formatCurrency, slugify gibi saf fonksiyonlar
│   └── constants/                # Paylaşılan sabitler
│
├── components/
│   └── ui/                      # shadcn/ui tarafından üretilen, DOKUNULMAMASI gereken primitive'ler
│
├── lib/                         # Altyapısal singleton'lar ve üçüncü parti entegrasyon konfigürasyonları
│   ├── prisma.ts                # PrismaClient singleton
│   ├── auth.ts                  # Auth.js konfigürasyonu
│   ├── env.ts                   # Zod ile doğrulanmış environment değişkenleri
│   └── logger.ts                # Merkezi logger instance'ı
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── types/                       # Proje geneli, feature'a özel OLMAYAN tip tanımları
│   ├── api.types.ts              # Ortak API response tipleri
│   └── global.d.ts
│
├── hooks/                       # Proje geneli (feature-agnostic) global hook'lar (shared/hooks ile örtüşürse shared'a taşınır)
│
└── docs/
    └── project-rules.md          # Bu belge
```

### 2.1. Klasörlerin Sorumluluk Sınırları

| Klasör | Ne içerir | Ne İÇERMEZ |
|---|---|---|
| `app/` | Route tanımı, layout, sayfa kompozisyonu, metadata | İş mantığı, doğrudan Prisma sorgusu, karmaşık state yönetimi |
| `features/*/components` | O özelliğe özel, başka yerde kullanılmayacak UI | Genel amaçlı, tekrar kullanılabilir component (→ `shared/components`) |
| `features/*/actions` | `"use server"` Server Action'ları — sadece giriş noktası, ince (thin) katman | İş mantığı (→ `services`'e delege eder) |
| `features/*/services` | Saf iş mantığı, use-case'ler | Framework'e özel kod (Next.js, React importu yok) |
| `features/*/repositories` | Prisma sorgularının kapsüllendiği tek yer | İş kuralı, validasyon |
| `shared/` | Feature-agnostic, tekrar kullanılabilir kod | Herhangi bir feature'a özel iş mantığı |
| `lib/` | Altyapı konfigürasyonu, 3rd-party client kurulumu | İş mantığı, UI |
| `components/ui/` | shadcn/ui CLI çıktısı | Elle yazılmış özel iş mantığı içeren component |

**ZORUNLU Kural:** Bir dosyanın hangi klasöre ait olduğu konusunda tereddüt varsa şu soru sorulur: *"Bu kod yalnızca bir feature'a mı ait, yoksa iki veya daha fazla feature tarafından mı kullanılıyor/kullanılacak?"* Cevap "sadece bir feature" ise `features/{feature}/` altında kalır; taşımadan önce ikinci bir kullanım yerinin gerçekten var olduğu teyit edilir (spekülatif olarak `shared`'a taşınmaz — bkz. KISS).

**Anti-Pattern:** `app/` dizini altına `lib/`, `utils/`, `helpers/` gibi alt klasörler açmak. Next.js'in App Router'ı route dışı dosyalarla kirletilmez; bu tür kod her zaman `lib/`, `shared/` veya ilgili `features/` altına gider.

---

## 3. Naming Convention

Tutarlı isimlendirme, kod okunabilirliğinin ve arama (grep/IDE) verimliliğinin temelidir. Aşağıdaki tablo istisnasız uygulanır.

| Öğe | Konvansiyon | Örnek |
|---|---|---|
| Dosya adı (component) | `kebab-case.tsx` | `project-card.tsx` |
| Dosya adı (util/service) | `kebab-case.ts` | `format-currency.ts` |
| Dosya adı (hook) | `kebab-case.ts`, `use-` prefix | `use-project-filters.ts` |
| Dosya adı (type) | `kebab-case.types.ts` | `project.types.ts` |
| Dosya adı (schema) | `kebab-case.schema.ts` | `project.schema.ts` |
| Dosya adı (Server Action) | `kebab-case.action.ts` | `create-project.action.ts` |
| Dosya adı (test) | `{ad}.test.ts` / `{ad}.spec.ts` | `project.service.test.ts` |
| Component adı | `PascalCase` | `ProjectCard` |
| Interface | `PascalCase`, gereksiz `I` prefix YOK | `Project`, `CreateProjectInput` |
| Type alias | `PascalCase` | `ProjectStatus` |
| Enum | `PascalCase` (ad), `PascalCase` veya `UPPER_SNAKE_CASE` (üye) — bkz. 4.5 | `ProjectStatus.Active` |
| Constant (gerçek sabit) | `UPPER_SNAKE_CASE` | `MAX_ACTIVE_PROJECTS` |
| Constant (config objesi) | `camelCase` | `defaultQueryOptions` |
| Function | `camelCase`, fiil ile başlar | `createProject`, `getUserById` |
| Boolean değişken/prop | `is/has/should/can` prefix | `isLoading`, `hasPermission` |
| Custom Hook | `use` prefix + `camelCase` | `useProjectFilters` |
| Event handler prop | `on` prefix | `onSubmit`, `onProjectDelete` |
| Event handler implementasyonu | `handle` prefix | `handleSubmit`, `handleProjectDelete` |
| Database tablo adı (Prisma model) | `PascalCase` tekil | `model Project { }` |
| Database kolon adı | `camelCase` (Prisma) → `snake_case` (`@map`) | `createdAt` → `@map("created_at")` |
| API route path | `kebab-case`, çoğul kaynak adı | `/api/project-members` |
| API query parametresi | `camelCase` | `?sortBy=createdAt&pageSize=20` |
| Environment Variable | `UPPER_SNAKE_CASE`, uygulama prefix'i | `NEXT_PUBLIC_APP_URL`, `DATABASE_URL` |
| CSS/Tailwind custom class (nadiren) | `kebab-case` | `.prose-content` |

### 3.1. Özel Notlar

- **Server Component dosyaları** `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` Next.js konvansiyonuna göre sabittir, değiştirilmez.
- **Client component işaretleyici dosyalar**, dosya adına `.client.tsx` gibi bir ek almaz; `"use client"` direktifi dosyanın en tepesinde yeterlidir.
- **Barrel export (`index.ts`)** her klasörde zorunlu değildir; yalnızca bir feature'ın public API'sini dışa açmak için `features/{feature}/index.ts` kullanılabilir. Aşırı barrel dosyası circular dependency riskini artırır — bkz. 4.7.
- **API response tipi isimlendirmesi:** `{Entity}Response`, `{Entity}ListResponse`, `Create{Entity}Input`, `Update{Entity}Input` şablonuna uyulur.

**Yanlış örnekler (kullanılmaz):**

```typescript
// ❌ Macar notasyonu, gereksiz prefix
interface IProject { }
class CProjectService { }

// ❌ Belirsiz isim
function process(data: any) { }

// ❌ Tutarsız casing
const Get_User_By_Id = () => {};
```

---

## 4. TypeScript Kuralları

TypeScript, bu projede "isteğe bağlı tip ipucu" değil, **derleme zamanı sözleşmesidir**. `tsconfig.json` en katı ayarlarla çalışır.

### 4.1. `tsconfig.json` Zorunlu Ayarlar

```jsonc
{
  "compilerOptions": {
    "strict": true,                     // tüm strict alt bayrakları açar
    "noUncheckedIndexedAccess": true,   // arr[i] erişimini `T | undefined` yapar
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Neden `noUncheckedIndexedAccess`?** Bu bayrak olmadan `array[index]` her zaman `T` tipindedir; ancak dizi boşsa veya index sınır dışıysa runtime'da `undefined` döner ve bu tip sistemine yansımaz. Bu, production'da en sık görülen "cannot read property of undefined" hatalarından biridir.

### 4.2. `any` Kesinlikle Yasak

**ZORUNLU:** `any` tipi codebase'de hiçbir yerde kullanılmaz. ESLint kuralı `@typescript-eslint/no-explicit-any: "error"` olarak ayarlanır ve CI'da build'i kırar.

**Neden?** `any`, TypeScript'in tüm tip güvenliğini o noktada devre dışı bırakır ve hatayı zincirleme olarak sonraki tüm kullanım noktalarına yayar. Tip bilinmiyorsa `unknown` kullanılır (bkz. 4.3).

**Yasak:**

```typescript
function handleWebhookPayload(payload: any) { // ❌
  console.log(payload.user.email); // derleme zamanında yakalanamayan hata riski
}
```

**Doğru:**

```typescript
function handleWebhookPayload(payload: unknown) {
  const parsed = webhookPayloadSchema.parse(payload); // Zod ile daralt (narrow)
  console.log(parsed.user.email); // artık tip güvenli
}
```

### 4.3. `unknown` Kullanımı

Dış kaynaktan gelen (API response, JSON.parse, `catch (error)`, kullanıcı girdisi) her veri `unknown` olarak kabul edilir ve kullanılmadan önce bir type guard veya Zod şeması ile daraltılır (narrowing).

```typescript
try {
  await riskyOperation();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Bilinmeyen hata";
  logger.error(message);
}
```

### 4.4. `readonly` Kullanımı

Değişmemesi gereken tüm props, fonksiyon parametreleri ve domain objeleri `readonly` işaretlenir. Bu, yanlışlıkla mutasyonu derleme zamanında engeller.

```typescript
interface ProjectCardProps {
  readonly project: Project;
  readonly onSelect: (id: string) => void;
}

function sumBudgets(projects: readonly Project[]): number {
  return projects.reduce((sum, p) => sum + p.budget, 0);
}
```

### 4.5. `type` vs `interface`

Net kural karmaşayı önler:

- **`interface`** → Nesne şekilleri (object shapes), özellikle genişletilmesi (extend/implement) beklenen React prop tipleri ve domain entity'leri için kullanılır.
- **`type`** → Union, intersection, mapped type, tuple, fonksiyon imzası ve utility type kompozisyonları için kullanılır.

```typescript
// interface: nesne şekli, genişletilebilir
interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
}

interface ArchivedProject extends Project {
  archivedAt: Date;
}

// type: union / kompozisyon
type ProjectStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
type ProjectWithOwner = Project & { owner: User };
type AsyncResult<T> = { success: true; data: T } | { success: false; error: string };
```

**Enum yerine union type tercih sebebi:** TypeScript `enum`'ları runtime'da ekstra kod üretir ve `const enum` build tool uyumsuzlukları yaratabilir. Bu projede sabit kümeler için **string literal union** birincil tercihtir; Prisma modelleri için Prisma'nın kendi ürettiği enum kullanılır.

### 4.6. Utility Type Kullanımı

Türetilmiş tipler elle tekrar yazılmaz; TypeScript'in yerleşik utility type'ları kullanılır: `Pick`, `Omit`, `Partial`, `Required`, `Record`, `ReturnType`, `Awaited`.

```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: Date;
}

// ✅ Türetilmiş — tek kaynaktan senkron
type CreateProjectInput = Omit<Project, "id" | "createdAt">;
type UpdateProjectInput = Partial<CreateProjectInput>;
type ProjectSummary = Pick<Project, "id" | "name">;

// ❌ Elle tekrar yazılmış — Project değiştiğinde senkronizasyon bozulur
interface CreateProjectInputBad {
  name: string;
  description: string;
  ownerId: string;
}
```

### 4.7. Generic Kullanımı

Generic'ler yalnızca gerçek bir tekrar kullanılabilirlik ihtiyacı olduğunda kullanılır; "akıllı görünmek" için generic eklenmez (KISS ihlali).

```typescript
// ✅ Gerçek ihtiyaç: farklı entity tiplerinde tekrar kullanılan repository sözleşmesi
interface Repository<TEntity, TCreateInput> {
  findById(id: string): Promise<TEntity | null>;
  create(input: TCreateInput): Promise<TEntity>;
}

class ProjectRepository implements Repository<Project, CreateProjectInput> {
  async findById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({ where: { id } });
  }
  async create(input: CreateProjectInput): Promise<Project> {
    return prisma.project.create({ data: input });
  }
}
```

### 4.8. Genel Type Safety Kuralları

- Fonksiyon dönüş tipleri, karmaşık iş mantığı fonksiyonlarında **açıkça** yazılır (inference'a bırakılmaz); bu, dönüş tipinin yanlışlıkla değişmesini derleme zamanında yakalar.
- `as` type assertion **kaçınılması gereken** bir araçtır; yalnızca tip sisteminin bilemeyeceği durumlarda (örn. `document.getElementById` sonrası) ve mümkünse bir yorum ile gerekçelendirilerek kullanılır. `as any` veya çift assertion (`as unknown as X`) **YASAK**tır.
- Non-null assertion operatörü (`!`) yasak niteliğindedir; yerine explicit null check veya Zod validasyonu kullanılır.
- Circular import'lar yasaktır; barrel dosyalar (`index.ts`) dikkatli kullanılır, `features/*` arası circular bağımlılık oluşturacak importlardan kaçınılır.

---

## 5. React Kuralları

React 19 ile birlikte gelen Actions, `use()` hook'u ve improved Suspense desteği, Server Component'lerle birlikte bu projenin UI mimarisinin temelini oluşturur.

### 5.1. Server Component (Varsayılan)

**ZORUNLU:** Her component varsayılan olarak Server Component'tir. `"use client"` yalnızca aşağıdaki gerçek ihtiyaçlardan biri varsa eklenir:

- `useState`, `useReducer`, `useEffect` gibi state/lifecycle hook'ları
- Tarayıcı API'leri (`window`, `localStorage`, `IntersectionObserver`)
- Event handler'lar (`onClick`, `onChange`) — **not:** bir handler'ı tetiklemek component'in tamamını client yapmaz, yalnızca o yaprak (leaf) component client olur
- Üçüncü parti kütüphaneler (`react-hook-form`, TanStack Table client tarafı) client context'i gerektiriyorsa

```tsx
// app/(dashboard)/projects/page.tsx — Server Component
import { getProjects } from "@/features/projects/services/project.service";
import { ProjectList } from "@/features/projects/components/project-list";

export default async function ProjectsPage() {
  const projects = await getProjects(); // doğrudan DB erişimi, API katmanı yok
  return <ProjectList projects={projects} />;
}
```

### 5.2. Client Component

Client component'ler **mümkün olduğunca küçük ve yaprak (leaf) düzeyde** tutulur ("push client components to the leaves"). Bir sayfanın tamamını client yapmak yerine, yalnızca etkileşim gerektiren küçük parça client olur.

```tsx
// features/projects/components/project-like-button.tsx
"use client";

import { useState, useTransition } from "react";
import { toggleProjectLike } from "../actions/toggle-like.action";

interface ProjectLikeButtonProps {
  readonly projectId: string;
  readonly initialLiked: boolean;
}

export function ProjectLikeButton({ projectId, initialLiked }: ProjectLikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    setLiked((prev) => !prev); // optimistic update
    startTransition(async () => {
      await toggleProjectLike(projectId);
    });
  };

  return (
    <button onClick={handleClick} disabled={isPending} aria-pressed={liked}>
      {liked ? "Beğenildi" : "Beğen"}
    </button>
  );
}
```

**Anti-Pattern:** Bir sayfanın en üstteki `page.tsx` dosyasına `"use client"` eklemek çünkü sayfanın içinde bir yerde bir buton var. Bunun yerine buton kendi client component'ine çıkarılır ve server component'ten `children` veya prop olarak render edilir.

### 5.3. State Yönetimi

State yönetimi katmanlı bir strateji izler; her zaman **en düşük seviyeli, yeterli olan çözüm** seçilir:

| Kapsam | Çözüm |
|---|---|
| Sunucu verisi (DB'den gelen) | Server Component + `fetch`/Prisma (React cache ile) |
| Form state | React Hook Form (bkz. 5.7 harici, form entegrasyonu) |
| Tek component içi geçici UI state | `useState` |
| Birden fazla component'in paylaştığı, aynı sayfa ağacı içi state | Prop drilling (2-3 seviye) veya `useContext` |
| URL'de yaşaması gereken state (filtre, sayfa, arama) | `useSearchParams` / `nuqs` benzeri URL state |
| Global client state (auth session, tema) | React Context (minimal), Auth.js `useSession` |

**ZORUNLU:** Sunucudan gelen veri için ayrı bir client-side global state kütüphanesi (Redux, Zustand vb.) **varsayılan olarak kullanılmaz**. Next.js App Router mimarisinde sunucu verisi zaten Server Component + cache ile yönetilir; ek bir state kütüphanesi yalnızca gerçek, karmaşık client-only state (örn. çok adımlı wizard, canvas editör) için gerekçelendirilerek eklenir.

### 5.4. Props Kuralları

- Tüm prop interface'leri `readonly` olur (bkz. 4.4).
- Prop sayısı 7'yi aştığında, component'in çok fazla sorumluluk taşıdığının işaretidir; ilgili prop'lar bir obje içinde gruplanır veya component parçalanır.
- Boolean prop patlaması (`isX`, `isY`, `isZ`, `variant1`, `variant2`...) yerine tek bir `variant` union type'ı tercih edilir.

```typescript
// ❌ Boolean patlaması
interface ButtonProps {
  isPrimary?: boolean;
  isSecondary?: boolean;
  isDanger?: boolean;
  isLarge?: boolean;
  isSmall?: boolean;
}

// ✅ Union ile netleştirilmiş
interface ButtonProps {
  variant: "primary" | "secondary" | "danger";
  size: "sm" | "md" | "lg";
}
```

### 5.5. Composition

Bkz. Bölüm 1.6. Ek olarak: `children` prop'u, koşullu render bloklarını azaltmak için aktif olarak kullanılır; render prop pattern'i yalnızca gerçekten parametrik render mantığı gerektiğinde kullanılır (nadir).

### 5.6. Memoization (`memo`, `useMemo`, `useCallback`)

**ÖNERİLEN — Erken optimizasyon değil, ölçülmüş optimizasyon.** React 19'un compiler desteği (React Compiler) manuel memoization ihtiyacını büyük ölçüde azaltır; ancak React Compiler devre dışıysa veya henüz projeye entegre değilse:

- `React.memo`, yalnızca bir component'in **sık render olan bir parent altında** ve **aynı prop'larla tekrar render edildiği React DevTools Profiler ile kanıtlanmış** durumlarda uygulanır.
- `useCallback`/`useMemo`, yalnızca (a) referans eşitliğinin bir `memo`'lu child'a veya bir `useEffect` dependency array'ine geçtiği, ya da (b) gerçekten pahalı bir hesaplama söz konusu olduğu durumlarda kullanılır.

**Anti-Pattern:** Her fonksiyona körü körüne `useCallback`, her türetilmiş değere `useMemo` sarmak. Bu, hem okunabilirliği düşürür hem de çoğu durumda (bağımlılık dizisi karşılaştırması maliyeti nedeniyle) performansı iyileştirmez, bazen kötüleştirir.

### 5.7. Hook Kuralları

- React'ın resmi [Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning) kesin olarak uygulanır: hook'lar yalnızca en üst seviyede çağrılır, koşul/döngü/nested fonksiyon içinde çağrılmaz. `eslint-plugin-react-hooks` `error` seviyesinde açık tutulur.
- Bir hook'un bağımlılık dizisi (`useEffect`, `useMemo`, `useCallback`) ESLint tarafından otomatik doğrulanır; `// eslint-disable-next-line react-hooks/exhaustive-deps` yalnızca gerekçe yorumu ile ve code review onayı ile eklenir.

### 5.8. Custom Hook Yazımı

Bir mantık parçası birden fazla component'te tekrarlanıyorsa veya bir component'in state mantığını component'in render kodundan izole etmek anlamlıysa custom hook'a çıkarılır.

```typescript
// features/projects/hooks/use-project-filters.ts
"use client";

import { useState, useMemo } from "react";
import type { Project, ProjectStatus } from "../types/project.types";

interface UseProjectFiltersResult {
  readonly filteredProjects: readonly Project[];
  readonly statusFilter: ProjectStatus | "ALL";
  readonly setStatusFilter: (status: ProjectStatus | "ALL") => void;
}

export function useProjectFilters(projects: readonly Project[]): UseProjectFiltersResult {
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">("ALL");

  const filteredProjects = useMemo(() => {
    if (statusFilter === "ALL") return projects;
    return projects.filter((p) => p.status === statusFilter);
  }, [projects, statusFilter]);

  return { filteredProjects, statusFilter, setStatusFilter };
}
```

**Kurallar:**
- Her custom hook, tek bir sorumluluk taşır (SRP).
- Hook'un dönüş değeri her zaman açık bir interface ile tiplenir (inference'a bırakılmaz).
- Hook, kendi içinde başka bir hook'u "gizli şekilde" tetikleyen yan etkiler içermemeli — davranış tahmin edilebilir olmalı.

---

## 6. Next.js Kuralları

### 6.1. App Router

Proje yalnızca **App Router** kullanır; Pages Router (`pages/`) kullanılmaz. Route grupları (`(group)`), layout iç içeliği ve dosya bazlı konvansiyonlar (`loading.tsx`, `error.tsx`) aktif olarak kullanılır.

### 6.2. Server Actions

**ZORUNLU:** Tüm iç veri mutasyonları (create/update/delete) Server Actions ile yapılır; ayrı bir `/api` route handler'ı yalnızca dış sistemlerle entegrasyon (webhook, 3rd-party callback) için oluşturulur.

```typescript
// features/projects/actions/create-project.action.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createProjectSchema } from "../schemas/project.schema";
import { createProject } from "../services/project.service";

export async function createProjectAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "UNAUTHORIZED" };
  }

  const parsed = createProjectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false as const, error: "VALIDATION_ERROR", issues: parsed.error.flatten() };
  }

  const project = await createProject(parsed.data, session.user.id);
  revalidatePath("/projects");
  return { success: true as const, data: project };
}
```

**Kurallar:**
- Her Server Action, en üstte **kendi authentication/authorization kontrolünü** yapar (asla üst katmanın bunu yaptığını varsaymaz).
- Server Action'lar **ince (thin)** kalır: validation → auth check → service çağrısı → cache revalidation. İş mantığı service katmanında yaşar.
- Mutation sonrası ilgili path/tag'ler `revalidatePath`/`revalidateTag` ile invalide edilir.

### 6.3. Caching

Next.js 15'in varsayılan fetch caching davranışı değişmiştir (`fetch` artık varsayılan olarak cache'lenmez); bu nedenle cache stratejisi **açıkça** belirtilir:

```typescript
// Statik, nadiren değişen veri
fetch(url, { next: { revalidate: 3600 } });

// Her istekte taze veri (kullanıcıya özel, sık değişen)
fetch(url, { cache: "no-store" });

// Tag bazlı, manuel invalide edilen veri
fetch(url, { next: { tags: ["projects"] } });
```

Prisma sorguları için Next.js'in `unstable_cache` veya React'ın `cache()` fonksiyonu, aynı istek yaşam döngüsü içinde tekrarlanan sorguları deduplike etmek için kullanılır.

### 6.4. Streaming ve `loading.tsx`

Veri getirme süresi uzun olan sayfalarda `<Suspense>` sınırları ile streaming aktif edilir; her route segmentinde anlamlı bir `loading.tsx` (iskelet/skeleton, bkz. 17.4) bulunur.

```tsx
// app/(dashboard)/projects/[projectId]/loading.tsx
import { ProjectDetailSkeleton } from "@/shared/components/skeletons/project-detail-skeleton";

export default function Loading() {
  return <ProjectDetailSkeleton />;
}
```

### 6.5. Metadata

Her `page.tsx`, statik veya dinamik `generateMetadata` ile SEO metadata'sı tanımlar; hardcoded `<title>`/`<meta>` tag'leri kullanılmaz.

```typescript
export async function generateMetadata({ params }: { params: Promise<{ projectId: string }> }): Promise<Metadata> {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  return {
    title: project ? `${project.name} | Proje Paneli` : "Proje Bulunamadı",
    description: project?.description,
  };
}
```

### 6.6. `error.tsx` ve `not-found.tsx`

Her route segmenti, kendi hata sınırını (`error.tsx`) ve gerekiyorsa `not-found.tsx` dosyasını tanımlar. `error.tsx` her zaman `"use client"` olmak zorundadır (React error boundary gereksinimi).

```tsx
"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert">
      <p>Bir şeyler ters gitti.</p>
      <button onClick={reset}>Tekrar dene</button>
    </div>
  );
}
```

### 6.7. Dynamic Routes

Dinamik segment isimleri anlamlı ve kaynak adına uygun olmalıdır: `[projectId]`, `[userId]` — asla genel `[id]` (birden fazla dinamik segment aynı route'ta olduğunda karışıklık yaratır).

### 6.8. Parallel Routes ve Route Groups

- **Route Groups** `(groupName)`, URL'e yansımadan layout/organizasyon amacıyla kullanılır (örn. `(auth)`, `(dashboard)`).
- **Parallel Routes** (`@slot`), aynı layout içinde bağımsız yüklenen birden fazla bölüm gerektiğinde (örn. dashboard'da hem `@analytics` hem `@notifications` slotu) kullanılır; basit sayfalarda gereksiz karmaşıklık yaratacağından zorunlu değildir.

---

## 7. API Kuralları

`/api` route handler'ları yalnızca dış sistem entegrasyonları (webhook, public API, 3rd-party callback) için kullanılır. Bu bölümdeki standartlar bu handler'lar için geçerlidir.

### 7.1. REST Standardı

| HTTP Metod | Kullanım |
|---|---|
| `GET` | Kaynak okuma, yan etkisiz (idempotent) |
| `POST` | Yeni kaynak oluşturma veya idempotent olmayan aksiyon |
| `PATCH` | Kısmi güncelleme |
| `PUT` | Tam güncelleme (nadiren kullanılır) |
| `DELETE` | Kaynak silme |

Route path'leri çoğul isim kullanır: `/api/projects`, `/api/projects/{id}/members`.

### 7.2. HTTP Status Kodları

| Kod | Anlam | Kullanım |
|---|---|---|
| `200` | OK | Başarılı GET/PATCH/PUT |
| `201` | Created | Başarılı POST (kaynak oluşturuldu) |
| `204` | No Content | Başarılı DELETE |
| `400` | Bad Request | Validasyon hatası |
| `401` | Unauthorized | Kimlik doğrulanmamış |
| `403` | Forbidden | Kimlik doğrulanmış ama yetkisiz |
| `404` | Not Found | Kaynak bulunamadı |
| `409` | Conflict | Benzersizlik ihlali (örn. duplicate email) |
| `422` | Unprocessable Entity | Şekli doğru ama iş kuralına aykırı veri |
| `429` | Too Many Requests | Rate limit aşıldı |
| `500` | Internal Server Error | Beklenmeyen sunucu hatası |

### 7.3. JSON Response Formatı

Her response, tutarlı bir zarf (envelope) formatında döner:

```typescript
// Başarılı
{
  "success": true,
  "data": { /* ... */ },
  "meta": { "page": 1, "pageSize": 20, "totalCount": 145 } // yalnızca liste endpoint'lerinde
}

// Hatalı
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Girdi doğrulaması başarısız.",
    "details": [{ "field": "email", "message": "Geçerli bir e-posta adresi girin." }]
  }
}
```

### 7.4. Pagination

Cursor-based veya offset-based pagination, tüm liste endpoint'lerinde **zorunlu**dur (limitsiz `findMany` YASAK — bkz. Bölüm 20).

```typescript
// Query: /api/projects?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
```

### 7.5. Filtering ve Sorting

Filtre ve sıralama parametreleri, whitelist edilen alanlarla sınırlıdır; kullanıcı girdisi doğrudan `orderBy`/`where` objesine enjekte edilmez (bkz. Bölüm 11 — SQL Injection).

```typescript
const ALLOWED_SORT_FIELDS = ["createdAt", "name", "status"] as const;
const sortSchema = z.object({
  sortBy: z.enum(ALLOWED_SORT_FIELDS).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
```

### 7.6. Validation

Her endpoint'e giren veri, işlenmeden önce Zod şeması ile doğrulanır (bkz. Bölüm 9). Validasyon başarısız olursa `400` + detaylı `issues` listesi döner.

### 7.7. Error Response

Hata response'ları hiçbir zaman ham stack trace veya iç sistem detayı (Prisma hata mesajı, dosya yolu) içermez; bkz. Bölüm 10.

### 7.8. Rate Limiting Hazırlığı

Her public/webhook endpoint, ileride bir rate limiter (örn. Upstash Redis tabanlı sliding window) takılabilecek şekilde tasarlanır: IP/kullanıcı bazlı anahtar üretimi endpoint girişinde merkezi bir middleware/helper üzerinden yapılır, endpoint kodunun içine gömülmez.

```typescript
// lib/rate-limit.ts — gelecekte gerçek bir store (Redis) ile değiştirilebilir arayüz
export interface RateLimiter {
  check(key: string): Promise<{ allowed: boolean; remaining: number }>;
}
```

---

## 8. Prisma Kuralları

### 8.1. Schema

- Model isimleri `PascalCase` tekil (`Project`, `User`), veritabanı tablo adı `@@map` ile `snake_case` çoğul olarak eşlenir.
- Her model, standart **audit alanları** taşır (bkz. 8.9).
- Foreign key ilişkilerinde `onDelete` davranışı **her zaman açıkça** belirtilir (`Cascade`, `Restrict`, `SetNull`) — varsayılana bırakılmaz.

```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  status      ProjectStatus @default(DRAFT)

  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id], onDelete: Restrict)

  members     ProjectMember[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  @@map("projects")
  @@index([ownerId])
  @@index([status])
}

enum ProjectStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}
```

### 8.2. Migration

**ZORUNLU:** Migration'lar `prisma migrate dev` ile üretilir ve **elle düzenlenmez** (üretim migration'ı ayrı bir durum; bkz. aşağıda). Her migration açıklayıcı bir isim taşır: `add_project_status_index`, `rename_owner_to_owner_id`.

- Migration dosyaları her zaman versiyon kontrolüne eklenir.
- Production'a `prisma migrate deploy` ile uygulanır, asla `prisma db push` ile değil.
- Yıkıcı migration'lar (kolon silme, tip daraltma) önce **backward-compatible** bir ara adımdan geçirilir (expand-contract pattern): yeni kolon eklenir → veri taşınır → eski kolon bir sonraki release'de silinir.

### 8.3. Relations

İlişkiler her zaman iki yönlü tanımlanır (`@relation` her iki modelde de görünür) ve N+1 sorgu riskine karşı `include`/`select` bilinçli kullanılır (bkz. 8.6).

### 8.4. Transactions

Birden fazla yazma işleminin atomik olması gereken her durumda `prisma.$transaction` kullanılır.

```typescript
await prisma.$transaction(async (tx) => {
  const project = await tx.project.create({ data: projectInput });
  await tx.auditLog.create({
    data: { action: "PROJECT_CREATED", entityId: project.id, userId },
  });
  return project;
});
```

**Neden?** Proje oluşturma başarılı olup audit log yazma başarısız olursa, transaction olmadan sistem tutarsız bir duruma düşer (proje var ama audit izi yok). `$transaction`, ya hepsi ya hiçbiri garantisi verir.

### 8.5. Index

Sık `WHERE`, `ORDER BY` ve foreign key olarak kullanılan her kolon indexlenir. Bileşik (composite) index'ler, sorgu pattern'ine göre kolon sırası gözetilerek tanımlanır (en seçici/eşitlik filtresi önce).

```prisma
@@index([ownerId, status]) // WHERE ownerId = ? AND status = ? sorgusu için optimum
```

### 8.6. `select` ve `include`

**ZORUNLU:** Prisma sorgularında, ihtiyaç duyulmayan alanları döndürmemek için `select` aktif olarak kullanılır; özellikle hassas alanlar (`passwordHash`, `refreshToken`) hiçbir zaman varsayılan (tüm alanları döndüren) sorgu ile client'a sızdırılmaz.

```typescript
// ✅ Yalnızca gerekli alanlar
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true },
});

// ❌ Tüm alanlar (passwordHash dahil) döner ve yanlışlıkla serialize edilebilir
const user = await prisma.user.findUnique({ where: { id } });
```

`include` yalnızca gerçekten ilişkili veri gerektiğinde kullanılır; derin (3+ seviye) nested include yerine ayrı sorgular veya DataLoader pattern'i değerlendirilir.

### 8.7. Soft Delete

Kullanıcı tarafından tetiklenen silme işlemleri, veri kaybını önlemek ve denetim (audit) gereksinimleri için **soft delete** ile uygulanır (`deletedAt: DateTime?`). Gerçek (hard) delete yalnızca GDPR/KVKK "unutulma hakkı" talepleri gibi yasal zorunluluklarda, ayrı ve loglanan bir prosedürle yapılır.

```typescript
// Soft delete
await prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });

// Tüm sorgular varsayılan olarak deletedAt: null filtresi taşır
await prisma.project.findMany({ where: { deletedAt: null } });
```

**Not:** Soft-delete filtresini her sorguda elle tekrarlamamak için Prisma Client Extension (`$extends`) ile global bir middleware katmanı tanımlanması önerilir.

### 8.8. Audit Fields

Her model minimum şu alanları taşır: `createdAt`, `updatedAt`. Kritik iş verisi taşıyan modeller (finansal işlem, izin/yetki değişikliği) ayrıca `createdBy`, `updatedBy` alanlarını ve ayrı bir `AuditLog` tablosuna kayıt düşer (bkz. Bölüm 16).

### 8.9. Seed

`prisma/seed.ts`, geliştirme ortamı için tutarlı ve tekrarlanabilir (idempotent) veri üretir; `upsert` kullanılır, `create` ile tekrar çalıştırıldığında duplicate veri oluşmaz.

```typescript
async function main() {
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", name: "Admin", role: "ADMIN" },
  });
}
```

---

## 9. Validation Kuralları

### 9.1. Zod — Tek Doğruluk Kaynağı

**ZORUNLU:** Her veri şekli için **tek bir Zod şeması** tanımlanır ve hem frontend hem backend bu şemayı **paylaşır** (import eder). Aynı validasyon kuralı iki yerde elle tekrar yazılmaz.

```typescript
// features/projects/schemas/project.schema.ts
import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(3, "Ad en az 3 karakter olmalı").max(100),
  description: z.string().max(1000).optional(),
  budget: z.number().positive("Bütçe pozitif olmalı"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

Bu tip, hem React Hook Form'un `zodResolver`'ında (frontend) hem Server Action'ın `safeParse` çağrısında (backend) **aynı dosyadan** import edilir.

### 9.2. Frontend Validation

Frontend validasyonu **kullanıcı deneyimi** içindir (anlık geri bildirim); güvenlik sınırı değildir. React Hook Form + `zodResolver` ile submit öncesi ve `onBlur` bazlı validasyon yapılır.

```typescript
const form = useForm<CreateProjectInput>({
  resolver: zodResolver(createProjectSchema),
  mode: "onBlur",
});
```

### 9.3. Backend Validation

**ZORUNLU:** Frontend validasyonu client tarafından atlanabilir (DevTools, doğrudan API çağrısı) olduğundan, **her Server Action ve her API route handler, aynı Zod şemasıyla girdisini yeniden doğrular.** Backend validasyonu asla frontend'e güvenerek atlanmaz.

### 9.4. Shared Schema Organizasyonu

Bir schema yalnızca bir feature'a özelse `features/{feature}/schemas/` altında yaşar; birden fazla feature'da tekrar kullanılan temel şemalar (örn. `emailSchema`, `paginationSchema`) `shared/schemas/` altına taşınır.

---

## 10. Error Handling

### 10.1. Beklenen Hata (Expected Errors)

İş akışının doğal bir parçası olan hatalar (validasyon hatası, yetkisiz erişim, kaynak bulunamadı) **exception fırlatılarak değil, değer olarak** modellenir (Server Actions için discriminated union dönüş tipi, bkz. 6.2 örneği).

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
```

**Neden?** Beklenen hatalar için exception kullanmak, çağıran kodun `try/catch` ile her yeri sarmasını zorunlu kılar ve hata yönetimini kontrol akışından (control flow) ayırır. Değer olarak dönen hatalar, TypeScript'in tip sistemi tarafından zorunlu kılınır (discriminated union her iki durumu da handle etmeye zorlar).

### 10.2. Beklenmeyen Hata (Unexpected Errors)

Programlama hataları, altyapı arızaları (DB bağlantı kopması) gibi gerçekten beklenmedik durumlar **exception olarak fırlatılır** ve en üst seviyede (`error.tsx`, global error handler, route handler try/catch) yakalanır. Bu tür hatalar kullanıcıya asla ham haliyle gösterilmez.

### 10.3. Loglama

Her yakalanan beklenmeyen hata, merkezi logger (bkz. Bölüm 16) üzerinden **structured logging** ile kaydedilir: hata mesajı, stack trace, request context (userId, requestId), zaman damgası.

```typescript
catch (error: unknown) {
  logger.error("project.create.failed", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    userId,
  });
  return { success: false, error: { code: "INTERNAL_ERROR", message: "Bir hata oluştu." } };
}
```

### 10.4. User Message vs Developer Message

- **User Message:** Kullanıcıya gösterilen mesaj; anlaşılır, aksiyona yönlendirici, iç sistem detayı içermeyen bir dildedir ("Proje oluşturulamadı, lütfen tekrar deneyin.").
- **Developer Message:** Yalnızca loglarda/monitoring sisteminde görünen, tam teknik detay içeren mesaj (stack trace, sorgu parametreleri, hata kodu).

Bu iki mesaj **asla karıştırılmaz** — kullanıcıya Prisma hata mesajı, SQL sorgusu veya stack trace gösterilmesi güvenlik açığıdır (bkz. Bölüm 11).

---

## 11. Güvenlik Kuralları

### 11.1. Authentication

Kimlik doğrulama **Auth.js v5** ile merkezi olarak yönetilir. Session kontrolü, korumalı her Server Action ve her Server Component'in **kendi içinde** yapılır (yalnızca middleware'e güvenilmez — defense in depth).

```typescript
export async function updateProjectAction(id: string, input: UpdateProjectInput) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: { code: "UNAUTHORIZED", message: "Giriş yapmalısınız." } };
  }
  // ...
}
```

### 11.2. Authorization ve RBAC

Rol tabanlı erişim kontrolü (RBAC), yetki kontrolünün **iş mantığı (service) katmanında** uygulandığı merkezi bir yapı ile yönetilir; UI'da bir butonun gizlenmesi **asla** tek başına yetkilendirme sayılmaz (UI gizleme yalnızca UX'tir, güvenlik sınırı backend'dedir).

```typescript
// shared/utils/authorize.ts
export function assertPermission(session: Session, permission: Permission): void {
  if (!hasPermission(session.user.role, permission)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
}

// service içinde kullanım
export async function deleteProject(projectId: string, session: Session) {
  assertPermission(session, "PROJECT_DELETE");
  const project = await projectRepository.findById(projectId);
  if (project?.ownerId !== session.user.id && session.user.role !== "ADMIN") {
    throw new ForbiddenError("Yalnızca proje sahibi veya admin silebilir.");
  }
  // ...
}
```

### 11.3. Input Validation

Bkz. Bölüm 9. Ek olarak: dosya yükleme, e-posta içeriği gibi zengin girdi türleri için ek doğrulama (dosya tipi/boyutu whitelist, MIME type kontrolü) uygulanır.

### 11.4. XSS (Cross-Site Scripting)

- React, varsayılan olarak JSX içeriğini escape eder; bu koruma **asla** `dangerouslySetInnerHTML` ile bypass edilmez, edilmesi zorunluysa (örn. zengin metin editörü çıktısı) içerik mutlaka bir sanitization kütüphanesinden (örn. DOMPurify) geçirilir.
- Kullanıcı girdisi doğrudan `<script>` bağlamına veya `href`/`src` attribute'larına enjekte edilmez.

### 11.5. CSRF

Server Actions, Next.js tarafından yerleşik CSRF koruması (origin header doğrulaması) ile gelir. Ek olarak dış sistemlere açılan `/api` route handler'larında state-changing (POST/PATCH/DELETE) her istek için origin/referer kontrolü yapılır.

### 11.6. SQL Injection

Prisma, parametreize sorgular kullandığı için standart `prisma.model.findMany()` API'si SQL injection'a karşı doğal olarak güvenlidir. `$queryRawUnsafe` **kesinlikle yasaktır**; ham SQL gerektiğinde yalnızca **parametreize** `$queryRaw` (tagged template) kullanılır.

```typescript
// ✅ Parametreize, güvenli
await prisma.$queryRaw`SELECT * FROM projects WHERE owner_id = ${ownerId}`;

// ❌ YASAK — string concatenation ile injection riski
await prisma.$queryRawUnsafe(`SELECT * FROM projects WHERE owner_id = '${ownerId}'`);
```

### 11.7. Rate Limit

Kimlik doğrulama endpoint'leri (login, register, şifre sıfırlama) ve public API endpoint'leri, brute-force ve abuse saldırılarına karşı rate limiting ile korunur (bkz. 7.8).

### 11.8. Environment Variables ve Secrets

- Tüm environment değişkenleri, uygulama başlarken **Zod ile doğrulanır** (`lib/env.ts`); eksik/hatalı bir değişken uygulamayı build/start aşamasında durdurur, runtime'da sessiz hata vermez.
- İstemciye açılması gereken değişkenler `NEXT_PUBLIC_` prefix'i taşır; **hiçbir secret (DB şifresi, API key, JWT secret) `NEXT_PUBLIC_` prefix'i almaz.**
- Secret'lar hiçbir zaman versiyon kontrolüne (`git`) commit edilmez; `.env.example` yalnızca değişken adlarını (boş/örnek değerlerle) içerir.

```typescript
// lib/env.ts
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

### 11.9. Cookies

Session/auth cookie'leri `httpOnly`, `secure` (production'da) ve `sameSite: "lax"` (veya gereksinime göre `strict`) olarak ayarlanır; Auth.js v5'in varsayılan cookie konfigürasyonu bu ilkeleri zaten uygular ve elle zayıflatılmaz.

### 11.10. HTTP Headers

Production ortamında güvenlik header'ları (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`) `next.config.ts` içinde merkezi olarak tanımlanır.

---

## 12. Performans Kuralları

### 12.1. Lazy Loading

Büyük, sayfa yüklendiği anda gerekli olmayan component'ler (modal içerikleri, grafik kütüphaneleri, zengin metin editörleri) `next/dynamic` ile lazy load edilir.

```typescript
const ProjectAnalyticsChart = dynamic(() => import("./project-analytics-chart"), {
  loading: () => <ChartSkeleton />,
});
```

### 12.2. Image Optimization

Tüm resimler `next/image` ile render edilir; ham `<img>` etiketi yalnızca `next/image`'ın uygun olmadığı istisnai durumlarda (örn. dinamik SVG data URI) kullanılır ve gerekçelendirilir. `width`/`height` veya `fill` her zaman belirtilir (CLS'i önlemek için).

### 12.3. Memoization

Bkz. Bölüm 5.6 — ölçülmüş, kanıtlanmış darboğazlar için uygulanır.

### 12.4. Database Query Optimization

- N+1 sorgu problemi, `include`/`select` ile ilişkili verinin tek sorguda getirilmesiyle önlenir.
- Yalnızca ihtiyaç duyulan kolonlar `select` edilir (bkz. 8.6).
- Sık çalışan sorgular üzerinde `EXPLAIN` ile periyodik performans denetimi yapılır; yavaş sorgular index eklenerek veya sorgu yeniden yazılarak optimize edilir.

### 12.5. Pagination

Bkz. Bölüm 7.4 — sınırsız `findMany` YASAK, her liste sorgusu `take`/`skip` veya cursor ile sınırlıdır.

### 12.6. Caching

Bkz. Bölüm 6.3 — fetch/Prisma sorgu sonuçları, veri değişim sıklığına uygun stratejiyle (`revalidate`, `tags`, `no-store`) cache'lenir.

### 12.7. Bundle Size

- Büyük 3rd-party kütüphaneler (`moment.js` yerine `date-fns`/`dayjs`, tüm ikon setini import etmek yerine tek tek `lucide-react` ikonu) bundle boyutuna dikkat edilerek seçilir.
- `next build` sonrası bundle analyzer (`@next/bundle-analyzer`) periyodik olarak çalıştırılır ve anormal büyüme code review'da sorgulanır.

### 12.8. Code Splitting

Route bazlı code splitting Next.js tarafından otomatik sağlanır; ek olarak büyük, koşullu render edilen UI blokları (bkz. 12.1) manuel `dynamic()` ile bölünür.

---

## 13. Kod Yazım Standartları

### 13.1. Maximum Function Length

Bir fonksiyon **40 satırı** aştığında, muhtemelen birden fazla sorumluluk taşıyor demektir; daha küçük, adlandırılmış alt fonksiyonlara bölünür.

### 13.2. Maximum Component Length

Bir component **150-200 satırı** aştığında, alt component'lere ve/veya custom hook'lara ayrıştırılır. Bir component hem veri çekme mantığı, hem karmaşık state, hem de büyük bir render ağacı taşıyorsa bu sınır kolayca aşılır — bu durum, refactor edilmesi gerektiğinin işaretidir.

### 13.3. Dosya Uzunluğu

Bir dosya **300 satırı** aştığında, o dosyanın birden fazla modül/sorumluluk barındırdığından şüphelenilmeli ve ayrıştırma değerlendirilmelidir. Kesin bir üst sınır yoktur; kural mekanik olarak dayatılmaz, code review'da bir tartışma tetikleyicisidir.

### 13.4. Comment Kullanımı

Yorumlar **"ne yapıldığını"** değil, **"neden böyle yapıldığını"** açıklar. İyi isimlendirilmiş kod zaten "ne"yi anlatır.

```typescript
// ❌ Gereksiz — kod zaten bunu söylüyor
// kullanıcıyı bul
const user = await findUserById(id);

// ✅ Gerekçe açıklıyor — kod tek başına bunu anlatamaz
// Stripe webhook'ları sırasız gelebildiği için, event timestamp'i
// mevcut kayıttan eskiyse işlem atlanır (idempotency + ordering garantisi).
if (event.createdAt < existingRecord.updatedAt) return;
```

### 13.5. Magic Number Yasağı

Kod içinde açıklamasız sayısal/string literal'ler kullanılmaz; anlamlı adlandırılmış sabitlere çıkarılır.

```typescript
// ❌
if (user.age >= 18 && projects.length < 3) { }

// ✅
const MINIMUM_ADULT_AGE = 18;
const MAX_ACTIVE_PROJECTS = 3;
if (user.age >= MINIMUM_ADULT_AGE && projects.length < MAX_ACTIVE_PROJECTS) { }
```

### 13.6. Early Return

Derin iç içe (nested) `if` blokları yerine early return (guard clause) tercih edilir; bu, kognitif yükü azaltır ve "happy path"i kod akışının en solunda tutar.

```typescript
// ❌ Derin nesting
function processOrder(order: Order) {
  if (order.isValid) {
    if (order.items.length > 0) {
      if (order.customer) {
        // asıl işlem burada, 3 seviye içeride
      }
    }
  }
}

// ✅ Early return
function processOrder(order: Order) {
  if (!order.isValid) return;
  if (order.items.length === 0) return;
  if (!order.customer) return;
  // asıl işlem burada, en solda
}
```

### 13.7. Single Responsibility

Bkz. Bölüm 1.2 (S). Her dosya, her fonksiyon, her component tek bir net amaca hizmet eder; "ve" kelimesiyle açıklanması gereken bir fonksiyon adı (`validateAndSaveAndNotify`) parçalanma sinyalidir.

---

## 14. Git Kuralları

### 14.1. Branch Strategy

**Trunk-based / GitHub Flow** kullanılır:

- `main` — her zaman deploy edilebilir durumda, korumalı (protected) branch.
- Özellik/düzeltme dalları `main`'den açılır: `feature/{ticket-id}-kisa-aciklama`, `fix/{ticket-id}-kisa-aciklama`, `chore/...`, `refactor/...`.
- Dallar mümkün olduğunca kısa ömürlü tutulur (birkaç gün içinde merge edilir); uzun yaşayan dallar merge conflict riskini ve review yükünü artırır.

### 14.2. Commit Convention

**Conventional Commits** standardı uygulanır:

```
<type>(<scope>): <kısa açıklama>

[opsiyonel gövde]

[opsiyonel footer]
```

| Type | Anlamı |
|---|---|
| `feat` | Yeni özellik |
| `fix` | Hata düzeltmesi |
| `refactor` | Davranış değiştirmeyen kod iyileştirmesi |
| `perf` | Performans iyileştirmesi |
| `test` | Test ekleme/düzeltme |
| `docs` | Dokümantasyon |
| `chore` | Build, bağımlılık, konfigürasyon değişikliği |
| `style` | Formatlama (davranış değişikliği yok) |

```
feat(projects): proje oluşturma formuna bütçe alanı eklendi

fix(auth): oturum süresi dolduğunda yanlış redirect düzeltildi
```

### 14.3. Pull Request

- Her PR, tek bir mantıksal değişikliği kapsar (bir feature, bir fix); alakasız değişiklikler aynı PR'da birleştirilmez.
- PR açıklaması şunları içerir: **ne değişti**, **neden değişti**, **nasıl test edildi**, varsa **ekran görüntüsü** (UI değişikliğinde zorunlu).
- PR, CI kontrollerinden (lint, type-check, test) geçmeden merge edilmez.

### 14.4. Code Review

- Her PR, merge edilmeden önce en az **bir onay (approval)** alır.
- Reviewer, yalnızca stil değil; mimari uyum (bu belgeye uygunluk), güvenlik ve test kapsamı açısından da değerlendirme yapar.
- Yazar, review yorumlarına yanıt vermeden veya gerekçelendirmeden yorumu "resolve" olarak işaretlemez.

### 14.5. Versioning

Proje [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`) kullanır: kırıcı değişiklik → `MAJOR`, geriye uyumlu yeni özellik → `MINOR`, geriye uyumlu hata düzeltmesi → `PATCH`.

---

## 15. Test Kuralları

### 15.1. Unit Test

Saf iş mantığı (service katmanı, utility fonksiyonlar, Zod şemaları) unit test ile kapsanır. Repository/DB katmanı mock'lanır; test yalnızca test edilen birimin mantığına odaklanır.

```typescript
describe("createProject", () => {
  it("throws BusinessRuleViolationError when active project limit is reached", async () => {
    const repo = { countActiveByUser: jest.fn().mockResolvedValue(3), create: jest.fn() };
    await expect(createProject(input, userId, repo)).rejects.toThrow(BusinessRuleViolationError);
  });
});
```

### 15.2. Integration Test

Server Action'lar ve API route handler'ları, gerçek (test) bir veritabanına karşı integration test ile doğrulanır; DB tamamen mock'lanmaz (mock/prod davranış farkı riskini önlemek için — bkz. Bölüm 8).

### 15.3. E2E Test

Kritik kullanıcı akışları (kayıt ol → giriş yap → proje oluştur → proje sil) uçtan uca (Playwright vb.) test edilir. E2E testler; hız yerine güvenilirliği önceliklendirir, "golden path" + en kritik hata senaryolarına odaklanır (her olası kombinasyon E2E'de test edilmez, bu unit/integration testlerin işidir).

### 15.4. Test İsimlendirmesi

Test adı, **davranışı** açıklar; implementasyon detayını değil.

```typescript
// ✅ Davranış odaklı
it("returns 403 when user tries to delete a project they do not own")

// ❌ İmplementasyon odaklı, kırılgan
it("calls prisma.project.delete")
```

Test dosyaları test edilen dosyanın yanında veya `__tests__/` altında, `{ad}.test.ts` konvansiyonuyla yaşar.

---

## 16. Logging Standardı

Merkezi bir `logger` (bkz. `lib/logger.ts`) üzerinden, structured (JSON) log üretilir; `console.log` production kodunda **YASAK**tır (bkz. Bölüm 20).

| Seviye | Kullanım |
|---|---|
| `info` | Normal iş akışı olayları (kullanıcı girişi, proje oluşturuldu) |
| `warn` | Beklenmedik ama sistemi durdurmayan durumlar (deprecated API kullanımı, retry tetiklendi) |
| `error` | Yakalanan hatalar, başarısız işlemler |
| `audit` | Güvenlik/uyumluluk açısından izlenmesi gereken olaylar (yetki değişikliği, veri silme, giriş denemesi) — ayrı, değiştirilemez (append-only) bir kayıt hedefine yazılır |

```typescript
logger.info("project.created", { projectId: project.id, userId, timestamp: new Date().toISOString() });
logger.audit("permission.changed", { targetUserId, oldRole, newRole, changedBy: actorId });
```

**Kural:** Log mesajları `{domain}.{action}.{sonuç}` formatında (`project.create.failed`) tutarlı bir isimlendirme izler; bu, log arama/filtrelemeyi kolaylaştırır. Hiçbir log kaydı şifre, token veya kredi kartı gibi hassas veri içermez.

---

## 17. UI Kuralları

### 17.1. Responsive Tasarım

Tüm arayüzler mobile-first yaklaşımla, Tailwind'in responsive breakpoint'leri (`sm`, `md`, `lg`, `xl`) kullanılarak geliştirilir. Sabit piksel genişlik/yükseklik yerine `flex`, `grid` ve relative unit'ler tercih edilir.

### 17.2. Accessibility (a11y)

- Tüm interaktif elementler klavye ile erişilebilir olmalı (`tabIndex`, doğru semantik element kullanımı — `<button>` yerine `<div onClick>` kullanılmaz).
- Görsellerde anlamlı `alt` metni, form alanlarında ilişkili `<label>` zorunludur.
- Renk kontrastı WCAG AA seviyesini karşılar; bilgi yalnızca renkle iletilmez (örn. hata durumu hem renk hem ikon/metinle belirtilir).
- shadcn/ui bileşenleri (Radix tabanlı) zaten ARIA uyumludur; özel component'ler yazılırken bu standart korunur.

### 17.3. Dark Mode

Tailwind'in `dark:` varyantı ve shadcn/ui'nin tema sistemi (CSS custom properties) kullanılır; renkler hardcoded hex değer yerine semantik token (`bg-background`, `text-foreground`) ile tanımlanır — bu, tema değişikliğinin tek noktadan yönetilmesini sağlar.

### 17.4. Loading Skeleton

Veri yüklenirken boş ekran veya yalnızca spinner yerine, gerçek içeriğin yapısını yansıtan **skeleton** component'leri kullanılır (bkz. 6.4). Bu, algılanan performansı (perceived performance) artırır ve layout shift'i önler.

### 17.5. Toast

Kullanıcıya anlık, kesintisiz geri bildirim (başarılı kayıt, hata mesajı) toast bileşeni ile verilir; `alert()` gibi tarayıcı native dialog'ları **YASAK**tır (bkz. Bölüm 20).

### 17.6. Dialog

Onay gerektiren yıkıcı aksiyonlar (silme, geri alınamaz işlem) her zaman bir `Dialog`/`AlertDialog` (shadcn/ui) ile teyit alınarak gerçekleştirilir.

### 17.7. Form UX

- Form gönderimi sırasında submit butonu `disabled` + loading göstergesi ile çift gönderimi engeller.
- Validasyon hataları, ilgili alanın hemen altında, spesifik ve aksiyona yönlendirici bir dille gösterilir ("E-posta gerekli" değil, "Geçerli bir e-posta adresi girin").
- Başarılı işlem sonrası kullanıcıya net bir geri bildirim (toast + yönlendirme veya sayfa güncellemesi) verilir.

---

## 18. Definition of Ready

Bir geliştirme görevi, aşağıdaki koşullar sağlanmadan **başlanmaz**:

- [ ] Görev, net ve tek bir amaç ifade ediyor (belirsiz "sistemi iyileştir" gibi talepler değil).
- [ ] Kabul kriterleri (acceptance criteria) yazılı ve ölçülebilir.
- [ ] Etkilenen veri modeli (Prisma schema değişikliği gerekiyorsa) belirlenmiş.
- [ ] UI değişikliği içeriyorsa, tasarım (mockup/wireframe veya en azından net bir davranış tanımı) mevcut.
- [ ] Görev, bu belgedeki mimari ile çelişmiyor; çelişiyorsa önce mimari karar netleştirilmiş.
- [ ] Bağımlı olduğu başka bir görev/PR varsa, o bağımlılık belirlenmiş ve durumu biliniyor.
- [ ] Güvenlik/yetkilendirme etkisi (kim erişebilir, hangi roller) tanımlanmış.

---

## 19. Definition of Done

Bir geliştirme, aşağıdakiler sağlanmadan **tamamlanmış sayılmaz**:

- [ ] Kod, bu belgedeki tüm ilgili kurallara (naming, klasör yapısı, TypeScript strictness) uygun.
- [ ] `any` yok, `console.log` yok, kullanılmayan import/değişken yok.
- [ ] İlgili birim/entegrasyon testleri yazılmış ve geçiyor.
- [ ] `tsc --noEmit`, `eslint` ve `prettier` kontrolleri hatasız geçiyor.
- [ ] Yeni/değişen API veya Server Action, Zod ile hem frontend hem backend'de doğrulanıyor.
- [ ] Yetkilendirme kontrolü (varsa) service katmanında uygulanmış ve test edilmiş.
- [ ] UI değişikliği responsive, dark mode uyumlu ve temel a11y kontrollerinden (klavye erişimi, alt metin) geçmiş.
- [ ] Veritabanı değişikliği varsa migration üretilmiş, test ortamında uygulanmış.
- [ ] Hassas veri (secret, şifre, token) loglanmıyor veya client'a sızmıyor.
- [ ] PR açıklaması eksiksiz (ne/neden/nasıl test edildi) ve en az bir code review onayı almış.
- [ ] Gereksiz yorum satırı, `TODO` (bilet numarası olmadan bırakılmış), debug kodu (`debugger`, geçici `console.log`) kalmamış.

---

## 20. Yasaklar

Aşağıdaki pattern'ler, hiçbir gerekçeyle bu projede kabul edilmez. Code review'da tespit edildiğinde PR **reddedilir**.

| # | Yasak | Neden |
|---|---|---|
| 1 | `any` kullanmak | Tip güvenliğini tamamen devre dışı bırakır (bkz. 4.2) |
| 2 | Production kodunda `console.log` bırakmak | Structured logging yerine geçemez, hassas veri sızıntısı riski taşır (bkz. 16) |
| 3 | Duplicate code (üçten fazla tekrar) | Bakım maliyetini katlar, tutarsızlık riski yaratır (bkz. 1.3) |
| 4 | Inline style (`style={{ }}`) | Tailwind/tema sistemiyle tutarsızlık yaratır, dark mode desteğini kırar |
| 5 | Validasyon atlamak (özellikle backend'de) | Güvenlik açığı — client tarafı validasyon bypass edilebilir (bkz. 9.3, 11.3) |
| 6 | Component/route handler içinden doğrudan `prisma.*` çağırmak | Clean Architecture ihlali; repository/service katmanı atlanır (bkz. 1.1, 8.6) |
| 7 | Büyük, çok sorumluluklu component'ler (200+ satır, birden fazla iş) | SRP ihlali, test edilemezlik (bkz. 13.2) |
| 8 | Gereksiz `"use client"` (tüm sayfayı client yapmak) | Server-first ilkesinin ihlali, gereksiz bundle büyümesi (bkz. 5.1, 5.2) |
| 9 | Hardcoded string (özellikle kullanıcıya gösterilen metin, URL, config değeri) | i18n ve konfigürasyon esnekliğini engeller |
| 10 | Magic number | Okunabilirliği ve bakım kolaylığını düşürür (bkz. 13.5) |
| 11 | Güvenlik kontrollerini atlamak/yorum satırına almak (`// TODO: auth ekle`) | Production'a yetkisiz erişim riskiyle çıkar (bkz. 11) |
| 12 | `$queryRawUnsafe` veya string concatenation ile SQL sorgusu | SQL Injection açığı (bkz. 11.6) |
| 13 | `NEXT_PUBLIC_` prefix'i ile secret/API key expose etmek | Secret'ın istemciye, dolayısıyla herkese açık olması (bkz. 11.8) |
| 14 | Sınırsız (`take` olmadan) `findMany` çağırmak | Büyük veri setinde bellek/performans felaketi (bkz. 7.4, 12.5) |
| 15 | `dangerouslySetInnerHTML` sanitization olmadan kullanmak | XSS açığı (bkz. 11.4) |
| 16 | Non-null assertion (`!`) veya `as any` ile tip sistemini susturmak | Runtime hatalarını derleme zamanından runtime'a öteler (bkz. 4.8) |
| 17 | `alert()`/`confirm()` gibi native dialog kullanmak | Tutarsız UX, stil/tema kontrolü yok (bkz. 17.5) |
| 18 | Migration dosyalarını elle düzenlemek | Migration geçmişi ile gerçek şema arasında sapma yaratır (bkz. 8.2) |
| 19 | Kullanıcıya ham hata mesajı/stack trace göstermek | Bilgi sızıntısı, kötü UX (bkz. 10.4) |
| 20 | Test yazmadan kritik iş mantığını merge etmek | Regresyon riskini denetimsiz bırakır (bkz. 15, 19) |

---

## Kapanış

Bu belge; kod üretim sürecinde tutarlılığı, güvenliği ve sürdürülebilirliği garanti altına almak için tasarlanmış **yaşayan bir standarttır**. Yeni bir teknik karar, mevcut bir kuralla çelişiyorsa, önce bu belge güncellenir, sonra kod yazılır — kural her zaman kodu önceler, tersi değil.

Belgede açıklığa kavuşturulmamış bir durumla karşılaşıldığında, karar Bölüm 1'deki temel felsefe ilkelerine (Clean Architecture, SOLID, DRY, KISS, Separation of Concerns, Composition over Inheritance, Server First) geri dönülerek verilir.
