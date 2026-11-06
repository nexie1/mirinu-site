// Profil public de Mirinu, en lecture seule (https://mirinu.ch/p/#<id>).
// L'identifiant est lu dans le fragment, jamais envoyé à ce site ; le profil
// vient du relais (GET /profile/<id>, proxy/profile.js du dépôt de l'app),
// qui l'a déjà vérifié champ par champ. Tout texte venu du profil passe par
// textContent, jamais par du HTML. Aucun traqueur, aucun cookie.
(function () {
  'use strict';

  var API = 'https://api.mirinu.ch/profile/';
  var IMG = 'https://image.tmdb.org/t/p/w185';
  // L'identifiant dérive du jeton (22 caractères base64url, proxy/profile.js).
  var ID = /^[A-Za-z0-9_-]{22}$/;
  // Un chemin d'affiche de TMDB, rien d'autre : l'adresse de l'image est
  // toujours construite ici, jamais reprise du profil.
  var POSTER = /^\/[A-Za-z0-9_-]{1,64}\.(?:jpg|png|webp)$/;
  var TYPES = ['series', 'movie', 'anime', 'manga', 'novel', 'comic', 'book'];
  var READING = { manga: 1, novel: 1, comic: 1, book: 1 };
  var STATUSES = ['watching', 'completed', 'planned', 'dropped'];
  // Au-delà, une section montre les premiers titres et un bouton pour le reste.
  var FIRST = 60;

  var T = {
    fr: {
      notice: 'Profil créé par une personne qui utilise Mirinu. Mirinu n’en vérifie pas le contenu.',
      skip: 'Aller au contenu', openApp: "Ouvrir l'app", loading: 'Chargement du profil…',
      fallbackName: 'Profil Mirinu', readOnly: 'Profil en lecture seule', updated: 'mis à jour le {d}',
      gone: "Ce profil n'est plus partagé.",
      goneHint: "La personne qui l'avait partagé a arrêté le partage, ou le lien est incomplet.",
      error: 'Le profil ne se charge pas pour l’instant.', retry: 'Réessayer',
      busy: 'Trop de demandes en peu de temps. Réessaie dans une minute.',
      all: 'Tout', empty: 'Rien à montrer pour l’instant.',
      types: { series: 'Séries', movie: 'Films', anime: 'Animés', manga: 'Mangas', novel: 'Light novels', comic: 'BD', book: 'Romans' },
      status: { watching: 'En cours', completed: 'Terminé', planned: 'Prévu', dropped: 'Abandonné' },
      statusRead: {},
      titles: ['titre', 'titres'], episodes: ['épisode vu', 'épisodes vus'], movies: ['film vu', 'films vus'],
      chapters: ['chapitre lu', 'chapitres lus'],
      fav: 'Favori', rating: 'Note : {r} sur 10', more: 'Afficher les {n} titres',
      report: 'Signaler ce profil', reportSubject: 'Signaler un profil public',
      reportBody: 'Le profil signalé : {link}\n\nCe qui ne va pas :\n',
      madeWith: 'Créé avec Mirinu', privacy: 'Confidentialité', privacyUrl: '/confidentialite/',
      tmdb: 'Mirinu utilise TMDB et ses API sans être approuvé ni certifié par TMDB.',
    },
    en: {
      notice: 'Profile created by someone who uses Mirinu. Mirinu does not check its content.',
      skip: 'Skip to content', openApp: 'Open the app', loading: 'Loading the profile…',
      fallbackName: 'Mirinu profile', readOnly: 'Read-only profile', updated: 'updated {d}',
      gone: 'This profile is no longer shared.',
      goneHint: 'The person who shared it stopped sharing, or the link is incomplete.',
      error: 'The profile isn’t loading right now.', retry: 'Try again',
      busy: 'Too many requests in a short time. Try again in a minute.',
      all: 'All', empty: 'Nothing to show yet.',
      types: { series: 'Shows', movie: 'Movies', anime: 'Anime', manga: 'Manga', novel: 'Light novels', comic: 'Comics', book: 'Novels' },
      status: { watching: 'Watching', completed: 'Completed', planned: 'Plan to watch', dropped: 'Dropped' },
      statusRead: { watching: 'Reading', planned: 'Plan to read' },
      titles: ['title', 'titles'], episodes: ['episode watched', 'episodes watched'], movies: ['movie watched', 'movies watched'],
      chapters: ['chapter read', 'chapters read'],
      fav: 'Favorite', rating: 'Rating: {r} out of 10', more: 'Show all {n} titles',
      report: 'Report this profile', reportSubject: 'Report a public profile',
      reportBody: 'The reported profile: {link}\n\nWhat is wrong:\n',
      madeWith: 'Made with Mirinu', privacy: 'Privacy', privacyUrl: '/en/privacy/',
      tmdb: '',
    },
    de: {
      notice: 'Profil erstellt von einer Person, die Mirinu nutzt. Mirinu prüft den Inhalt nicht.',
      skip: 'Zum Inhalt', openApp: 'App öffnen', loading: 'Profil wird geladen…',
      fallbackName: 'Mirinu-Profil', readOnly: 'Profil nur zum Lesen', updated: 'aktualisiert am {d}',
      gone: 'Dieses Profil wird nicht mehr geteilt.',
      goneHint: 'Die Person, die es geteilt hat, hat das Teilen beendet, oder der Link ist unvollständig.',
      error: 'Das Profil lädt gerade nicht.', retry: 'Erneut versuchen',
      busy: 'Zu viele Anfragen in kurzer Zeit. Versuche es in einer Minute erneut.',
      all: 'Alle', empty: 'Noch nichts zu zeigen.',
      types: { series: 'Serien', movie: 'Filme', anime: 'Animes', manga: 'Mangas', novel: 'Light Novels', comic: 'Comics', book: 'Romane' },
      status: { watching: 'Am Schauen', completed: 'Abgeschlossen', planned: 'Geplant', dropped: 'Abgebrochen' },
      statusRead: { watching: 'Am Lesen' },
      titles: ['Titel', 'Titel'], episodes: ['Folge gesehen', 'Folgen gesehen'], movies: ['Film gesehen', 'Filme gesehen'],
      chapters: ['Kapitel gelesen', 'Kapitel gelesen'],
      fav: 'Favorit', rating: 'Bewertung: {r} von 10', more: 'Alle {n} Titel zeigen',
      report: 'Dieses Profil melden', reportSubject: 'Ein öffentliches Profil melden',
      reportBody: 'Das gemeldete Profil: {link}\n\nWas nicht stimmt:\n',
      madeWith: 'Erstellt mit Mirinu', privacy: 'Datenschutz', privacyUrl: '/de/datenschutz/',
      tmdb: 'Mirinu nutzt TMDB und seine APIs, ohne von TMDB unterstützt oder zertifiziert zu sein.',
    },
    it: {
      notice: 'Profilo creato da una persona che usa Mirinu. Mirinu non ne verifica il contenuto.',
      skip: 'Vai al contenuto', openApp: "Apri l'app", loading: 'Caricamento del profilo…',
      fallbackName: 'Profilo Mirinu', readOnly: 'Profilo in sola lettura', updated: 'aggiornato {d}',
      gone: 'Questo profilo non è più condiviso.',
      goneHint: "La persona che l'aveva condiviso ha interrotto la condivisione, oppure il link è incompleto.",
      error: 'Il profilo non si carica per ora.', retry: 'Riprova',
      busy: 'Troppe richieste in poco tempo. Riprova tra un minuto.',
      all: 'Tutto', empty: 'Ancora niente da mostrare.',
      types: { series: 'Serie', movie: 'Film', anime: 'Anime', manga: 'Manga', novel: 'Light novel', comic: 'Fumetti', book: 'Romanzi' },
      status: { watching: 'In corso', completed: 'Completato', planned: 'In programma', dropped: 'Abbandonato' },
      statusRead: {},
      titles: ['titolo', 'titoli'], episodes: ['episodio visto', 'episodi visti'], movies: ['film visto', 'film visti'],
      chapters: ['capitolo letto', 'capitoli letti'],
      fav: 'Preferito', rating: 'Voto: {r} su 10', more: 'Mostra tutti i {n} titoli',
      report: 'Segnala questo profilo', reportSubject: 'Segnalare un profilo pubblico',
      reportBody: 'Il profilo segnalato: {link}\n\nCosa non va:\n',
      madeWith: 'Creato con Mirinu', privacy: 'Privacy', privacyUrl: '/it/privacy/',
      tmdb: 'Mirinu usa TMDB e le sue API senza essere approvato né certificato da TMDB.',
    },
    es: {
      notice: 'Perfil creado por una persona que usa Mirinu. Mirinu no verifica su contenido.',
      skip: 'Ir al contenido', openApp: 'Abrir la app', loading: 'Cargando el perfil…',
      fallbackName: 'Perfil de Mirinu', readOnly: 'Perfil de solo lectura', updated: 'actualizado el {d}',
      gone: 'Este perfil ya no se comparte.',
      goneHint: 'La persona que lo compartió dejó de compartirlo, o el enlace está incompleto.',
      error: 'El perfil no carga por ahora.', retry: 'Reintentar',
      busy: 'Demasiadas solicitudes en poco tiempo. Vuelve a intentarlo en un minuto.',
      all: 'Todo', empty: 'Aún no hay nada que mostrar.',
      types: { series: 'Series', movie: 'Películas', anime: 'Animes', manga: 'Mangas', novel: 'Novelas ligeras', comic: 'Cómics', book: 'Novelas' },
      status: { watching: 'Viendo', completed: 'Completado', planned: 'Pendiente', dropped: 'Abandonado' },
      statusRead: { watching: 'Leyendo' },
      titles: ['título', 'títulos'], episodes: ['episodio visto', 'episodios vistos'], movies: ['película vista', 'películas vistas'],
      chapters: ['capítulo leído', 'capítulos leídos'],
      fav: 'Favorito', rating: 'Valoración: {r} sobre 10', more: 'Mostrar los {n} títulos',
      report: 'Denunciar este perfil', reportSubject: 'Denunciar un perfil público',
      reportBody: 'El perfil denunciado: {link}\n\nQué falla:\n',
      madeWith: 'Creado con Mirinu', privacy: 'Privacidad', privacyUrl: '/es/privacidad/',
      tmdb: 'Mirinu usa TMDB y sus API sin estar aprobado ni certificado por TMDB.',
    },
  };

  function pickLang() {
    var wanted = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']);
    for (var i = 0; i < wanted.length; i++) {
      var code = String(wanted[i] || '').slice(0, 2).toLowerCase();
      if (T[code]) return code;
    }
    return 'en';
  }

  var lang = pickLang();
  var t = T[lang];
  var nf = new Intl.NumberFormat(lang);
  var state = { profile: null, type: null, open: {} };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  function fill(s, vars) {
    return s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k]; });
  }

  function plural(pair, n) {
    return nf.format(n) + ' ' + (n === 1 ? pair[0] : pair[1]);
  }

  function statusLabel(st, type) {
    return (READING[type] && t.statusRead[st]) || t.status[st];
  }

  function translateChrome() {
    document.documentElement.lang = lang;
    var nodes = document.querySelectorAll('[data-t]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-t');
      if (t[key] === '') nodes[i].hidden = true;
      else if (t[key]) nodes[i].textContent = t[key];
    }
    document.getElementById('confidentialite').href = t.privacyUrl;
    var report = document.getElementById('signaler');
    report.href = 'mailto:contact@mirinu.ch?subject=' + encodeURIComponent(t.reportSubject) +
      '&body=' + encodeURIComponent(fill(t.reportBody, { link: location.href }));
  }

  function setHeader(name, sub) {
    document.getElementById('nom').textContent = name;
    document.getElementById('sous-titre').textContent = sub;
    document.title = name + ', Mirinu';
  }

  function message(lines, retry) {
    var box = document.getElementById('profil');
    box.textContent = '';
    for (var i = 0; i < lines.length; i++) box.appendChild(el('p', 'etat', lines[i]));
    if (retry) {
      var b = el('button', 'bouton-plein', t.retry);
      b.type = 'button';
      b.addEventListener('click', load);
      box.appendChild(b);
    }
  }

  function heart() {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M12 21s-7.5-4.6-10-9.3C.4 8.6 2.2 4.5 6 4.5c2.2 0 3.6 1.2 4.4 2.6h3.2C14.4 5.7 15.8 4.5 18 4.5c3.8 0 5.6 4.1 4 7.2C19.5 16.4 12 21 12 21z');
    svg.appendChild(path);
    return svg;
  }

  function card(it) {
    var li = el('li', 'titre');
    var box = el('div', 'affiche');
    if (it.p && POSTER.test(it.p)) {
      var img = el('img');
      img.src = IMG + it.p;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.width = 185;
      img.height = 278;
      box.appendChild(img);
    } else {
      box.appendChild(el('div', 'vide', it.n));
    }
    var badges = el('div', 'badges');
    var left = el('span');
    var right = el('span');
    if (it.f) {
      var f = el('span', 'badge');
      f.appendChild(heart());
      f.appendChild(el('span', null, t.fav));
      left.appendChild(f);
    }
    if (typeof it.r === 'number') {
      var r = el('span', 'badge', nf.format(it.r));
      r.setAttribute('aria-label', fill(t.rating, { r: nf.format(it.r) }));
      r.title = fill(t.rating, { r: nf.format(it.r) });
      right.appendChild(r);
    }
    badges.appendChild(left);
    badges.appendChild(right);
    box.appendChild(badges);
    li.appendChild(box);
    li.appendChild(el('p', 'nom', it.n));
    var meta = [];
    if (it.y) meta.push(String(it.y));
    if (!state.type) meta.push(t.types[it.t]);
    li.appendChild(el('p', 'annee', meta.join(' · ')));
    return li;
  }

  function sortItems(list) {
    var coll = new Intl.Collator(lang, { sensitivity: 'base', numeric: true });
    return list.slice().sort(function (a, b) {
      if (!!b.f !== !!a.f) return b.f ? 1 : -1;
      var ra = typeof a.r === 'number' ? a.r : -1;
      var rb = typeof b.r === 'number' ? b.r : -1;
      if (ra !== rb) return rb - ra;
      return coll.compare(a.n, b.n);
    });
  }

  function render() {
    var p = state.profile;
    var box = document.getElementById('profil');
    box.textContent = '';
    var items = Array.isArray(p.items) ? p.items.filter(function (it) {
      return it && typeof it.n === 'string' && TYPES.indexOf(it.t) >= 0 && STATUSES.indexOf(it.s) >= 0;
    }) : [];
    var stats = p.stats || {};

    // Chiffres
    var nums = el('ul', 'chiffres');
    function num(n, pair) {
      if (!n) return;
      var li = el('li');
      li.appendChild(el('strong', null, nf.format(n)));
      li.appendChild(el('span', null, n === 1 ? pair[0] : pair[1]));
      nums.appendChild(li);
    }
    num(items.length, t.titles);
    num(stats.episodes, t.episodes);
    num(stats.movies, t.movies);
    num(stats.chapters, t.chapters);
    if (nums.childNodes.length) box.appendChild(nums);

    if (!items.length) {
      box.appendChild(el('p', 'etat', t.empty));
      return;
    }

    // Types présents : un bouton chacun (et « Tout » s'il y en a plusieurs).
    var present = TYPES.filter(function (ty) {
      return items.some(function (it) { return it.t === ty; });
    });
    if (state.type && present.indexOf(state.type) < 0) state.type = null;
    if (present.length > 1) {
      var tabs = el('div', 'onglets');
      var choices = [null].concat(present);
      choices.forEach(function (ty) {
        var b = el('button', null, ty ? t.types[ty] : t.all);
        b.type = 'button';
        var count = ty ? items.filter(function (it) { return it.t === ty; }).length : items.length;
        b.appendChild(el('span', 'n', nf.format(count)));
        b.setAttribute('aria-pressed', String(state.type === ty));
        b.addEventListener('click', function () {
          state.type = ty;
          state.open = {};
          render();
        });
        tabs.appendChild(b);
      });
      box.appendChild(tabs);
    }

    var shown = state.type ? items.filter(function (it) { return it.t === state.type; }) : items;
    STATUSES.forEach(function (st) {
      var list = sortItems(shown.filter(function (it) { return it.s === st; }));
      if (!list.length) return;
      var sec = el('section', 'statut');
      var h = el('h2', null, statusLabel(st, state.type || ''));
      h.appendChild(el('span', 'n', nf.format(list.length)));
      sec.appendChild(h);
      var grid = el('ul', 'grille');
      var all = state.open[st] || list.length <= FIRST;
      var limit = all ? list.length : FIRST;
      for (var i = 0; i < limit; i++) grid.appendChild(card(list[i]));
      sec.appendChild(grid);
      if (!all) {
        var more = el('button', 'plus', fill(t.more, { n: nf.format(list.length) }));
        more.type = 'button';
        more.addEventListener('click', function () {
          state.open[st] = true;
          render();
        });
        sec.appendChild(more);
      }
      box.appendChild(sec);
    });
  }

  function updatedText(day) {
    if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return t.readOnly;
    var d = new Date(day + 'T00:00:00Z');
    var f = new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' }).format(d);
    return t.readOnly + ', ' + fill(t.updated, { d: f });
  }

  function load() {
    // Le fragment brut : base64url seulement (22 à 43 caractères), sinon
    // l'écran « plus partagé », sans rien demander au relais.
    var id = (location.hash || '').replace(/^#/, '');
    state.profile = null;
    state.type = null;
    state.open = {};
    document.getElementById('avis').hidden = true;
    if (!ID.test(id)) {
      setHeader(t.fallbackName, '');
      message([t.gone, t.goneHint]);
      return;
    }
    setHeader(t.fallbackName, t.loading);
    document.getElementById('profil').textContent = '';
    fetch(API + id, { headers: { Accept: 'application/json' }, credentials: 'omit', referrerPolicy: 'no-referrer' })
      .then(function (res) {
        if (res.status === 404) return { gone: true };
        if (res.status === 429) return { busy: true };
        if (!res.ok) throw new Error('statut ' + res.status);
        return res.json();
      })
      .then(function (p) {
        if (p.gone) {
          setHeader(t.fallbackName, '');
          message([t.gone, t.goneHint]);
          return;
        }
        if (p.busy) {
          setHeader(t.fallbackName, '');
          message([t.busy], true);
          return;
        }
        if (!p || p.v !== 1) throw new Error('forme');
        state.profile = p;
        var name = typeof p.name === 'string' && p.name.trim() ? p.name.trim() : t.fallbackName;
        setHeader(name, updatedText(p.updated));
        document.getElementById('avis').hidden = false;
        render();
      })
      .catch(function () {
        setHeader(t.fallbackName, '');
        message([t.error], true);
      });
  }

  function start() {
    translateChrome();
    load();
    window.addEventListener('hashchange', function () {
      translateChrome();
      load();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
