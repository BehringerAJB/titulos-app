# Guía 02 — Probar la app en Modo Demo

> **Camino completo:** Guía 01 (entender) → **Guía 02 (probar en demo)** → Guía 03 → Guía 04 → Guía 05 → Guía 06 (producción).
> **Requisito previo:** haber leído la Guía 01 (en especial la "regla de oro" de la carpeta correcta).

Esto es lo mínimo para ver la app funcionando, sin cuenta de Google y sin configurar nada. Cada paso tiene su porqué.

---

## Paso 1 — Abrir la carpeta en VS Code

`File > Open Folder...` → `C:\REPOSITORIO\ANTIGRAVITY\titulos-app`

*¿Para qué?* VS Code necesita saber en qué carpeta estás parado para mostrarte los archivos correctos y, más importante, para que la terminal que abras después arranque **ya ubicada dentro del proyecto**.

---

## Paso 2 — Abrir la terminal integrada

`Terminal > New Terminal` (o `Ctrl + ñ`).

*¿Para qué?* Es una consola de comandos como el CMD de Windows, pero ubicada automáticamente dentro de la carpeta del proyecto. Todo lo que sigue se escribe ahí.

**Control obligatorio antes de seguir:** el prompt tiene que decir
`PS C:\REPOSITORIO\ANTIGRAVITY\titulos-app>`.
Si dice otra cosa (por ejemplo `PS C:\Users\behri>`), ejecutá primero:

```powershell
cd "C:\REPOSITORIO\ANTIGRAVITY\titulos-app"
```

Este control hay que repetirlo **cada vez que abras una terminal nueva**. Es el error número 1 de todo el proceso.

---

## Paso 3 — Instalar las dependencias (solo la primera vez)

```powershell
npm install --legacy-peer-deps
```

*¿Para qué?* Descarga todas las piezas de código que el proyecto necesita (capas 1 y 2 de la Guía 01) a la carpeta `node_modules`.

*¿Por qué el flag `--legacy-peer-deps`?* Sin él, la instalación **falla** con un error `ERESOLVE` — es un conflicto conocido entre versiones de React y Expo, no un problema del proyecto. El flag le dice a npm que lo tolere.

Solo hace falta repetir este paso si la carpeta `node_modules` no existe o si algo se rompió.

---

## Paso 4 — Levantar el servidor

```powershell
npx expo start
```

*¿Para qué?* Prende un servidor local en tu computadora — un programa que queda corriendo y "sirve" la app, como si tu compu fuera por un rato un mini sitio web privado. `npx` le dice a npm "ejecutá esta herramienta" (Expo). Sin este servidor corriendo, no hay nada que ver ni en el navegador ni en el celular.

**Señal de que está bien:** aparece un código QR grande y un menú de opciones. Si en cambio dice `ConfigError: Cannot determine the project's Expo SDK version`, estás parado en la carpeta equivocada — volvé al control del Paso 2.

---

## Paso 5 — Ver la app

**Opción A — En el navegador (la más fácil):** con el servidor corriendo, apretá la tecla `w` en la terminal. Se abre sola una pestaña en `localhost` con la app funcionando.

**Opción B — En el celular (la experiencia real):**

1. Instalar **Expo Go** desde Play Store (Android) o App Store (iPhone). Gratis.
2. Conectar el celular **a la misma red Wi-Fi que la PC** (requisito indispensable).
3. Escanear el QR de la terminal: en Android desde la propia app Expo Go; en iPhone con la cámara nativa.

---

## Paso 6 — Tocar "Probar en Modo Demo"

El botón dorado de la pantalla de login.

*¿Para qué?* La app normalmente espera una cuenta de Google para guardar datos reales. Como todavía no están cargadas esas credenciales (eso es la Guía 05), este botón activa un modo que simula todo con 3 alumnos de prueba precargados en memoria. Los datos **no se guardan en ningún lado**: al recargar la app, vuelven los 3 registros originales. Es a propósito.

Qué probar: el dashboard con estadísticas, "Nuevo Título" (cámara → formulario), "Buscar / Editar" por DNI (probá con `30123456`), y el botón 🚪 Salir.

---

## Extra — Correr los tests automáticos

```powershell
npm test
```

Debería mostrar **24 tests en verde**. Verifican que las funciones clave (limpieza de DNI, detección de serie del título) no se rompan si alguien modifica el código.

---

## Para cortar el servidor

`Ctrl + C` en la terminal.

## Si algo tira error

Copiar el texto exacto que aparece en rojo y revisarlo antes de seguir — no reintentar a ciegas. La sección 5 de la Guía 01 explica cómo distinguir un error real de un aviso inofensivo.

---

**Siguiente paso → Guía 03: entender qué son EAS Build y Google Cloud antes de hacer los trámites.**
