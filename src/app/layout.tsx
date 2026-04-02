import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CamClinic — Camera Service Management",
  description: "Camera service management for workshops and service centres.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full light" data-theme="light">
      <body className="h-full bg-gray-50 text-gray-900 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
