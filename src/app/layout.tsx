import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "./WalletProvider";

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
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/tvdao-logo.png', type: 'image/png' }
    ],
    apple: '/tvdao-logo.png',
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
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.vercel.com/css2?family=Geist+Mono:wght@300..700&family=Geist+Sans:wght@300..700&display=swap"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/tvdao-logo.png" type="image/png" />
        <link rel="shortcut icon" href="/tvdao-logo.png" />
      </head>
      <body
        className={`${bebasNeue.variable} antialiased`}
      >
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}