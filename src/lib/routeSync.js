import path from "path";
import fs from "fs";
import prisma from "@/lib/prisma";

const SITE_ID = "ebh";

const EXCLUDED_PREFIXES = [
  "/admin",
  "/crm",
  "/api",
  "/preview",
  "/maintenance",
  "/all-played-quiz",
  "/yourmove",
  "/login",
  "/forgot-password",
  "/reset-password",
];

function slugToTitle(slug) {
  if (slug === "/") return "Home";

  const last = slug.split("/").filter(Boolean).pop() || "";

  if (last.startsWith("[") && last.endsWith("]")) {
    const parent = slug.split("/").filter(Boolean).slice(-2, -1)[0] || "";
    const name = parent.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return `${name} Detail`.trim();
  }

  return last
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function discoverPageDirs(dir, found = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }

  const hasPage = entries.some(
    (e) => e.isFile() && (e.name === "page.js" || e.name === "page.jsx")
  );

  if (hasPage) {
    found.push(dir);
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      discoverPageDirs(path.join(dir, entry.name), found);
    }
  }

  return found;
}

function dirToSlug(dir, appDir) {
  const relative = path.relative(appDir, dir).replace(/\\/g, "/");
  return relative === "" ? "/" : `/${relative}`;
}

export async function syncRoutes() {
  try {
    const appDir = path.join(process.cwd(), "src", "app");
    const pageDirs = discoverPageDirs(appDir);

    const routes = pageDirs
      .map((dir) => dirToSlug(dir, appDir))
      .filter(
        (slug) => !EXCLUDED_PREFIXES.some((prefix) => slug.startsWith(prefix))
      )
      .map((slug) => ({
        slug,
        title: slugToTitle(slug),
        isDynamic: slug.includes("["),
      }));

    // Ensure site exists
    await prisma.site.upsert({
      where: { id: SITE_ID },
      update: {},
      create: {
        id: SITE_ID,
        name: "Earth By Humans",
        domain: "earthbyhumans.com",
        isActive: true,
      },
    });

    let synced = 0;
    for (const route of routes) {
      await prisma.page.upsert({
        where: { siteId_slug: { siteId: SITE_ID, slug: route.slug } },
        update: {
          title: route.title,
          isManagedBySync: true,
          isDiscovered: true,
        },
        create: {
          siteId: SITE_ID,
          slug: route.slug,
          title: route.title,
          status: "PUBLISHED",
          isManagedBySync: true,
          isDiscovered: true,
          isHardcoded: !route.isDynamic,
          publishedAt: new Date(),
        },
      });
      synced++;
    }

    const activeSlugs = routes.map((r) => r.slug);
    const deleteResult = await prisma.page.deleteMany({
      where: {
        siteId: SITE_ID,
        isDiscovered: true,
        slug: {
          notIn: activeSlugs,
        },
      },
    });

    console.log(
      `[EBH Startup] ✅ Auto-discovered and synced ${synced} routes to global backend.`
    );
    if (deleteResult.count > 0) {
      console.log(
        `[EBH Startup] 🗑️ Cleaned up ${deleteResult.count} obsolete pages from database.`
      );
    }
  } catch (err) {
    console.error("[EBH Startup] ⚠️ Route sync failed:", err.message);
  }
}
