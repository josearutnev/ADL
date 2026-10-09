"use client"

import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { DatosProvider } from "@/components/datos-provider"
import { Cargando } from "@/components/estados"
import { Panel } from "@/components/panel"
import { useSesion } from "@/lib/sesion"

export default function LayoutPanel({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { estado, adminListo } = useSesion()

  useEffect(() => {
    if (estado === "cargando" || estado === "listo") return
    if (estado === "anon" && !adminListo) {
      router.replace("/empezar")
      return
    }
    router.replace("/entrar")
  }, [estado, adminListo, router])

  if (estado !== "listo") return <Cargando texto="Abriendo ADL…" />

  return (
    <DatosProvider>
      <Panel>{children}</Panel>
    </DatosProvider>
  )
}
