"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Cargando } from "@/components/estados"
import { useSesion } from "@/lib/sesion"

export default function Inicio() {
  const router = useRouter()
  const { estado, adminListo } = useSesion()

  useEffect(() => {
    if (estado === "cargando") return
    if (estado === "listo") {
      router.replace("/hoy")
      return
    }
    if (estado === "anon" && !adminListo) {
      router.replace("/empezar")
      return
    }
    router.replace("/entrar")
  }, [estado, adminListo, router])

  return <Cargando texto="Abriendo ADL…" />
}
