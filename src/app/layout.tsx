import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Sorli", template: "%s · Sorli" },
  description: "Benvinguts a Sorli",
  robots: { index: false, follow: false }, // xarxa privada: fora dels cercadors
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca">
      <body>{children}</body>
    </html>
  );
}
