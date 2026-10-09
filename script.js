'use strict';

/* ===== Configuración compartida ===== */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('header');
const menu = document.querySelector('#menu');
const menuToggle = document.querySelector('.menu-toggle');

/* ===== Menú móvil ===== */
function closeMenu() {
  menu.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menú');
}
menuToggle.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('click', event => {
  if (!header.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.classList.contains('open')) {
    closeMenu();
    menuToggle.focus();
  }
});
// El menú desplegable se usa hasta 1100 px (styles.css); al pasar a pantalla amplia se cierra.
window.matchMedia('(min-width: 1101px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

/* ===== Ciclo de vida de los dialogs: apertura y cierre animado ===== */
const dialogOpeners = new WeakMap();
const closeHooks = new WeakMap(); // Animaciones extra que un dialog ejecuta justo antes de cerrarse.

function openDialog(dialog, opener) {
  dialogOpeners.set(dialog, opener);
  dialog.classList.remove('is-closing');
  dialog.showModal(); // El dialog nativo contiene el foco y soporta Escape.
  document.body.classList.add('dialog-open');
}

function closeDialogAnimated(dialog) {
  if (!dialog.open || dialog.classList.contains('is-closing')) return;
  if (reducedMotion.matches) {
    dialog.close();
    return;
  }
  closeHooks.get(dialog)?.();
  dialog.classList.add('is-closing');
  const onAnimationEnd = (event) => {
    if (event.target !== dialog) return;
    dialog.classList.remove('is-closing');
    dialog.removeEventListener('animationend', onAnimationEnd);
    dialog.close();
  };
  dialog.addEventListener('animationend', onAnimationEnd);
}

function bindDialog(dialog) {
  dialog.querySelector('.close-dialog')?.addEventListener('click', () => closeDialogAnimated(dialog));

  // Interceptar tecla Escape para salida suave animada
  dialog.addEventListener('cancel', event => {
    if (!reducedMotion.matches && !dialog.classList.contains('is-closing')) {
      event.preventDefault();
      closeDialogAnimated(dialog);
    }
  });

  // El visor ocupa toda la pantalla: ahí cuenta como "fuera" cualquier zona vacía alrededor de la foto.
  const fullscreen = dialog.classList.contains('lightbox');
  const isOutside = event => {
    if (fullscreen) return event.target === dialog || event.target.classList.contains('lightbox-stage');
    const rect = dialog.getBoundingClientRect();
    return event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom);
  };
  let startedOutside = false;
  dialog.addEventListener('pointerdown', event => {
    startedOutside = isOutside(event);
  });
  dialog.addEventListener('click', event => {
    if (startedOutside && isOutside(event)) {
      closeDialogAnimated(dialog);
    }
    startedOutside = false;
  });
  dialog.addEventListener('close', () => {
    dialog.classList.remove('is-closing');
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open');
    dialogOpeners.get(dialog)?.focus({ preventScroll: true });
  });
}
document.querySelectorAll('dialog').forEach(bindDialog);

/* ===== Efecto Spotlight / Glow interactivo en tarjetas de servicios ===== */
const serviceCards = document.querySelectorAll('.service-card');
serviceCards.forEach(card => {
  card.addEventListener('pointermove', event => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });
});

/* ===== Botones de acción: una luz suave sigue al cursor sobre su superficie ===== */
document.querySelectorAll('.button').forEach(button => {
  button.addEventListener('pointermove', event => {
    const rect = button.getBoundingClientRect();
    button.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    button.style.setProperty('--my', `${event.clientY - rect.top}px`);
  });
});

/* ===== Detalles de los servicios: el botón de cada fila cubre toda su superficie ===== */
const serviceDialog = document.querySelector('#service-dialog');
const serviceTitle = document.querySelector('#service-title');
const serviceContent = document.querySelector('#service-content');
const serviceIcon = document.querySelector('#service-icon');
const serviceWhatsapp = document.querySelector('#service-whatsapp');

document.querySelectorAll('.service-card[data-service]').forEach(card => {
  const trigger = card.querySelector('.service-arrow');
  trigger.addEventListener('click', () => {
    const template = document.querySelector('#details-' + card.dataset.service);
    if (!template) return;
    const title = card.querySelector('h3').textContent.trim();
    serviceTitle.textContent = title;
    serviceContent.replaceChildren(template.content.cloneNode(true));
    serviceIcon.replaceChildren(card.querySelector('.service-icon svg').cloneNode(true));
    serviceWhatsapp.href = 'https://wa.me/573167846946?text=' +
      encodeURIComponent('Hola, quisiera información sobre el servicio de ' + title.toLowerCase() + '.');
    openDialog(serviceDialog, trigger);
  });
});

/* ===== Galería: cambio de foto con desenfoque según la dirección y gesto de deslizar ===== */
const lightbox = document.querySelector('#lightbox');
const lightboxImage = lightbox.querySelector('.lightbox-stage img');
const lightboxThumbs = lightbox.querySelector('.lightbox-thumbs');
const galleryItems = [...document.querySelectorAll('[data-image]')];
let currentPhoto = 0;
let photoTimer;
let photoToken = 0;

// Miniaturas: usan la variante más liviana de cada foto y solo cargan cuando se abre el visor.
galleryItems.forEach((item, index) => {
  const original = item.querySelector('img');
  const thumb = document.createElement('button');
  thumb.type = 'button';
  thumb.setAttribute('aria-label', 'Ver ' + item.querySelector('b').textContent.toLowerCase());
  const image = document.createElement('img');
  image.src = original.srcset ? original.srcset.split(',')[0].trim().split(' ')[0] : original.src;
  image.alt = '';
  image.loading = 'lazy';
  image.width = 96;
  image.height = 64;
  thumb.append(image);
  thumb.addEventListener('click', () => {
    if (index !== currentPhoto) showPhoto(index, index > currentPhoto ? 1 : -1);
  });
  lightboxThumbs.append(thumb);
});

// preview: al abrir, muestra primero la foto que la galería ya tiene en caché (así el zoom nunca
// anima un cuadro vacío) y la cambia por la de mayor resolución en cuanto está decodificada.
function applyPhoto(index, preview = false) {
  const button = galleryItems[index];
  const original = button.querySelector('img');
  if (preview && original.currentSrc) {
    lightboxImage.removeAttribute('srcset');
    lightboxImage.src = original.currentSrc;
    const hiRes = new Image();
    hiRes.sizes = lightboxImage.sizes;
    hiRes.srcset = original.srcset;
    hiRes.src = button.dataset.image;
    hiRes.decode().then(() => {
      if (currentPhoto !== index || !lightbox.open) return;
      lightboxImage.srcset = original.srcset;
      lightboxImage.src = button.dataset.image;
    }, () => {});
  } else {
    lightboxImage.srcset = original.srcset; // En móvil reutiliza la variante que ya cargó la galería.
    lightboxImage.src = button.dataset.image;
  }
  lightboxImage.alt = original.alt;
  lightboxImage.width = Number(original.getAttribute('width'));
  lightboxImage.height = Number(original.getAttribute('height'));
  document.querySelector('#photo-caption').textContent = button.dataset.caption;
  document.querySelector('#photo-count').textContent = `${index + 1} / ${galleryItems.length}`;
  [...lightboxThumbs.children].forEach((thumb, i) => thumb.setAttribute('aria-current', String(i === index)));
}

// direction: 1 siguiente, -1 anterior, 0 sin transición (al abrir o con el teclado).
function showPhoto(index, direction = 0, preview = false) {
  currentPhoto = (index + galleryItems.length) % galleryItems.length;
  const token = ++photoToken;
  window.clearTimeout(photoTimer);
  if (!direction || reducedMotion.matches) {
    lightboxImage.classList.remove('is-leaving', 'is-entering');
    applyPhoto(currentPhoto, preview);
    return;
  }
  // La foto sale hacia un lado; la nueva entra desde el contrario cuando ya está decodificada.
  lightboxImage.style.setProperty('--dir', direction);
  lightboxImage.classList.add('is-leaving');
  photoTimer = window.setTimeout(() => {
    applyPhoto(currentPhoto);
    const enter = () => {
      if (token !== photoToken) return;
      lightboxImage.classList.add('is-entering');
      lightboxImage.classList.remove('is-leaving');
      void lightboxImage.offsetWidth; // Fija el punto de partida antes de animar la entrada.
      lightboxImage.classList.remove('is-entering');
    };
    lightboxImage.decode().then(enter, enter);
  }, 150);
}
// Zoom desde la tarjeta: calcula la transformación que hace coincidir la foto del visor con la
// tarjeta de la galería (como object-fit: cover) y el recorte que oculta lo que la tarjeta no muestra.
const zoomEasing = 'cubic-bezier(0.32, 0.72, 0, 1)';
function cardFrame(card) {
  const c = card.getBoundingClientRect();
  const f = lightboxImage.getBoundingClientRect();
  if (!f.width || !f.height) return null;
  const scale = Math.max(c.width / f.width, c.height / f.height);
  const dx = (c.left + c.width / 2) - (f.left + f.width / 2);
  const dy = (c.top + c.height / 2) - (f.top + f.height / 2);
  const insetX = Math.max(0, (f.width - c.width / scale) / 2);
  const insetY = Math.max(0, (f.height - c.height / scale) / 2);
  const radius = parseFloat(getComputedStyle(card).borderTopLeftRadius) / scale;
  return {
    transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
    clipPath: `inset(${insetY}px ${insetX}px round ${radius}px)`
  };
}
// Estado final: sin transformación y con el recorte ampliado para no cortar la sombra de la foto.
const openFrame = () => ({ transform: 'none', clipPath: `inset(-80px round ${getComputedStyle(lightboxImage).borderTopLeftRadius})` });

galleryItems.forEach((button, index) => button.addEventListener('click', () => {
  const zoom = !reducedMotion.matches;
  showPhoto(index, 0, zoom);
  lightbox.classList.toggle('is-zooming', zoom);
  openDialog(lightbox, button);
  if (!zoom) return;
  lightboxImage.getAnimations().forEach(animation => animation.cancel());
  const frame = cardFrame(button);
  if (frame) lightboxImage.animate([frame, openFrame()], { duration: 540, easing: zoomEasing });
}));
// Al cerrar, la foto vuelve a su tarjeta mientras el fondo se desvanece. Si la tarjeta no está a la vista,
// el visor simplemente se funde.
closeHooks.set(lightbox, () => {
  if (!lightbox.classList.contains('is-zooming')) return;
  const card = galleryItems[currentPhoto];
  const rect = card.getBoundingClientRect();
  if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
    lightbox.classList.remove('is-zooming');
    return;
  }
  lightboxImage.getAnimations().forEach(animation => animation.cancel());
  const frame = cardFrame(card);
  if (frame) lightboxImage.animate([openFrame(), frame], { duration: 420, easing: zoomEasing, fill: 'forwards' });
});
lightbox.addEventListener('close', () => {
  lightboxImage.getAnimations().forEach(animation => animation.cancel());
  lightboxImage.classList.remove('is-leaving', 'is-entering');
  lightbox.classList.remove('is-zooming');
});
lightbox.querySelector('.photo-prev').addEventListener('click', () => showPhoto(currentPhoto - 1, -1));
lightbox.querySelector('.photo-next').addEventListener('click', () => showPhoto(currentPhoto + 1, 1));
lightbox.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(currentPhoto - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(currentPhoto + 1); }
});

// Deslizar en pantallas táctiles: basta con un gesto rápido, no hace falta recorrer mucha distancia.
let swipe = null;
lightboxImage.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse') return;
  swipe = { x: event.clientX, y: event.clientY, time: performance.now() };
});
lightboxImage.addEventListener('pointerup', event => {
  if (!swipe) return;
  const dx = event.clientX - swipe.x;
  const dy = event.clientY - swipe.y;
  const velocity = Math.abs(dx) / Math.max(1, performance.now() - swipe.time);
  swipe = null;
  if (Math.abs(dx) < Math.abs(dy)) return;
  if (Math.abs(dx) > 50 || (Math.abs(dx) > 20 && velocity > 0.4)) {
    const direction = dx < 0 ? 1 : -1;
    showPhoto(currentPhoto + direction, direction);
  }
});
lightboxImage.addEventListener('pointercancel', () => { swipe = null; });

/* ===== Navegación flotante por secciones (Pill widget con tooltips) ===== */
const sections = [...document.querySelectorAll('[data-section]')];
const upButton = document.querySelector('#section-up');
const downButton = document.querySelector('#section-down');
const navLinks = [...menu.querySelectorAll('a[href^="#"]')];
const sectionNames = {
  inicio: 'Inicio',
  servicios: 'Nuestros servicios',
  nosotros: 'Quiénes somos',
  historia: 'Nuestra historia',
  instalaciones: 'Instalaciones',
  documentos: 'Documentos',
  contacto: 'Contacto',
  preguntas: 'Preguntas frecuentes',
  'pie-pagina': 'Pie de página'
};
const sectionDots = document.querySelector('.section-dots');
sections.forEach(() => sectionDots.append(document.createElement('i')));
let currentSection = 0;
let pendingSection = null;
let pendingTimer;
let frameRequested = false;

// Función pura: permite comprobar límites y secciones sin depender del DOM.
function findSectionIndex(tops, readingLine, atBottom) {
  if (atBottom) return Math.max(0, tops.length - 1);
  let index = 0;
  tops.forEach((top, position) => { if (top <= readingLine) index = position; });
  return index;
}
// En pantallas pequeñas el header se esconde al bajar y vuelve al subir, para dejar más espacio al contenido.
const compactScreen = window.matchMedia('(max-width: 760px), (max-height: 500px)');
let lastScrollY = window.scrollY;
function updateHeaderVisibility() {
  const y = window.scrollY;
  const delta = y - lastScrollY;
  if (!compactScreen.matches || menu.classList.contains('open') || header.querySelector(':focus-visible') || y < 160) {
    header.classList.remove('is-hidden');
  } else if (delta > 6) {
    header.classList.add('is-hidden');
  } else if (delta < -6) {
    header.classList.remove('is-hidden');
  }
  if (Math.abs(delta) > 6) lastScrollY = y;
}
header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

function updatePagePosition() {
  header.classList.toggle('scrolled', window.scrollY > 24);
  updateHeaderVisibility();
  const readingLine = header.offsetHeight + Math.min(window.innerHeight * 0.2, 160);
  const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3;
  currentSection = findSectionIndex(sections.map(section => section.getBoundingClientRect().top), readingLine, atBottom);
  upButton.hidden = currentSection === 0;
  downButton.hidden = currentSection === sections.length - 1;
  [upButton, downButton].forEach((button, index) => {
    const target = sections[currentSection + (index === 0 ? -1 : 1)];
    if (target) {
      const sectionLabel = sectionNames[target.id] || target.id;
      const label = `Ir a ${sectionLabel}`;
      button.setAttribute('aria-label', label);
      button.removeAttribute('title'); // Evita conflicto con el tooltip del navegador
      const tooltip = button.querySelector('.nav-tooltip');
      if (tooltip) tooltip.textContent = label;
    }
  });
  navLinks.forEach(link => {
    if (link.hash === '#' + sections[currentSection].id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  [...sectionDots.children].forEach((dot, index) => dot.classList.toggle('is-active', index === currentSection));
  // Si el botón activo desaparece al llegar a un extremo, conserva un foco útil.
  if (document.activeElement === upButton && upButton.hidden) downButton.focus({ preventScroll: true });
  if (document.activeElement === downButton && downButton.hidden) upButton.focus({ preventScroll: true });
  frameRequested = false;
}
function requestPositionUpdate() {
  if (!frameRequested) { frameRequested = true; window.requestAnimationFrame(updatePagePosition); }
}
function clearPendingSection() {
  pendingSection = null;
  window.clearTimeout(pendingTimer);
}
// Desplazamiento propio entre secciones: acelera y frena con suavidad, y su duración crece
// con la distancia dentro de un rango cómodo (ni brusco ni lento).
let scrollFrame = null;
function stopSmoothScroll() {
  if (scrollFrame !== null) { window.cancelAnimationFrame(scrollFrame); scrollFrame = null; }
}
function smoothScrollTo(targetY, done) {
  stopSmoothScroll();
  const startY = window.scrollY;
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  const distance = Math.max(0, Math.min(targetY, maxY)) - startY;
  if (reducedMotion.matches || Math.abs(distance) < 2) {
    window.scrollTo({ top: startY + distance, behavior: 'instant' });
    done?.();
    return;
  }
  const duration = Math.min(1150, Math.max(600, Math.abs(distance) * 0.5));
  const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const startTime = performance.now();
  const step = now => {
    const progress = Math.min(1, (now - startTime) / duration);
    window.scrollTo({ top: startY + distance * easeInOutCubic(progress), behavior: 'instant' });
    if (progress < 1) scrollFrame = window.requestAnimationFrame(step);
    else { scrollFrame = null; done?.(); }
  };
  scrollFrame = window.requestAnimationFrame(step);
}
function moveSection(direction) {
  updatePagePosition();
  const origin = pendingSection ?? currentSection;
  const targetIndex = Math.max(0, Math.min(sections.length - 1, origin + direction));
  pendingSection = targetIndex;
  const scrollPadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const targetY = targetIndex === 0 ? 0 : sections[targetIndex].getBoundingClientRect().top + window.scrollY - scrollPadding;
  smoothScrollTo(targetY, clearPendingSection);
  window.clearTimeout(pendingTimer);
  pendingTimer = window.setTimeout(clearPendingSection, 1400);
}
upButton.addEventListener('click', () => moveSection(-1));
downButton.addEventListener('click', () => moveSection(1));
// Si la persona toma el control (rueda, toque o teclado fuera de las flechas), el desplazamiento automático cede.
const yieldScroll = event => {
  if (event.type === 'keydown' && event.target.closest?.('.section-navigation')) return;
  stopSmoothScroll();
  clearPendingSection();
};
['wheel', 'touchstart', 'keydown'].forEach(type => window.addEventListener(type, yieldScroll, { passive: true }));
window.addEventListener('scroll', requestPositionUpdate, { passive: true });
window.addEventListener('resize', requestPositionUpdate, { passive: true });
window.addEventListener('load', requestPositionUpdate, { once: true });
document.fonts?.ready.then(requestPositionUpdate);
updatePagePosition();

/* ===== Nuestra historia: la línea de tiempo se llena como agua que avanza con el scroll ===== */
(() => {
  const wrap = document.querySelector('.timeline-wrap');
  if (!wrap) return;
  const rail = wrap.querySelector('.timeline-rail');
  const fill = wrap.querySelector('.timeline-fill');
  const drop = wrap.querySelector('.timeline-drop');
  const items = [...wrap.querySelectorAll('.timeline-item')];
  const READING_LINE = 0.6; // Un punto se activa cuando cruza el 60 % de la altura de la pantalla.
  let anchors = [];
  let start = 0;
  let length = 0;
  let frame = null;
  let lastCurrent = -1;

  // Centro vertical de cada punto dentro del contenedor; el carril va del primero al último.
  function measure() {
    anchors = items.map(item => {
      const dot = getComputedStyle(item, '::before');
      return item.offsetTop + parseFloat(dot.top) + parseFloat(dot.height) / 2;
    });
    start = anchors[0];
    length = anchors[anchors.length - 1] - start;
    rail.style.top = `${start}px`;
    rail.style.bottom = 'auto';
    rail.style.height = `${length}px`;
    update();
  }

  // Las cifras cuentan desde cero la primera vez que su acontecimiento se activa.
  function countUp(item) {
    item.querySelectorAll('[data-count]').forEach(number => {
      if (number.dataset.counted || reducedMotion.matches) return;
      number.dataset.counted = 'true';
      const target = Number(number.dataset.count);
      number.style.minWidth = `${number.getBoundingClientRect().width}px`; // Ancho del valor final.
      const startTime = performance.now();
      const step = now => {
        const progress = Math.min(1, (now - startTime) / 1100);
        number.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    });
  }

  // Al alcanzar un punto: onda desde el punto, cifras que cuentan y, en el hito, un destello.
  function arrive(item) {
    if (reducedMotion.matches) return;
    item.classList.remove('is-pulsing');
    void item.offsetWidth; // Reinicia la onda si el punto se vuelve a alcanzar.
    item.classList.add('is-pulsing');
    countUp(item);
    if (item.classList.contains('is-milestone')) item.classList.add('is-celebrating');
  }

  function update() {
    frame = null;
    const reached = window.innerHeight * READING_LINE - wrap.getBoundingClientRect().top;
    const progress = length ? Math.min(1, Math.max(0, (reached - start) / length)) : 0;
    fill.style.transform = `scaleY(${progress})`;
    drop.style.transform = `translate(-50%, ${progress * length}px)`;
    drop.classList.toggle('is-visible', progress > 0.005 && progress < 0.995);
    let current = -1;
    items.forEach((item, index) => {
      const isReached = anchors[index] <= reached + 0.5;
      item.classList.toggle('is-reached', isReached);
      if (isReached) current = index;
    });
    items.forEach((item, index) => item.classList.toggle('is-current', index === current));
    // Solo hay onda al avanzar hacia abajo, no al regresar.
    if (current > lastCurrent) items.slice(lastCurrent + 1, current + 1).forEach(arrive);
    lastCurrent = current;
  }

  const requestUpdate = () => { if (!frame) frame = window.requestAnimationFrame(update); };
  items.forEach(item => item.addEventListener('animationend', event => {
    if (event.pseudoElement === '::after') item.classList.remove('is-pulsing');
  }));
  window.addEventListener('scroll', requestUpdate, { passive: true });
  // Cualquier cambio de tamaño de la línea (fuentes, ancho de pantalla, textos) vuelve a medir el carril.
  if ('ResizeObserver' in window) new ResizeObserver(() => measure()).observe(wrap.querySelector('.timeline'));
  else window.addEventListener('resize', () => window.requestAnimationFrame(measure), { passive: true });
  window.addEventListener('load', measure, { once: true });
  document.fonts?.ready.then(measure);
  measure();
})();

/* ===== Documentos y Transparencia: biblioteca generada desde documentos/registro.js ===== */
(() => {
  const list = document.querySelector('#doc-list');
  if (!list) return;
  const registry = Array.isArray(window.CORPOGUEPSA_DOCUMENTOS) ? window.CORPOGUEPSA_DOCUMENTOS : [];
  const categories = window.CORPOGUEPSA_CATEGORIAS || {};
  const search = document.querySelector('#doc-search');
  const filters = document.querySelector('.doc-filters');
  const count = document.querySelector('#doc-count');
  const empty = document.querySelector('#doc-empty');
  const more = document.querySelector('#doc-more');
  const INITIAL = 8; // Sin filtros se muestran los más recientes; el resto con "Ver todos".
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const FORMATS = { pdf: 'PDF', doc: 'Word', docx: 'Word', xls: 'Excel', xlsx: 'Excel', csv: 'CSV', ppt: 'PowerPoint', pptx: 'PowerPoint', jpg: 'imagen', jpeg: 'imagen', png: 'imagen', zip: 'ZIP' };
  const FILE_ICON = '<svg viewBox="0 0 32 40" aria-hidden="true"><path d="M7 1.5h13l10.5 10.5v22.5a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-29a4 4 0 0 1 4-4Z"/><path d="M20 1.5V9a3 3 0 0 0 3 3h7.5"/></svg>';
  const VIEW_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg>';
  const DOWNLOAD_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>';

  const normalize = text => String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const extensionOf = file => (file.split(/[?#]/)[0].split('.').pop() || '').toLowerCase();
  const formatDate = value => {
    const [year, month, day] = String(value || '').split('-').map(Number);
    if (!year) return '';
    if (!month) return String(year);
    return (day ? `${day} de ` : '') + `${MONTHS[month - 1]} de ${year}`;
  };

  // Más recientes primero; los que no tienen fecha van al final.
  const items = registry
    .filter(doc => doc && doc.titulo && doc.archivo)
    .map(doc => ({ ...doc, ext: extensionOf(doc.archivo), key: normalize(`${doc.titulo} ${categories[doc.categoria] || ''}`) }))
    .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')) || a.titulo.localeCompare(b.titulo, 'es'));

  let category = 'todos';
  let expanded = false;

  // Filtros por categoría (solo las que tienen documentos), cada uno con su cantidad.
  const usedCategories = Object.keys(categories).filter(key => items.some(doc => doc.categoria === key));
  const addFilter = (key, label, total) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'doc-filter';
    button.dataset.category = key;
    button.append(Object.assign(document.createElement('span'), { textContent: label }), Object.assign(document.createElement('b'), { textContent: total }));
    button.addEventListener('click', () => { category = key; expanded = false; render(true); });
    filters.append(button);
  };
  if (usedCategories.length > 1) {
    addFilter('todos', 'Todos', items.length);
    usedCategories.forEach(key => addFilter(key, categories[key], items.filter(doc => doc.categoria === key).length));
  } else {
    filters.hidden = true;
  }

  const buildCard = (doc, index) => {
    const format = FORMATS[doc.ext] || doc.ext.toUpperCase() || 'archivo';
    const date = formatDate(doc.fecha);
    const card = document.createElement('li');
    card.className = 'doc-card';
    card.style.setProperty('--i', index);
    card.innerHTML = `
      <span class="doc-icon" aria-hidden="true">${FILE_ICON}<b></b></span>
      <div class="doc-info">
        <span class="doc-category"></span>
        <h3 class="doc-title"></h3>
        <p class="doc-meta"></p>
      </div>
      <div class="doc-actions">
        <a class="doc-view" target="_blank" rel="noopener">${VIEW_ICON}<span>Ver</span></a>
        <a class="doc-download">${DOWNLOAD_ICON}<span class="sr-only">Descargar</span></a>
      </div>`;
    card.querySelector('.doc-icon').dataset.format = doc.ext;
    card.querySelector('.doc-icon b').textContent = doc.ext.toUpperCase().slice(0, 4);
    card.querySelector('.doc-category').textContent = categories[doc.categoria] || 'Documento';
    card.querySelector('.doc-title').textContent = doc.titulo;
    // El formato ya se ve en el ícono; aquí van la fecha de publicación y el peso del archivo.
    const meta = card.querySelector('.doc-meta');
    if (date) {
      const published = Object.assign(document.createElement('span'), { textContent: 'Publicado en ' });
      published.append(Object.assign(document.createElement('time'), { dateTime: doc.fecha, textContent: date }));
      meta.append(published);
    }
    if (doc.tamano) meta.append(Object.assign(document.createElement('span'), { textContent: doc.tamano }));
    const view = card.querySelector('.doc-view');
    view.href = doc.archivo;
    view.setAttribute('aria-label', `Ver ${doc.titulo} (${format}, se abre en una pestaña nueva)`);
    const download = card.querySelector('.doc-download');
    download.href = doc.archivo;
    download.setAttribute('download', doc.archivo.split('/').pop());
    download.setAttribute('aria-label', `Descargar ${doc.titulo} (${[format, doc.tamano].filter(Boolean).join(', ')})`);
    download.title = 'Descargar';
    return card;
  };

  function render(animate = false) {
    const raw = search.value.trim();
    const query = normalize(raw);
    const filtering = category !== 'todos' || query !== '';
    const matches = items.filter(doc => (category === 'todos' || doc.categoria === category) && (!query || doc.key.includes(query)));
    const visible = filtering || expanded ? matches : matches.slice(0, INITIAL);

    list.classList.toggle('is-animating', animate && !reducedMotion.matches);
    list.replaceChildren(...visible.map(buildCard));
    filters.querySelectorAll('.doc-filter').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));

    const noun = total => `${total} ${total === 1 ? 'documento' : 'documentos'}`;
    count.textContent = !items.length ? '' : filtering ? `${matches.length === 1 ? 'Se encontró' : 'Se encontraron'} ${noun(matches.length)} de ${items.length}` : `${noun(items.length)} disponibles`;

    empty.hidden = matches.length > 0;
    if (!matches.length) {
      empty.querySelector('p').textContent = !items.length
        ? 'Muy pronto publicaremos aquí los documentos institucionales de Corpoguepsa.'
        : query ? `No encontramos documentos con «${raw}». Prueba con otra palabra o revisa otra categoría.` : 'Aún no hay documentos en esta categoría.';
      empty.querySelector('.doc-reset').hidden = !items.length;
    }

    more.hidden = filtering || matches.length <= INITIAL;
    more.textContent = expanded ? 'Mostrar menos' : `Ver los ${items.length} documentos`;
    more.setAttribute('aria-expanded', String(expanded));
  }

  search.addEventListener('input', () => render(false));
  empty.querySelector('.doc-reset').addEventListener('click', () => {
    search.value = '';
    category = 'todos';
    render(true);
    search.focus();
  });
  more.addEventListener('click', () => {
    expanded = !expanded;
    render(expanded);
    // Al contraer, si la lista quedó por encima de la pantalla, vuelve al inicio de la sección.
    if (!expanded && list.getBoundingClientRect().bottom < 0) {
      const section = document.querySelector('#documentos');
      const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      smoothScrollTo(section.getBoundingClientRect().top + window.scrollY - padding);
    }
  });
  render(false);
})();

/* ===== Acordeón FAQ fluido sin saltos de pantalla (Web Animations API) ===== */
class SmoothAccordion {
  constructor(el) {
    this.el = el;
    this.summary = el.querySelector('summary');
    this.content = el.querySelector('.faq-content') || el.querySelector('p');
    this.animation = null;
    this.isClosing = false;
    this.isExpanding = false;
    this.summary.addEventListener('click', (e) => this.onClick(e));
  }

  onClick(e) {
    if (reducedMotion.matches) return;
    e.preventDefault();
    this.el.style.overflow = 'hidden';
    if (this.isClosing || !this.el.open) {
      this.open();
    } else if (this.isExpanding || this.el.open) {
      this.shrink();
    }
  }

  shrink() {
    this.isClosing = true;
    this.el.classList.add('is-closing'); // La respuesta se desvanece mientras el panel se cierra.
    const startHeight = `${this.el.offsetHeight}px`;
    // Calculamos la altura colapsada exacta
    this.el.open = false;
    const endHeight = `${this.el.offsetHeight}px`;
    this.el.open = true;

    if (this.animation) this.animation.cancel();

    this.animation = this.el.animate({
      height: [startHeight, endHeight]
    }, {
      duration: 240,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
    });

    this.animation.onfinish = () => this.onAnimationFinish(false);
    this.animation.oncancel = () => { this.isClosing = false; };
  }

  open() {
    this.el.classList.remove('is-closing');
    this.el.style.height = `${this.el.offsetHeight}px`;
    this.el.open = true;
    window.requestAnimationFrame(() => this.expand());
  }

  expand() {
    this.isExpanding = true;
    const startHeight = `${this.el.offsetHeight}px`;
    const endHeight = `${this.el.scrollHeight}px`;

    if (this.animation) this.animation.cancel();

    this.animation = this.el.animate({
      height: [startHeight, endHeight]
    }, {
      duration: 280,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
    });

    this.animation.onfinish = () => this.onAnimationFinish(true);
    this.animation.oncancel = () => { this.isExpanding = false; };
  }

  onAnimationFinish(open) {
    this.el.open = open;
    this.el.classList.remove('is-closing');
    this.animation = null;
    this.isClosing = false;
    this.isExpanding = false;
    this.el.style.height = '';
    this.el.style.overflow = '';
  }
}
document.querySelectorAll('.questions details').forEach(details => new SmoothAccordion(details));

/* ===== Revelación con cascada; contenido visible si no hay soporte ===== */
const revealTargets = [...document.querySelectorAll(
  '.section-heading, .service-card, .about-images, .about-copy, .gallery-item, .contact-grid>div, .faq>div, .footer-main>*, ' +
  '.history-intro, .timeline-item, .history-source, .doc-toolbar, .doc-list'
)];
document.querySelectorAll('.service-list, .gallery, .about-grid, .contact-grid, .faq, .footer-main, .timeline').forEach(group => {
  [...group.children].forEach((child, index) => child.style.setProperty('--reveal-delay', `${index * 90}ms`));
});
let revealObserver;
function configureReveal() {
  revealObserver?.disconnect();
  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    revealTargets.forEach(element => element.classList.remove('reveal', 'visible'));
    return;
  }
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06 });
  revealTargets.forEach(element => {
    element.classList.add('reveal');
    if (!element.classList.contains('visible')) revealObserver.observe(element);
  });
}
configureReveal();
reducedMotion.addEventListener('change', configureReveal);
document.querySelector('#year').textContent = new Date().getFullYear();
