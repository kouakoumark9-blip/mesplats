import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { FournisseurToasts } from "@/components/ui/toast";
import { appUrl } from "@/lib/env";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: "Mesplats — Menu QR et commande en ligne pour restaurants",
    template: "%s · Mesplats",
  },
  description:
    "Créez le menu QR de votre restaurant, prenez les commandes sur place et à emporter, et recevez-les en temps réel. Pensé pour la Côte d'Ivoire et l'Afrique de l'Ouest.",
  manifest: "/manifest.webmanifest",
  applicationName: "Mesplats",
  appleWebApp: {
    capable: true,
    title: "Mesplats",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/icone.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icone-192.png" }],
  },
  openGraph: {
    type: "website",
    locale: "fr_CI",
    siteName: "Mesplats",
    title: "Mesplats — Menu QR et commande en ligne pour restaurants",
    description:
      "Menu QR, commandes sur place et à emporter, écran de service en temps réel. Prix en FCFA, paiement Orange Money, Moov Money et MTN MoMo.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#e4572e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        {/*
          Restaure le thème sombre avant le premier rendu pour éviter tout
          scintillement sur les écrans de service et de caisse.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("afrimenu-theme")==="sombre"){document.documentElement.classList.add("dark")}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh bg-slate-50 text-slate-900">
        <FournisseurToasts>{children}</FournisseurToasts>
      </body>
    </html>
  );
}
