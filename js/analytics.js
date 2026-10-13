// Mesure du site Neobex
// --------------------------------------------------------------------------
// Deux sources, indépendantes l'une de l'autre :
//   1. Vercel Web Analytics  — pages vues, provenance, appareils. Rien à
//      configurer ici : il suffit d'activer Analytics dans le projet Vercel.
//   2. Google Analytics 4    — entonnoir complet. Collez l'identifiant de
//      mesure (G-XXXXXXXXXX) ci-dessous pour l'activer.
// Tant que GA_MEASUREMENT_ID est vide, aucun script Google n'est chargé.

const GA_MEASUREMENT_ID = '';

(function () {
  'use strict';

  // ---- Vercel Web Analytics ----------------------------------------------
  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };
  const vercelScript = document.createElement('script');
  vercelScript.defer = true;
  vercelScript.src = '/_vercel/insights/script.js';
  document.head.appendChild(vercelScript);

  // ---- Google Analytics 4 -------------------------------------------------
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  if (GA_MEASUREMENT_ID) {
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(gaScript);

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      anonymize_ip: true,
      transport_type: 'beacon'
    });
  }

  // ---- Un seul point d'envoi pour les deux outils -------------------------
  const suivre = (nom, details) => {
    const data = details || {};
    if (GA_MEASUREMENT_ID) gtag('event', nom, data);
    window.va('event', { name: nom, data: data });
  };

  const page = location.pathname.replace(/\/$/, '') || '/';

  // ---- Conversions : les deux formulaires ---------------------------------
  document.querySelectorAll('form[action*="web3forms"], form[action*="formsubmit"]').forEach(form => {
    const estSoumission = /soumission|quote/.test(page);
    form.addEventListener('submit', () => {
      suivre(estSoumission ? 'demande_soumission' : 'message_contact', {
        page: page,
        categorie: (form.querySelector('[name="categorie"]') || {}).value || '',
        volume: (form.querySelector('[name="volume"]') || {}).value || ''
      });
    });
  });

  // ---- Micro-conversions : ce sur quoi on clique --------------------------
  document.addEventListener('click', (e) => {
    const lien = e.target.closest('a');
    if (!lien) return;
    const href = lien.getAttribute('href') || '';

    if (href.startsWith('tel:')) return suivre('clic_telephone', { page: page });
    if (href.startsWith('mailto:')) return suivre('clic_courriel', { page: page });
    if (href.includes('catalogue.neobex.ca')) return suivre('clic_catalogue', { page: page });
    if (href.includes('shop.neobex.ca')) return suivre('clic_boutique', { page: page });
    if (href.includes('shopify.com/authentication')) return suivre('clic_portail', { page: page });
    if (href === '/soumission' || href === '/en/quote') return suivre('clic_cta_soumission', { page: page });
  });

  // ---- Lecture réelle des pages de contenu --------------------------------
  // Un visiteur qui descend aux trois quarts d'un guide a lu, pas rebondi.
  if (/guide|fournisseur/.test(page) && 'IntersectionObserver' in window) {
    const repere = document.createElement('div');
    repere.setAttribute('aria-hidden', 'true');
    repere.style.cssText = 'position:absolute;top:75%;height:1px;width:1px;';
    document.body.style.position = document.body.style.position || 'relative';
    document.body.appendChild(repere);

    const observateur = new IntersectionObserver((entrees) => {
      entrees.forEach(entree => {
        if (!entree.isIntersecting) return;
        observateur.disconnect();
        suivre('lecture_75', { page: page });
      });
    });
    observateur.observe(repere);
  }
})();
