/**
 * Tests unitarios: Detección de Series/Modelos de títulos
 */

import { detectSeries, getAvailableSeries, extractSerieFolio } from '../utils/series-detector';

describe('detectSeries', () => {
  test('detecta MODELO 2020 con texto exacto', () => {
    expect(detectSeries('MODELO 2020')).toBe('MODELO 2020');
  });

  test('detecta MODELO 2020 en texto más largo', () => {
    const text = 'Ministerio de Educación\nTítulo Bachiller\nMODELO 2020\nDNI 30.123.456';
    expect(detectSeries(text)).toBe('MODELO 2020');
  });

  test('detecta SERIE 2014 (case insensitive)', () => {
    expect(detectSeries('serie 2014')).toBe('SERIE 2014');
  });

  test('detecta con espacios adicionales entre palabras', () => {
    expect(detectSeries('MODELO  2020')).toBe('MODELO 2020');
  });

  test('retorna DESCONOCIDO para texto sin serie reconocida', () => {
    expect(detectSeries('Texto sin ningún modelo conocido')).toBe('DESCONOCIDO');
  });

  test('retorna DESCONOCIDO para texto vacío', () => {
    expect(detectSeries('')).toBe('DESCONOCIDO');
  });

  test('detecta MODELO 2019', () => {
    expect(detectSeries('formulario Modelo 2019 DGCYE')).toBe('MODELO 2019');
  });
});

describe('extractSerieFolio', () => {
  test('une el año de Serie (izquierda) con el folio (derecha)', () => {
    const text = '00901206\nSerie\n2014\nREPÚBLICA ARGENTINA';
    expect(extractSerieFolio(text)).toBe('2014-00901206');
  });

  test('funciona cuando "Serie" y el año están en el mismo renglón', () => {
    const text = '00901206\nSerie 2014\nREPÚBLICA ARGENTINA';
    expect(extractSerieFolio(text)).toBe('2014-00901206');
  });

  test('no confunde el DNI con el número de folio', () => {
    const text = '00901206\nSerie\n2014\n...documento nacional de identidad N° 38481915...';
    expect(extractSerieFolio(text, '38481915')).toBe('2014-00901206');
  });

  test('retorna solo el año si no encuentra folio', () => {
    const text = 'Serie\n2014\nsin más números sueltos arriba';
    expect(extractSerieFolio(text)).toBe('2014');
  });

  test('retorna cadena vacía si no hay serie ni folio', () => {
    expect(extractSerieFolio('texto sin datos')).toBe('');
  });
});

describe('getAvailableSeries', () => {
  test('retorna al menos los modelos principales', () => {
    const series = getAvailableSeries();
    expect(series).toContain('MODELO 2020');
    expect(series).toContain('SERIE 2014');
  });

  test('retorna un array de strings', () => {
    const series = getAvailableSeries();
    expect(Array.isArray(series)).toBe(true);
    series.forEach((s) => expect(typeof s).toBe('string'));
  });
});
