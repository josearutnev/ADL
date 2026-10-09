"use client"

import { collection, onSnapshot } from "firebase/firestore"
import { useEffect, useState } from "react"
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
import { crearCobrador, guardarCobrador } from "@/lib/datos"
import { mensajeError } from "@/lib/errores"
import { dbPrincipal } from "@/lib/firebase"
import { useSesion } from "@/lib/sesion"
import type { Perfil } from "@/lib/tipos"
import { cn } from "cn"

export default function Usuarios() {
  const { perfil } = useSesion()
  const { rutas, error: errorDatos, reintentar } = useDatos()
  const [usuarios, setUsuarios] = useState<Perfil[] | null>(null)
  const [error, setError] = useState("")
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<Perfil | null>(null)

  useEffect(() => {
    if (perfil?.rol !== "admin") return
    return onSnapshot(
      collection(dbPrincipal(), "perfiles"),
      (snap) => {
        const lista = snap.docs.flatMap((fila) => {
          const data = fila.data()
          if (data.rol !== "admin" && data.rol !== "cobrador") return []
          const rutaIds = Array.isArray(data.rutaIds)
            ? data.rutaIds.filter((id): id is string => typeof id === "string")
            : []
          return [
            {
              uid: fila.id,
              usuario: typeof data.usuario === "string" ? data.usuario : "",
              nombre: typeof data.nombre === "string" ? data.nombre : "",
              rol: data.rol,
              rutaIds,
            } satisfies Perfil,
          ]
        })
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
        setUsuarios(lista)
        setError("")
      },
      (fallo) => setError(mensajeError(fallo)),
    )
  }, [perfil?.rol])

  if (perfil && perfil.rol !== "admin") {
    return (
      <Vacio
        titulo="Solo el administrador"
        texto="Los usuarios los crea quien administra el negocio."
      />
    )
  }
  if ((error || errorDatos) && !usuarios) {
    return <ErrorBloque texto={error || errorDatos || ""} onReintentar={reintentar} />
  }
  if (!usuarios || !rutas || !perfil) return <Cargando texto="Buscando usuarios…" />

  const cobradores = usuarios.filter((usuario) => usuario.rol === "cobrador")

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-extrabold">Usuarios</h1>
      <p className="text-base leading-relaxed text-muted-foreground">
        Marca las rutas de cada cobrador. Puede cobrar en varias, y una ruta puede
        tener varios cobradores.
      </p>
      <Button type="button" size="lg" onClick={() => setCreando(true)}>
        Nuevo cobrador
      </Button>
      {error ? <ErrorBloque texto={error} /> : null}
      <ul className="grid gap-2">
        {usuarios
          .filter((usuario) => usuario.rol === "admin")
          .map((usuario) => (
            <li key={usuario.uid} className="rounded-3xl border bg-card px-4 py-4">
              <p className="text-xl font-extrabold">{usuario.nombre || usuario.usuario}</p>
              <p className="text-base text-muted-foreground">
                {usuario.usuario} · Administrador · ve todas las rutas
                {usuario.uid === perfil.uid ? " · Tú" : ""}
              </p>
            </li>
          ))}
      </ul>
      {cobradores.length === 0 ? (
        <Vacio
          titulo="Todavía no hay cobradores"
          texto="Crea uno y márquele las rutas donde puede cobrar."
        />
      ) : (
        <ul className="grid gap-2">
          {cobradores.map((usuario) => (
            <li key={usuario.uid}>
              <button
                type="button"
                className="w-full rounded-3xl border bg-card px-4 py-4 text-left"
                onClick={() => setEditando(usuario)}
              >
                <span className="block text-xl font-extrabold">{usuario.nombre}</span>
                <span className="text-base text-muted-foreground">
                  {usuario.usuario} ·{" "}
                  {usuario.rutaIds.length === 0
                    ? "Sin rutas"
                    : usuario.rutaIds
                        .map((id) => rutas.find((ruta) => ruta.id === id)?.nombre ?? "Ruta")
                        .join(", ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {creando ? (
        <DialogoCobrador
          rutas={rutas}
          titulo="Nuevo cobrador"
          onCerrar={() => setCreando(false)}
          onGuardar={async (datos) => {
            await crearCobrador(datos)
            toast.success("Cobrador creado")
          }}
        />
      ) : null}
      {editando ? (
        <DialogoCobrador
          key={editando.uid}
          rutas={rutas}
          titulo="Rutas del cobrador"
          inicial={editando}
          onCerrar={() => setEditando(null)}
          onGuardar={async (datos) => {
            await guardarCobrador(editando.uid, {
              nombre: datos.nombre,
              rutaIds: datos.rutaIds,
            })
            toast.success("Rutas guardadas")
          }}
        />
      ) : null}
    </div>
  )
}

function DialogoCobrador({
  titulo,
  rutas,
  inicial,
  onCerrar,
  onGuardar,
}: {
  titulo: string
  rutas: { id: string; nombre: string }[]
  inicial?: Perfil | null
  onCerrar: () => void
  onGuardar: (datos: {
    nombre: string
    usuario: string
    clave: string
    rutaIds: string[]
  }) => Promise<void>
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? "")
  const [usuario, setUsuario] = useState("")
  const [clave, setClave] = useState("")
  const [repite, setRepite] = useState("")
  const [rutaIds, setRutaIds] = useState<string[]>(inicial?.rutaIds ?? [])
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  function alternar(id: string) {
    setRutaIds((actual) =>
      actual.includes(id) ? actual.filter((ruta) => ruta !== id) : [...actual, id],
    )
  }

  async function guardar() {
    if (!inicial && clave !== repite) {
      setError("Las claves no coinciden.")
      return
    }
    setGuardando(true)
    setError("")
    try {
      await onGuardar({ nombre, usuario, clave, rutaIds })
      onCerrar()
    } catch (fallo) {
      setError(mensajeError(fallo))
    } finally {
      setGuardando(false)
    }
  }

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
        {inicial ? null : (
          <>
            <label className="grid gap-2">
              <span className="text-base font-bold">Usuario</span>
              <Input
                autoCapitalize="none"
                autoComplete="off"
                value={usuario}
                onChange={(evento) => setUsuario(evento.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-base font-bold">Clave</span>
              <Input
                type="password"
                autoComplete="new-password"
                value={clave}
                onChange={(evento) => setClave(evento.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-base font-bold">Repite la clave</span>
              <Input
                type="password"
                autoComplete="new-password"
                value={repite}
                onChange={(evento) => setRepite(evento.target.value)}
              />
            </label>
            <p className="text-sm text-muted-foreground">
              La clave se pone al crear la cuenta. Desde aquí no se puede cambiar.
            </p>
          </>
        )}
        <div className="grid gap-2">
          <p className="text-base font-bold">Puede cobrar en</p>
          {rutas.length === 0 ? (
            <p className="text-base text-muted-foreground">Primero crea una ruta.</p>
          ) : (
            rutas.map((ruta) => {
              const activa = rutaIds.includes(ruta.id)
              return (
                <button
                  key={ruta.id}
                  type="button"
                  aria-pressed={activa}
                  className={cn(
                    "flex min-h-14 items-center justify-between rounded-2xl border px-4 text-lg font-bold",
                    activa ? "border-primary bg-primary/10" : "bg-card",
                  )}
                  onClick={() => alternar(ruta.id)}
                >
                  {ruta.nombre}
                  <span>{activa ? "Sí cobra" : "No"}</span>
                </button>
              )
            })
          )}
        </div>
        {error ? <p className="font-semibold text-destructive">{error}</p> : null}
        <Button type="button" size="lg" disabled={guardando} onClick={() => void guardar()}>
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
