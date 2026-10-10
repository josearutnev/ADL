import {
  PDFDocument,
  StandardFonts,
  appendBezierCurve,
  clip,
  closePath,
  endPath,
  lineTo,
  moveTo,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib"
import { parseFecha, tablaCuotas, type Frecuencia } from "./calculo.ts"
import { fechaBonita, pesos } from "./formato.ts"
import type { Pago, Prestamo } from "./tipos.ts"

const ANCHO = 595.28
const ALTO = 841.89
const MARGEN = 40
const TINTA = rgb(0.16, 0.14, 0.11)
const SUAVE = rgb(0.38, 0.34, 0.28)
const ORO = rgb(201 / 255, 180 / 255, 109 / 255)
const LINEA = rgb(0.82, 0.76, 0.64)

export type DatosPrestamoPdf = {
  cliente: string
  identificacion: string
  ruta: string
  fechaInicio: string
  montoEntregado: number
  porcentaje: number
  redito: number
  total: number
  numeroCuotas: number
  frecuencia: Frecuencia
  cuota: number
  cuotaUltima: number
}

export type DatosPagoPdf = {
  cliente: string
  fecha: string
  monto: number
  saldo: number
  cobrador: string
  anulado?: boolean
}

export function datosPrestamoPdf(prestamo: Prestamo, ruta: string): DatosPrestamoPdf {
  return {
    cliente: prestamo.clienteNombre,
    identificacion: prestamo.identificacion,
    ruta,
    fechaInicio: prestamo.fechaInicio,
    montoEntregado: prestamo.montoEntregado,
    porcentaje: prestamo.porcentajeRedito,
    redito: prestamo.redito,
    total: prestamo.total,
    numeroCuotas: prestamo.numeroCuotas,
    frecuencia: prestamo.frecuencia,
    cuota: prestamo.cuota,
    cuotaUltima: prestamo.cuotaUltima,
  }
}

export function datosPagoPdf(pago: Pago, saldo: number): DatosPagoPdf {
  return {
    cliente: pago.clienteNombre,
    fecha: pago.fecha,
    monto: pago.monto,
    saldo,
    cobrador: pago.cobradorNombre,
    anulado: pago.anulado,
  }
}

export function nombrePdf(tipo: "prestamo" | "pago", cliente: string): string {
  const base =
    cliente
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "cliente"
  return `comprobante-${tipo}-${base}.pdf`
}

let logoPendiente: Promise<Uint8Array> | null = null

export function cargarLogo(): Promise<Uint8Array> {
  if (!logoPendiente) {
    logoPendiente = fetch("/logo-adl.jpg").then(async (respuesta) => {
      if (!respuesta.ok) throw new Error("No pude cargar el logo.")
      return new Uint8Array(await respuesta.arrayBuffer())
    })
  }
  return logoPendiente
}

function textoPdf(valor: string): string {
  const limpio = valor.replace(/[^\u0000-\u00FF]/g, "").trim()
  return limpio || "-"
}

function fechaTabla(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(parseFecha(iso))
    .replace(/\./g, "")
}

function frecuenciaTexto(frecuencia: Frecuencia): string {
  return frecuencia === "diario" ? "Diario, de lunes a sábado" : "Semanal"
}

function lineasDe(texto: string, fuente: PDFFont, tamano: number, ancho: number): string[] {
  const palabras = textoPdf(texto).split(/\s+/).filter(Boolean)
  const lineas: string[] = []
  let actual = ""
  for (const palabra of palabras) {
    const candidato = actual ? `${actual} ${palabra}` : palabra
    if (fuente.widthOfTextAtSize(candidato, tamano) <= ancho) {
      actual = candidato
    } else {
      if (actual) lineas.push(actual)
      actual = palabra
    }
  }
  if (actual) lineas.push(actual)
  return lineas.length > 0 ? lineas : ["-"]
}

class Lienzo {
  page: PDFPage
  y: number
  doc: PDFDocument
  regular: PDFFont
  negrita: PDFFont

  constructor(doc: PDFDocument, regular: PDFFont, negrita: PDFFont) {
    this.doc = doc
    this.regular = regular
    this.negrita = negrita
    this.page = doc.addPage([ANCHO, ALTO])
    this.y = ALTO - MARGEN
  }

  private nueva() {
    this.page = this.doc.addPage([ANCHO, ALTO])
    this.y = ALTO - MARGEN
  }

  private asegurar(alto: number) {
    if (this.y - alto < MARGEN) this.nueva()
  }

  encabezado(imagen: PDFImage, titulo: string) {
    const lado = 78
    dibujarLogo(this.page, imagen, MARGEN, this.y - lado, lado)
    const x = MARGEN + lado + 14
    this.page.drawText("ADL", {
      x,
      y: this.y - 22,
      size: 12,
      font: this.negrita,
      color: ORO,
    })
    this.page.drawText("Préstamos E Inversiones", {
      x,
      y: this.y - 42,
      size: 14,
      font: this.negrita,
      color: TINTA,
    })
    this.y -= lado + 14
    this.page.drawText(textoPdf(titulo), {
      x: MARGEN,
      y: this.y,
      size: 20,
      font: this.negrita,
      color: TINTA,
    })
    this.y -= 12
    this.page.drawLine({
      start: { x: MARGEN, y: this.y },
      end: { x: ANCHO - MARGEN, y: this.y },
      thickness: 1.5,
      color: ORO,
    })
    this.y -= 14
  }

  pares(filas: [string, string][]) {
    const col = (ANCHO - MARGEN * 2 - 20) / 2
    for (let i = 0; i < filas.length; i += 2) {
      const izquierda = filas[i]
      const derecha = filas[i + 1]
      const lineasIzquierda = lineasDe(izquierda[1], this.negrita, 13, col)
      const lineasDerecha = derecha ? lineasDe(derecha[1], this.negrita, 13, col) : []
      const cantidad = Math.max(lineasIzquierda.length, lineasDerecha.length)
      const alto = 14 + cantidad * 15 + 4
      this.asegurar(alto)
      const y = this.y
      this.page.drawText(textoPdf(izquierda[0]), {
        x: MARGEN,
        y,
        size: 10,
        font: this.regular,
        color: SUAVE,
      })
      lineasIzquierda.forEach((linea, indice) => {
        this.page.drawText(linea, {
          x: MARGEN,
          y: y - 15 - indice * 16,
          size: 13,
          font: this.negrita,
          color: TINTA,
        })
      })
      if (derecha) {
        const x = MARGEN + col + 20
        this.page.drawText(textoPdf(derecha[0]), {
          x,
          y,
          size: 10,
          font: this.regular,
          color: SUAVE,
        })
        lineasDerecha.forEach((linea, indice) => {
          this.page.drawText(linea, {
            x,
            y: y - 15 - indice * 16,
            size: 13,
            font: this.negrita,
            color: TINTA,
          })
        })
      }
      this.y -= alto
    }
  }

  campo(etiqueta: string, valor: string) {
    const lineas = lineasDe(valor, this.negrita, 14, ANCHO - MARGEN * 2)
    this.asegurar(18 + lineas.length * 18 + 8)
    this.page.drawText(textoPdf(etiqueta), {
      x: MARGEN,
      y: this.y,
      size: 10,
      font: this.regular,
      color: SUAVE,
    })
    this.y -= 16
    for (const linea of lineas) {
      this.page.drawText(linea, {
        x: MARGEN,
        y: this.y,
        size: 14,
        font: this.negrita,
        color: TINTA,
      })
      this.y -= 18
    }
    this.y -= 6
  }

  private cabezeraTabla() {
    this.asegurar(36)
    this.page.drawText("Número", {
      x: MARGEN,
      y: this.y,
      size: 11,
      font: this.negrita,
      color: TINTA,
    })
    this.page.drawText("Fecha", {
      x: MARGEN + 80,
      y: this.y,
      size: 11,
      font: this.negrita,
      color: TINTA,
    })
    const valor = "Valor"
    this.page.drawText(valor, {
      x: ANCHO - MARGEN - this.negrita.widthOfTextAtSize(valor, 11),
      y: this.y,
      size: 11,
      font: this.negrita,
      color: TINTA,
    })
    this.y -= 8
    this.page.drawLine({
      start: { x: MARGEN, y: this.y },
      end: { x: ANCHO - MARGEN, y: this.y },
      thickness: 0.8,
      color: LINEA,
    })
    this.y -= 18
  }

  tabla(filas: { numero: number; fecha: string; valor: number }[]) {
    this.asegurar(40)
    this.page.drawText("Cuotas", {
      x: MARGEN,
      y: this.y,
      size: 16,
      font: this.negrita,
      color: TINTA,
    })
    this.y -= 22
    this.cabezeraTabla()
    for (const fila of filas) {
      if (this.y < MARGEN + 22) {
        this.nueva()
        this.cabezeraTabla()
      }
      this.page.drawText(String(fila.numero), {
        x: MARGEN,
        y: this.y,
        size: 11,
        font: this.regular,
        color: TINTA,
      })
      this.page.drawText(textoPdf(fechaTabla(fila.fecha)), {
        x: MARGEN + 80,
        y: this.y,
        size: 11,
        font: this.regular,
        color: TINTA,
      })
      const monto = textoPdf(pesos(fila.valor))
      this.page.drawText(monto, {
        x: ANCHO - MARGEN - this.regular.widthOfTextAtSize(monto, 11),
        y: this.y,
        size: 11,
        font: this.regular,
        color: TINTA,
      })
      this.y -= 15
    }
  }
}

function dibujarLogo(page: PDFPage, imagen: PDFImage, x: number, y: number, lado: number) {
  const radio = lado * 0.22
  const curva = 0.5522847498 * radio
  page.pushOperators(
    pushGraphicsState(),
    moveTo(x + radio, y),
    lineTo(x + lado - radio, y),
    appendBezierCurve(x + lado - radio + curva, y, x + lado, y + radio - curva, x + lado, y + radio),
    lineTo(x + lado, y + lado - radio),
    appendBezierCurve(
      x + lado,
      y + lado - radio + curva,
      x + lado - radio + curva,
      y + lado,
      x + lado - radio,
      y + lado,
    ),
    lineTo(x + radio, y + lado),
    appendBezierCurve(x + radio - curva, y + lado, x, y + lado - radio + curva, x, y + lado - radio),
    lineTo(x, y + radio),
    appendBezierCurve(x, y + radio - curva, x + radio - curva, y, x + radio, y),
    closePath(),
    clip(),
    endPath(),
  )
  const escala = Math.max(lado / imagen.width, lado / imagen.height)
  const ancho = imagen.width * escala
  const alto = imagen.height * escala
  page.drawImage(imagen, {
    x: x - (ancho - lado) / 2,
    y: y - (alto - lado) / 2,
    width: ancho,
    height: alto,
  })
  page.pushOperators(popGraphicsState())
}

async function documento(logo: Uint8Array, dibujar: (lienzo: Lienzo, imagen: PDFImage) => void) {
  const doc = await PDFDocument.create()
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold)
  const imagen = await doc.embedJpg(logo)
  const lienzo = new Lienzo(doc, regular, negrita)
  dibujar(lienzo, imagen)
  return doc.save()
}

export function pdfPrestamo(datos: DatosPrestamoPdf, logo: Uint8Array): Promise<Uint8Array> {
  const filas = tablaCuotas(datos)
  return documento(logo, (lienzo, imagen) => {
    lienzo.encabezado(imagen, "Comprobante del préstamo")
    lienzo.pares([
      ["Cliente", datos.cliente],
      ["Identificación", datos.identificacion || "Sin identificación"],
      ["Ruta", datos.ruta],
      ["Fecha", fechaBonita(datos.fechaInicio)],
      ["Monto entregado", pesos(datos.montoEntregado)],
      ["% rédito", `${datos.porcentaje} %`],
      ["Monto del rédito", pesos(datos.redito)],
      ["Total", pesos(datos.total)],
      ["Número de cuotas", String(datos.numeroCuotas)],
      ["Frecuencia", frecuenciaTexto(datos.frecuencia)],
    ])
    lienzo.tabla(filas)
  })
}

export function pdfPago(datos: DatosPagoPdf, logo: Uint8Array): Promise<Uint8Array> {
  return documento(logo, (lienzo, imagen) => {
    lienzo.encabezado(imagen, "Comprobante del pago")
    lienzo.campo("Cliente", datos.cliente)
    lienzo.campo("Fecha", fechaBonita(datos.fecha))
    lienzo.campo("Monto pagado", pesos(datos.monto))
    lienzo.campo("Saldo que queda", pesos(datos.saldo))
    lienzo.campo("Quién cobró", datos.cobrador || "Sin nombre")
    if (datos.anulado) lienzo.campo("Estado", "Anulado")
  })
}
