# Guía 04 — Compilar e instalar el APK en Android

> **Camino completo:** Guía 01 → Guía 02 → Guía 03 → **Guía 04 (instalar el APK)** → Guía 05 (credenciales) → Guía 06 (producción).
> **Requisito previo:** haber leído la Guía 03 (qué es un build, qué es el keystore). Decisión tomada: se descarta iPhone por ahora (requiere cuenta paga de Apple Developer); se instala en **Android**.

---

## Los dos caminos posibles (repaso)

| | Camino A — Modo prueba | Camino B — App instalada |
|---|---|---|
| ¿Qué es? | Ver la app vía Expo Go escaneando un QR | Un `.apk` real, instalado como cualquier app |
| ¿Depende de la PC? | Sí, tiene que estar prendida con `expo start` | No, una vez instalada funciona sola |
| ¿Para qué sirve? | Ir probando mientras se desarrolla | Uso real y diario del personal |
| Costo en Android | Gratis | Gratis |

El Camino A ya lo probaste en la Guía 02. Esta guía es el **Camino B**: la instalación real.

Bonus del Camino B: el OCR real (ML Kit) **no funciona dentro de Expo Go** — necesita una app compilada. Recién con el `.apk` instalado vas a poder probar el escaneo de títulos de verdad.

---

## Paso a paso

La app ya está lista de este lado: `app.json` ya tiene el nombre de paquete (`com.edu.titulosapp`), ícono y permisos. No hay que tocar nada ahí.

**Todos los comandos se ejecutan parado en `C:\REPOSITORIO\ANTIGRAVITY\titulos-app`** (regla de oro de la Guía 01).

### Paso 1 — Crear cuenta gratuita en Expo

Entrar a `https://expo.dev` y registrarse.

*¿Para qué?* EAS Build es un servicio en la nube de Expo, distinto de tu cuenta de Google. Necesita saber quién sos para guardar tus builds. Gratis hasta cierta cantidad de builds por mes, de sobra para este proyecto.

**Anotá tu nombre de usuario de Expo** — lo vas a necesitar en la Guía 05 (para el URI de redireccionamiento).

### Paso 2 — Instalar la herramienta de línea de comandos

```powershell
npm install -g eas-cli
```

*¿Para qué?* `eas-cli` es una herramienta distinta de `expo`. Mientras `expo start` prende un servidor en tu propia máquina, `eas` le habla a los servidores de Expo para pedirles "compilame esto en la nube". Se instala una sola vez (el `-g` es "global": queda disponible para siempre, no solo en este proyecto — es el único comando de todas las guías donde la carpeta no importa).

### Paso 3 — Loguearse desde la terminal

```powershell
eas login
```

*¿Para qué?* Conecta tu terminal con la cuenta del Paso 1, para que Expo sepa a nombre de quién compilar y dónde guardar el resultado.

### Paso 4 — Configurar el proyecto

```powershell
eas build:configure
```

*¿Para qué?* Un asistente que crea el archivo `eas.json` (las instrucciones de cómo armar el build) y vincula esta carpeta con un proyecto dentro de tu cuenta de Expo (le asigna un ID único).

### Paso 5 — Lanzar el build en modo "preview"

```powershell
eas build --platform android --profile preview
```

*¿Por qué "preview" y no "production"?* `production` genera un `.aab`, pensado exclusivamente para subir a la Google Play Store — no se puede instalar directo en un celular. `preview` genera un `.apk`, un instalador directo, ideal para uso interno sin pasar por ninguna tienda.

**Cuando pregunte si Expo puede generar y administrar el certificado de firma (keystore) por vos: responder que sí.** (La Guía 03 explica qué es; de ese keystore va a salir el SHA-1 que pide Google en la Guía 05.)

### Paso 6 — Esperar

El build se arma en los servidores de Expo, no en tu computadora — podés cerrar la terminal tranquilamente. Tarda entre 10 y 20 minutos. Se puede seguir el progreso ahí mismo o entrando a `expo.dev` con tu cuenta.

### Paso 7 — Descargar el .apk

Al terminar, Expo da un link (y un QR) para descargar el `.apk`. Pasalo al teléfono por el medio más cómodo: email, Google Drive, cable USB — o escaneando el QR directamente desde el celular.

### Paso 8 — Instalarlo

Abrir el `.apk` desde el teléfono. Es probable que Android pida habilitar "Instalar apps de orígenes desconocidos" esa primera vez — es normal, no es un virus: es solo porque no vino de Play Store.

### Paso 9 — Abrirla

Queda instalada como cualquier otra app, con su ícono. No necesita la PC, ni Expo Go, ni nada corriendo en segundo plano.

---

## Salvedad importante

Esta instalación ya prueba el Camino B de punta a punta (compilación, instalación, uso standalone). Pero **dentro de esta app instalada, el único botón que funciona todavía es el de Modo Demo**: para que guarde datos reales en Google Sheets falta el trámite de credenciales (Guía 05) y una segunda compilación (Guía 06).

---

**Siguiente paso → Guía 05: tramitar las credenciales de Google.**
