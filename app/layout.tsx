import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "James Almeida — AI Chat Portfolio",
  description:
    "A full-screen AI chat portfolio for exploring James Almeida's projects, experience, socials, and resume.",
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
        <meta name="theme-color" content="#000000" media="(max-width: 430px)" />
        <meta
          name="theme-color"
          content="#f7f5ef"
          media="(min-width: 431px)"
          id="theme-color-meta"
        />
      </head>
      <body className="text-[var(--foreground)] antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
