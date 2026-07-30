import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chrono Earth · 时光地球",
  description: "转动地球，拨动时间，让沉睡的世界历史在眼前苏醒。",
  openGraph: {
    title: "Chrono Earth · 时光地球",
    description: "转动地球，拨动时间，让沉睡的世界历史在眼前苏醒。",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
