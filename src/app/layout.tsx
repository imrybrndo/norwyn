import type { Metadata } from "next";
import { Inter, Press_Start_2P, Geist } from "next/font/google";
import "./globals.css";
import { SolanaProvider } from "../components/providers/SolanaProvider";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const pressStart2P = Press_Start_2P({
  weight: "400",
  variable: "--font-pixel",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Helge Village - 2D Web3 Farming RPG",
  description: "A multiplayer web3 2D top-down farming simulation game built on Solana.",
  icons: {
    icon: "/Logo-Transparant.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", inter.variable, pressStart2P.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col font-sans">
        <SolanaProvider>
          {children}
        </SolanaProvider>
      </body>
    </html>
  );
}
