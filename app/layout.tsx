import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ApocalypseBackground from "@/components/ApocalypseBackground";
import ButtonFlash from "@/components/ButtonFlash";

export const metadata: Metadata = {
  title: "ABADDON — Гра виживання",
  description: "ABADDON — настільна гра виживання у світі після зомбі-апокаліпсису.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className="h-full">
      <body className="min-h-full">
        <ApocalypseBackground />
        <ButtonFlash />
        <Navbar />
        <main className="max-w-5xl mx-auto w-full px-4 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
