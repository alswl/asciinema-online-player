import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asciinema Online Player",
  description: "A static, frontend-only asciinema cast player.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
