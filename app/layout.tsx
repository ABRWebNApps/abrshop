import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ABR TECH - Premium Technology",
  description: "Premium technology for the modern professional. We curate the finest hardware from around the globe.",
  icons: {
    icon: '/abrlogo.png',
    apple: '/abrlogo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/abrlogo.png" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-black text-white`}
      >
        <div className="min-h-screen flex flex-col bg-black">
          <Header />
          <main className="flex-grow bg-black">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
