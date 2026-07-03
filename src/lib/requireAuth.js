import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import prisma from "./prisma";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  console.log("[requireAuth Debug] Session:", JSON.stringify(session));

  if (!session?.user?.id) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    if (!user) {
      return null;
    }
    return {
      ...session.user,
      ...user
    };
  } catch (err) {
    console.error("requireAuth database validation failed:", err);
    return null;
  }
}
