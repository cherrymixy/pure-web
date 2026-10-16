import type { Metadata } from "next";
import localFont from "next/font/local";
import { MobileNotice } from "@/components/ui/mobile-notice";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

// Figma F / Typography: Google Sans Flex only (OFL, app/fonts/OFL-GoogleSansFlex.txt). Variable: wght 1–1000, wdth, opsz, ROND, slnt.
const googleSansFlex = localFont({
  src: "./fonts/GoogleSansFlex.ttf",
  weight: "1 1000",
  style: "normal",
  display: "swap",
  variable: "--font-google-sans-flex",
});

// Figma mono text (signature "How it maps", versions): Roboto Mono (OFL, app/fonts/OFL-RobotoMono.txt), local for offline.
const robotoMono = localFont({
  src: "./fonts/RobotoMono.ttf",
  weight: "100 700",
  style: "normal",
  display: "swap",
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "PURE Expert Lab",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${googleSansFlex.variable} ${robotoMono.variable}`}>
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <ToastProvider>{children}</ToastProvider>
        <MobileNotice />
      </body>
    </html>
  );
}
