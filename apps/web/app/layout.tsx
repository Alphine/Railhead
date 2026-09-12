import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Railhead",
  description: "Batteries-included SaaS starter on Railway.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
