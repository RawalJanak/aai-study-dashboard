import { ReticleDev } from './reticle-dev';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import data from "@/data.json";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Study dashboard",
  description: `AAI exam prep and the TOMORROW stack. Built ${data.builtAt}.`,
};

/**
 * Stamps the saved theme choice before first paint.
 *
 * The OS default needs no JS at all - globals.css handles it with a
 * prefers-color-scheme block. This only exists for the case the media query
 * cannot cover: a viewer whose explicit choice disagrees with their OS.
 * Without it that viewer gets a flash of the wrong theme, and every chart
 * re-reads its CSS custom properties mid-animation.
 */
const THEME_INIT = `try{var t=localStorage.getItem("theme");
if(t)document.documentElement.classList.add(t)}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">{process.env.NODE_ENV === 'development' ? <ReticleDev /> : null}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT }}
        />
        {children}
      </body>
    </html>
  );
}
