// src/app/not-found.js — Custom 404 page driven by CMS settings with fallback
import Link from "next/link";
import { cms } from "../lib/cms";
import ClientRedirect from "./ClientRedirect";

export const dynamic = "force-dynamic";

export default async function NotFoundPage() {
  let custom404 = null;

  try {
    const data = await cms.getGlobalSettings();
    custom404 = data?.settings?.websiteSettings?.custom404 || data?.websiteSettings?.custom404 || null;
  } catch (e) {
    console.error("Failed to load custom 404 settings:", e);
  }

  const title = custom404?.title || "Page Not Found";
  const description =
    custom404?.description ||
    "Oops! The page you are looking for does not exist or has been moved.";
  const buttonText = custom404?.buttonText || "Go Home";
  const buttonLink = custom404?.buttonLink || "/";
  const redirectOn404 = custom404?.redirectOn404 ?? false;
  const redirectUrl = custom404?.redirectUrl || "/";
  const redirectDelay = custom404?.redirectDelay ?? 5;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12 font-sans">
      <div className="bg-white rounded-3xl p-10 md:p-14 shadow-sm border border-gray-100 text-center max-w-lg mx-auto space-y-6">
        {/* 404 Graphic */}
        <div className="text-8xl font-black text-primary/80 mb-2 tracking-tighter leading-none font-ui">
          404
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
          {title}
        </h1>

        <p className="text-gray-650 text-sm sm:text-base leading-relaxed">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href={buttonLink}
            className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white rounded-full font-bold uppercase tracking-widest text-xs px-6 py-3.5 transition-all shadow-sm text-center"
          >
            {buttonText}
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto border border-gray-250 hover:bg-slate-50 text-gray-700 rounded-full font-bold uppercase tracking-widest text-xs px-6 py-3.5 transition-all text-center"
          >
            Back to Home
          </Link>
        </div>

        {/* Auto-redirect when enabled */}
        {redirectOn404 && (
          <ClientRedirect url={redirectUrl} delay={redirectDelay} />
        )}
      </div>
    </div>
  );
}
