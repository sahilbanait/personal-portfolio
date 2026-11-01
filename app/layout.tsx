import type { Metadata, Viewport } from "next";
import { profile } from "@/data/profile";
import { basePath, siteUrl } from "@/lib/site";
import localFont from "next/font/local";
import "./globals.css";

const anton = localFont({
  src: "../node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2",
  variable: "--font-anton",
  display: "swap",
  adjustFontFallback: "Arial",
});
const body = localFont({
  src: "../node_modules/@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2",
  weight: "400 900",
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: "Arial",
});

const title = `${profile.name} | ${profile.title}`;
const description = `${profile.title} in ${profile.location}. ${profile.pitch}`;

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    type: "website",
    locale: "en_AU",
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${profile.name}, ${profile.title}, ${profile.location}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
  icons: { icon: `${basePath}/favicon.svg` },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4b25e6",
};

// Runs before first paint, so there's no flash of the wrong theme. The .js class gates
// everything that would otherwise hide content when JavaScript is off.
const bootScript = `(function(){var r=document.documentElement;r.classList.add('js');try{var t=localStorage.getItem('sk-theme');if(t==='dark'||t==='bold')r.dataset.theme=t;if(localStorage.getItem('sk-paused')==='1')r.classList.add('paused')}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="bold"
      className={`${anton.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
