# Pacific Alpacas — Development Guide

> Architecture reference and engineering standards for the Pacific Alpacas e-commerce platform. This document governs how features are designed, built, and evolved.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Directory Structure & Conventions](#3-directory-structure--conventions)
4. [Data Modeling](#4-data-modeling)
5. [State Management](#5-state-management)
6. [Backend & API Layer (Supabase)](#6-backend--api-layer-supabase)
7. [Security](#7-security)
8. [Internationalization](#8-internationalization)
9. [Routing & Page Architecture](#9-routing--page-architecture)
10. [Component Design](#10-component-design)
11. [Forms & Validation](#11-forms--validation)
12. [Testing Strategy](#12-testing-strategy)
13. [Performance](#13-performance)
14. [TypeScript Standards](#14-typescript-standards)
15. [Development Workflow](#15-development-workflow)
16. [Known Technical Debt](#16-known-technical-debt)

---

## 1. Project Overview

Pacific Alpacas is a bilingual (Chinese/English) luxury e-commerce platform for a New Zealand alpaca fiber brand. It targets high-net-worth Chinese consumers via a web storefront that supports:

- **Product catalogue** with bilingual copy, variants, and multi-currency pricing
- **Fiber traceability** — QR-scannable batch codes linking products to specific NZ farms
- **Grower portal** — authenticated dashboard for NZ farmers to view batches and credit balances
- **Admin panel** — full back-office (products, orders, growers, fiber batches, promos)
- **AI chat assistant** — in-page product/brand Q&A powered by a Supabase Edge Function
- **Sleep quiz** — interactive product recommender tracked for conversion analytics

### Non-goals

- This is a single-page application (SPA), not a server-rendered app. SEO is handled via `<SEOHead>` + JSON-LD, not SSR.
- No native mobile app. The web app is mobile-responsive.
- No custom auth server. Supabase Auth handles all identity concerns.

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    Browser (SPA)                     │
│                                                      │
│  React 18 + TypeScript + Vite                        │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │  Pages  │  │Components│  │  Contexts/Hooks  │    │
│  └────┬────┘  └────┬─────┘  └────────┬─────────┘    │
│       │            │                 │              │
│  ┌────▼────────────▼─────────────────▼──────────┐   │
│  │           TanStack React Query                │   │
│  │         (server state & caching)              │   │
│  └──────────────────────┬────────────────────────┘   │
└─────────────────────────┼────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼────────────────────────────┐
│                  Supabase Platform                   │
│                                                      │
│  ┌─────────────┐   ┌──────────────┐                  │
│  │  Auth       │   │  Storage     │ (farm-images)    │
│  └─────────────┘   └──────────────┘                  │
│  ┌─────────────────────────────────┐                 │
│  │  PostgreSQL (Row-Level Security)│                 │
│  │  products, orders, growers,     │                 │
│  │  fiber_batches, promo_codes,    │                 │
│  │  user_roles, grower_transactions│                 │
│  └─────────────────────────────────┘                 │
│  ┌─────────────────────────────────┐                 │
│  │  Edge Functions (Deno)          │                 │
│  │  • chat/            (AI Q&A)    │                 │
│  │  • create-checkout/ (payment)   │                 │
│  └─────────────────────────────────┘                 │
└──────────────────────────────────────────────────────┘
```

### Layered architecture

| Layer | Responsibility | Location |
|---|---|---|
| **Pages** | Route-level composition; owns data fetching initiation | `src/pages/` |
| **Components** | UI rendering; receives props; no direct DB calls | `src/components/` |
| **Hooks** | Encapsulate data fetching, auth, and side effects | `src/hooks/` |
| **Contexts** | Cross-cutting shared state (locale, cart) | `src/contexts/` |
| **Lib** | Pure utilities, constants, schemas, translations | `src/lib/` |
| **Integrations** | Supabase client and generated types | `src/integrations/supabase/` |
| **Edge Functions** | Server-side logic that requires secret keys | `supabase/functions/` |

### Data flow principle

```
Page → calls Hook → calls Supabase client → returns data via React Query
Page → passes data down as props to Components
Components → dispatch actions to Context or call callbacks from props
```

Components must not call Supabase directly. All database access lives in hooks or contexts.

---

## 3. Directory Structure & Conventions

```
src/
├── assets/          # Static images only; no JS/TS files
├── components/
│   ├── ui/          # Unstyled primitives (shadcn/ui — do not modify directly)
│   ├── layout/      # App shell: Navbar, Footer, PublicLayout
│   ├── home/        # Landing page sections (one file per section)
│   ├── shop/        # Shop-specific UI (cross-sell, live inventory, quiz)
│   ├── storefront/  # Shared storefront widgets (traceability, badges)
│   └── cart/        # Cart drawer and related components
├── contexts/        # React Context providers (AppContext, CartContext)
├── hooks/           # Custom hooks; file named use<Feature>.ts
├── i18n/            # react-i18next config and namespace files
├── integrations/    # Third-party client initialization (Supabase only)
│   └── supabase/
│       ├── client.ts   # Singleton — import this everywhere
│       └── types.ts    # Generated types — never edit manually
├── lib/
│   ├── i18n.ts      # Translation strings (en + zh)
│   ├── schemas.ts   # All Zod schemas
│   ├── store.ts     # Product constants, promo codes, format helpers
│   └── utils.ts     # Generic utilities (cn, etc.)
├── pages/
│   ├── admin/       # All /admin routes grouped here
│   └── *.tsx        # One file per public route
├── stores/          # Zustand stores (legacy — see §5)
└── test/            # Vitest + RTL unit/component tests

supabase/
├── config.toml
├── migrations/      # Sequential SQL migrations (never edited after merge)
└── functions/       # Deno Edge Functions (one folder per function)
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

## 4. Data Modeling

### Core entities and relationships

```
auth.users (Supabase managed)
    │
    ├── user_roles (role: admin | moderator | user)
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
    └── orders.items (JSONB snapshot — see §4.3)

promo_codes (standalone)
sleep_assessments (standalone, session-scoped)
```

### Principles

**1. Prices are always stored in NZD.** `price_nzd` is the single source of truth. Display conversions happen at render time using live or cached exchange rates. This prevents inconsistencies when rates change.

**2. Order items are snapshotted.** `orders.items` is a JSONB snapshot of the cart at checkout time (product name, price, variant, quantity). This means product edits never corrupt historical order data.

**3. Bilingual fields are stored separately.** Use `name_en` / `name_zh` columns rather than a translations join table. This keeps queries simple and avoids locale-dependent joins for a two-language system.

**4. Grower balances are derived from transactions.** Never update `grower.credit_balance` directly. Always insert a `grower_transactions` row; the `update_grower_balance` database trigger maintains the balance. This gives a full audit trail.

**5. Stock decrements are triggered server-side.** When `orders.status` is set to `'paid'`, the `decrement_stock` trigger fires automatically. Client code must not decrement stock manually.

### Adding a new table

1. Create a timestamped migration file in `supabase/migrations/`.
2. Enable RLS immediately: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
3. Define policies before any data insert (see §7).
4. Run `supabase gen types typescript` and commit the updated `src/integrations/supabase/types.ts`.
5. Add a hook in `src/hooks/use<Table>.ts` wrapping the Supabase query.

---

## 5. State Management

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
| `AppContext` | locale, translations, recentlyViewed | `localStorage` (pa-locale) |
| `CartContext` | cart items, currency, promo code | `localStorage` (pa-cart-v1, pa-currency-v1) |

Rules:
- `CartProvider` is nested inside `AppProvider` to prevent cart re-renders on locale change
- Do not put async data (DB queries) inside Context — use React Query for that
- Context values must be memoized with `useMemo` to prevent unnecessary re-renders

### Tier 3 — Local UI state (useState / useReducer)

Use for component-internal state: open/closed modals, form steps, hover states.

### Legacy Zustand stores (`src/stores/`)

`cartStore.ts` and `uiStore.ts` exist for backward compatibility. Do not add new features to them. New state must use Context (shared) or React Query (server). See §16 for migration plan.

---

## 6. Backend & API Layer (Supabase)

### Client singleton

Always import from `src/integrations/supabase/client.ts`. Never create a second Supabase client instance.

```typescript
import { supabase } from '@/integrations/supabase/client';
```

### Query conventions

```typescript
// Fetch with RLS-aware filter (no manual user_id filter needed — RLS handles it)
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false });

// Always handle error before using data
if (error) throw error;
```

- Select only the columns you need (avoid `select('*')` in hot paths)
- Use `.single()` only when you are certain one row exists; otherwise use `.maybeSingle()`
- Wrap Supabase calls in try/catch or propagate to React Query's error boundary

### Edge Functions

Use Edge Functions for operations that require:
- Secret API keys (Stripe, OpenAI, etc.)
- Server-side promo code validation
- Webhook receivers

Edge Functions live in `supabase/functions/<name>/index.ts` and are written in TypeScript (Deno runtime). They are the only place where `STRIPE_SECRET_KEY` or similar secrets should appear.

**Call pattern from the client:**

```typescript
const { data, error } = await supabase.functions.invoke('create-checkout', {
  body: { items, promoCode, shippingAddress },
});
```

### Migrations

- Migrations are **append-only**. Never edit a migration file after it has been merged.
- Each migration must be self-contained and idempotent where possible (`CREATE TABLE IF NOT EXISTS`, `DO $$ IF NOT EXISTS ...`).
- Destructive schema changes (drop column, rename) require a dedicated migration with a comment explaining the reason.
- After any schema change, regenerate types: `npx supabase gen types typescript --local > src/integrations/supabase/types.ts`

---

## 7. Security

### Row-Level Security (RLS)

RLS is the primary access control mechanism. Every table must have RLS enabled and explicit policies for each operation.

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
- **Promo code validation must happen server-side** (Edge Function). The `PROMO_CODES` constant in `lib/store.ts` is for UI feedback only — it does not gate actual discounts.
- **Admin routes must have two layers of protection:** frontend route guard (`<ProtectedRoute role="admin">`) AND RLS policies. The frontend guard is UX; RLS is security.
- Do not log `session.access_token` or user PII to the browser console.

### Environment variables

- All Supabase keys exposed to the client must be `VITE_` prefixed (Vite build-time injection).
- The `VITE_SUPABASE_PUBLISHABLE_KEY` is safe to expose — it is the anonymous key scoped by RLS.
- Secret keys (Stripe, OpenAI) must only exist in Supabase Edge Function environment variables, never in the Vite config.
- `.env` must remain in `.gitignore`. Provide `.env.example` with placeholder values for onboarding.

---

## 8. Internationalization

### Architecture

The app supports two locales: `en` (English) and `zh` (Simplified Chinese). The locale is user-selectable and persisted to `localStorage` under the key `pa-locale`.

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

1. **All user-visible strings must be translated.** No hardcoded English strings in components.
2. **Bilingual DB fields are fetched separately** (`name_en`, `name_zh`). Select based on locale at the component or hook level, not in SQL.
3. **Dates and numbers** must use locale-aware formatters:
   - Prices: use `formatPrice(amount, currency)` from `lib/store.ts`
   - Dates: use `Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-NZ')`
4. **Do not use react-i18next's `t()` function** for new code. The typed `t` object from AppContext is preferred for compile-time safety.
5. When adding a new translation key, add it to **both** `translations.en` and `translations.zh` in the same commit.

---

## 9. Routing & Page Architecture

### Route map

```
/                    → Index.tsx            (public)
/shop                → ShopPage.tsx         (public)
/shop/:slug          → ProductDetailPage.tsx (public)
/trace/:batchCode    → TraceabilityPage.tsx  (public)
/checkout            → CheckoutPage.tsx      (auth optional)
/order-success       → OrderSuccessPage.tsx  (auth optional)
/login               → AuthPage.tsx          (public, redirects if logged in)
/grower              → GrowerDashboard.tsx   (auth required, grower role)
/admin/*             → AdminLayout.tsx       (auth required, admin role)
```

### Page responsibilities

A page component should:
- Initiate data fetching (call hooks at the top level)
- Handle loading and error states
- Compose components with data as props
- Own the `<SEOHead>` for that route

A page component should **not**:
- Contain more than ~50 lines of JSX
- Implement complex UI logic inline — extract to a named component
- Call `supabase` directly — use a hook

### Protected routes

```tsx
// Wrap authenticated routes
<Route path="/grower" element={
  <ProtectedRoute>
    <GrowerDashboard />
  </ProtectedRoute>
} />
```

`ProtectedRoute` checks `useAuth()` and redirects to `/login` if unauthenticated. For role-based routes, add a `role` prop.

### Admin layout isolation

The `/admin` subtree uses `AdminLayout` (no `Navbar`/`Footer`) and is completely independent from `PublicLayout`. This is intentional — admin and storefront can evolve separately.

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
- Components that are used in more than one section belong in `src/components/storefront/` or `src/components/shop/`. Section-specific components live inside `src/components/home/`.

### Animation

Use Framer Motion for all transitions. Do not use CSS `transition` or `animation` for complex sequences — keep motion logic in one place.

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

All forms use **React Hook Form** + **Zod** for validation. All schemas live in `src/lib/schemas.ts`.

### Pattern

```typescript
// 1. Define schema in lib/schemas.ts
export const checkoutSchema = z.object({
  name: z.string().min(2, t.errors.nameRequired),
  email: z.string().email(t.errors.invalidEmail),
  // ...
});
export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// 2. Use in component
const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>({
  resolver: zodResolver(checkoutSchema),
});
```

### Rules

- Validation schemas must live in `lib/schemas.ts`, not inline in components
- Error messages must be bilingual — pass translated strings from `t` when constructing the schema, or use a factory function
- Server-side validation in Edge Functions must mirror client-side schemas — they are not the same code, but the rules should match
- Never disable form validation for convenience; add appropriate `.optional()` or `.nullable()` to the schema instead

---

## 12. Testing Strategy

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

### Unit tests

Target: `src/lib/` functions — `formatPrice`, `formatNZD`, Zod schema validation, utility functions. These have no dependencies and are fast.

### Component / integration tests

Use `@testing-library/react`. Mock Supabase at the module level:

```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(), auth: { getUser: vi.fn() } }
}));
```

Test what the user sees, not implementation details. Verify rendered text, not internal state.

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

## 13. Performance

### React Query caching

Default cache settings (do not override without reason):
- `staleTime: 5 * 60 * 1000` (5 min) — product catalogue changes infrequently
- `gcTime: 30 * 60 * 1000` (30 min) — keep cache warm between page navigations

For admin mutations (product edits, order status updates), invalidate the relevant query immediately on success.

### Image optimization

- All images served from Supabase Storage must use the Supabase transform API for resizing:
  `?width=800&quality=80` appended to the URL
- Hero images: lazy load with `loading="lazy"` unless above the fold
- Use `<img>` `width` and `height` attributes to prevent layout shift (CLS)

### Bundle size

- Avoid importing entire libraries when tree-shakeable subpaths exist
- `lodash` is not in the dependency list — keep it that way; use native array/object methods
- Large third-party widgets (e.g., chat, payment form) should be loaded with `React.lazy()` and `<Suspense>`

### Code splitting

Routes are already split by page via React Router. Admin pages should additionally use `React.lazy()` since they are never visited by customers:

```typescript
const AdminDashboard = React.lazy(() => import('./admin/AdminDashboard'));
```

---

## 14. TypeScript Standards

### Current state

TypeScript is configured with `strict: false` and `noImplicitAny: false`. This is technical debt (see §16). New code must be written as if strict mode is enabled.

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

The function `dbToLegacyProduct()` in `lib/store.ts` converts DB types to the legacy `Product` interface used by components. When adding new product fields to the DB schema, add the mapping here too. Long-term goal: phase out the legacy interface and use DB types directly (see §16).

---

## 15. Development Workflow

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

## 16. Known Technical Debt

These items are tracked here so they are not forgotten and not re-introduced.

| Item | Location | Priority | Notes |
|---|---|---|---|
| Enable TypeScript strict mode | `tsconfig.app.json` | High | `noImplicitAny: true, strict: true` — fix type errors incrementally |
| Migrate `uiStore.ts` to AppContext | `src/stores/uiStore.ts` | Medium | Language and mobile menu state should live in AppContext |
| Remove legacy `cartStore.ts` | `src/stores/cartStore.ts` | Medium | CartContext is the canonical source; Zustand store is a duplicate |
| Phase out `dbToLegacyProduct` adapter | `src/lib/store.ts` | Medium | Components should consume Supabase DB types directly |
| Move promo code validation server-side | `lib/store.ts` + Edge Function | High | Client-side `PROMO_CODES` constant is only for UI feedback; actual validation must be in `create-checkout` Edge Function (verify this is already the case) |
| Add `.env.example` | repo root | Low | New developers need a template with placeholder values |
| Playwright coverage for checkout flow | `supabase/functions/create-checkout` | Medium | No E2E tests cover the payment path |
| Exchange rate staleness | `hooks/useExchangeRates.ts` | Low | Hardcoded fallback rates (CNY 4.5, USD 0.6) should be refreshed from a live API |

---

*This document should be updated whenever a significant architectural decision is made. Prefer updating it as part of the PR that introduces the change.*
