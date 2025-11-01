import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Firefighter Dispatch System",
  description: "Automated Dispatch Location and Printing System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
