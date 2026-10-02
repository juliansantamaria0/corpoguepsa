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

  const isOutside = event => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };
  let startedOutside = false;
  dialog.addEventListener('pointerdown', event => {
    startedOutside = event.target === dialog && isOutside(event);
  });
  dialog.addEventListener('click', event => {
    if (startedOutside && event.target === dialog && isOutside(event)) {
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

/* ===== Detalles de los servicios: clic en cualquier parte de la tarjeta ===== */
const serviceDialog = document.querySelector('#service-dialog');
const serviceTitle = document.querySelector('#service-title');
const serviceContent = document.querySelector('#service-content');
const serviceIcon = document.querySelector('#service-icon');
const serviceWhatsapp = document.querySelector('#service-whatsapp');

document.querySelectorAll('.service-card[data-service]').forEach(card => {
  const triggerService = () => {
    const template = document.querySelector('#details-' + card.dataset.service);
    if (!template) return;
    const title = card.querySelector('h3').textContent.trim();
    serviceTitle.textContent = title;
    serviceContent.replaceChildren(template.content.cloneNode(true));
    serviceIcon.replaceChildren(card.querySelector('.card-top svg').cloneNode(true));
    serviceWhatsapp.href = 'https://wa.me/573167846946?text=' +
      encodeURIComponent('Hola, quisiera información sobre el servicio de ' + title.toLowerCase() + '.');
    openDialog(serviceDialog, card);
  };

  card.addEventListener('click', triggerService);
  card.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      triggerService();
    }
  });
});

/* ===== Galería con transición suave y zoom refinado ===== */
const lightbox = document.querySelector('#lightbox');
const galleryItems = [...document.querySelectorAll('[data-image]')];
let currentPhoto = 0;
function showPhoto(index) {
  currentPhoto = (index + galleryItems.length) % galleryItems.length;
  const button = galleryItems[currentPhoto];
  const original = button.querySelector('img');
  const target = lightbox.querySelector('img');
  target.style.opacity = '0.35';
  target.src = button.dataset.image;
  target.alt = original.alt;
  target.width = Number(original.getAttribute('width'));
  target.height = Number(original.getAttribute('height'));
  target.onload = () => { target.style.opacity = '1'; };
  if (target.complete) target.style.opacity = '1';
  document.querySelector('#photo-caption').textContent = button.dataset.caption;
  document.querySelector('#photo-count').textContent = `${currentPhoto + 1} / ${galleryItems.length}`;
}
galleryItems.forEach((button, index) => button.addEventListener('click', () => {
  showPhoto(index);
  openDialog(lightbox, button);
}));
lightbox.querySelector('.photo-prev').addEventListener('click', () => showPhoto(currentPhoto - 1));
lightbox.querySelector('.photo-next').addEventListener('click', () => showPhoto(currentPhoto + 1));
lightbox.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(currentPhoto - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(currentPhoto + 1); }
});

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
function updatePagePosition() {
  header.classList.toggle('scrolled', window.scrollY > 24);
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
function moveSection(direction) {
  updatePagePosition();
  const origin = pendingSection ?? currentSection;
  const targetIndex = Math.max(0, Math.min(sections.length - 1, origin + direction));
  pendingSection = targetIndex;
  sections[targetIndex].scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  window.clearTimeout(pendingTimer);
  pendingTimer = window.setTimeout(clearPendingSection, 1200);
}
upButton.addEventListener('click', () => moveSection(-1));
downButton.addEventListener('click', () => moveSection(1));
window.addEventListener('scroll', requestPositionUpdate, { passive: true });
window.addEventListener('resize', requestPositionUpdate, { passive: true });
window.addEventListener('scrollend', clearPendingSection);
window.addEventListener('wheel', clearPendingSection, { passive: true });
window.addEventListener('touchstart', clearPendingSection, { passive: true });
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
  '.section-heading, .service-card, .about-images, .about-copy, .gallery-item, .contact-grid>div, .faq>div'
)];
document.querySelectorAll('.service-grid, .gallery, .about-grid, .contact-grid, .faq').forEach(group => {
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
