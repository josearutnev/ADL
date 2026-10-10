"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { entregarPdf } from "@/lib/entregar-pdf"

export function BotonComprobante({
  nombre,
  crear,
  variante = "outline",
}: {
  nombre: string
  crear: () => Promise<Uint8Array>
  variante?: "default" | "outline"
}) {
  const [ocupado, setOcupado] = useState(false)

  async function pulsar() {
    if (ocupado) return
    setOcupado(true)
    try {
      const bytes = await crear()
      const modo = await entregarPdf(nombre, bytes)
      if (modo === "descargado") toast.success("Comprobante descargado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pude armar el comprobante.")
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Button
      type="button"
      size="lg"
      variant={variante}
      className="w-full"
      disabled={ocupado}
      onClick={() => void pulsar()}
    >
      {ocupado ? "Preparando…" : "Comprobante"}
    </Button>
  )
}
