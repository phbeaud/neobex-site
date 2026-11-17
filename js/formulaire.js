// Envoi de la demande de soumission.
// Regle absolue : une demande ne doit JAMAIS disparaitre en silence.
// Le formulaire part en HTML classique si ce script ne charge pas ; sinon on
// passe par fetch pour pouvoir verifier la reponse du service. Si l'envoi
// echoue, ou n'aboutit pas en 15 secondes, on affiche au visiteur une porte de
// sortie (telephone + courriel pre-rempli avec ce qu'il vient de saisir)
// plutot qu'une page figee qui perd la demande.
(function () {
  const form = document.querySelector('form[data-soumission]');
  if (!form) return;

  const en = document.documentElement.lang.indexOf('en') === 0;
  const T = en ? {
    envoi: 'Sending…',
    merci: '/en/thank-you',
    titre: 'Your request did not go through',
    corps: 'Nothing has been lost: your details are still on this page. Call us at <a href="tel:+15143121809">514 312-1809</a>, or send this request by email in one click — we answer within 24 to 48 hours.',
    bouton: 'Send it by email instead',
    objet: 'Quote request — Neobex',
    entete: 'Quote request sent from neobex.ca (the form could not go through).',
    champs: { firstname: 'First name', lastname: 'Last name', company: 'Company', email: 'Email', phone: 'Phone', category: 'Product type', volume: 'Estimated monthly volume', message: 'Message' }
  } : {
    envoi: 'Envoi en cours…',
    merci: '/merci',
    titre: 'Votre demande n’est pas partie',
    corps: 'Rien n’est perdu : vos informations sont toujours sur cette page. Appelez-nous au <a href="tel:+15143121809">514 312-1809</a>, ou envoyez cette demande par courriel en un clic — nous repondons en 24 a 48 heures.',
    bouton: 'L’envoyer par courriel',
    objet: 'Demande de soumission — Neobex',
    entete: 'Demande de soumission envoyee depuis neobex.ca (le formulaire n’a pas pu aboutir).',
    champs: { prenom: 'Prenom', nom: 'Nom', entreprise: 'Entreprise', email: 'Courriel', telephone: 'Telephone', categorie: 'Type de produits', volume: 'Volume mensuel estime', message: 'Message' }
  };

  const bouton = form.querySelector('button[type="submit"]');
  const libelle = bouton ? bouton.textContent : '';

  const panneau = document.createElement('div');
  panneau.className = 'form-echec';
  panneau.setAttribute('role', 'alert');
  panneau.hidden = true;
  form.insertAdjacentElement('afterend', panneau);

  // Reconstitue la demande en texte, pour le courriel de secours.
  const resume = () => {
    const donnees = new FormData(form);
    const lignes = [T.entete, ''];
    Object.keys(T.champs).forEach(nom => {
      const valeur = (donnees.get(nom) || '').toString().trim();
      if (valeur) lignes.push(T.champs[nom] + ' : ' + valeur);
    });
    return lignes.join('\n');
  };

  const echec = (raison) => {
    const lien = 'mailto:vente@neobexgroup.com'
      + '?subject=' + encodeURIComponent(T.objet)
      + '&body=' + encodeURIComponent(resume());
    panneau.innerHTML = '<h3>' + T.titre + '</h3><p>' + T.corps + '</p>'
      + '<a class="btn-hero-primary" href="' + lien + '">' + T.bouton + '</a>';
    panneau.hidden = false;
    panneau.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (bouton) { bouton.disabled = false; bouton.textContent = libelle; }
    // Remonte l'incident : une panne du service doit etre visible dans GA4.
    if (typeof gtag === 'function') {
      gtag('event', 'echec_envoi_soumission', { raison: raison });
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    panneau.hidden = true;
    if (bouton) { bouton.disabled = true; bouton.textContent = T.envoi; }

    const arret = new AbortController();
    let minuterie;
    // Le delai ne depend pas de fetch : meme si la requete ne se resout
    // jamais, la course est tranchee et le visiteur reprend la main.
    const delai = new Promise((_, rejeter) => {
      minuterie = setTimeout(() => {
        arret.abort();
        rejeter(new Error('delai-depasse'));
      }, 15000);
    });

    const envoi = fetch(form.action, { method: 'POST', body: new FormData(form), signal: arret.signal })
      .then(r => r.json().catch(() => ({})).then(data => ({ status: r.status, ok: r.ok, data })));

    Promise.race([envoi, delai])
      .then(({ ok, status, data }) => {
        if (ok && data && data.success) {
          window.location.href = T.merci;
        } else {
          echec('reponse-' + status);
        }
      })
      .catch(err => echec(err && err.message === 'delai-depasse' ? 'delai-depasse' : 'reseau'))
      .then(() => clearTimeout(minuterie));
  });
})();
