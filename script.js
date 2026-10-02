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
window.matchMedia('(min-width: 761px)').addEventListener('change', event => {
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
  instalaciones: 'Instalaciones',
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
  '.section-heading, .service-card, .about-images, .about-copy, .gallery-item, .contact-grid>div, .faq>div, .footer-main>*'
)];
document.querySelectorAll('.service-list, .gallery, .about-grid, .contact-grid, .faq, .footer-main').forEach(group => {
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
