import { Button } from "@/components/ui/button"

const PASOS = [
  "Abre la consola de Firebase.",
  "Entra al proyecto adl-prestamos.",
  "Ve a Firestore Database, luego a Reglas.",
  "Borra lo que hay y pega todo el archivo firestore.rules de este proyecto.",
  "Pulsa Publicar.",
]

export function AvisoReglas({ onReintentar }: { onReintentar: () => void }) {
  return (
    <section className="grid gap-4 rounded-3xl border bg-card p-5" role="alert">
      <h1 className="text-2xl font-extrabold">Firestore está cerrado</h1>
      <p className="text-base leading-relaxed">
        El proyecto está en modo producción y hoy niega cada lectura y cada
        escritura. Hay que publicar las reglas una vez. Después de eso, esta
        pantalla desaparece.
      </p>
      <ol className="grid list-decimal gap-2 pl-5 text-base leading-relaxed">
        {PASOS.map((paso) => (
          <li key={paso}>{paso}</li>
        ))}
      </ol>
      <a
        className="text-base font-bold text-primary underline"
        href="https://console.firebase.google.com/project/adl-prestamos/firestore/rules"
        target="_blank"
        rel="noreferrer"
      >
        Abrir las reglas en Firebase
      </a>
      <Button type="button" size="lg" onClick={onReintentar}>
        Ya las publiqué
      </Button>
    </section>
  )
}
