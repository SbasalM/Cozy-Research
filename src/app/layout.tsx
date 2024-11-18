import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from '@vercel/analytics/react';
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Cozy Research Assistant",
  description: "A tool for organizing research and citations with automatic local storage",
  // You can add more metadata if desired:
  // openGraph: {
  //   title: 'Cozy Research Assistant',
  //   description: 'A tool for organizing research and citations',
  //   type: 'website',
  // }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}