# LifeOS — Reglas del proyecto

Contexto operativo para cualquier agente que trabaje en este repo.
Léelo completo antes de tocar código.

> Este archivo se llama `CLAUDE.md` para Claude Code.
> Si usas Cline, cópialo como `.clinerules`. Otros agentes leen `AGENTS.md`.
> Es el mismo contenido: **un solo archivo de verdad, copiado con otro nombre.**

---

## 1. Qué es esto

Sistema operativo personal. Panel único para salud, finanzas, contactos,
timers, notas y hábitos.

| Capa | Tecnología |
|---|---|
| Frontend | Vanilla JS/CSS, GSAP local, sin build, sin framework |
| Backend | Google Apps Script (`Code.gs`, ~3,300 líneas) |
| Datos | Google Sheets (~27 hojas) |
| Hosting | GitHub Pages → `drgnzzo.github.io/LifeOS` |
| Caché | Service Worker propio (`sw.js`) |

**No hay servidor.** Sin cookies, sin sesión, sin tareas programadas.
Es el techo de la arquitectura actual.

**v9 es la rama activa.** v11 (Three.js) está congelada; sus archivos
`raw-v11-*` siguen en el repo pero `index.html` no los carga.

### Filosofía de navegación

Tres niveles: nivel 0 (HOME, dial planetario) → nivel 1 (anillo coverflow
de tarjetas) → nivel 2 (tableros inmersivos).

**«El dial captura, los paneles muestran.»** Todo contenido editable entra
por el formulario RAW del dial. Los tableros de sección son de solo lectura.

---

## 2. Leyes de la física — nunca se rompen

Cada una viene de una regresión ya pagada. No son preferencias.

### 2.1 Registros duplicados
`_OS_SECCIONES` (en `raw-core.js`) y `_TABS` (en `raw-niveles.js`) son
**dos registros separados**. Una sección nueva se registra en ambos.

**Excepción real:** `contactos` está en `_OS_SECCIONES` pero NO en `_TABS`,
a propósito — no existe `btn-contactos` en el HTML. Se alcanza desde el
flujo E5, no por flechas. Meterla al ciclo la rompe.

### 2.2 `_reposicionarHUD` no es idempotente
Llamarla más de una vez acumula desplazamiento y produce deriva vertical.
Existe un candado de reentrada; **no lo quites** ni añadas un patrón de
«sanador determinista» que la invoque repetidamente.

### 2.3 Nunca envuelvas `api.getX`
Rompe las mecánicas internas de `gasRun` / `apiGet` en `raw-core.js`.
Si necesitas cambiar el transporte, modifica el **interior** de
`apiGet` / `apiPost`, nunca los métodos del objeto `api`.

### 2.4 `_iniciarFaseAparicion`
No cambies su línea de tiempo sin auditar exhaustivamente todos los
sitios de invocación.

### 2.5 Audita antes de parchear
`grep` de **todos** los sitios de invocación antes de tocar cualquier
función. Sin excepción.

### 2.6 Arrays dispersos
Las comas dobles en `_DIAL_ITEMS` crean arrays dispersos que pasan
`node -c` pero truenan en runtime con `undefined.accent`.
Verifica **evaluando en Node**, no solo comprobando sintaxis.

### 2.7 WebGL y geometría
- `BufferGeometry` sin normales causa parpadeo dependiente de GPU (NaN en shader)
- La geometría compartida necesita `renderOrder` explícito por malla
- Nunca animes la opacidad CSS de un canvas WebGL — usa un div telón encima

### 2.8 DOM
- Escribe solo cuando cambia (patrón comparar-y-escribir) para evitar tremolina
- Nunca midas geometría del DOM durante animaciones
- `transition-property` en CSS **no** detiene a los escritores JS por cuadro (lerps, parallax)

### 2.9 CSS global
Las reglas genéricas aplicadas globalmente rompen los tableros.
Ya falló: `max-width` con `margin:auto`, `min-width:0` global, reglas de
overflow en contenedores con scroll.
**Acota siempre a un selector concreto, o revierte.**

---

## 3. Ritual de entrega — todas las veces

1. Sube `?v=NNNN` del archivo modificado, en `index.html`
2. Sube `CACHE_NAME` en `sw.js`
3. Actualiza `hero-sub` en `index.html`
4. Push
5. En el navegador: **Unregister SW + Ctrl+Shift+R**

**Los pasos 1 y 2 van juntos siempre.** El Service Worker es cache-first:
un `?v=` idéntico con contenido nuevo sirve la versión vieja para siempre.

### Regla del cache-busting
**Todo** `raw-*.js` y `raw-*.css` en `index.html` lleva `?v=`.
Un archivo sin query nunca se actualiza hasta que cambie `CACHE_NAME`.

> Ya pasó: `raw-e5.js`, `raw-juice.js`, `raw-temas.js` y `raw-nivel2.css`
> se cargaban sin `?v=`. Meses de arreglos que nunca llegaron al navegador.

### `SHELL` en `sw.js`
Contiene **solo** assets sin `?v=`: `/LifeOS/`, `index.html`, iconos, manifest.

No añadas archivos versionados. `caches.match(req)` no ignora la query,
así que precachear `raw-core.js` sin `?v=` crea una entrada que nunca se
usa. Los versionados se cachean solos en su primera petición.

---

## 4. Backend (Apps Script)

- **~96 endpoints**, todos enrutados por `switch` en `doGet` / `doPost`
- Toda función expuesta necesita `try/catch`
- Las rutas de error deben devolver un campo `error` para que el frontend lo registre
- Nunca devuelvas datos falsos desde un `catch` (ya pasó: `getFijos`
  devolvía una fila inventada que se pintaba como gasto real)
- `getValues()` en las 54 lecturas, nunca `getDisplayValues()` — la app
  maneja decimales que la hoja muestra redondeados

### Marcador de ejemplos
Varias hojas traen filas de ejemplo separadas por
`--- FIN EJEMPLOS / DATOS REALES ABAJO ---`.

`_getFilaInicio(datos, marcador)` devuelve la primera fila real.

**El número de fila se calcula `filaInicio + i`, nunca `i + 2`.**

> Ya pasó: 7 funciones usaban `i + 2`. Desfase de +6 a +11 filas.
> Ese número viaja al frontend y se usa **para escribir**: `marcarLogro`
> escribía en el renglón equivocado, encima de filas de ejemplo.

### Escrituras y codificación
`apiPost` manda `Content-Type: text/plain;charset=utf-8`.

**No lo cambies a `application/json`**: dispara preflight CORS y Apps
Script no responde a `OPTIONS`. Rompe todas las escrituras.

Sin ese encabezado, Apps Script lee los bytes UTF-8 como Latin-1 y
corrompe emojis y acentos.

### Despliegue del backend
Pegar en el editor **no basta**. Hay que crear una versión nueva:
Implementar → Administrar implementaciones → editar → Nueva versión.

`appsscript.json` correcto: `executeAs: USER_DEPLOYING`,
`access: ANYONE_ANONYMOUS`. Si el frontend reporta «Apps Script pide
iniciar sesión», el despliegue se rompió.

---

## 5. Diagnóstico

Scripts de consola. Es el método que resuelve los bugs de este proyecto.

| Comando | Qué hace |
|---|---|
| `diagLifeOS()` | Auditoría total (colapso de layout, overflow, controles muertos, rebeldes de tema) |
| `diag()` | Chequeo 007 + auditor de layout |
| `auditar()` | Solo auditor de layout |
| `e5estado()` | Diagnóstico del módulo E5 |
| `window._apiErrores` | Últimos 50 fallos de comunicación con hora y endpoint |

`window._apiErrores` vacío después de una sesión normal = comunicación sana.

---

## 6. Cómo entregar cambios

- **Archivos completos.** Nunca comprimidos, nunca parches parciales sin
  mostrar antes el audit de `grep`
- **Verificar antes de entregar:** `node -c`, evaluación en Node cuando hay
  arrays, pruebas de humo con DOM simulado, telemetría confirmada
- **Verificación independiente al final.** Reaplicar sobre un archivo ya
  modificado puede revertir cambios anteriores en silencio. Comprueba el
  resultado final, no los pasos
- **Control de versiones:** el propietario descarga y sube archivos
  directamente. El bump de versiones es responsabilidad del agente

---

## 7. Estado conocido

### Deuda técnica abierta
- **8 endpoints sin sobre `{ok:...}`:** `getCatalogos`, `getDatosMes`,
  `getEventuales`, `getFijos`, `getListaEstructura`, `getNotas`,
  `getSaldoDia`, `getTimers`. Tres devuelven arrays desnudos y
  `getFijos` alimenta directo a `renderEntes(f)` — envolverlos requiere
  cambiar backend y frontend a la vez
- **Variables CSS sin definir:** `--clr`, `--pct`, `--tipo-bg`, `--kard-clr`
- **`raw-overlay.js`: 9,127 líneas**, una cuarta parte de la app
- **`raw-v11-*`:** ~7,900 líneas de peso muerto en el repo
- **62 endpoints con 6 verbos distintos** para la misma acción
  (`get`, `guardar`, `actualizar`, `nuevo`, `editar`, `crear`).
  Es la razón de fondo de que agregar una sección se sienta como empezar de cero
- **`score`** (`getScoreVida`) funciona en el backend pero no tiene
  contenedor en ninguna parte del HTML
- **Datos sensibles** (CURP, RFC, NSS, INE) en la hoja de Fijos.
  Cifrar o separar antes de cualquier migración a servidor propio

### Pendientes de producto
- Organigrama de notas — el Sheet ya tiene `X`, `Y`, `Conexiones`; falta el frontend
- Frontend de Timers — el backend está completo (`getTimers`, `crearTimer`, `actualizarTimer`)
- Verificar en campo que las invitaciones de Meet lleguen al destinatario
- Timers que arranquen activos
- Flujo SOS → WhatsApp

### Rumbo a largo plazo
Capas, en este orden estricto:

1. **Datos** — Sheets → Postgres/Supabase
2. **Backend** — Apps Script → API propia
3. **Hosting** — Pages → servidor con dominio (habilita cookies y sesión)
4. **Automatización** — cron, webhooks, respaldos

Van de arriba abajo, nunca al revés, y una sección a la vez.
**La app funciona en todo momento. Nunca una reescritura de golpe.**

---

## 8. Tono

Español mexicano, directo y profesional. Sin coloquialismos ni apodos.
Cuando encuentres un error mío, dilo y corrígeme.
