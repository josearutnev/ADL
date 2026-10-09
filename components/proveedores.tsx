"use client"

import { ThemeProvider } from "next-themes"
import type { ReactNode } from "react"
import { Toaster } from "@/components/ui/sonner"
import { ProveedorSesion } from "@/lib/sesion"

export function Proveedores({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
      <ProveedorSesion>
        {children}
        <Toaster position="top-center" />
      </ProveedorSesion>
    </ThemeProvider>
  )
}
