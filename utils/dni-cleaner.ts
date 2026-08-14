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
 *
 * Los títulos suelen tener OTROS números de 7-8 dígitos en la misma página
 * (el número de serie/folio arriba a la derecha, códigos de resolución, etc.),
 * así que priorizamos SIEMPRE los patrones que vienen acompañados de una
 * etiqueta explícita ("Documento Nacional de Identidad", "DNI", "N°...")
 * antes que un número suelto, para evitar confundir el folio con el DNI.
 *
 * @param text - Texto crudo del OCR
 * @returns DNI limpio encontrado, o cadena vacía si no se detecta
 */
export function extractDNIFromText(text: string): string {
  if (!text) return '';

  // Texto "aplanado" (sin saltos de línea) para poder buscar frases que el
  // OCR partió en varias líneas, ej: "...Tipo de documento DOCUMENTO\nNACIONAL DE IDENTIDAD N° 38481915..."
  const flat = text.replace(/\s+/g, ' ');

  // Estrategia 1 (más confiable): precedido por "Documento Nacional de
  // Identidad" o "DNI", con o sin "N°" en el medio.
  const dniLabelMatch = flat.match(
    /(?:documento\s*nacional\s*de\s*identidad|D\.?N\.?I\.?)\s*(?:n[°ºo]\.?)?\s*[:\s]*(\d[\d.\s-]{5,10}\d)/i
  );
  if (dniLabelMatch) {
    const candidate = cleanDNI(dniLabelMatch[1]);
    if (candidate.length >= 7 && candidate.length <= 8) return candidate;
  }

  // Estrategia 2: "XX.XXX.XXX" o "X.XXX.XXX" (con puntos, formato clásico argentino)
  const withDotsMatch = text.match(/\b\d{1,2}\.\d{3}\.\d{3}\b/);
  if (withDotsMatch) {
    return cleanDNI(withDotsMatch[0]);
  }

  // Estrategia 3: precedido por una etiqueta más genérica ("N°", "Nro",
  // "Documento", "Doc"). Menos confiable porque puede matchear otros
  // números con "N°" delante (leyes, resoluciones), pero sigue siendo
  // mejor que un número suelto.
  const genericLabelMatch = flat.match(
    /(?:N[°º]|Nro\.?|Documento|Doc\.?)[:\s]*(\d[\d.\s-]{6,10}\d)/i
  );
  if (genericLabelMatch) {
    const candidate = cleanDNI(genericLabelMatch[1]);
    if (candidate.length >= 7 && candidate.length <= 8) return candidate;
  }

  // Estrategia 4 (última opción): "XXXXXXXX" o "XXXXXXX" (7-8 dígitos
  // seguidos, sin ninguna etiqueta). Puede confundirse con el número de
  // serie/folio del título — por eso va al final.
  const rawMatch = text.match(/\b\d{7,8}\b/);
  if (rawMatch) {
    return cleanDNI(rawMatch[0]);
  }

  return '';
}
