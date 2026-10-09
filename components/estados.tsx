import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="grid gap-3 py-8" role="status" aria-live="polite">
      <div className="h-8 w-40 animate-pulse rounded-2xl bg-muted" />
      <div className="h-28 animate-pulse rounded-3xl bg-muted" />
      <div className="h-28 animate-pulse rounded-3xl bg-muted" />
      <p className="text-lg text-muted-foreground">{texto}</p>
    </div>
  )
}

export function Vacio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-3xl border border-dashed bg-card px-5 py-10 text-center">
      <p className="text-xl font-extrabold">{titulo}</p>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">{texto}</p>
    </div>
  )
}

export function ErrorBloque({
  texto,
  onReintentar,
}: {
  texto: string
  onReintentar?: () => void
}) {
  return (
    <div className="rounded-3xl border border-destructive/40 bg-destructive/5 px-5 py-6" role="alert">
      <p className="text-lg font-extrabold">No se pudo completar</p>
      <p className="mt-2 text-base leading-relaxed">{texto}</p>
      {onReintentar ? (
        <Button className="mt-4" type="button" onClick={onReintentar}>
          Reintentar
        </Button>
      ) : null}
    </div>
  )
}

export function Campo({
  etiqueta,
  children,
  ayuda,
  error,
}: {
  etiqueta: string
  children: ReactNode
  ayuda?: string
  error?: string
}) {
  return (
    <label className="grid gap-2">
      <span className="text-base font-bold">{etiqueta}</span>
      {children}
      {ayuda ? <span className="text-sm leading-snug text-muted-foreground">{ayuda}</span> : null}
      {error ? <span className="text-sm font-semibold text-destructive">{error}</span> : null}
    </label>
  )
}
