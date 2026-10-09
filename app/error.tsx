"use client"

import { Button } from "@/components/ui/button"

export default function ErrorPagina({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-5">
      <h1 className="text-3xl font-extrabold">Algo salió mal</h1>
      <p className="text-lg leading-relaxed">
        No pude mostrar esta pantalla. Intenta de nuevo.
      </p>
      <Button type="button" size="lg" onClick={reset}>
        Reintentar
      </Button>
    </main>
  )
}
