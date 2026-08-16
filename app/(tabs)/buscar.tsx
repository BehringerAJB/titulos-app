/**
 * Pantalla: Buscar y Editar Título
 * 
 * Permite buscar un título por DNI y actualizar sus datos:
 * - Registrar retiro
 * - Registrar devolución de La Plata
 * - Corregir cualquier dato
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useAuth } from '../../context/AuthContext';
import { findByDNI, findByApellido, getAllRows, updateRow } from '../../services/sheets.service';
import { withTokenRefresh, SessionExpiredError } from '../../utils/with-token-refresh';
import { Colors } from '../../constants/Colors';
import { formatDate, parseDate } from '../../utils/date-formatter';
import type { TituloRecord, SheetSearchResult, SheetRowIndex } from '../../types';

type SearchMode = 'dni' | 'apellido';
type FiltroDashboard = 'retirados' | 'remitidos' | 'pendientes' | 'todos';
type ListMatch = { rowIndex: SheetRowIndex; data: TituloRecord };

const FILTRO_TITULOS: Record<FiltroDashboard, string> = {
  retirados: 'Retirados',
  remitidos: 'Remitidos a La Plata',
  pendientes: 'Pendientes de Retiro',
  todos: 'Todos los títulos',
};

export default function BuscarScreen() {
  const { authState, setAuthState } = useAuth();
  const params = useLocalSearchParams<{ dni?: string; filtro?: FiltroDashboard }>();

  // Solapa activa: buscar por DNI o por Apellido
  const [searchMode, setSearchMode] = useState<SearchMode>('dni');

  // Estado de búsqueda
  const [searchDni, setSearchDni] = useState(params.dni || '');
  const [searchApellido, setSearchApellido] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SheetSearchResult | null>(null);

  // Resultados de búsqueda por Apellido, o del listado filtrado desde el Dashboard
  const [listResults, setListResults] = useState<ListMatch[] | null>(null);
  const [listTitle, setListTitle] = useState<string>('');

  // Estado de edición
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Campos editables (se populan desde el registro encontrado)
  const [nombre, setNombre] = useState('');
  const [fechaEmision, setFechaEmision] = useState('');
  const [calificacion, setCalificacion] = useState('');
  const [serie, setSerie] = useState('');
  const [retirado, setRetirado] = useState(false);
  const [fechaRetiro, setFechaRetiro] = useState<Date | null>(null);
  const [quienRetiro, setQuienRetiro] = useState('');
  const [remitido, setRemitido] = useState(false);
  const [fechaEnvio, setFechaEnvio] = useState<Date | null>(null);
  const [fechaDevolucion, setFechaDevolucion] = useState<Date | null>(null);

  // Date pickers
  const [showPicker, setShowPicker] = useState<
    'retiro' | 'envio' | 'devolucion' | null
  >(null);

  // Si viene con DNI precargado (desde la pantalla de nuevo), buscar automáticamente
  useEffect(() => {
    if (params.dni) {
      setSearchMode('dni');
      handleSearchDni();
    }
  }, [params.dni]);

  // Si viene con un filtro precargado (desde los botones del Dashboard),
  // mostrar directamente el listado correspondiente
  useEffect(() => {
    if (params.filtro) {
      handleLoadFiltro(params.filtro);
    }
  }, [params.filtro]);

  // ─── Búsqueda por DNI ─────────────────────────────────────────────────────

  const handleSearchDni = async () => {
    const cleanDni = searchDni.replace(/\D/g, '');
    if (!cleanDni || cleanDni.length < 7) {
      Alert.alert('DNI inválido', 'Ingresá un DNI de 7 u 8 dígitos.');
      return;
    }

    if (!authState.accessToken || !authState.spreadsheetId) {
      Alert.alert('Error', 'Sesión expirada. Por favor reiniciá la app.');
      return;
    }

    setSearching(true);
    setSearchResult(null);
    setListResults(null);
    setEditMode(false);

    try {
      const result = await withTokenRefresh(authState, setAuthState, (token) =>
        findByDNI(token, authState.spreadsheetId as string, cleanDni)
      );

      setSearchResult(result);

      if (result.found && result.data) {
        populateFields(result.data);
      }
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        Alert.alert('Sesión vencida', 'Tu sesión de Google venció. Cerrá sesión y volvé a entrar.');
      } else {
        Alert.alert(
          'Error de búsqueda',
          'No se pudo conectar con Google Sheets. Verificá tu conexión.'
        );
      }
    } finally {
      setSearching(false);
    }
  };

  // ─── Búsqueda por Apellido ────────────────────────────────────────────────

  const handleSearchApellido = async () => {
    const query = searchApellido.trim();
    if (query.length < 2) {
      Alert.alert('Búsqueda muy corta', 'Ingresá al menos 2 letras del apellido.');
      return;
    }

    if (!authState.accessToken || !authState.spreadsheetId) {
      Alert.alert('Error', 'Sesión expirada. Por favor reiniciá la app.');
      return;
    }

    setSearching(true);
    setSearchResult(null);
    setListResults(null);
    setEditMode(false);

    try {
      const results = await withTokenRefresh(authState, setAuthState, (token) =>
        findByApellido(token, authState.spreadsheetId as string, query)
      );

      if (results.length === 1) {
        // Un solo resultado: lo mostramos directo, como si hubiera sido por DNI
        setSearchResult({ found: true, rowIndex: results[0].rowIndex, data: results[0].data });
        populateFields(results[0].data);
      } else {
        setListTitle(`Resultados para "${query}"`);
        setListResults(results);
        if (results.length === 0) {
          setSearchResult({ found: false, rowIndex: null, data: null });
        }
      }
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        Alert.alert('Sesión vencida', 'Tu sesión de Google venció. Cerrá sesión y volvé a entrar.');
      } else {
        Alert.alert(
          'Error de búsqueda',
          'No se pudo conectar con Google Sheets. Verificá tu conexión.'
        );
      }
    } finally {
      setSearching(false);
    }
  };

  // ─── Listado filtrado (desde los botones del Dashboard) ──────────────────

  const handleLoadFiltro = async (filtro: FiltroDashboard) => {
    if (!authState.accessToken || !authState.spreadsheetId) {
      Alert.alert('Error', 'Sesión expirada. Por favor reiniciá la app.');
      return;
    }

    setSearching(true);
    setSearchResult(null);
    setListResults(null);
    setEditMode(false);

    try {
      const rows = await withTokenRefresh(authState, setAuthState, (token) =>
        getAllRows(token, authState.spreadsheetId as string)
      );
      const withIndex: ListMatch[] = rows.map((data, i) => ({ rowIndex: i + 2, data }));

      const filtered = withIndex.filter(({ data }) => {
        if (filtro === 'retirados') return data.retirado;
        if (filtro === 'remitidos') return data.remitidoLaPlata;
        if (filtro === 'pendientes') return !data.retirado;
        return true; // 'todos'
      });

      setListTitle(FILTRO_TITULOS[filtro]);
      setListResults(filtered);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        Alert.alert('Sesión vencida', 'Tu sesión de Google venció. Cerrá sesión y volvé a entrar.');
      } else {
        Alert.alert(
          'Error al cargar',
          'No se pudo obtener el listado desde Google Sheets.'
        );
      }
    } finally {
      setSearching(false);
    }
  };

  /** Selecciona un registro de un listado (apellido o filtro) y lo abre en detalle */
  const selectMatch = (match: ListMatch) => {
    setSearchResult({ found: true, rowIndex: match.rowIndex, data: match.data });
    populateFields(match.data);
    setListResults(null);
  };

  /** Popula todos los campos de edición con los datos del registro */
  const populateFields = (record: TituloRecord) => {
    setNombre(record.apellidoNombre);
    setFechaEmision(record.fechaEmision);
    setCalificacion(record.calificacionFinal);
    setSerie(record.serieModelo);
    setRetirado(record.retirado);
    setFechaRetiro(record.fechaRetiro ? parseDate(record.fechaRetiro) : null);
    setQuienRetiro(record.quienRetiro);
    setRemitido(record.remitidoLaPlata);
    setFechaEnvio(record.fechaEnvioLaPlata ? parseDate(record.fechaEnvioLaPlata) : null);
    setFechaDevolucion(
      record.fechaDevolucionLaPlata ? parseDate(record.fechaDevolucionLaPlata) : null
    );
  };

  // ─── Guardado de cambios ──────────────────────────────────────────────────

  const handleUpdate = async () => {
    if (!searchResult?.found || !searchResult.rowIndex || !searchResult.data) return;

    if (!authState.accessToken || !authState.spreadsheetId) {
      Alert.alert('Error', 'Sesión expirada.');
      return;
    }

    // Validaciones condicionales
    if (retirado && !fechaRetiro) {
      Alert.alert('Datos incompletos', 'Completá la Fecha de Retiro.');
      return;
    }
    if (retirado && !quienRetiro.trim()) {
      Alert.alert('Datos incompletos', 'Completá quién retiró el título.');
      return;
    }
    if (remitido && !fechaEnvio) {
      Alert.alert('Datos incompletos', 'Completá la Fecha de Envío a La Plata.');
      return;
    }

    setSaving(true);

    try {
      const updatedRecord: TituloRecord = {
        ...searchResult.data,
        apellidoNombre: nombre,
        fechaEmision,
        calificacionFinal: calificacion,
        serieModelo: serie,
        retirado,
        fechaRetiro: fechaRetiro ? formatDate(fechaRetiro) : '',
        quienRetiro,
        remitidoLaPlata: remitido,
        fechaEnvioLaPlata: fechaEnvio ? formatDate(fechaEnvio) : '',
        fechaDevolucionLaPlata: fechaDevolucion ? formatDate(fechaDevolucion) : '',
      };

      await withTokenRefresh(authState, setAuthState, (token) =>
        updateRow(token, authState.spreadsheetId as string, searchResult.rowIndex as number, updatedRecord)
      );

      // Actualizar el resultado local
      setSearchResult({
        ...searchResult,
        data: updatedRecord,
      });
      setEditMode(false);

      Alert.alert(
        '✅ Registro actualizado',
        'Los datos fueron guardados exitosamente en Google Sheets.'
      );
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        Alert.alert('Sesión vencida', 'Tu sesión de Google venció. Cerrá sesión y volvé a entrar, y volvé a guardar los cambios.');
      } else {
        Alert.alert(
          'Error al actualizar',
          'No se pudieron guardar los cambios. Intentá nuevamente.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Buscador con solapas DNI / Apellido */}
        <View style={styles.searchCard}>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabButton, searchMode === 'dni' && styles.tabButtonActive]}
              onPress={() => {
                setSearchMode('dni');
                setSearchResult(null);
                setListResults(null);
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabButtonText, searchMode === 'dni' && styles.tabButtonTextActive]}>
                DNI
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, searchMode === 'apellido' && styles.tabButtonActive]}
              onPress={() => {
                setSearchMode('apellido');
                setSearchResult(null);
                setListResults(null);
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.tabButtonText, searchMode === 'apellido' && styles.tabButtonTextActive]}
              >
                Apellido
              </Text>
            </TouchableOpacity>
          </View>

          {searchMode === 'dni' ? (
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                value={searchDni}
                onChangeText={(t) => setSearchDni(t.replace(/\D/g, ''))}
                placeholder="Número de documento..."
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                maxLength={8}
                returnKeyType="search"
                onSubmitEditing={handleSearchDni}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearchDni}
                disabled={searching}
                activeOpacity={0.85}
              >
                {searching ? (
                  <ActivityIndicator size="small" color={Colors.textLight} />
                ) : (
                  <Text style={styles.searchButtonText}>Buscar</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                value={searchApellido}
                onChangeText={setSearchApellido}
                placeholder="Apellido y/o nombre..."
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                returnKeyType="search"
                onSubmitEditing={handleSearchApellido}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearchApellido}
                disabled={searching}
                activeOpacity={0.85}
              >
                {searching ? (
                  <ActivityIndicator size="small" color={Colors.textLight} />
                ) : (
                  <Text style={styles.searchButtonText}>Buscar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Listado (búsqueda por apellido con varias coincidencias, o filtro del Dashboard) */}
        {listResults !== null && (
          <View style={styles.listCard}>
            <Text style={styles.listTitle}>
              {listTitle} ({listResults.length})
            </Text>
            {listResults.length === 0 ? (
              <Text style={styles.notFoundText}>No hay títulos que coincidan.</Text>
            ) : (
              listResults.map((match) => (
                <TouchableOpacity
                  key={match.data.dni}
                  style={styles.listItem}
                  onPress={() => selectMatch(match)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listItemNombre}>{match.data.apellidoNombre}</Text>
                    <Text style={styles.listItemDni}>DNI {match.data.dni}</Text>
                  </View>
                  <StatusBadge record={match.data} compact />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Resultado: no encontrado */}
        {listResults === null && searchResult !== null && !searchResult.found && (
          <View style={styles.notFoundCard}>
            <Text style={styles.notFoundIcon}>🔎</Text>
            <Text style={styles.notFoundTitle}>No encontrado</Text>
            <Text style={styles.notFoundText}>
              {searchMode === 'dni'
                ? `No existe un título registrado para el DNI ${searchDni}.`
                : `No se encontraron títulos para "${searchApellido}".`}
            </Text>
          </View>
        )}

        {/* Resultado: encontrado */}
        {searchResult?.found && searchResult.data && (
          <>
            {/* Datos del título */}
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View>
                  <Text style={styles.resultDni}>DNI: {searchResult.data.dni}</Text>
                  <Text style={styles.resultNombre}>{searchResult.data.apellidoNombre}</Text>
                </View>
                <StatusBadge record={searchResult.data} />
              </View>

              <View style={styles.resultDetails}>
                <DetailItem label="Emisión" value={searchResult.data.fechaEmision} />
                <DetailItem label="Calificación" value={searchResult.data.calificacionFinal} />
                <DetailItem label="Serie/Modelo" value={searchResult.data.serieModelo} />
                <DetailItem
                  label="Retirado"
                  value={searchResult.data.retirado ? `Sí — ${searchResult.data.fechaRetiro}` : 'No'}
                />
                {searchResult.data.retirado && (
                  <DetailItem label="Retirado por" value={searchResult.data.quienRetiro} />
                )}
                <DetailItem
                  label="Remitido LP"
                  value={searchResult.data.remitidoLaPlata ? `Sí — ${searchResult.data.fechaEnvioLaPlata}` : 'No'}
                />
                {searchResult.data.fechaDevolucionLaPlata && (
                  <DetailItem label="Devuelto de LP" value={searchResult.data.fechaDevolucionLaPlata} />
                )}
                <DetailItem label="Captura" value={searchResult.data.fechaCaptura} />
                {searchResult.data.ultimaModificacion && (
                  <DetailItem label="Última modif." value={searchResult.data.ultimaModificacion} />
                )}
              </View>

              {!editMode && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditMode(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.editButtonText}>✏️ Editar este registro</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Formulario de edición */}
            {editMode && (
              <View style={styles.editForm}>
                <Text style={styles.editFormTitle}>Editar Registro</Text>

                <EditField label="Apellido y Nombre" value={nombre} onChangeText={setNombre} />
                <EditField label="Fecha de Emisión" value={fechaEmision} onChangeText={setFechaEmision} />
                <EditField label="Calificación Final" value={calificacion} onChangeText={setCalificacion} />
                <EditField label="Serie / Modelo" value={serie} onChangeText={setSerie} />

                {/* Switch Retirado */}
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>¿Retirado?</Text>
                  </View>
                  <Switch
                    value={retirado}
                    onValueChange={setRetirado}
                    trackColor={{ false: Colors.switchInactive, true: Colors.switchActive }}
                    thumbColor={Colors.textLight}
                  />
                </View>

                {retirado && (
                  <>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowPicker('retiro')}
                    >
                      <Text style={styles.datePickerLabel}>Fecha de Retiro</Text>
                      <Text style={styles.datePickerValue}>
                        {fechaRetiro ? formatDate(fechaRetiro) : 'Seleccionar...'}
                      </Text>
                    </TouchableOpacity>
                    <EditField label="Quién Retiró" value={quienRetiro} onChangeText={setQuienRetiro} />
                  </>
                )}

                {/* Switch Remitido */}
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>¿Remitido a La Plata?</Text>
                  </View>
                  <Switch
                    value={remitido}
                    onValueChange={setRemitido}
                    trackColor={{ false: Colors.switchInactive, true: Colors.switchActive }}
                    thumbColor={Colors.textLight}
                  />
                </View>

                {remitido && (
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowPicker('envio')}
                  >
                    <Text style={styles.datePickerLabel}>Fecha de Envío a La Plata</Text>
                    <Text style={styles.datePickerValue}>
                      {fechaEnvio ? formatDate(fechaEnvio) : 'Seleccionar...'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Fecha devolución */}
                <TouchableOpacity
                  style={[styles.datePickerButton, { borderStyle: 'dashed' }]}
                  onPress={() => setShowPicker('devolucion')}
                >
                  <Text style={styles.datePickerLabel}>Fecha de Devolución de La Plata (opcional)</Text>
                  <Text style={styles.datePickerValue}>
                    {fechaDevolucion ? formatDate(fechaDevolucion) : 'Sin fecha'}
                  </Text>
                </TouchableOpacity>
                {fechaDevolucion && (
                  <TouchableOpacity onPress={() => setFechaDevolucion(null)}>
                    <Text style={styles.clearDate}>✕ Borrar fecha de devolución</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.editActions}>
                  {saving ? (
                    <ActivityIndicator size="large" color={Colors.accent} />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleUpdate}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.saveButtonText}>💾 Guardar cambios</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setEditMode(false);
                          if (searchResult.data) populateFields(searchResult.data);
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <DateTimePickerModal
        isVisible={showPicker !== null}
        mode="date"
        locale="es_AR"
        confirmTextIOS="Confirmar"
        cancelTextIOS="Cancelar"
        onConfirm={(date) => {
          if (showPicker === 'retiro') setFechaRetiro(date);
          if (showPicker === 'envio') setFechaEnvio(date);
          if (showPicker === 'devolucion') setFechaDevolucion(date);
          setShowPicker(null);
        }}
        onCancel={() => setShowPicker(null)}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function StatusBadge({ record, compact }: { record: TituloRecord; compact?: boolean }) {
  let label = 'Pendiente';
  let bg = Colors.warningLight;
  let color = Colors.warning;
  let icon = '⏳';

  if (record.retirado) {
    label = 'Retirado';
    bg = Colors.successLight;
    color = Colors.success;
    icon = '✅';
  } else if (record.remitidoLaPlata) {
    label = 'En La Plata';
    bg = Colors.infoLight;
    color = Colors.info;
    icon = '📨';
  }

  return (
    <View style={[styles.badge, compact && styles.badgeCompact, { backgroundColor: bg }]}>
      <Text style={styles.badgeIcon}>{icon}</Text>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function EditField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.editField}>
      <Text style={styles.editFieldLabel}>{label}</Text>
      <TextInput
        style={styles.editInput}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="characters"
      />
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 50, gap: 16 },

  searchCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  tabButtonTextActive: {
    color: Colors.textLight,
  },

  searchRow: { flexDirection: 'row', gap: 10 },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: { color: Colors.textLight, fontWeight: '700', fontSize: 14 },

  notFoundCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  notFoundIcon: { fontSize: 40 },
  notFoundTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  notFoundText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },

  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  resultHeader: {
    backgroundColor: Colors.primary,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resultDni: { color: Colors.accentLight, fontSize: 13, fontWeight: '600' },
  resultNombre: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    maxWidth: 220,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  badgeIcon: { fontSize: 13 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeCompact: { paddingHorizontal: 8, paddingVertical: 4 },

  listCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  listTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  listItemNombre: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  listItemDni: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },

  resultDetails: { padding: 16, gap: 8 },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  detailValue: { color: Colors.textPrimary, fontSize: 13, flex: 1, textAlign: 'right' },

  editButton: {
    margin: 16,
    marginTop: 8,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editButtonText: { color: Colors.primary, fontWeight: '800', fontSize: 15 },

  editForm: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  editFormTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },

  editField: { gap: 4 },
  editFieldLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editInput: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.textPrimary,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  switchLabel: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },

  datePickerButton: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  datePickerLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  datePickerValue: { color: Colors.textPrimary, fontSize: 14 },
  clearDate: { color: Colors.error, fontSize: 12, textAlign: 'right' },

  editActions: { gap: 10, marginTop: 8 },

  saveButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: { color: Colors.primary, fontWeight: '800', fontSize: 16 },

  cancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelButtonText: { color: Colors.textSecondary, fontSize: 14 },
});
