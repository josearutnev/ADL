import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  atrasoDe,
  calcularPrestamo,
  esDomingo,
  fechasCuotas,
  sigueDebiendo,
  tocaHoy,
} from "./calculo.ts"

const base = {
  fechaInicio: "2026-10-09",
  numeroCuotas: 4,
  frecuencia: "diario" as const,
  cuota: 500,
  cuotaUltima: 500,
  total: 2000,
  saldo: 2000,
}

describe("calcularPrestamo", () => {
  it("suma el rédito al monto y parte en cuotas iguales", () => {
    const calculo = calcularPrestamo(10000, 20, 24)
    assert.deepEqual(calculo, {
      entregado: 10000,
      porcentaje: 20,
      redito: 2000,
      total: 12000,
      cuota: 500,
      cuotaUltima: 500,
      numeroCuotas: 24,
    })
  })

  it("deja el resto en la última cuota, en pesos enteros", () => {
    const calculo = calcularPrestamo(10000, 10, 3)
    assert.ok(calculo)
    assert.equal(calculo.redito, 1000)
    assert.equal(calculo.total, 11000)
    assert.equal(calculo.cuota, 3666)
    assert.equal(calculo.cuotaUltima, 3668)
    assert.equal(calculo.cuota * 2 + calculo.cuotaUltima, 11000)
  })

  it("rechaza una cuota de cero pesos", () => {
    assert.equal(calcularPrestamo(2, 0, 5), null)
  })
})

describe("fechas y atraso", () => {
  it("el diario salta el domingo", () => {
    assert.equal(esDomingo("2026-10-11"), true)
    assert.deepEqual(fechasCuotas("2026-10-09", 4, "diario"), [
      "2026-10-09",
      "2026-10-10",
      "2026-10-12",
      "2026-10-13",
    ])
  })

  it("si empieza en domingo, la primera cuota pasa al lunes", () => {
    assert.equal(fechasCuotas("2026-10-11", 2, "diario")[0], "2026-10-12")
  })

  it("el semanal cae el mismo día, aunque sea domingo", () => {
    assert.deepEqual(fechasCuotas("2026-10-11", 2, "semanal"), [
      "2026-10-11",
      "2026-10-18",
    ])
  })

  it("el atraso mira los días anteriores, no la cuota de hoy", () => {
    assert.equal(atrasoDe(base, "2026-10-12"), 1000)
    assert.equal(tocaHoy(base, "2026-10-12"), true)
    assert.equal(atrasoDe({ ...base, saldo: 1500 }, "2026-10-12"), 500)
    assert.equal(atrasoDe({ ...base, saldo: 500 }, "2026-10-12"), 0)
  })

  it("un abono solo baja el saldo: la cuota no cambia", () => {
    const despues = { ...base, saldo: base.saldo - 200 }
    assert.equal(despues.cuota, base.cuota)
    assert.equal(atrasoDe(despues, "2026-10-10"), 300)
  })

  it("quien ya terminó las fechas y sigue debiendo aparece entre semana", () => {
    assert.equal(sigueDebiendo(base, "2026-10-14"), true)
    assert.equal(sigueDebiendo(base, "2026-10-11"), false)
    assert.equal(atrasoDe(base, "2026-10-14"), 2000)
  })
})
