import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { getSiteForUser } from "@/lib/getSiteForUser";
import { redirect } from "next/navigation";
import TeamManager from "./TeamManager";

export default async function TeamPage() {
  const user = await requireAuth();
  if (user.globalRole === "VIEWER") redirect("/admin/dashboard");
  const site = await getSiteForUser(user);

  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Team Members</h1>
        <p className="mt-4 text-sm text-red-600">No active site found. Please configure a site in the database.</p>
      </div>
    );
  }

  const team = await prisma.teamMember.findMany({
    where: { siteId: site.id, deletedAt: null },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Team Members Directory</h1>
        <p className="text-sm text-gray-500 mt-1">
          Site: <span className="font-medium text-gray-800">{site.name}</span> ({site.domain || site.id})
        </p>
      </div>

      <TeamManager
        siteId={site.id}
        initialTeam={JSON.parse(JSON.stringify(team))}
      />
    </div>
  );
}

