# Corpoguepsa — Landing page interactiva

Sitio estático en HTML, CSS y JavaScript vanilla. No requiere framework, instalación de paquetes, backend ni compilación.

## Archivos

- `index.html`: estructura, contenido, metadatos (Open Graph y datos estructurados) y plantillas de los modales de servicios.
- `styles.css`: diseño responsive, estados de interacción y animaciones.
- `script.js`: menú, modales, visor de fotos, navegación por secciones, desplazamiento suave y apariciones al hacer scroll.
- `favicon.ico`: ícono de la pestaña (logo de Corpoguepsa en círculo, 16, 32 y 48 px). Va en la raíz porque los navegadores lo buscan ahí.
- `assets/`:
  - Cuatro fotografías en WebP con sus variantes reducidas (`-640`, `-1024`; la oficina usa `-480` y `-720`) para `srcset`.
  - `logo-168.webp`: logo usado en el encabezado y el pie.
  - `apple-touch-icon.png`: ícono al guardar la página en la pantalla de inicio del celular.
  - `favicon-192.png`: logo en círculo para la pestaña en pantallas de alta densidad y accesos directos en Android.
  - `og-corpoguepsa.jpg` (1200×630): imagen de vista previa al compartir.
  - `logo.webp`: logo original en alta resolución, fuente de los anteriores. La página no lo carga.
- `documentos/`: biblioteca de "Documentos y Transparencia".
  - `registro.js`: registro central con el título, la categoría, la ruta, la fecha y el peso de cada documento. La sección se genera a partir de este archivo.
  - Una subcarpeta por categoría (`estados-financieros/`, `comunicados-y-convocatorias/`, `estatutos/`, `contratos/`, `servicio-de-aseo/`) con los PDF.

## Publicación

El sitio está publicado en Vercel: <https://corpoguepsa.vercel.app/>. Se vuelve a desplegar solo con cada push a la rama `main` del repositorio en GitHub.

- La dirección del sitio aparece en cuatro lugares de `index.html`: `canonical`, `og:url`, `og:image` y los datos estructurados. Si se conecta un dominio propio, actualízala en todos.
- `_respaldo/` (copia local de la versión anterior) está en `.gitignore` y no se publica.
- Opcional: `assets/logo.webp` no es necesario en el servidor.
- `documentos/` pesa unos 181 MB: varios PDF son escaneos grandes (los estatutos de la corporación, 53 MB; los estados financieros 2018–2022, entre 17 y 33 MB). GitHub muestra una advertencia con archivos de más de 50 MB, pero los acepta. Si en algún momento se consiguen versiones digitales más livianas, basta con reemplazar el archivo y actualizar su peso en `registro.js`.
- Prueba en un celular real el enlace de WhatsApp, la llamada y el correo.
- Para comprobar la vista previa al compartir, pega la dirección en el depurador de Facebook (<https://developers.facebook.com/tools/debug/>); también refresca la caché de la vista previa.

## Integración

1. Conserva juntos `index.html`, `styles.css`, `script.js`, `favicon.ico` y las carpetas `assets` y `documentos`.
2. Abre `index.html` en un navegador moderno o copia esos archivos a la carpeta pública de tu hosting estático.
3. Si integras las secciones en otra página, incluye `styles.css` y coloca `script.js` al final del `body` o cárgalo con `defer`. Conserva los IDs y atributos `data-*` usados por el script.

Las fuentes se cargan desde Google Fonts; si no hay conexión se usan las fuentes del sistema. Las fotografías están incluidas localmente.

## Características

### Diseño
- Encabezado fijo: arriba es una barra blanca amplia; al desplazarse se transforma en una cápsula de cristal compacta, con el logo más pequeño y una línea de progreso de lectura.
- Servicios en lista editorial. Al pasar el cursor, cada fila se eleva con sombra suave, un halo interior y un borde que se ilumina siguiendo al puntero; el ícono se rellena y la flecha avanza.
- Franja tipográfica bajo el hero, ondas de agua tenues como textura en "Nosotros" y contacto, y la palabra "Corpoguepsa" como marca de agua en el pie.

### Nuestra historia
- Integrada en "Somos Corpoguepsa" (ancla `#historia`), con texto editorial, una fotografía de la planta y una línea de tiempo.
- El contenido proviene de la reseña histórica institucional publicada en el sitio anterior (corpoguepsa.com), basada en la investigación del profesor e historiador Luis Amadeo Gaona Cepeda.
- La línea de tiempo solo incluye fechas que aparecen en la reseña: década de 1950, 1962, 21 de marzo de 1977, mayo de 1977 y 13 de junio de 1980. Lo que no tiene fecha (época indígena, los aljibes y las duchas públicas, las fuentes actuales) va en el texto introductorio.
- Al hacer scroll, la línea se llena como agua que avanza (script.js): una gota recorre el trazo, y cada punto se llena justo cuando el agua lo alcanza, con una onda que se expande.
  - Los acontecimientos pendientes muestran un anillo gris. El actual se agranda, resalta su tarjeta y pinta su fecha de azul.
  - Las cifras (130 familias, 162 suscriptores) cuentan desde cero la primera vez.
  - Al llegar a la inauguración de 1980, su punto se vuelve lima y un destello de luz cruza la tarjeta.
  - Las tarjetas entran desde la derecha. La foto se descubre como cortina y se acerca despacio mientras la sección cruza la pantalla.
  - La línea se vuelve a medir sola si cambia el tamaño de la pantalla o del texto, así que siempre empieza y termina en el primer y el último punto.

### Documentos y Transparencia
- Sección entre la galería y contacto (ancla `#documentos`), con 22 documentos reales tomados del sitio anterior.
- Cada documento muestra un ícono según su formato (PDF, Word, Excel…), su nombre, su categoría, la fecha de publicación y su peso, además de dos acciones: Ver (abre en una pestaña nueva) y Descargar.
- Filtros por categoría con su cantidad y búsqueda por nombre que no distingue tildes ni mayúsculas.
- Sin filtros se muestran los 8 más recientes y el resto con "Ver los 22 documentos". Si una búsqueda no encuentra nada, aparece un mensaje con un botón para ver todos.
- En el celular las categorías forman una fila deslizable.

### Movimiento
- Movimiento ligado a la interacción, sin bucles que distraigan:
  - Entrada escalonada del hero.
  - Parallax de la foto principal y de la nota lima.
  - Ondas y franja que avanzan con el scroll.
  - Títulos que entran con un barrido.
  - Íconos que se dibujan solos.
  - Fotos que se revelan como una cortina.
- Todo el contenido, incluido el pie de página, aparece de forma progresiva al hacer scroll.
- Botones con una luz que sigue al cursor, halo de su propio color y respuesta al presionar.

### Modales y visor de fotos
- Modal de servicios: se expande desde el centro pasando de desenfocado a nítido sobre el fondo desenfocado.
  - Su contenido entra en cascada y el botón de cerrar queda siempre visible.
  - Se cierra con la X, con Escape o con un clic fuera del modal.
- Visor de fotos a pantalla completa sobre fondo oscuro.
  - Al abrirlo, la foto crece desde su tarjeta de la galería hasta ocupar la pantalla; al cerrarlo vuelve a la tarjeta de la foto que se esté viendo (si esa tarjeta no está a la vista, el visor se desvanece). Mientras crece muestra la foto que ya estaba cargada y luego la cambia por la de mayor resolución.
  - Incluye miniaturas y flechas laterales en pantallas amplias.
  - Se navega con las teclas izquierda/derecha y deslizando en pantallas táctiles.
  - Al cambiar de foto, la actual sale con desenfoque y la nueva entra desde el lado contrario.
- Al cerrar cualquier modal, el foco vuelve al elemento que lo abrió y la página no se desplaza de lado.

### Navegación
- Menú: Servicios, Nosotros, Historia, Instalaciones, Documentos y Contáctanos. Con seis enlaces, el menú en línea se usa desde 1101 px; por debajo se despliega desde el botón de menú (en tablet como tarjeta alineada a la derecha y en celular a todo el ancho).
- Flechas flotantes en una píldora de cristal: recorren inicio, servicios, nosotros, historia, instalaciones, documentos, contacto, preguntas frecuentes y pie de página.
  - Al pasar el cursor, una etiqueta indica a qué sección van.
  - En pantallas amplias, un indicador de puntos marca la sección actual.
- Desplazamiento propio entre secciones: acelera y frena con suavidad (0,6–1,15 s según la distancia). Se detiene si la persona usa la rueda, toca la pantalla o el teclado.
- En el celular, el encabezado se oculta al bajar y reaparece al subir. El ícono del menú se convierte en X y el menú se despliega como una tarjeta.

### Rendimiento y accesibilidad
- Imágenes responsivas (`srcset`). En el celular la página completa descarga unos 630 KB de imágenes.
- Las fuentes se cargan con `preconnect`; el visor de fotos no descarga nada hasta que se abre.
- Contraste AA en los textos sobre fondos sólidos (los textos sobre fotos llevan un degradado oscuro detrás), foco visible con teclado y enlace "Saltar al contenido". Las filas de servicios usan botones reales y conservan sus títulos.
- Con `prefers-reduced-motion` se desactivan las animaciones y el desplazamiento animado.
- Base móvil:
  - Sin destello gris al tocar y sin espera de doble toque.
  - Sin inflado de texto al girar el teléfono.
  - Mantener presionado un control no selecciona su texto.
  - Los efectos hover solo aplican con cursor, para que no queden "pegados" tras tocar. En pantallas táctiles, la galería, las flechas flotantes, el botón de cerrar y las preguntas responden al presionar.
  - La barra del navegador usa el mismo blanco del encabezado.
- Modo claro declarado (`color-scheme`) para evitar que el modo oscuro forzado de algunos navegadores invierta los colores.

### Compatibilidad
Navegadores modernos. Los efectos ligados al scroll (parallax, ondas, franja, nota lima, acercamiento de la foto de la historia y línea de progreso) usan `animation-timeline` y funcionan en Chrome, Edge y Safari recientes. En Firefox la página se ve completa, pero esos efectos quedan estáticos. La línea de tiempo de la historia funciona en todos, porque se mueve con JavaScript.

## Personalización

### Información de servicios

Edita las plantillas `details-acueducto`, `details-alcantarillado` y `details-aseo` en `index.html`. Los horarios concretos, requisitos y cobertura por dirección no estaban en el material original: los textos invitan a confirmarlos con Corpoguepsa.

### Contacto

La fila "Nuestro municipio" abre Google Maps centrado en Güepsa, Santander (en el celular abre la app). Si más adelante se quiere marcar la oficina exacta, reemplaza ese enlace en `index.html` (y `hasMap` en los datos estructurados) por el vínculo que da Google Maps en Compartir → Copiar vínculo.

El teléfono es `316 784 6946`, WhatsApp usa el número internacional `573167846946` y el correo es `corpoguepsa@gmail.com`. Si cambian, actualiza:

- Los enlaces en `index.html`.
- Los datos estructurados (`application/ld+json`) en el `<head>`.
- El generador del enlace de WhatsApp en `script.js`.

### Nuestra historia

El texto está en `index.html`, dentro del bloque `<div class="wrap history" id="historia">`:

- Para editar la introducción, cambia los párrafos de `.history-intro`.
- Para agregar un acontecimiento con fecha real, copia un `<li class="timeline-item">` dentro de `<ol class="timeline">`, en orden cronológico, con su fecha en `.timeline-date` (usa `<time datetime="AAAA-MM-DD">` si la fecha es exacta).
- Para destacar un hito, agrega la clase `is-milestone`, como en la inauguración de 1980.
- Mantén la línea de fuente (`.history-source`) si se incorpora material nuevo.

### Documentos

Para publicar un documento oficial:

1. Copia el archivo en la subcarpeta de su categoría dentro de `documentos/`, con un nombre en minúsculas, sin tildes ni espacios (por ejemplo `documentos/estados-financieros/estados-financieros-2026.pdf`).
2. Agrega una línea a `CORPOGUEPSA_DOCUMENTOS` en `documentos/registro.js`, con:
   - `titulo`: el nombre que verá la comunidad.
   - `categoria`: una de las claves de `CORPOGUEPSA_CATEGORIAS`.
   - `archivo`: la ruta desde la raíz del sitio.
   - `fecha` (opcional): en formato `AAAA-MM` o `AAAA-MM-DD`.
   - `tamano` (opcional): por ejemplo `'1,6 MB'`.
3. Sube el número de versión de `registro.js` (`?v=`) en `index.html`.

Para crear una categoría, agrégala a `CORPOGUEPSA_CATEGORIAS`; su filtro aparece automáticamente en cuanto tenga al menos un documento. El formato y su ícono se toman de la extensión del archivo. El orden es automático: los más recientes primero.

### Imágenes

Si reemplazas una fotografía, genera también sus variantes reducidas con el mismo nombre y sufijo de ancho (`-640.webp`, `-1024.webp`; la oficina usa `-480` y `-720`). El encabezado y el pie usan `logo-168.webp`, un recorte cuadrado del logo.

### Secciones

Cada sección principal usa un ID y el atributo `data-section`. El orden del documento define el recorrido de las flechas y el indicador de puntos. Si agregas una sección, incorpora también su etiqueta en `sectionNames` dentro de `script.js`.

### Apariencia

Los colores, curvas de animación y alturas del encabezado están definidos como variables en `:root` (`styles.css`). Cuando cambies `styles.css` o `script.js`, sube su número de versión (`?v=`) en `index.html` para que los navegadores no usen una copia en caché.

## Verificación realizada

Revisado en navegador (Chromium):

- **Tamaños de pantalla:** 320, 360, 390, 414, 768, 820, 1024, 1280, 1440 y 1920 px de ancho, y celular en horizontal (844×390). En todos: sin scroll horizontal, sin elementos fuera de pantalla y sin superposición en el encabezado.
- **Consola:** sin errores.
- **Calidad del HTML:** sin IDs duplicados; todas las imágenes tienen texto alternativo y dimensiones; los enlaces externos llevan `rel="noopener"`.
- **Contraste:** todos los textos sobre fondos sólidos cumplen AA. Los textos sobre fotografías no se midieron automáticamente.
- **Interacciones:**
  - Modal de servicios en sus tres variantes, con desplazamiento interno y botón de cerrar fijo en el celular.
  - Visor de fotos con botones, miniaturas, gesto de deslizar y clics rápidos seguidos.
  - Menú móvil, encabezado que se oculta, preguntas frecuentes y desplazamiento de las flechas.

- **Zoom del visor:** el primer cuadro coincide exactamente con cada tarjeta (0 px de diferencia) en escritorio y celular. Se probaron también el cierre con X y con Escape, el cierre tras cambiar de foto y la reapertura sin residuos.
- **Historia y documentos:**
  - Los enlaces del menú, del pie y de las flechas flotantes llevan a sus secciones.
  - Los 22 archivos responden como PDF en el servidor local, "Ver" abre en una pestaña nueva y "Descargar" tiene el atributo `download`.
  - Se probaron los filtros por categoría, la búsqueda sin tildes, el estado vacío con su botón para volver a ver todos, y ampliar y contraer la lista.
  - Sin desbordes de 320 a 1440 px; el menú en línea cabe desde 1101 px.

La preferencia `prefers-reduced-motion` no se pudo emular en el navegador de pruebas; su tratamiento se revisó en el código. Lo propio del tacto (hover pegado, destello al tocar, respuesta al presionar, barra del navegador) no se reproduce en la emulación de escritorio: conviene confirmarlo en un celular real.
