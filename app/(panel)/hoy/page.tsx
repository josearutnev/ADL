"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { nombreRuta, useVista } from "@/components/datos-provider"
import { DialogoCobro } from "@/components/dialogo-cobro"
import { Cargando, ErrorBloque, Vacio } from "@/components/estados"
import { SelectorRuta } from "@/components/selector-ruta"
import { Button } from "@/components/ui/button"
import { atrasoDe, esDomingo, hoyLocal, sigueDebiendo, tocaHoy } from "@/lib/calculo"
import { fechaBonita, pesos } from "@/lib/formato"
import { useSesion } from "@/lib/sesion"
import type { Prestamo } from "@/lib/tipos"

export default function Hoy() {
  const { perfil } = useSesion()
  const { rutas, prestamos, pagos, error, reintentar, rutaEfectiva } = useVista()
  const [cobro, setCobro] = useState<Prestamo | null>(null)
  const hoy = hoyLocal()

  const { toca, atrasados, cobradoHoy } = useMemo(() => {
    const lista = prestamos ?? []
    return {
      toca: lista
        .filter((prestamo) => tocaHoy(prestamo, hoy))
        .sort((a, b) => atrasoDe(b, hoy) - atrasoDe(a, hoy) || a.clienteNombre.localeCompare(b.clienteNombre, "es")),
      atrasados: lista
        .filter((prestamo) => sigueDebiendo(prestamo, hoy))
        .sort((a, b) => atrasoDe(b, hoy) - atrasoDe(a, hoy) || a.clienteNombre.localeCompare(b.clienteNombre, "es")),
      cobradoHoy: (pagos ?? [])
        .filter((pago) => !pago.anulado && pago.fecha === hoy)
        .reduce((suma, pago) => suma + pago.monto, 0),
    }
  }, [prestamos, pagos, hoy])

  if (!perfil) return null
  if (error && !prestamos) return <ErrorBloque texto={error} onReintentar={reintentar} />
  if (!prestamos || !rutas) return <Cargando texto="Buscando quién paga hoy…" />
  if (perfil.rol === "cobrador" && perfil.rutaIds.length === 0) {
    return (
      <Vacio
        titulo="No tienes rutas"
        texto="Pide al administrador que te marque en cuáles cobras."
      />
    )
  }

  const domingo = esDomingo(hoy)

  return (
    <div className="grid gap-5">
      <div className="grid gap-3">
        <h1 className="text-3xl font-extrabold">Hoy</h1>
        <p className="text-lg text-muted-foreground">{fechaBonita(hoy)}</p>
        <SelectorRuta />
        <p className="text-xl font-extrabold">Cobrado hoy {pesos(cobradoHoy)}</p>
      </div>
      {error ? <ErrorBloque texto={error} onReintentar={reintentar} /> : null}
      {domingo && toca.length === 0 && atrasados.length === 0 ? (
        <Vacio
          titulo="Hoy es domingo"
          texto="El cobro diario descansa. El lunes sigues con la ruta."
        />
      ) : null}
      {!domingo && toca.length === 0 && atrasados.length === 0 ? (
        <Vacio
          titulo="Nadie paga hoy"
          texto={
            rutaEfectiva === "todas"
              ? "No hay cuotas para hoy en las rutas que ves."
              : "Nadie tiene cobro hoy en esta ruta."
          }
        />
      ) : null}
      {toca.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="text-xl font-extrabold">Les toca hoy</h2>
          {toca.map((prestamo) => (
            <Tarjeta
              key={prestamo.id}
              prestamo={prestamo}
              hoy={hoy}
              ruta={rutaEfectiva === "todas" ? nombreRuta(rutas, prestamo.rutaId) : ""}
              onCobrar={() => setCobro(prestamo)}
            />
          ))}
        </section>
      ) : null}
      {atrasados.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="text-xl font-extrabold">Siguen debiendo</h2>
          <p className="text-base text-muted-foreground">
            Ya se les acabaron las fechas y todavía tienen saldo.
          </p>
          {atrasados.map((prestamo) => (
            <Tarjeta
              key={prestamo.id}
              prestamo={prestamo}
              hoy={hoy}
              ruta={rutaEfectiva === "todas" ? nombreRuta(rutas, prestamo.rutaId) : ""}
              onCobrar={() => setCobro(prestamo)}
            />
          ))}
        </section>
      ) : null}
      <DialogoCobro
        prestamo={cobro}
        onCerrar={() => setCobro(null)}
        cobradorId={perfil.uid}
        cobradorNombre={perfil.nombre || perfil.usuario}
      />
    </div>
  )
}

function Tarjeta({
  prestamo,
  hoy,
  ruta,
  onCobrar,
}: {
  prestamo: Prestamo
  hoy: string
  ruta: string
  onCobrar: () => void
}) {
  const atraso = atrasoDe(prestamo, hoy)
  return (
    <article className="grid gap-3 rounded-3xl border bg-card p-4 shadow-sm">
      <div>
        <Link href={`/prestamos/${prestamo.id}`} className="text-xl font-extrabold">
          {prestamo.clienteNombre}
        </Link>
        <p className="text-base text-muted-foreground">
          {prestamo.identificacion}
          {ruta ? ` · ${ruta}` : ""}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-lg">
        <div>
          <dt className="text-sm text-muted-foreground">Cuota</dt>
          <dd className="font-extrabold">{pesos(prestamo.cuota)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Saldo</dt>
          <dd className="font-extrabold">{pesos(prestamo.saldo)}</dd>
        </div>
      </dl>
      {atraso > 0 ? (
        <p className="text-lg font-extrabold text-destructive">Atraso {pesos(atraso)}</p>
      ) : (
        <p className="text-base font-semibold text-muted-foreground">Al día</p>
      )}
      <Button type="button" size="lg" onClick={onCobrar}>
        Cobré
      </Button>
    </article>
  )
}
