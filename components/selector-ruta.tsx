"use client"

import { BuscarSelect } from "@/components/buscar-select"
import { useDatos } from "@/components/datos-provider"
import { useSesion } from "@/lib/sesion"

export function SelectorRuta() {
  const { perfil } = useSesion()
  const { rutas, rutaEfectiva, setRutaVista } = useDatos()
  if (!rutas || !perfil) return null
  if (perfil.rol === "cobrador" && rutas.length <= 1) {
    return (
      <p className="text-lg font-extrabold">
        {rutas[0] ? rutas[0].nombre : "Sin ruta asignada"}
      </p>
    )
  }
  const opciones = [
    {
      id: "todas",
      titulo: perfil.rol === "admin" ? "Todas las rutas" : "Todas mis rutas",
    },
    ...rutas.map((ruta) => ({ id: ruta.id, titulo: ruta.nombre })),
  ]
  return (
    <BuscarSelect
      opciones={opciones}
      valor={rutaEfectiva}
      onCambio={setRutaVista}
      placeholder="Elige la ruta"
      textoBuscar="Buscar ruta"
    />
  )
}
