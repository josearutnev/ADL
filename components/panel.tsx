"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSesion } from "@/lib/sesion"
import { cn } from "cn"

const ENLACES = [
  { href: "/hoy", etiqueta: "Hoy" },
  { href: "/clientes", etiqueta: "Clientes" },
  { href: "/prestamos/nuevo", etiqueta: "Préstamo", admin: true },
  { href: "/pagos", etiqueta: "Pagos" },
  { href: "/rutas", etiqueta: "Rutas", admin: true },
  { href: "/usuarios", etiqueta: "Usuarios", admin: true },
]

function activo(pathname: string, href: string): boolean {
  if (href === "/hoy" || href === "/pagos" || href === "/prestamos/nuevo") {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Panel({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { perfil, salir } = useSesion()
  const [mas, setMas] = useState(false)
  const admin = perfil?.rol === "admin"
  const visibles = ENLACES.filter((enlace) => !enlace.admin || admin)
  const saludo = (perfil?.nombre || perfil?.usuario || "Hola").trim().split(/\s+/)[0]
  const barra = admin
    ? [
        ENLACES[0],
        ENLACES[1],
        ENLACES[3],
      ]
    : visibles

  return (
    <div className="min-h-dvh bg-background md:grid md:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r bg-card md:flex md:h-dvh md:flex-col md:gap-2 md:p-4">
        <div className="flex items-center gap-3 px-1 py-2">
          <Logo tamano={72} />
          <div>
            <p className="text-sm font-bold text-[oklch(0.45_0.09_85)]">ADL</p>
            <p className="text-base font-extrabold leading-tight">Préstamos</p>
          </div>
        </div>
        <nav className="mt-4 grid gap-1">
          {visibles.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className={cn(
                "flex min-h-12 items-center rounded-2xl px-4 text-lg font-bold",
                activo(pathname, enlace.href)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {enlace.etiqueta}
            </Link>
          ))}
        </nav>
        <div className="mt-auto grid gap-3 px-1 pt-4">
          <p className="text-base">
            <span className="font-extrabold">{saludo}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {admin ? "Administrador" : "Cobrador"}
            </span>
          </p>
          <Button type="button" variant="outline" onClick={() => void salir()}>
            Salir
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <Logo tamano={56} />
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold">Hola, {saludo}</p>
            <p className="text-sm text-muted-foreground">
              {admin ? "Administrador" : "Cobrador"}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="ml-auto h-12 px-4"
            onClick={() => void salir()}
          >
            Salir
          </Button>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-28 md:pb-10">
          {children}
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-card px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
        <div className={cn("grid gap-1", admin ? "grid-cols-4" : "grid-cols-3")}>
          {barra.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className={cn(
                "flex min-h-14 items-center justify-center rounded-2xl text-base font-extrabold",
                activo(pathname, enlace.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground",
              )}
            >
              {enlace.etiqueta}
            </Link>
          ))}
          {admin ? (
            <button
              type="button"
              className="flex min-h-14 items-center justify-center rounded-2xl text-base font-extrabold"
              onClick={() => setMas(true)}
            >
              Más
            </button>
          ) : null}
        </div>
      </nav>
      <Dialog open={mas} onOpenChange={setMas}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Más</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            {ENLACES.filter((enlace) => enlace.admin).map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                onClick={() => setMas(false)}
                className="flex min-h-14 items-center rounded-2xl bg-muted px-4 text-lg font-extrabold"
              >
                {enlace.etiqueta}
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
