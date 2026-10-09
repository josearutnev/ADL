import type { Frecuencia } from "@/lib/calculo"

export type { Frecuencia }

export type Rol = "admin" | "cobrador"

export type Perfil = {
  uid: string
  usuario: string
  nombre: string
  rol: Rol
  rutaIds: string[]
}

export type Ruta = {
  id: string
  nombre: string
}

export type Cliente = {
  id: string
  nombre: string
  identificacion: string
  telefono: string
  puntoReferencia: string
  rutaId: string
}

export type Prestamo = {
  id: string
  clienteId: string
  clienteNombre: string
  identificacion: string
  rutaId: string
  fechaInicio: string
  montoEntregado: number
  porcentajeRedito: number
  redito: number
  total: number
  cuota: number
  cuotaUltima: number
  numeroCuotas: number
  frecuencia: Frecuencia
  saldo: number
}

export type Pago = {
  id: string
  prestamoId: string
  clienteId: string
  clienteNombre: string
  rutaId: string
  fecha: string
  monto: number
  cobradorId: string
  cobradorNombre: string
  anulado: boolean
  creadoEn: string
}
