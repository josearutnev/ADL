const TEXTOS: Record<string, string> = {
  "auth/invalid-credential": "Usuario o clave incorrectos.",
  "auth/invalid-email": "Ese usuario no sirve. Usa letras y números, sin espacios.",
  "auth/email-already-in-use": "Ese usuario ya existe.",
  "auth/weak-password": "La clave necesita al menos 6 caracteres.",
  "auth/too-many-requests": "Demasiados intentos. Espera un momento y vuelve a probar.",
  "auth/network-request-failed": "No hay conexión. Revisa la red e intenta de nuevo.",
  "permission-denied":
    "Firestore negó el permiso. Publica las reglas del archivo firestore.rules y vuelve a intentar.",
  "firestore/permission-denied":
    "Firestore negó el permiso. Publica las reglas del archivo firestore.rules y vuelve a intentar.",
}

export function mensajeError(error: unknown): string {
  if (typeof error === "object" && error && "code" in error) {
    const codigo = String((error as { code: string }).code)
    if (TEXTOS[codigo]) return TEXTOS[codigo]
  }
  if (error instanceof Error) {
    if (/permission/i.test(error.message)) return TEXTOS["permission-denied"]
    if (error.message.trim()) return error.message
  }
  return "Algo salió mal. Intenta de nuevo."
}

export function usuarioValido(usuario: string): boolean {
  return /^[a-zA-Z0-9._-]{3,24}$/.test(usuario.trim())
}

export const MENSAJE_USUARIO =
  "El usuario lleva de 3 a 24 letras o números, sin espacios."
