/**
 * Servicio de Autenticación Google
 * 
 * Maneja OAuth 2.0 con Google usando expo-auth-session.
 * Los tokens se almacenan de forma segura con expo-secure-store.
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
import type { AuthState } from '../types';

// Completar WebBrowser para el flujo OAuth
WebBrowser.maybeCompleteAuthSession();

// ─── CONSTANTES DE CONFIGURACIÓN ──────────────────────────────────────────────
// Client IDs del proyecto GCP "titulos-secundario" (ver docs/SETUP_GCP.md)
const GOOGLE_CLIENT_ID_ANDROID = '636394277954-odv966o5h6sg6463768d9ed5kivpfim3.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_IOS     = 'TU_IOS_CLIENT_ID.apps.googleusercontent.com'; // iPhone descartado por ahora
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



// ─── FUNCIONES DE SECURE STORE ────────────────────────────────────────────────

/** Guarda el access token de forma segura */
export async function saveAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
}

/** Recupera el access token almacenado */
export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
}

/** Guarda el email del usuario autenticado */
export async function saveUserEmail(email: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.USER_EMAIL, email);
}

/** Recupera el email del usuario */
export async function getUserEmail(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.USER_EMAIL);
}

/** Guarda el ID de la hoja de cálculo vinculada */
export async function saveSpreadsheetId(id: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.SPREADSHEET_ID, id);
}

/** Recupera el ID de la hoja de cálculo */
export async function getSpreadsheetId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.SPREADSHEET_ID);
}

/** Cierra la sesión: elimina todos los tokens almacenados */
export async function logout(): Promise<void> {
  await Promise.all(
    Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key))
  );
}

/** Verifica si hay una sesión activa */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
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
