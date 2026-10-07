import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE } from "@/data/site";
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
      jobTitle: "AI Consultant & Software Engineer",
      email: `mailto:${SITE.email}`,
      sameAs: [SITE.linkedin, SITE.github],
    },
    {
      "@type": "ProfessionalService",
      name: "James Almeida — AI consulting",
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
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" media="(max-width: 430px)" />
        <meta
          name="theme-color"
          content="#f7f5ef"
          media="(min-width: 431px)"
          id="theme-color-meta"
        />
      </head>
      <body className="text-[var(--foreground)] antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
