/**
 * Layout service — fetches global settings, navigation, and footer data
 * directly from the database for the infinium frontend, avoiding local HTTP requests.
 */
import prisma from "@/lib/prisma";

const FALLBACK = {
  siteName: "The Infinium",
  logoUrl: "/Logo.png",
  footerLogoUrl: "/FooterLogo.png",
  faviconUrl: "/favicon.ico",
  tagline: "Exposing Lending Lies. Empowering Business Truths.",
  navigation: [],
  footerLinks: [],
  copyright: `© ${new Date().getFullYear()} The Infinium. All rights reserved.`,
};

/**
 * Fetch all layout data from DB in parallel.
 * Returns { siteName, logoUrl, footerLogoUrl, tagline, faviconUrl, navigation, footerLinks, footerColumns, copyright, isActive, maintenanceMode, maintenanceMessage }.
 */
export async function getLayoutData() {
  const siteId = process.env.NEXT_PUBLIC_SITE_ID || "infinium";
  try {
    const [site, settings, legalPages] = await Promise.all([
      prisma.site.findUnique({
        where: { id: siteId },
        select: { isActive: true, deletedAt: true }
      }),
      prisma.globalSettings.findUnique({
        where: { siteId },
        select: { 
          websiteSettings: true,
          header: true,
          footer: true,
          navigation: true,
          compliance: true,
          analytics: true,
          securityControls: true,
          emailSettings: true,
          ctaConfig: true
        }
      }),
      prisma.legalPage.findMany({
        where: { siteId, deletedAt: null },
        select: { title: true, type: true }
      }).catch(() => [])
    ]);

    const isActive = site ? (site.isActive && !site.deletedAt) : false;
    const ws = settings?.websiteSettings || {};
    const header = settings?.header || {};
    const footer = settings?.footer || {};
    const navigation = settings?.navigation || {};
    const navItems = navigation.main || [];

    const dbLogoUrl = header.logoUrl || ws.logoUrl;
    const dbFooterLogoUrl = footer.logoUrl || (footer.columns && footer.columns[0]?.logoUrl) || dbLogoUrl;

    const mappedLegalLinks = (legalPages || []).map(page => {
      let slugType = page.type;
      if (page.type === "privacy") slugType = "privacy-policy";
      else if (page.type === "terms") slugType = "terms-of-use";
      else if (page.type === "cookies") slugType = "cookie-policy";
      
      return {
        label: page.title,
        url: `/legal/${slugType}`
      };
    });

    const baseFooterLinks = footer.links || footer.items || [];
    const footerLinks = baseFooterLinks.length > 0 ? [...baseFooterLinks] : [
      { label: "About", url: "/about" },
      { label: "Contact Us", url: "/contact" }
    ];

    mappedLegalLinks.forEach(link => {
      if (!footerLinks.some(fl => fl.url === link.url || fl.label.toLowerCase() === link.label.toLowerCase())) {
        footerLinks.push(link);
      }
    });

    const securityControls = settings?.securityControls || {};
    const publicSecurityControls = {
      recaptchaSiteKey: securityControls.recaptchaSiteKey || null
    };

    const emailSettings = settings?.emailSettings || {};
    const oneSignalAppId = emailSettings.oneSignalAppId || null;

    return {
      siteName: ws.title || FALLBACK.siteName,
      logoUrl: dbLogoUrl || FALLBACK.logoUrl,
      footerLogoUrl: dbFooterLogoUrl || FALLBACK.footerLogoUrl,
      tagline: ws.tagline || FALLBACK.tagline,
      faviconUrl: ws.favicon || FALLBACK.faviconUrl,
      navigation: navItems,
      footerLinks,
      footerColumns: footer.columns || [],
      copyright: footer.copyright || FALLBACK.copyright,
      isActive,
      maintenanceMode: ws.maintenanceMode === true,
      maintenanceMessage: ws.maintenanceMessage || "We are currently undergoing scheduled maintenance. Please check back shortly.",
      analytics: settings?.analytics || null,
      securityControls: publicSecurityControls,
      oneSignalAppId,
      rawSettings: {
        isActive,
        websiteSettings: ws,
        ctaConfig: settings?.ctaConfig || null,
        compliance: settings?.compliance || null,
        analytics: settings?.analytics || null,
        securityControls: publicSecurityControls,
        oneSignalAppId
      },
    };
  } catch (err) {
    console.error("getLayoutData failed, using fallback:", err);
    return {
      ...FALLBACK,
      isActive: true,
      maintenanceMode: false,
      maintenanceMessage: "",
    };
  }
}
