"use client"

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth"
import { doc, getDoc, onSnapshot, writeBatch, type DocumentData } from "firebase/firestore"
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { MENSAJE_USUARIO, mensajeError, usuarioValido } from "@/lib/errores"
import {
  authAlta,
  authPrincipal,
  correoDeUsuario,
  dbAlta,
  dbPrincipal,
} from "@/lib/firebase"
import type { Perfil, Rol } from "@/lib/tipos"

export type EstadoSesion =
  | "cargando"
  | "reglas"
  | "red"
  | "anon"
  | "sin-perfil"
  | "listo"

type Sesion = {
  estado: EstadoSesion
  perfil: Perfil | null
  adminListo: boolean
  error: string | null
  entrar: (usuario: string, clave: string) => Promise<void>
  salir: () => Promise<void>
  crearPrimerAdmin: (datos: {
    nombre: string
    usuario: string
    clave: string
  }) => Promise<void>
  reintentar: () => void
}

const Contexto = createContext<Sesion | null>(null)

function esRol(valor: unknown): valor is Rol {
  return valor === "admin" || valor === "cobrador"
}

function leerPerfil(uid: string, data: DocumentData): Perfil | null {
  if (!esRol(data.rol)) return null
  const rutaIds = Array.isArray(data.rutaIds)
    ? data.rutaIds.filter((id): id is string => typeof id === "string")
    : []
  return {
    uid,
    usuario: typeof data.usuario === "string" ? data.usuario : "",
    nombre: typeof data.nombre === "string" ? data.nombre : "",
    rol: data.rol,
    rutaIds,
  }
}

function esPermiso(texto: string): boolean {
  return /permiso|reglas/i.test(texto)
}

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion>("cargando")
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [adminListo, setAdminListo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vivo = true
    let generacion = 0
    let bajaPerfil: (() => void) | null = null

    const bajaAuth = onAuthStateChanged(authPrincipal(), (usuario: User | null) => {
      const actual = ++generacion
      bajaPerfil?.()
      bajaPerfil = null
      if (!vivo) return
      if (!usuario) {
        setPerfil(null)
        void getDoc(doc(dbPrincipal(), "config", "sistema"))
          .then((snap) => {
            if (!vivo || actual !== generacion) return
            setAdminListo(snap.exists() && snap.data()?.adminListo === true)
            setError(null)
            setEstado("anon")
          })
          .catch((fallo: unknown) => {
            if (!vivo || actual !== generacion) return
            const texto = mensajeError(fallo)
            setError(texto)
            setEstado(esPermiso(texto) ? "reglas" : "red")
          })
        return
      }
      bajaPerfil = onSnapshot(
        doc(dbPrincipal(), "perfiles", usuario.uid),
        (snap) => {
          if (!vivo || actual !== generacion) return
          if (!snap.exists()) {
            setPerfil(null)
            setEstado("sin-perfil")
            return
          }
          const leido = leerPerfil(usuario.uid, snap.data())
          if (!leido) {
            setPerfil(null)
            setEstado("sin-perfil")
            return
          }
          setPerfil(leido)
          setError(null)
          setEstado("listo")
        },
        (fallo) => {
          if (!vivo || actual !== generacion) return
          const texto = mensajeError(fallo)
          setError(texto)
          setEstado(esPermiso(texto) ? "reglas" : "red")
        },
      )
    })

    return () => {
      vivo = false
      bajaAuth()
      bajaPerfil?.()
    }
  }, [intento])

  async function entrar(usuario: string, clave: string) {
    if (!usuarioValido(usuario)) throw new Error(MENSAJE_USUARIO)
    if (!clave) throw new Error("Escribe la clave.")
    await signInWithEmailAndPassword(authPrincipal(), correoDeUsuario(usuario), clave)
  }

  async function salir() {
    await signOut(authPrincipal())
  }

  async function crearPrimerAdmin(datos: {
    nombre: string
    usuario: string
    clave: string
  }) {
    const nombre = datos.nombre.trim()
    const usuario = datos.usuario.trim()
    if (!nombre) throw new Error("Escribe el nombre.")
    if (!usuarioValido(usuario)) throw new Error(MENSAJE_USUARIO)
    if (datos.clave.length < 6) {
      throw new Error("La clave necesita al menos 6 caracteres.")
    }
    const secundaria = authAlta()
    try {
      const cred = await createUserWithEmailAndPassword(
        secundaria,
        correoDeUsuario(usuario),
        datos.clave,
      )
      const lote = writeBatch(dbAlta())
      lote.set(doc(dbAlta(), "perfiles", cred.user.uid), {
        usuario,
        nombre,
        rol: "admin",
        rutaIds: [],
      })
      lote.set(doc(dbAlta(), "config", "sistema"), { adminListo: true })
      await lote.commit()
      await signOut(secundaria)
    } catch (fallo) {
      await signOut(secundaria).catch(() => undefined)
      throw fallo
    }
    try {
      await signInWithEmailAndPassword(
        authPrincipal(),
        correoDeUsuario(usuario),
        datos.clave,
      )
    } catch {
      throw new Error(
        "La cuenta de administrador quedó creada. Entra con ese usuario y esa clave.",
      )
    }
  }

  return (
    <Contexto.Provider
      value={{
        estado,
        perfil,
        adminListo,
        error,
        entrar,
        salir,
        crearPrimerAdmin,
        reintentar: () => setIntento((n) => n + 1),
      }}
    >
      {children}
    </Contexto.Provider>
  )
}

export function useSesion(): Sesion {
  const sesion = useContext(Contexto)
  if (!sesion) throw new Error("La sesión no está lista.")
  return sesion
}
