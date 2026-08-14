# Guía 06 — Puesta en producción y verificación final

> **Camino completo:** Guía 01 → Guía 02 → Guía 03 → Guía 04 → Guía 05 → **Guía 06 (producción)**. **Esta es la última.**
> **Requisitos previos:** Guía 04 completa (primer build instalado) y Guía 05 completa (Client IDs creados y pegados en `services/auth.service.ts`).

Acá se cierra el circuito: se compila la versión definitiva con las credenciales adentro, se instala, y se verifica que los títulos se guarden de verdad en Google Sheets.

---

## ¿Por qué hay que compilar de nuevo?

Porque el `.apk` de la Guía 04 se horneó **antes** de pegar los Client IDs en el código. El teléfono no se entera de cambios en tu PC — solo conoce lo que vino dentro del paquete instalado. Por eso el plan siempre fue compilar dos veces: la primera creó el keystore (que Google necesitaba); esta segunda mete los Client IDs reales dentro de la app.

---

## Paso 1 — Verificar el código antes de compilar

Parado en `C:\REPOSITORIO\ANTIGRAVITY\titulos-app`:

```powershell
npx tsc --noEmit
npm test
```

*¿Para qué?* Confirmar que al pegar los Client IDs no se rompió nada: 0 errores de tipos y 24/24 tests en verde. Compilar en la nube tarda 10-20 minutos — mejor detectar un error de tipeo acá, en 30 segundos, que allá.

---

## Paso 2 — Recompilar

```powershell
eas build --platform android --profile preview
```

Mismo comando que en la Guía 04. Esta vez **no** pregunta por el keystore — ya existe y se reutiliza (importante: es el mismo keystore, así que el SHA-1 que registraste en Google sigue siendo válido).

---

## Paso 3 — Descargar e instalar el nuevo .apk

Igual que en la Guía 04 (pasos 7 y 8): descargar el `.apk` del link que da Expo e instalarlo en el teléfono. Se instala **encima** de la versión anterior, no hace falta desinstalar nada — Android lo trata como una actualización porque tiene el mismo paquete y la misma firma.

---

## Paso 4 — La prueba de fuego: login real

1. Abrir la app instalada y tocar **"Iniciar sesión con Google"** (no el Modo Demo).
2. Elegir una cuenta que esté en la lista de **usuarios de prueba** (Guía 05, Paso 6).
3. Google tiene que mostrar la pantalla de consentimiento pidiendo permisos de Sheets y Drive → **Aceptar**.
4. La app entra al dashboard.

**Si aparece `access_denied`:** el email usado no está en la lista de testers — volvé a la Guía 05, Paso 6.
**Si el login falla de otra forma:** revisar que los dos Client IDs estén bien pegados (sin espacios, completos) y que el de Web tenga el URI de redireccionamiento con tu usuario de Expo correcto.

---

## Paso 5 — Verificar la planilla en Drive

1. Entrar a `https://drive.google.com` **con la misma cuenta** del login.
2. Debe aparecer un archivo nuevo de Google Sheets llamado **"Títulos Secundario"** (la app lo crea sola en la primera entrada, en la raíz de "Mi unidad").
3. Abrirlo: tiene una hoja "Títulos" con los encabezados formateados (fila azul).

---

## Paso 6 — Cargar un título de prueba de punta a punta

1. En la app: **"Nuevo Título"** → sacarle foto a un título (o a una fotocopia de prueba).
2. El OCR (que ahora sí funciona, porque es la app compilada) debería leer DNI, nombre y fechas — corregir a mano lo que haya leído mal.
3. Guardar.
4. Refrescar la planilla en Drive: **el título tiene que aparecer como una fila nueva**, con fecha de captura y última modificación.
5. En la app: **"Buscar / Editar"** → buscar por ese DNI → marcar "Retirado" con fecha → verificar que la fila de la planilla se actualizó.

Si todo eso pasó: **la app está en producción.** 🎓

---

## Checklist final de puesta en producción

- [ ] `npx tsc --noEmit` sin errores y `npm test` 24/24 antes de compilar
- [ ] Segundo build hecho **después** de pegar los Client IDs
- [ ] `.apk` final instalado en el/los teléfonos de los operadores
- [ ] Todos los emails de los operadores agregados como usuarios de prueba en Google Cloud
- [ ] Login real probado con al menos una cuenta
- [ ] Planilla "Títulos Secundario" visible en el Drive de esa cuenta
- [ ] Alta de un título de prueba reflejada en la planilla
- [ ] Edición (retiro) de ese título reflejada en la planilla
- [ ] Borrar la fila de prueba de la planilla antes del uso real

---

## Para el día a día (después de producción)

- Los operadores usan **solo la app instalada** — la PC, VS Code y Expo no hacen falta más para operar.
- La planilla se puede mirar y compartir desde Drive como cualquier Sheets, pero conviene **no editarla a mano** (la app asume su estructura de columnas).
- Si más adelante se cambia algo del código, el ciclo es siempre el mismo: cambiar → `npx tsc --noEmit` y `npm test` → `eas build` → instalar el nuevo `.apk`.
- El manual de uso para el personal está en `docs/MANUAL_OPERADOR.md`.

---

**Fin del camino. De la receta a la torta, servida en mesa.** 🎂
