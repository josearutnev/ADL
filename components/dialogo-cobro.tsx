"use client"

import { useState } from "react"
import { toast } from "sonner"
import { BotonComprobante } from "@/components/boton-comprobante"
import { Button } from "@/components/ui/button"
import { cargarLogo, nombrePdf, pdfPago, type DatosPagoPdf } from "@/lib/comprobante"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { atrasoDe, hoyLocal } from "@/lib/calculo"
import { registrarPago } from "@/lib/datos"
import { mensajeError } from "@/lib/errores"
import { pesos, soloDigitos } from "@/lib/formato"
import type { Prestamo } from "@/lib/tipos"

export function DialogoCobro({
  prestamo,
  onCerrar,
  cobradorId,
  cobradorNombre,
}: {
  prestamo: Prestamo | null
  onCerrar: () => void
  cobradorId: string
  cobradorNombre: string
}) {
  if (!prestamo) return null

  return (
    <Dialog open onOpenChange={(abierto) => { if (!abierto) onCerrar() }}>
      <DialogContent>
        <FormularioCobro
          key={prestamo.id}
          prestamo={prestamo}
          onCerrar={onCerrar}
          cobradorId={cobradorId}
          cobradorNombre={cobradorNombre}
        />
      </DialogContent>
    </Dialog>
  )
}

function FormularioCobro({
  prestamo,
  onCerrar,
  cobradorId,
  cobradorNombre,
}: {
  prestamo: Prestamo
  onCerrar: () => void
  cobradorId: string
  cobradorNombre: string
}) {
  const [monto, setMonto] = useState(String(Math.min(prestamo.cuota, prestamo.saldo)))
  const [fecha, setFecha] = useState(hoyLocal())
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const [listo, setListo] = useState<DatosPagoPdf | null>(null)
  const numero = Number(soloDigitos(monto))
  const hoy = hoyLocal()
  const atraso = atrasoDe(prestamo, hoy)

  async function guardar() {
    if (!Number.isInteger(numero) || numero <= 0) {
      setError("Escribe cuánto te entregó, en pesos.")
      return
    }
    if (numero > prestamo.saldo) {
      setError(`El monto supera el saldo de ${pesos(prestamo.saldo)}.`)
      return
    }
    setGuardando(true)
    setError("")
    try {
      await registrarPago({
        prestamo,
        monto: numero,
        fecha,
        cobradorId,
        cobradorNombre,
      })
      const saldo = prestamo.saldo - numero
      toast.success(`Listo. El saldo queda en ${pesos(saldo)}.`)
      setListo({
        cliente: prestamo.clienteNombre,
        fecha,
        monto: numero,
        saldo,
        cobrador: cobradorNombre,
      })
    } catch (fallo) {
      setError(mensajeError(fallo))
    } finally {
      setGuardando(false)
    }
  }

  if (listo) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Cobro guardado</DialogTitle>
          <DialogDescription className="text-base">
            {listo.cliente}. El saldo queda en {pesos(listo.saldo)}.
          </DialogDescription>
        </DialogHeader>
        <BotonComprobante
          variante="default"
          nombre={nombrePdf("pago", listo.cliente)}
          crear={async () => pdfPago(listo, await cargarLogo())}
        />
        <Button type="button" size="lg" variant="outline" onClick={onCerrar}>
          Cerrar
        </Button>
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cobro de {prestamo.clienteNombre}</DialogTitle>
        <DialogDescription className="text-base">
          Cuota {pesos(prestamo.cuota)} · Saldo {pesos(prestamo.saldo)}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        {atraso > 0 ? (
          <p className="text-lg font-extrabold text-destructive">Lleva {pesos(atraso)} de atraso</p>
        ) : (
          <p className="text-base text-muted-foreground">Va al día con los días anteriores.</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setMonto(String(Math.min(prestamo.cuota, prestamo.saldo)))}
          >
            La cuota
          </Button>
          <Button type="button" variant="outline" onClick={() => setMonto(String(prestamo.saldo))}>
            Todo el saldo
          </Button>
        </div>
        <label className="grid gap-2">
          <span className="text-base font-bold">¿Cuánto te entregó?</span>
          <Input
            inputMode="numeric"
            className="h-16 text-center text-3xl font-extrabold"
            value={monto}
            onChange={(evento) => setMonto(soloDigitos(evento.target.value))}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-base font-bold">Fecha</span>
          <Input type="date" value={fecha} onChange={(evento) => setFecha(evento.target.value)} />
        </label>
        <p className="text-base">
          Quedaría un saldo de{" "}
          <strong>{pesos(Math.max(0, prestamo.saldo - (Number.isFinite(numero) ? numero : 0)))}</strong>
        </p>
        {error ? <p className="text-base font-semibold text-destructive">{error}</p> : null}
        <Button type="button" size="lg" disabled={guardando} onClick={() => void guardar()}>
          {guardando ? "Guardando…" : "Guardar cobro"}
        </Button>
      </div>
    </>
  )
}
