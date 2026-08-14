# Guía 05 — Credenciales de Google (para que la app guarde datos reales)

> **Camino completo:** Guía 01 → Guía 02 → Guía 03 → Guía 04 → **Guía 05 (credenciales)** → Guía 06 (producción).
> **Requisito previo obligatorio:** haber completado la Guía 04. El Client ID de Android necesita la "huella SHA-1", que recién existe cuando EAS generó el keystore en el primer build. Si intentás este trámite antes, te va a faltar ese dato.

Hasta que esto no esté hecho, la app solo funciona en Modo Demo. Este trámite + la Guía 06 son lo que falta para que guarde de verdad en Google Sheets.

La guía técnica detallada está también en el proyecto: `docs/SETUP_GCP.md`. Este documento es la versión explicada con el porqué de cada paso. Los conceptos (OAuth, Client ID, access token) están en la Guía 03 — si algo no te cierra, volvé ahí.

---

## Paso 1 — Crear un proyecto en Google Cloud Console

`https://console.cloud.google.com` → selector de proyectos (barra superior) → **"Nuevo Proyecto"** → nombre: `titulos-secundario`.

*¿Para qué?* Es el "contenedor" administrativo donde van a vivir las credenciales. Gratis — nada de lo que usa esta app genera cobro.

---

## Paso 2 — Habilitar dos APIs

- Google Sheets API: `https://console.cloud.google.com/apis/library/sheets.googleapis.com` → **Habilitar**
- Google Drive API: `https://console.cloud.google.com/apis/library/drive.googleapis.com` → **Habilitar**

*¿Para qué?* Un proyecto nuevo de Google Cloud viene con todo "apagado". Si no habilitás estas dos, la app recibe un error de permiso apenas intenta leer o escribir la planilla, aunque el login haya salido bien.

---

## Paso 3 — Configurar la pantalla de consentimiento OAuth

Menú → **"APIs y servicios"** → **"Pantalla de consentimiento de OAuth"** → tipo **"Externo"**.
Completar nombre de la app (`Gestión de Títulos`) y tus emails de contacto. En "Permisos", agregar:

- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/drive.file`

*¿Para qué?* Es la pantalla que ve el operador cuando Google le pregunta "¿autorizás a esta app a acceder a tus Sheets?". Acá definís qué nombre ve y qué permisos exactos se piden (solo planillas y solo archivos creados por la app — no todo su Drive).

---

## Paso 4 — Crear las credenciales (Client IDs)

Como se descartó iPhone, hacen falta **dos**, no tres:

### 4a. Client ID de Android

Menú → **"Credenciales"** → **"+ CREAR CREDENCIALES"** → **"ID de cliente de OAuth"** → tipo **Android**.

- Nombre del paquete: `com.edu.titulosapp`
- Huella SHA-1: se obtiene con `eas credentials` en la terminal, **parado en la carpeta del proyecto** (plataforma Android → ver keystore → copiar "SHA1 Fingerprint").

*¿Por qué `eas credentials` y no el comando `gradlew` que indican otras guías de internet?* Porque este proyecto es Expo "managed": no tiene carpeta `android/` con código nativo, así que `gradlew` no existe acá. El certificado de firma lo administra EAS en la nube, y ese comando es la forma de consultarlo.

### 4b. Client ID de Web

Mismo menú → tipo **"Aplicación web"** → en "URIs de redireccionamiento autorizados" agregar:

```
https://auth.expo.io/@tu-usuario-expo/titulos-app
```

(reemplazando `tu-usuario-expo` por tu usuario de Expo, el mismo que anotaste en el Paso 1 de la Guía 04).

*¿Por qué hace falta uno "web" si la app corre en un celular?* Porque la librería de login (`expo-auth-session`) usa internamente ese Client ID web durante el intercambio del código de autorización. Sin él, el login falla incluso en Android. Es una rareza del flujo de Expo, no un error.

---

## Paso 5 — Pegar los Client IDs en el código

Archivo: `services/auth.service.ts`. Reemplazar los placeholders:

```typescript
const GOOGLE_CLIENT_ID_ANDROID = '123456789-xxxxx.apps.googleusercontent.com'; // el real de Android
const GOOGLE_CLIENT_ID_IOS     = 'TU_IOS_CLIENT_ID.apps.googleusercontent.com'; // se deja así (iPhone descartado)
const GOOGLE_CLIENT_ID_WEB     = '123456789-zzzzz.apps.googleusercontent.com'; // el real de Web
```

**Ojo:** con esto el código ya está listo, pero el `.apk` que instalaste en la Guía 04 **no se entera** — el teléfono solo conoce lo que se horneó dentro del paquete. Recompilar e instalar la versión final es exactamente la Guía 06.

---

## Paso 6 — Agregar los usuarios de prueba (testers)

Pantalla de consentimiento → sección **"Usuarios de prueba"** → **"+ ADD USERS"** → agregar los emails de los operadores que van a usar la app.

*¿Por qué?* Mientras la app no esté "publicada" oficialmente ante Google (innecesario para uso interno), **solo pueden loguearse los emails de esta lista**. Cualquier otro recibe el error `access_denied`. Si algún operador ve ese error, lo primero a revisar es si su email está acá.

---

## Costos

Todo gratuito: Google Cloud tiene nivel gratis de sobra para este uso, la Sheets API permite 300 solicitudes por minuto sin cargo, y el OCR (ML Kit) es gratis, sin límite y funciona offline.

---

**Siguiente paso → Guía 06: recompilar, instalar la versión final y verificar la puesta en producción.**
