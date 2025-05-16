import type { Metadata } from "next";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "./WalletProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TV DAO - Decentralized TV Channels",
  description: "Decentralized TV channels powered by Solana. Vote, earn, and watch content you love.",
  icons: {
    icon: "/tvdao-logo.png",
    apple: "/tvdao-logo.png",
  },
  openGraph: {
    title: "TV DAO: Decentralized Television Platform",
    description: "Earn while you watch. TV DAO is a decentralized television platform built on Solana.",
    url: "https://tvdao.io",
    type: "website",
    images: [
      {
        url: "https://raw.githubusercontent.com/Samisha68/tvdao/main/public/tvdao-banner.png",
        width: 1200,
        height: 630,
        alt: "TV DAO Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TV DAO: Decentralized Television Platform",
    description: "Earn while you watch. TV DAO is a decentralized television platform built on Solana.",
    images: [
      "https://raw.githubusercontent.com/Samisha68/tvdao/main/public/tvdao-banner.png"
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} antialiased`}
      >
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
