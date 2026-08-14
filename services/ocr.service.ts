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
import { detectSeries } from '../utils/series-detector';
import type { OCRData } from '../types';

/**
 * Extrae el nombre/apellido del texto OCR.
 * Estrategia: busca línea precedida por "APELLIDO" o "NOMBRE" o similar.
 * Si no encuentra, retorna la segunda o tercera línea de texto más larga.
 */
function extractNombreFromText(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Estrategia 1: buscar línea siguiente a "APELLIDO Y NOMBRE" o "APELLIDO/NOMBRE"
  for (let i = 0; i < lines.length - 1; i++) {
    if (/apellido\s*(y\s*)?nombre/i.test(lines[i])) {
      return lines[i + 1];
    }
  }

  // Estrategia 2: buscar líneas en MAYÚSCULAS de más de 5 chars (nombres suelen estar en mayúscula)
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
 * Busca números decimales o palabras clave de calificación.
 */
function extractCalificacionFromText(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Estrategia 1: línea siguiente a "CALIFICACIÓN", "NOTA", "PROMEDIO"
  for (let i = 0; i < lines.length - 1; i++) {
    if (/calificaci[oó]n|nota\s*final|promedio/i.test(lines[i])) {
      return lines[i + 1];
    }
  }

  // Estrategia 2: palabras de calificación textual
  const textualMatch = text.match(
    /\b(sobresaliente|distinguido|bueno|aprobado|insuficiente)\b/i
  );
  if (textualMatch) return textualMatch[1];

  // Estrategia 3: número decimal (ej: "8.50", "9,25")
  const numMatch = text.match(/\b(\d{1,2}[.,]\d{1,2})\b/);
  if (numMatch) return numMatch[1].replace(',', '.');

  // Estrategia 4: número entero solo (ej: "8", "10")
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
  const serieModelo = detectSeries(rawText);

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
