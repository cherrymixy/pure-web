import type { Metadata } from "next";
import { MobileNotice } from "@/components/ui/mobile-notice";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "PURE Expert Lab",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <ToastProvider>{children}</ToastProvider>
        <MobileNotice />
      </body>
    </html>
  );
}
