import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/AuthWrapper";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LinkSaaS - Modern URL Shortener",
  description: "A premium, fast, and secure URL shortening service.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthWrapper>
          {children}
        </AuthWrapper>
        {/* We need to install react-hot-toast if we use it, wait I'll use simple custom toast or install it */}
      </body>
    </html>
  );
}
