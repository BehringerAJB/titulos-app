/**
 * Utilitario: Formateo y parseo de fechas
 * Trabaja con el formato dd/mm/aaaa usado en documentos argentinos
 */

/**
 * Formatea una fecha en el formato dd/mm/aaaa.
 * 
 * @param date - Objeto Date a formatear
 * @returns Cadena en formato "dd/mm/aaaa"
 */
export function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const aaaa = date.getFullYear();
  return `${dd}/${mm}/${aaaa}`;
}

/**
 * Formatea fecha y hora para campos de auditoría.
 * 
 * @param date - Objeto Date (por defecto: ahora)
 * @returns Cadena en formato "dd/mm/aaaa HH:MM"
 */
export function formatDateTime(date: Date = new Date()): string {
  const datePart = formatDate(date);
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${datePart} ${hh}:${min}`;
}

/**
 * Convierte una cadena dd/mm/aaaa a un objeto Date.
 * 
 * @param dateStr - Cadena en formato "dd/mm/aaaa"
 * @returns Date o null si el formato es inválido
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, aaaa] = match;
  const date = new Date(parseInt(aaaa), parseInt(mm) - 1, parseInt(dd));
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Extrae una fecha de texto crudo OCR.
 * Detecta formatos: dd/mm/aaaa, dd-mm-aaaa, dd.mm.aaaa
 * 
 * @param text - Texto crudo del OCR
 * @returns Fecha en formato dd/mm/aaaa o cadena vacía
 */
export function extractDateFromText(text: string): string {
  if (!text) return '';

  // Busca patrones de fecha con distintos separadores
  const match = text.match(
    /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/
  );

  if (match) {
    const [, dd, mm, aaaa] = match;
    return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${aaaa}`;
  }

  return '';
}

/**
 * Valida si una cadena tiene formato de fecha dd/mm/aaaa válida.
 */
export function isValidDate(dateStr: string): boolean {
  const date = parseDate(dateStr);
  return date !== null;
}
