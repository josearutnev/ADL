"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { nombreRuta, useDatos } from "@/components/datos-provider"
import { DialogoCobro } from "@/components/dialogo-cobro"
import { Cargando, ErrorBloque, Vacio } from "@/components/estados"
import { FormularioCliente } from "@/components/formulario-cliente"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { atrasoDe, hoyLocal } from "@/lib/calculo"
import { crearRuta, guardarCliente } from "@/lib/datos"
import { fechaCorta, pesos } from "@/lib/formato"
import { useSesion } from "@/lib/sesion"
import type { Prestamo } from "@/lib/tipos"

export default function FichaCliente() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { perfil } = useSesion()
  const datos = useDatos()
  const [editando, setEditando] = useState(false)
  const [cobro, setCobro] = useState<Prestamo | null>(null)
  const admin = perfil?.rol === "admin"
  const cliente = datos.clientes?.find((item) => item.id === id) ?? null
  const prestamos = (datos.prestamos ?? []).filter((item) => item.clienteId === id)
  const hoy = hoyLocal()

  if (datos.error && !datos.clientes) {
    return <ErrorBloque texto={datos.error} onReintentar={datos.reintentar} />
  }
  if (!datos.clientes || !perfil) return <Cargando />
  if (!cliente) {
    return (
      <Vacio
        titulo="No encontré ese cliente"
        texto="Puede estar en una ruta que no tienes asignada."
      />
    )
  }

  const saldo = prestamos.reduce((suma, prestamo) => suma + prestamo.saldo, 0)

  return (
    <div className="grid gap-5">
      <Link href="/clientes" className="text-base font-extrabold text-primary">
        ← Volver a clientes
      </Link>
      <div>
        <h1 className="text-3xl font-extrabold">{cliente.nombre}</h1>
        <p className="mt-1 text-lg">{cliente.identificacion}</p>
        <p className="text-base text-muted-foreground">
          {cliente.telefono || "Sin teléfono"} · {nombreRuta(datos.rutas, cliente.rutaId)}
        </p>
        <p className="mt-2 text-base">
          {cliente.puntoReferencia || "Sin punto de referencia"}
        </p>
        <p className="mt-3 text-2xl font-extrabold">Saldo {pesos(saldo)}</p>
      </div>
      {admin ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={() => setEditando(true)}>
            Editar datos
          </Button>
          <Button render={<Link href={`/prestamos/nuevo?cliente=${cliente.id}`} />}>
            Nuevo préstamo
          </Button>
        </div>
      ) : null}
      {prestamos.length === 0 ? (
        <Vacio titulo="Sin préstamos" texto="Este cliente todavía no tiene un préstamo." />
      ) : (
        <ul className="grid gap-3">
          {prestamos.map((prestamo) => {
            const atraso = atrasoDe(prestamo, hoy)
            return (
              <li key={prestamo.id} className="grid gap-3 rounded-3xl border bg-card p-4">
                <Link href={`/prestamos/${prestamo.id}`} className="text-lg font-extrabold">
                  {pesos(prestamo.montoEntregado)} · {prestamo.frecuencia === "diario" ? "Diario" : "Semanal"}
                </Link>
                <p className="text-base text-muted-foreground">
                  Desde {fechaCorta(prestamo.fechaInicio)} · Cuota {pesos(prestamo.cuota)}
                </p>
                <p className="text-xl font-extrabold">Saldo {pesos(prestamo.saldo)}</p>
                {atraso > 0 ? (
                  <p className="font-extrabold text-destructive">Atraso {pesos(atraso)}</p>
                ) : (
                  <p className="text-muted-foreground">Al día</p>
                )}
                {prestamo.saldo > 0 ? (
                  <Button type="button" size="lg" onClick={() => setCobro(prestamo)}>
                    Cobré
                  </Button>
                ) : (
                  <p className="font-bold">Pagado</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <Dialog open={editando} onOpenChange={setEditando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          <FormularioCliente
            inicial={cliente}
            rutas={datos.rutas ?? []}
            clientes={datos.clientes}
            puedeCrearRuta
            onCrearRuta={crearRuta}
            onCancelar={() => setEditando(false)}
            onGuardar={async (datosForm) => {
              await guardarCliente(cliente.id, datosForm, datos.prestamos ?? [])
              toast.success("Datos guardados")
              setEditando(false)
            }}
          />
        </DialogContent>
      </Dialog>
      <DialogoCobro
        prestamo={cobro}
        onCerrar={() => setCobro(null)}
        cobradorId={perfil.uid}
        cobradorNombre={perfil.nombre || perfil.usuario}
      />
    </div>
  )
}
