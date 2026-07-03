import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { getSiteForUser } from "@/lib/getSiteForUser";
import { redirect } from "next/navigation";
import SeoDashboardClient from "./SeoDashboardClient";

export default async function SeoPage() {
  const user = await requireAuth();
  if (user.globalRole === "VIEWER") redirect("/admin/dashboard");
  const site = await getSiteForUser(user);

  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">SEO Management</h1>
        <p className="mt-4 text-sm text-red-600">No active site found.</p>
      </div>
    );
  }

  const [pages, posts] = await Promise.all([
    prisma.page.findMany({
      where: { siteId: site.id, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        seoTitle: true,
        seoDescription: true,
        ogImage: true,
        canonicalUrl: true,
        jsonLd: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.post.findMany({
      where: { siteId: site.id, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        seoTitle: true,
        seoDescription: true,
        ogImage: true,
        canonicalUrl: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">SEO Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Site: <span className="font-medium text-gray-800">{site.name}</span> ({site.domain || site.id})
        </p>
      </div>

      <SeoDashboardClient
        siteId={site.id}
        initialPages={JSON.parse(JSON.stringify(pages))}
        initialPosts={JSON.parse(JSON.stringify(posts))}
      />
    </div>
  );
}

