/**
 * Layout raíz de la aplicación
 * 
 * - Envuelve todo con el AuthProvider
 * - Redirige a login si no está autenticado
 * - Configura fuentes y splash screen
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { router } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { authState, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
      if (!authState.isAuthenticated) {
        router.replace('/login');
      }
    }
  }, [loading, authState.isAuthenticated]);

  return (
    <>
      <StatusBar style="light" backgroundColor="#1A2E5A" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1A2E5A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
