/**
 * Contexto Global de Autenticación
 * 
 * Provee el estado de auth a toda la app.
 * Se inicializa leyendo los tokens guardados en SecureStore.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuthState } from '../services/auth.service';
import { refreshAccessToken } from '../hooks/useGoogleAuth';
import type { AuthState } from '../types';

interface AuthContextType {
  authState: AuthState;
  setAuthState: (state: AuthState) => void;
  loading: boolean;
}

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  userEmail: null,
  spreadsheetId: null,
};

const AuthContext = createContext<AuthContextType>({
  authState: defaultAuthState,
  setAuthState: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Al iniciar la app, recuperar estado de autenticación guardado
    getAuthState().then(async (state) => {
      // Si es una sesión real de Google (no Modo Demo), el access token
      // guardado puede tener horas y ya haber vencido. Lo renovamos en
      // segundo plano ACÁ, así el usuario no ve ningún error al abrir la
      // app — solo si la renovación falla (ej: cerró sesión de Google en
      // el dispositivo) se sigue usando el token viejo, que fallará más
      // adelante con un mensaje claro de "sesión vencida".
      if (state.isAuthenticated && !state.isDemoMode && state.accessToken !== 'demo') {
        const freshToken = await refreshAccessToken();
        if (freshToken) {
          state = { ...state, accessToken: freshToken };
        }
      }
      setAuthState(state);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ authState, setAuthState, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook para acceder al contexto de autenticación */
export function useAuth() {
  return useContext(AuthContext);
}
