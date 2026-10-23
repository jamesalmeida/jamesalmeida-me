import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ClickTracker } from "@/components/click-tracker";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE } from "@/data/site";
import { OG_IMAGE, OG_MEDIA } from "@/lib/og";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const personId = `${SITE.url}/#person`;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": personId,
      name: SITE.name,
      url: SITE.url,
      jobTitle: "AI consultant",
      email: `mailto:${SITE.email}`,
      sameAs: [SITE.linkedin, SITE.github, SITE.x],
    },
    {
      "@type": "ProfessionalService",
      name: "James Almeida — AI for individuals and small teams",
      url: `${SITE.url}/consulting`,
      description: SITE.description,
      areaServed: "US",
      provider: { "@id": personId },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: "%s — James Almeida",
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    ...OG_MEDIA,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
    creator: SITE.xHandle,
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f7f5ef" id="theme-color-meta" />
        {/* Sets the theme class before first paint (see lib/theme.ts). */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="text-[var(--foreground)] antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <ThemeProvider>{children}</ThemeProvider>
        {/* Vercel Web Analytics (page views, no cookies) and the funnel events
            for booking and email clicks (lib/visit.ts). */}
        <Analytics />
        <ClickTracker />
      </body>
    </html>
  );
}
