/**
 * Utilidad: reintento automático cuando el access token de Google vence
 *
 * El access token de Google dura 1 hora. Cuando una llamada a la API de
 * Sheets/Drive falla por token vencido (HTTP 401), en vez de mostrarle al
 * usuario un error confuso, intentamos renovar el token en segundo plano
 * (sin pedirle que vuelva a loguearse) y reintentamos la operación UNA vez.
 *
 * Si la renovación también falla (ej: el usuario cerró sesión de Google en
 * el dispositivo, o no hay conexión real), ahí sí se le informa que su
 * sesión venció y tiene que volver a iniciar sesión.
 */

import { refreshAccessToken } from '../hooks/useGoogleAuth';
import type { AuthState } from '../types';

/** Se lanza cuando el token venció y no se pudo renovar — la sesión real terminó */
export class SessionExpiredError extends Error {
  constructor() {
    super('SESSION_EXPIRED');
    this.name = 'SessionExpiredError';
  }
}

function isAuthError(err: any): boolean {
  return err?.response?.status === 401 || err?.response?.status === 403;
}

/**
 * Ejecuta `operation` con el access token actual. Si falla por token
 * vencido, renueva el token, actualiza el estado global de auth, y
 * reintenta la operación una sola vez.
 *
 * @param authState - authState actual (del contexto)
 * @param setAuthState - setter del contexto, para guardar el token renovado
 * @param operation - función que recibe el accessToken vigente y hace la llamada real
 */
export async function withTokenRefresh<T>(
  authState: AuthState,
  setAuthState: (state: AuthState) => void,
  operation: (accessToken: string) => Promise<T>
): Promise<T> {
  // El Modo Demo no usa tokens reales — nunca vence, no hace falta nada de esto
  if (authState.isDemoMode || authState.accessToken === 'demo') {
    return operation(authState.accessToken as string);
  }

  try {
    return await operation(authState.accessToken as string);
  } catch (err: any) {
    if (!isAuthError(err)) {
      throw err; // no es un problema de token vencido — es otro error real
    }

    // Intentar renovar el token en segundo plano
    const newToken = await refreshAccessToken();
    if (!newToken) {
      throw new SessionExpiredError();
    }

    setAuthState({ ...authState, accessToken: newToken });
    return operation(newToken); // reintento único con el token nuevo
  }
}
