import { Suspense } from "react"
import { Cargando } from "@/components/estados"
import { FormularioPrestamo } from "@/app/(panel)/prestamos/nuevo/formulario"

export default function PaginaNuevoPrestamo() {
  return (
    <Suspense fallback={<Cargando texto="Abriendo el préstamo…" />}>
      <FormularioPrestamo />
    </Suspense>
  )
}
