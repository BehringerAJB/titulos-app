/**
 * Tests unitarios: Limpieza y validación de DNI
 */

import { cleanDNI, isValidDNI, extractDNIFromText } from '../utils/dni-cleaner';

describe('cleanDNI', () => {
  test('elimina puntos del formato estándar argentino', () => {
    expect(cleanDNI('30.123.456')).toBe('30123456');
  });

  test('elimina espacios', () => {
    expect(cleanDNI('30 123 456')).toBe('30123456');
  });

  test('elimina guiones', () => {
    expect(cleanDNI('30-123-456')).toBe('30123456');
  });

  test('retorna solo dígitos de un texto mixto', () => {
    expect(cleanDNI('DNI: 30.123.456')).toBe('30123456');
  });

  test('retorna cadena vacía para input vacío', () => {
    expect(cleanDNI('')).toBe('');
  });

  test('no altera un DNI ya limpio', () => {
    expect(cleanDNI('30123456')).toBe('30123456');
  });
});

describe('isValidDNI', () => {
  test('valida DNI de 8 dígitos', () => {
    expect(isValidDNI('30123456')).toBe(true);
  });

  test('valida DNI de 7 dígitos', () => {
    expect(isValidDNI('5123456')).toBe(true);
  });

  test('rechaza DNI de menos de 7 dígitos', () => {
    expect(isValidDNI('123456')).toBe(false);
  });

  test('rechaza DNI de más de 8 dígitos', () => {
    expect(isValidDNI('301234567')).toBe(false);
  });

  test('rechaza cadena vacía', () => {
    expect(isValidDNI('')).toBe(false);
  });
});

describe('extractDNIFromText', () => {
  test('extrae DNI con puntos de texto OCR', () => {
    const text = 'Ministerio de Educación\nDNI: 30.123.456\nJUAN CARLOS PÉREZ';
    expect(extractDNIFromText(text)).toBe('30123456');
  });

  test('extrae DNI sin separadores de texto crudo OCR', () => {
    const text = 'Nro Documento 30123456 Calificación 8.50';
    expect(extractDNIFromText(text)).toBe('30123456');
  });

  test('prefiere el formato con puntos sobre el sin formato', () => {
    const text = 'N° 30.123.456\nSobresaliente';
    expect(extractDNIFromText(text)).toBe('30123456');
  });

  test('retorna cadena vacía si no hay DNI en el texto', () => {
    const text = 'Sin datos relevantes aquí';
    expect(extractDNIFromText(text)).toBe('');
  });

  test('no confunde el DNI con el número de serie/folio del título', () => {
    // "00901206" es el folio (arriba a la derecha) y "38481915" el DNI real,
    // que viene etiquetado como "documento nacional de identidad".
    const text = [
      '00901206',
      'Serie',
      '2014',
      'REPÚBLICA ARGENTINA',
      'la autoridad certifica que VARGAS BRAIAN Tipo de documento',
      'DOCUMENTO NACIONAL DE IDENTIDAD N° 38481915 obtuvo el título',
    ].join('\n');
    expect(extractDNIFromText(text)).toBe('38481915');
  });

  test('detecta el DNI aunque la etiqueta esté partida en dos líneas por el OCR', () => {
    const text = 'Tipo de documento DOCUMENTO\nNACIONAL DE IDENTIDAD N° 38481915';
    expect(extractDNIFromText(text)).toBe('38481915');
  });
});
