import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloseKey CRM | Real Estate, Organized",
  description: "A focused real estate CRM for leads, deals, follow-ups, client communication, invoices, and performance.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
