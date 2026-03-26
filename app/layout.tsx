import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caption Copilot — Instagram投稿キャプション生成",
  description: "Instagramフィード投稿向けのキャプション生成ツール",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#FAFAF8] text-[#1A1A1A]">{children}</body>
    </html>
  );
}
