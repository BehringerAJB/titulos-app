/**
 * Tipos de datos del dominio
 * App de Gestión de Títulos — Secundario de Adultos
 */

/** Registro completo de un título en el sistema */
export interface TituloRecord {
  /** DNI sin puntos ni espacios. Es la CLAVE PRIMARIA. Ej: "30123456" */
  dni: string;

  /** Apellido y nombre completo del titular */
  apellidoNombre: string;

  /** Fecha de emisión del título. Formato: dd/mm/aaaa */
  fechaEmision: string;

  /** Calificación final. Puede ser numérica ("8.50") o textual ("Sobresaliente") */
  calificacionFinal: string;

  /** Serie o modelo del título detectado por OCR. Ej: "MODELO 2020", "SERIE 2014" */
  serieModelo: string;

  /** Si el título fue retirado por el alumno */
  retirado: boolean;

  /** Fecha de retiro. Formato: dd/mm/aaaa. Vacío si no fue retirado. */
  fechaRetiro: string;

  /** Nombre de la persona que retiró el título */
  quienRetiro: string;

  /** Si el título fue remitido a la sede central (La Plata) */
  remitidoLaPlata: boolean;

  /** Fecha de envío a La Plata. Formato: dd/mm/aaaa. Vacío si no fue remitido. */
  fechaEnvioLaPlata: string;

  /** Fecha de devolución de La Plata. Formato: dd/mm/aaaa. Opcional. */
  fechaDevolucionLaPlata: string;

  /** Fecha y hora de la primera captura. Formato: dd/mm/aaaa HH:MM */
  fechaCaptura: string;

  /** Fecha y hora de la última modificación. Formato: dd/mm/aaaa HH:MM */
  ultimaModificacion: string;
}

/** Datos extraídos por OCR de la foto del título */
export interface OCRData {
  dni: string;
  apellidoNombre: string;
  fechaEmision: string;
  calificacionFinal: string;
  serieModelo: string;
  /** Texto completo crudo extraído por OCR */
  rawText: string;
}

/** Patrón de detección de series de títulos */
export interface SeriesPattern {
  label: string;
  regex: string;
  flags: string;
}

/** Configuración de patrones de series */
export interface SeriesConfig {
  patterns: SeriesPattern[];
}

/** Estadísticas para el Dashboard */
export interface DashboardStats {
  total: number;
  retirados: number;
  remitidos: number;
  pendientes: number;
}

/** Índice de fila en Google Sheets (1-based, incluyendo encabezado) */
export type SheetRowIndex = number;

/** Resultado de búsqueda en Sheets */
export interface SheetSearchResult {
  found: boolean;
  rowIndex: SheetRowIndex | null;
  data: TituloRecord | null;
}

/** Estado de autenticación */
export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  userEmail: string | null;
  spreadsheetId: string | null;
  isDemoMode?: boolean;
}
