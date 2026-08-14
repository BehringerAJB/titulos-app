// Paleta de colores institucional
// Azul marino institucional + dorado + neutros

export const Colors = {
  // Colores primarios
  primary: '#1A2E5A',       // Azul marino institucional
  primaryLight: '#2A4580',  // Azul marino claro
  primaryDark: '#0F1C3A',   // Azul marino oscuro
  accent: '#C8A951',        // Dorado institucional
  accentLight: '#E8C97A',   // Dorado claro

  // Fondos
  background: '#F4F6FA',    // Gris muy claro
  surface: '#FFFFFF',       // Blanco para cards
  surfaceAlt: '#EEF1F8',    // Gris azulado suave

  // Texto
  textPrimary: '#1A2E5A',   // Azul marino para texto principal
  textSecondary: '#5A6A8A', // Gris azulado para texto secundario
  textLight: '#FFFFFF',     // Blanco para texto sobre fondo oscuro
  textMuted: '#9AA3B5',     // Gris claro

  // Estados
  success: '#2ECC71',       // Verde para "Retirado"
  successLight: '#D5F5E3',
  warning: '#F39C12',       // Naranja para "Pendiente"
  warningLight: '#FDEBD0',
  info: '#3498DB',          // Azul para "Remitido a La Plata"
  infoLight: '#D6EAF8',
  error: '#E74C3C',         // Rojo para errores
  errorLight: '#FADBD8',

  // Bordes
  border: '#D8DCE8',
  borderFocus: '#1A2E5A',

  // Sombras (para elevation)
  shadow: 'rgba(26, 46, 90, 0.12)',

  // Switch
  switchActive: '#C8A951',
  switchInactive: '#D8DCE8',
};

export type ColorKeys = keyof typeof Colors;
