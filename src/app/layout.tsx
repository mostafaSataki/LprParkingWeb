import type { Metadata } from "next";
import "./globals.css";
import "./rtl-dialog.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "سیستم مدیریت پارکینگ هوشمند",
  description: "سیستم مدیریت پارکینگ با پلاک‌خوان خودکار و دو دوربین ورودی و خروجی",
  keywords: ["پارکینگ", "پلاک‌خوان", "ANPR", "مدیریت پارکینگ", "دوربین"],
  authors: [{ name: "تیم توسعه پارکینگ هوشمند" }],
  openGraph: {
    title: "سیستم مدیریت پارکینگ هوشمند",
    description: "سیستم مدیریت پارکینگ با پلاک‌خوان خودکار و دو دوربین ورودی و خروجی",
    url: "https://parking.example.com",
    siteName: "سیستم پارکینگ هوشمند",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "سیستم مدیریت پارکینگ هوشمند",
    description: "سیستم مدیریت پارکینگ با پلاک‌خوان خودکار و دو دوربین ورودی و خروجی",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/gh/rastikerdar/iransans@v4.0.0/font-face.css" rel="stylesheet" />
      </head>
      <body
        className="font-sans antialiased bg-background text-foreground"
        style={{
          fontFamily: 'IranSans, Vazirmatn, sans-serif',
          fontFeatureSettings: '"tnum"'
        }}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
