import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ABADDON — Гра виживання",
  description: "ABADDON — настільна гра виживання у світі після зомбі-апокаліпсису.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className="h-full">
      <body className="min-h-full" style={{ background: '#0a0a0a' }}>
        <main className="max-w-3xl mx-auto w-full px-4 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
