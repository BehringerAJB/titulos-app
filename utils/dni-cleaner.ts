/**
 * Utilitario: Limpieza y validación de DNI
 * Elimina puntos, comas, guiones y espacios. Solo deja dígitos.
 */

/**
 * Limpia el formato de un DNI extraído por OCR.
 * Elimina puntos, comas, guiones, espacios y cualquier carácter no numérico.
 * 
 * Ejemplos:
 *   "30.123.456"  → "30123456"
 *   "30 123 456"  → "30123456"
 *   "30-123-456"  → "30123456"
 *   "DNI: 30.123.456" → "30123456"
 * 
 * @param rawDni - Texto crudo del DNI extraído por OCR
 * @returns DNI limpio con solo dígitos, o cadena vacía si no hay dígitos válidos
 */
export function cleanDNI(rawDni: string): string {
  if (!rawDni) return '';

  // Eliminar todo lo que no sea dígito
  const digitsOnly = rawDni.replace(/\D/g, '');

  return digitsOnly;
}

/**
 * Valida que un DNI tenga entre 7 y 8 dígitos (formato DNI argentino).
 * 
 * @param dni - DNI ya limpio (solo dígitos)
 * @returns true si es válido
 */
export function isValidDNI(dni: string): boolean {
  if (!dni) return false;
  // DNI argentino: 7 u 8 dígitos
  return /^\d{7,8}$/.test(dni);
}

/**
 * Busca un posible DNI dentro de un texto largo (salida cruda de OCR).
 * Estrategia: busca secuencias de dígitos con o sin separadores de grupos.
 * 
 * @param text - Texto crudo del OCR
 * @returns DNI limpio encontrado, o cadena vacía si no se detecta
 */
export function extractDNIFromText(text: string): string {
  if (!text) return '';

  // Patrón 1: "XX.XXX.XXX" o "X.XXX.XXX" (con puntos)
  const withDotsMatch = text.match(/\b\d{1,2}\.\d{3}\.\d{3}\b/);
  if (withDotsMatch) {
    return cleanDNI(withDotsMatch[0]);
  }

  // Patrón 2: "XXXXXXXX" o "XXXXXXX" (7-8 dígitos seguidos)
  const rawMatch = text.match(/\b\d{7,8}\b/);
  if (rawMatch) {
    return cleanDNI(rawMatch[0]);
  }

  // Patrón 3: Precedido por "DNI", "N°", "Nro", "Documento" (case insensitive)
  const labeledMatch = text.match(
    /(?:DNI|N[°º]|Nro\.?|Documento|Doc\.?)[:\s]*(\d[\d\.\s\-]{6,10}\d)/i
  );
  if (labeledMatch) {
    return cleanDNI(labeledMatch[1]);
  }

  return '';
}
