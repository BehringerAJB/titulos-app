/**
 * Pantalla: Alta de Título
 * 
 * Flujo completo:
 * 1. Captura de foto con cámara
 * 2. Procesamiento OCR → confirmación y corrección de datos
 * 3. Formulario administrativo
 * 4. Guardado en Google Sheets
 */

import React, { useState, useRef } from 'react';
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
import { CameraView, useCameraPermissions } from 'expo-camera';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useAuth } from '../../context/AuthContext';
import { processImage, isOCRDataSufficient } from '../../services/ocr.service';
import { findByDNI, addRow } from '../../services/sheets.service';
import { withTokenRefresh, SessionExpiredError } from '../../utils/with-token-refresh';
import { Colors } from '../../constants/Colors';
import { formatDate } from '../../utils/date-formatter';
import { isValidDNI } from '../../utils/dni-cleaner';
import { getAvailableSeries } from '../../utils/series-detector';
import type { TituloRecord, OCRData } from '../../types';
import { router } from 'expo-router';

// Pasos del flujo
type Step = 'camera' | 'ocr-confirm' | 'admin-form' | 'saving';

const emptyRecord = (): Partial<TituloRecord> => ({
  retirado: false,
  fechaRetiro: '',
  quienRetiro: '',
  remitidoLaPlata: false,
  fechaEnvioLaPlata: '',
  fechaDevolucionLaPlata: '',
});

export default function NuevoTituloScreen() {
  const { authState, setAuthState } = useAuth();
  const cameraRef = useRef<any>(null);

  // Permisos de cámara
  const [permission, requestPermission] = useCameraPermissions();

  // Estado del flujo
  const [step, setStep] = useState<Step>('camera');
  const [ocrData, setOcrData] = useState<OCRData | null>(null);

  // Campos OCR editables
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [fechaEmision, setFechaEmision] = useState('');
  const [calificacion, setCalificacion] = useState('');
  const [serie, setSerie] = useState('');

  // Campos administrativos
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

  // Estado de carga
  const [processing, setProcessing] = useState(false);

  // ─── PASO 1: Captura de foto ──────────────────────────────────────────────

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    setProcessing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      const result = await processImage(photo.uri);
      setOcrData(result);

      // Poblar campos con datos OCR
      setDni(result.dni);
      setNombre(result.apellidoNombre);
      setFechaEmision(result.fechaEmision);
      setCalificacion(result.calificacionFinal);
      setSerie(result.serieModelo);

      setStep('ocr-confirm');
    } catch (err) {
      Alert.alert(
        'Error al procesar la imagen',
        'Intentá tomar la foto con mejor iluminación o ingresá los datos manualmente.'
      );
    } finally {
      setProcessing(false);
    }
  };

  // Simulación de OCR para Modo Demo
  const handleSimulateOCR = () => {
    const randomDni = Math.floor(25000000 + Math.random() * 20000000).toString();
    const names = [
      "ALVAREZ, DANIEL HORACIO",
      "SÁNCHEZ, PATRICIA EDITH",
      "DÍAZ, GABRIELA INÉS",
      "MARTÍNEZ, JORGE OMAR",
      "GIMÉNEZ, CLAUDIO AGUSTÍN",
      "SOSA, MARÍA DE LOS ÁNGELES"
    ];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const seriesOptions = ["MODELO 2020", "SERIE 2014", "MODELO 2019", "MODELO 2018"];
    const randomSerie = seriesOptions[Math.floor(Math.random() * seriesOptions.length)];
    
    setDni(randomDni);
    setNombre(randomName);
    setFechaEmision("15/05/2021");
    setCalificacion("8.50");
    setSerie(randomSerie);
    setOcrData({
      dni: randomDni,
      apellidoNombre: randomName,
      fechaEmision: "15/05/2021",
      calificacionFinal: "8.50",
      serieModelo: randomSerie,
      rawText: `PROVINCIA DE BUENOS AIRES\nDIRECCION GENERAL DE CULTURA Y EDUCACIÓN\nTITULO BACHILLER\n${randomName}\nDNI ${randomDni}\nCALIFICACION FINAL 8.50\nSERIE Y ${randomSerie}`
    });
    setStep('ocr-confirm');
  };

  // ─── PASO 2: Confirmación OCR ─────────────────────────────────────────────

  const handleConfirmOCR = () => {
    const cleanedDni = dni.replace(/\D/g, '');
    if (!cleanedDni || !isValidDNI(cleanedDni)) {
      Alert.alert(
        'DNI inválido',
        'El DNI es obligatorio y debe tener 7 u 8 dígitos. Corregilo antes de continuar.'
      );
      return;
    }
    setDni(cleanedDni);
    setStep('admin-form');
  };

  // ─── PASO 3: Guardado ─────────────────────────────────────────────────────

  const handleSave = async () => {
    const cleanDni = dni.replace(/\D/g, '');

    if (!authState.accessToken || !authState.spreadsheetId) {
      Alert.alert('Error', 'Sesión expirada. Por favor reiniciá la app.');
      return;
    }

    // Validar campos obligatorios del formulario admin
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

    setStep('saving');

    try {
      // Verificar DNI único
      const searchResult = await withTokenRefresh(authState, setAuthState, (token) =>
        findByDNI(token, authState.spreadsheetId as string, cleanDni)
      );

      if (searchResult.found) {
        Alert.alert(
          'DNI ya registrado',
          `Este DNI (${cleanDni}) ya posee un título registrado.\n¿Deseás editarlo?`,
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => setStep('admin-form') },
            {
              text: 'Ir a Editar',
              onPress: () => {
                router.push({ pathname: '/(tabs)/buscar', params: { dni: cleanDni } });
              },
            },
          ]
        );
        return;
      }

      // Construir registro completo
      const record: TituloRecord = {
        dni: cleanDni,
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
        fechaCaptura: '',        // lo agrega el servicio
        ultimaModificacion: '', // lo agrega el servicio
      };

      await withTokenRefresh(authState, setAuthState, (token) =>
        addRow(token, authState.spreadsheetId as string, record)
      );

      Alert.alert(
        '✅ Título registrado',
        `El título de ${nombre || cleanDni} fue guardado exitosamente en Google Sheets.`,
        [{ text: 'OK', onPress: resetForm }]
      );
    } catch (err: any) {
      console.error('[Nuevo] Error al guardar:', err);
      if (err instanceof SessionExpiredError) {
        Alert.alert(
          'Sesión vencida',
          'Tu sesión de Google venció. Cerrá sesión, volvé a entrar, y guardá el título de nuevo (revisá los datos, no se perdieron).'
        );
      } else {
        Alert.alert(
          'Error al guardar',
          'No se pudo guardar el título. Verificá tu conexión a internet e intentá nuevamente.'
        );
      }
      setStep('admin-form');
    }
  };

  const resetForm = () => {
    setStep('camera');
    setOcrData(null);
    setDni('');
    setNombre('');
    setFechaEmision('');
    setCalificacion('');
    setSerie('');
    setRetirado(false);
    setFechaRetiro(null);
    setQuienRetiro('');
    setRemitido(false);
    setFechaEnvio(null);
    setFechaDevolucion(null);
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  // Paso de guardado (spinner)
  if (step === 'saving') {
    return (
      <View style={styles.savingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.savingText}>Guardando en Google Sheets...</Text>
      </View>
    );
  }

  // Paso de cámara
  if (step === 'camera') {
    const isEmulatorOrWeb = !permission || !permission.granted;

    if (isEmulatorOrWeb && !authState.isDemoMode) {
      return (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            La app necesita acceso a la cámara para fotografiar los títulos.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Conceder permiso</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isEmulatorOrWeb && authState.isDemoMode) {
      return (
        <View style={[styles.cameraContainer, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <Text style={{ fontSize: 50, marginBottom: 20 }}>📷</Text>
          <Text style={[styles.sectionHeaderTitle, { color: Colors.textLight, fontSize: 20, fontWeight: '700' }]}>
            Cámara Simulada (Modo Demo)
          </Text>
          <Text style={[styles.permissionText, { color: 'rgba(255,255,255,0.7)', marginTop: 10, marginBottom: 30 }]}>
            Estás corriendo la app en un entorno sin cámara (emulador/web) pero con el Modo Demo activado. Podés simular la captura de un título para ver el flujo.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { width: '80%' }]}
            onPress={handleSimulateOCR}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>🧪 Simular Captura y OCR</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          {/* Marco de encuadre */}
          <View style={styles.frameOverlay}>
            <View style={styles.frameTop} />
            <View style={styles.frameMiddle}>
              <View style={styles.frameSide} />
              <View style={styles.frameWindow}>
                <View style={[styles.frameCorner, styles.cornerTL]} />
                <View style={[styles.frameCorner, styles.cornerTR]} />
                <View style={[styles.frameCorner, styles.cornerBL]} />
                <View style={[styles.frameCorner, styles.cornerBR]} />
              </View>
              <View style={styles.frameSide} />
            </View>
            <View style={styles.frameBottom}>
              <Text style={styles.cameraHint}>
                Encuadrá el título dentro del recuadro
              </Text>
              {processing ? (
                <ActivityIndicator size="large" color={Colors.accent} />
              ) : (
                <View style={{ gap: 14, alignItems: 'center', width: '100%' }}>
                  <TouchableOpacity
                    style={styles.captureButton}
                    onPress={handleTakePhoto}
                    activeOpacity={0.8}
                  >
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>

                  {authState.isDemoMode && (
                    <TouchableOpacity
                      style={[styles.primaryButton, { width: '80%', paddingVertical: 10 }]}
                      onPress={handleSimulateOCR}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.primaryButtonText, { fontSize: 14 }]}>🧪 Simular Captura (Modo Demo)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  // Paso de confirmación OCR y formulario admin
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─ Confirmación OCR ─ */}
        {step === 'ocr-confirm' && (
          <>
            <SectionHeader
              icon="🤖"
              title="Datos extraídos por OCR"
              subtitle="Revisá y corregí si es necesario"
            />

            {!isOCRDataSufficient(ocrData!) && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  ⚠️ No se detectó el DNI automáticamente. Ingresalo manualmente.
                </Text>
              </View>
            )}

            <FormField
              label="Número de Documento (DNI) *"
              value={dni}
              onChangeText={(t) => setDni(t.replace(/\D/g, ''))}
              keyboardType="numeric"
              placeholder="Ej: 30123456"
              required
            />
            <FormField
              label="Apellido y Nombre"
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej: GARCÍA, Juan Carlos"
            />
            <FormField
              label="Fecha de Emisión"
              value={fechaEmision}
              onChangeText={setFechaEmision}
              placeholder="dd/mm/aaaa"
              keyboardType="numbers-and-punctuation"
            />
            <FormField
              label="Calificación Final"
              value={calificacion}
              onChangeText={setCalificacion}
              placeholder="Ej: 8.50 o Sobresaliente"
            />
            <FormField
              label="Serie / Modelo (detectado)"
              value={serie}
              onChangeText={setSerie}
              placeholder="Ej: MODELO 2020"
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleConfirmOCR}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Continuar →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostButton}
              onPress={() => setStep('camera')}
            >
              <Text style={styles.ghostButtonText}>📷 Tomar otra foto</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ─ Formulario administrativo ─ */}
        {step === 'admin-form' && (
          <>
            <SectionHeader
              icon="📝"
              title="Datos administrativos"
              subtitle={`DNI: ${dni} — ${nombre}`}
            />

            {/* Switch Retirado */}
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchLabel}>¿Retirado por el alumno?</Text>
                <Text style={styles.switchSub}>
                  {retirado ? 'Sí — completá los datos de retiro' : 'No — título pendiente de retiro'}
                </Text>
              </View>
              <Switch
                value={retirado}
                onValueChange={setRetirado}
                trackColor={{ false: Colors.switchInactive, true: Colors.switchActive }}
                thumbColor={Colors.textLight}
              />
            </View>

            {retirado && (
              <View style={styles.conditionalFields}>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowPicker('retiro')}
                >
                  <Text style={styles.datePickerLabel}>Fecha de Retiro *</Text>
                  <Text style={styles.datePickerValue}>
                    {fechaRetiro ? formatDate(fechaRetiro) : 'Seleccionar fecha...'}
                  </Text>
                </TouchableOpacity>

                <FormField
                  label="Quién Retiró *"
                  value={quienRetiro}
                  onChangeText={setQuienRetiro}
                  placeholder="Nombre de quien retiró el título"
                />
              </View>
            )}

            {/* Switch Remitido */}
            <View style={[styles.switchRow, { marginTop: 8 }]}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchLabel}>¿Remitido a La Plata?</Text>
                <Text style={styles.switchSub}>
                  {remitido ? 'Sí — completá la fecha de envío' : 'No — título en la sede'}
                </Text>
              </View>
              <Switch
                value={remitido}
                onValueChange={setRemitido}
                trackColor={{ false: Colors.switchInactive, true: Colors.switchActive }}
                thumbColor={Colors.textLight}
              />
            </View>

            {remitido && (
              <View style={styles.conditionalFields}>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowPicker('envio')}
                >
                  <Text style={styles.datePickerLabel}>Fecha de Envío a La Plata *</Text>
                  <Text style={styles.datePickerValue}>
                    {fechaEnvio ? formatDate(fechaEnvio) : 'Seleccionar fecha...'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Fecha de devolución (siempre visible, opcional) */}
            <View style={styles.optionalSection}>
              <Text style={styles.optionalLabel}>Fecha de Devolución de La Plata</Text>
              <Text style={styles.optionalSub}>Opcional — completar cuando el título regrese</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowPicker('devolucion')}
              >
                <Text style={styles.datePickerValue}>
                  {fechaDevolucion ? formatDate(fechaDevolucion) : 'Sin fecha (pendiente)'}
                </Text>
              </TouchableOpacity>
              {fechaDevolucion && (
                <TouchableOpacity onPress={() => setFechaDevolucion(null)}>
                  <Text style={styles.clearDate}>✕ Borrar fecha</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={styles.saveButtonText}>💾 Guardar en Drive</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostButton}
              onPress={() => setStep('ocr-confirm')}
            >
              <Text style={styles.ghostButtonText}>← Volver a revisar datos</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Date Pickers */}
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

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderIcon}>{icon}</Text>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
      <Text style={styles.sectionHeaderSubtitle}>{subtitle}</Text>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  required = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  required?: boolean;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={{ color: Colors.error }}> *</Text>}
      </Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize="characters"
      />
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Cámara
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  frameOverlay: { flex: 1 },
  frameTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  frameMiddle: { flexDirection: 'row', height: 220 },
  frameSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  frameWindow: {
    width: 300,
    borderWidth: 0,
    position: 'relative',
  },
  frameBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  frameCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.accent,
    borderWidth: 4,
  },
  cornerTL: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  cornerTR: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
  cameraHint: {
    color: Colors.textLight,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.textLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  captureButtonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
  },

  // Permisos
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.background,
  },
  permissionText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  permissionButtonText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: 15,
  },

  // Guardando
  savingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 20,
  },
  savingText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },

  // Formulario
  formContainer: { flex: 1, backgroundColor: Colors.background },
  formContent: { padding: 20, paddingBottom: 50, gap: 16 },

  sectionHeader: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  sectionHeaderIcon: { fontSize: 36 },
  sectionHeaderTitle: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHeaderSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    textAlign: 'center',
  },

  warningBanner: {
    backgroundColor: Colors.warningLight,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  warningText: { color: '#7D5A00', fontSize: 13, lineHeight: 18 },

  formField: { gap: 6 },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.textPrimary,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 12,
  },
  switchLabelContainer: { flex: 1 },
  switchLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  switchSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },

  conditionalFields: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  optionalSection: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  optionalLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  optionalSub: { color: Colors.textMuted, fontSize: 12 },

  datePickerButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  datePickerLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  datePickerValue: { color: Colors.textPrimary, fontSize: 15 },
  clearDate: { color: Colors.error, fontSize: 12, textAlign: 'right', marginTop: 4 },

  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: { color: Colors.textLight, fontSize: 17, fontWeight: '700' },

  saveButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButtonText: { color: Colors.primary, fontSize: 17, fontWeight: '800' },

  ghostButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  ghostButtonText: { color: Colors.textSecondary, fontSize: 14 },
});
