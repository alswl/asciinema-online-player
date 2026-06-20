import type { Metadata } from "next";
import "asciinema-player/dist/bundle/asciinema-player.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "asciinema online player — local-first terminal recorder viewer",
  description:
    "A static, frontend-only asciinema cast player. Open local .cast files in your browser — files never leave your device. Supports offline playback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
