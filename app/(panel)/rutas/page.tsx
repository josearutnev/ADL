"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useDatos } from "@/components/datos-provider"
import { Cargando, ErrorBloque, Vacio } from "@/components/estados"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { crearRuta, renombrarRuta } from "@/lib/datos"
import { mensajeError } from "@/lib/errores"
import { useSesion } from "@/lib/sesion"
import type { Ruta } from "@/lib/tipos"

export default function Rutas() {
  const { perfil } = useSesion()
  const datos = useDatos()
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<Ruta | null>(null)

  if (perfil && perfil.rol !== "admin") {
    return (
      <Vacio
        titulo="Solo el administrador"
        texto="Las rutas las crea quien administra el negocio."
      />
    )
  }
  if (datos.error && !datos.rutas) return <ErrorBloque texto={datos.error} onReintentar={datos.reintentar} />
  if (!datos.rutas || !datos.clientes) return <Cargando />

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-extrabold">Rutas</h1>
      <p className="text-base leading-relaxed text-muted-foreground">
        Una ruta agrupa clientes. Un cobrador puede tener varias, y una ruta puede
        tener varios cobradores.
      </p>
      <Button type="button" size="lg" onClick={() => setCreando(true)}>
        Nueva ruta
      </Button>
      {datos.rutas.length === 0 ? (
        <Vacio
          titulo="Todavía no hay rutas"
          texto="Crea una para agrupar a los clientes. Por ejemplo: Centro o Norte."
        />
      ) : (
        <ul className="grid gap-2">
          {datos.rutas.map((ruta) => {
            const cantidad = datos.clientes?.filter((cliente) => cliente.rutaId === ruta.id).length ?? 0
            return (
              <li key={ruta.id}>
                <button
                  type="button"
                  className="flex min-h-16 w-full items-center justify-between rounded-3xl border bg-card px-4 text-left"
                  onClick={() => setEditando(ruta)}
                >
                  <span>
                    <span className="block text-xl font-extrabold">{ruta.nombre}</span>
                    <span className="text-base text-muted-foreground">
                      {cantidad} {cantidad === 1 ? "cliente" : "clientes"}
                    </span>
                  </span>
                  <span className="text-base font-bold text-primary">Renombrar</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {creando ? (
        <DialogoRuta
          titulo="Nueva ruta"
          onCerrar={() => setCreando(false)}
          onGuardar={async (nombre) => {
            await crearRuta(nombre)
            toast.success("Ruta creada")
          }}
        />
      ) : null}
      {editando ? (
        <DialogoRuta
          key={editando.id}
          titulo="Renombrar ruta"
          inicial={editando.nombre}
          onCerrar={() => setEditando(null)}
          onGuardar={async (nombre) => {
            await renombrarRuta(editando.id, nombre)
            toast.success("Nombre guardado")
          }}
        />
      ) : null}
    </div>
  )
}

function DialogoRuta({
  titulo,
  inicial = "",
  onCerrar,
  onGuardar,
}: {
  titulo: string
  inicial?: string
  onCerrar: () => void
  onGuardar: (nombre: string) => Promise<void>
}) {
  const [nombre, setNombre] = useState(inicial)
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  return (
    <Dialog open onOpenChange={(esta) => { if (!esta) onCerrar() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        <label className="grid gap-2">
          <span className="text-base font-bold">Nombre</span>
          <Input value={nombre} onChange={(evento) => setNombre(evento.target.value)} />
        </label>
        {error ? <p className="font-semibold text-destructive">{error}</p> : null}
        <Button
          type="button"
          size="lg"
          disabled={guardando}
          onClick={() => {
            setGuardando(true)
            setError("")
            void onGuardar(nombre)
              .then(onCerrar)
              .catch((fallo: unknown) => setError(mensajeError(fallo)))
              .finally(() => setGuardando(false))
          }}
        >
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
