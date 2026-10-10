import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import { PDFDocument } from "pdf-lib"
import { pdfPago, pdfPrestamo } from "./comprobante.ts"

const logo = new Uint8Array(readFileSync(new URL("../public/logo-adl.jpg", import.meta.url)))

const prestamo = {
  cliente: "María Pérez",
  identificacion: "123456",
  ruta: "Centro",
  fechaInicio: "2026-10-09",
  montoEntregado: 10000,
  porcentaje: 20,
  redito: 2000,
  total: 12000,
  numeroCuotas: 24,
  frecuencia: "diario" as const,
  cuota: 500,
  cuotaUltima: 500,
}

describe("comprobantes", () => {
  it("arma el PDF del préstamo", async () => {
    const bytes = await pdfPrestamo(prestamo, logo)
    assert.equal(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]), "%PDF")
    const doc = await PDFDocument.load(bytes)
    assert.ok(doc.getPageCount() >= 1)
  })

  it("sigue en otra hoja cuando hay muchas cuotas", async () => {
    const bytes = await pdfPrestamo({ ...prestamo, numeroCuotas: 80, cuota: 150, cuotaUltima: 150 }, logo)
    const doc = await PDFDocument.load(bytes)
    assert.ok(doc.getPageCount() > 1)
  })

  it("arma el PDF del pago en una hoja", async () => {
    const bytes = await pdfPago(
      {
        cliente: "María Pérez",
        fecha: "2026-10-10",
        monto: 500,
        saldo: 11500,
        cobrador: "Ana",
      },
      logo,
    )
    const doc = await PDFDocument.load(bytes)
    assert.equal(doc.getPageCount(), 1)
  })
})
