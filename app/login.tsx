/**
 * Pantalla de Login
 *
 * Primera pantalla que ve el operador.
 * Permite iniciar sesión con Google para conectar el Drive.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { resetDemoDatabase } from '../services/sheets.service';
import { showAlert } from '../utils/cross-alert';
import { Colors } from '../constants/Colors';

export default function LoginScreen() {
  const { authState, setAuthState } = useAuth();
  const { login, loading, error } = useGoogleAuth(authState);

  // Al loguearse exitosamente: empuja el nuevo estado al contexto global
  // (para que el dashboard lo vea) y navega al dashboard.
  const handleLogin = async () => {
    const result = await login();
    if (result) {
      setAuthState(result);
      router.replace('/(tabs)');
    }
  };

  // Login simulado para Modo Demo/Prueba.
  // Reinicia siempre los 3 registros de ejemplo (100% ficticios, en memoria,
  // nunca tocan Google Sheets) para que cada práctica arranque de cero.
  const handleDemoLogin = () => {
    resetDemoDatabase();
    setAuthState({
      isAuthenticated: true,
      accessToken: 'demo',
      userEmail: 'demo@institucion.edu.ar',
      spreadsheetId: 'demo-spreadsheet-id',
      isDemoMode: true,
    });
    router.replace('/(tabs)');
  };

  React.useEffect(() => {
    if (authState.isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [authState.isAuthenticated]);

  React.useEffect(() => {
    if (error) {
      showAlert('Error de inicio de sesión', error);
    }
  }, [error]);

  return (
    <View style={styles.container}>
      {/* Logo / Encabezado institucional */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🎓</Text>
        </View>
        <Text style={styles.title}>Gestión de Títulos</Text>
        <Text style={styles.subtitle}>Secundario de Adultos</Text>
      </View>

      {/* Descripción */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionText}>
          Registrá los títulos académicos fotografiándolos y almacenándolos automáticamente en Google Drive.
        </Text>
      </View>

      {/* Pasos rápidos */}
      <View style={styles.stepsContainer}>
        <StepItem icon="📷" text="Fotografiá el título" />
        <StepItem icon="🤖" text="La app extrae los datos automáticamente" />
        <StepItem icon="📊" text="Se guarda en tu hoja de cálculo de Drive" />
      </View>

      {/* Botón de login */}
      <View style={styles.loginContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>Conectando con Google...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Iniciar sesión con Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.demoButtonText}>Probar en Modo Demo (Offline)</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.disclaimer}>
          Solo necesitás acceso a Google Sheets en tu Drive.{'\n'}
          Tus datos nunca salen de tu cuenta de Google.
        </Text>
      </View>
    </View>
  );
}

function StepItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.stepItem}>
      <Text style={styles.stepIcon}>{icon}</Text>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  logoIcon: {
    fontSize: 44,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.textLight,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.accentLight,
    marginTop: 6,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  descriptionContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  descriptionText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 14,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
  },
  stepIcon: {
    fontSize: 24,
  },
  stepText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  loginContainer: {
    alignItems: 'center',
    gap: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.textLight,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  googleIcon: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.accentLight,
    fontSize: 14,
  },
  disclaimer: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  demoButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accentLight,
  },
});
