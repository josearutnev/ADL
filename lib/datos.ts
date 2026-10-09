import {
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth"
import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore"
import type { Frecuencia } from "@/lib/calculo"
import { MENSAJE_USUARIO, usuarioValido } from "@/lib/errores"
import { authAlta, correoDeUsuario, dbPrincipal } from "@/lib/firebase"
import type { Cliente, Pago, Perfil, Prestamo, Ruta } from "@/lib/tipos"

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : ""
}

function entero(valor: unknown): number {
  const numero = typeof valor === "number" ? valor : Number(valor)
  return Number.isFinite(numero) ? Math.round(numero) : 0
}

function frecuenciaDe(valor: unknown): Frecuencia | null {
  return valor === "diario" || valor === "semanal" ? valor : null
}

function mapRuta(id: string, data: DocumentData): Ruta | null {
  const nombre = texto(data.nombre).trim()
  if (!nombre) return null
  return { id, nombre }
}

function mapCliente(id: string, data: DocumentData): Cliente | null {
  const nombre = texto(data.nombre).trim()
  const rutaId = texto(data.rutaId)
  if (!nombre || !rutaId) return null
  return {
    id,
    nombre,
    identificacion: texto(data.identificacion).trim(),
    telefono: texto(data.telefono).trim(),
    puntoReferencia: texto(data.puntoReferencia).trim(),
    rutaId,
  }
}

function mapPrestamo(id: string, data: DocumentData): Prestamo | null {
  const frecuencia = frecuenciaDe(data.frecuencia)
  if (!frecuencia || !texto(data.clienteId) || !texto(data.rutaId)) return null
  return {
    id,
    clienteId: texto(data.clienteId),
    clienteNombre: texto(data.clienteNombre),
    identificacion: texto(data.identificacion),
    rutaId: texto(data.rutaId),
    fechaInicio: texto(data.fechaInicio),
    montoEntregado: entero(data.montoEntregado),
    porcentajeRedito: entero(data.porcentajeRedito),
    redito: entero(data.redito),
    total: entero(data.total),
    cuota: entero(data.cuota),
    cuotaUltima: entero(data.cuotaUltima),
    numeroCuotas: entero(data.numeroCuotas),
    frecuencia,
    saldo: entero(data.saldo),
  }
}

function mapPago(id: string, data: DocumentData): Pago | null {
  if (!texto(data.prestamoId) || !texto(data.rutaId)) return null
  return {
    id,
    prestamoId: texto(data.prestamoId),
    clienteId: texto(data.clienteId),
    clienteNombre: texto(data.clienteNombre),
    rutaId: texto(data.rutaId),
    fecha: texto(data.fecha),
    monto: entero(data.monto),
    cobradorId: texto(data.cobradorId),
    cobradorNombre: texto(data.cobradorNombre),
    anulado: data.anulado === true,
    creadoEn: texto(data.creadoEn),
  }
}

function partir<T>(lista: T[], tamano: number): T[][] {
  const grupos: T[][] = []
  for (let i = 0; i < lista.length; i += tamano) grupos.push(lista.slice(i, i + tamano))
  return grupos
}

function escucharPorRuta<T>(
  nombre: string,
  rutaIds: string[],
  mapear: (id: string, data: DocumentData) => T | null,
  alCambiar: (filas: T[]) => void,
  alFallar: (error: unknown) => void,
): Unsubscribe {
  const db = dbPrincipal()
  const grupos = partir(rutaIds, 30)
  const partes = new Map<number, T[]>()
  const emitir = () => {
    alCambiar([...partes.values()].flat())
  }
  const bajas = grupos.map((grupo, indice) =>
    onSnapshot(
      query(collection(db, nombre), where("rutaId", "in", grupo)),
      (snap) => {
        partes.set(
          indice,
          snap.docs.flatMap((fila) => {
            const item = mapear(fila.id, fila.data())
            return item ? [item] : []
          }),
        )
        emitir()
      },
      alFallar,
    ),
  )
  return () => bajas.forEach((baja) => baja())
}

export function escucharDatos(
  perfil: Perfil,
  alRecibir: (datos: {
    rutas: Ruta[]
    clientes: Cliente[]
    prestamos: Prestamo[]
    pagos: Pago[]
  }) => void,
  alFallar: (error: unknown) => void,
): Unsubscribe {
  const rutaIds = [...new Set(perfil.rutaIds)]
  const db = dbPrincipal()
  let rutas: Ruta[] = []
  let clientes: Cliente[] = []
  let prestamos: Prestamo[] = []
  let pagos: Pago[] = []
  const esperados = perfil.rol === "admin" ? 4 : rutaIds.length + 3
  const vistos = new Set<string>()
  const emitir = (clave: string) => {
    vistos.add(clave)
    if (vistos.size < esperados) return
    rutas = [...rutas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    clientes = [...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    alRecibir({ rutas, clientes, prestamos, pagos })
  }

  if (perfil.rol === "cobrador" && rutaIds.length === 0) {
    alRecibir({ rutas: [], clientes: [], prestamos: [], pagos: [] })
    return () => {}
  }

  const bajas: Unsubscribe[] = []

  if (perfil.rol === "admin") {
    bajas.push(
      onSnapshot(
        collection(db, "rutas"),
        (snap) => {
          rutas = snap.docs.flatMap((fila) => {
            const item = mapRuta(fila.id, fila.data())
            return item ? [item] : []
          })
          emitir("rutas")
        },
        alFallar,
      ),
    )
    bajas.push(
      onSnapshot(
        collection(db, "clientes"),
        (snap) => {
          clientes = deDocs(snap.docs, mapCliente)
          emitir("clientes")
        },
        alFallar,
      ),
    )
    bajas.push(
      onSnapshot(
        collection(db, "prestamos"),
        (snap) => {
          prestamos = deDocs(snap.docs, mapPrestamo)
          emitir("prestamos")
        },
        alFallar,
      ),
    )
    bajas.push(
      onSnapshot(
        collection(db, "pagos"),
        (snap) => {
          pagos = deDocs(snap.docs, mapPago)
          emitir("pagos")
        },
        alFallar,
      ),
    )
  } else {
    const rutasMapa = new Map<string, Ruta>()
    rutaIds.forEach((rutaId) => {
      bajas.push(
        onSnapshot(
          doc(db, "rutas", rutaId),
          (snap) => {
            if (snap.exists()) {
              const item = mapRuta(snap.id, snap.data())
              if (item) rutasMapa.set(rutaId, item)
              else rutasMapa.delete(rutaId)
            } else {
              rutasMapa.delete(rutaId)
            }
            rutas = [...rutasMapa.values()]
            emitir(`ruta-${rutaId}`)
          },
          alFallar,
        ),
      )
    })
    bajas.push(
      escucharPorRuta("clientes", rutaIds, mapCliente, (filas) => {
        clientes = filas
        emitir("clientes")
      }, alFallar),
    )
    bajas.push(
      escucharPorRuta("prestamos", rutaIds, mapPrestamo, (filas) => {
        prestamos = filas
        emitir("prestamos")
      }, alFallar),
    )
    bajas.push(
      escucharPorRuta("pagos", rutaIds, mapPago, (filas) => {
        pagos = filas
        emitir("pagos")
      }, alFallar),
    )
  }

  return () => bajas.forEach((baja) => baja())
}

function deDocs<T>(
  docs: QueryDocumentSnapshot[],
  mapear: (id: string, data: DocumentData) => T | null,
): T[] {
  return docs.flatMap((fila) => {
    const item = mapear(fila.id, fila.data())
    return item ? [item] : []
  })
}

export async function crearRuta(nombre: string): Promise<string> {
  const limpio = nombre.trim()
  if (!limpio) throw new Error("Escribe el nombre de la ruta.")
  if (limpio.length > 60) throw new Error("El nombre de la ruta es muy largo.")
  const ref = doc(collection(dbPrincipal(), "rutas"))
  await setDoc(ref, { nombre: limpio, creadoEn: new Date().toISOString() })
  return ref.id
}

export async function renombrarRuta(id: string, nombre: string): Promise<void> {
  const limpio = nombre.trim()
  if (!limpio) throw new Error("Escribe el nombre de la ruta.")
  await updateDoc(doc(dbPrincipal(), "rutas", id), { nombre: limpio })
}

export type DatosCliente = {
  nombre: string
  identificacion: string
  telefono: string
  puntoReferencia: string
  rutaId: string
}

export async function guardarCliente(
  id: string | null,
  datos: DatosCliente,
  prestamos: Prestamo[],
): Promise<string> {
  const nombre = datos.nombre.trim()
  const identificacion = datos.identificacion.trim()
  const telefono = datos.telefono.trim()
  const puntoReferencia = datos.puntoReferencia.trim()
  if (!nombre) throw new Error("Escribe el nombre.")
  if (!identificacion) throw new Error("Escribe la cédula o el código.")
  if (!datos.rutaId) throw new Error("Elige la ruta.")
  const cuerpo = {
    nombre,
    identificacion,
    telefono,
    puntoReferencia,
    rutaId: datos.rutaId,
  }
  const db = dbPrincipal()
  if (!id) {
    const ref = doc(collection(db, "clientes"))
    await setDoc(ref, { ...cuerpo, creadoEn: new Date().toISOString() })
    return ref.id
  }
  const batch = writeBatch(db)
  batch.update(doc(db, "clientes", id), cuerpo)
  prestamos
    .filter((prestamo) => prestamo.clienteId === id)
    .forEach((prestamo) => {
      batch.update(doc(db, "prestamos", prestamo.id), {
        clienteNombre: nombre,
        identificacion,
        rutaId: datos.rutaId,
      })
    })
  await batch.commit()
  return id
}

export async function crearPrestamo(datos: {
  cliente: Cliente
  fechaInicio: string
  montoEntregado: number
  porcentajeRedito: number
  redito: number
  total: number
  cuota: number
  cuotaUltima: number
  numeroCuotas: number
  frecuencia: Frecuencia
}): Promise<string> {
  const ref = doc(collection(dbPrincipal(), "prestamos"))
  await setDoc(ref, {
    clienteId: datos.cliente.id,
    clienteNombre: datos.cliente.nombre,
    identificacion: datos.cliente.identificacion,
    rutaId: datos.cliente.rutaId,
    fechaInicio: datos.fechaInicio,
    montoEntregado: datos.montoEntregado,
    porcentajeRedito: datos.porcentajeRedito,
    redito: datos.redito,
    total: datos.total,
    cuota: datos.cuota,
    cuotaUltima: datos.cuotaUltima,
    numeroCuotas: datos.numeroCuotas,
    frecuencia: datos.frecuencia,
    saldo: datos.total,
    creadoEn: new Date().toISOString(),
  })
  return ref.id
}

export async function registrarPago(datos: {
  prestamo: Prestamo
  monto: number
  fecha: string
  cobradorId: string
  cobradorNombre: string
}): Promise<void> {
  const monto = Math.round(datos.monto)
  if (monto <= 0) throw new Error("Escribe cuánto te entregó.")
  const db = dbPrincipal()
  const prestamoRef = doc(db, "prestamos", datos.prestamo.id)
  const pagoRef = doc(collection(db, "pagos"))
  await runTransaction(db, async (tx) => {
    const actual = await tx.get(prestamoRef)
    if (!actual.exists()) throw new Error("No encontré el préstamo.")
    const saldo = entero(actual.data().saldo)
    if (monto > saldo) throw new Error("El monto supera el saldo.")
    tx.update(prestamoRef, { saldo: saldo - monto })
    tx.set(pagoRef, {
      prestamoId: datos.prestamo.id,
      clienteId: texto(actual.data().clienteId),
      clienteNombre: texto(actual.data().clienteNombre),
      rutaId: texto(actual.data().rutaId),
      fecha: datos.fecha,
      monto,
      cobradorId: datos.cobradorId,
      cobradorNombre: datos.cobradorNombre,
      anulado: false,
      creadoEn: new Date().toISOString(),
    })
  })
}

export async function anularPago(pago: Pago, adminUid: string): Promise<void> {
  if (pago.anulado) throw new Error("Ese cobro ya está anulado.")
  const db = dbPrincipal()
  const pagoRef = doc(db, "pagos", pago.id)
  const prestamoRef = doc(db, "prestamos", pago.prestamoId)
  await runTransaction(db, async (tx) => {
    const pagoActual = await tx.get(pagoRef)
    const prestamoActual = await tx.get(prestamoRef)
    if (!pagoActual.exists() || !prestamoActual.exists()) {
      throw new Error("No encontré el cobro.")
    }
    if (pagoActual.data().anulado === true) throw new Error("Ese cobro ya está anulado.")
    const saldo = entero(prestamoActual.data().saldo)
    const total = entero(prestamoActual.data().total)
    const monto = entero(pagoActual.data().monto)
    tx.update(pagoRef, {
      anulado: true,
      anuladoEn: new Date().toISOString(),
      anuladoPor: adminUid,
    })
    tx.update(prestamoRef, { saldo: Math.min(total, saldo + monto) })
  })
}

export async function crearCobrador(datos: {
  nombre: string
  usuario: string
  clave: string
  rutaIds: string[]
}): Promise<void> {
  const nombre = datos.nombre.trim()
  const usuario = datos.usuario.trim()
  if (!nombre) throw new Error("Escribe el nombre.")
  if (!usuarioValido(usuario)) throw new Error(MENSAJE_USUARIO)
  if (datos.clave.length < 6) throw new Error("La clave necesita al menos 6 caracteres.")
  const secundaria = authAlta()
  try {
    const cred = await createUserWithEmailAndPassword(
      secundaria,
      correoDeUsuario(usuario),
      datos.clave,
    )
    const uid = cred.user.uid
    await signOut(secundaria)
    await setDoc(doc(dbPrincipal(), "perfiles", uid), {
      usuario,
      nombre,
      rol: "cobrador",
      rutaIds: datos.rutaIds,
    })
  } catch (error) {
    await signOut(secundaria).catch(() => undefined)
    throw error
  }
}

export async function guardarCobrador(
  uid: string,
  datos: { nombre: string; rutaIds: string[] },
): Promise<void> {
  const nombre = datos.nombre.trim()
  if (!nombre) throw new Error("Escribe el nombre.")
  await updateDoc(doc(dbPrincipal(), "perfiles", uid), {
    nombre,
    rutaIds: datos.rutaIds,
  })
}
