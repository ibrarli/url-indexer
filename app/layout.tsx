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

export const metadata: Metadata = {
  title: {
    default: "Aral Studio | Google Indexing Engine",
    template: "%s | Aral Studio",
  },
  description:
    "Automated Google Search Console batch URL indexing, status inspection, and ranking analytics workspace built for web teams and developers.",
  keywords: [
    "Google Indexing API",
    "Google Search Console",
    "SEO Tools",
    "URL Inspection",
    "Batch Indexing Engine",
    "Aral Studio",
  ],
  authors: [{ name: "Aral Studio" }],
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans">
        {children}
      </body>
    </html>
  );
}