import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
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
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Goal Garden by BambooTide",
    description:
      "Calm goal planner. Free account · Premium subscription. 10% of net proceeds to ocean & river cleanup.",
    url: "https://garden.bambootide.org",
    siteName: "Goal Garden · BambooTide",
  },
};

const themeBoot = `(function(){try{var t=localStorage.getItem("goal-garden:theme");if(t!=="light"&&t!=="dark"){var r=localStorage.getItem("goal-garden:prefs");if(r){var p=JSON.parse(r);t=p&&p.theme==="light"?"light":"dark";}else t="dark";}var e=document.documentElement;e.classList.remove("dark","light");e.classList.add(t==="light"?"light":"dark");e.style.colorScheme=t==="light"?"light":"dark";}catch(e){document.documentElement.classList.add("dark");}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
