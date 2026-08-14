/**
 * Tests unitarios: Extracción de campos del servicio OCR
 * (apellido/nombre y calificación/promedio)
 */

import { extractNombreFromText, extractCalificacionFromText } from '../services/ocr.service';

// Texto de ejemplo que reproduce la estructura real de un título de
// secundario de adultos (Ley 26.206), como el que se usó para detectar
// los problemas de detección.
const TITULO_EJEMPLO = [
  '00901206',
  'Serie',
  '2014',
  'REPÚBLICA ARGENTINA',
  'LEY DE EDUCACIÓN NACIONAL N°26.206',
  'PROVINCIA DE BUENOS AIRES',
  'La autoridad del establecimiento educativo CENTRO EDUCATIVO NIVEL SECUNDARIO N° 452',
  'certifica que VARGAS BRAIAN nacido/a en AVELLANEDA, BUENOS AIRES el dia 16 del mes de',
  'SEPTIEMBRE del año 1994 Tipo de documento DOCUMENTO NACIONAL DE IDENTIDAD N° 38481915',
  'obtuvo el título de BACHILLER CON ORIENTACIÓN EN GESTIÓN Y ADMINISTRACIÓN',
  'PROMEDIO GENERAL: 8,19(ocho con 19/100)',
].join('\n');

describe('extractNombreFromText', () => {
  test('extrae el apellido y nombre entre "certifica que" y "nacido/a"', () => {
    expect(extractNombreFromText(TITULO_EJEMPLO)).toBe('VARGAS BRAIAN');
  });

  test('usa la estrategia de respaldo "APELLIDO Y NOMBRE" si no hay "certifica que"', () => {
    const text = 'Título Secundario\nAPELLIDO Y NOMBRE\nGONZALEZ MARIA';
    expect(extractNombreFromText(text)).toBe('GONZALEZ MARIA');
  });

  test('retorna cadena vacía si no encuentra ningún patrón', () => {
    expect(extractNombreFromText('texto sin datos relevantes')).toBe('');
  });
});

describe('extractCalificacionFromText', () => {
  test('extrae el promedio del mismo renglón que "PROMEDIO GENERAL"', () => {
    expect(extractCalificacionFromText(TITULO_EJEMPLO)).toBe('8.19');
  });

  test('extrae la calificación cuando usa punto decimal', () => {
    const text = 'CALIFICACIÓN FINAL: 8.50 puntos';
    expect(extractCalificacionFromText(text)).toBe('8.50');
  });

  test('usa la línea siguiente si el número no está en el mismo renglón', () => {
    const text = 'PROMEDIO\n9,25';
    expect(extractCalificacionFromText(text)).toBe('9.25');
  });
});
