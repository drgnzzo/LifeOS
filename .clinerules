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
- **Un cero y un «sin dato» no son lo mismo.** Si una métrica no tiene
  fuente, devuelve `null` y píntala en gris. Un `0` se lee como «vas
  pésimo» y dispara alarma sobre algo que en realidad no se está midiendo.

  > Ya pasó: cinco de las nueve barras del SIM marcaban `0` permanente
  > porque su fórmula nunca se escribió. Y `_calcLogroReciente` leía
  > `l.titulo`/`l.avance`, campos que `getLogros()` nunca devolvió, así
  > que el chip mostraba «—» y 0% desde siempre, en silencio.
  > **Antes de leer un campo, verifica que el endpoint lo devuelva.**

- **`appendChild` mueve, no copia.** Un nodo con `id` único montado desde
  dos sitios se lo pelean: el segundo se lo arranca al primero y el primero
  se queda vacío. Si dos lugares muestran lo mismo, el que cierra devuelve
  el nodo a su sitio.

  > Ya pasó: `#e5-lucy` (carnet de Lucy) lo montaban el hueco `#e5-med-lucy`
  > del panel Médico y la capa de `irALucy`. Abrir el carnet desde el dial
  > se lo arrancaba a Médico y al cerrar se quedaba en la capa oculta.

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
- **El repo mezcla finales de línea.** `Code.gs` y `raw-e5.js` son CRLF;
  `raw-core.js`, `index.html` y `sw.js` son LF. Un script de sustitución
  que asuma `\n` no encuentra nada en los CRLF y falla en silencio.
  Comprueba antes de parchear y respeta el final de línea del archivo:
  convertirlo entero ensucia el diff y esconde el cambio real

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

> Revisado contra el código el 28/08/2026. Dos de los cinco pendientes que
> listaba esta sección **ya estaban construidos**: la lista mandaba a
> reconstruir cosas hechas. Si vuelves a tocar esta lista, verifica contra
> el código antes de dar algo por pendiente.

- ~~Organigrama de notas~~ — **hecho**. `raw-notas.js` (497 líneas) es un
  lienzo de grafo completo: nodos arrastrables, enlaces por arrastre,
  `persistir()` manda `x`/`y`/`conexiones` por `actualizarNota`
- ~~Frontend de Timers~~ — **hecho**. `raw-timers.js` monta la sección de
  nivel 2 con crear, pausar, reanudar y finalizar
- ~~`LOGRO RECIENTE` vacío~~ — **arreglado** (v9.20). `_calcLogroReciente`
  leía `l.titulo` y `l.avance`, campos que `getLogros()` nunca devolvió;
  caía siempre al valor por defecto. Ahora el título es el último logro
  **completado** por fecha (campo `concepto`) y el avance es el progreso
  general, el mismo número que muestra el panel LOGROS

- **`score` sigue sin contenedor.** `renderScore` busca `#score-body` y se
  sale en silencio si no existe. Ese id no está en ningún HTML del repo:
  `getScoreVida` funciona y se pinta en la nada. Es el pendiente más
  chico que queda
- ~~`enviarSOS` reportaba envíos que no ocurrieron~~ — **arreglado**
  (v5.015). La llave se lee de la propiedad de script
  **`CALLMEBOT_APIKEY`**; sin ella el WhatsApp ni se intenta y se avisa.
  El envío se verifica por código HTTP **y** por contenido (CallMeBot
  responde 200 con cuerpo de error). Se cuenta por canal —`porEmail` y
  `porWhatsapp`— y si no sale nada devuelve `ok:false`.
  **Pendiente:** dar de alta `CALLMEBOT_APIKEY` para que el WhatsApp
  funcione; hoy solo sale el correo
- Verificar en campo que las invitaciones de Meet lleguen al destinatario
- El SIM muestra 8 de 9 necesidades en `0/100` y LOGRO RECIENTE sale
  vacío en `0%`. Sin diagnosticar: puede ser dato real o carga fallida

### Seguridad — resuelto con TOTP

**Cerrado el 28/08/2026.** El backend ya no está expuesto: `doGet` y
`doPost` verifican un pase firmado **antes** de entrar al `switch`.

- Semilla TOTP en `PropertiesService`, nunca en el repo
- Pase `expiración.nonce.firma` con HMAC-SHA256, 12 h de techo
- Ventana de ±1 paso de 30 s, sin repetición de códigos ya usados,
  bloqueo de 5 min tras 5 intentos fallidos
- Públicas solo tres cosas: `servirHTML` (la app), `authEstado` (GET) y
  `authLogin` (POST). Telegram conserva su propio camino y su
  `ALLOWED_CHAT_ID`
- El pase viaja **dentro** de `apiGet`/`apiPost`: por query en las
  lecturas, en el cuerpo en las escrituras. Ningún `api.getX` envuelto
- `raw-auth.js` guarda el pase en **`sessionStorage`** (v9.17): la sesión
  muere al cerrar la pestaña. Recargar no molesta; cerrar sí vuelve a
  pedir código. Cada pestaña es una sesión aparte, y la PWA instalada es
  su propio contexto. Para volver a «recordar 12 h», basta cambiar
  `ALMACEN` a `localStorage` y subir el `?v=`

**Vías de escape, dos:** la propiedad `AUTH_DESACTIVADA=1`, y además la
auth nunca se exige si no hay `TOTP_SEMILLA`. Es imposible quedarse fuera
de la app por un despiste de configuración.

**Herramientas, todas sin argumentos** (el botón Ejecutar del editor no
los pasa — se eligen en el desplegable y se corre Ejecutar):

| Función | Qué hace |
|---|---|
| `authGenerarSemilla()` | Genera semilla y clave de pase. Una sola vez |
| `authCodigoActual()` | El código que el servidor espera ahora. Se compara con el teléfono |
| `authProbarAuto()` | Recorre el ciclo completo solo. Restaura el contador al terminar |
| `authDiagnostico()` | Estado de las propiedades |
| `authActivar()` / `authDesactivar()` | Encender y apagar |
| `authDesbloquear()` | Limpia el contador de intentos fallidos |
| `authCerrarSesiones()` | Rota la clave: invalida todos los pases vivos |
| `authRegenerarSemilla()` | Semilla nueva. Hay que volver a darla de alta en el teléfono |

En consola del navegador: `AUTH.estado()` y `AUTH.cerrarSesion()`.

**Deuda que dejó abierta:** `raw-escena.js` (v11, congelado) trae su
**propio** `API_URL` y un `apiGet`/`apiPost` pelón, sin pase y sin
blindaje. Hoy `index.html` no lo carga, así que no es un agujero. Si
alguien revive v11, ese transporte se salta la puerta entera.

**Pendiente de decidir:** con sesión obligatoria, conocer los endpoints
ya no da ventaja, así que `Code.gs` **podría** subirse al repo. La
semilla vive en `PropertiesService` y nunca estuvo en el archivo. Falta
sacar de la hoja Fijos los datos sensibles (CURP, RFC, NSS, INE) antes
de que el repo sea público, no por el código sino por lo que revela del
esquema.

### Backend fuera del repo

`Code.gs` y `appsscript.json` viven en la carpeta **local**, no en GitHub.
El `.gitignore` los bloquea (incluida la variante `Code.gs.txt` que produce
Windows al descargar).

Consecuencia: los cambios al backend se pegan a mano en el editor de Apps
Script y se **redespliega** (Implementar → Administrar implementaciones →
editar → Nueva versión). Pegar sin redesplegar no aplica nada.

`clasp` (herramienta oficial de Google) automatizaría ese pegado con
`clasp push`. Pendiente de valorar; no es urgente.

### Estado del Sheet — hallazgos de auditoría

- **RAW está sano:** 1,148 filas, enero–diciembre 2026, sin IDs duplicados
  ni saltos, fechas y montos válidos, saldo acumulado coherente. Las 31
  «rupturas» del saldo son filas de `Rectificación` que resetean a propósito
- La hoja **SALUD** arrastra un bloque huérfano `Timer | Inicio | Mejor tiempo`
  de antes de que existiera TIMERS
- **LOGROS** mezcla dos esquemas: casi todas las filas sin ID, las dos
  últimas con `L137`/`L138`. Más ~90 filas vacías intercaladas
- **CONTACTOS:** 206 registros, columna `Afinidad` vacía en todos

### Motor de necesidades (SIM) — `raw-sims.js`

Transposición del sistema de motivos de Los Sims a datos reales. Diez
barras 0-100 que **bajan solas con el tiempo** y se recargan con lo que
registras.

**La regla que lo sostiene:** no hay servidor ni tareas programadas, así
que ninguna barra se guarda. Cada necesidad es una **función pura** de
*(registros del Sheet, hora actual)*. Consecuencias: bajan en tiempo real
sin cron, no hay estado que corromper, y abrir la app en otro dispositivo
da el mismo número. Un `setInterval` de 30 s solo repinta; no toca la red.

| Barra | Fuente | Decae |
|---|---|---|
| energia | último sueño: ciclos de 1.5 h + calidad − alcohol | horas despierto |
| hidratacion | `nutricion.hoy.agua` vs meta | al ritmo del día |
| hambre | `nutricion.hoy.cal` vs meta + horas sin comer | al ritmo del día |
| cuerpo | último entrenamiento + minutos de la semana | 50/día |
| higiene | hábito con tag `higiene` | 4.2/hora |
| entorno | hábito con tag `entorno` | 33/día |
| mental | último pensamiento | 35/día |
| social | última interacción en relaciones | 25/día |
| disfrute | último logro completado | 15/día |
| trabajo | % de hábitos Electronics de hoy | diario |

**Sueño por ciclos, no por horas.** 5 ciclos de 1.5 h = 7.5 h = 100.
Despertar a media fase resta 8 puntos: por eso 7 h (4 ciclos + media
fase) puntúa 68 y 6 h limpias puntúan 76. La calidad 1-5 multiplica de
0.85 a 1.05 — dormir excelente da colchón sobre 100 que se gasta durante
el día.

**El tag `sims`** vive en la columna **I** de la hoja `Activity Check`,
en las filas de hábitos personales. Escribe ahí `higiene` o `entorno`.
El mecanismo ya existía en el backend desde antes; nunca se había usado.

- `_calcSimsNeeds` (raw-overlay.js) es solo un **adaptador** que delega en
  `window.SIMS.calcular()`. Conserva debajo el cálculo viejo como respaldo
  por si `raw-sims.js` no carga. Los tres sitios que la llaman no cambiaron
- Todo lo calibrable está en `SIMS.META`, editable en caliente desde consola
- **`simsDiag()`** imprime cada barra, su valor y **por qué** está ahí
- Supuesto pendiente: se asume despertar a las 07:00 (`META.horaDespertar`),
  porque los registros de sueño guardan horas totales pero no la hora de
  despertar. Capturarla mejoraría energía e hidratación

### Rumbo a largo plazo
Capas, en este orden estricto:

1. **Datos** — Sheets → Postgres/Supabase
2. **Backend** — Apps Script → API propia
3. **Hosting** — Pages → servidor con dominio (habilita cookies y sesión)
4. **Automatización** — cron, webhooks, respaldos

Van de arriba abajo, nunca al revés, y una sección a la vez.
**La app funciona en todo momento. Nunca una reescritura de golpe.**

**Supabase es la opción elegida para la capa 1**, no Firebase: los datos ya
son tabulares (timers, alcohol, sueño, contactos, médico) y eso es SQL puro.
Firebase obligaría a rearmar la forma de todo. Supabase además resuelve
login y sesión sin montar servidor, que es lo que hoy falta.

Ganancia concreta esperada: los 1–4 segundos de espera de Apps Script pasan
a milisegundos.

### Orden de trabajo acordado

1. ~~Autenticación TOTP~~ — **hecho** (28/08/2026, v5.013 / v9.17)
2. ~~Organigrama de notas~~ — **ya estaba hecho** (verificado 28/08/2026)
3. ~~Frontend de Timers~~ — **ya estaba hecho** (verificado 28/08/2026)
4. **Honestidad de `enviarSOS`** — reportar por canal en vez de un contador
   que suma envíos fallidos
5. **Contenedor de `score`** — el backend lleva tiempo pintando en la nada
6. Sobre `{ok:...}` en los 8 endpoints restantes (backend y frontend a la vez)
7. Migración por capas (ver arriba)

---

## 8. Tono

Español mexicano, directo y profesional. Sin coloquialismos ni apodos.
Cuando encuentres un error mío, dilo y corrígeme.
