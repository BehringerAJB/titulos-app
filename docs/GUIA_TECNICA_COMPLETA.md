# Guía Completa de la Aplicación
## App de Gestión de Títulos — Secundario de Adultos

> Este documento explica **qué es cada tecnología utilizada, para qué sirve y por qué se eligió**.
> Está escrito para alguien que quiere entender el proyecto desde cero.

---

## Índice

1. [¿Qué es esta aplicación?](#1-qué-es-esta-aplicación)
2. [¿Por qué React Native y no una app web?](#2-por-qué-react-native-y-no-una-app-web)
3. [¿Qué es Expo?](#3-qué-es-expo)
4. [¿Qué es TypeScript?](#4-qué-es-typescript)
5. [¿Cómo funciona la navegación? (Expo Router)](#5-cómo-funciona-la-navegación-expo-router)
6. [¿Cómo funciona el login? (OAuth 2.0 + Google)](#6-cómo-funciona-el-login-oauth-20--google)
7. [¿Dónde se guardan los datos del login? (SecureStore)](#7-dónde-se-guardan-los-datos-del-login-securestore)
8. [¿Qué es el AuthContext y para qué sirve?](#8-qué-es-el-authcontext-y-para-qué-sirve)
9. [¿Cómo funciona el OCR?](#9-cómo-funciona-el-ocr)
10. [¿Por qué Google Sheets como base de datos?](#10-por-qué-google-sheets-como-base-de-datos)
11. [¿Qué es la Google Sheets API?](#11-qué-es-la-google-sheets-api)
12. [¿Qué es Axios y por qué se usa?](#12-qué-es-axios-y-por-qué-se-usa)
13. [¿Qué es el Modo Demo y cómo funciona?](#13-qué-es-el-modo-demo-y-cómo-funciona)
14. [Los Servicios (services/)](#14-los-servicios-services)
15. [Los Utilitarios (utils/)](#15-los-utilitarios-utils)
16. [Los Tipos de Datos (types/)](#16-los-tipos-de-datos-types)
17. [Los Colores (constants/Colors.ts)](#17-los-colores-constantscolorsts)
18. [Las pantallas (app/)](#18-las-pantallas-app)
19. [Los Tests Unitarios](#19-los-tests-unitarios)
20. [El archivo app.json](#20-el-archivo-appjson)
21. [El archivo package.json](#21-el-archivo-packagejson)
22. [Resumen visual de toda la arquitectura](#22-resumen-visual-de-toda-la-arquitectura)

---

## 1. ¿Qué es esta aplicación?

Es una **aplicación móvil** para el personal de una institución educativa de nivel secundario de adultos. Su función es reemplazar el proceso manual de registrar títulos académicos en papel o en Excel.

**El problema que resuelve:**
- Antes: el operador recibía un título físico, lo anotaba a mano en un cuaderno o planilla.
- Ahora: toma una foto del título, la app lee los datos automáticamente y los guarda en una hoja de cálculo de Google Drive.

**Flujo completo:**
```
📄 Título físico en papel
    ↓
📷 El operador lo fotografía con el celular
    ↓
🤖 La app lee el texto de la foto (OCR)
    ↓
✏️ El operador confirma o corrige los datos
    ↓
💾 Los datos se guardan en Google Sheets (Drive institucional)
    ↓
✅ El título queda registrado en el sistema
```

---

## 2. ¿Por qué React Native y no una app web?

**React Native** es un framework que permite crear apps para celulares usando JavaScript/TypeScript.

**¿Por qué no hicimos simplemente una página web?**

| Característica | Página web | React Native |
|----------------|-----------|-------------|
| Acceso a la cámara del celular | ❌ Muy limitado | ✅ Acceso nativo completo |
| Funciona sin internet (offline) | ❌ No | ✅ Parcialmente (OCR offline) |
| Se instala en el celular | ❌ No | ✅ Sí |
| Se ve como app nativa | ❌ No | ✅ Sí |
| Un código para Android e iOS | ✅ Sí | ✅ Sí |

La razón principal es la **cámara**. Necesitábamos acceso nativo a la cámara para fotografiar títulos con buena calidad y procesar las imágenes con OCR. Una página web en el navegador tiene acceso muy restringido a la cámara del teléfono.

---

## 3. ¿Qué es Expo?

**Expo** es una capa de herramientas que va por encima de React Native y lo hace mucho más simple de usar.

**Analogía:** Si React Native es el motor de un auto, Expo es el tablero de control con todos los botones ya conectados. Sin Expo, tendrías que conectar cada cable manualmente.

**¿Qué nos da Expo concretamente?**

- `expo-camera` → Acceso a la cámara sin configurar nada en Android ni iOS
- `expo-secure-store` → Almacenamiento cifrado para guardar tokens
- `expo-auth-session` → Manejo del flujo de login con Google
- `expo-splash-screen` → La pantalla de carga inicial con el logo
- `expo-font` → Cargar fuentes personalizadas
- `expo-router` → Sistema de navegación entre pantallas

**¿Por qué Expo SDK 54 específicamente?**
Es la versión estable más reciente al momento de crear el proyecto. Cada versión de Expo es compatible con versiones específicas de todas las librerías, por eso es importante no mezclar versiones.

---

## 4. ¿Qué es TypeScript?

**TypeScript** es JavaScript con un sistema de tipos. Quiere decir que cuando escribís código, le aclarás qué tipo de dato va a contener cada variable.

**Sin TypeScript (JavaScript normal):**
```javascript
// Esto puede fallar en producción y no te avisa antes
function guardar(registro) {
  console.log(registro.dni);  // ¿Y si registro es undefined?
}
```

**Con TypeScript:**
```typescript
// Esto falla en el momento en que lo escribís, antes de que la app corra
function guardar(registro: TituloRecord) {
  console.log(registro.dni);  // TypeScript garantiza que esto existe
}
```

**¿Por qué se usa acá?**
Porque la app maneja datos de personas (DNI, nombres, fechas). Un error en producción podría guardar datos incorrectos. TypeScript atrapa esos errores mientras escribís el código, no cuando ya el operador lo está usando.

---

## 5. ¿Cómo funciona la navegación? (Expo Router)

**Expo Router** usa un sistema de navegación basado en archivos. Esto significa que la estructura de carpetas **define** las pantallas y rutas de la app.

```
app/
├── _layout.tsx        → Es el "envoltorio" de toda la app
├── login.tsx          → Pantalla accesible en la ruta /login
└── (tabs)/
    ├── _layout.tsx    → Define las pestañas inferiores
    ├── index.tsx      → Pantalla principal (ruta: /)
    ├── nuevo.tsx      → Ruta: /nuevo
    └── buscar.tsx     → Ruta: /buscar
```

**¿Por qué la carpeta se llama `(tabs)` con paréntesis?**
Es una convención de Expo Router. Los paréntesis indican que esa carpeta es un **grupo de rutas** que comparten un tipo de navegación (en este caso, pestañas), pero el nombre `(tabs)` no aparece en la URL. Entonces la ruta es `/nuevo` y no `/(tabs)/nuevo`.

**¿Qué hace `_layout.tsx`?**
Es el archivo que define cómo se organizan las pantallas dentro de esa carpeta. Es como el "marco" que rodea a las demás pantallas.

- El `_layout.tsx` raíz (en `app/`) define que hay dos rutas posibles: `login` y `(tabs)`.
- El `_layout.tsx` dentro de `(tabs)/` define las tres pestañas: Inicio, Nuevo Título, Buscar.

---

## 6. ¿Cómo funciona el login? (OAuth 2.0 + Google)

**OAuth 2.0** es un estándar de seguridad que permite que una app acceda a datos de Google en nombre del usuario, **sin que el usuario le dé su contraseña de Google a la app**.

**¿Cómo funciona paso a paso?**

```
1. El operador toca "Iniciar sesión con Google"
          ↓
2. La app abre el navegador del sistema (Chrome, Safari)
          ↓
3. El navegador va a: accounts.google.com
          ↓
4. El operador ingresa su usuario y contraseña de Google
   (la app NUNCA ve esto, lo hace Google directamente)
          ↓
5. Google dice: "¿Autorizás a esta app a acceder a tus Sheets?"
          ↓
6. El operador toca "Permitir"
          ↓
7. Google devuelve un "código de autorización" a la app
          ↓
8. La app intercambia ese código por un "access_token"
          ↓
9. Con ese access_token, la app puede leer y escribir
   en Google Sheets del operador
```

**¿Qué es un `access_token`?**
Es como una llave temporal que Google entrega. Con esa llave la app puede acceder a los Sheets. Si la llave vence o el usuario la revoca, la app pierde el acceso.

**Librerías que lo hacen posible:**
- `expo-auth-session` → Maneja todo el flujo descrito arriba
- `expo-web-browser` → Abre el navegador para que Google haga el login
- `axios` → Intercambia el código por el access_token

---

## 7. ¿Dónde se guardan los datos del login? (SecureStore)

Después de que el operador inicia sesión, la app guarda el `access_token` en el dispositivo para que no tenga que loguearse cada vez que abre la app.

**`expo-secure-store`** guarda datos de forma cifrada en el chip de seguridad del dispositivo (en Android usa el Android Keystore, en iOS usa el Secure Enclave). Es equivalente a un cofre con candado dentro del teléfono.

**¿Qué se guarda?**

| Clave | Contenido |
|-------|-----------|
| `TITULOS_ACCESS_TOKEN` | El token de acceso a Google |
| `TITULOS_USER_EMAIL` | El email del operador logueado |
| `TITULOS_SPREADSHEET_ID` | El ID del archivo de Google Sheets vinculado |

**¿Por qué no se usa `AsyncStorage` (el almacenamiento normal)?**
Porque `AsyncStorage` guarda datos en texto plano. Cualquier persona con acceso al sistema de archivos del teléfono podría leer el token. `SecureStore` los cifra con AES y protege con biometría si el dispositivo lo soporta.

---

## 8. ¿Qué es el AuthContext y para qué sirve?

**React Context** es un mecanismo de React para compartir datos entre pantallas sin tener que pasarlos manualmente de una a otra.

**El problema que resuelve:**
Imaginá que el `access_token` del usuario lo tiene la pantalla de Login. Para usarlo en el Dashboard, en Nuevo Título y en Buscar, tendrías que "pasarlo" de pantalla en pantalla. Con 3 niveles de profundidad eso se vuelve un desastre.

```
SIN Context (problemático):
Login → le pasa el token a → Dashboard → le pasa el token a → Nuevo Título
                                       ↘ le pasa el token a → Buscar

CON Context (limpio):
AuthContext (disponible en TODA la app)
    ↕              ↕              ↕
 Dashboard    Nuevo Título     Buscar
(cada uno lee el token directamente del contexto)
```

**¿Cómo funciona en la práctica?**

El `AuthProvider` en `context/AuthContext.tsx` envuelve toda la aplicación en `app/_layout.tsx`:
```tsx
<AuthProvider>
  <RootLayoutNav />
</AuthProvider>
```

Cualquier pantalla puede acceder al estado de auth con una sola línea:
```tsx
const { authState, setAuthState } = useAuth();
```

---

## 9. ¿Cómo funciona el OCR?

**OCR** significa *Optical Character Recognition* (Reconocimiento Óptico de Caracteres). Es la tecnología que convierte una imagen con texto en texto digital que una computadora puede procesar.

**La librería usada:** `@react-native-ml-kit/text-recognition`
Es parte de **Google ML Kit**, una suite de herramientas de inteligencia artificial de Google.

**¿Por qué ML Kit y no otro servicio de OCR?**

| Característica | Google ML Kit | OCR online (ej: Google Vision API) |
|----------------|--------------|-----------------------------------|
| Necesita internet | ❌ No (offline) | ✅ Sí |
| Costo | Gratis | Se paga por uso |
| Velocidad | Rápido (local) | Depende de la red |
| Funciona en zonas sin señal | ✅ Sí | ❌ No |

La app está pensada para una institución que puede no tener buena conectividad. El OCR funciona completamente en el dispositivo, sin salir a internet.

**¿Qué hace el OCR con el texto del título?**

Después de extraer el texto, los utilitarios (`utils/`) buscan patrones específicos:

1. **DNI:** busca secuencias de 7-8 dígitos, con o sin puntos (`30.123.456` o `30123456`)
2. **Nombre:** busca la línea siguiente a "APELLIDO Y NOMBRE" o líneas en mayúsculas
3. **Fecha:** busca patrones `dd/mm/aaaa` o `dd-mm-aaaa`
4. **Calificación:** busca números decimales o palabras como "Sobresaliente"
5. **Serie:** busca "MODELO 2020", "SERIE 2014", etc. usando las reglas del archivo `config/series-patterns.json`

---

## 10. ¿Por qué Google Sheets como base de datos?

Una base de datos convencional (como MySQL o PostgreSQL) requiere un servidor propio, mantenimiento, backups, actualizaciones de seguridad y alguien que lo administre.

**Google Sheets como alternativa:**

| Aspecto | Base de datos tradicional | Google Sheets |
|---------|--------------------------|---------------|
| Costo | Servidor + hosting = $$$ | Gratis (Drive institucional) |
| Mantenimiento | Requiere técnico | Google lo hace todo |
| Backups | Manual o programado | Automático en Drive |
| Acceso para revisar datos | Requiere interfaz especial | Abrís el archivo y listo |
| Exportar a Excel | Proceso especial | Ya es Excel |
| Límite de registros | Millones | 10 millones de celdas (suficiente) |

**El factor decisivo:** El personal de la institución ya sabe usar Google Sheets. Pueden ver los datos, filtrarlos y hacer reportes sin necesitar ninguna herramienta adicional.

---

## 11. ¿Qué es la Google Sheets API?

Es una interfaz que Google ofrece para que otras aplicaciones puedan leer y escribir en Sheets desde código, sin que el usuario tenga que abrir el navegador.

**La app usa estos endpoints (puntos de acceso):**

```
GET  /v4/spreadsheets/{id}/values/{range}        → Leer celdas
POST /v4/spreadsheets/{id}/values/{range}:append → Agregar fila al final
PUT  /v4/spreadsheets/{id}/values/{range}        → Actualizar una fila específica
```

**¿Cómo se estructura la hoja de cálculo?**

Cada fila es un título académico. Las columnas son:

| Col | Campo | Ejemplo |
|-----|-------|---------|
| A | DNI (clave primaria) | 30123456 |
| B | Apellido y Nombre | GARCÍA, JUAN CARLOS |
| C | Fecha de Emisión | 15/03/2023 |
| D | Calificación Final | 8.50 |
| E | Serie / Modelo | MODELO 2020 |
| F | ¿Retirado? | Sí / No |
| G | Fecha de Retiro | 20/06/2026 |
| H | Quién Retiró | GARCÍA, JUAN CARLOS |
| I | ¿Remitido a La Plata? | Sí / No |
| J | Fecha de Envío | 01/07/2026 |
| K | Fecha de Devolución | 15/07/2026 |
| L | Fecha de Captura | 04/07/2026 10:30 |
| M | Última Modificación | 04/07/2026 15:00 |

**¿Por qué el DNI es la "clave primaria"?**
Porque es el dato único de cada alumno. No puede haber dos filas con el mismo DNI. Cuando se busca un registro, se busca por la columna A (DNI).

---

## 12. ¿Qué es Axios y por qué se usa?

**Axios** es una librería para hacer peticiones HTTP (llamadas a internet). Es la herramienta que la app usa para comunicarse con la Google Sheets API.

**¿Por qué Axios y no el `fetch` nativo de JavaScript?**

`fetch` es la función nativa para hacer peticiones HTTP, pero tiene algunas limitaciones:

```typescript
// Con Axios: directo al punto
const res = await axios.get(url, { headers, params });
const datos = res.data; // Ya es un objeto JavaScript listo para usar

// Con fetch nativo: más pasos
const res = await fetch(url);
const datos = await res.json(); // Hay que convertirlo manualmente
if (!res.ok) throw new Error(...); // El manejo de errores tampoco es automático
```

Axios también convierte automáticamente los errores HTTP en excepciones, lo que simplifica el manejo de errores en la app.

---

## 13. ¿Qué es el Modo Demo y cómo funciona?

El **Modo Demo** es una capa de simulación que permite probar toda la funcionalidad de la app **sin necesitar internet ni una cuenta de Google configurada**.

**¿Cómo lo detecta el código?**

Cuando el operador toca "Probar en Modo Demo", el sistema guarda un token especial:
```typescript
accessToken: 'demo'
```

En cada función del servicio de Sheets, hay una verificación al inicio:
```typescript
if (accessToken === 'demo') {
  // Operamos sobre datos locales en memoria
  return datosLocales;
}
// Si llegó acá, hace la llamada real a Google
```

**Los datos de prueba pre-cargados:**

| DNI | Nombre | Estado |
|-----|--------|--------|
| 30123456 | GONZALEZ, MARÍA BELÉN | Pendiente de retiro |
| 35987654 | RODRIGUEZ, JUAN CARLOS | Retirado |
| 28456123 | PÉREZ, SILVIA SUSANA | Remitido a La Plata |

**Limitación importante:** Los cambios en Modo Demo se guardan en la memoria del teléfono mientras la app está abierta. Al cerrarla, los cambios se pierden. Eso es intencional: es solo para probar.

---

## 14. Los Servicios (services/)

Los servicios son los únicos archivos que se comunican con el "mundo exterior" (internet, sistema de almacenamiento). El resto de la app nunca llama a Google directamente, siempre pasa por un servicio.

### `auth.service.ts` — Servicio de Autenticación

**¿Qué hace?**
- Guarda y recupera el token de acceso en SecureStore
- Guarda y recupera el email del usuario
- Elimina todos los datos al cerrar sesión
- Lee el estado de auth al iniciar la app

**Funciones exportadas:**

| Función | ¿Para qué? |
|---------|-----------|
| `saveAccessToken(token)` | Guarda el token cifrado en el dispositivo |
| `getAccessToken()` | Recupera el token guardado |
| `saveUserEmail(email)` | Guarda el email del operador |
| `getUserEmail()` | Recupera el email |
| `saveSpreadsheetId(id)` | Guarda el ID del archivo de Sheets |
| `logout()` | Borra todo: token, email y spreadsheetId |
| `getAuthState()` | Devuelve todo el estado de auth junto |
| `AUTH_CONFIG` | Exporta los Client IDs y los scopes de Google |

---

### `sheets.service.ts` — Servicio de Google Sheets

**¿Qué hace?**
Es el CRUD (Create, Read, Update, Delete) de la base de datos (Google Sheets).

**Funciones exportadas:**

| Función | ¿Para qué? |
|---------|-----------|
| `findOrCreateSpreadsheet(token)` | Busca el archivo en Drive. Si no existe, lo crea con encabezados formateados |
| `findByDNI(token, id, dni)` | Busca un título por DNI. Lee la columna A y compara |
| `addRow(token, id, record)` | Agrega una nueva fila al final de la hoja |
| `updateRow(token, id, row, data)` | Actualiza una fila existente. Preserva la fecha de captura original |
| `getAllRows(token, id)` | Lee todas las filas para calcular estadísticas en el Dashboard |

---

### `ocr.service.ts` — Servicio de OCR

**¿Qué hace?**
Recibe la URI (dirección local) de una foto y devuelve los datos del título extraídos.

**Funciones exportadas:**

| Función | ¿Para qué? |
|---------|-----------|
| `processImage(imageUri)` | Corre ML Kit sobre la imagen. Si falla (web/emulador), devuelve campos vacíos para carga manual |
| `isOCRDataSufficient(data)` | Verifica si el DNI tiene al menos 7 dígitos (condición mínima para poder guardar) |

---

## 15. Los Utilitarios (utils/)

Son funciones puras: reciben datos, los procesan y devuelven un resultado. No tienen efectos secundarios (no llaman a internet, no guardan nada).

### `dni-cleaner.ts`

| Función | ¿Para qué? |
|---------|-----------|
| `cleanDNI(texto)` | Elimina todo lo que no sea dígito: `"30.123.456"` → `"30123456"` |
| `isValidDNI(dni)` | Verifica que tenga entre 7 y 8 dígitos (formato argentino) |
| `extractDNIFromText(texto)` | Busca el DNI dentro de un texto largo de OCR usando 3 estrategias |

**Estrategias de búsqueda del DNI (en orden de prioridad):**
1. Busca el patrón `XX.XXX.XXX` (con puntos — el más común en títulos)
2. Si no encuentra, busca 7-8 dígitos seguidos
3. Si no encuentra, busca precedido por "DNI:", "N°", "Documento"

### `date-formatter.ts`

| Función | ¿Para qué? |
|---------|-----------|
| `formatDate(fecha)` | Convierte objeto `Date` a `"dd/mm/aaaa"` |
| `formatDateTime(fecha)` | Convierte a `"dd/mm/aaaa HH:MM"` (para campos de auditoría) |
| `parseDate(texto)` | Convierte `"dd/mm/aaaa"` a objeto `Date` |
| `extractDateFromText(texto)` | Busca fecha dentro de texto de OCR |
| `isValidDate(texto)` | Verifica si el texto es una fecha válida |

### `series-detector.ts`

| Función | ¿Para qué? |
|---------|-----------|
| `detectSeries(texto)` | Aplica los patrones del JSON. Devuelve la etiqueta o `"DESCONOCIDO"` |
| `getAvailableSeries()` | Devuelve la lista de todas las series configuradas (para selector manual) |

**¿Por qué los patrones están en un JSON y no en el código?**

Para que el personal pueda agregar nuevos modelos de títulos **sin tocar el código**. Solo hay que editar `config/series-patterns.json`:

```json
{
  "patterns": [
    { "label": "MODELO 2020", "regex": "modelo\\s*2020", "flags": "i" },
    { "label": "SERIE 2014",  "regex": "serie\\s*2014",  "flags": "i" }
  ]
}
```

Para agregar el "MODELO 2025", simplemente se agrega una nueva línea al JSON. No hay que tocar ningún archivo `.ts`.

---

## 16. Los Tipos de Datos (types/)

**`types/index.ts`** define la "forma" de todos los objetos de datos que usa la app.

**¿Para qué sirve esto?**
Para que TypeScript pueda verificar que el código sea correcto. Si en algún lugar del código intentás acceder a `registro.nombre` pero el campo correcto es `registro.apellidoNombre`, TypeScript te avisa antes de que la app corra.

**Tipos definidos:**

| Tipo | ¿Qué representa? |
|------|-----------------|
| `TituloRecord` | Un título completo: dni, nombre, fechas, estado, etc. |
| `OCRData` | Lo que devuelve el procesamiento de imagen: dni, nombre, fecha, calificacion, serie, rawText |
| `AuthState` | El estado del usuario logueado: token, email, spreadsheetId, isDemoMode |
| `DashboardStats` | Las estadísticas del panel: total, retirados, remitidos, pendientes |
| `SheetSearchResult` | El resultado de buscar un DNI: `{ found, rowIndex, data }` |
| `SeriesPattern` | Un patrón de detección de series: `{ label, regex, flags }` |

---

## 17. Los Colores (constants/Colors.ts)

Define la **paleta de colores institucional** de toda la app. En lugar de escribir `#1A2E5A` en cada archivo, se usa `Colors.primary`.

**Ventaja:** Si el día de mañana cambia el color institucional, solo se modifica un archivo y cambia en toda la app.

| Constante | Hex | Uso |
|-----------|-----|-----|
| `Colors.primary` | `#1A2E5A` | Azul marino — fondos principales, botones |
| `Colors.accent` | `#C8A951` | Dorado — botones secundarios, íconos destacados |
| `Colors.background` | `#F4F6FA` | Gris muy claro — fondo de pantallas |
| `Colors.surface` | `#FFFFFF` | Blanco — fondo de tarjetas |
| `Colors.success` | `#2ECC71` | Verde — estado "Retirado" |
| `Colors.warning` | `#F39C12` | Naranja — estado "Pendiente" |
| `Colors.info` | `#3498DB` | Azul claro — estado "En La Plata" |
| `Colors.error` | `#E74C3C` | Rojo — errores |

---

## 18. Las pantallas (app/)

### `app/_layout.tsx` — Raíz de la app

Es lo primero que corre cuando se abre la app. Hace dos cosas:
1. **Envuelve toda la app** con el `AuthProvider` para que el contexto de auth esté disponible en todas las pantallas
2. **Redirige al login** si no hay sesión activa, o al Dashboard si ya hay token guardado en SecureStore

### `app/login.tsx` — Pantalla de Login

Es la primera pantalla que ve el operador. Muestra:
- Logo institucional (emoji 🎓 sobre fondo dorado)
- Descripción de la app en 3 pasos
- Botón "Iniciar sesión con Google" (login real con OAuth 2.0)
- Botón "Probar en Modo Demo" (login simulado, sin internet)

### `app/(tabs)/index.tsx` — Dashboard

Muestra el resumen estadístico:
- Total de títulos, Pendientes, Retirados, En La Plata
- Accesos rápidos a "Nuevo Título" y "Buscar / Editar"
- Botón "🚪 Salir" para cerrar sesión (esquina superior derecha)
- Se actualiza deslizando hacia abajo (pull-to-refresh)

### `app/(tabs)/nuevo.tsx` — Alta de Título

Tiene 4 pasos internos gestionados con un estado `step`:

```
'camera'      → Muestra la cámara con marco de encuadre dorado
    ↓
'ocr-confirm' → Muestra los datos extraídos para que el operador los corrija
    ↓
'admin-form'  → Pide datos administrativos (¿retirado?, ¿remitido?, fechas)
    ↓
'saving'      → Spinner mientras guarda en Google Sheets
```

### `app/(tabs)/buscar.tsx` — Buscar y Editar

Permite buscar un título por DNI y editarlo. Los casos de uso son:
- Registrar que el alumno retiró su título
- Registrar que el título fue enviado a La Plata
- Registrar que el título regresó de La Plata
- Corregir cualquier dato ingresado con error

---

## 19. Los Tests Unitarios

Los tests verifican automáticamente que las funciones críticas funcionen correctamente.

**¿Por qué son importantes?**
Si en el futuro alguien modifica `dni-cleaner.ts` y sin querer rompe la función de limpieza del DNI, los tests lo detectan automáticamente al ejecutar `npm test`.

**¿Qué se testea?**

`__tests__/dni-cleaner.test.ts` — 14 tests que verifican:
- Que `"30.123.456"` se limpie a `"30123456"`
- Que `"30 123 456"` se limpie a `"30123456"`
- Que un DNI de 7 dígitos sea válido
- Que un DNI de 6 dígitos sea inválido
- Que se extraiga el DNI de textos con formato real de OCR

`__tests__/series-detector.test.ts` — 10 tests que verifican:
- Que "MODELO 2020" se detecte correctamente
- Que un texto sin serie devuelva `"DESCONOCIDO"`
- Que los patrones sean insensibles a mayúsculas/minúsculas

**¿Cómo se corren?**
```bash
npm test
```

---

## 20. El archivo app.json

Es la configuración de la app para Expo. Define:

```json
{
  "name": "Gestión de Títulos",    → Nombre que aparece debajo del ícono en el celular
  "slug": "titulos-app",           → Identificador interno usado por Expo
  "scheme": "titulosapp",          → Para el redirect de OAuth (titulosapp://callback)
  "ios": {
    "bundleIdentifier": "com.edu.titulosapp",  → ID único que usa la App Store
    "NSCameraUsageDescription": "..."           → Texto del permiso de cámara en iOS
  },
  "android": {
    "package": "com.edu.titulosapp",  → ID único que usa la Play Store
    "permissions": ["CAMERA"]         → Permiso de cámara en Android
  }
}
```

---

## 21. El archivo package.json

Es el "manifiesto" del proyecto. Le dice a Node.js qué librerías necesita instalar.
Cuando alguien descarga el código de GitHub y ejecuta `npm install`, este archivo le indica al sistema exactamente qué instalar.

**Dependencias principales y su función:**

| Librería | ¿Para qué? |
|---------|-----------|
| `expo ~54.0` | Framework base que coordina todo |
| `expo-router ~6.0` | Navegación entre pantallas basada en archivos |
| `expo-camera ~17.0` | Acceso a la cámara del dispositivo |
| `expo-auth-session ~7.0` | Manejo del flujo OAuth 2.0 con Google |
| `expo-secure-store ~15.0` | Almacenamiento cifrado de tokens |
| `expo-web-browser ~15.0` | Abrir el navegador para el login de Google |
| `@react-native-ml-kit/text-recognition` | OCR offline sin costo |
| `axios ^1.7` | Llamadas HTTP a la Google Sheets API |
| `react-native-modal-datetime-picker ^18.0` | Selector de fechas con diseño nativo |

---

## 22. Resumen visual de toda la arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         DISPOSITIVO                              │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   EXPO ROUTER (Navegación)               │    │
│  │                                                           │    │
│  │  ┌──────────┐  ┌────────────┐  ┌────────────────────┐   │    │
│  │  │  Login   │  │ Dashboard  │  │  Nuevo / Buscar    │   │    │
│  │  └────┬─────┘  └─────┬──────┘  └────────┬───────────┘   │    │
│  └───────┼──────────────┼───────────────────┼───────────────┘    │
│          │              │                   │                     │
│  ┌───────┼──────────────┼───────────────────┼───────────────┐    │
│  │       └──────────────┴───────────────────┘               │    │
│  │              AUTH CONTEXT (estado global)                 │    │
│  └───────────────────────────────────────────────────────────┘    │
│                          │                                        │
│  ┌───────────────────────┼───────────────────────────────────┐   │
│  │              SERVICIOS (capa de acceso a datos)            │   │
│  │  ┌─────────────┐  ┌───────────────┐  ┌───────────────┐   │   │
│  │  │ auth.service│  │sheets.service │  │  ocr.service  │   │   │
│  │  └──────┬──────┘  └───────┬───────┘  └───────┬───────┘   │   │
│  └─────────┼─────────────────┼───────────────────┼───────────┘   │
│            │                 │                   │                │
│  ┌─────────┴──┐     ┌────────┴──────┐    ┌──────┴──────┐        │
│  │ SecureStore│     │  Axios (HTTP) │    │   ML Kit    │        │
│  │ (cifrado)  │     │               │    │  (offline)  │        │
│  └────────────┘     └───────┬───────┘    └─────────────┘        │
│                             │                                     │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTPS
                    ┌─────────┴──────────┐
                    │    GOOGLE CLOUD     │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │ Google Sheets │  │
                    │  │     API v4    │  │
                    │  └───────┬───────┘  │
                    │          │          │
                    │  ┌───────┴───────┐  │
                    │  │  Archivo      │  │
                    │  │  "Títulos     │  │
                    │  │  Secundario"  │  │
                    │  │  en Drive     │  │
                    │  └───────────────┘  │
                    └─────────────────────┘
```

---

*Documento generado el 04/07/2026 — Versión de la app: 1.0.0*
