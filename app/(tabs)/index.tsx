/**
 * Pantalla: Dashboard / Inicio
 * 
 * Muestra estadísticas generales y accesos rápidos.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getAllRows } from '../../services/sheets.service';
import { logout as apiLogout } from '../../services/auth.service';
import { showAlert } from '../../utils/cross-alert';
import { logError, describeError } from '../../utils/logger';
import { Colors } from '../../constants/Colors';
import type { DashboardStats } from '../../types';

export default function DashboardScreen() {
  const { authState, setAuthState } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    retirados: 0,
    remitidos: 0,
    pendientes: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handleLogout = async () => {
    showAlert(
      'Cerrar sesión',
      '¿Estás seguro de que querés cerrar la sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiLogout();
              setAuthState({
                isAuthenticated: false,
                accessToken: null,
                userEmail: null,
                spreadsheetId: null,
              });
            } catch (err) {
              showAlert('Error', 'No se pudo cerrar la sesión.');
            }
          },
        },
      ]
    );
  };

  const loadStats = useCallback(async () => {
    if (!authState.accessToken || !authState.spreadsheetId) return;

    try {
      const rows = await getAllRows(authState.accessToken, authState.spreadsheetId);
      const total = rows.length;
      const retirados = rows.filter((r) => r.retirado).length;
      const remitidos = rows.filter((r) => r.remitidoLaPlata).length;
      const pendientes = total - retirados;

      setStats({ total, retirados, remitidos, pendientes });
      setLastSync(new Date().toLocaleTimeString('es-AR'));
    } catch (err) {
      logError('dashboard.loadStats', describeError(err));
      showAlert(
        'No se pudieron cargar los datos',
        'Hubo un problema al conectar con Google Sheets. Podés ver el detalle en "📝 Ver registro", abajo.'
      );
    }
  }, [authState]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accent}
          colors={[Colors.accent]}
        />
      }
    >
      {/* Bienvenida */}
      <View style={styles.welcomeCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeText}>Bienvenido</Text>
          <Text style={styles.emailText}>{authState.userEmail}</Text>
          {lastSync && (
            <Text style={styles.syncText}>✓ Última actualización: {lastSync}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>🚪 Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      <Text style={styles.sectionTitle}>Resumen General</Text>

      <View style={styles.statsGrid}>
        <StatCard
          icon="📋"
          value={stats.total}
          label="Total de Títulos"
          color={Colors.primary}
          bgColor={Colors.surfaceAlt}
        />
        <StatCard
          icon="⏳"
          value={stats.pendientes}
          label="Pendientes de Retiro"
          color={Colors.warning}
          bgColor={Colors.warningLight}
        />
        <StatCard
          icon="✅"
          value={stats.retirados}
          label="Retirados"
          color={Colors.success}
          bgColor={Colors.successLight}
        />
        <StatCard
          icon="📨"
          value={stats.remitidos}
          label="Remitidos a La Plata"
          color={Colors.info}
          bgColor={Colors.infoLight}
        />
      </View>

      {/* Acciones rápidas */}
      <Text style={styles.sectionTitle}>Acciones</Text>

      <TouchableOpacity
        style={styles.actionButtonPrimary}
        onPress={() => router.push('/(tabs)/nuevo')}
        activeOpacity={0.85}
      >
        <Text style={styles.actionIcon}>📷</Text>
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>Nuevo Título</Text>
          <Text style={styles.actionSubtitle}>Fotografiar y registrar un título</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButtonSecondary}
        onPress={() => router.push('/(tabs)/buscar')}
        activeOpacity={0.85}
      >
        <Text style={styles.actionIcon}>🔍</Text>
        <View style={styles.actionTextContainer}>
          <Text style={[styles.actionTitle, { color: Colors.primary }]}>
            Buscar / Editar
          </Text>
          <Text style={[styles.actionSubtitle, { color: Colors.textSecondary }]}>
            Registrar retiro o devolución
          </Text>
        </View>
        <Text style={[styles.chevron, { color: Colors.primary }]}>›</Text>
      </TouchableOpacity>

      {/* Info de Drive */}
      <View style={styles.driveInfo}>
        <Text style={styles.driveInfoText}>
          📊 Datos almacenados en Google Sheets
        </Text>
        <Text style={styles.driveInfoSub}>
          Archivo: "Títulos Secundario" en tu Drive
        </Text>
      </View>

      {/* Acceso al registro de eventos/errores */}
      <TouchableOpacity
        style={styles.logViewerButton}
        onPress={() => router.push('/log-viewer')}
        activeOpacity={0.7}
      >
        <Text style={styles.logViewerText}>📝 Ver registro de eventos</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
  bgColor,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  welcomeCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutButtonText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  welcomeText: {
    color: Colors.accentLight,
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emailText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  syncText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  actionButtonSecondary: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 30,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    color: Colors.textLight,
    fontSize: 17,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    color: Colors.accentLight,
    fontSize: 28,
    fontWeight: '300',
  },
  driveInfo: {
    backgroundColor: Colors.infoLight,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  driveInfoText: {
    color: Colors.info,
    fontWeight: '600',
    fontSize: 13,
  },
  driveInfoSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  logViewerButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  logViewerText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
