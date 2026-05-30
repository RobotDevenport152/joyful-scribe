# CLAUDE.md — Pacific Alpacas Project Guide

> This file is the authoritative context document for Claude Code (CLI).
> Read this entire file before touching any code. Every decision here has a reason.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Brand & Design Constraints](#3-brand--design-constraints)
4. [Repository Structure & Conventions](#4-repository-structure--conventions)
5. [Database Schema & Data Modeling](#5-database-schema--data-modeling)
6. [Architecture Patterns](#6-architecture-patterns)
7. [Engineering Principles](#7-engineering-principles)
8. [State Management](#8-state-management)
9. [Routing & Page Architecture](#9-routing--page-architecture)
10. [Component Design](#10-component-design)
11. [Forms & Validation](#11-forms--validation)
12. [Internationalization](#12-internationalization)
13. [Backend & API Layer (Supabase)](#13-backend--api-layer-supabase)
14. [Security](#14-security)
15. [TypeScript Standards](#15-typescript-standards)
16. [Testing Standards](#16-testing-standards)
17. [Performance](#17-performance)
18. [Known Bugs — Fix Before Adding Features](#18-known-bugs--fix-before-adding-features)
19. [Incomplete Features](#19-incomplete-features)
20. [Known Technical Debt](#20-known-technical-debt)
21. [Product Data Flow](#21-product-data-flow)
22. [Development Workflow](#22-development-workflow)
23. [Migration Path (Supabase → Self-Hosted VPS)](#23-migration-path-supabase--self-hosted-vps)
24. [How to Use This File with Claude Code](#24-how-to-use-this-file-with-claude-code)

---

## 1. Project Overview

**Product:** Pacific Alpacas (太平洋羊驼) — luxury alpaca fiber e-commerce platform
**Owner:** Eric Geng, Cromwell, New Zealand
**Primary Market:** Chinese high-net-worth consumers (中国高净值消费者)
**Secondary:** NZ local consumers + Grower (farmer) portal

**Business context that drives every architecture decision:**
- Eric's real competitive advantage is supply chain control (800+ NZ farms, 93% NZ market share)
- The website's job is to translate that B2B advantage into C2C trust and purchase conversion
- Chinese consumers need: CGTN media coverage, Hurun awards, NZ Made certification, traceability — not just pretty UI
- Growers need a separate portal to track fiber batches and Credit balances — completely different UX from consumers

**Features:**
- Product catalogue with bilingual copy, variants, and multi-currency pricing
- Fiber traceability — QR-scannable batch codes linking products to specific NZ farms
- Grower portal — authenticated dashboard for NZ farmers to view batches and credit balances
- Admin panel — full back-office (products, orders, growers, fiber batches, promos)
- AI chat assistant — in-page product/brand Q&A powered by a Supabase Edge Function
- Sleep quiz — interactive product recommender tracked for conversion analytics

**Non-goals:**
- This is a SPA, not a server-rendered app. SEO is handled via `<SEOHead>` + JSON-LD, not SSR.
- No native mobile app. The web app is mobile-responsive.
- No custom auth server. Supabase Auth handles all identity concerns.

---

## 2. Tech Stack

```
Frontend:   React 18 + Vite + TypeScript
Styling:    Tailwind CSS + shadcn/ui components
State:      React Query (server state) + Zustand (client state, legacy)
Backend:    Supabase (PostgreSQL + Auth + Storage + Edge Functions)
Payments:   Stripe Checkout + webhook
i18n:       Custom translations in src/lib/i18n.ts (zh/en)
Currency:   NZD / CNY / USD with live rates via useExchangeRates hook
Testing:    Vitest (unit) + Playwright (E2E)
Animation:  Framer Motion
Forms:      React Hook Form + Zod
```

**Fonts:** Cormorant Garamond (display/headings) + Inter (body)
**Brand colors:** gold `hsl(35 60% 50%)`, cream `hsl(40 30% 95%)`, navy `hsl(220 25% 15%)`

---

## 3. Brand & Design Constraints

**Never change:**
- Font stack: Cormorant Garamond for display, Inter for body
- Brand gold: `hsl(35 60% 50%)` — used for CTAs, prices, highlights
- Product line names: Cloud of Dreams / DEEP SLEEP / SPACE DESIGN
- Product tiers: classic / luxury / premium / cloud_of_dreams

**Marketing copy source of truth:**
- Scientific claims (螨虫趋避率64.37%, 保暖3倍于羊毛, 深睡眠+25%) come from brand handbook. Do not modify.
- Certification numbers: FernMark No.101008, IAA Cert. 02-041 — do not change.
- Tagline: "Luxury for Generations" (EN) / "世代的奢侈品" (ZH)

---

## 4. Repository Structure & Conventions

```
src/
├── components/
│   ├── ui/              shadcn/ui primitives — do NOT modify directly; add wrappers
│   ├── layout/          Navbar.tsx, Footer.tsx, PublicLayout
│   ├── home/            HeroSection, FiberSection, ProcessSection,
│   │                    CertificationsSection, AuthorityBanner,
│   │                    SleepScienceSection, BrandHeritageSection,
│   │                    MediaCoverageSection, GrowerNetworkSection
│   ├── cart/            CartDrawer.tsx
│   ├── chat/            ChatWidget.tsx (AI customer service)
│   ├── shop/            SleepQuizDialog.tsx
│   ├── storefront/      CrossSell, LiveInventory, ProductJsonLd
│   └── traceability/    CertificationBadges, ProductTraceability
├── pages/
│   ├── Index.tsx        Homepage — CURRENTLY INCOMPLETE (see §19)
│   ├── Shop.tsx         Product catalog with search/filter/sort
│   ├── ProductDetail.tsx
│   ├── Checkout.tsx     3-step: info → payment → confirm
│   ├── OrderSuccess.tsx
│   ├── Traceability.tsx Fiber batch lookup by QR code
│   ├── ChinaLanding.tsx Chinese market landing page
│   ├── GrowerDashboard.tsx
│   ├── GrowerBatches.tsx
│   ├── GrowerCredits.tsx  ⚠️ USES MOCK DATA — needs real API
│   ├── GrowersInfo.tsx
│   ├── Compare.tsx
│   ├── Contact.tsx
│   ├── Wholesale.tsx
│   ├── Returns.tsx
│   ├── AuthPage / Login / Register / ForgotPassword / ResetPassword
│   └── admin/
│       ├── AdminLayout.tsx
│       ├── AdminDashboard.tsx  ⚠️ wrong field name: total_nzd should be total
│       ├── AdminOrders.tsx
│       ├── AdminProducts.tsx
│       ├── AdminGrowers.tsx
│       ├── AdminFiberBatches.tsx
│       └── AdminPromos.tsx
├── contexts/
│   ├── AppContext.tsx    locale, t (translations), recentlyViewed
│   └── CartContext.tsx   cart, currency, promo, fp (format price)
├── hooks/               Custom hooks; file named use<Feature>.ts
├── lib/
│   ├── i18n.ts          All zh/en translations (single source)
│   ├── schemas.ts       Zod schemas: checkoutSchema, contactSchema
│   ├── store.ts         Types + LEGACY hardcoded product array
│   └── utils.ts
├── stores/              Zustand stores (legacy — see §20)
├── integrations/supabase/
│   ├── client.ts        Singleton — import this everywhere
│   └── types.ts         Auto-generated DB types — USE THESE, not any[]
└── supabase/
    ├── functions/
    │   ├── create-checkout/index.ts   Stripe payment + order creation
    │   └── chat/index.ts              AI customer service proxy
    └── migrations/                    PostgreSQL schema
```

### Naming rules

| Type | Convention | Example |
|---|---|---|
| React component file | PascalCase | `ProductDetailPage.tsx` |
| Hook file | `use` prefix + camelCase | `useProducts.ts` |
| Utility / lib file | camelCase | `formatPrice.ts` |
| Supabase migration | timestamp prefix | `20260328220859_init_schema.sql` |
| Edge function folder | kebab-case | `create-checkout/` |
| Context | PascalCase + `Context` suffix | `AppContext.tsx` |
| Store (Zustand) | camelCase + `Store` suffix | `cartStore.ts` |

---

## 5. Database Schema & Data Modeling

### Core tables

| Table | Purpose |
|---|---|
| `products` | Product catalog. Fields: id, name_zh, name_en, slug, category, tier, price_nzd, stock_quantity, images (jsonb), certifications (jsonb), fiber_batch_id |
| `orders` | Customer orders. Fields: id, order_number, user_id, status, total (NOT total_nzd), shipping_name, shipping_email, items (jsonb), promo_code |
| `order_items` | Line items per order |
| `growers` | Alpaca farm profiles. Fields: id, farm_name, owner_name, region, user_id (FK to auth.users), credit_balance |
| `fiber_batches` | Fiber traceability. Fields: id, batch_code, grower_id, processing_status (raw→scoured→combed→ready) |
| `grower_transactions` | Credit ledger for growers |
| `promo_codes` | Dynamic promo codes (replaces hardcoded PROMO_CODES in Edge Function) |
| `processed_webhook_events` | Idempotency log for Stripe webhooks |
| `user_roles` | RBAC: roles are 'admin', 'grower', 'customer' |

### Critical field names (do NOT guess — check types.ts)

- `orders.total` — NOT `orders.total_nzd`
- `orders.shipping_name`, `orders.shipping_email` — NOT `customer_name`, `customer_email`
- `products.stock_quantity` — NOT `stock`
- `fiber_batches.processing_status` values: `'raw' | 'scoured' | 'combed' | 'ready'`

### Entity relationships

```
auth.users (Supabase managed)
    │
    ├── user_roles (role: admin | grower | customer)
    │
    └── orders (user_id FK, optional — guest checkout supported)

growers
    │
    ├── fiber_batches (grower_id FK)
    │       │
    │       └── products (fiber_batch_id FK) — traceability link
    │
    └── grower_transactions (grower_id FK) → updates grower.credit_balance (via trigger)

products
    └── orders.items (JSONB snapshot — see data modeling principles below)

promo_codes (standalone)
sleep_assessments (standalone, session-scoped)
```

### Data modeling principles

1. **Prices are always stored in NZD.** `price_nzd` is the single source of truth. Display conversions happen at render time using live or cached exchange rates. Never store converted prices in DB.

2. **Order items are snapshotted.** `orders.items` is a JSONB snapshot of the cart at checkout time (product name, price, variant, quantity). Product edits never corrupt historical order data.

3. **Bilingual fields are stored separately.** Use `name_en` / `name_zh` columns rather than a translations join table. Select based on locale at the hook level, not in SQL.

4. **Grower balances are derived from transactions.** Never update `grower.credit_balance` directly. Always insert a `grower_transactions` row; the `update_grower_balance` database trigger maintains the balance. This gives a full audit trail.

5. **Stock decrements are triggered server-side.** When `orders.status` is set to `'paid'`, the `decrement_stock` trigger fires automatically. Client code must not decrement stock manually.

### Adding a new table

1. Create a timestamped migration file in `supabase/migrations/`.
2. Enable RLS immediately: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
3. Define policies before any data insert (see §14).
4. Run `supabase gen types typescript` and commit the updated `src/integrations/supabase/types.ts`.
5. Add a hook in `src/hooks/use<Table>.ts` wrapping the Supabase query.

---

## 6. Architecture Patterns

This project uses **three patterns in combination** (from Mark Richards' *Software Architecture Patterns*). Every file you write must fit into this structure.

### 6.1 Layered Architecture — internal structure of each service

All layers are **Closed** (requests flow strictly downward):

```
Presentation Layer    React components and pages — render only, no SQL
       ↓
Business Layer        Services and hooks — business logic, calculations
       ↓
Persistence Layer     Repositories — all Supabase/DB calls live here
       ↓
Database Layer        PostgreSQL via Supabase client
```

**Layers of Isolation rule:** A change in one layer must NOT require changes in other layers. If you find yourself importing `supabase` directly inside a React component, you are violating this rule. Put the query in a repository, expose it through a hook.

**Architecture Sinkhole Anti-Pattern** (what to AVOID): A request that passes through all layers with zero logic in any of them. If AdminDashboard calls supabase directly and just displays the raw result, it is a sinkhole. Add business logic in the service layer (e.g., compute daily revenue, classify low stock).

In practice, the layers map to these directories:

| Layer | Responsibility | Location |
|---|---|---|
| **Pages** | Route-level composition; owns data fetching initiation | `src/pages/` |
| **Components** | UI rendering; receives props; no direct DB calls | `src/components/` |
| **Hooks** | Encapsulate data fetching, auth, and side effects | `src/hooks/` |
| **Contexts** | Cross-cutting shared state (locale, cart) | `src/contexts/` |
| **Lib** | Pure utilities, constants, schemas, translations | `src/lib/` |
| **Integrations** | Supabase client and generated types | `src/integrations/supabase/` |
| **Edge Functions** | Server-side logic that requires secret keys | `supabase/functions/` |

### 6.2 Event-Driven Architecture (Broker Topology) — for async workflows

Use this for: Stripe payment confirmation → order fulfillment → notifications.

**Broker Topology:** Each event processor does one job and emits a new event. No central orchestrator.

```
stripe.checkout.session.completed
  → ValidateWebhookProcessor  (verify Stripe signature)
  → CreateOrderProcessor      (write to DB — atomic transaction with inventory)
  → DeductInventoryProcessor  (part of same DB transaction as above)
  → NotificationProcessor     (BullMQ async — send email, update grower credit)
```

**Critical constraint:** Maintain a single transactional unit of work for steps that cannot be separated. Order creation + inventory deduction = one PostgreSQL transaction. Email sending = separate async event (BullMQ).

### 6.3 Microservices — service component boundaries

Service components are defined by **business capability**, not technical function.

| Service Component | Owns |
|---|---|
| Storefront | Product catalog, cart, checkout, payment initiation |
| Fulfillment | Order lifecycle, inventory, shipping tracking |
| Grower Portal | Fiber batches, credit accounts, collection points |
| Admin | Product CRUD, order management, promo codes, dashboard |

**Granularity rule:** If your UI layer must orchestrate calls to 3 services to show one page, your services are too fine-grained. A service component owns a full business capability end-to-end.

**Avoid inter-service calls:** If Storefront needs Grower data, query the shared PostgreSQL database directly — do NOT call the Grower Portal service API.

---

## 7. Engineering Principles — apply to every file you write

### 7.1 Configuration Management (12-Factor App — Factor III)

Never hardcode business configuration. Use environment variables or database config tables.

```typescript
// ❌ NEVER
const SHIPPING_THRESHOLD = 500;
const PROMO_CODES = { WELCOME10: { discount: 10 } };

// ✅ ALWAYS
const threshold = AppConfig.business.freeShippingThresholdNZD; // from env
// Promo codes → query promo_codes table, not hardcoded constants
```

### 7.2 Single Responsibility Principle (SRP)

Each file does exactly one thing. A React component renders. A service computes. A repository queries.

```typescript
// ❌ NEVER — God Component
const AdminDashboard = () => {
  const { data } = await supabase.from('orders').select('*'); // DB in UI
  const revenue = data.reduce((s, o) => s + o.total, 0);     // Logic in UI
  return <div>{revenue}</div>;
};

// ✅ ALWAYS — each layer in its place
// repository: orderRepository.getTodayOrders()
// service:    dashboardService.computeStats(orders)
// hook:       useDashboardStats() — composes the two
// component:  <StatsCard stats={stats} /> — renders only
```

### 7.3 Type Safety — no `any[]`

Always use the auto-generated Supabase types from `src/integrations/supabase/types.ts`.

```typescript
import type { Tables } from '@/integrations/supabase/types';
type Order = Tables<'orders'>;      // use this
type Product = Tables<'products'>;  // use this

// ❌ NEVER
const [orders, setOrders] = useState<any[]>([]);

// ✅ ALWAYS
const [orders, setOrders] = useState<Order[]>([]);
```

### 7.4 Single Source of Truth (DRY)

`src/lib/store.ts` contains a legacy hardcoded `products` array. It is kept ONLY for backward compatibility. **Do not add to it.** All new product data comes from Supabase via `useProducts` hook. The canonical product type is `Tables<'products'>` converted by `dbToLegacyProduct()`.

Currency conversion: ONE place only — `src/hooks/useExchangeRates.ts`. Never hardcode `4.5` or `0.6` in component code.

### 7.5 Dependency Inversion Principle (DIP)

Components depend on abstractions (hooks and repositories), never on concrete infrastructure (supabase client).

```typescript
// ❌ NEVER import supabase inside a component or page
import { supabase } from '@/integrations/supabase/client';

// ✅ ALWAYS use a hook that wraps the repository
const { data: grower } = useGrower(userId);
```

Exception: `src/repositories/` files are the ONLY place where supabase is imported.

### 7.6 Idempotency + Transaction Management

The Stripe webhook is the authoritative trigger for order creation — NOT the checkout button.

Order creation flow:
1. User clicks "Place Order" → Stripe Checkout session created (no order in DB yet)
2. Stripe sends `checkout.session.completed` webhook
3. Webhook handler creates order + deducts inventory in ONE PostgreSQL transaction
4. Idempotency check: `processed_webhook_events` table prevents double-processing

### 7.7 Observability (Structured Logging)

Every error must be logged with context. Use `src/lib/logger.ts` (create if not exists).

```typescript
// ❌ NEVER
console.error('Checkout error:', err);

// ✅ ALWAYS
logger.error('checkout_failed', {
  correlationId,
  userId: user?.id,
  cartSize: cart.length,
  error: err,
});
```

---

## 8. State Management

The app uses a three-tier state strategy. Match the tier to the scope and lifetime of the data.

### Tier 1 — Server state (TanStack React Query)

Use for all data that lives in the database.

```typescript
// hooks/useProducts.ts — canonical pattern
export function useProducts(category?: string) {
  return useQuery({
    queryKey: ['products', category],
    queryFn: () => fetchProducts(category),
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 30 * 60 * 1000,     // 30 minutes
  });
}
```

Rules:
- Query key arrays must be hierarchical: `['resource', filter, subfilter]`
- Mutations must call `queryClient.invalidateQueries` on success with the affected key prefix
- Never put server state in React Context or Zustand

### Tier 2 — Client shared state (React Context)

Use for cross-component state that is not from the database.

| Context | Owns | Persisted |
|---|---|---|
| `AppContext` | locale, translations, recentlyViewed | `localStorage` (`pa-locale`) |
| `CartContext` | cart items, currency, promo code | `localStorage` (`pa-cart-v1`, `pa-currency-v1`) |

Rules:
- `CartProvider` is nested inside `AppProvider` to prevent cart re-renders on locale change
- Do not put async data (DB queries) inside Context — use React Query for that
- Context values must be memoized with `useMemo` to prevent unnecessary re-renders

### Tier 3 — Local UI state (useState / useReducer)

Use for component-internal state: open/closed modals, form steps, hover states.

### Legacy Zustand stores (`src/stores/`)

⚠️ `cartStore.ts` and `uiStore.ts` exist for backward compatibility. Do not add new features to them. New state must use Context (shared) or React Query (server).

**Critical:** `cartStore.ts` stores actual per-currency DB prices (`price_nzd`, `price_cny`, `price_usd`). `CartContext` uses `Math.round(nzd * 4.5)` rate conversion — the bug `cartStore` was built to fix. **Do NOT remove `cartStore` until `CartContext` is updated to also use DB prices.**

---

## 9. Routing & Page Architecture

### Route map

All public and auth-required routes share `PublicLayout` (Navbar + CartDrawer shell). Admin routes use their own isolated `AdminLayout`.

```
PublicLayout (Navbar + CartDrawer)
├── /                    → Index.tsx
├── /shop                → Shop.tsx
├── /product/:id         → ProductDetail.tsx
├── /traceability        → Traceability.tsx
├── /contact             → Contact.tsx
├── /growers-info        → GrowersInfo.tsx
├── /wholesale           → Wholesale.tsx
├── /china               → ChinaLanding.tsx
├── /compare             → Compare.tsx
├── /returns             → Returns.tsx
├── /login               → Login.tsx
├── /register            → Register.tsx
├── /forgot-password     → ForgotPassword.tsx
├── /reset-password      → ResetPassword.tsx
├── /checkout            → ProtectedRoute → Checkout.tsx
├── /order-success       → ProtectedRoute → OrderSuccess.tsx
├── /my-orders           → ProtectedRoute → MyOrders.tsx
├── /grower/batches      → ProtectedRoute(grower) → GrowerBatches.tsx
└── /grower/credits      → ProtectedRoute(grower) → GrowerCredits.tsx

ProtectedRoute(admin) → AdminLayout
├── /admin               → AdminDashboard.tsx
├── /admin/products      → AdminProducts.tsx
├── /admin/orders        → AdminOrders.tsx
├── /admin/growers       → AdminGrowers.tsx
├── /admin/fiber-batches → AdminFiberBatches.tsx
└── /admin/promos        → AdminPromos.tsx
```

### Page responsibilities

A page component **should**:
- Initiate data fetching (call hooks at the top level)
- Handle loading and error states
- Compose components with data as props
- Own the `<SEOHead>` for that route
- Stay under ~50 lines of JSX

A page component **should not**:
- Implement complex UI logic inline — extract to a named component
- Call `supabase` directly — use a hook

### Admin layout isolation

The `/admin` subtree uses `AdminLayout` (no `Navbar`/`Footer`) and is completely independent from `PublicLayout`. Admin and storefront can evolve separately.

---

## 10. Component Design

### Hierarchy

```
Page
└── Feature component (e.g., ProductCard)
    └── Primitive (shadcn/ui: Button, Card, Dialog, etc.)
```

### Rules

- **No component should fetch its own data.** Data comes from props passed by the page or a shared hook.
- **shadcn/ui components in `src/components/ui/` must not be modified.** They are generated and will be overwritten. Add wrappers instead.
- **Prefer composition over configuration.** A `<ProductCard>` that accepts a `footer` slot is better than a `<ProductCard showBuyButton={boolean} showWishlist={boolean} />`.
- **Keep component files under 200 lines.** If a component grows past that, split out sub-components into the same directory.
- Components used in more than one section belong in `src/components/storefront/` or `src/components/shop/`. Section-specific components live inside `src/components/home/`.

### Animation

Use Framer Motion for all transitions. Do not use CSS `transition` or `animation` for complex sequences.

```tsx
// Standard fade-in pattern
<motion.div
  initial={{ opacity: 0, y: 16 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  viewport={{ once: true }}
>
```

---

## 11. Forms & Validation

All forms use **React Hook Form** + **Zod**. All schemas live in `src/lib/schemas.ts`.

```typescript
// 1. Define schema in lib/schemas.ts
export const checkoutSchema = z.object({
  name: z.string().min(2, t.errors.nameRequired),
  email: z.string().email(t.errors.invalidEmail),
});
export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// 2. Use in component
const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>({
  resolver: zodResolver(checkoutSchema),
});
```

Rules:
- Validation schemas must live in `lib/schemas.ts`, not inline in components
- Error messages must be bilingual — pass translated strings from `t` when constructing the schema
- Server-side validation in Edge Functions must mirror client-side schema rules
- Never disable form validation; add `.optional()` or `.nullable()` to the schema instead

---

## 12. Internationalization

### Architecture

Two locales: `en` (English) and `zh` (Simplified Chinese). Locale is user-selectable and persisted to `localStorage` under key `pa-locale`.

**Translation strings** live in `src/lib/i18n.ts` as a typed nested object:

```typescript
const translations = {
  en: { nav: { home: 'Home', shop: 'Shop', ... }, ... },
  zh: { nav: { home: '首页', shop: '商城', ... }, ... },
};
```

**Access via AppContext** (fully typed — TypeScript will catch missing keys):

```typescript
const { t, locale, setLocale } = useApp();
// t.nav.home, t.checkout.total — all type-safe
```

### Rules

1. **All user-visible strings must be translated.** No hardcoded English or Chinese strings in components.

   ```typescript
   // ❌ NEVER
   <h1>新西兰最大羊驼品牌</h1>

   // ✅ ALWAYS
   const { t } = useApp();
   <h1>{t.hero.title}</h1>
   // Add key to src/lib/i18n.ts for both 'en' and 'zh'
   ```

2. **Bilingual DB fields are fetched separately** (`name_en`, `name_zh`). Select based on locale at the component or hook level, not in SQL.

3. **Dates and numbers** must use locale-aware formatters:
   - Prices: use `formatPrice(amount, currency)` from `lib/store.ts`
   - Dates: use `Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-NZ')`

4. **Do not use react-i18next's `t()` function** for new code. The typed `t` object from AppContext is preferred for compile-time safety.

5. When adding a new translation key, add it to **both** `translations.en` and `translations.zh` in the same commit.

**Exception:** `ChinaLanding.tsx` is Chinese-only by design — hardcoded Chinese is acceptable there.

---

## 13. Backend & API Layer (Supabase)

### Client singleton

Always import from `src/integrations/supabase/client.ts`. Never create a second Supabase client instance.

```typescript
import { supabase } from '@/integrations/supabase/client';
```

### Query conventions

```typescript
// Always handle error before using data
const { data, error } = await supabase
  .from('orders')
  .select('id, total, status, created_at')  // select only needed columns
  .order('created_at', { ascending: false });
if (error) throw error;
```

- Select only the columns you need (avoid `select('*')` in hot paths)
- Use `.single()` only when you are certain one row exists; otherwise use `.maybeSingle()`
- Wrap Supabase calls in try/catch or propagate to React Query's error boundary
- RLS handles user-scoping automatically — do not add manual `user_id` filters when RLS policies already scope by `auth.uid()`

### Edge Functions

Use Edge Functions for operations that require secret API keys (Stripe, OpenAI), server-side promo code validation, or webhook receivers. They live in `supabase/functions/<name>/index.ts` (Deno runtime). Secrets must only appear here, never in Vite config.

**Call pattern from the client:**

```typescript
const { data, error } = await supabase.functions.invoke('create-checkout', {
  body: { items, promoCode, shippingAddress },
});
```

### Migrations

- Migrations are **append-only**. Never edit a migration file after it has been merged.
- Each migration must be self-contained and idempotent where possible (`CREATE TABLE IF NOT EXISTS`).
- Destructive schema changes (drop column, rename) require a dedicated migration with a comment explaining the reason.
- After any schema change: `npx supabase gen types typescript --local > src/integrations/supabase/types.ts`

---

## 14. Security

### Deployment checklist

Before ANY deployment, verify:

- [ ] Stripe webhook handler verifies `stripe-signature` header with `stripe.webhooks.constructEvent()`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is in Supabase Vault secrets, not env vars
- [ ] `promo_codes` table is used instead of hardcoded PROMO_CODES object in Edge Function
- [ ] All DB queries use parameterized queries (Supabase client handles this — do NOT use raw SQL string concatenation)
- [ ] `/admin` routes protected by `<ProtectedRoute requiredRole="admin">`
- [ ] `/grower/*` routes protected by `<ProtectedRoute requiredRole="grower">`
- [ ] Nginx rate limiting configured for `/api/checkout` and `/api/auth/*`
- [ ] `Content-Security-Policy` header set
- [ ] PostgreSQL only accessible from application server (not public internet)

### Row-Level Security (RLS)

RLS is the primary access control mechanism. Every table must have RLS enabled and explicit policies.

**Policy matrix:**

| Table | Public read | Auth user read | Own row | Admin full |
|---|---|---|---|---|
| products | ✓ (is_active) | — | — | ✓ |
| orders | — | Own orders | — | ✓ |
| growers | ✓ | — | ✓ (self-update) | ✓ |
| fiber_batches | ✓ | — | — | ✓ |
| grower_transactions | — | Own grower | — | ✓ |
| promo_codes | ✓ (is_active) | — | — | ✓ |
| sleep_assessments | — | Insert only | — | ✓ |
| user_roles | — | — | — | ✓ |

**Admin check pattern** (used in policies):

```sql
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = _role
  )
$$;
```

### Client-side security rules

- **Never trust client-supplied user IDs.** Use `auth.uid()` in RLS policies, not a user_id from the request body.
- **Promo code validation must happen server-side** (Edge Function). The `PROMO_CODES` constant in `lib/store.ts` is for UI feedback only.
- **Admin routes must have two layers of protection:** frontend route guard AND RLS policies. The frontend guard is UX; RLS is security.
- Do not log `session.access_token` or user PII to the browser console.

### Environment variables

- All Supabase keys exposed to the client must be `VITE_` prefixed (Vite build-time injection).
- `VITE_SUPABASE_PUBLISHABLE_KEY` is safe to expose — it is the anonymous key scoped by RLS.
- Secret keys (Stripe, OpenAI) must only exist in Supabase Edge Function environment variables.
- `.env` must remain in `.gitignore`. Provide `.env.example` with placeholder values.

---

## 15. TypeScript Standards

### Current state

TypeScript is configured with `strict: false` and `noImplicitAny: false`. This is technical debt (see §20). New code must be written as if strict mode is enabled.

### Rules for new code

1. **No `any`.** Use `unknown` and narrow with type guards, or use the generated Supabase types.
2. **Use generated types** from `src/integrations/supabase/types.ts` for all DB row shapes. Do not redefine them.
3. **Discriminated unions** for state with multiple shapes:
   ```typescript
   type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
   ```
4. **Prop interfaces** must be defined above the component, not inline:
   ```typescript
   interface ProductCardProps {
     product: Product;
     onAddToCart: (id: string) => void;
   }
   ```
5. **Avoid type assertions** (`as SomeType`). If you need one, it is a signal the data flow needs fixing.

### `dbToLegacyProduct` adapter

`dbToLegacyProduct()` in `lib/store.ts` converts DB types to the legacy `Product` interface used by components. When adding new product fields to the DB schema, add the mapping here too. Long-term goal: phase out the legacy interface and use DB types directly (see §20).

---

## 16. Testing Standards

### Test pyramid

```
         ▲  E2E (Playwright)
        ╱╲  Critical user journeys only
       ╱──╲
      ╱    ╲  Integration tests (Vitest + RTL)
     ╱ ████ ╲  Component + hook behavior with mocked Supabase
    ╱────────╲
   ╱          ╲  Unit tests (Vitest)
  ╱ ██████████ ╲  Pure functions: formatPrice, schemas, utils
 ▔▔▔▔▔▔▔▔▔▔▔▔▔▔
```

### Test file locations

```
src/test/
├── repositories/     unit tests — mock supabase
├── services/         unit tests — pure functions
└── e2e/              Playwright tests
    ├── checkout.spec.ts
    ├── grower-portal.spec.ts
    └── admin.spec.ts
```

### Unit tests

Target `src/lib/` functions — `formatPrice`, `formatNZD`, Zod schema validation, utility functions. These have no dependencies and are fast.

### Component / integration tests

Use `@testing-library/react`. Mock Supabase at the module level:

```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(), auth: { getUser: vi.fn() } }
}));
```

Test what the user sees, not implementation details.

### E2E tests (Playwright)

Cover only the critical paths where bugs cause revenue loss:
1. Add product to cart → proceed to checkout
2. Apply promo code → verify discount
3. Login → view own orders
4. Grower login → view batches and credits
5. Scan batch code (`/trace/PA-XXXX-NNN`) → see farm story

Do not write E2E tests for admin screens unless there is a history of breakage.

### Running tests

```bash
npm run test           # Vitest one-shot
npm run test:watch     # Vitest watch mode
npx playwright test    # E2E (requires dev server running)
```

---

## 17. Performance

### React Query caching

Default cache settings (do not override without reason):
- `staleTime: 5 * 60 * 1000` (5 min) — product catalogue changes infrequently
- `gcTime: 30 * 60 * 1000` (30 min) — keep cache warm between page navigations

For admin mutations (product edits, order status updates), invalidate the relevant query immediately on success.

### Image optimization

- All images served from Supabase Storage must use the Supabase transform API: append `?width=800&quality=80` to the URL.
- Hero images: use `loading="lazy"` unless above the fold.
- Always set `width` and `height` attributes on `<img>` to prevent layout shift (CLS).

### Bundle size

- Avoid importing entire libraries when tree-shakeable subpaths exist.
- `lodash` is not in the dependency list — keep it that way; use native array/object methods.
- Large third-party widgets (chat, payment form) should be loaded with `React.lazy()` and `<Suspense>`.

### Code splitting

Routes are already split by page via React Router. Admin pages should additionally use `React.lazy()` since they are never visited by customers:

```typescript
const AdminDashboard = React.lazy(() => import('./admin/AdminDashboard'));
```

---

## 18. Known Bugs — Fix Before Adding Features

These are production-blocking issues. Do NOT work around them; fix the root cause.

| # | Severity | File | Issue | Fix |
|---|---|---|---|---|
| 1 | P0 | `stripe-webhook` | No Stripe signature verification | Add `stripe.webhooks.constructEvent()` |
| 2 | P0 | `create-checkout` | Order created before Stripe confirms | Move order creation to webhook handler |
| 3 | P0 | `GrowerDashboard.tsx` | `.eq('owner_name', user.email)` — wrong field | Use `.eq('user_id', user.id)` |
| 4 | P0 | `chat/index.ts` | Uses `LOVABLE_API_KEY` + Lovable gateway | Replace with direct Anthropic/OpenAI API call |
| 5 | P1 | `AdminDashboard.tsx` | `o.total_nzd` — field doesn't exist | Use `o.total` |
| 6 | P1 | `AdminDashboard.tsx` | Monthly chart uses only last 10 orders | Separate monthly query with date range |
| 7 | P1 | `GrowerCredits.tsx` | `MOCK_TRANSACTIONS` + hardcoded balance | Replace with `useGrowerCredits(userId)` hook |
| 8 | P1 | `useProducts.ts` | Hardcoded `nzd * 4.5` currency conversion | Use `useExchangeRates` hook |
| 9 | P1 | `Index.tsx` | Homepage only renders HeroSection | Assemble all home/* section components |
| 10 | P2 | `Traceability.tsx` | `STATUS_MAP` missing `felted` and `sterilized` | Add all 6 processing steps |
| 11 | P2 | Multiple | Duplicate component files (root + subdirectory) | Remove root-level duplicates, use subdirectory versions |

---

## 19. Incomplete Features

### 19.1 Homepage (Index.tsx) — PRIORITY

The homepage currently only renders `<HeroSection />`. All the other home section components exist but are not wired up.

Correct assembly order:
```tsx
<HeroSection />           // video background, hero CTA
<AuthorityBanner />       // CGTN, Hurun award, FernMark, IAA — trust signals FIRST
<SleepScienceSection />   // 64.37% anti-mite, 32-34°C, 25% deep sleep — data-driven conversion
<FiberSection />          // why alpaca fiber (6 properties)
<ProcessSection />        // 6-step manufacturing process with traceability link
<CertificationsSection /> // 5 certificates (NZ Made, NZ Grown, IAA, FernMark, CNAS)
<BrandHeritageSection />  // 2001 founding, 800 farms, Eric Geng story
<MediaCoverageSection />  // newspaper clippings, CGTN screenshot
<GrowerNetworkSection />  // farm map, grower count
```

**Design principle:** Authority signals (CGTN, awards, certificates) must appear before product showcases. Chinese consumers validate brand legitimacy BEFORE looking at products.

### 19.2 Stripe Webhook Handler

Create `supabase/functions/stripe-webhook/index.ts` with:
- Signature verification (P0 security fix)
- Idempotency check against `processed_webhook_events`
- Atomic transaction: `fulfill_order` PostgreSQL RPC that creates order + deducts stock in one transaction
- Event emission to BullMQ (when migrated off Supabase) for email notification

### 19.3 GrowerCredits Real Data

Replace mock data with:
```typescript
// src/hooks/useGrowerCredits.ts
export function useGrowerCredits(growerId: string) {
  return useQuery({
    queryKey: ['grower-credits', growerId],
    queryFn: async () => {
      const [balanceRes, txRes] = await Promise.all([
        supabase.from('growers').select('credit_balance').eq('id', growerId).single(),
        supabase.from('grower_transactions').select('*').eq('grower_id', growerId)
          .order('created_at', { ascending: false }),
      ]);
      return { balance: balanceRes.data?.credit_balance ?? 0, transactions: txRes.data ?? [] };
    },
  });
}
```

---

## 20. Known Technical Debt

| Item | Location | Priority | Notes |
|---|---|---|---|
| Enable TypeScript strict mode | `tsconfig.app.json` | High | `noImplicitAny: true, strict: true` — fix type errors incrementally |
| Migrate `uiStore.ts` to AppContext | `src/stores/uiStore.ts` | Medium | Language and mobile menu state should live in AppContext |
| Evaluate `cartStore.ts` vs `CartContext` | `src/stores/`, `src/contexts/CartContext.tsx` | **High** | ⚠️ `cartStore` stores actual per-currency DB prices; `CartContext` uses `Math.round(nzd * 4.5)`. **Do NOT remove `cartStore` until `CartContext` uses DB prices.** |
| Phase out `dbToLegacyProduct` adapter | `src/lib/store.ts` | Medium | Components should consume Supabase DB types directly |
| Move promo code validation server-side | `lib/store.ts` + Edge Function | High | Client-side `PROMO_CODES` constant is only for UI feedback; actual validation must be in `create-checkout` Edge Function |
| Add `.env.example` | repo root | Low | New developers need a template with placeholder values |
| Playwright coverage for checkout flow | `supabase/functions/create-checkout` | Medium | No E2E tests cover the payment path |
| Exchange rate staleness | `hooks/useExchangeRates.ts` | Low | Hardcoded fallback rates (CNY 4.5, USD 0.6) should be refreshed from a live API |

---

## 21. Product Data Flow

```
Supabase products table
        ↓
useProducts() hook (React Query, staleTime: 5min)
        ↓
dbToLegacyProduct() mapper in src/hooks/useProducts.ts
        ↓
Legacy Product interface (src/lib/store.ts)
        ↓
React components (Shop, ProductDetail, CartDrawer, etc.)
```

**Do NOT bypass this chain.** Do not import from `store.ts` products array for anything that should come from the database.

Currency pricing rule: `product.prices.NZD` is the source of truth. CNY and USD are always derived via `useExchangeRates` rates at display time. Never store converted prices in DB.

---

## 22. Development Workflow

### Environment setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

# 3. Start dev server (port 8080)
npm run dev

# 4. (Optional) Start local Supabase stack
npx supabase start
```

### Branch strategy

| Branch | Purpose |
|---|---|
| `main` | Production — requires PR + review |
| `dev` | Integration branch — daily work merges here |
| `feat/<name>` | Feature branches (from `dev`) |
| `fix/<name>` | Bug fix branches (from `dev` or `main` for hotfixes) |

### Before opening a PR

- [ ] `npm run lint` passes with no errors
- [ ] `npm run test` passes
- [ ] No new `any` types introduced
- [ ] New UI text has translations in both `en` and `zh`
- [ ] Any new DB table has RLS enabled and policies defined
- [ ] `supabase gen types` has been run if schema changed
- [ ] `PROMO_CODES` in `lib/store.ts` matches server-side validation in the Edge Function

### Adding a new feature — checklist

1. **DB schema**: write migration → enable RLS → define policies → generate types
2. **Hook**: create `src/hooks/use<Feature>.ts` with React Query
3. **Components**: build UI, receive data as props
4. **Page**: compose components, pass data, add `<SEOHead>`
5. **Route**: add to `App.tsx` router config with correct protection
6. **i18n**: add translation keys for both locales
7. **Tests**: unit test any new pure functions; component test the happy path

---

## 23. Migration Path (Supabase → Self-Hosted VPS)

Current state: All backend runs on Supabase (managed PostgreSQL + Edge Functions).
Target state: Docker Compose on Ubuntu 22.04 VPS with Nginx.

Migration phases:
1. **Phase 1** — Establish data layer: PostgreSQL + Redis in Docker, Nginx proxy. Keep frontend on Lovable. Validate data migration.
2. **Phase 2** — Migrate Edge Functions to Express routes: `create-checkout` → `/api/payments/checkout`, `chat` → `/api/ai/chat`, new `stripe-webhook` service.
3. **Phase 3** — Cut traffic: Cloudflare DNS points to VPS. Migrate Supabase Auth to self-hosted JWT.

Do NOT attempt all three phases at once. Each phase is independently deployable and rollbackable.

---

## 24. How to Use This File with Claude Code

When starting a session:
```bash
claude --context CLAUDE.md
```

Sections most useful for common tasks:

- **Adding a new page:** §4 (structure), §6 (patterns), §7 (principles), §9 (routes), §12 (i18n)
- **Fixing a bug:** §18 (known bugs), §5 (field names)
- **Database work:** §5 (schema), §7.6 (transactions), §14 (RLS)
- **Security review:** §14 (checklist + RLS matrix)
- **Architecture decision:** §6 (three patterns), §7 (principles)
- **New feature end-to-end:** §22 (feature checklist)
- **State management question:** §8 (three tiers, cartStore warning)
