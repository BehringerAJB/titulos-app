/**
 * Pantalla: Visor de Registro (logs)
 *
 * Muestra el historial local de eventos y errores de la app (login,
 * llamadas a Sheets/Drive, OCR) para poder diagnosticar problemas
 * directamente desde el celular. Se accede desde el botón
 * "📝 Ver registro" del Dashboard.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { getLogEntries, clearLog, type LogEntry } from '../utils/logger';
import { Colors } from '../constants/Colors';

export default function LogViewerScreen() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getLogEntries();
    setEntries(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleShare = async () => {
    if (entries.length === 0) return;
    const text = entries
      .slice()
      .reverse()
      .map((e) => `[${e.t}] [${e.l}] [${e.tag}] ${e.msg}`)
      .join('\n');
    try {
      await Share.share({ message: text });
    } catch {
      Alert.alert('Error', 'No se pudo compartir el registro.');
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Borrar registro',
      '¿Seguro que querés borrar todo el historial de eventos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            await clearLog();
            load();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerAction}>‹ Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare}>
            <Text style={styles.headerAction}>Compartir</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear}>
            <Text style={[styles.headerAction, { color: Colors.warningLight }]}>
              Borrar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {entries.length === 0 ? (
          <Text style={styles.emptyText}>
            Todavía no hay eventos registrados. Se van a ir agregando a medida
            que uses la app.
          </Text>
        ) : (
          entries.map((e, i) => (
            <View key={i} style={styles.entry}>
              <Text
                style={[
                  styles.entryLevel,
                  e.l === 'ERROR' && styles.levelError,
                  e.l === 'WARN' && styles.levelWarn,
                ]}
              >
                {e.l} · {e.tag}
              </Text>
              <Text style={styles.entryTime}>
                {new Date(e.t).toLocaleString('es-AR')}
              </Text>
              <Text style={styles.entryMsg}>{e.msg}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: Colors.primary,
  },
  headerActions: { flexDirection: 'row', gap: 18 },
  headerAction: { color: Colors.textLight, fontWeight: '600', fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 40 },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 20,
  },
  entry: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.border,
  },
  entryLevel: {
    fontWeight: '700',
    fontSize: 12,
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  levelError: { color: '#C0392B' },
  levelWarn: { color: '#B8860B' },
  entryTime: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  entryMsg: { fontSize: 13, color: Colors.textPrimary, marginTop: 6 },
});
