# Global Backend Integration Guide (Merging into an Existing Next.js Project)

This guide walks you through merging the **full admin + CRM backend** from this template directly into your existing Next.js project.

---

## What's Included

| Feature | Route | Description |
|---|---|---|
| Admin Dashboard | `/admin` | Fully featured administration panel |
| CRM Dashboard | `/crm` | CRM tool for customer relations |
| All REST APIs | `/api/...` | Backend endpoint logic |
| Login / Auth | `/login`, `/forgot-password`, `/reset-password` | Authentication routes |
| Page Builder Preview | `/preview` | Visual page editor staging |
| Maintenance Mode | `/maintenance` | Public fallback mode |

All backend administration, APIs, and authentication routes are isolated to these subfolders. Your existing frontend pages (like `/` or `/about`) will not be overridden.

---

## Integration Steps

### 1. Copy the Backend Files into Your Project

Copy the isolated backend folders and files into your existing Next.js project directory. Do NOT overwrite your existing `src/app/page.js` or `src/app/layout.js`.

From your terminal, copy the following items from the backend template into your existing project:

```bash
# Copy Prisma schema and setup
cp -r global-backend-base/prisma my-existing-site/

# Copy isolated backend routes and components
cp -r global-backend-base/src/app/admin my-existing-site/src/app/
cp -r global-backend-base/src/app/crm my-existing-site/src/app/
cp -r global-backend-base/src/app/api my-existing-site/src/app/
cp -r global-backend-base/src/app/login my-existing-site/src/app/
cp -r global-backend-base/src/app/preview my-existing-site/src/app/
cp -r global-backend-base/src/app/maintenance my-existing-site/src/app/

# Copy backend components, services, and core utilities
# Copy backend components (ensure you copy the folders, not just the contents)
cp -r global-backend-base/src/components/dashboard my-existing-site/src/components/
cp -r global-backend-base/src/components/providers my-existing-site/src/components/
cp -r global-backend-base/src/components/utils my-existing-site/src/components/
cp -r global-backend-base/src/components/media my-existing-site/src/components/
cp global-backend-base/src/components/ContactFormSection.js my-existing-site/src/components/
cp global-backend-base/src/components/DynamicBlockEditor.js my-existing-site/src/components/
cp global-backend-base/src/components/BlockEditor.js my-existing-site/src/components/
cp global-backend-base/src/components/ThemeToggle.js my-existing-site/src/components/
cp -r global-backend-base/src/services my-existing-site/src/
cp -r global-backend-base/src/repositories my-existing-site/src/
cp -r global-backend-base/src/mappers my-existing-site/src/
cp -r global-backend-base/src/data my-existing-site/src/
cp -r global-backend-base/src/core my-existing-site/src/
cp -r global-backend-base/src/lib my-existing-site/src/

# Copy instrumentation, route proxy, and local packages
cp global-backend-base/src/instrumentation.js my-existing-site/src/
cp global-backend-base/src/proxy.js my-existing-site/src/
cp -r global-backend-base/src/sdk my-existing-site/src/
```

### 2. Merge dependencies in `package.json`

To automatically merge the scripts, dependencies, devDependencies, and prisma configurations from the backend template's `package.json` into your existing project's `package.json` without doing it manually, run this command from your existing project directory:

```bash
node -e "const fs = require('fs'); const base = JSON.parse(fs.readFileSync('global-backend-base/package.json')); const mine = JSON.parse(fs.readFileSync('package.json')); mine.scripts = { ...mine.scripts, ...base.scripts }; mine.dependencies = { ...mine.dependencies, ...base.dependencies }; mine.devDependencies = { ...mine.devDependencies, ...base.devDependencies }; mine.prisma = base.prisma; fs.writeFileSync('package.json', JSON.stringify(mine, null, 2));"
```

Once merged, install the new dependencies:
```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to your project root if you do not have one, or copy the variables from it into your existing `.env` file:

```bash
# Add to your .env
DATABASE_URL="mysql://username:password@localhost:3306/dbname"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_ID="your_site_id"
SITE_ID="your_site_id"
```

### 4. Push Database Schema & Seed Data

Ensure your database is running, then push the schema and seed the default admin account:

```bash
# Push schema to database
npm run db:push

# Run seed file (creates superadmin and default site configs)
npm run db:seed
```

Default Admin Credentials created by seed:
- **Email:** `admin@example.com`
- **Password:** `Admin@123`

### 5. Run local development

Start the dev server:
```bash
npm run dev
```
Visit `http://localhost:3000/admin` to access the admin panel.


---

## Adding Your Frontend

### Step A — Keep your existing homepage

Keep your own `src/app/page.js` (or `page.tsx`). Do not overwrite it with the backend template's placeholder page. If it was overwritten during the copy step, restore your original `page.js` from your backup.


### Step B — Add your pages

Drop any new route folders into `src/app/`:

```
src/app/
├── about/page.js
├── services/page.js
├── blog/page.js
├── contact/page.js
└── [...]
```

These will never conflict with backend routes, which all live under `/admin`, `/crm`, `/api`, `/login`, `/preview`, `/maintenance`.

### Step C — Wire up the public layout

Open `src/app/layout.js`. At the bottom, find the `// ── Public site layout` comment block and replace the placeholder with your actual header, footer, and body:

```jsx
// src/app/layout.js  (public section only — admin shell is already handled above)

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLayoutData } from "@/services/layout.service";
import { CookieConsentBanner, CtaPopups, CtaFloatingButtons } from "@yourcompany/global-backend-next/components";

// ... (inside RootLayout, the public path branch):

const layout = await getLayoutData();

return (
  <html lang="en" className={fontClasses}>
    <head>
      <link rel="icon" href={layout.faviconUrl} />
    </head>
    <body className="flex min-h-full flex-col bg-slate-50">
      <Header navigation={layout.navigation} logoUrl={layout.logoUrl} />
      <main className="flex-grow flex flex-col">{children}</main>
      <Footer navigation={layout.navigation} copyright={layout.copyright} />
      <CookieConsentBanner
        complianceSettings={layout.rawSettings?.compliance}
        siteId={process.env.NEXT_PUBLIC_SITE_ID}
        baseUrl={process.env.NEXT_PUBLIC_CMS_BASE_URL}
      />
      <CtaPopups ctaConfig={layout.rawSettings?.ctaConfig} />
      <CtaFloatingButtons ctaConfig={layout.rawSettings?.ctaConfig} />
    </body>
  </html>
);
```

### Step D — Add your components

Drop site-specific components into `src/components/`:

```
src/components/
├── Header.js          ← your site header
├── Footer.js          ← your site footer
├── HeroSection.js
└── [...]
```

The `dashboard/`, `providers/`, `utils/`, and `media/` subdirectories are already populated with backend components — don't modify those.

---

## CMS Page Builder (Optional)

If you want to use the visual page builder to manage your site's content:

1. In Admin → Pages, create a page (e.g. "Home")
2. Use the page editor to add sections (Hero, Services, Testimonials, etc.)
3. In your frontend, add a catch-all route that renders CMS pages:

```jsx
// src/app/[...slug]/page.js
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function CmsPage({ params }) {
  const slug = (await params).slug?.join("/") || "";
  const page = await prisma.page.findFirst({
    where: { slug, deletedAt: null, status: "PUBLISHED" },
    include: { sections: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!page) return notFound();

  return (
    <div>
      {page.sections.map((s) => (
        <div key={s.id}>{/* render s.type with s.content */}</div>
      ))}
    </div>
  );
}
```

---

## Production Deployment

```bash
npm run build
npm start
```

Each site is a completely independent deployment:
- Its own Node.js process
- Its own database (set via `DATABASE_URL`)
- Its own domain
- Admin and CRM accessible at `/admin` and `/crm` on the same domain

---

## Troubleshooting & Common Pitfalls

### 1. Peer Dependency Conflicts during `npm install`
When merging packages into an existing project, package managers may fail with an `EROLVE unable to resolve dependency tree` error (typically due to `@types/react` or React 19 type overrides).
*   **Solution**: Install using legacy peer dependencies to resolve the tree conflict:
    ```bash
    npm install --legacy-peer-deps
    ```

### 2. Nested `prisma/prisma` Directory Structure
If you copy folders using a graphical interface or incorrect shell wildcards, the Prisma files may accidentally wind up in `prisma/prisma/` instead of `prisma/`.
*   **Symptom**: `Error: Could not load --schema from provided path prisma\schema.prisma: file or directory not found`.
*   **Solution**: Move `schema.prisma`, `seed.js`, and `prisma.config.ts` up one level directly under the `prisma/` root:
    ```bash
    mv prisma/prisma/* prisma/
    rm -r prisma/prisma
    ```

### 3. Missing `dotenv` in Seeding Script
If `npm run db:seed` fails complaining about `Cannot find module 'dotenv/config'`, ensure `dotenv` is installed:
    ```bash
    npm install dotenv
    ```

### 4. TypeScript Dependency Auto-Install Peer Conflict
When first starting `npm run dev` in a project containing a `tsconfig.json`, Next.js tries to auto-install TypeScript dependencies (`typescript`, `@types/react`, etc.). However, it executes the command without flags, which triggers a peer dependency tree conflict on React 19 types.
*   **Symptom**: `Failed to install required TypeScript dependencies, please install them manually to continue: npm install --save-exact --save-dev typescript`
*   **Solution**: Manually install `typescript` with the `--legacy-peer-deps` flag:
    ```bash
    npm install --save-exact --save-dev typescript --legacy-peer-deps
    ```

### 5. Missing Path Aliases (`@/*`) in `tsconfig.json`
If you merge the backend into an existing Next.js project that does not have path aliases configured under `compilerOptions`, Next.js will throw `Module not found` errors for imports starting with `@/`.
*   **Symptom**: `Module not found: Can't resolve '@/lib/...'` or similar.
*   **Solution**: Open your `tsconfig.json` and add `paths` and `moduleResolution` inside `"compilerOptions"`. Note that you do not need `baseUrl` in TypeScript 4.1+:
    ```json
    "compilerOptions": {
      "moduleResolution": "bundler",
      "paths": {
        "@/*": ["./src/*"]
      }
    }
    ```

### 6. Duplicate Config Files (`tsconfig.json` & `jsconfig.json` Conflict)
If you have both a `tsconfig.json` and `jsconfig.json` in your project root, the build compilers/loaders (like Turbopack) can fail to resolve path aliases properly, resulting in compilation failures.
*   **Symptom**: `Module not found: Can't resolve '@/core/errors'` even when the file and tsconfig paths are correctly configured.
*   **Solution**: Delete the duplicate `jsconfig.json` file so Next.js uses the TypeScript config exclusively:
    ```bash
    rm jsconfig.json
    ```

### 7. Middleware and Proxy Conflict
Next.js 16 deprecated `middleware.js` and replaced it with `proxy.js`. Having both in the same project root/src folder will throw a build-blocking error.
*   **Symptom**: `Error: Both middleware file "./src/middleware.js" and proxy file "./src/proxy.js" are detected. Please use "./src/proxy.js" only.`
*   **Solution**:
    1. Merge any custom routing or auth-check logic from your original `middleware.js` directly into `src/proxy.js`.
    2. Delete the deprecated `middleware.js` file:
       ```bash
       rm src/middleware.js
       ```

---

## File Structure Reference

```
my-new-site/
├── prisma/                  ← DB schema (shared, don't edit unless extending)
├── src/
│   ├── app/
│   │   ├── admin/           ← Admin dashboard (DO NOT modify)
│   │   ├── crm/             ← CRM dashboard (DO NOT modify)
│   │   ├── api/             ← All REST APIs (DO NOT modify)
│   │   ├── login/           ← Auth routes (DO NOT modify)
│   │   ├── preview/         ← Page builder preview (DO NOT modify)
│   │   ├── layout.js        ← Root layout (edit the public section only)
│   │   ├── page.js          ← YOUR homepage ← REPLACE THIS
│   │   └── [your pages]/    ← ADD YOUR PAGES HERE
│   ├── components/
│   │   ├── dashboard/       ← Admin UI (DO NOT modify)
│   │   ├── providers/       ← Auth/theme providers (DO NOT modify)
│   │   ├── utils/           ← Session handler etc. (DO NOT modify)
│   │   ├── media/           ← Media picker (DO NOT modify)
│   │   └── [your comps]/    ← ADD YOUR COMPONENTS HERE
│   ├── services/            ← Backend business logic (DO NOT modify)
│   ├── core/                ← Error handling, events (DO NOT modify)
│   ├── lib/                 ← Prisma client, helpers (DO NOT modify)
│   ├── instrumentation.js   ← Server startup hook (DO NOT modify)
│   └── proxy.js             ← Route proxy/middleware (DO NOT modify)
├── .env                     ← YOUR config (copy from .env.example)
├── package.json             ← Add frontend deps here
└── INTEGRATE.md             ← This file
```
