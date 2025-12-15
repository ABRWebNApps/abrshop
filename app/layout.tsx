import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AIChatAssistant from "@/components/AIChatAssistant";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ABR TECH - Quality Technology",
  description:
    "Quality technology solutions for individuals and business owners. Reliable hardware and gadgets for your everyday needs.",
  icons: {
    icon: "/abrlogo.png",
    apple: "/abrlogo.png",
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
          <main className="flex-grow bg-black">{children}</main>
          <Footer />
          <AIChatAssistant />
        </div>
      </body>
    </html>
  );
}
