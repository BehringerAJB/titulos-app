/**
 * Servicio de Autenticación Google
 *
 * Maneja OAuth 2.0 con Google usando expo-auth-session.
 * Los tokens se almacenan de forma segura con expo-secure-store (nativo)
 * o localStorage (web, con fallback en memoria).
 *
 * CONFIGURACIÓN REQUERIDA (ver docs/SETUP_GCP.md):
 * - Crear proyecto en Google Cloud Console
 * - Habilitar Google Sheets API
 * - Crear credenciales OAuth 2.0
 * - Copiar el Client ID en las constantes de abajo
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import type { AuthState } from '../types';
import { logInfo, logWarn } from '../utils/logger';

// Completar WebBrowser para el flujo OAuth
WebBrowser.maybeCompleteAuthSession();

// ─── CONSTANTES DE CONFIGURACIÓN ──────────────────────────────────────────────
const GOOGLE_CLIENT_ID_ANDROID = '636394277954-odv966o5h6sg6463768d9ed5kivpfim3.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_IOS     = 'TU_IOS_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_WEB     = '636394277954-a7mjj9fk9k8qh5dput0fm8oc5ganultc.apps.googleusercontent.com';

// Scopes necesarios para leer/escribir Google Sheets
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'email',
  'profile',
];

// Claves de SecureStore
const KEYS = {
  ACCESS_TOKEN:    'TITULOS_ACCESS_TOKEN',
  REFRESH_TOKEN:   'TITULOS_REFRESH_TOKEN',
  USER_EMAIL:      'TITULOS_USER_EMAIL',
  SPREADSHEET_ID:  'TITULOS_SPREADSHEET_ID',
};

// ─── ADAPTADOR DE ALMACENAMIENTO MULTIPLATAFORMA ──────────────────────────────
// En nativo (Android/iOS) usamos SecureStore (cifrado).
// En web, SecureStore no existe: usamos localStorage, y si tampoco está
// disponible (modo privado, SSR, etc.) caemos a una memoria en RAM.
const memoryStore: Record<string, string> = {};

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memoryStore[key] = value;
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      const v = window.localStorage.getItem(key);
      return v !== null ? v : (memoryStore[key] ?? null);
    } catch {
      return memoryStore[key] ?? null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // noop
    }
    delete memoryStore[key];
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

// ─── FUNCIONES DE ALMACENAMIENTO ──────────────────────────────────────────────

/** Guarda el access token de forma segura */
export async function saveAccessToken(token: string): Promise<void> {
  await storageSet(KEYS.ACCESS_TOKEN, token);
}

/** Recupera el access token almacenado */
export async function getAccessToken(): Promise<string | null> {
  return storageGet(KEYS.ACCESS_TOKEN);
}

/** Guarda el email del usuario autenticado */
export async function saveUserEmail(email: string): Promise<void> {
  await storageSet(KEYS.USER_EMAIL, email);
}

/** Recupera el email del usuario */
export async function getUserEmail(): Promise<string | null> {
  return storageGet(KEYS.USER_EMAIL);
}

/** Guarda el ID de la hoja de cálculo vinculada */
export async function saveSpreadsheetId(id: string): Promise<void> {
  await storageSet(KEYS.SPREADSHEET_ID, id);
}

/** Recupera el ID de la hoja de cálculo */
export async function getSpreadsheetId(): Promise<string | null> {
  return storageGet(KEYS.SPREADSHEET_ID);
}

/** Cierra la sesión: elimina todos los tokens almacenados */
export async function logout(): Promise<void> {
  await Promise.all(
    Object.values(KEYS).map((key) => storageDelete(key))
  );
}

/** Verifica si hay una sesión activa */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}

/**
 * Pide un access token fresco a la sesión nativa de Google (sin mostrar
 * ningún diálogo de login mientras la sesión siga siendo válida) y lo
 * persiste. Se usa cuando una llamada a la API de Sheets/Drive falla
 * porque el token guardado ya venció — el access token de Google dura
 * poco (típicamente ~1 hora), así que esto es lo que evita que la app
 * quede "sin conexión" después de un rato de estar abierta o al otro día.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const tokens = await GoogleSignin.getTokens();
    await saveAccessToken(tokens.accessToken);
    logInfo('auth.refreshAccessToken', 'Token renovado correctamente');
    return tokens.accessToken;
  } catch (err: any) {
    logWarn('auth.refreshAccessToken', `No se pudo renovar el token: ${err?.message || err}`);
    return null;
  }
}

/**
 * Recupera el estado completo de autenticación.
 * Útil para inicializar la app con los datos guardados.
 */
export async function getAuthState(): Promise<AuthState> {
  const [accessToken, userEmail, spreadsheetId] = await Promise.all([
    getAccessToken(),
    getUserEmail(),
    getSpreadsheetId(),
  ]);

  return {
    isAuthenticated: !!accessToken,
    accessToken,
    userEmail,
    spreadsheetId,
  };
}

/** Exporta las constantes de configuración para uso en hooks */
export const AUTH_CONFIG = {
  GOOGLE_CLIENT_ID_ANDROID,
  GOOGLE_CLIENT_ID_IOS,
  GOOGLE_CLIENT_ID_WEB,
  SCOPES,
};
