import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Espace famille | Île-de-France Mobilités",
  description: "Créez un espace famille pour gérer les titres de transport de vos enfants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
