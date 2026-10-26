import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const switzer = localFont({
  src: "./fonts/Switzer-Regular.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-switzer",
});

export const metadata: Metadata = {
  title: "Invoices",
  description: "Invoices and payments.",
  // Invoices are private documents shared by link; keep them out of search engines.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={switzer.variable}>
      <body>{children}</body>
    </html>
  );
}
