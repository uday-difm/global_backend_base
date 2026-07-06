import "./globals.css";
export const dynamic = "force-dynamic";

// ── Backend shell imports ─────────────────────────────────────────────────
import { headers } from "next/headers";
import AuthProvider from "@/components/providers/SessionProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";
import SessionTimeoutHandler from "@/components/utils/SessionTimeoutHandler";
import { Toaster } from "sonner";
import "@/core/listeners";

// ── TODO: Import your site's fonts ───────────────────────────────────────
// Example:
// import { Inter } from "next/font/google";
// const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// ── TODO: Update your site metadata ─────────────────────────────────────
export const metadata = {
  title: "My Website",
  description: "My website description.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * Paths that render the admin/CRM shell instead of the public site layout.
 * Do NOT modify this unless adding a new admin-only route segment.
 */
function isDashboardPath(pathname) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/crm") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/preview")
  );
}

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // ── Admin / CRM / Auth shell ────────────────────────────────────────────
  // Rendered for /admin, /crm, /login, /forgot-password, /reset-password, /preview
  if (isDashboardPath(pathname)) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head />
        <body>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              <SessionTimeoutHandler timeoutMinutes={30} />
              {children}
              <Toaster richColors position="top-right" closeButton />
            </AuthProvider>
          </ThemeProvider>
        </body>
      </html>
    );
  }

  // ── Public site layout ─────────────────────────────────────────────────
  // TODO: Replace the shell below with your actual public site layout.
  //
  // Typical pattern:
  //   1. Import your Header and Footer components
  //   2. Fetch any layout data you need (navigation, settings, etc.)
  //   3. Wrap {children} with your header/footer
  //
  //   import Header from "@/components/Header";
  //   import Footer from "@/components/Footer";
  //   import { getLayoutData } from "@/services/layout.service";
  //   import { CookieConsentBanner, CtaPopups, CtaFloatingButtons } from "@yourcompany/global-backend-next/components";
  //
  //   const layout = await getLayoutData();
  //
  //   return (
  //     <html lang="en">
  //       <body>
  //         <Header navigation={layout.navigation} logoUrl={layout.logoUrl} />
  //         <main>{children}</main>
  //         <Footer navigation={layout.navigation} copyright={layout.copyright} />
  //         <CookieConsentBanner complianceSettings={layout.rawSettings?.compliance} siteId={process.env.NEXT_PUBLIC_SITE_ID} baseUrl={process.env.NEXT_PUBLIC_CMS_BASE_URL} />
  //         <CtaPopups ctaConfig={layout.rawSettings?.ctaConfig} />
  //         <CtaFloatingButtons ctaConfig={layout.rawSettings?.ctaConfig} />
  //       </body>
  //     </html>
  //   );

  return (
    <html lang="en">
      <head />
      <body>
        {/* TODO: Add your public Header component here */}
        <main>{children}</main>
        {/* TODO: Add your public Footer component here */}
      </body>
    </html>
  );
}
