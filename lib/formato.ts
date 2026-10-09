import { parseFecha } from "@/lib/calculo"

export function pesos(valor: number): string {
  const texto = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(Math.round(valor))
  return `$${texto}`
}

export function fechaBonita(iso: string): string {
  const texto = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parseFecha(iso))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function fechaCorta(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
  }).format(parseFecha(iso))
}

export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, "")
}
