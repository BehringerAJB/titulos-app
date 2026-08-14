/**
 * showAlert — reemplazo multiplataforma de Alert.alert
 *
 * Alert.alert de React Native NO hace nada en web (es solo Android/iOS).
 * Eso provoca que los callbacks de los botones (onPress) nunca se ejecuten
 * en el navegador, dejando pantallas colgadas (ej: "Guardando..." infinito).
 *
 * Este helper mantiene la misma firma que Alert.alert:
 *  - En Android/iOS delega en Alert.alert (comportamiento idéntico).
 *  - En web usa window.alert / window.confirm y ejecuta los onPress.
 */

import { Platform, Alert, AlertButton } from 'react-native';

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;

  // Sin botones o un solo botón → alert simple + ejecutar su onPress
  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  // Dos o más botones → confirm: Aceptar = botón principal, Cancelar = botón 'cancel'
  const cancelButton = buttons.find((b) => b.style === 'cancel') ?? buttons[0];
  const confirmButton =
    buttons.find((b) => b !== cancelButton) ?? buttons[buttons.length - 1];

  const accepted = window.confirm(
    `${text}\n\n[Aceptar = ${confirmButton.text ?? 'OK'} / Cancelar = ${cancelButton.text ?? 'Cancelar'}]`
  );

  if (accepted) {
    confirmButton.onPress?.();
  } else {
    cancelButton.onPress?.();
  }
}
