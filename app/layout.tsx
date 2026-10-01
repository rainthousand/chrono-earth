import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "./components/ServiceWorkerRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chrono Earth · 时光地球",
  description: "转动地球，拨动时间，让沉睡的世界历史在眼前苏醒。",
  manifest: "/manifest.webmanifest",
  applicationName: "Chrono Earth",
  appleWebApp: {
    capable: true,
    title: "时光地球",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.svg?v=20261001", sizes: "any", type: "image/svg+xml" },
    ],
    apple: "/icons/chrono-earth-192.png",
  },
  openGraph: {
    title: "Chrono Earth · 时光地球",
    description: "转动地球，拨动时间，让沉睡的世界历史在眼前苏醒。",
    type: "website",
    locale: "zh_CN",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Chrono Earth 时光地球：一座可旋转、可穿越时间的世界历史档案馆",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chrono Earth · 时光地球",
    description: "转动地球，拨动时间，让沉睡的世界历史在眼前苏醒。",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#070a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
