"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { BotonComprobante } from "@/components/boton-comprobante"
import { nombreRuta, useDatos } from "@/components/datos-provider"
import { DialogoCobro } from "@/components/dialogo-cobro"
import { Cargando, ErrorBloque, Vacio } from "@/components/estados"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { atrasoDe, fechasCuotas, hoyLocal, saldoTrasPago } from "@/lib/calculo"
import { cargarLogo, datosPagoPdf, datosPrestamoPdf, nombrePdf, pdfPago, pdfPrestamo } from "@/lib/comprobante"
import { anularPago } from "@/lib/datos"
import { mensajeError } from "@/lib/errores"
import { fechaBonita, fechaCorta, pesos } from "@/lib/formato"
import { useSesion } from "@/lib/sesion"
import type { Pago } from "@/lib/tipos"

export default function FichaPrestamo() {
  const params = useParams<{ id: string }>()
  const { perfil } = useSesion()
  const datos = useDatos()
  const [cobroAbierto, setCobroAbierto] = useState(false)
  const [anular, setAnular] = useState<Pago | null>(null)
  const [anulando, setAnulando] = useState(false)
  const [error, setError] = useState("")
  const hoy = hoyLocal()
  const prestamo = datos.prestamos?.find((item) => item.id === params.id) ?? null
  const pagos = (datos.pagos ?? [])
    .filter((pago) => pago.prestamoId === params.id)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.creadoEn.localeCompare(a.creadoEn)))

  if (datos.error && !datos.prestamos) {
    return <ErrorBloque texto={datos.error} onReintentar={datos.reintentar} />
  }
  if (!datos.prestamos || !perfil) return <Cargando />
  if (!prestamo) {
    return (
      <Vacio
        titulo="No encontré ese préstamo"
        texto="Puede estar en una ruta que no tienes asignada."
      />
    )
  }

  const fechas = fechasCuotas(prestamo.fechaInicio, prestamo.numeroCuotas, prestamo.frecuencia)
  const atraso = atrasoDe(prestamo, hoy)
  const pagado = prestamo.total - prestamo.saldo

  async function confirmarAnular() {
    if (!anular || !perfil) return
    setAnulando(true)
    setError("")
    try {
      await anularPago(anular, perfil.uid)
      toast.success("Cobro anulado. El saldo volvió a subir.")
      setAnular(null)
    } catch (fallo) {
      setError(mensajeError(fallo))
    } finally {
      setAnulando(false)
    }
  }

  return (
    <div className="grid gap-5">
      <Link href={`/clientes/${prestamo.clienteId}`} className="text-base font-extrabold text-primary">
        ← Volver al cliente
      </Link>
      <div>
        <h1 className="text-3xl font-extrabold">{prestamo.clienteNombre}</h1>
        <p className="text-lg text-muted-foreground">
          {prestamo.identificacion} · {nombreRuta(datos.rutas, prestamo.rutaId)}
        </p>
      </div>
      <section className="grid grid-cols-2 gap-3 rounded-3xl border bg-card p-4">
        <Dato etiqueta="Entregas" valor={pesos(prestamo.montoEntregado)} />
        <Dato etiqueta="Rédito" valor={pesos(prestamo.redito)} />
        <Dato etiqueta="Total" valor={pesos(prestamo.total)} />
        <Dato etiqueta="Cuota" valor={pesos(prestamo.cuota)} />
        <Dato etiqueta="Saldo" valor={pesos(prestamo.saldo)} />
        <Dato etiqueta="Pagado" valor={pesos(pagado)} />
      </section>
      <p className="text-base leading-relaxed">
        {prestamo.frecuencia === "diario" ? "Diario, de lunes a sábado." : "Cada semana."}{" "}
        {prestamo.numeroCuotas} cuotas, desde {fechas[0] ? fechaBonita(fechas[0]) : "—"} hasta{" "}
        {fechas.at(-1) ? fechaBonita(fechas.at(-1) ?? "") : "—"}.
        {prestamo.cuota !== prestamo.cuotaUltima
          ? ` La última cuota es ${pesos(prestamo.cuotaUltima)}.`
          : ""}
      </p>
      {atraso > 0 ? (
        <p className="text-xl font-extrabold text-destructive">Atraso {pesos(atraso)}</p>
      ) : (
        <p className="text-lg font-bold text-muted-foreground">Al día</p>
      )}
      <BotonComprobante
        nombre={nombrePdf("prestamo", prestamo.clienteNombre)}
        crear={async () =>
          pdfPrestamo(datosPrestamoPdf(prestamo, nombreRuta(datos.rutas, prestamo.rutaId)), await cargarLogo())
        }
      />
      {prestamo.saldo > 0 ? (
        <Button type="button" size="lg" onClick={() => setCobroAbierto(true)}>
          Cobré
        </Button>
      ) : (
        <p className="text-lg font-extrabold">Este préstamo ya está pagado.</p>
      )}
      <section className="grid gap-3">
        <h2 className="text-2xl font-extrabold">Cobros</h2>
        {pagos.length === 0 ? (
          <Vacio titulo="Sin cobros" texto="Cuando alguien pague, el cobro queda aquí." />
        ) : (
          pagos.map((pago) => (
            <article
              key={pago.id}
              className="rounded-3xl border bg-card p-4"
            >
              <p className="text-xl font-extrabold">
                {pesos(pago.monto)}{" "}
                {pago.anulado ? <span className="text-base text-destructive">Anulado</span> : null}
              </p>
              <p className="text-base text-muted-foreground">
                {fechaCorta(pago.fecha)} · Cobró {pago.cobradorNombre}
              </p>
              <div className="mt-3 grid gap-2">
                <BotonComprobante
                  nombre={nombrePdf("pago", pago.clienteNombre)}
                  crear={async () =>
                    pdfPago(
                      datosPagoPdf(
                        pago,
                        saldoTrasPago(
                          prestamo.total,
                          pago.id,
                          pagos.filter((item) => item.prestamoId === prestamo.id),
                        ),
                      ),
                      await cargarLogo(),
                    )
                  }
                />
                {perfil.rol === "admin" && !pago.anulado ? (
                  <Button type="button" variant="outline" onClick={() => setAnular(pago)}>
                    Anular
                  </Button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>
      <DialogoCobro
        prestamo={cobroAbierto ? prestamo : null}
        onCerrar={() => setCobroAbierto(false)}
        cobradorId={perfil.uid}
        cobradorNombre={perfil.nombre || perfil.usuario}
      />
      <Dialog open={anular !== null} onOpenChange={(abierto) => { if (!abierto) setAnular(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Anular este cobro?</DialogTitle>
            <DialogDescription className="text-base">
              {anular ? `Devuelve ${pesos(anular.monto)} al saldo. No se borra: queda marcado como anulado.` : ""}
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="font-semibold text-destructive">{error}</p> : null}
          <Button type="button" variant="outline" onClick={() => setAnular(null)}>
            No, dejarlo
          </Button>
          <Button type="button" variant="destructive" disabled={anulando} onClick={() => void confirmarAnular()}>
            {anulando ? "Anulando…" : "Sí, anular"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{etiqueta}</p>
      <p className="text-xl font-extrabold">{valor}</p>
    </div>
  )
}
