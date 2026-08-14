/**
 * Selector de fecha multiplataforma
 *
 * react-native-modal-datetime-picker (el calendario táctil) solo existe en
 * Android/iOS. En el navegador no hay equivalente nativo de React Native,
 * pero el navegador SÍ tiene su propio selector de fecha con calendario:
 * el input HTML <input type="date">. Esta función crea uno invisible,
 * le pide al navegador que abra su calendario (showPicker) y devuelve
 * la fecha elegida.
 *
 * Si el navegador es muy viejo y no soporta showPicker(), cae a pedir
 * la fecha escrita (dd/mm/aaaa) como respaldo.
 */

import { parseDate, formatDate } from './date-formatter';

function toISODate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function fromISODate(iso: string): Date | null {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, yyyy, mm, dd] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return isNaN(date.getTime()) ? null : date;
}

/** Respaldo: pide la fecha escrita a mano (navegadores sin showPicker) */
function pickDateWebPrompt(label: string, current: Date | null): Date | null {
  const initial = current ? formatDate(current) : '';
  const input = window.prompt(`${label}\n\nIngresá la fecha (dd/mm/aaaa):`, initial);
  if (input === null) return null;
  const parsed = parseDate(input.trim());
  if (!parsed) {
    window.alert('Fecha inválida. Usá el formato dd/mm/aaaa (ejemplo: 20/07/2026).');
    return null;
  }
  return parsed;
}

/**
 * Abre el calendario nativo del navegador y devuelve la fecha elegida
 * (o null si se canceló). Usar con await.
 */
export function pickDateWeb(label: string, current: Date | null): Promise<Date | null> {
  return new Promise((resolve) => {
    // Navegador sin soporte de <input type="date"> con calendario → prompt
    const testInput = document.createElement('input');
    testInput.type = 'date';
    const supportsShowPicker = typeof (testInput as any).showPicker === 'function';

    if (!supportsShowPicker) {
      resolve(pickDateWebPrompt(label, current));
      return;
    }

    const input = document.createElement('input');
    input.type = 'date';
    input.setAttribute('aria-label', label);
    // Invisible pero funcional: fuera de la vista, sin afectar el layout
    input.style.position = 'fixed';
    input.style.top = '-1000px';
    input.style.left = '-1000px';
    input.style.opacity = '0';
    if (current) input.value = toISODate(current);

    document.body.appendChild(input);

    let settled = false;
    const finish = (result: Date | null) => {
      if (settled) return;
      settled = true;
      input.removeEventListener('change', onChange);
      input.removeEventListener('cancel', onCancel);
      document.body.removeChild(input);
      resolve(result);
    };

    const onChange = () => {
      finish(input.value ? fromISODate(input.value) : null);
    };
    const onCancel = () => finish(null);

    input.addEventListener('change', onChange);
    // Evento 'cancel' se dispara al cerrar el calendario sin elegir fecha (Chrome/Edge)
    input.addEventListener('cancel', onCancel);

    (input as any).showPicker();
  });
}
