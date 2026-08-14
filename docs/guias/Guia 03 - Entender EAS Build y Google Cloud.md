# Guía 03 — Entender EAS Build y Google Cloud (antes de hacerlos)

> **Camino completo:** Guía 01 → Guía 02 → **Guía 03 (entender el build y Google)** → Guía 04 (instalar el APK) → Guía 05 (credenciales) → Guía 06 (producción).

Las Guías 04 y 05 dicen *cómo* hacer cada cosa, paso a paso. Esta explica *qué son* esas dos cosas y por qué existen — para entenderlas antes de hacerlas. No hay nada que ejecutar acá: es solo lectura.

---

## Parte 1: El build de EAS

### ¿Qué significa "compilar" o "hacer un build"?

El código del proyecto son archivos de texto: `.tsx`, `.ts`, `.json`. Un teléfono Android **no puede ejecutar archivos de texto** — necesita un paquete armado en su formato: un archivo `.apk` (Android Package). Es la diferencia entre la receta de una torta y la torta: el celular no come recetas.

**Compilar (hacer un "build")** es exactamente eso: agarrar todos los archivos de texto + las dependencias de `node_modules` + los íconos e imágenes, y "hornear" todo junto en un único `.apk` instalable.

### ¿Y por qué no compila mi propia computadora?

Podría, pero necesitaría el kit completo de desarrollo de Android (Android Studio, SDKs, Java) — varios gigas de herramientas y configuración delicada. Acá entra **EAS** (Expo Application Services): en vez de armar todo eso en tu PC, le mandás el código a los servidores de Expo y **ellos lo compilan por vos en la nube**.

```
Tu PC                      Servidores de Expo              Teléfono
─────────                  ──────────────────              ─────────
código fuente  ──envía──►  compilan (10-20 min)  ──.apk──► se instala
(.tsx, .json)              y firman el paquete             y funciona solo
```

Tu PC solo hace de cartero: manda el código y recibe el link de descarga. Por eso podés cerrar la terminal mientras se arma — el trabajo pesado pasa allá.

### ¿Qué es la "firma" y el "keystore"?

Android exige que todo `.apk` venga **firmado digitalmente**: un sello criptográfico que identifica quién lo hizo, para que nadie pueda hacerse pasar por tu app con una versión trucha. Esa firma se hace con un archivo llamado **keystore** (almacén de claves).

Cuando en el primer build EAS pregunte "¿querés que genere y administre el keystore por vos?", respondé que **sí**: Expo crea ese sello y lo guarda en tu cuenta. Dato clave: **de ese keystore sale la "huella SHA-1"** que después pide Google — por eso el build (Guía 04) va primero y el trámite de Google (Guía 05) después.

### ¿Qué papel juega git/GitHub en todo esto?

Ninguno directo. GitHub guarda y versiona tu código (una caja fuerte con historial); EAS lo compila. Son servicios distintos para cosas distintas. EAS toma el código de tu carpeta local, no de GitHub. GitHub tampoco "sirve" la app a los teléfonos — no es un servidor de ejecución.

---

## Parte 2: El trámite de Google Cloud

### ¿Cuál es el problema que resuelve?

La app necesita **escribir en una planilla del Drive del operador**. Pero Google no puede dejar que cualquier programa ande tocando los archivos de la gente — sería un desastre de seguridad. Entonces exige dos cosas:

1. Que la **app esté identificada** ante Google ("soy Gestión de Títulos, hecha por tal persona").
2. Que el **usuario dé permiso explícito** ("autorizo a esta app a tocar mis planillas — y solo mis planillas").

Ese sistema de identificación + permiso se llama **OAuth 2.0**, y es el mismo que usás cuando cualquier página te dice "Continuar con Google".

### ¿Qué es Google Cloud Console?

La ventanilla de trámites de Google para desarrolladores: `console.cloud.google.com`. Ahí registrás tu app y obtenés sus "documentos de identidad". No hay que programar nada — es todo con clics, como un trámite online.

### ¿Qué es un Client ID?

El **número de documento de tu app**: un código largo tipo `123456789-xxxxx.apps.googleusercontent.com` que la identifica ante Google. Cuando el operador toca "Iniciar sesión con Google", la app le muestra ese documento a Google, y Google responde: "ok, conozco a esta app, le pregunto al usuario si autoriza".

¿Por qué hacen falta **dos** (Android y Web)?

- El de **Android** identifica al `.apk` concreto: combina el nombre del paquete (`com.edu.titulosapp`) con la huella SHA-1 del keystore. Ni siquiera una copia del código compilada por otra persona podría hacerse pasar por tu app — la firma no coincidiría.
- El de **Web** lo usa internamente la librería de login de Expo durante el intercambio de códigos. Es una particularidad técnica del flujo — sin él, el login falla aunque el de Android esté perfecto.

### ¿Qué recibe la app cuando el login sale bien?

Un **access token**: una llave temporal que Google le entrega. Con esa llave, la app puede leer y escribir la planilla "Títulos Secundario" — y nada más (los permisos pedidos son solo Sheets y archivos creados por la propia app, no todo el Drive). La llave se guarda cifrada en el teléfono (SecureStore) para no tener que loguearse cada vez.

### ¿Dónde queda la planilla?

En el **Drive de la cuenta con la que el operador inicia sesión**. La primera vez, la app busca en ese Drive un archivo llamado "Títulos Secundario"; si no existe, lo crea automáticamente en la raíz de "Mi unidad", con los encabezados ya formateados. No está en el celular ni en la PC — está en la nube de Google, de esa cuenta.

---

## Parte 3: Cómo encaja todo — la hoja de ruta

```
1. eas build            → Expo compila y crea el keystore (con su SHA-1)   [Guía 04]
        ↓
2. eas credentials      → consultás el SHA-1 de ese keystore              [Guía 05]
        ↓
3. Google Cloud         → creás los Client IDs (el de Android usa ese SHA-1) [Guía 05]
        ↓
4. auth.service.ts      → pegás los Client IDs en el código               [Guía 05]
        ↓
5. eas build (de nuevo) → recompilás para que el .apk lleve los IDs reales [Guía 06]
        ↓
6. Instalás el .apk     → login real con Google → guarda en Sheets real   [Guía 06]
```

El paso 5 sorprende a muchos: hay que compilar **dos veces**. La primera crea el keystore (necesario para el trámite); la segunda mete los Client IDs ya obtenidos dentro del `.apk`. El teléfono no se entera de cambios en tu PC — solo conoce lo que se horneó dentro del paquete que instalaste.

---

## Resumen en dos frases

**EAS Build** = la panadería en la nube de Expo que convierte tu receta (código) en la torta (`.apk`) que el teléfono puede consumir. **Google Cloud** = la ventanilla donde tramitás el documento de identidad (Client ID) que tu app le muestra a Google para que la deje escribir en las planillas del operador.

---

**Siguiente paso → Guía 04: compilar e instalar el APK en un teléfono Android.**
