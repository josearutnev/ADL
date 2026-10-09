"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { mensajeError } from "@/lib/errores"
import { escucharDatos } from "@/lib/datos"
import { useSesion } from "@/lib/sesion"
import type { Cliente, Pago, Prestamo, Ruta } from "@/lib/tipos"

type Datos = {
  rutas: Ruta[] | null
  clientes: Cliente[] | null
  prestamos: Prestamo[] | null
  pagos: Pago[] | null
  error: string | null
  rutaVista: string
  rutaEfectiva: string
  setRutaVista: (id: string) => void
  reintentar: () => void
}

const Contexto = createContext<Datos | null>(null)
const EVENTO_RUTA = "adl-ruta"

function suscribirRuta(aviso: () => void) {
  window.addEventListener(EVENTO_RUTA, aviso)
  return () => window.removeEventListener(EVENTO_RUTA, aviso)
}

function leerRuta() {
  return window.localStorage.getItem("adl-ruta") || "todas"
}

function guardarRuta(id: string) {
  window.localStorage.setItem("adl-ruta", id)
  window.dispatchEvent(new Event(EVENTO_RUTA))
}

export function DatosProvider({ children }: { children: ReactNode }) {
  const { perfil } = useSesion()
  const [rutas, setRutas] = useState<Ruta[] | null>(null)
  const [clientes, setClientes] = useState<Cliente[] | null>(null)
  const [prestamos, setPrestamos] = useState<Prestamo[] | null>(null)
  const [pagos, setPagos] = useState<Pago[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const rutaVista = useSyncExternalStore(suscribirRuta, leerRuta, () => "todas")

  useEffect(() => {
    if (!perfil) return
    return escucharDatos(
      perfil,
      (datos) => {
        setRutas(datos.rutas)
        setClientes(datos.clientes)
        setPrestamos(datos.prestamos)
        setPagos(datos.pagos)
        setError(null)
      },
      (fallo) => setError(mensajeError(fallo)),
    )
  }, [perfil, intento])

  const rutaEfectiva =
    rutaVista !== "todas" && rutas?.some((ruta) => ruta.id === rutaVista)
      ? rutaVista
      : "todas"

  const valor = useMemo<Datos>(
    () => ({
      rutas,
      clientes,
      prestamos,
      pagos,
      error,
      rutaVista,
      rutaEfectiva,
      setRutaVista: guardarRuta,
      reintentar: () => setIntento((n) => n + 1),
    }),
    [rutas, clientes, prestamos, pagos, error, rutaVista, rutaEfectiva],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useDatos(): Datos {
  const datos = useContext(Contexto)
  if (!datos) throw new Error("Los datos no están listos.")
  return datos
}

export function useVista() {
  const datos = useDatos()
  function filtra<T extends { rutaId: string }>(lista: T[] | null): T[] | null {
    if (!lista) return null
    if (datos.rutaEfectiva === "todas") return lista
    return lista.filter((item) => item.rutaId === datos.rutaEfectiva)
  }
  return {
    ...datos,
    clientes: filtra(datos.clientes),
    prestamos: filtra(datos.prestamos),
    pagos: filtra(datos.pagos),
  }
}

export function nombreRuta(rutas: Ruta[] | null, rutaId: string): string {
  return rutas?.find((ruta) => ruta.id === rutaId)?.nombre ?? "Sin ruta"
}
