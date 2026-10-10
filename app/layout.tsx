import type { Metadata, Viewport } from "next"
import { Nunito } from "next/font/google"
import { Proveedores } from "@/components/proveedores"
import "./globals.css"

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-nunito",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#232426",
}

export const metadata: Metadata = {
  title: "ADL Préstamos",
  description: "Cobro del día, clientes y préstamos.",
  applicationName: "ADL Préstamos",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "ADL",
    statusBarStyle: "black-translucent",
  },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${nunito.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <Proveedores>{children}</Proveedores>
      </body>
    </html>
  )
}
