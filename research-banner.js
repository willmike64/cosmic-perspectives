/* Cosmic Perspectives: "Latest peer-reviewed research" banner.
   Reads research.json, fills [data-research-banner], and adds a per-section
   "New research on this topic" link. No dependencies. */
(function () {
  'use strict';
  var LIB = 'research.html';
  var DATA = 'research.json?v=2';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var CSS = [
    '.rb{position:relative;border-block:1px solid var(--color-border,#243050);background:linear-gradient(90deg,rgba(212,170,90,.09),rgba(126,184,212,.05) 55%,rgba(155,121,200,.06));font-family:var(--font-body,system-ui,sans-serif)}',
    '.rb[hidden]{display:none}',
    '.rb__in{max-width:var(--content-wide,1160px);margin-inline:auto;padding:clamp(1rem,2.2vw,1.5rem) clamp(1rem,4vw,3rem);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:clamp(1rem,3vw,2.5rem);align-items:center}',
    '.rb__eyebrow{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem .75rem;margin:0 0 .55rem;font-family:var(--font-mono,monospace);font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--color-accent,#d4aa5a)}',
    '.rb__pulse{width:7px;height:7px;border-radius:50%;background:var(--color-accent,#d4aa5a);box-shadow:0 0 0 0 rgba(212,170,90,.6);animation:rbPulse 2.4s ease-out infinite}',
    '@keyframes rbPulse{0%{box-shadow:0 0 0 0 rgba(212,170,90,.55)}70%,100%{box-shadow:0 0 0 9px rgba(212,170,90,0)}}',
    '.rb__upd{color:var(--color-text-muted,#7d8aaa);letter-spacing:.1em}',
    '.rb__stage{display:grid;align-items:start}',
    '.rb__item{grid-area:1/1;opacity:0;visibility:hidden;transform:translateY(6px);transition:opacity .5s ease,transform .5s ease,visibility 0s linear .5s}',
    '.rb__item.is-on{opacity:1;visibility:visible;transform:none;transition:opacity .5s ease,transform .5s ease,visibility 0s}',
    '.rb__meta{margin:0 0 .3rem;font-size:.82rem;color:var(--color-text-muted,#7d8aaa);display:flex;flex-wrap:wrap;gap:.15rem .6rem;align-items:center}',
    '.rb__topic{color:var(--color-primary,#7eb8d4);font-weight:600}',
    '.rb__sep{opacity:.5}',
    '.rb__head{margin:0;font-family:var(--font-display,Georgia,serif);font-weight:400;font-size:clamp(1.2rem,1rem + 1vw,1.75rem);line-height:1.22;letter-spacing:-.005em;text-wrap:balance}',
    '.rb__head a{color:#f0f4ff;text-decoration:none;background:linear-gradient(currentColor,currentColor) 0 100%/0 1px no-repeat;transition:background-size .35s ease,color .2s ease}',
    '.rb__head a:hover,.rb__head a:focus-visible{color:var(--color-accent-hover,#e8c87a);background-size:100% 1px}',
    '.rb__side{display:flex;flex-direction:column;align-items:flex-end;gap:.7rem}',
    '.rb__cta{display:inline-flex;align-items:center;gap:.5rem;font:600 .95rem var(--font-body,system-ui,sans-serif);padding:.72rem 1.2rem;border-radius:999px;background:var(--color-accent,#d4aa5a);color:#111;text-decoration:none;white-space:nowrap;transition:background .2s ease,transform .2s ease}',
    '.rb__cta:hover{background:var(--color-accent-hover,#e8c87a);color:#111}',
    '.rb__cta:active{transform:translateY(1px)}',
    '.rb__cta svg{transition:transform .2s ease}.rb__cta:hover svg{transform:translateX(3px)}',
    '.rb__ctl{display:flex;align-items:center;gap:.35rem;font-family:var(--font-mono,monospace);font-size:.74rem;color:var(--color-text-muted,#7d8aaa)}',
    '.rb__btn{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;margin:-6px -4px;border-radius:50%;color:var(--color-text-muted,#7d8aaa);background:none;border:0;cursor:pointer;transition:color .2s ease,background .2s ease}',
    '.rb__btn:hover{color:var(--color-accent,#d4aa5a);background:rgba(212,170,90,.1)}',
    '.rb__count{min-width:3.4em;text-align:center;font-variant-numeric:tabular-nums}',
    '@media(max-width:760px){.rb__in{grid-template-columns:1fr}.rb__side{flex-direction:row;align-items:center;justify-content:space-between;flex-wrap:wrap}}',
    '@media(prefers-reduced-motion:reduce){.rb__pulse{animation:none}.rb__item{transition:none;transform:none}}',
    '.rb-more{display:inline-flex;align-items:center;gap:.45rem;margin:.2rem 0 1.3rem;padding:.4rem .85rem;border:1px solid rgba(212,170,90,.35);border-radius:999px;font:500 .82rem var(--font-body,system-ui,sans-serif);color:var(--color-accent,#d4aa5a);text-decoration:none;background:rgba(212,170,90,.06);transition:background .2s ease,border-color .2s ease,color .2s ease}',
    '.rb-more:hover{background:rgba(212,170,90,.14);border-color:var(--color-accent,#d4aa5a);color:var(--color-accent-hover,#e8c87a)}',
    '.rb-more::after{content:none!important}',
    '.header-nav a.nav-lib,.toc__list a.toc-lib{color:var(--color-accent,#d4aa5a)}',
    '@media(min-width:1101px){.header-nav a.nav-lib{display:none}}'
  ].join('');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function niceDate(iso) {
    var m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(iso || '');
    if (!m) return '';
    return MONTHS[+m[2] - 1] + (m[3] ? ' ' + (+m[3]) : '') + ', ' + m[1];
  }
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function pick(papers, n) {
    // Newest paper from each topic first, so the banner spans the site; then fill by date.
    var sorted = papers.slice().sort(function (a, b) { return a.published < b.published ? 1 : -1; });
    var seen = {}, lead = [], rest = [];
    sorted.forEach(function (p) { if (!seen[p.section]) { seen[p.section] = 1; lead.push(p); } else rest.push(p); });
    return lead.concat(rest).slice(0, n).sort(function (a, b) { return a.published < b.published ? 1 : -1; });
  }

  function build(host, data) {
    var topics = {};
    (data.topics || []).forEach(function (t) { topics[t.id] = t; });
    var items = pick(data.papers || [], 8);
    if (!items.length) return;

    var html = '<div class="rb__in"><div class="rb__main">' +
      '<p class="rb__eyebrow"><span class="rb__pulse" aria-hidden="true"></span><span>Latest peer-reviewed research</span>' +
      '<span class="rb__upd">Updated ' + esc(niceDate(data.updated)) + '</span></p>' +
      '<div class="rb__stage" aria-live="off">';
    items.forEach(function (p, i) {
      var t = topics[p.section] || { short: p.section };
      html += '<div class="rb__item' + (i === 0 ? ' is-on' : '') + '" data-i="' + i + '"' + (i === 0 ? '' : ' aria-hidden="true"') + '>' +
        '<p class="rb__meta"><span class="rb__topic">' + esc(t.short || t.name) + '</span><span class="rb__sep" aria-hidden="true">·</span>' +
        '<span>' + esc(p.journal) + '</span><span class="rb__sep" aria-hidden="true">·</span><span>' + esc(niceDate(p.published)) + '</span></p>' +
        '<p class="rb__head"><a href="' + LIB + '#p-' + esc(p.id) + '"' + (i === 0 ? '' : ' tabindex="-1"') + '>' + esc(p.headline || p.title) + '</a></p></div>';
    });
    html += '</div></div><div class="rb__side">' +
      '<a class="rb__cta" href="' + LIB + '">Open the Research Library <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>' +
      '<div class="rb__ctl">' +
      '<button type="button" class="rb__btn" data-rb="prev" aria-label="Previous paper"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>' +
      '<span class="rb__count" data-rb="count">1 / ' + items.length + '</span>' +
      '<button type="button" class="rb__btn" data-rb="next" aria-label="Next paper"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>' +
      '<button type="button" class="rb__btn" data-rb="pause" aria-label="Pause rotation" aria-pressed="false"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path data-rb="icon" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg></button>' +
      '</div></div></div>';

    host.className = 'rb';
    host.setAttribute('role', 'region');
    host.setAttribute('aria-label', 'Latest peer-reviewed research');
    host.innerHTML = html;
    host.hidden = false;

    var els = host.querySelectorAll('.rb__item');
    var count = host.querySelector('[data-rb="count"]');
    var pauseBtn = host.querySelector('[data-rb="pause"]');
    var icon = host.querySelector('[data-rb="icon"]');
    var stage = host.querySelector('.rb__stage');
    var cur = 0, timer = null, hover = false;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var paused = reduce;

    function show(i) {
      cur = (i + els.length) % els.length;
      for (var k = 0; k < els.length; k++) {
        var on = k === cur;
        els[k].classList.toggle('is-on', on);
        if (on) els[k].removeAttribute('aria-hidden'); else els[k].setAttribute('aria-hidden', 'true');
        var a = els[k].querySelector('a');
        if (on) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1');
      }
      count.textContent = (cur + 1) + ' / ' + els.length;
    }
    function tick() {
      clearTimeout(timer);
      if (paused || hover || document.hidden) return;
      timer = setTimeout(function () { show(cur + 1); tick(); }, 7000);
    }
    function setPaused(p) {
      paused = p;
      pauseBtn.setAttribute('aria-pressed', String(p));
      pauseBtn.setAttribute('aria-label', p ? 'Resume rotation' : 'Pause rotation');
      icon.setAttribute('d', p ? 'M8 5v14l11-7z' : 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z');
      tick();
    }
    host.querySelector('[data-rb="prev"]').addEventListener('click', function () { stage.setAttribute('aria-live', 'polite'); show(cur - 1); tick(); });
    host.querySelector('[data-rb="next"]').addEventListener('click', function () { stage.setAttribute('aria-live', 'polite'); show(cur + 1); tick(); });
    pauseBtn.addEventListener('click', function () { setPaused(!paused); });
    host.addEventListener('mouseenter', function () { hover = true; tick(); });
    host.addEventListener('mouseleave', function () { hover = false; tick(); });
    host.addEventListener('focusin', function () { hover = true; tick(); });
    host.addEventListener('focusout', function () { hover = false; tick(); });
    document.addEventListener('visibilitychange', tick);
    setPaused(paused);
  }

  function sectionLinks(data) {
    var counts = {};
    (data.papers || []).forEach(function (p) { counts[p.section] = (counts[p.section] || 0) + 1; });
    Object.keys(counts).forEach(function (id) {
      var sec = document.getElementById(id);
      if (!sec || !/\bsection\b/.test(sec.className) || sec.querySelector('.rb-more')) return;
      var h2 = sec.querySelector('h2');
      if (!h2) return;
      var a = document.createElement('a');
      a.className = 'rb-more';
      a.href = LIB + '?topic=' + encodeURIComponent(id);
      a.textContent = 'New peer-reviewed research on this topic (' + counts[id] + ') \u2192';
      var wrap = document.createElement('p');
      wrap.style.margin = '0';
      wrap.appendChild(a);
      h2.parentNode.insertBefore(wrap, h2.nextSibling);
    });
  }

  ready(function () {
    var host = document.querySelector('[data-research-banner]');
    if (host && host.classList.contains('rb')) return;
    if (!host) {
      var hero = document.querySelector('.hero');
      if (!hero) return;
      host = document.createElement('div');
      host.setAttribute('data-research-banner', '');
      host.hidden = true;
      hero.parentNode.insertBefore(host, hero.nextSibling);
    }
    if (!document.getElementById('rb-css')) {
      var st = document.createElement('style');
      st.id = 'rb-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    fetch(DATA, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('research.json ' + r.status); return r.json(); })
      .then(function (data) { build(host, data); sectionLinks(data); })
      .catch(function () { host.hidden = true; });
  });
})();
