"use client"

import { useEffect, useId, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "cn"

export type Opcion = {
  id: string
  titulo: string
  detalle?: string
}

type Agregar =
  | {
      modo: "nombre"
      texto: string
      placeholder: string
      onCrear: (nombre: string) => Promise<void>
    }
  | {
      modo: "otro"
      texto: string
      onElegir: () => void
    }

export function BuscarSelect({
  opciones,
  valor,
  onCambio,
  placeholder,
  textoBuscar = "Buscar…",
  agregar,
}: {
  opciones: Opcion[]
  valor: string
  onCambio: (id: string) => void
  placeholder: string
  textoBuscar?: string
  agregar?: Agregar
}) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [creando, setCreando] = useState(false)
  const [nombre, setNombre] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const caja = useRef<HTMLDivElement>(null)
  const listaId = useId()
  const elegido = opciones.find((opcion) => opcion.id === valor)
  const consulta = busqueda.trim().toLowerCase()
  const filtradas = opciones.filter((opcion) => {
    if (!consulta) return true
    return (
      opcion.titulo.toLowerCase().includes(consulta) ||
      (opcion.detalle ?? "").toLowerCase().includes(consulta)
    )
  })

  useEffect(() => {
    if (!abierto) return
    function cerrar(evento: MouseEvent) {
      if (!caja.current?.contains(evento.target as Node)) setAbierto(false)
    }
    document.addEventListener("mousedown", cerrar)
    return () => document.removeEventListener("mousedown", cerrar)
  }, [abierto])

  async function crearNombre() {
    if (!agregar || agregar.modo !== "nombre") return
    setGuardando(true)
    setError("")
    try {
      await agregar.onCrear(nombre)
      setNombre("")
      setCreando(false)
      setAbierto(false)
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo guardar.")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="grid gap-2" ref={caja}>
      <Button
        type="button"
        variant="outline"
        aria-expanded={abierto}
        aria-controls={listaId}
        className="h-14 w-full justify-between rounded-2xl px-4 text-left text-lg"
        onClick={() => setAbierto((esta) => !esta)}
      >
        <span className={cn("truncate", !elegido && "font-medium text-muted-foreground")}>
          {elegido ? elegido.titulo : placeholder}
        </span>
        <ChevronDown className="size-5 shrink-0 opacity-70" />
      </Button>
      {abierto ? (
        <div id={listaId} className="rounded-2xl border bg-card p-2 shadow-sm">
          <Input
            autoFocus
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder={textoBuscar}
            aria-label={textoBuscar}
          />
          <div className="mt-2 max-h-64 overflow-y-auto">
            {filtradas.length === 0 ? (
              <p className="px-3 py-4 text-base text-muted-foreground">Nada con ese texto.</p>
            ) : (
              filtradas.map((opcion) => (
                <button
                  key={opcion.id}
                  type="button"
                  className={cn(
                    "flex min-h-12 w-full flex-col items-start justify-center rounded-xl px-3 py-2 text-left",
                    opcion.id === valor ? "bg-primary/10" : "hover:bg-muted",
                  )}
                  onClick={() => {
                    onCambio(opcion.id)
                    setAbierto(false)
                    setBusqueda("")
                  }}
                >
                  <span className="text-base font-bold">{opcion.titulo}</span>
                  {opcion.detalle ? (
                    <span className="text-sm text-muted-foreground">{opcion.detalle}</span>
                  ) : null}
                </button>
              ))
            )}
          </div>
          {agregar ? (
            <div className="mt-2 border-t pt-2">
              {agregar.modo === "otro" ? (
                <button
                  type="button"
                  className="min-h-12 w-full rounded-xl px-3 text-left text-base font-extrabold text-primary"
                  onClick={() => {
                    setAbierto(false)
                    agregar.onElegir()
                  }}
                >
                  {agregar.texto}
                </button>
              ) : creando ? (
                <div className="grid gap-2">
                  <Input
                    value={nombre}
                    onChange={(evento) => setNombre(evento.target.value)}
                    placeholder={agregar.placeholder}
                    aria-label={agregar.placeholder}
                  />
                  {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" onClick={() => setCreando(false)}>
                      Cancelar
                    </Button>
                    <Button type="button" disabled={guardando} onClick={() => void crearNombre()}>
                      {guardando ? "Guardando…" : "Guardar"}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="min-h-12 w-full rounded-xl px-3 text-left text-base font-extrabold text-primary"
                  onClick={() => setCreando(true)}
                >
                  {agregar.texto}
                </button>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
