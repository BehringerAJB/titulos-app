/**
 * Hook: Autenticación Google
 *
 * Usa @react-native-google-signin/google-signin — la librería NATIVA oficial
 * de Google. Reemplaza el flujo manual por navegador (expo-auth-session +
 * Client ID de tipo Android) que Google dejó de permitir en 2025/2026: ese
 * tipo de credencial está reservado exclusivamente para esta librería nativa.
 *
 * El Client ID Android (registrado con package name + SHA-1 en Google Cloud
 * Console) NO se usa acá directamente: la librería nativa lo resuelve sola
 * en el dispositivo. Lo único que hace falta en código es el Client ID WEB.
 *
 * IMPORTANTE: login() devuelve el nuevo AuthState (o null si falló/canceló).
 * Quien lo llama debe empujar ese estado al contexto global (setAuthState)
 * para que el resto de la app (dashboard, etc.) lo vea.
 */

import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {
  saveAccessToken,
  saveUserEmail,
  saveSpreadsheetId,
  logout as authLogout,
  AUTH_CONFIG,
} from '../services/auth.service';
import { findOrCreateSpreadsheet } from '../services/sheets.service';
import type { AuthState } from '../types';

// Scopes de Google APIs (los que empiezan con http; 'email'/'profile' ya
// vienen incluidos por defecto en el login básico de Google Sign-In)
const API_SCOPES = AUTH_CONFIG.SCOPES.filter((s) => s.startsWith('http'));

let configured = false;
function ensureConfigured() {
  if (configured || Platform.OS === 'web') return;
  GoogleSignin.configure({
    webClientId: AUTH_CONFIG.GOOGLE_CLIENT_ID_WEB,
    scopes: API_SCOPES,
    offlineAccess: false,
  });
  configured = true;
}

export function useGoogleAuth(_initialState?: AuthState) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureConfigured();
  }, []);

  /**
   * Inicia el flujo de login con Google.
   * Devuelve el AuthState resultante, o null si se canceló/falló.
   */
  const login = useCallback(async (): Promise<AuthState | null> => {
    // La librería nativa de Google Sign-In no funciona en la vista web.
    // Ahí solo queda disponible "Probar en Modo Demo".
    if (Platform.OS === 'web') {
      setError(
        'El login real de Google no está disponible en la vista web del navegador. ' +
          'Usá "Probar en Modo Demo" acá, o abrí la app instalada en el celular.'
      );
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      ensureConfigured();
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        // El usuario cerró el selector de cuentas sin elegir
        setError('Inicio de sesión cancelado.');
        return null;
      }

      const email = response.data.user.email;

      // Access token OAuth2 con los scopes ya consentidos (Sheets + Drive)
      const tokens = await GoogleSignin.getTokens();
      const accessToken = tokens.accessToken;

      // Busca o crea la planilla "Títulos Secundario" en el Drive del usuario
      const spreadsheetId = await findOrCreateSpreadsheet(accessToken);

      await Promise.all([
        saveAccessToken(accessToken),
        saveUserEmail(email),
        saveSpreadsheetId(spreadsheetId),
      ]);

      return {
        isAuthenticated: true,
        accessToken,
        userEmail: email,
        spreadsheetId,
      };
    } catch (err: any) {
      if (isErrorWithCode(err)) {
        switch (err.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            setError('Inicio de sesión cancelado.');
            break;
          case statusCodes.IN_PROGRESS:
            setError('Ya hay un inicio de sesión en curso.');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            setError('Este dispositivo no tiene Google Play Services actualizado.');
            break;
          default:
            console.error('[Auth] Error:', err);
            setError('Error al conectar con Google. Verificá la configuración.');
        }
      } else {
        console.error('[Auth] Error:', err);
        setError('Error al conectar con Google. Verificá tu conexión a internet.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Cierra la sesión nativa de Google y limpia el almacenamiento local */
  const logout = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        await GoogleSignin.signOut();
      } catch {
        // noop: si no había sesión nativa activa, no es un error real
      }
    }
    await authLogout();
  }, []);

  return { loading, error, login, logout };
}
