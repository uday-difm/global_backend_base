# Global Backend Base — Integration Guide

This template gives you the **full admin + CRM backend** pre-wired into a Next.js app.  
Drop in your frontend pages and you have a complete, single-instance deployment.

---

## What's Included

| Feature | Route |
|---|---|
| Admin Dashboard | `/admin` |
| CRM Dashboard | `/crm` |
| All REST APIs | `/api/...` |
| Login / Auth | `/login`, `/forgot-password`, `/reset-password` |
| Page Builder Preview | `/preview` |
| Maintenance Mode | `/maintenance` |

Everything else (`/`, your pages) is your frontend.

---

## Setup for a New Site

### 1. Copy this folder

```bash
cp -r global-backend-base my-new-site
cd my-new-site
```

### 2. Rename the project

Edit `package.json` and change `"name"`:
```json
{ "name": "my-new-site" }
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | What to set |
|---|---|
| `DATABASE_URL` | Your site's own MySQL or PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your site's URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_SITE_ID` | Unique snake_case ID for this site (e.g. `layman_law`) |
| `SITE_ID` | Same as above |
| `CLOUDINARY_*` | Your Cloudinary credentials |
| `SMTP_*` | Your email provider SMTP settings |

### 4. Install dependencies

```bash
npm install
```

### 5. Set up the database

```bash
# Push schema to your DB (no migration history — fast start)
npm run db:push

# Seed the initial admin user and site settings
npm run db:seed
```

Default admin login created by the seed:
- **Email:** `admin@example.com`
- **Password:** `Admin@123`  
  *(Change this immediately after first login via Admin → Users)*

### 6. Start the dev server

```bash
npm run dev
```

Visit `http://localhost:3000/admin` — you're in.

---

## Adding Your Frontend

### Step A — Replace the homepage

Delete `src/app/page.js` and replace it with your own:

```jsx
// src/app/page.js
export default function HomePage() {
  return <main>Your homepage here</main>;
}
```

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

// ... (inside RootLayout, the public path branch):

const layout = await getLayoutData();

return (
  <html lang="en" className={fontClasses}>
    <head>
      <link rel="icon" href={layout.faviconUrl} />
    </head>
    <body>
      <Header navigation={layout.navigation} logoUrl={layout.logoUrl} />
      <main>{children}</main>
      <Footer navigation={layout.navigation} copyright={layout.copyright} />
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
│   └── instrumentation.js   ← Server startup hook (DO NOT modify)
├── .env                     ← YOUR config (copy from .env.example)
├── package.json             ← Add frontend deps here
└── INTEGRATE.md             ← This file
```
