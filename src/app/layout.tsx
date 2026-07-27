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
  title: "Goal Garden by BambooTide — Grow ambitious goals daily",
  description:
    "Goal Garden by BambooTide: milestones, habits, calorie tools, calendar sync, and a living progress tree. Premium subscription supports the product — 10% of net proceeds to ocean & river cleanup.",
  authors: [{ name: "BambooTide", url: "https://bambootide.org" }],
  openGraph: {
    title: "Goal Garden by BambooTide",
    description:
      "Calm goal planner. Free account · Premium subscription. 10% of net proceeds to ocean & river cleanup.",
    url: "https://goal-garden.netlify.app",
    siteName: "Goal Garden · BambooTide",
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
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
