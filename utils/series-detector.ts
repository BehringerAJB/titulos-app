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
