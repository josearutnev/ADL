"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { BotonComprobante } from "@/components/boton-comprobante"
import { BuscarSelect } from "@/components/buscar-select"
import { nombreRuta, useDatos } from "@/components/datos-provider"
import { Campo, Cargando, Vacio } from "@/components/estados"
import { FormularioCliente } from "@/components/formulario-cliente"
import { Button } from "@/components/ui/button"
import { cargarLogo, nombrePdf, pdfPrestamo, type DatosPrestamoPdf } from "@/lib/comprobante"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  calcularPrestamo,
  esDomingo,
  fechasCuotas,
  hoyLocal,
  type Frecuencia,
} from "@/lib/calculo"
import { crearPrestamo, crearRuta, guardarCliente } from "@/lib/datos"
import { fechaBonita, pesos, soloDigitos } from "@/lib/formato"
import { useSesion } from "@/lib/sesion"
import { cn } from "cn"

export function FormularioPrestamo() {
  const router = useRouter()
  const params = useSearchParams()
  const { perfil } = useSesion()
  const datos = useDatos()
  const [clienteId, setClienteId] = useState(params.get("cliente") ?? "")
  const [fecha, setFecha] = useState(hoyLocal())
  const [monto, setMonto] = useState("")
  const [porcentaje, setPorcentaje] = useState("20")
  const [cuotas, setCuotas] = useState("24")
  const [frecuencia, setFrecuencia] = useState<Frecuencia>("diario")
  const [nuevo, setNuevo] = useState(false)
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState<{ id: string; pdf: DatosPrestamoPdf } | null>(null)

  const calculo = useMemo(
    () => calcularPrestamo(Number(soloDigitos(monto)), Number(soloDigitos(porcentaje)), Number(soloDigitos(cuotas))),
    [monto, porcentaje, cuotas],
  )
  const fechas = calculo
    ? fechasCuotas(fecha, calculo.numeroCuotas, frecuencia)
    : []
  const cliente = datos.clientes?.find((item) => item.id === clienteId) ?? null

  if (perfil && perfil.rol !== "admin") {
    return (
      <Vacio
        titulo="Solo el administrador"
        texto="Un cobrador consulta y cobra. No abre préstamos."
      />
    )
  }
  if (!datos.clientes || !datos.rutas) return <Cargando />
  if (guardado) {
    return (
      <div className="grid gap-5">
        <h1 className="text-3xl font-extrabold">Préstamo guardado</h1>
        <p className="text-lg leading-relaxed">
          {guardado.pdf.cliente}. Total {pesos(guardado.pdf.total)}, cuota {pesos(guardado.pdf.cuota)}.
        </p>
        <BotonComprobante
          variante="default"
          nombre={nombrePdf("prestamo", guardado.pdf.cliente)}
          crear={async () => pdfPrestamo(guardado.pdf, await cargarLogo())}
        />
        <Button type="button" size="lg" variant="outline" onClick={() => router.push(`/prestamos/${guardado.id}`)}>
          Ver el préstamo
        </Button>
      </div>
    )
  }

  async function guardar() {
    if (!cliente || !calculo || !fecha) {
      setError("Elige el cliente y revisa los números antes de guardar.")
      return
    }
    setGuardando(true)
    setError("")
    try {
      const id = await crearPrestamo({
        cliente,
        fechaInicio: fecha,
        montoEntregado: calculo.entregado,
        porcentajeRedito: calculo.porcentaje,
        redito: calculo.redito,
        total: calculo.total,
        cuota: calculo.cuota,
        cuotaUltima: calculo.cuotaUltima,
        numeroCuotas: calculo.numeroCuotas,
        frecuencia,
      })
      const pdf: DatosPrestamoPdf = {
        cliente: cliente.nombre,
        identificacion: cliente.identificacion,
        ruta: nombreRuta(datos.rutas, cliente.rutaId),
        fechaInicio: fecha,
        montoEntregado: calculo.entregado,
        porcentaje: calculo.porcentaje,
        redito: calculo.redito,
        total: calculo.total,
        numeroCuotas: calculo.numeroCuotas,
        frecuencia,
        cuota: calculo.cuota,
        cuotaUltima: calculo.cuotaUltima,
      }
      toast.success("Préstamo guardado")
      setGuardado({ id, pdf })
      setGuardando(false)
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo guardar.")
      setGuardando(false)
    }
  }

  return (
    <div className="grid gap-5">
      <h1 className="text-3xl font-extrabold">Nuevo préstamo</h1>
      <p className="text-base leading-relaxed text-muted-foreground">
        El rédito es un porcentaje del dinero que entregas. Se suma al principio
        y se parte en cuotas iguales. No es interés de banco.
      </p>
      <Campo etiqueta="Cliente">
        <BuscarSelect
          opciones={datos.clientes.map((item) => ({
            id: item.id,
            titulo: item.nombre,
            detalle: item.identificacion,
          }))}
          valor={clienteId}
          onCambio={setClienteId}
          placeholder="Elige el cliente"
          textoBuscar="Buscar cliente"
          agregar={{
            modo: "otro",
            texto: "Agregar nuevo",
            onElegir: () => setNuevo(true),
          }}
        />
      </Campo>
      <Campo etiqueta="Fecha de inicio" ayuda="La primera cuota vence este día.">
        <Input type="date" value={fecha} onChange={(evento) => setFecha(evento.target.value)} />
      </Campo>
      <Campo etiqueta="Monto entregado" ayuda="Solo pesos, sin centavos.">
        <Input
          inputMode="numeric"
          value={monto}
          onChange={(evento) => setMonto(soloDigitos(evento.target.value))}
          placeholder="10000"
        />
      </Campo>
      <Campo etiqueta="% rédito" ayuda="Número entero. Ejemplo: 20.">
        <Input
          inputMode="numeric"
          value={porcentaje}
          onChange={(evento) => setPorcentaje(soloDigitos(evento.target.value))}
        />
      </Campo>
      <Campo etiqueta="Número de cuotas">
        <Input
          inputMode="numeric"
          value={cuotas}
          onChange={(evento) => setCuotas(soloDigitos(evento.target.value))}
        />
      </Campo>
      <div className="grid gap-2">
        <p className="text-base font-bold">¿Cada cuánto cobra?</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["diario", "Diario"],
              ["semanal", "Semanal"],
            ] as const
          ).map(([valor, etiqueta]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={frecuencia === valor}
              className={cn(
                "min-h-14 rounded-2xl border text-lg font-extrabold",
                frecuencia === valor ? "border-primary bg-primary text-primary-foreground" : "bg-card",
              )}
              onClick={() => setFrecuencia(valor)}
            >
              {etiqueta}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {frecuencia === "diario"
            ? "De lunes a sábado. El domingo no se cobra."
            : "El mismo día, cada semana."}
        </p>
      </div>
      {frecuencia === "diario" && fecha && esDomingo(fecha) ? (
        <p className="rounded-2xl bg-accent px-4 py-3 text-base">
          Ese día es domingo. La primera cuota pasa al lunes.
        </p>
      ) : null}
      {calculo && fechas[0] ? (
        <section className="grid grid-cols-2 gap-3 rounded-3xl border bg-card p-4">
          <Cifra etiqueta="Entregas" valor={pesos(calculo.entregado)} />
          <Cifra etiqueta="Rédito" valor={pesos(calculo.redito)} />
          <Cifra etiqueta="Total" valor={pesos(calculo.total)} />
          <Cifra etiqueta="Cuota" valor={pesos(calculo.cuota)} />
          <p className="col-span-2 text-base leading-relaxed">
            Cobra desde {fechaBonita(fechas[0])} hasta {fechaBonita(fechas[fechas.length - 1] ?? fechas[0])}.
            {calculo.cuota !== calculo.cuotaUltima
              ? ` Las cuotas son ${pesos(calculo.cuota)} y la última queda en ${pesos(calculo.cuotaUltima)}.`
              : ""}
          </p>
        </section>
      ) : (
        <p className="text-base text-muted-foreground">
          Escribe el monto, el porcentaje y las cuotas para ver los números.
        </p>
      )}
      {monto && !calculo ? (
        <p className="text-base font-semibold text-destructive">
          Con esos números la cuota no alcanza $1, o el porcentaje pasa de 300.
        </p>
      ) : null}
      {error ? <p className="text-base font-semibold text-destructive">{error}</p> : null}
      <Button type="button" size="lg" disabled={guardando || !calculo || !cliente} onClick={() => void guardar()}>
        {guardando ? "Guardando…" : "Guardar préstamo"}
      </Button>
      <Dialog open={nuevo} onOpenChange={setNuevo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
          </DialogHeader>
          <FormularioCliente
            rutas={datos.rutas}
            clientes={datos.clientes}
            puedeCrearRuta
            onCrearRuta={crearRuta}
            onCancelar={() => setNuevo(false)}
            onGuardar={async (datosCliente) => {
              const id = await guardarCliente(null, datosCliente, datos.prestamos ?? [])
              setClienteId(id)
              toast.success("Cliente guardado")
              setNuevo(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Cifra({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{etiqueta}</p>
      <p className="text-2xl font-extrabold">{valor}</p>
    </div>
  )
}
