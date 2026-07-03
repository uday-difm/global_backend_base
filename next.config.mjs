/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Treat these as server external packages so Next.js server-side bundler doesn't try to bundle JSDOM stylesheet files.
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
  // SDK package no longer needed as external CMS proxy — backend is embedded directly.
  // Keep transpilePackages for any remaining SDK components still used in public layout.
  transpilePackages: ["@yourcompany/global-backend-next"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  webpack: (config, { isServer, nextRuntime }) => {
    if (!isServer || nextRuntime !== "nodejs") {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        dns: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("jsdom", "isomorphic-dompurify");
    }
    return config;
  },
  turbopack: {},
};

export default nextConfig;
