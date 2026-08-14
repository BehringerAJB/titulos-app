/**
 * Utilidad: Detección modular de Series/Modelos de títulos
 * 
 * Para agregar nuevos formatos de título, solo editar config/series-patterns.json.
 * No requiere modificar este archivo.
 */

import seriesConfig from '../config/series-patterns.json';
import type { SeriesPattern } from '../types';

/**
 * Detecta la serie o modelo del título a partir del texto extraído por OCR.
 * 
 * Los patrones se cargan desde config/series-patterns.json, lo que permite
 * agregar nuevos formatos de forma modular sin tocar el código.
 * 
 * @param ocrText - Texto completo extraído por OCR de la imagen del título
 * @returns Etiqueta de la serie detectada (ej: "MODELO 2020") o "DESCONOCIDO"
 */
export function detectSeries(ocrText: string): string {
  if (!ocrText) return 'DESCONOCIDO';

  const patterns: SeriesPattern[] = seriesConfig.patterns;

  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern.regex, pattern.flags || 'i');
      if (regex.test(ocrText)) {
        return pattern.label;
      }
    } catch (err) {
      // Patrón inválido — se ignora y continúa
      console.warn(`[SeriesDetector] Patrón inválido: ${pattern.regex}`, err);
    }
  }

  return 'DESCONOCIDO';
}

/**
 * Retorna la lista de todas las series/modelos configurados.
 * Útil para mostrar un selector manual en caso de que el OCR falle.
 */
export function getAvailableSeries(): string[] {
  return seriesConfig.patterns.map((p) => p.label);
}

/**
 * Extrae el AÑO de la serie que figura arriba a la izquierda del título
 * (ej. la palabra "Serie" seguida, en la misma línea o en la siguiente,
 * de un año de 4 dígitos como "2014").
 */
function extractSerieYear(text: string): string {
  if (!text) return '';

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Caso 1: "Serie" y el año en la misma línea (ej. "Serie 2014")
  for (const line of lines) {
    const sameLine = line.match(/serie\s*(\d{4})/i);
    if (sameLine) return sameLine[1];
  }

  // Caso 2: "Serie" en una línea y el año en la línea siguiente
  // (el OCR suele partirlos así porque están en renglones distintos)
  for (let i = 0; i < lines.length - 1; i++) {
    if (/^serie$/i.test(lines[i]) && /^\d{4}$/.test(lines[i + 1])) {
      return lines[i + 1];
    }
  }

  return '';
}

/**
 * Extrae el número de folio/control que figura arriba a la derecha del
 * título (un número suelto de 6 a 9 dígitos, normalmente entre las
 * primeras líneas del texto OCR, antes de "REPÚBLICA ARGENTINA").
 *
 * @param text - Texto crudo del OCR
 * @param excludeDni - DNI ya detectado, para no confundirlo con el folio
 */
function extractFolioNumber(text: string, excludeDni?: string): string {
  if (!text) return '';

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const searchLimit = Math.min(lines.length, 6);

  for (let i = 0; i < searchLimit; i++) {
    const match = lines[i].match(/^\d{6,9}$/);
    if (match && match[0] !== excludeDni) {
      return match[0];
    }
  }

  return '';
}

/**
 * Combina el año de Serie (izquierda) con el número de folio (derecha) en
 * un único identificador, ej: "Serie 2014" + "00901206" → "2014-00901206".
 *
 * @param text - Texto crudo del OCR
 * @param excludeDni - DNI ya detectado, para no confundirlo con el folio
 * @returns Cadena "AAAA-NNNNNNNN", solo el año, o cadena vacía si no se detecta nada
 */
export function extractSerieFolio(text: string, excludeDni?: string): string {
  const year = extractSerieYear(text);
  const folio = extractFolioNumber(text, excludeDni);

  if (year && folio) return `${year}-${folio}`;
  if (year) return year;
  return '';
}
