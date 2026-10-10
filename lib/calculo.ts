export type Frecuencia = "diario" | "semanal"

export type Calculado = {
  entregado: number
  porcentaje: number
  redito: number
  total: number
  cuota: number
  cuotaUltima: number
  numeroCuotas: number
}

export type ParaCuotas = {
  fechaInicio: string
  numeroCuotas: number
  frecuencia: Frecuencia
  cuota: number
  cuotaUltima: number
  total: number
  saldo: number
}

export function parseFecha(iso: string): Date {
  const [anio, mes, dia] = iso.split("-").map(Number)
  return new Date(anio || 1970, (mes || 1) - 1, dia || 1)
}

export function aISO(fecha: Date): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, "0")
  const dia = String(fecha.getDate()).padStart(2, "0")
  return `${anio}-${mes}-${dia}`
}

export function hoyLocal(ahora = new Date()): string {
  return aISO(ahora)
}

export function sumarDias(iso: string, dias: number): string {
  const fecha = parseFecha(iso)
  fecha.setDate(fecha.getDate() + dias)
  return aISO(fecha)
}

export function esDomingo(iso: string): boolean {
  return parseFecha(iso).getDay() === 0
}

export function calcularPrestamo(
  monto: number,
  porcentaje: number,
  cuotas: number,
): Calculado | null {
  const entregado = Math.round(monto)
  const pct = Math.round(porcentaje)
  const n = Math.round(cuotas)
  if (!Number.isFinite(entregado) || entregado <= 0) return null
  if (!Number.isFinite(pct) || pct < 0 || pct > 300) return null
  if (!Number.isFinite(n) || n < 1 || n > 400) return null
  const redito = Math.round((entregado * pct) / 100)
  const total = entregado + redito
  const cuota = Math.floor(total / n)
  if (cuota < 1) return null
  const cuotaUltima = total - cuota * (n - 1)
  if (cuotaUltima < 1) return null
  return {
    entregado,
    porcentaje: pct,
    redito,
    total,
    cuota,
    cuotaUltima,
    numeroCuotas: n,
  }
}

export function fechasCuotas(
  inicio: string,
  numero: number,
  frecuencia: Frecuencia,
): string[] {
  const fechas: string[] = []
  if (numero < 1) return fechas
  if (frecuencia === "semanal") {
    for (let i = 0; i < numero; i += 1) fechas.push(sumarDias(inicio, i * 7))
    return fechas
  }
  let cursor = esDomingo(inicio) ? sumarDias(inicio, 1) : inicio
  while (fechas.length < numero) {
    if (!esDomingo(cursor)) fechas.push(cursor)
    cursor = sumarDias(cursor, 1)
  }
  return fechas
}

export function montoVencido(prestamo: ParaCuotas, hoy: string): number {
  const vencidas = fechasCuotas(
    prestamo.fechaInicio,
    prestamo.numeroCuotas,
    prestamo.frecuencia,
  ).filter((fecha) => fecha < hoy).length
  if (vencidas <= 0) return 0
  if (vencidas >= prestamo.numeroCuotas) return prestamo.total
  return vencidas * prestamo.cuota
}

export function atrasoDe(prestamo: ParaCuotas, hoy: string): number {
  const pagado = prestamo.total - prestamo.saldo
  return Math.max(0, montoVencido(prestamo, hoy) - pagado)
}

export function tocaHoy(prestamo: ParaCuotas, hoy: string): boolean {
  if (prestamo.saldo <= 0) return false
  return fechasCuotas(
    prestamo.fechaInicio,
    prestamo.numeroCuotas,
    prestamo.frecuencia,
  ).includes(hoy)
}

export function tablaCuotas(datos: {
  fechaInicio: string
  numeroCuotas: number
  frecuencia: Frecuencia
  cuota: number
  cuotaUltima: number
}): { numero: number; fecha: string; valor: number }[] {
  const fechas = fechasCuotas(datos.fechaInicio, datos.numeroCuotas, datos.frecuencia)
  return fechas.map((fecha, indice) => ({
    numero: indice + 1,
    fecha,
    valor: indice === fechas.length - 1 ? datos.cuotaUltima : datos.cuota,
  }))
}

export type PagoParaSaldo = {
  id: string
  monto: number
  fecha: string
  creadoEn: string
  anulado: boolean
}

export function saldoTrasPago(total: number, pagoId: string, pagos: PagoParaSaldo[]): number {
  const lista = [...pagos].sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1
    if (a.creadoEn !== b.creadoEn) return a.creadoEn < b.creadoEn ? -1 : 1
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })
  let saldo = Math.round(total)
  for (const pago of lista) {
    if (pago.anulado) {
      if (pago.id === pagoId) return Math.max(0, saldo)
      continue
    }
    saldo -= Math.round(pago.monto)
    if (pago.id === pagoId) return Math.max(0, saldo)
  }
  return Math.max(0, saldo)
}

export function sigueDebiendo(prestamo: ParaCuotas, hoy: string): boolean {
  if (prestamo.saldo <= 0 || tocaHoy(prestamo, hoy)) return false
  const fechas = fechasCuotas(
    prestamo.fechaInicio,
    prestamo.numeroCuotas,
    prestamo.frecuencia,
  )
  const ultima = fechas[fechas.length - 1]
  if (!ultima || ultima >= hoy) return false
  if (prestamo.frecuencia === "diario" && esDomingo(hoy)) return false
  return true
}
