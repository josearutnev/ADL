import Image from "next/image"
import { cn } from "cn"

export function Logo({
  tamano = 96,
  prioridad = false,
  className,
}: {
  tamano?: number
  prioridad?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-[22%] bg-[#1a1814] shadow-sm ring-2 ring-[oklch(0.72_0.11_85)]",
        className,
      )}
      style={{ width: tamano, height: tamano }}
    >
      <Image
        src="/logo-adl.jpg"
        alt="ADL Préstamos E Inversiones"
        width={tamano}
        height={tamano}
        priority={prioridad}
        className="h-full w-full object-cover"
      />
    </div>
  )
}
