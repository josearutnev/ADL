import Link from "next/link"

export default function NoEncontrada() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-5">
      <h1 className="text-3xl font-extrabold">No encontré esa página</h1>
      <p className="text-lg">Vuelve al cobro de hoy.</p>
      <Link href="/hoy" className="text-lg font-extrabold text-primary">
        Ir a hoy
      </Link>
    </main>
  )
}
