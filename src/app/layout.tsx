import type { Metadata } from "next";
import { Inter, Press_Start_2P, Geist } from "next/font/google";
import "./globals.css";
import { EvmProvider } from "../components/providers/EvmProvider";
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
  metadataBase: new URL("https://www.norwynvillage.com"),
  title: "Norwyn Village - 2D Web3 Farming RPG",
  description: "A multiplayer web3 2D top-down farming simulation game built on Robinhood Chain.",
  // Favicon and the og:image/twitter:image share previews come from the
  // app/icon.png and app/opengraph-image.png/twitter-image.png file
  // conventions — Next.js wires up the <link>/<meta> tags automatically.
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
        <EvmProvider>
          {children}
        </EvmProvider>
      </body>
    </html>
  );
}
