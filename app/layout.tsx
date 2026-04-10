import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "James Almeida — AI Chat Portfolio",
  description:
    "A full-screen AI chat portfolio for exploring James Almeida's projects, experience, socials, and resume.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}
