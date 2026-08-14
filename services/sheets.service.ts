/**
 * Servicio Google Sheets
 * 
 * CRUD completo para la hoja de cálculo de títulos.
 * Cada fila corresponde a un título. El DNI es la clave primaria (columna A).
 * 
 * Estructura de columnas (índice 0 = col A):
 *  0: DNI
 *  1: Apellido y Nombre
 *  2: Fecha de Emisión
 *  3: Calificación Final
 *  4: Serie / Modelo
 *  5: ¿Retirado? (Sí/No)
 *  6: Fecha de Retiro
 *  7: Quién Retiró
 *  8: ¿Remitido a La Plata? (Sí/No)
 *  9: Fecha de Envío a La Plata
 * 10: Fecha de Devolución a La Plata
 * 11: Fecha de Captura
 * 12: Última Modificación
 */

import axios from 'axios';
import { formatDateTime } from '../utils/date-formatter';
import type { TituloRecord, SheetSearchResult, SheetRowIndex } from '../types';

// Nombre del archivo de Google Sheets que se creará/buscará
const SPREADSHEET_NAME = 'Títulos Secundario';

// Nombre de la hoja dentro del archivo
const SHEET_NAME = 'Títulos';

// Fila de encabezados (fila 1 en Sheets = índice 1)
const HEADER_ROW = [
  'Número de Documento',
  'Apellido y Nombre',
  'Fecha de Emisión',
  'Calificación Final',
  'Serie / Modelo',
  '¿Retirado?',
  'Fecha de Retiro',
  'Quién Retiró',
  '¿Remitido a La Plata?',
  'Fecha de Envío a La Plata',
  'Fecha de Devolución a La Plata',
  'Fecha de Captura',
  'Última Modificación',
];

// Base de datos local simulada para el Modo Demo / Prueba
const localMockDatabase: TituloRecord[] = [
  {
    dni: "30123456",
    apellidoNombre: "GONZALEZ, MARÍA BELÉN",
    fechaEmision: "15/05/2021",
    calificacionFinal: "8.50",
    serieModelo: "MODELO 2020",
    retirado: false,
    fechaRetiro: "",
    quienRetiro: "",
    remitidoLaPlata: false,
    fechaEnvioLaPlata: "",
    fechaDevolucionLaPlata: "",
    fechaCaptura: "19/06/2026 10:30",
    ultimaModificacion: "19/06/2026 10:30"
  },
  {
    dni: "35987654",
    apellidoNombre: "RODRIGUEZ, JUAN CARLOS",
    fechaEmision: "10/11/2020",
    calificacionFinal: "9.00",
    serieModelo: "MODELO 2020",
    retirado: true,
    fechaRetiro: "12/12/2020",
    quienRetiro: "RODRIGUEZ, JUAN CARLOS",
    remitidoLaPlata: false,
    fechaEnvioLaPlata: "",
    fechaDevolucionLaPlata: "",
    fechaCaptura: "19/06/2026 11:15",
    ultimaModificacion: "19/06/2026 11:15"
  },
  {
    dni: "28456123",
    apellidoNombre: "PÉREZ, SILVIA SUSANA",
    fechaEmision: "04/08/2019",
    calificacionFinal: "7.75",
    serieModelo: "MODELO 2019",
    retirado: false,
    fechaRetiro: "",
    quienRetiro: "",
    remitidoLaPlata: true,
    fechaEnvioLaPlata: "15/09/2019",
    fechaDevolucionLaPlata: "",
    fechaCaptura: "19/06/2026 12:00",
    ultimaModificacion: "19/06/2026 12:00"
  }
];

// ─── HELPERS DE CONVERSIÓN ────────────────────────────────────────────────────

/** Convierte un TituloRecord a un array de valores para Sheets */
function recordToRow(record: TituloRecord): string[] {
  return [
    record.dni,
    record.apellidoNombre,
    record.fechaEmision,
    record.calificacionFinal,
    record.serieModelo,
    record.retirado ? 'Sí' : 'No',
    record.fechaRetiro,
    record.quienRetiro,
    record.remitidoLaPlata ? 'Sí' : 'No',
    record.fechaEnvioLaPlata,
    record.fechaDevolucionLaPlata,
    record.fechaCaptura,
    record.ultimaModificacion,
  ];
}

/** Convierte un array de valores de Sheets a TituloRecord */
function rowToRecord(row: string[]): TituloRecord {
  return {
    dni: row[0] || '',
    apellidoNombre: row[1] || '',
    fechaEmision: row[2] || '',
    calificacionFinal: row[3] || '',
    serieModelo: row[4] || '',
    retirado: (row[5] || '').toLowerCase() === 'sí',
    fechaRetiro: row[6] || '',
    quienRetiro: row[7] || '',
    remitidoLaPlata: (row[8] || '').toLowerCase() === 'sí',
    fechaEnvioLaPlata: row[9] || '',
    fechaDevolucionLaPlata: row[10] || '',
    fechaCaptura: row[11] || '',
    ultimaModificacion: row[12] || '',
  };
}

// ─── API SHEETS ───────────────────────────────────────────────────────────────

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_BASE  = 'https://www.googleapis.com/drive/v3';

function sheetsHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

/**
 * Busca en Google Drive un spreadsheet con el nombre SPREADSHEET_NAME.
 * Si no existe, lo crea con encabezados.
 * 
 * @param accessToken - Token de acceso OAuth
 * @returns ID del spreadsheet
 */
export async function findOrCreateSpreadsheet(accessToken: string): Promise<string> {
  if (accessToken === 'demo') {
    return 'demo-spreadsheet-id';
  }
  const headers = sheetsHeaders(accessToken);

  // Buscar archivo existente
  const searchRes = await axios.get(`${DRIVE_BASE}/files`, {
    headers,
    params: {
      q: `name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id,name)',
    },
  });

  const files = searchRes.data.files || [];
  if (files.length > 0) {
    return files[0].id as string;
  }

  // Crear nuevo spreadsheet con encabezados
  const createRes = await axios.post(
    SHEETS_BASE,
    {
      properties: { title: SPREADSHEET_NAME },
      sheets: [
        {
          properties: { title: SHEET_NAME },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: HEADER_ROW.map((h) => ({
                    userEnteredValue: { stringValue: h },
                    userEnteredFormat: {
                      textFormat: { bold: true },
                      backgroundColor: { red: 0.102, green: 0.180, blue: 0.353 }, // #1A2E5A
                    },
                  })),
                },
              ],
            },
          ],
        },
      ],
    },
    { headers }
  );

  return createRes.data.spreadsheetId as string;
}

/**
 * Busca un título por DNI en la hoja de cálculo.
 * 
 * @param accessToken - Token de acceso OAuth
 * @param spreadsheetId - ID del spreadsheet
 * @param dni - DNI limpio (solo dígitos)
 * @returns Resultado con rowIndex (1-based en Sheets, +1 por encabezado) y datos
 */
export async function findByDNI(
  accessToken: string,
  spreadsheetId: string,
  dni: string
): Promise<SheetSearchResult> {
  if (accessToken === 'demo' || spreadsheetId === 'demo-spreadsheet-id') {
    const index = localMockDatabase.findIndex((r) => r.dni === dni);
    if (index !== -1) {
      return {
        found: true,
        rowIndex: index + 2, // 1-based, el índice 0 corresponde a la fila 2
        data: { ...localMockDatabase[index] },
      };
    }
    return { found: false, rowIndex: null, data: null };
  }
  const headers = sheetsHeaders(accessToken);

  // Obtener toda la columna A (DNIs) para buscar
  const range = `${SHEET_NAME}!A:A`;
  const res = await axios.get(`${SHEETS_BASE}/${spreadsheetId}/values/${range}`, {
    headers,
  });

  const rows: string[][] = res.data.values || [];

  // rows[0] es el encabezado, empezamos en rows[1]
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === dni) {
      // Fila encontrada — obtener todos los datos de esa fila
      const rowRange = `${SHEET_NAME}!A${i + 1}:M${i + 1}`;
      const rowRes = await axios.get(
        `${SHEETS_BASE}/${spreadsheetId}/values/${rowRange}`,
        { headers }
      );
      const rowValues: string[] = (rowRes.data.values || [[]])[0] || [];
      return {
        found: true,
        rowIndex: i + 1, // 1-based, incluyendo encabezado
        data: rowToRecord(rowValues),
      };
    }
  }

  return { found: false, rowIndex: null, data: null };
}

/**
 * Busca títulos por Apellido y Nombre (coincidencia parcial, sin distinguir
 * mayúsculas/minúsculas ni acentos). Puede devolver varios resultados si
 * hay más de una persona que coincide con el texto buscado.
 *
 * @param accessToken - Token de acceso OAuth
 * @param spreadsheetId - ID del spreadsheet
 * @param query - Texto a buscar dentro de "Apellido y Nombre"
 * @returns Lista de coincidencias con su fila y datos
 */
export async function findByApellido(
  accessToken: string,
  spreadsheetId: string,
  query: string
): Promise<{ rowIndex: SheetRowIndex; data: TituloRecord }[]> {
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quita acentos
      .toLowerCase()
      .trim();

  const needle = normalize(query);
  if (!needle) return [];

  if (accessToken === 'demo' || spreadsheetId === 'demo-spreadsheet-id') {
    return localMockDatabase
      .map((record, index) => ({ rowIndex: index + 2, data: { ...record } }))
      .filter((r) => normalize(r.data.apellidoNombre).includes(needle));
  }

  const headers = sheetsHeaders(accessToken);
  const range = `${SHEET_NAME}!A2:M`;
  const res = await axios.get(`${SHEETS_BASE}/${spreadsheetId}/values/${range}`, {
    headers,
  });

  const rows: string[][] = res.data.values || [];
  const results: { rowIndex: SheetRowIndex; data: TituloRecord }[] = [];

  rows.forEach((row, i) => {
    const record = rowToRecord(row);
    if (normalize(record.apellidoNombre).includes(needle)) {
      results.push({ rowIndex: i + 2, data: record }); // +2: fila 1 es encabezado, i es 0-based
    }
  });

  return results;
}

/**
 * Agrega un nuevo título como fila al final de la hoja.
 * Debe verificarse previamente que el DNI no existe (ver findByDNI).
 * 
 * @param accessToken - Token OAuth
 * @param spreadsheetId - ID del spreadsheet
 * @param record - Datos del título (sin fechaCaptura ni ultimaModificacion — se generan aquí)
 */
export async function addRow(
  accessToken: string,
  spreadsheetId: string,
  record: TituloRecord
): Promise<void> {
  if (accessToken === 'demo' || spreadsheetId === 'demo-spreadsheet-id') {
    const now = formatDateTime();
    localMockDatabase.push({
      ...record,
      fechaCaptura: now,
      ultimaModificacion: now,
    });
    return;
  }
  const headers = sheetsHeaders(accessToken);
  const now = formatDateTime();

  const fullRecord: TituloRecord = {
    ...record,
    fechaCaptura: now,
    ultimaModificacion: now,
  };

  const values = [recordToRow(fullRecord)];

  await axios.post(
    `${SHEETS_BASE}/${spreadsheetId}/values/${SHEET_NAME}!A:M:append`,
    { values },
    {
      headers,
      params: {
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
      },
    }
  );
}

/**
 * Actualiza una fila existente identificada por su número de fila.
 * El rowIndex se obtiene de findByDNI.
 * 
 * @param accessToken - Token OAuth
 * @param spreadsheetId - ID del spreadsheet
 * @param rowIndex - Número de fila en Sheets (1-based)
 * @param record - Datos actualizados del título
 */
export async function updateRow(
  accessToken: string,
  spreadsheetId: string,
  rowIndex: number,
  record: TituloRecord
): Promise<void> {
  if (accessToken === 'demo' || spreadsheetId === 'demo-spreadsheet-id') {
    const index = rowIndex - 2;
    if (index >= 0 && index < localMockDatabase.length) {
      localMockDatabase[index] = {
        ...record,
        ultimaModificacion: formatDateTime(),
      };
    }
    return;
  }
  const headers = sheetsHeaders(accessToken);

  const updatedRecord: TituloRecord = {
    ...record,
    ultimaModificacion: formatDateTime(),
    // Preservar fechaCaptura original
    fechaCaptura: record.fechaCaptura,
  };

  const values = [recordToRow(updatedRecord)];
  const range = `${SHEET_NAME}!A${rowIndex}:M${rowIndex}`;

  await axios.put(
    `${SHEETS_BASE}/${spreadsheetId}/values/${range}`,
    { values },
    {
      headers,
      params: { valueInputOption: 'USER_ENTERED' },
    }
  );
}

/**
 * Obtiene todas las filas de la hoja (excluyendo encabezado).
 * Útil para el Dashboard (estadísticas).
 * 
 * @param accessToken - Token OAuth
 * @param spreadsheetId - ID del spreadsheet
 * @returns Array de TituloRecord
 */
export async function getAllRows(
  accessToken: string,
  spreadsheetId: string
): Promise<TituloRecord[]> {
  if (accessToken === 'demo' || spreadsheetId === 'demo-spreadsheet-id') {
    return [...localMockDatabase];
  }
  const headers = sheetsHeaders(accessToken);
  const range = `${SHEET_NAME}!A2:M`;

  const res = await axios.get(
    `${SHEETS_BASE}/${spreadsheetId}/values/${range}`,
    { headers }
  );

  const rows: string[][] = res.data.values || [];
  return rows.map((row) => rowToRecord(row));
}
