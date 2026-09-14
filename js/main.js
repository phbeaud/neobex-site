// Smooth scroll pour les ancres
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Hero slider (si présent)
const slides = document.querySelectorAll('.hero-slide');
if (slides.length > 0) {
  let currentSlide = 0;
  function nextSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  }
  setInterval(nextSlide, 5000);
}

// Compteurs animés (500+, 2000+, 15%) — le texte final reste en place sans JavaScript
const counters = document.querySelectorAll('[data-count]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (counters.length > 0 && !reduceMotion && 'IntersectionObserver' in window) {
  const formatCount = (el, value) => {
    const n = el.dataset.grouping ? value.toLocaleString('en-CA') : String(value);
    return n + (el.dataset.suffix || '');
  };
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1800;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatCount(el, Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // La vraie valeur reste affichée tant que la page n'est pas vue (robots, aperçus de liens)
      if (!entry.isIntersecting || document.visibilityState !== 'visible') return;
      counterObserver.unobserve(entry.target);
      entry.target.dataset.counted = 'true';
      entry.target.textContent = formatCount(entry.target, 0);
      // Laisse l'apparition du bloc de statistiques se terminer avant de compter
      setTimeout(() => animateCount(entry.target), 700);
    });
  }, { threshold: 0.3 });
  const observeCounters = () => counters.forEach(el => {
    if (el.dataset.counted) return;
    counterObserver.unobserve(el);
    counterObserver.observe(el);
  });
  counters.forEach(el => {
    el.style.fontVariantNumeric = 'tabular-nums';
    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    el.setAttribute('aria-label', el.textContent);
  });
  observeCounters();
  // Page ouverte en arrière-plan : on relance l'observation quand elle devient visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') observeCounters();
  }, { once: true });
}

// Dropdown menus
document.querySelectorAll('.nav-dropdown-toggle').forEach(toggle => {
  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    const dropdown = this.closest('.nav-dropdown');
    document.querySelectorAll('.nav-dropdown').forEach(d => {
      if (d !== dropdown) d.classList.remove('open');
    });
    dropdown.classList.toggle('open');
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
});

// Search overlay
const searchToggle = document.querySelector('.search-toggle');
const searchOverlay = document.querySelector('.search-overlay');
if (searchToggle && searchOverlay) {
  searchToggle.addEventListener('click', () => {
    searchOverlay.classList.add('open');
    const input = searchOverlay.querySelector('input');
    if (input) input.focus();
  });
  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) searchOverlay.classList.remove('open');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') searchOverlay.classList.remove('open');
  });
}

// Product filter tabs (page produits)
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', function () {
    const category = this.dataset.category;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');

    document.querySelectorAll('.product-category').forEach(cat => {
      if (category === 'all' || cat.dataset.category === category) {
        cat.style.display = '';
      } else {
        cat.style.display = 'none';
      }
    });

    if (category !== 'all') {
      const target = document.querySelector(`.product-category[data-category="${category}"]`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// FAQ accordion
document.querySelectorAll('.faq-question').forEach(question => {
  question.addEventListener('click', function () {
    const item = this.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    // Close all in same category
    item.closest('.faq-category').querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// Mobile menu toggle
const mobileToggle = document.querySelector('.mobile-menu-toggle');
const nav = document.querySelector('.nav');
if (mobileToggle && nav) {
  mobileToggle.addEventListener('click', () => {
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    nav.style.position = 'absolute';
    nav.style.top = '100px';
    nav.style.left = '0';
    nav.style.right = '0';
    nav.style.background = 'white';
    nav.style.flexDirection = 'column';
    nav.style.padding = '24px';
    nav.style.borderBottom = '1px solid var(--border)';
    nav.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
  });
}
