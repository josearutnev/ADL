"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { nombreRuta, useDatos, useVista } from "@/components/datos-provider"
import { Cargando, ErrorBloque, Vacio } from "@/components/estados"
import { FormularioCliente } from "@/components/formulario-cliente"
import { SelectorRuta } from "@/components/selector-ruta"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { crearRuta, guardarCliente } from "@/lib/datos"
import { pesos } from "@/lib/formato"
import { useSesion } from "@/lib/sesion"

export default function Clientes() {
  const { perfil } = useSesion()
  const todo = useDatos()
  const vista = useVista()
  const [busqueda, setBusqueda] = useState("")
  const [abierto, setAbierto] = useState(false)
  const admin = perfil?.rol === "admin"

  const saldos = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const prestamo of todo.prestamos ?? []) {
      mapa.set(prestamo.clienteId, (mapa.get(prestamo.clienteId) ?? 0) + prestamo.saldo)
    }
    return mapa
  }, [todo.prestamos])

  const consulta = busqueda.trim().toLowerCase()
  const lista = (vista.clientes ?? []).filter((cliente) => {
    if (!consulta) return true
    return (
      cliente.nombre.toLowerCase().includes(consulta) ||
      cliente.identificacion.toLowerCase().includes(consulta) ||
      cliente.telefono.toLowerCase().includes(consulta)
    )
  })

  if (!perfil) return null
  if (vista.error && !vista.clientes) {
    return <ErrorBloque texto={vista.error} onReintentar={vista.reintentar} />
  }
  if (!vista.clientes || !vista.rutas) return <Cargando texto="Buscando clientes…" />

  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Clientes</h1>
      </div>
      <SelectorRuta />
      <Input
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
        placeholder="Buscar por nombre o cédula"
        aria-label="Buscar por nombre o cédula"
      />
      {admin ? (
        <Button type="button" size="lg" onClick={() => setAbierto(true)}>
          Nuevo cliente
        </Button>
      ) : null}
      {vista.error ? <ErrorBloque texto={vista.error} onReintentar={vista.reintentar} /> : null}
      {lista.length === 0 ? (
        <Vacio
          titulo={consulta ? "Nadie coincide" : "Todavía no hay clientes"}
          texto={
            consulta
              ? "Prueba con otro nombre o con la cédula."
              : "Cuando haya clientes en la ruta, aparecen aquí."
          }
        />
      ) : (
        <ul className="grid gap-2">
          {lista.map((cliente) => (
            <li key={cliente.id}>
              <Link
                href={`/clientes/${cliente.id}`}
                className="block rounded-3xl border bg-card px-4 py-4"
              >
                <p className="text-xl font-extrabold">{cliente.nombre}</p>
                <p className="text-base text-muted-foreground">
                  {cliente.identificacion} · {nombreRuta(vista.rutas, cliente.rutaId)}
                </p>
                <p className="mt-1 text-lg font-bold">
                  Saldo {pesos(saldos.get(cliente.id) ?? 0)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
          </DialogHeader>
          <FormularioCliente
            rutas={todo.rutas ?? []}
            clientes={todo.clientes ?? []}
            puedeCrearRuta={admin}
            onCrearRuta={crearRuta}
            onCancelar={() => setAbierto(false)}
            onGuardar={async (datos) => {
              await guardarCliente(null, datos, todo.prestamos ?? [])
              toast.success("Cliente guardado")
              setAbierto(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
