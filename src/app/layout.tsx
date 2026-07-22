import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Birthday Game Avatar — maak een persoonlijke verjaardagsgame",
  description:
    "Upload een foto, vul de feestgegevens in en deel binnen een minuut een gepersonaliseerde verjaardagsgame via WhatsApp.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className={nunito.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
