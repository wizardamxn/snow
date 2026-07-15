import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://amanahmad.xyz";
const TITLE = "Snow — Aman Ahmad's Pixel-Art Portfolio";
const DESCRIPTION =
  "An explorable pixel-art RPG portfolio for Aman Ahmad, full-stack developer — walk through a frontier town to find projects, skills, and experience.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Snow",
  },
  description: DESCRIPTION,
  keywords: [
    "Aman Ahmad",
    "portfolio",
    "full-stack developer",
    "software engineer",
    "pixel art",
    "interactive portfolio",
    "Next.js",
    "Pixi.js",
  ],
  authors: [{ name: "Aman Ahmad", url: "https://github.com/wizardamxn" }],
  creator: "Aman Ahmad",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Snow",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
