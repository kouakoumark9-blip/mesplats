import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Les photos de plats et les logos sont servis depuis Vercel Blob.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
    ],
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 480, 640, 828, 1080, 1200],
  },

  // Réduit le poids du bundle : seules les icônes Lucide réellement utilisées
  // sont incluses (important pour les connexions 3G).
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },

  async headers() {
    return [
      {
        source: "/:chemin*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          /*
           * ⚠️ Volontairement AUCUN en-tête `X-Frame-Options` ni
           * `Content-Security-Policy: frame-ancestors` : le menu public et le
           * back-office doivent pouvoir être affichés dans des aperçus intégrés
           * (outils de prévisualisation, tableaux de bord partenaires).
           * Si vous préférez interdire l'intégration en iframe, ajoutez :
           *   { key: "X-Frame-Options", value: "DENY" }
           */
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
      {
        // Le service worker PWA ne doit jamais être mis en cache par le CDN.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
