import type { Metadata } from "next";
import { Poppins, Cormorant_Garamond } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import LogoutButton from "@/components/logoutButton";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Trippin",
  description: "Plan group trips with your friends — itineraries and expenses, all in one place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${cormorant.variable} antialiased flex flex-col min-h-screen`}>
        <header className="p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 w-fit">
            <Image
              src="/TrippinLogo.png"
              alt="Trippin logo"
              width={50}
              height={50}
              className="rounded"
            />
            <span className="text-3xl font-serif italic text-primary">
              Trippin
            </span>
          </Link>
          <LogoutButton />
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}