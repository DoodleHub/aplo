import type { Metadata, Viewport } from "next";
import { DM_Sans, Instrument_Sans } from "next/font/google";
import { ServiceWorker } from "@/components/pwa";
import { ThemeSync } from "@/components/theme";
import { ToastProvider } from "@/components/ui/toast";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const heading = Instrument_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "aplo — a little space for you",
    template: "%s · aplo",
  },
  description: "A gentle journal for big feelings and small moments.",
  applicationName: "aplo",
  appleWebApp: {
    capable: true,
    title: "aplo",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1d1a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${body.variable} ${heading.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <ThemeSync />
        <ServiceWorker />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
