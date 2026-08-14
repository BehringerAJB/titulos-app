/**
 * Servicio OCR
 * 
 * Procesa imágenes de títulos académicos y extrae los campos clave.
 * Motor: Google ML Kit Text Recognition (offline, sin costo).
 * 
 * NOTA PARA CONFIGURACIÓN:
 * Instalar: expo install @react-native-ml-kit/text-recognition
 * Solo funciona en dispositivos físicos (no en emulador sin cámara).
 */

import { extractDNIFromText, cleanDNI } from '../utils/dni-cleaner';
import { extractDateFromText } from '../utils/date-formatter';
import { detectSeries, extractSerieFolio } from '../utils/series-detector';
import type { OCRData } from '../types';

/**
 * Extrae el nombre/apellido del texto OCR.
 *
 * Estrategia principal (títulos de secundario de adultos): el apellido y
 * nombre aparece justo después de la frase "certifica que" y antes de
 * "nacido/a en" — ej: "...certifica que VARGAS BRAIAN nacido/a en AVELLANEDA...".
 * Si no se encuentra ese patrón, se usan las estrategias anteriores como
 * respaldo.
 */
export function extractNombreFromText(text: string): string {
  // Texto "aplanado" para poder matchear la frase aunque el OCR la haya
  // partido en varias líneas.
  const flat = text.replace(/\s+/g, ' ');

  // Estrategia 1 (más confiable): entre "certifica que" y "nacido/a"
  const certificaMatch = flat.match(
    /certifica\s+que\s+([A-ZÁÉÍÓÚÑa-záéíóúñ][A-ZÁÉÍÓÚÑa-záéíóúñ\s,.]{2,60}?)\s+naci(?:d[oa]|[oó])/i
  );
  if (certificaMatch) {
    return certificaMatch[1].trim().toUpperCase();
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Estrategia 2: buscar línea siguiente a "APELLIDO Y NOMBRE" o "APELLIDO/NOMBRE"
  for (let i = 0; i < lines.length - 1; i++) {
    if (/apellido\s*(y\s*)?nombre/i.test(lines[i])) {
      return lines[i + 1];
    }
  }

  // Estrategia 3: buscar líneas en MAYÚSCULAS de más de 5 chars (nombres suelen estar en mayúscula)
  const upperLines = lines.filter(
    (l) => l === l.toUpperCase() && l.length > 5 && /^[A-ZÁÉÍÓÚÑ\s,]+$/.test(l)
  );
  if (upperLines.length > 0) {
    return upperLines[0];
  }

  return '';
}

/**
 * Extrae la calificación final del texto OCR.
 *
 * Estrategia principal: el promedio suele venir en el mismo renglón que la
 * etiqueta, ej: "PROMEDIO GENERAL: 8,19(ocho con 19/100)". Si no está en el
 * mismo renglón, se prueba en la línea siguiente, y por último se buscan
 * números o palabras de calificación sueltos en todo el texto.
 */
export function extractCalificacionFromText(text: string): string {
  const flat = text.replace(/\s+/g, ' ');

  // Estrategia 1: etiqueta y número en el mismo renglón
  // (ej: "PROMEDIO GENERAL: 8,19", "CALIFICACIÓN FINAL: 8.50")
  const sameLineMatch = flat.match(
    /(?:promedio\s*general|promedio|calificaci[oó]n(?:\s*final)?|nota\s*final)\s*[:\s]*(\d{1,2}[.,]\d{1,2})/i
  );
  if (sameLineMatch) return sameLineMatch[1].replace(',', '.');

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Estrategia 2: línea siguiente a "CALIFICACIÓN", "NOTA", "PROMEDIO"
  for (let i = 0; i < lines.length - 1; i++) {
    if (/calificaci[oó]n|nota\s*final|promedio/i.test(lines[i])) {
      const numInNextLine = lines[i + 1].match(/\d{1,2}[.,]\d{1,2}/);
      if (numInNextLine) return numInNextLine[0].replace(',', '.');
      return lines[i + 1];
    }
  }

  // Estrategia 3: palabras de calificación textual
  const textualMatch = text.match(
    /\b(sobresaliente|distinguido|bueno|aprobado|insuficiente)\b/i
  );
  if (textualMatch) return textualMatch[1];

  // Estrategia 4: número decimal suelto (ej: "8.50", "9,25")
  const numMatch = text.match(/\b(\d{1,2}[.,]\d{1,2})\b/);
  if (numMatch) return numMatch[1].replace(',', '.');

  // Estrategia 5: número entero solo (ej: "8", "10")
  const intMatch = text.match(/\b([1-9]|10)\b/);
  if (intMatch) return intMatch[1];

  return '';
}

/**
 * Procesa una imagen y extrae los campos del título académico.
 * 
 * @param imageUri - URI local de la imagen capturada por la cámara
 * @returns Datos extraídos + texto crudo OCR
 */
export async function processImage(imageUri: string): Promise<OCRData> {
  let rawText = '';

  try {
    // Importación dinámica con require para evitar errores en web/emulador
    // @ts-ignore
    const TextRecognition = require('@react-native-ml-kit/text-recognition');
    const result = await TextRecognition.default.recognize(imageUri);
    rawText = result.text || '';
  } catch (err) {
    console.warn('[OCR] Error al procesar imagen:', err);
    // Si ML Kit falla, retornar campos vacíos para carga manual
    return {
      dni: '',
      apellidoNombre: '',
      fechaEmision: '',
      calificacionFinal: '',
      serieModelo: 'DESCONOCIDO',
      rawText: '',
    };
  }

  // Extraer y limpiar cada campo
  const dni = extractDNIFromText(rawText);
  const apellidoNombre = extractNombreFromText(rawText);
  const fechaEmision = extractDateFromText(rawText);
  const calificacionFinal = extractCalificacionFromText(rawText);

  // Serie/Modelo: primero intentamos unir el año de "Serie" (izquierda) con
  // el número de folio (derecha) — ej: "2014-00901206". Si no se puede
  // armar ese identificador, caemos a la detección por patrones conocidos
  // (MODELO 2020, SERIE 2014, etc.) configurados en series-patterns.json.
  const serieFolio = extractSerieFolio(rawText, dni);
  const serieModelo = serieFolio || detectSeries(rawText);

  return {
    dni,
    apellidoNombre,
    fechaEmision,
    calificacionFinal,
    serieModelo,
    rawText,
  };
}

/**
 * Verifica si los datos OCR mínimos están presentes para proceder.
 * El DNI es OBLIGATORIO. Si falta, no se puede guardar.
 * 
 * @param data - Datos OCR extraídos
 * @returns true si los datos son suficientes para guardar
 */
export function isOCRDataSufficient(data: OCRData): boolean {
  return data.dni.length >= 7;
}
