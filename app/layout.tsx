import type { Metadata } from "next";
import PasarAIWidget from "@/components/chatbot/PasarAIWidget";
import "./globals.css";

export const metadata: Metadata = {
  title: "Profit Pilot AI",
  description: "Southeast Asia product intelligence for Shopee, Lazada, and TikTok Shop sellers.",
  icons: {
    icon: "/profit-pilot-logo.png",
    shortcut: "/profit-pilot-logo.png",
    apple: "/profit-pilot-logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <PasarAIWidget />
      </body>
    </html>
  );
}
