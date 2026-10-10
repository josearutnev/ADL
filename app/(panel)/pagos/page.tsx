"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { BotonComprobante } from "@/components/boton-comprobante"
import { nombreRuta, useVista } from "@/components/datos-provider"
import { Cargando, ErrorBloque, Vacio } from "@/components/estados"
import { SelectorRuta } from "@/components/selector-ruta"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { atrasoDe, hoyLocal, saldoTrasPago } from "@/lib/calculo"
import { cargarLogo, datosPagoPdf, nombrePdf, pdfPago } from "@/lib/comprobante"
import { anularPago } from "@/lib/datos"
import { mensajeError } from "@/lib/errores"
import { fechaCorta, pesos } from "@/lib/formato"
import { useSesion } from "@/lib/sesion"
import { cn } from "cn"
import type { Pago } from "@/lib/tipos"

export default function Pagos() {
  const { perfil } = useSesion()
  const vista = useVista()
  const [vistaActual, setVistaActual] = useState<"pendiente" | "cobrado">("pendiente")
  const [anular, setAnular] = useState<Pago | null>(null)
  const [error, setError] = useState("")
  const [anulando, setAnulando] = useState(false)
  const hoy = hoyLocal()

  const pendientes = useMemo(() => {
    return (vista.prestamos ?? [])
      .filter((prestamo) => prestamo.saldo > 0)
      .sort(
        (a, b) =>
          atrasoDe(b, hoy) - atrasoDe(a, hoy) ||
          a.clienteNombre.localeCompare(b.clienteNombre, "es"),
      )
  }, [vista.prestamos, hoy])

  const cobrados = useMemo(() => {
    return [...(vista.pagos ?? [])].sort((a, b) =>
      a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.creadoEn.localeCompare(a.creadoEn),
    )
  }, [vista.pagos])

  const totalHoy = cobrados
    .filter((pago) => !pago.anulado && pago.fecha === hoy)
    .reduce((suma, pago) => suma + pago.monto, 0)

  if (!perfil) return null
  if (vista.error && !vista.prestamos) {
    return <ErrorBloque texto={vista.error} onReintentar={vista.reintentar} />
  }
  if (!vista.prestamos || !vista.pagos || !vista.rutas) return <Cargando texto="Buscando pagos…" />

  async function confirmar() {
    if (!anular || !perfil) return
    setAnulando(true)
    setError("")
    try {
      await anularPago(anular, perfil.uid)
      toast.success("Cobro anulado")
      setAnular(null)
    } catch (fallo) {
      setError(mensajeError(fallo))
    } finally {
      setAnulando(false)
    }
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-extrabold">Pagos</h1>
      <SelectorRuta />
      <p className="text-xl font-extrabold">Cobrado hoy {pesos(totalHoy)}</p>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["pendiente", "Pendiente"],
            ["cobrado", "Cobrado"],
          ] as const
        ).map(([valor, etiqueta]) => (
          <button
            key={valor}
            type="button"
            aria-pressed={vistaActual === valor}
            className={cn(
              "min-h-14 rounded-2xl border text-lg font-extrabold",
              vistaActual === valor ? "border-primary bg-primary text-primary-foreground" : "bg-card",
            )}
            onClick={() => setVistaActual(valor)}
          >
            {etiqueta}
          </button>
        ))}
      </div>
      {vista.error ? <ErrorBloque texto={vista.error} onReintentar={vista.reintentar} /> : null}
      {vistaActual === "pendiente" ? (
        pendientes.length === 0 ? (
          <Vacio titulo="Nadie debe" texto="En esta vista no hay saldos pendientes." />
        ) : (
          <ul className="grid gap-3">
            {pendientes.map((prestamo) => {
              const atraso = atrasoDe(prestamo, hoy)
              return (
                <li key={prestamo.id}>
                  <Link href={`/prestamos/${prestamo.id}`} className="block rounded-3xl border bg-card p-4">
                    <p className="text-xl font-extrabold">{prestamo.clienteNombre}</p>
                    <p className="text-base text-muted-foreground">
                      Cuota {pesos(prestamo.cuota)} · {nombreRuta(vista.rutas, prestamo.rutaId)}
                    </p>
                    <p className="mt-1 text-lg font-extrabold">Saldo {pesos(prestamo.saldo)}</p>
                    {atraso > 0 ? (
                      <p className="font-extrabold text-destructive">Atraso {pesos(atraso)}</p>
                    ) : (
                      <p className="text-muted-foreground">Al día</p>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )
      ) : cobrados.length === 0 ? (
        <Vacio titulo="Todavía no hay cobros" texto="Cuando registres un pago, aparece aquí." />
      ) : (
        <ul className="grid gap-3">
          {cobrados.map((pago) => (
            <li key={pago.id} className="rounded-3xl border bg-card p-4">
              <p className="text-xl font-extrabold">
                {pesos(pago.monto)}{" "}
                {pago.anulado ? <span className="text-base text-destructive">Anulado</span> : null}
              </p>
              <p className="text-base">{pago.clienteNombre}</p>
              <p className="text-base text-muted-foreground">
                {fechaCorta(pago.fecha)} · Cobró {pago.cobradorNombre} · {nombreRuta(vista.rutas, pago.rutaId)}
              </p>
              <div className="mt-3 grid gap-2">
                <BotonComprobante
                  nombre={nombrePdf("pago", pago.clienteNombre)}
                  crear={async () => {
                    const prestamo = (vista.prestamos ?? []).find((item) => item.id === pago.prestamoId)
                    const saldo = prestamo
                      ? saldoTrasPago(
                          prestamo.total,
                          pago.id,
                          (vista.pagos ?? []).filter((item) => item.prestamoId === prestamo.id),
                        )
                      : 0
                    return pdfPago(datosPagoPdf(pago, saldo), await cargarLogo())
                  }}
                />
                {perfil.rol === "admin" && !pago.anulado ? (
                  <Button type="button" variant="outline" onClick={() => setAnular(pago)}>
                    Anular
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={anular !== null} onOpenChange={(abierto) => { if (!abierto) setAnular(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Anular este cobro?</DialogTitle>
            <DialogDescription className="text-base">
              El dinero vuelve al saldo del préstamo. El cobro queda marcado, no se borra.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="font-semibold text-destructive">{error}</p> : null}
          <Button type="button" variant="outline" onClick={() => setAnular(null)}>
            No, dejarlo
          </Button>
          <Button type="button" variant="destructive" disabled={anulando} onClick={() => void confirmar()}>
            {anulando ? "Anulando…" : "Sí, anular"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
