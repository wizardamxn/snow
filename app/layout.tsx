import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Person schema — helps search engines connect "Aman Ahmad" searches to this
// site and its profiles, and can surface in rich results.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Aman Ahmad",
  url: SITE_URL,
  image: `${SITE_URL}/avatar.webp`,
  jobTitle: "Full Stack Developer",
  description:
    "Full-stack developer building end-to-end web and mobile products with React, Next.js, Node, and React Native.",
  email: "mailto:amank225566@gmail.com",
  worksFor: {
    "@type": "Organization",
    name: "Cerope",
  },
  sameAs: ["https://github.com/wizardamxn", "https://linkedin.com/in/amanahmad1"],
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
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
        />
        {children}
        {GA_MEASUREMENT_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
