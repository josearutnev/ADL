"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { AvisoReglas } from "@/components/aviso-reglas"
import { Cargando } from "@/components/estados"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { mensajeError } from "@/lib/errores"
import { useSesion } from "@/lib/sesion"

export default function Empezar() {
  const router = useRouter()
  const { estado, adminListo, crearPrimerAdmin, reintentar } = useSesion()
  const [nombre, setNombre] = useState("")
  const [usuario, setUsuario] = useState("")
  const [clave, setClave] = useState("")
  const [repite, setRepite] = useState("")
  const [aviso, setAviso] = useState("")
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (estado === "listo") router.replace("/hoy")
    if (estado === "anon" && adminListo) router.replace("/entrar")
  }, [estado, adminListo, router])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (clave !== repite) {
      setAviso("Las claves no coinciden.")
      return
    }
    setEnviando(true)
    setAviso("")
    try {
      await crearPrimerAdmin({ nombre, usuario, clave })
    } catch (fallo) {
      setAviso(mensajeError(fallo))
      setEnviando(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo tamano={168} prioridad />
        <h1 className="text-3xl font-extrabold">Primera vez</h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          Crea la cuenta de quien administra el negocio. Esto se hace una sola vez.
        </p>
      </div>
      {estado === "cargando" ? <Cargando /> : null}
      {estado === "reglas" ? <AvisoReglas onReintentar={reintentar} /> : null}
      {estado === "red" ? (
        <p className="text-base font-semibold text-destructive" role="alert">
          No hay conexión con Firestore. Revisa la red e intenta de nuevo.
        </p>
      ) : null}
      {estado === "anon" && !adminListo ? (
        <form className="grid gap-4" onSubmit={(evento) => void enviar(evento)}>
          <label className="grid gap-2">
            <span className="text-base font-bold">Nombre</span>
            <Input value={nombre} onChange={(evento) => setNombre(evento.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className="text-base font-bold">Usuario</span>
            <Input
              autoComplete="username"
              autoCapitalize="none"
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
          {aviso ? <p className="text-base font-semibold text-destructive">{aviso}</p> : null}
          <Button type="submit" size="lg" disabled={enviando}>
            {enviando ? "Creando…" : "Crear administrador"}
          </Button>
        </form>
      ) : null}
    </main>
  )
}
