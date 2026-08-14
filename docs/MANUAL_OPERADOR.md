# Manual del Operador
## App de Gestión de Títulos — Secundario de Adultos

---

## ¿Qué hace esta aplicación?

Esta app permite **fotografiar un título académico** y guardarlo automáticamente en una hoja de cálculo de Google Drive, evitando la carga manual de datos.

También permite registrar cuándo un alumno retira su título, o cuándo el título fue enviado y devuelto desde la sede central (La Plata).

---

## Inicio de sesión

La primera vez que abrís la app, vas a ver la pantalla de inicio de sesión.

1. Tocá el botón **"Iniciar sesión con Google"**.
2. Elegí la cuenta de Google de la institución.
3. Aceptá los permisos que solicita (acceso a Google Sheets y Drive).
4. La app va a crear automáticamente un archivo llamado **"Títulos Secundario"** en tu Drive.

> ✅ La sesión se mantiene abierta. No tenés que iniciar sesión cada vez que usás la app.

---

## Pantalla de Inicio (Dashboard)

Muestra un resumen general:
- 📋 **Total de títulos** registrados
- ⏳ **Pendientes** de retiro
- ✅ **Retirados** por los alumnos  
- 📨 **Remitidos** a La Plata

Deslizá hacia abajo para actualizar los números.

---

## Registrar un Título Nuevo

### Paso 1: Tomar la foto

1. Tocá la pestaña **"Nuevo Título"** (icono 📷).
2. Aparece la cámara con un recuadro dorado.
3. **Colocá el título dentro del recuadro**. Asegurate de que:
   - Haya buena iluminación (sin sombras sobre el texto)
   - El título esté bien visible, sin dobleces
   - La foto esté enfocada
4. Tocá el **botón circular** para tomar la foto.
5. La app procesa la imagen durante 2-5 segundos (procesamiento OCR).

> 📷 **Consejo:** Iluminación natural o una lámpara lateral dan los mejores resultados.

---

### Paso 2: Revisar los datos extraídos

Después de procesar la foto, la app muestra los datos que detectó:

| Campo | Ejemplo |
|-------|---------|
| DNI | `30123456` |
| Apellido y Nombre | `GARCÍA, JUAN CARLOS` |
| Fecha de Emisión | `15/03/2023` |
| Calificación Final | `8.50` |
| Serie / Modelo | `MODELO 2020` |

**¡MUY IMPORTANTE!** Revisá los datos antes de continuar:
- Si el OCR detectó algo mal, podés **corregir directamente** tocando el campo.
- El **DNI es obligatorio**. Si no se detectó (o está incorrecto), corregilo vos.
- Si la imagen estaba borrosa y no se detectó el DNI, la app te va a pedir que lo ingreses manualmente o que saques otra foto.

Una vez que los datos estén correctos, tocá **"Continuar →"**.

---

### Paso 3: Datos administrativos

En esta pantalla completás los datos de control:

**¿Fue retirado el título?**
- Por defecto dice **NO**. No toques el switch si el título sigue en la institución.
- Si el alumno ya lo retiró (caso raro, pero puede pasar), activá el switch → aparecen los campos de fecha y nombre de quien retiró.

**¿Fue remitido a La Plata (Sede Central)?**
- Por defecto dice **NO**.
- Si el título fue enviado a La Plata, activá el switch y seleccioná la fecha de envío.

**Fecha de Devolución de La Plata** (opcional)
- Dejá vacío si el título todavía no regresó de La Plata.
- Completá cuando regrese (esto también se puede hacer después desde "Buscar / Editar").

Tocá **"💾 Guardar en Drive"**.

La app verifica que no exista otro título con el mismo DNI. Si ya existe, te avisa y te lleva a editar ese registro.

---

## Registrar el Retiro de un Título

Cuando un alumno viene a buscar su título:

1. Tocá la pestaña **"Buscar / Editar"** (icono 🔍).
2. Escribí el **DNI del alumno** (solo números, sin puntos).
3. Tocá **"Buscar"**.
4. Aparece el registro del alumno con todos sus datos.
5. Tocá **"✏️ Editar este registro"**.
6. Activá el switch **"¿Retirado?"**.
7. Seleccioná la **Fecha de Retiro** (la fecha de hoy).
8. Escribí en **"Quién Retiró"** el nombre de quien se llevó el título.
9. Tocá **"💾 Guardar cambios"**.

---

## Registrar la Devolución de La Plata

Cuando un título regresa de la sede central:

1. Buscá el título por DNI en **"Buscar / Editar"**.
2. Tocá **"✏️ Editar este registro"**.
3. En el campo **"Fecha de Devolución de La Plata"**, seleccioná la fecha de regreso.
4. Tocá **"💾 Guardar cambios"**.

---

## Corregir un Error

Si cometiste un error al cargar (por ejemplo, el nombre mal escrito):

1. Buscá el título por DNI en **"Buscar / Editar"**.
2. Tocá **"✏️ Editar este registro"**.
3. Corregí el campo que esté mal.
4. Tocá **"💾 Guardar cambios"**.

---

## Problemas frecuentes

| Problema | Solución |
|----------|----------|
| La app dice "Sin conexión" | Verificá que el teléfono tenga internet (WiFi o datos) |
| El OCR detecta mal el DNI | Corregilo manualmente en el campo de confirmación |
| La foto sale borrosa | Limpiá la lente de la cámara y usá más luz |
| El nombre no se detectó | Escribilo manualmente en el campo de confirmación |
| Error al guardar | Cerrá y reabrí la app, verificá la conexión a internet |
| "DNI ya registrado" | Ese alumno ya tiene un título cargado. Usá "Buscar / Editar" |

---

## Importante

> ⚠️ **Solo una persona a la vez** debe usar la app al mismo tiempo.  
> Si dos personas guardan datos simultáneamente, puede haber inconsistencias en la hoja de cálculo.  
> Coordiná con tus compañeros antes de usarla.

> 📊 Los datos se guardan directamente en Google Sheets. Podés ver y verificar el archivo abriendo **"Títulos Secundario"** en Google Drive desde cualquier computadora.
