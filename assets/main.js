/* ============================================================
   Leonid Gremyachikh — site behaviour
   theme toggle · animated accordions · scroll reveal · nav state
   ============================================================ */
(function () {
  'use strict';

  var root   = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- theme ---------- */
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      if (!current) {
        // No explicit choice yet — flip away from whatever the system gives us.
        current = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  /* ---------- accordions ----------
     <details> keeps the semantics and works without JS; here we animate the
     open/close so the page does not jump, and keep only one row open at a
     time. Every animation gets a timer as well as a transitionend listener,
     because a transition that never starts must not leave a row half-open. */
  var DUR  = 380;
  var EASE = 'height ' + DUR + 'ms cubic-bezier(.22,.61,.36,1)';
  var rows = [];

  document.querySelectorAll('.item').forEach(function (item) {
    var summary = item.querySelector('summary');
    var body    = item.querySelector('.item-body');
    if (!summary || !body) return;

    var timer = null, settle = null;
    body.style.height = item.open ? 'auto' : '0px';

    function finish(opening) {
      if (timer)  { clearTimeout(timer); timer = null; }
      if (settle) { body.removeEventListener('transitionend', settle); settle = null; }
      body.style.transition = '';
      item.open = opening;
      body.style.height = opening ? 'auto' : '0px';
    }

    function run(opening, to) {
      if (timer)  { clearTimeout(timer); timer = null; }
      if (settle) { body.removeEventListener('transitionend', settle); settle = null; }

      var from = body.offsetHeight;
      body.style.transition = '';
      body.style.height = from + 'px';
      void body.offsetHeight;                    // flush the starting height
      body.style.transition = EASE;
      body.style.height = to + 'px';

      settle = function (e) {
        if (e.propertyName !== 'height' || e.target !== body) return;
        finish(opening);
      };
      body.addEventListener('transitionend', settle);
      timer = setTimeout(function () { finish(opening); }, DUR + 120);
    }

    var row = {
      item: item,
      isOpen: function () { return item.open; },
      close: function () {
        if (!item.open) return;
        if (reduce) { finish(false); return; }
        run(false, 0);
      }
    };
    rows.push(row);

    summary.addEventListener('click', function (e) {
      e.preventDefault();

      if (item.open) {
        if (reduce) { finish(false); } else { run(false, 0); }
        return;
      }

      // only one row stays open at a time
      rows.forEach(function (other) { if (other !== row) other.close(); });

      if (reduce) { finish(true); return; }
      item.open = true;
      run(true, body.firstElementChild.offsetHeight);
    });
  });

  /* ---------- activity heatmaps ----------
     Each .gh[data-src] reads a JSON snapshot:
       { start, counts[], total?, streak?, since? }
     and stays hidden if the file is missing, so nothing renders half-empty. */
  (function () {
    var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // on phones a full year does not fit, so show the last 13 weeks instead
    var narrow = window.matchMedia('(max-width: 760px)');
    var DAY = 86400000, SHORT = 13 * 7;
    var boxes = [];

    document.querySelectorAll('.gh[data-src]').forEach(function (box) {
      fetch(box.getAttribute('data-src'), { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (d) { boxes.push([box, d]); render(box, d); })
        .catch(function () { /* leave the block hidden */ });
    });

    var label = document.querySelector('#activity .label');
    function relabel() {
      if (label) label.textContent = '06 \u2014 Activity \u00b7 ' +
        (narrow.matches ? 'past 3 months' : 'past year');
    }
    relabel();
    function onChange() {
      relabel();
      boxes.forEach(function (b) { render(b[0], b[1]); });
    }
    if (narrow.addEventListener) narrow.addEventListener('change', onChange);
    else if (narrow.addListener) narrow.addListener(onChange);

    function render(box, d) {
      var all = d.counts || [];
      if (!all.length) return;
      var unit = box.getAttribute('data-unit') || 'actions';
      var full = !narrow.matches;

      // the short window starts on a Sunday so its first column is whole
      var start = new Date(d.start + 'T00:00:00Z');
      var counts = all;
      if (!full && all.length > SHORT) {
        var end = new Date(start.getTime() + (all.length - 1) * DAY);
        var from = all.length - (SHORT - 7 + end.getUTCDay() + 1);
        if (from < 0) from = 0;
        counts = all.slice(from);
        start = new Date(start.getTime() + from * DAY);
      }

      // levels by quartiles of active days, like GitHub — one busy day
      // should not wash every other day out to the palest shade
      var act = counts.filter(Boolean).sort(function (a, b) { return a - b; });
      function q(p) { return act.length ? act[Math.min(act.length - 1, Math.floor(p * act.length))] : 0; }
      var q1 = q(.25), q2 = q(.5), q3 = q(.75);
      function level(n) { return !n ? 0 : n <= q1 ? 1 : n <= q2 ? 2 : n <= q3 ? 3 : 4; }

      var grid   = box.querySelector('.gh-grid');
      var months = box.querySelector('.gh-months');   // only the first map carries labels
      var lead   = start.getUTCDay();             // Sunday-first columns
      var frag   = document.createDocumentFragment();
      grid.textContent = '';
      if (months) months.textContent = '';

      for (var p = 0; p < lead; p++) {
        var pad = document.createElement('i');
        pad.style.visibility = 'hidden';
        frag.appendChild(pad);
      }
      var lastMonth = -1, labels = [];
      counts.forEach(function (n, i) {
        var day = new Date(start.getTime() + i * DAY);
        var col = Math.floor((i + lead) / 7);
        if (day.getUTCDate() <= 7 && day.getUTCDay() === 0 && day.getUTCMonth() !== lastMonth) {
          lastMonth = day.getUTCMonth();
          labels.push([col, MONTHS[lastMonth]]);
        }
        var cell = document.createElement('i');
        cell.setAttribute('data-l', level(n));
        cell.title = n + ' ' + (n === 1 ? unit.replace(/s$/, '') : unit) +
                     ' on ' + day.toISOString().slice(0, 10);
        frag.appendChild(cell);
      });
      grid.appendChild(frag);

      if (months) {
        labels.forEach(function (l) {
          var s = document.createElement('span');
          s.style.gridColumn = String(l[0] + 1);
          s.textContent = l[1];
          months.appendChild(s);
        });
      }

      var sum = counts.reduce(function (a, b) { return a + b; }, 0);
      var total = full && d.total != null ? d.total : sum;
      var streak = full ? d.streak : 0;
      if (!full) {
        for (var k = 0, run = 0; k < counts.length; k++) {
          run = counts[k] ? run + 1 : 0;
          if (run > streak) streak = run;
        }
      }
      var bits = ['<b>' + total.toLocaleString('en-US') + '</b> ' + unit,
                  '<b>' + act.length + '</b> active days'];
      if (streak) bits.push('longest streak <b>' + streak + '</b>');
      var head = box.querySelector('.gh-total');
      var stats = head.querySelector('.gh-stats');
      if (!stats) { stats = document.createElement('span'); stats.className = 'gh-stats'; head.appendChild(stats); }
      stats.innerHTML = bits.map(function (s) { return '<span class="gh-sep">\u00b7</span>' + s; }).join('');

      box.hidden = false;
      var sec = box.closest('.reveal');
      if (sec) sec.classList.add('is-in');
    }
  })();

  /* ---------- reveal on scroll ---------- */
  var revealables = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- current section in the nav ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  var targets  = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if (targets.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    targets.forEach(function (t) { spy.observe(t); });
  }

  /* ---------- hairline under the sticky bar once scrolled ---------- */
  var topbar = document.getElementById('topbar');
  if (topbar) {
    var onScroll = function () {
      topbar.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
