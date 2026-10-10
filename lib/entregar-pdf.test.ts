import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { debeCompartir } from "./entregar-pdf.ts"

describe("entrega del comprobante", () => {
  it("en el teléfono comparte el archivo si el navegador puede", () => {
    assert.equal(debeCompartir(true, true), true)
  })

  it("en el computador descarga, aunque exista la API", () => {
    assert.equal(debeCompartir(false, true), false)
  })

  it("si el teléfono no puede compartir, descarga", () => {
    assert.equal(debeCompartir(true, false), false)
  })
})
