export function debeCompartir(telefono: boolean, puedeCompartirArchivos: boolean): boolean {
  return telefono && puedeCompartirArchivos
}

export function esTelefono(): boolean {
  const agente = navigator.userAgent
  if (/Android|iPhone|iPad|iPod/i.test(agente)) return true
  if (navigator.maxTouchPoints > 1 && /Mac/i.test(agente)) return true
  return (
    window.matchMedia("(max-width: 900px)").matches &&
    navigator.maxTouchPoints > 0 &&
    window.matchMedia("(pointer: coarse)").matches
  )
}

function esCancelacion(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "AbortError"
  )
}

function descargar(archivo: File) {
  const url = URL.createObjectURL(archivo)
  const ancla = document.createElement("a")
  ancla.href = url
  ancla.download = archivo.name
  ancla.rel = "noopener"
  document.body.appendChild(ancla)
  ancla.click()
  ancla.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export async function entregarPdf(
  nombre: string,
  bytes: Uint8Array,
): Promise<"compartido" | "descargado" | "cancelado"> {
  const copia = new Uint8Array(bytes.byteLength)
  copia.set(bytes)
  const archivo = new File([copia], nombre, { type: "application/pdf" })
  const puede =
    typeof navigator.share === "function" && navigator.canShare?.({ files: [archivo] }) === true
  if (debeCompartir(esTelefono(), puede)) {
    try {
      await navigator.share({ files: [archivo] })
      return "compartido"
    } catch (error) {
      if (esCancelacion(error)) return "cancelado"
    }
  }
  descargar(archivo)
  return "descargado"
}
