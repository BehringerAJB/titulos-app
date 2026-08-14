# Configuración de Google Cloud Platform (desde cero)

## Gestión de Títulos — Secundario de Adultos

Este documento explica paso a paso cómo crear el proyecto en Google Cloud Console para que la aplicación pueda acceder a Google Sheets y Drive.

---

## Paso 1: Crear el Proyecto en Google Cloud Console

1. Abrí tu navegador y entrá a: https://console.cloud.google.com
2. Si no tenés cuenta de Google Cloud, la podés crear gratuitamente (no se cobra nada por lo que usa esta app).
3. En la barra superior, hacé clic en el selector de proyectos → **"Nuevo Proyecto"**.
4. Nombre del proyecto: `titulos-secundario` (o el que quieras).
5. Hacé clic en **"Crear"** y esperá unos segundos.

---

## Paso 2: Habilitar las APIs necesarias

Con el proyecto seleccionado, habilitá estas dos APIs:

### Google Sheets API
1. Andá a: https://console.cloud.google.com/apis/library/sheets.googleapis.com
2. Hacé clic en **"Habilitar"**.

### Google Drive API
1. Andá a: https://console.cloud.google.com/apis/library/drive.googleapis.com
2. Hacé clic en **"Habilitar"**.

---

## Paso 3: Configurar la Pantalla de Consentimiento OAuth

Antes de crear las credenciales, hay que configurar qué ve el usuario cuando la app pide permiso.

1. Menú izquierdo → **"APIs y servicios"** → **"Pantalla de consentimiento de OAuth"**.
2. Tipo de usuario: **"Externo"** → Hacé clic en **"Crear"**.
3. Completá:
   - **Nombre de la aplicación:** `Gestión de Títulos`
   - **Correo del soporte:** tu email
   - **Correo de contacto del desarrollador:** tu email
4. Hacé clic en **"Guardar y continuar"**.
5. En la sección **"Permisos"**, hacé clic en **"Agregar o quitar permisos"** y añadí:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`
6. Continuá hasta el final y hacé clic en **"Guardar y continuar"**.

---

## Paso 4: Crear Credenciales OAuth 2.0

> **Nota:** Como la app se va a usar en Android (iPhone descartado), solo se necesitan **dos** credenciales: Android y Web. La de iOS queda documentada al final por si algún día hace falta.

### Para Android

> ⚠️ **Requisito previo:** haber corrido al menos un build con EAS (`eas build --platform android`). El SHA-1 que pide Google sale del certificado de firma (keystore) que EAS genera durante ese primer build — antes de eso, no existe.

1. Menú → **"APIs y servicios"** → **"Credenciales"**.
2. Hacé clic en **"+ CREAR CREDENCIALES"** → **"ID de cliente de OAuth"**.
3. Tipo de aplicación: **"Android"**.
4. Nombre: `Android - Gestión de Títulos`
5. **Nombre del paquete:** `com.edu.titulosapp`
6. **Huella digital SHA-1:** Este proyecto es Expo "managed" (no tiene carpeta `android/`), así que el comando `gradlew signingReport` que suelen indicar otras guías acá **no funciona**. La forma correcta es:
   ```bash
   # En el directorio del proyecto:
   eas credentials
   ```
   Elegí plataforma **Android** → perfil **preview** (o el que usaste para el build) → la opción de ver el keystore. Copiá el valor **SHA1 Fingerprint** que muestra.
7. Hacé clic en **"Crear"** y copiá el **Client ID** (tiene el formato `XXXXXX.apps.googleusercontent.com`).

### Para Web (necesario aunque no se use navegador)

Aunque la app corra solo en el celular, `expo-auth-session` usa internamente un Client ID de tipo web durante el intercambio del código de login. Sin esta credencial, el login con Google falla incluso en Android.

1. Elegí tipo: **"Aplicación web"**.
2. En **"URIs de redireccionamiento autorizados"**, agregá:
   ```
   https://auth.expo.io/@tu-usuario-expo/titulos-app
   ```
   (Reemplazá `tu-usuario-expo` con tu nombre de usuario de la cuenta de Expo — el mismo con el que hiciste `eas login`)
3. Copiá el **Client ID** generado.

### Para iOS (solo si algún día se usa iPhone — hoy no hace falta)
1. Repetí el proceso pero elegí tipo: **"iOS"**.
2. **Identificador del paquete:** `com.edu.titulosapp`
3. Copiá el **Client ID** generado.
4. Recordá que instalar en iPhone requiere además cuenta de Apple Developer (99 USD/año) y registrar cada dispositivo.

---

## Paso 5: Configurar la App con los Client IDs

Una vez que tengas los Client IDs (Android y Web como mínimo), editá el archivo:

```
services/auth.service.ts
```

Reemplazá los placeholders:

```typescript
// ANTES:
const GOOGLE_CLIENT_ID_ANDROID = 'TU_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_IOS     = 'TU_IOS_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_WEB     = 'TU_WEB_CLIENT_ID.apps.googleusercontent.com';

// DESPUÉS (con tus datos reales):
const GOOGLE_CLIENT_ID_ANDROID = '123456789-xxxxx.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_IOS     = 'TU_IOS_CLIENT_ID.apps.googleusercontent.com'; // se deja así (iPhone descartado)
const GOOGLE_CLIENT_ID_WEB     = '123456789-zzzzz.apps.googleusercontent.com';
```

---

## Paso 6: Usuarios de Prueba (mientras la app está en modo de prueba)

Mientras la app no esté publicada en las stores, solo pueden usarla usuarios que hayas agregado como "Testers":

1. Menú → **"APIs y servicios"** → **"Pantalla de consentimiento de OAuth"**.
2. Sección **"Usuarios de prueba"** → **"+ ADD USERS"**.
3. Agregá los emails de los 4-5 operadores que van a usar la app.

> ⚠️ **Importante:** Si aparece un error "access_denied" al hacer login, verificá que el email del usuario esté en la lista de testers.

---

## Verificación

Después de completar los pasos, ejecutá la app y verificá que:

1. El botón "Iniciar sesión con Google" funciona correctamente.
2. Al hacer login, la app pide permisos de Google Sheets y Drive.
3. Al aceptar los permisos, se crea automáticamente el archivo **"Títulos Secundario"** en tu Google Drive.

---

## Costos

Esta configuración es **completamente gratuita**:
- Google Cloud tiene un nivel gratuito más que suficiente para este uso.
- Google Sheets API: gratuita hasta 300 solicitudes por minuto (más que suficiente).
- Google Drive API: gratuita para archivos creados por la app.
- ML Kit (OCR): completamente gratuito, sin límite, funciona offline.
