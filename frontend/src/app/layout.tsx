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
  title: "Grand Hotel",
  description: "Moderne Hotel-Verwaltungssoftware",
};

import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/Sidebar";

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
        <Providers>
          <div className="flex h-screen w-full bg-slate-50/50 dark:bg-slate-950 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
