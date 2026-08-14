# Guía 01 — Cómo funciona la app (conceptos base)

> **Camino completo:** Guía 01 (entender) → Guía 02 (probar en demo) → Guía 03 (entender el build y Google) → Guía 04 (instalar el APK) → Guía 05 (credenciales de Google) → Guía 06 (producción). **Estás en la primera.**

Guía de referencia para alguien que no maneja habitualmente este stack (Node, npm, Expo). Leela primero y volvé a ella cada vez que un término no te cierre.

---

## 1. Qué hace la app, en una frase

Le saca una foto a un título físico, lee los datos del titulante con OCR (reconocimiento de texto), y los guarda en una hoja de Google Sheets (un Excel en la nube, en el Drive del operador). Nada más que eso — todo lo demás es la maquinaria necesaria para que eso funcione.

---

## 2. Las 4 capas del proyecto

Cada capa se apoya en la de abajo. Solo la de arriba es código escrito para este proyecto — las otras tres son herramientas genéricas.

```
┌─────────────────────────────────────────────┐
│ 4. titulos-app (tu código)                   │  ← lo único "tuyo"
│    cámara, OCR, guardado en Sheets           │
└─────────────────────────────────────────────┘
                    ▲
┌─────────────────────────────────────────────┐
│ 3. Expo                                      │
│    arranca la app y te deja probarla         │  ┐
└─────────────────────────────────────────────┘  │
                    ▲                             │  se instala
┌─────────────────────────────────────────────┐  │  una sola vez
│ 2. Dependencias                              │  │
│    piezas ya hechas por otros                │  │
│    (React, lector OCR, conector Sheets, etc) │  │
└─────────────────────────────────────────────┘  │
                    ▲                             │
┌─────────────────────────────────────────────┐  │
│ 1. Node.js + npm                             │  ┘
│    el "instalador" que baja y organiza todo  │
└─────────────────────────────────────────────┘
```

**Capa 1 — Node.js + npm.** Node es lo que permite que la computadora ejecute código JavaScript fuera del navegador. npm es su gestor de paquetes: como una tienda de aplicaciones, pero para piezas de código. Viene incluido con Node — no se instala aparte.

**Capa 2 — Dependencias.** Piezas de código ya hechas por otra gente: el motor de cámara, el lector de OCR, el conector con Google. Se usan como una calculadora: no necesitás saber cómo suma por dentro para apretar el botón. Están listadas en `package.json` y se descargan a la carpeta `node_modules` (por eso esa carpeta pesa tanto).

**Capa 3 — Expo.** La herramienta que agarra el código y lo "prende": levanta un servidor local, genera un código QR, y permite ver la app en el navegador o en el celular sin publicarla en ninguna tienda. **Expo Go** es la app-visor que se instala en el celular para escanear ese QR — no es la app final, es solo el visor de pruebas.

**Capa 4 — titulos-app.** El trabajo específico de este proyecto: la pantalla de cámara, la lógica que interpreta el OCR, la búsqueda/edición por DNI, y el guardado en la planilla.

---

## 3. Los dos modos de la app

Esto es clave para todo lo que viene:

| | Modo Demo | Modo producción |
|---|---|---|
| ¿Necesita cuenta de Google? | No | Sí (login real) |
| ¿Dónde guarda los datos? | En la memoria del celular, se pierden al cerrar | En la planilla "Títulos Secundario" del Drive del operador |
| ¿Qué necesita configurado? | Nada | Credenciales de Google (Guía 05) |
| ¿Para qué sirve? | Probar y aprender sin riesgo | Uso real y diario |

Hasta completar la Guía 05, **solo funciona el Modo Demo**. Está bien que sea así: permite probar todo el circuito sin tocar nada delicado.

---

## 4. Regla de oro de la terminal: pararse en la carpeta correcta

El error más común de todo este proceso (nos pasó en la práctica) es correr comandos parados en la carpeta equivocada. La terminal ejecuta los comandos **en la carpeta donde está parada**, y si es la equivocada, npm instala cosas en cualquier lado o Expo no encuentra el proyecto.

**Antes de cualquier comando, mirá el prompt.** Tiene que decir:

```
PS C:\REPOSITORIO\ANTIGRAVITY\titulos-app>
```

Si dice otra cosa (por ejemplo `PS C:\Users\behri>`), primero ejecutá:

```powershell
cd "C:\REPOSITORIO\ANTIGRAVITY\titulos-app"
```

> Nota: la copia en `C:\Users\behri\Desktop\Cowork\titulos-cecilia` es solo un backup de referencia — no se edita ni se corre desde ahí. El proyecto "vivo" es el de `C:\REPOSITORIO\ANTIGRAVITY\titulos-app`.

---

## 5. Cómo distinguir un resultado sano de un error real

Ejemplo de un `npm install` que salió **bien**:

```
added 860 packages, and audited 861 packages in 45s
16 moderate severity vulnerabilities
npm notice New major version of npm available!
```

- `added X packages` → lo importante: instaló todo.
- `X vulnerabilities` → normal, casi todo proyecto JavaScript lo muestra. No requiere acción.
- `npm notice New major version...` → solo avisa que existe un npm más nuevo. Se ignora.

Un **error real** se ve distinto: aparece en rojo, dice `npm error` (o `npm ERR!`), y corta la instalación antes de terminar. En ese caso: copiar el texto exacto del error y revisarlo — no reintentar a ciegas.

**Caso especial que sí o sí vas a ver:** si corrés `npm install` a secas en este proyecto, falla con `ERESOLVE could not resolve` (un conflicto conocido entre versiones de React y Expo). No es un problema del proyecto: la instalación correcta es siempre

```powershell
npm install --legacy-peer-deps
```

El flag le dice a npm que tolere ese conflicto de versiones, que en la práctica no rompe nada.

---

## 6. Estado del proyecto

- `npx tsc --noEmit` → 0 errores de tipos.
- `npm test` → 24/24 tests pasan.
- Barra de pestañas corregida: ya no se superpone con los botones de navegación de Android (usa "safe area insets").
- **Pendiente para producción:** en `services/auth.service.ts` los Client ID de Google siguen con placeholders (`TU_ANDROID_CLIENT_ID`, etc.). Se completan en la Guía 05.

---

## 7. Glosario rápido

| Término | Qué es |
|---|---|
| **Node.js** | El programa base que ejecuta JavaScript fuera del navegador. |
| **npm** | El gestor de paquetes de Node — instala las dependencias. |
| **Dependencia** | Código ya hecho por otros que el proyecto usa (vive en `node_modules`). |
| **`package.json`** | La lista de dependencias del proyecto. |
| **`node_modules`** | La carpeta donde se descargan las dependencias (no se edita a mano). |
| **Expo** | Herramienta que arranca y prueba apps de React Native fácilmente. |
| **Expo Go** | App-visor para el celular, usada solo durante el desarrollo. |
| **React Native** | El framework de la app (un solo código para Android e iOS). |
| **OCR** | Reconocimiento óptico de caracteres — lee texto dentro de una foto. |
| **APK** | El instalador de una app Android (lo que se genera en la Guía 04). |
| **EAS** | El servicio en la nube de Expo que compila el APK (Guía 03 lo explica). |
| **Client ID** | El "documento de identidad" de la app ante Google (Guías 03 y 05). |

---

**Siguiente paso → Guía 02: probar la app en Modo Demo.**
