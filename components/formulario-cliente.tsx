"use client"

import { useState, type FormEvent } from "react"
import { BuscarSelect } from "@/components/buscar-select"
import { Campo } from "@/components/estados"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { DatosCliente } from "@/lib/datos"
import type { Cliente, Ruta } from "@/lib/tipos"

export function FormularioCliente({
  inicial,
  rutas,
  clientes,
  puedeCrearRuta,
  onCrearRuta,
  onGuardar,
  onCancelar,
}: {
  inicial?: Cliente | null
  rutas: Ruta[]
  clientes: Cliente[]
  puedeCrearRuta: boolean
  onCrearRuta: (nombre: string) => Promise<string>
  onGuardar: (datos: DatosCliente) => Promise<void>
  onCancelar?: () => void
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? "")
  const [identificacion, setIdentificacion] = useState(inicial?.identificacion ?? "")
  const [telefono, setTelefono] = useState(inicial?.telefono ?? "")
  const [punto, setPunto] = useState(inicial?.puntoReferencia ?? "")
  const [rutaId, setRutaId] = useState(inicial?.rutaId ?? "")
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const idLimpia = identificacion.trim().toLowerCase()
    const repetida = clientes.some(
      (cliente) =>
        cliente.identificacion.trim().toLowerCase() === idLimpia &&
        cliente.id !== inicial?.id,
    )
    if (repetida) {
      setError("Ya hay un cliente con esa identificación.")
      return
    }
    setGuardando(true)
    setError("")
    try {
      await onGuardar({
        nombre,
        identificacion,
        telefono,
        puntoReferencia: punto,
        rutaId,
      })
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo guardar.")
      setGuardando(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={(evento) => void enviar(evento)}>
      <Campo etiqueta="Nombre">
        <Input value={nombre} onChange={(evento) => setNombre(evento.target.value)} />
      </Campo>
      <Campo etiqueta="Identificación" ayuda="Cédula o un código corto.">
        <Input
          value={identificacion}
          onChange={(evento) => setIdentificacion(evento.target.value)}
        />
      </Campo>
      <Campo etiqueta="Teléfono" ayuda="Si lo tienes.">
        <Input
          inputMode="tel"
          value={telefono}
          onChange={(evento) => setTelefono(evento.target.value)}
        />
      </Campo>
      <Campo etiqueta="Punto de referencia" ayuda="Dónde lo encuentras. Si lo tienes.">
        <Input value={punto} onChange={(evento) => setPunto(evento.target.value)} />
      </Campo>
      <Campo etiqueta="Ruta">
        <BuscarSelect
          opciones={rutas.map((ruta) => ({ id: ruta.id, titulo: ruta.nombre }))}
          valor={rutaId}
          onCambio={setRutaId}
          placeholder="Elige la ruta"
          textoBuscar="Buscar ruta"
          agregar={
            puedeCrearRuta
              ? {
                  modo: "nombre",
                  texto: "Agregar nuevo",
                  placeholder: "Nombre de la ruta",
                  onCrear: async (nombreRuta) => {
                    const id = await onCrearRuta(nombreRuta)
                    setRutaId(id)
                  },
                }
              : undefined
          }
        />
      </Campo>
      {error ? <p className="text-base font-semibold text-destructive">{error}</p> : null}
      <Button type="submit" size="lg" disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar cliente"}
      </Button>
      {onCancelar ? (
        <Button type="button" variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
      ) : null}
    </form>
  )
}
