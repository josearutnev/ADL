"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"
import {
  Banknote,
  HandCoins,
  House,
  LogOut,
  MapPin,
  MoreHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
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

const BARRA: { href: string; etiqueta: string; icono: LucideIcon }[] = [
  { href: "/hoy", etiqueta: "Hoy", icono: House },
  { href: "/clientes", etiqueta: "Clientes", icono: Users },
  { href: "/prestamos/nuevo", etiqueta: "Préstamos", icono: HandCoins },
]

function activo(pathname: string, href: string): boolean {
  if (href === "/hoy" || href === "/pagos" || href === "/prestamos/nuevo") {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

function activoTelefono(pathname: string, href: string): boolean {
  if (href === "/prestamos/nuevo") return pathname.startsWith("/prestamos")
  if (href === "/clientes") return pathname === "/clientes" || pathname.startsWith("/clientes/")
  return pathname === href
}

export function Panel({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { perfil, salir } = useSesion()
  const [mas, setMas] = useState(false)
  const admin = perfil?.rol === "admin"
  const visibles = ENLACES.filter((enlace) => !enlace.admin || admin)
  const saludo = (perfil?.nombre || perfil?.usuario || "Hola").trim().split(/\s+/)[0]
  const masActivo = pathname === "/pagos" || pathname.startsWith("/rutas") || pathname.startsWith("/usuarios")
  const filasMas: { href?: string; etiqueta: string; icono: LucideIcon; admin?: boolean; salir?: boolean }[] = [
    { href: "/pagos", etiqueta: "Pagos", icono: Banknote },
    { href: "/rutas", etiqueta: "Rutas", icono: MapPin, admin: true },
    { href: "/usuarios", etiqueta: "Usuarios", icono: Users, admin: true },
    { etiqueta: "Salir", icono: LogOut, salir: true },
  ]

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
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-[calc(6.25rem+env(safe-area-inset-bottom))] md:pb-10">
          {children}
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-card px-2 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {BARRA.map((enlace) => {
            const Icono = enlace.icono
            const esta = activoTelefono(pathname, enlace.href)
            return (
              <Link
                key={enlace.href}
                href={enlace.href}
                aria-current={esta ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-sm font-extrabold leading-none",
                  esta ? "bg-primary text-primary-foreground" : "text-foreground",
                )}
              >
                <Icono className="size-6" strokeWidth={2.25} aria-hidden />
                {enlace.etiqueta}
              </Link>
            )
          })}
          <button
            type="button"
            aria-expanded={mas}
            aria-current={masActivo ? "page" : undefined}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-sm font-extrabold leading-none",
              mas || masActivo ? "bg-primary text-primary-foreground" : "text-foreground",
            )}
            onClick={() => setMas(true)}
          >
            <MoreHorizontal className="size-6" strokeWidth={2.25} aria-hidden />
            Más
          </button>
        </div>
      </nav>
      {mas ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Cerrar"
            onClick={() => setMas(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg">
            <p className="px-1 pb-3 text-2xl font-extrabold">Más</p>
            <div className="grid gap-2">
              {filasMas
                .filter((fila) => !fila.admin || admin)
                .map((fila) => {
                  const Icono = fila.icono
                  if (fila.salir) {
                    return (
                      <button
                        key="salir"
                        type="button"
                        className="flex min-h-16 w-full items-center gap-4 rounded-2xl bg-muted px-4 text-xl font-extrabold"
                        onClick={() => void salir()}
                      >
                        <Icono className="size-7" strokeWidth={2.25} aria-hidden />
                        Salir
                      </button>
                    )
                  }
                  return (
                    <Link
                      key={fila.href}
                      href={fila.href ?? "/hoy"}
                      onClick={() => setMas(false)}
                      className="flex min-h-16 w-full items-center gap-4 rounded-2xl bg-muted px-4 text-xl font-extrabold"
                    >
                      <Icono className="size-7" strokeWidth={2.25} aria-hidden />
                      {fila.etiqueta}
                    </Link>
                  )
                })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
