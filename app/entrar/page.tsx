"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { AvisoReglas } from "@/components/aviso-reglas"
import { Cargando } from "@/components/estados"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { mensajeError } from "@/lib/errores"
import { useSesion } from "@/lib/sesion"

export default function Entrar() {
  const router = useRouter()
  const { estado, adminListo, error, entrar, salir, reintentar } = useSesion()
  const [usuario, setUsuario] = useState("")
  const [clave, setClave] = useState("")
  const [aviso, setAviso] = useState("")
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (estado === "listo") router.replace("/hoy")
  }, [estado, router])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    setAviso("")
    try {
      await entrar(usuario, clave)
    } catch (fallo) {
      setAviso(mensajeError(fallo))
      setEnviando(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo tamano={176} prioridad />
        <h1 className="text-3xl font-extrabold">Entra a cobrar</h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          Usa tu usuario y tu clave. No hace falta correo.
        </p>
      </div>
      {estado === "cargando" ? <Cargando /> : null}
      {estado === "reglas" || estado === "red" ? (
        estado === "reglas" ? (
          <AvisoReglas onReintentar={reintentar} />
        ) : (
          <p className="text-base font-semibold text-destructive" role="alert">
            {error ?? "No hay conexión con Firestore."}
          </p>
        )
      ) : null}
      {estado === "sin-perfil" ? (
        <section className="grid gap-4 rounded-3xl border bg-card p-5">
          <h2 className="text-2xl font-extrabold">Esta cuenta no está en el negocio</h2>
          <p className="text-base leading-relaxed">
            Pide al administrador que te cree el usuario. Mientras tanto no puedes
            ver clientes ni cobros.
          </p>
          <Button type="button" size="lg" onClick={() => void salir()}>
            Salir
          </Button>
        </section>
      ) : null}
      {estado === "anon" || estado === "listo" ? (
        <form className="grid gap-4" onSubmit={(evento) => void enviar(evento)}>
          <label className="grid gap-2">
            <span className="text-base font-bold">Usuario</span>
            <Input
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              value={usuario}
              onChange={(evento) => setUsuario(evento.target.value)}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-base font-bold">Clave</span>
            <Input
              type="password"
              autoComplete="current-password"
              value={clave}
              onChange={(evento) => setClave(evento.target.value)}
            />
          </label>
          {aviso ? <p className="text-base font-semibold text-destructive">{aviso}</p> : null}
          <Button type="submit" size="lg" disabled={enviando}>
            {enviando ? "Entrando…" : "Entrar"}
          </Button>
          {!adminListo ? (
            <Link href="/empezar" className="text-center text-base font-bold text-primary">
              ¿Primera vez? Crear administrador
            </Link>
          ) : null}
        </form>
      ) : null}
    </main>
  )
}
