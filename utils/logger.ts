/**
 * Logger local de la app
 *
 * Guarda un historial acotado de eventos y errores (login, llamadas a
 * Google Sheets/Drive, OCR, etc.) para poder diagnosticar problemas
 * directamente desde el celular, sin depender de revisar el código.
 *
 * Se guarda en SecureStore como un único valor JSON, recortando las
 * entradas más viejas para no superar el límite recomendado por Expo
 * para SecureStore (~2048 bytes por clave). Por eso el historial es
 * corto (últimas ~25 entradas) — para diagnósticos rápidos, no como
 * reemplazo de un sistema de logs completo.
 *
 * No requiere ningún módulo nativo nuevo: usa expo-secure-store, que
 * la app ya tenía instalado. Esto permite que el logger se distribuya
 * con EAS Update (sin necesidad de compilar un APK nuevo).
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const LOG_KEY = 'TITULOS_APP_LOG';
const MAX_ENTRIES = 25;
const MAX_CHARS = 1800; // margen de seguridad bajo el límite práctico de SecureStore

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  t: string; // timestamp ISO
  l: LogLevel; // nivel
  tag: string; // origen del evento (ej: 'sheets.getAllRows')
  msg: string; // mensaje corto
}

// Fallback en memoria para web (SecureStore no existe ahí)
const memoryLog: LogEntry[] = [];

async function readEntries(): Promise<LogEntry[]> {
  if (Platform.OS === 'web') return memoryLog;
  try {
    const raw = await SecureStore.getItemAsync(LOG_KEY);
    return raw ? (JSON.parse(raw) as LogEntry[]) : [];
  } catch {
    return [];
  }
}

async function writeEntries(entries: LogEntry[]): Promise<void> {
  // Recorta por cantidad y, si hace falta, por tamaño total (empezando por lo más viejo)
  let trimmed = entries.slice(-MAX_ENTRIES);
  while (JSON.stringify(trimmed).length > MAX_CHARS && trimmed.length > 1) {
    trimmed = trimmed.slice(1);
  }

  if (Platform.OS === 'web') {
    memoryLog.length = 0;
    memoryLog.push(...trimmed);
    return;
  }
  try {
    await SecureStore.setItemAsync(LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // Si falla el guardado del log, no debe romper el flujo normal de la app
  }
}

function shortenMessage(msg: string, max = 160): string {
  return msg.length > max ? msg.slice(0, max) + '…' : msg;
}

/**
 * Extrae información útil de un error (especialmente errores de axios)
 * sin volcar el objeto completo — status HTTP, URL, y el mensaje que
 * devolvió la API de Google si lo trae.
 */
export function describeError(err: any): string {
  if (err?.isAxiosError) {
    const status = err.response?.status;
    const url = err.config?.url;
    const apiMsg = err.response?.data?.error?.message;
    return `HTTP ${status ?? '?'} ${url ?? ''} — ${apiMsg || err.message}`;
  }
  return err?.message || String(err);
}

async function addEntry(level: LogLevel, tag: string, msg: string): Promise<void> {
  const entry: LogEntry = {
    t: new Date().toISOString(),
    l: level,
    tag,
    msg: shortenMessage(msg),
  };

  // También a consola, por si está conectado con Metro / adb logcat
  const line = `[${entry.t}] [${level}] [${tag}] ${entry.msg}`;
  if (level === 'ERROR') console.error(line);
  else if (level === 'WARN') console.warn(line);
  else console.log(line);

  const entries = await readEntries();
  entries.push(entry);
  await writeEntries(entries);
}

export const logInfo = (tag: string, msg: string) => addEntry('INFO', tag, msg);
export const logWarn = (tag: string, msg: string) => addEntry('WARN', tag, msg);
export const logError = (tag: string, msg: string) => addEntry('ERROR', tag, msg);

/** Devuelve el historial completo, más reciente primero */
export async function getLogEntries(): Promise<LogEntry[]> {
  const entries = await readEntries();
  return [...entries].reverse();
}

export async function clearLog(): Promise<void> {
  if (Platform.OS === 'web') {
    memoryLog.length = 0;
    return;
  }
  try {
    await SecureStore.deleteItemAsync(LOG_KEY);
  } catch {
    // noop
  }
}
