import { type FirebaseApp, getApps, initializeApp } from "firebase/app"
import {
  type Auth,
  getAuth,
  inMemoryPersistence,
  initializeAuth,
} from "firebase/auth"
import { type Firestore, getFirestore } from "firebase/firestore"

const NOMBRE_ALTA = "alta-usuario"

function configFirebase() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error("Faltan las variables de Firebase. Revisa .env.local.")
  }
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  }
}

export const DOMINIO_CORREO = "adl-prestamos.firebaseapp.com"

export function correoDeUsuario(usuario: string): string {
  return `${usuario.trim().toLowerCase()}@${DOMINIO_CORREO}`
}

export function appPrincipal(): FirebaseApp {
  return getApps().find((app) => app.name === "[DEFAULT]") ?? initializeApp(configFirebase())
}

export function authPrincipal(): Auth {
  return getAuth(appPrincipal())
}

export function dbPrincipal(): Firestore {
  return getFirestore(appPrincipal())
}

export function appAlta(): FirebaseApp {
  return getApps().find((app) => app.name === NOMBRE_ALTA) ?? initializeApp(configFirebase(), NOMBRE_ALTA)
}

let authDeAlta: Auth | null = null

export function authAlta(): Auth {
  if (authDeAlta) return authDeAlta
  try {
    authDeAlta = initializeAuth(appAlta(), { persistence: inMemoryPersistence })
  } catch {
    authDeAlta = getAuth(appAlta())
  }
  return authDeAlta
}

export function dbAlta(): Firestore {
  return getFirestore(appAlta())
}
