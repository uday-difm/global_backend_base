import prisma from "@/lib/prisma";
import SecurityConsole from "./SecurityConsole";
import { requireAuth } from "@/lib/requireAuth";
import { getSiteForUser } from "@/lib/getSiteForUser";
import { redirect } from "next/navigation";

export default async function SecurityPage() {
  const sessionUser = await requireAuth();

  if (!sessionUser) {
    redirect("/login");
  }

  // Get active site configuration
  const site = await getSiteForUser(sessionUser);
  const siteId = site ? site.id : null;

  if (
    sessionUser.globalRole !== "SUPERADMIN" &&
    sessionUser.globalRole !== "ADMIN"
  ) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Security Center
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account credentials, configure two-factor authentication,
          and monitor security access.
        </p>
      </div>

      <SecurityConsole siteId={siteId} user={sessionUser} />
    </div>
  );
}

