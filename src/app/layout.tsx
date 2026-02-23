import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OctoBoost | Get Discovered on Google and Cited by AI",
  description:
    "Automated SEO articles optimized for search engines and AI citations. From keyword research to multi-platform publishing. Zero writing.",
  openGraph: {
    title: "OctoBoost | Get Discovered on Google and Cited by AI",
    description:
      "Automated SEO articles optimized for search engines and AI citations. Zero writing.",
    images: [{ url: "/og-image-v1.png", width: 1200, height: 630 }],
    type: "website",
    siteName: "OctoBoost",
  },
  twitter: {
    card: "summary_large_image",
    title: "OctoBoost | Get Discovered on Google and Cited by AI",
    description:
      "Automated SEO articles optimized for search engines and AI citations. Zero writing.",
    images: ["/og-image-v1.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}

      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
