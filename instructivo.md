# Instructivo de Uso y Ejecución

## App de Gestión de Títulos — Secundario de Adultos

Este instructivo te guiará para ejecutar la aplicación en tu computadora o celular, utilizando el **Modo Demo (Prueba Offline)** o configurando el sistema real conectado a **Google Sheets**.

---

## 1. Cómo Ejecutar la Aplicación (Modo de Prueba)

No necesitas configurar credenciales de Google ni tener una base de datos lista para empezar. Hemos creado un **Modo Demo** interactivo.

### Paso 1: Iniciar el servidor de desarrollo
1. Abrí una terminal (PowerShell o CMD) en la computadora.
2. Navegá a la carpeta del proyecto:
   ```bash
   cd "c:\REPOSITORIO\ANTIGRAVITY\titulos-app"
   ```
3. Ejecutá el servidor de desarrollo de Expo:
   ```bash
   npx expo start
   ```

### Paso 2: Visualizar la aplicación

* **Opción A: En tu celular (Recomendado para probar la cámara)**
  1. Instalá la aplicación **Expo Go** en tu teléfono (disponible gratis en Play Store de Android y App Store de iOS).
  2. Asegurate de que tu celular y tu computadora estén conectados a la **misma red Wi-Fi**.
  3. Escaneá el **código QR** que aparece en la terminal usando la app de Expo Go (en Android) o la cámara de fotos nativa (en iOS).

* **Opción B: En el navegador de tu computadora (Web)**
  1. Con el servidor de Expo corriendo en la terminal, presioná la tecla **`w`**.
  2. Se abrirá automáticamente la interfaz de la app en tu navegador web.

---

## 2. Cómo usar el Modo Demo (Prueba Offline)

Una vez que la aplicación se cargue en tu dispositivo o navegador:

1. **Inicio de Sesión:** En la pantalla de login, presioná el botón dorado que dice **"Probar en Modo Demo (Offline)"**.
2. **Dashboard:** Entrarás directamente a la pantalla de estadísticas con 3 alumnos de prueba ya cargados. Podrás ver los gráficos de barras y contadores dinámicos.
3. **Buscar / Editar:**
   * Ve al panel de búsqueda e ingresá, por ejemplo, el DNI `30123456`.
   * Verás los datos de "GONZALEZ, MARÍA BELÉN". Podrás cambiar su estado a "Retirado por el alumno" o "Remitido a La Plata" y guardarlo. Los cambios se guardarán localmente en la memoria durante la sesión.
4. **Nueva Carga (Simulador OCR):**
   * Ve a la pestaña **"Nuevo"**.
   * Si estás en un emulador o navegador web sin cámara física, verás una pantalla de cámara simulada.
   * Presioná el botón **"🧪 Simular Captura y OCR"**.
   * El sistema simulará haber tomado la fotografía de un título físico y completará automáticamente un DNI aleatorio, Apellido y Nombre, Fecha de Emisión, Nota y Serie (ej: "MODELO 2020").
   * Podrás corregir los campos y presionar **"Guardar en Drive"** (que en este modo se añade al listado de memoria local).

---

## 3. Configuración para Producción (Conexión Real con Google Sheets)

Cuando decidas que la app está lista para conectarse directamente al Google Drive de tu institución, seguí estos pasos:

1. **Configuración de Google Cloud:** Seguí al pie de la letra la guía detallada ubicada en:
   * [docs/SETUP_GCP.md](file:///c:/REPOSITORIO/ANTIGRAVITY/titulos-app/docs/SETUP_GCP.md)
   * Allí aprenderás a crear un proyecto gratuito en Google Cloud, activar las APIs de Sheets y Drive, y crear los **Client IDs** de OAuth.
2. **Reemplazo de Credenciales:** Colocá tus Client IDs reales en el archivo:
   * [services/auth.service.ts](file:///c:/REPOSITORIO/ANTIGRAVITY/titulos-app/services/auth.service.ts)
3. **Uso de la Cuenta Institucional:** Iniciá sesión usando el botón **"Iniciar sesión con Google"**. La primera vez, la aplicación creará automáticamente una hoja de cálculo llamada `"Títulos Secundario"` en la raíz de tu Google Drive. Cualquier carga que realices desde ese momento se insertará directamente como una fila en ese archivo de Excel de manera segura y en tiempo real.

---

## 4. Estructura del Código

Si querés revisar o extender el código, estos son los archivos clave:
* **[nuevo.tsx](file:///c:/REPOSITORIO/ANTIGRAVITY/titulos-app/app/(tabs)/nuevo.tsx):** Lógica del flujo de cámara, captura, corrección de OCR y guardado.
* **[buscar.tsx](file:///c:/REPOSITORIO/ANTIGRAVITY/titulos-app/app/(tabs)/buscar.tsx):** Pantalla de búsquedas por DNI y edición de registros.
* **[sheets.service.ts](file:///c:/REPOSITORIO/ANTIGRAVITY/titulos-app/services/sheets.service.ts):** Conexión con la API de Google Sheets y base de datos local simulada.
* **[ocr.service.ts](file:///c:/REPOSITORIO/ANTIGRAVITY/titulos-app/services/ocr.service.ts):** Procesamiento de imágenes mediante Google ML Kit.
