import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import { Proveedores } from "@/components/proveedores"
import "./globals.css"

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-nunito",
})

export const metadata: Metadata = {
  title: "ADL Préstamos",
  description: "Cobro del día, clientes y préstamos.",
  icons: { icon: "/logo-adl.jpg" },
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
